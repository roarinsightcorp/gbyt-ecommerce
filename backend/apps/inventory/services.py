'''from django.db import transaction
from django.core.exceptions import ValidationError

from .models import InventoryItem, InventoryMovement


@transaction.atomic
def receive_stock(
    inventory_item,
    quantity,
    performed_by=None,
    reference="",
    notes="",
):
    if quantity <= 0:
        raise ValidationError("Received quantity must be greater than zero.")

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item.pk)
    )

    inventory_item.quantity += quantity
    inventory_item.save(update_fields=["quantity", "updated_at"])

    movement = InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.STOCK_IN,
        quantity=quantity,
        performed_by=performed_by,
        reference=reference,
        notes=notes,
    )

    return inventory_item, movement


@transaction.atomic
def remove_stock(
    inventory_item,
    quantity,
    performed_by=None,
    reference="",
    notes="",
):
    if quantity <= 0:
        raise ValidationError("Removed quantity must be greater than zero.")

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item.pk)
    )

    if quantity > inventory_item.available_quantity:
        raise ValidationError(
            f"Insufficient available stock. "
            f"Available: {inventory_item.available_quantity}."
        )

    inventory_item.quantity -= quantity
    inventory_item.save(update_fields=["quantity", "updated_at"])

    movement = InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.STOCK_OUT,
        quantity=-quantity,
        performed_by=performed_by,
        reference=reference,
        notes=notes,
    )

    return inventory_item, movement


@transaction.atomic
def adjust_stock(
    inventory_item,
    new_quantity,
    performed_by=None,
    reference="",
    notes="",
):
    if new_quantity < 0:
        raise ValidationError(
            "Inventory quantity cannot be negative."
        )

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item.pk)
    )

    if inventory_item.reserved_quantity > new_quantity:
        raise ValidationError(
            "New quantity cannot be lower than reserved quantity."
        )

    difference = new_quantity - inventory_item.quantity

    inventory_item.quantity = new_quantity
    inventory_item.save(update_fields=["quantity", "updated_at"])

    movement = InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.ADJUSTMENT,
        quantity=difference,
        performed_by=performed_by,
        reference=reference,
        notes=notes,
    )

    return inventory_item, movement


@transaction.atomic
def reserve_stock(
    inventory_item,
    quantity,
    performed_by=None,
    reference="",
    notes="",
):
    if quantity <= 0:
        raise ValidationError(
            "Reserved quantity must be greater than zero."
        )

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item.pk)
    )

    if quantity > inventory_item.available_quantity:
        raise ValidationError(
            f"Insufficient available stock. "
            f"Available: {inventory_item.available_quantity}."
        )

    inventory_item.reserved_quantity += quantity

    inventory_item.save(
        update_fields=[
            "reserved_quantity",
            "updated_at",
        ]
    )

    movement = InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.RESERVATION,
        quantity=quantity,
        performed_by=performed_by,
        reference=reference,
        notes=notes,
    )

    return inventory_item, movement


@transaction.atomic
def release_stock(
    
    inventory_item,
    quantity,
    performed_by=None,
    reference="",
    notes="",
):
    if quantity <= 0:
        raise ValidationError(
            "Released quantity must be greater than zero."
        )

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item.pk)
    )

    if quantity > inventory_item.reserved_quantity:
        raise ValidationError(
            f"Cannot release {quantity} units. "
            f"Only {inventory_item.reserved_quantity} "
            f"units are reserved."
        )

    inventory_item.reserved_quantity -= quantity

    inventory_item.save(
        update_fields=[
            "reserved_quantity",
            "updated_at",
        ]
    )

    movement = InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.RELEASE,
        quantity=-quantity,
        performed_by=performed_by,
        reference=reference,
        notes=notes,
    )

    return inventory_item, movement'''
    
    
from django.db import transaction
from django.core.exceptions import ValidationError

from .models import InventoryItem, InventoryMovement


@transaction.atomic
def receive_stock(
    inventory_item_id,
    quantity,
    reference="",
    notes="",
    performed_by=None,
):
    """
    Add physical stock to an inventory item.
    Creates a STOCK_IN movement.
    """

    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item_id)
    )

    inventory_item.quantity += quantity

    inventory_item.save(
        update_fields=[
            "quantity",
            "updated_at",
        ]
    )

    InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.STOCK_IN,
        quantity=quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return inventory_item


