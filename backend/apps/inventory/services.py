
from django.core.exceptions import ValidationError
from django.db import transaction

from .models import InventoryItem, InventoryMovement


def _lock_inventory_item(inventory_item=None, inventory_item_id=None):
    """
    Retrieve and lock an inventory item.

    Supports both:
    - inventory_item=<InventoryItem instance>
    - inventory_item_id=<primary key>
    """
    if inventory_item is not None:
        inventory_item_id = inventory_item.pk

    if inventory_item_id is None:
        raise ValidationError("An inventory item is required.")

    return (
        InventoryItem.objects
        .select_for_update()
        .get(pk=inventory_item_id)
    )


@transaction.atomic
def receive_stock(
    inventory_item_id=None,
    quantity=None,
    reference="",
    notes="",
    performed_by=None,
    *,
    inventory_item=None,
):
    """Add physical stock and create a STOCK_IN movement."""

    if quantity is None or quantity <= 0:
        raise ValidationError(
            "Received quantity must be greater than zero."
        )

    item = _lock_inventory_item(
        inventory_item=inventory_item,
        inventory_item_id=inventory_item_id,
    )

    item.quantity += quantity
    item.save(update_fields=["quantity", "updated_at"])

    movement = InventoryMovement.objects.create(
        inventory_item=item,
        movement_type=InventoryMovement.MovementType.STOCK_IN,
        quantity=quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return item, movement


@transaction.atomic
def remove_stock(
    inventory_item_id=None,
    quantity=None,
    reference="",
    notes="",
    performed_by=None,
    *,
    inventory_item=None,
):
    """Remove available physical stock and create a STOCK_OUT movement."""

    if quantity is None or quantity <= 0:
        raise ValidationError(
            "Removed quantity must be greater than zero."
        )

    item = _lock_inventory_item(
        inventory_item=inventory_item,
        inventory_item_id=inventory_item_id,
    )

    if quantity > item.available_quantity:
        raise ValidationError(
            f"Insufficient available stock. "
            f"Available: {item.available_quantity}, "
            f"requested: {quantity}."
        )

    item.quantity -= quantity
    item.save(update_fields=["quantity", "updated_at"])

    movement = InventoryMovement.objects.create(
        inventory_item=item,
        movement_type=InventoryMovement.MovementType.STOCK_OUT,
        quantity=-quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return item, movement


@transaction.atomic
def adjust_stock(
    inventory_item_id=None,
    new_quantity=None,
    reference="",
    notes="",
    performed_by=None,
    *,
    inventory_item=None,
):
    """
    Set physical stock to an absolute quantity.

    Movement quantity records the difference between
    the new quantity and the previous quantity.
    """

    if new_quantity is None or new_quantity < 0:
        raise ValidationError(
            "Inventory quantity cannot be negative."
        )

    item = _lock_inventory_item(
        inventory_item=inventory_item,
        inventory_item_id=inventory_item_id,
    )

    if new_quantity < item.reserved_quantity:
        raise ValidationError(
            "New quantity cannot be less than reserved quantity."
        )

    difference = new_quantity - item.quantity

    item.quantity = new_quantity
    item.save(update_fields=["quantity", "updated_at"])

    movement = None

    if difference != 0:
        movement = InventoryMovement.objects.create(
            inventory_item=item,
            movement_type=InventoryMovement.MovementType.ADJUSTMENT,
            quantity=difference,
            reference=reference,
            notes=notes,
            performed_by=performed_by,
        )

    return item, movement


@transaction.atomic
def reserve_stock(
    inventory_item_id=None,
    quantity=None,
    reference="",
    notes="",
    performed_by=None,
    *,
    inventory_item=None,
):
    """
    Reserve available stock without reducing physical quantity.
    Creates a RESERVATION movement.
    """

    if quantity is None or quantity <= 0:
        raise ValidationError(
            "Reserved quantity must be greater than zero."
        )

    item = _lock_inventory_item(
        inventory_item=inventory_item,
        inventory_item_id=inventory_item_id,
    )

    if quantity > item.available_quantity:
        raise ValidationError(
            f"Insufficient available stock. "
            f"Available: {item.available_quantity}, "
            f"requested: {quantity}."
        )

    item.reserved_quantity += quantity
    item.save(
        update_fields=["reserved_quantity", "updated_at"]
    )

    movement = InventoryMovement.objects.create(
        inventory_item=item,
        movement_type=InventoryMovement.MovementType.RESERVATION,
        quantity=quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return item, movement


@transaction.atomic
def release_stock(
    inventory_item_id=None,
    quantity=None,
    reference="",
    notes="",
    performed_by=None,
    *,
    inventory_item=None,
):
    """
    Release previously reserved stock.
    Physical quantity remains unchanged.
    Creates a RELEASE movement.
    """

    if quantity is None or quantity <= 0:
        raise ValidationError(
            "Released quantity must be greater than zero."
        )

    item = _lock_inventory_item(
        inventory_item=inventory_item,
        inventory_item_id=inventory_item_id,
    )

    if quantity > item.reserved_quantity:
        raise ValidationError(
            f"Cannot release more stock than is reserved. "
            f"Reserved: {item.reserved_quantity}, "
            f"requested: {quantity}."
        )

    item.reserved_quantity -= quantity
    item.save(
        update_fields=["reserved_quantity", "updated_at"]
    )

    movement = InventoryMovement.objects.create(
        inventory_item=item,
        movement_type=InventoryMovement.MovementType.RELEASE,
        quantity=-quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return item, movement


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

    This preserves the existing order-payment service contract.
    """

    if quantity <= 0:
        raise ValidationError(
            "Quantity must be greater than zero."
        )

    item = _lock_inventory_item(
        inventory_item_id=inventory_item_id,
    )

    if item.reserved_quantity < quantity:
        raise ValidationError(
            f"Cannot finalize more stock than is reserved. "
            f"Reserved: {item.reserved_quantity}, "
            f"requested: {quantity}."
        )

    if item.quantity < quantity:
        raise ValidationError(
            f"Cannot finalize more stock than exists. "
            f"Quantity: {item.quantity}, "
            f"requested: {quantity}."
        )

    item.quantity -= quantity
    item.reserved_quantity -= quantity

    item.save(
        update_fields=[
            "quantity",
            "reserved_quantity",
            "updated_at",
        ]
    )

    InventoryMovement.objects.create(
        inventory_item=item,
        movement_type=InventoryMovement.MovementType.STOCK_OUT,
        quantity=-quantity,
        reference=reference,
        notes=notes,
        performed_by=performed_by,
    )

    return item
