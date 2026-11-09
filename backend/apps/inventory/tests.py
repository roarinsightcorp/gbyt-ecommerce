from django.core.exceptions import ValidationError
from django.test import TestCase

from apps.catalog.models import Category, Product, ProductVariant
from apps.inventory.models import (
    InventoryItem,
    InventoryLocation,
    InventoryMovement,
)
from apps.inventory.services import (
    adjust_stock,
    finalize_reserved_stock,
    receive_stock,
    release_stock,
    remove_stock,
    reserve_stock,
)


class InventoryServicesTestCase(TestCase):
    def setUp(self):
        self.category = Category.objects.create(
            name="Inventory Test Category",
        )

        self.product = Product.objects.create(
            name="Inventory Test Product",
            description="Product used for automated inventory tests.",
            category=self.category,
        )

        self.variant = ProductVariant.objects.create(
            product=self.product,
            name="Test Variant",
            sku="INV-TEST-001",
            price="15000.00",
        )

        self.location = InventoryLocation.objects.create(
            name="Test Warehouse",
            code="INV-TEST-WH",
            location_type=InventoryLocation.LocationType.WAREHOUSE,
            country="Nigeria",
        )

        self.item = InventoryItem.objects.create(
            variant=self.variant,
            location=self.location,
            quantity=20,
            reserved_quantity=5,
            reorder_level=5,
        )

    def refresh_item(self):
        self.item.refresh_from_db()
        return self.item

    def test_receive_stock_increases_quantity_and_creates_movement(self):
        item, movement = receive_stock(
            inventory_item=self.item,
            quantity=10,
            reference="TEST-RECEIVE",
            notes="Test stock receipt",
        )

        self.refresh_item()

        self.assertEqual(item.pk, self.item.pk)
        self.assertEqual(self.item.quantity, 30)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(self.item.available_quantity, 25)

        self.assertEqual(
            movement.movement_type,
            InventoryMovement.MovementType.STOCK_IN,
        )
        self.assertEqual(movement.quantity, 10)
        self.assertEqual(movement.reference, "TEST-RECEIVE")

    def test_remove_stock_decreases_quantity(self):
        item, movement = remove_stock(
            inventory_item_id=self.item.pk,
            quantity=5,
        )

        self.refresh_item()

        self.assertEqual(item.pk, self.item.pk)
        self.assertEqual(self.item.quantity, 15)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(self.item.available_quantity, 10)

        self.assertEqual(
            movement.movement_type,
            InventoryMovement.MovementType.STOCK_OUT,
        )
        self.assertEqual(movement.quantity, -5)

    def test_remove_stock_rejects_insufficient_available_quantity(self):
        with self.assertRaises(ValidationError):
            remove_stock(
                inventory_item=self.item,
                quantity=16,
            )

        self.refresh_item()

        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )

    def test_reserve_stock_does_not_reduce_physical_quantity(self):
        item, movement = reserve_stock(
            inventory_item_id=self.item.pk,
            quantity=10,
        )

        self.refresh_item()

        self.assertEqual(item.pk, self.item.pk)
        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(self.item.reserved_quantity, 15)
        self.assertEqual(self.item.available_quantity, 5)

        self.assertEqual(
            movement.movement_type,
            InventoryMovement.MovementType.RESERVATION,
        )
        self.assertEqual(movement.quantity, 10)

    def test_reserve_stock_rejects_insufficient_available_quantity(self):
        with self.assertRaises(ValidationError):
            reserve_stock(
                inventory_item=self.item,
                quantity=16,
            )

        self.refresh_item()

        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )

    def test_release_stock_reduces_reserved_quantity(self):
        item, movement = release_stock(
            inventory_item=self.item,
            quantity=3,
        )

        self.refresh_item()

        self.assertEqual(item.pk, self.item.pk)
        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(self.item.reserved_quantity, 2)
        self.assertEqual(self.item.available_quantity, 18)

        self.assertEqual(
            movement.movement_type,
            InventoryMovement.MovementType.RELEASE,
        )
        self.assertEqual(movement.quantity, -3)

    def test_release_stock_rejects_more_than_reserved(self):
        with self.assertRaises(ValidationError):
            release_stock(
                inventory_item=self.item,
                quantity=6,
            )

        self.refresh_item()

        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )

    def test_adjust_stock_sets_absolute_quantity(self):
        item, movement = adjust_stock(
            inventory_item=self.item,
            new_quantity=30,
            reference="TEST-ADJUST",
        )

        self.refresh_item()

        self.assertEqual(item.pk, self.item.pk)
        self.assertEqual(self.item.quantity, 30)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(self.item.available_quantity, 25)

        self.assertEqual(
            movement.movement_type,
            InventoryMovement.MovementType.ADJUSTMENT,
        )
        self.assertEqual(movement.quantity, 10)

    def test_adjust_stock_rejects_quantity_below_reserved(self):
        with self.assertRaises(ValidationError):
            adjust_stock(
                inventory_item=self.item,
                new_quantity=4,
            )

        self.refresh_item()

        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )

    def test_adjust_stock_without_change_creates_no_movement(self):
        item, movement = adjust_stock(
            inventory_item=self.item,
            new_quantity=20,
        )

        self.refresh_item()

        self.assertEqual(item.pk, self.item.pk)
        self.assertEqual(self.item.quantity, 20)
        self.assertIsNone(movement)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )

    def test_finalize_reserved_stock_reduces_quantity_and_reservation(self):
        item = finalize_reserved_stock(
            inventory_item_id=self.item.pk,
            quantity=3,
            reference="TEST-ORDER",
        )

        self.refresh_item()

        self.assertEqual(item.pk, self.item.pk)
        self.assertEqual(self.item.quantity, 17)
        self.assertEqual(self.item.reserved_quantity, 2)
        self.assertEqual(self.item.available_quantity, 15)

        movement = InventoryMovement.objects.get(
            inventory_item=self.item,
        )

        self.assertEqual(
            movement.movement_type,
            InventoryMovement.MovementType.STOCK_OUT,
        )
        self.assertEqual(movement.quantity, -3)
        self.assertEqual(movement.reference, "TEST-ORDER")

    def test_finalize_reserved_stock_rejects_unreserved_quantity(self):
        with self.assertRaises(ValidationError):
            finalize_reserved_stock(
                inventory_item_id=self.item.pk,
                quantity=6,
            )

        self.refresh_item()

        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(self.item.reserved_quantity, 5)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )

    def test_receive_stock_rejects_zero_quantity(self):
        with self.assertRaises(ValidationError):
            receive_stock(
                inventory_item=self.item,
                quantity=0,
            )

        self.refresh_item()

        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )

    def test_remove_stock_rejects_zero_quantity(self):
        with self.assertRaises(ValidationError):
            remove_stock(
                inventory_item=self.item,
                quantity=0,
            )

        self.refresh_item()

        self.assertEqual(self.item.quantity, 20)
        self.assertEqual(
            InventoryMovement.objects.count(),
            0,
        )
