import uuid
from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.accounts.models import Address
from apps.cart.services import get_or_create_cart
from apps.inventory.models import InventoryItem
from apps.inventory.services import reserve_stock, release_stock

from .models import (
    Order,
    OrderItem,
    OrderItemInventoryAllocation,
    Payment,
)


def generate_order_number():
    return f"GBT-{timezone.now():%Y%m%d}-{uuid.uuid4().hex[:8].upper()}"


def generate_payment_reference():
    return f"GBT-PAY-{uuid.uuid4().hex.upper()}"


def get_shipping_address(user, address_id):
    try:
        return Address.objects.get(
            id=address_id,
            user=user,
            address_type=Address.AddressType.SHIPPING,
        )
    except Address.DoesNotExist:
        raise ValidationError(
            "The selected shipping address does not exist."
        )


'''def allocate_inventory_for_variant(variant, quantity, order_item):
    """
    Reserve physical inventory across active inventory locations.
    Creates an allocation record for every location used.
    """

    remaining = quantity

    inventory_items = (
        InventoryItem.objects
        .select_for_update()
        .filter(
            variant=variant,
            is_active=True,
        )
        .order_by("id")
    )

    for inventory_item in inventory_items:
        available = inventory_item.available_quantity

        if available <= 0:
            continue

        allocation_quantity = min(
            available,
            remaining,
        )

        reserve_stock(
            
            inventory_item_id=inventory_item.id,
            quantity=allocation_quantity,
            reference=order_item.order.order_number,
            notes=f"Checkout reservation for {order_item.sku}",
        )

        OrderItemInventoryAllocation.objects.create(
            order_item=order_item,
            inventory_item=inventory_item,
            quantity=allocation_quantity,
        )

        remaining -= allocation_quantity

        if remaining == 0:
            break

    if remaining > 0:
        raise ValidationError(
            f"Insufficient stock for {variant.sku}."
        )
'''

def allocate_inventory_for_variant(
    variant,
    quantity,
    order_item,
):
    """
    Reserve physical inventory across active inventory locations.

    Inventory is allocated across locations in ID order until the
    requested quantity has been completely reserved.

    Creates one OrderItemInventoryAllocation record for every
    inventory location used.
    """

    if quantity <= 0:
        raise ValidationError(
            "Quantity must be greater than zero."
        )

    remaining = quantity

    inventory_items = (
        InventoryItem.objects
        .select_for_update()
        .filter(
            variant=variant,
            is_active=True,
        )
        .order_by("id")
    )

    for inventory_item in inventory_items:
        if remaining <= 0:
            break

        available = inventory_item.available_quantity

        if available <= 0:
            continue

        allocation_quantity = min(
            available,
            remaining,
        )

        reserve_stock(
            inventory_item_id=inventory_item.id,
            quantity=allocation_quantity,
            reference=order_item.order.order_number,
            notes=(
                f"Checkout reservation for "
                f"{order_item.sku}"
            ),
        )

        OrderItemInventoryAllocation.objects.create(
            order_item=order_item,
            inventory_item=inventory_item,
            quantity=allocation_quantity,
        )

        remaining -= allocation_quantity

    if remaining > 0:
        raise ValidationError(
            f"Insufficient stock for {variant.sku}. "
            f"Requested: {quantity}, "
            f"allocated: {quantity - remaining}."
        )
        
    