@transaction.atomic
def remove_stock(
    inventory_item_id,
    quantity,
    reference="",
    notes="",
    performed_by=None,
):
    """
    Remove physical stock from inventory.
    Creates a STOCK_OUT movement.
    """

    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item_id)
    )

    if inventory_item.available_quantity < quantity:
        raise ValidationError(
            f"Insufficient available stock. "
            f"Available: {inventory_item.available_quantity}, "
            f"requested: {quantity}."
        )

    inventory_item.quantity -= quantity

    inventory_item.save(
        update_fields=[
            "quantity",
            "updated_at",
        ]
    )

    InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.STOCK_OUT,
        quantity=-quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return inventory_item


@transaction.atomic
def adjust_stock(
    inventory_item_id,
    new_quantity,
    reference="",
    notes="",
    performed_by=None,
):
    """
    Set inventory quantity to an exact value.

    The movement quantity represents the difference between
    the new quantity and the previous quantity.
    """

    if new_quantity < 0:
        raise ValidationError(
            "Inventory quantity cannot be negative."
        )

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item_id)
    )

    old_quantity = inventory_item.quantity

    if new_quantity < inventory_item.reserved_quantity:
        raise ValidationError(
            "New quantity cannot be less than reserved quantity."
        )

    difference = new_quantity - old_quantity

    inventory_item.quantity = new_quantity

    inventory_item.save(
        update_fields=[
            "quantity",
            "updated_at",
        ]
    )

    if difference != 0:
        InventoryMovement.objects.create(
            inventory_item=inventory_item,
            movement_type=InventoryMovement.MovementType.ADJUSTMENT,
            quantity=difference,
            reference=reference,
            notes=notes,
            performed_by=performed_by,
        )

    return inventory_item


@transaction.atomic
def reserve_stock(
    inventory_item_id,
    quantity,
    reference="",
    notes="",
    performed_by=None,
):
    """
    Reserve available stock for an order.

    This does NOT reduce physical quantity.
    It only increases reserved_quantity.

    Creates a RESERVATION movement.
    """

    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item_id)
    )

    if inventory_item.available_quantity < quantity:
        raise ValidationError(
            f"Insufficient available stock. "
            f"Available: {inventory_item.available_quantity}, "
            f"requested: {quantity}."
        )

    inventory_item.reserved_quantity += quantity

    inventory_item.save(
        update_fields=[
            "reserved_quantity",
            "updated_at",
        ]
    )

    InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.RESERVATION,
        quantity=quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return inventory_item


@transaction.atomic
def release_stock(
    inventory_item_id,
    quantity,
    reference="",
    notes="",
    performed_by=None,
):
    """
    Release previously reserved stock.

    Physical quantity remains unchanged.
    Only reserved_quantity is reduced.

    Creates a RELEASE movement.
    """

    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item_id)
    )

    if inventory_item.reserved_quantity < quantity:
        raise ValidationError(
            f"Cannot release more stock than is reserved. "
            f"Reserved: {inventory_item.reserved_quantity}, "
            f"requested: {quantity}."
        )

    inventory_item.reserved_quantity -= quantity

    inventory_item.save(
        update_fields=[
            "reserved_quantity",
            "updated_at",
        ]
    )

    InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.RELEASE,
        quantity=-quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return inventory_item


@transaction.atomic
def finalize_reserved_stock(
    inventory_item_id,
    quantity,
    reference="",
    notes="",
    performed_by=None,
):
    """
    Convert reserved stock into sold/removed stock.

    This is the important reservation -> sale transition:

        reserved_quantity - quantity
        quantity          - quantity
        STOCK_OUT movement = -quantity

    Used after successful payment.
    """

    if quantity <= 0:
        raise ValidationError("Quantity must be greater than zero.")

    inventory_item = (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item_id)
    )

    if inventory_item.reserved_quantity < quantity:
        raise ValidationError(
            f"Cannot finalize more stock than is reserved. "
            f"Reserved: {inventory_item.reserved_quantity}, "
            f"requested: {quantity}."
        )

    if inventory_item.quantity < quantity:
        raise ValidationError(
            f"Cannot finalize more stock than exists. "
            f"Quantity: {inventory_item.quantity}, "
            f"requested: {quantity}."
        )

    inventory_item.quantity -= quantity
    inventory_item.reserved_quantity -= quantity

    inventory_item.save(
        update_fields=[
            "quantity",
            "reserved_quantity",
            "updated_at",
        ]
    )

    # Audit the actual stock leaving the inventory.
    InventoryMovement.objects.create(
        inventory_item=inventory_item,
        movement_type=InventoryMovement.MovementType.STOCK_OUT,
        quantity=-quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return inventory_item