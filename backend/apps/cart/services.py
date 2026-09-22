from django.core.exceptions import ValidationError
from django.db import transaction

from apps.catalog.models import ProductVariant
from apps.inventory.models import InventoryItem

from .models import Cart, CartItem, Wishlist, WishlistItem


def get_or_create_cart(user):
    cart, _ = Cart.objects.get_or_create(user=user)
    return cart


def get_or_create_wishlist(user):
    wishlist, _ = Wishlist.objects.get_or_create(user=user)
    return wishlist


def validate_variant_for_cart(variant):
    product = variant.product

    if not variant.is_active:
        raise ValidationError("This product variant is no longer available.")

    if not product.is_active:
        raise ValidationError("This product is no longer available.")

    if product.status != product.Status.ACTIVE:
        raise ValidationError("This product is not currently available.")

    return variant


@transaction.atomic
def add_to_cart(user, variant_id, quantity):
    try:
        variant = (
            ProductVariant.objects
            .select_related("product")
            .select_for_update()
            .get(pk=variant_id)
        )
    except ProductVariant.DoesNotExist:
        raise ValidationError("Product variant does not exist.")

    validate_variant_for_cart(variant)

    cart = get_or_create_cart(user)

    item, created = CartItem.objects.get_or_create(
        cart=cart,
        variant=variant,
        defaults={"quantity": quantity},
    )

    if not created:
        new_quantity = item.quantity + quantity

        validate_cart_quantity(variant, new_quantity)

        item.quantity = new_quantity
        item.save(update_fields=["quantity", "updated_at"])

    else:
        validate_cart_quantity(variant, quantity)

    cart.save(update_fields=["updated_at"])

    return item


@transaction.atomic
def update_cart_item(user, item_id, quantity):
    try:
        item = (
            CartItem.objects
            .select_related("variant", "variant__product")
            .select_for_update()
            .get(
                pk=item_id,
                cart__user=user,
            )
        )
    except CartItem.DoesNotExist:
        raise ValidationError("Cart item does not exist.")

    validate_variant_for_cart(item.variant)
    validate_cart_quantity(item.variant, quantity)

    item.quantity = quantity
    item.save(update_fields=["quantity", "updated_at"])

    item.cart.save(update_fields=["updated_at"])

    return item


@transaction.atomic
def remove_from_cart(user, item_id):
    try:
        item = CartItem.objects.get(
            pk=item_id,
            cart__user=user,
        )
    except CartItem.DoesNotExist:
        raise ValidationError("Cart item does not exist.")

    cart = item.cart
    item.delete()

    cart.save(update_fields=["updated_at"])

    return cart


@transaction.atomic
def clear_cart(user):
    cart = get_or_create_cart(user)

    cart.items.all().delete()
    cart.save(update_fields=["updated_at"])

    return cart


def validate_cart_quantity(variant, quantity):
    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    product = variant.product

    if not product.has_physical_item:
        return

    available = (
        InventoryItem.objects
        .filter(
            variant=variant,
            is_active=True,
        )
        .select_related("variant")
    )

    total_available = sum(
        item.available_quantity
        for item in available
    )

    if quantity > total_available:
        raise ValidationError(
            f"Only {total_available} unit(s) are currently available."
        )


@transaction.atomic
def add_to_wishlist(user, variant_id):
    try:
        variant = (
            ProductVariant.objects
            .select_related("product")
            .get(pk=variant_id)
        )
    except ProductVariant.DoesNotExist:
        raise ValidationError("Product variant does not exist.")

    validate_variant_for_cart(variant)

    wishlist = get_or_create_wishlist(user)

    item, _ = WishlistItem.objects.get_or_create(
        wishlist=wishlist,
        variant=variant,
    )

    wishlist.save(update_fields=["updated_at"])

    return item


@transaction.atomic
def remove_from_wishlist(user, item_id):
    try:
        item = WishlistItem.objects.get(
            pk=item_id,
            wishlist__user=user,
        )
    except WishlistItem.DoesNotExist:
        raise ValidationError("Wishlist item does not exist.")

    wishlist = item.wishlist

    item.delete()

    wishlist.save(update_fields=["updated_at"])

    return wishlist