@transaction.atomic
def create_checkout_order(
    user,
    shipping_address_id=None,
    customer_note="",
):
    cart = (
        get_or_create_cart(user)
    )

    cart_items = list(
        cart.items
        .select_related(
            "variant",
            "variant__product",
        )
        .all()
    )

    if not cart_items:
        raise ValidationError(
            "Your cart is empty."
        )

    physical_items = [
        item
        for item in cart_items
        if item.variant.product.has_physical_item
    ]

    shipping_address = None

    if physical_items:
        if not shipping_address_id:
            raise ValidationError(
                "A shipping address is required for physical products."
            )

        shipping_address = get_shipping_address(
            user,
            shipping_address_id,
        )

    subtotal = Decimal("0.00")

    for cart_item in cart_items:
        variant = cart_item.variant
        product = variant.product

        if not variant.is_active:
            raise ValidationError(
                f"{variant.sku} is no longer available."
            )

        if not product.is_active:
            raise ValidationError(
                f"{product.name} is no longer available."
            )

        if product.status != product.Status.ACTIVE:
            raise ValidationError(
                f"{product.name} is not currently available."
            )

        subtotal += (
            variant.price * cart_item.quantity
        )

    # Initial implementation.
    # Shipping/tax calculation will become a dedicated service.
    shipping_fee = Decimal("0.00")
    tax_amount = Decimal("0.00")
    discount_amount = Decimal("0.00")

    total_amount = (
        subtotal
        + shipping_fee
        + tax_amount
        - discount_amount
    )

    order = Order.objects.create(
        order_number=generate_order_number(),
        user=user,
        status=Order.Status.PENDING_PAYMENT,
        payment_status=Order.PaymentStatus.PENDING,
        currency="NGN",
        subtotal=subtotal,
        shipping_fee=shipping_fee,
        tax_amount=tax_amount,
        discount_amount=discount_amount,
        total_amount=total_amount,
        customer_note=customer_note,
    )

    if shipping_address:
        order.shipping_first_name = shipping_address.first_name
        order.shipping_last_name = shipping_address.last_name
        order.shipping_phone = shipping_address.phone_number
        order.shipping_address_line_1 = (
            shipping_address.address_line_1
        )
        order.shipping_address_line_2 = (
            shipping_address.address_line_2
        )
        order.shipping_city = shipping_address.city
        order.shipping_state = shipping_address.state
        order.shipping_country = shipping_address.country
        order.shipping_postal_code = (
            shipping_address.postal_code
        )

        order.save()

    for cart_item in cart_items:
        variant = cart_item.variant
        product = variant.product

        order_item = OrderItem.objects.create(
            order=order,
            variant=variant,
            product_name=product.name,
            variant_name=variant.name,
            sku=variant.sku,
            quantity=cart_item.quantity,
            unit_price=variant.price,
            line_total=(
                variant.price * cart_item.quantity
            ),
        )

        if product.has_physical_item:
            allocate_inventory_for_variant(
                variant=variant,
                quantity=cart_item.quantity,
                order_item=order_item,
            )

    payment = Payment.objects.create(
        order=order,
        provider="PAYSTACK",
        reference=generate_payment_reference(),
        status=Payment.Status.PENDING,
        amount=total_amount,
        currency="NGN",
    )

    cart.items.all().delete()
    cart.save(update_fields=["updated_at"])

    return order, payment


@transaction.atomic
def cancel_order(order, reason=""):
    order = (
        Order.objects
        .select_for_update()
        .get(pk=order.pk)
    )

    if order.status in [
        Order.Status.CANCELLED,
        Order.Status.REFUNDED,
    ]:
        return order

    for allocation in (
        order.items
        .prefetch_related(
            "inventory_allocations"
        )
        .all()
    ):
        for inventory_allocation in (
            allocation.inventory_allocations.all()
        ):
            inventory_item = (
                inventory_allocation.inventory_item
            )

            if inventory_allocation.quantity <= 0:
                continue

            release_stock(
                inventory_item_id=inventory_item.id,
                quantity=inventory_allocation.quantity,
                reference=order.order_number,
                notes=reason or "Order cancelled.",
            )

    order.status = Order.Status.CANCELLED
    order.payment_status = Order.PaymentStatus.PENDING
    order.cancelled_at = timezone.now()
    order.save(
        update_fields=[
            "status",
            "payment_status",
            "cancelled_at",
            "updated_at",
        ]
    )

    return order


@transaction.atomic
def mark_order_paid(order):
    order = (
        Order.objects
        .select_for_update()
        .get(pk=order.pk)
    )

    if order.payment_status == Order.PaymentStatus.PAID:
        return order

    order.payment_status = Order.PaymentStatus.PAID
    order.status = Order.Status.PAID
    order.paid_at = timezone.now()

    order.save(
        update_fields=[
            "payment_status",
            "status",
            "paid_at",
            "updated_at",
        ]
    )

    return order


@transaction.atomic
def finalize_order_inventory(order):
    """
    Finalize inventory after successful payment.

    Converts every reservation associated with the order
    into an actual STOCK_OUT.

    This operation is safe to call more than once because
    inventory allocation quantities are only finalized when
    the payment processing flow has not already completed.
    """

    from apps.inventory.services import finalize_reserved_stock

    order = (
        Order.objects
        .select_for_update()
        .prefetch_related(
            "items__inventory_allocations"
        )
        .get(pk=order.pk)
    )

    if order.status in [
        Order.Status.PROCESSING,
        Order.Status.SHIPPED,
        Order.Status.DELIVERED,
    ]:
        return order

    if order.payment_status != Order.PaymentStatus.PAID:
        raise ValidationError(
            "Cannot finalize inventory before payment succeeds."
        )

    for order_item in order.items.all():
        for allocation in order_item.inventory_allocations.all():
            finalize_reserved_stock(
                inventory_item_id=allocation.inventory_item_id,
                quantity=allocation.quantity,
                reference=order.order_number,
                notes=(
                    f"Stock deduction for paid order "
                    f"{order.order_number}."
                ),
            )

    order.status = Order.Status.PROCESSING

    order.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )

    return order