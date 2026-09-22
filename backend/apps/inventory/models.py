from django.core.validators import MinValueValidator
from django.db import models

from apps.catalog.models import ProductVariant


class InventoryLocation(models.Model):
    class LocationType(models.TextChoices):
        WAREHOUSE = "WAREHOUSE", "Warehouse"
        STORE = "STORE", "Store"
        OFFICE = "OFFICE", "Office"
        OTHER = "OTHER", "Other"

    name = models.CharField(max_length=150)
    code = models.CharField(max_length=50, unique=True)
    location_type = models.CharField(
        max_length=20,
        choices=LocationType.choices,
        default=LocationType.WAREHOUSE,
    )
    address_line_1 = models.CharField(max_length=255, blank=True)
    address_line_2 = models.CharField(max_length=255, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="Nigeria")
    is_active = models.BooleanField(default=True, db_index=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["name"]
        indexes = [
            models.Index(fields=["location_type", "is_active"]),
            models.Index(fields=["is_active", "name"]),
        ]

    def __str__(self):
        return f"{self.name} ({self.code})"


class InventoryItem(models.Model):
    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.PROTECT,
        related_name="inventory_items",
    )
    location = models.ForeignKey(
        InventoryLocation,
        on_delete=models.PROTECT,
        related_name="inventory_items",
    )

    quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )

    reserved_quantity = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )

    reorder_level = models.PositiveIntegerField(
        default=0,
        validators=[MinValueValidator(0)],
    )

    is_active = models.BooleanField(default=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["variant__sku", "location__name"]
        constraints = [
            models.UniqueConstraint(
                fields=["variant", "location"],
                name="unique_inventory_per_variant_location",
            ),
            models.CheckConstraint(
                condition=models.Q(
                    reserved_quantity__lte=models.F("quantity")
                ),
                name="reserved_quantity_not_greater_than_quantity",
            ),
        ]
        indexes = [
            models.Index(fields=["variant", "is_active"]),
            models.Index(fields=["location", "is_active"]),
            models.Index(fields=["quantity", "reorder_level"]),
        ]

    @property
    def available_quantity(self):
        return self.quantity - self.reserved_quantity

    @property
    def is_low_stock(self):
        return self.available_quantity <= self.reorder_level

    def __str__(self):
        return (
            f"{self.variant.sku} - "
            f"{self.location.code} - "
            f"{self.quantity}"
        )


class InventoryMovement(models.Model):
    class MovementType(models.TextChoices):
        STOCK_IN = "STOCK_IN", "Stock In"
        STOCK_OUT = "STOCK_OUT", "Stock Out"
        ADJUSTMENT = "ADJUSTMENT", "Adjustment"
        RESERVATION = "RESERVATION", "Reservation"
        RELEASE = "RELEASE", "Release"

    inventory_item = models.ForeignKey(
        InventoryItem,
        on_delete=models.PROTECT,
        related_name="movements",
    )

    movement_type = models.CharField(
        max_length=20,
        choices=MovementType.choices,
    )

    quantity = models.IntegerField()

    reference = models.CharField(
        max_length=150,
        blank=True,
    )

    notes = models.TextField(blank=True)

    performed_by = models.ForeignKey(
        "accounts.User",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="inventory_movements",
    )

    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]
        indexes = [
            models.Index(fields=["inventory_item", "-created_at"]),
            models.Index(fields=["movement_type", "-created_at"]),
            models.Index(fields=["reference"]),
        ]

    def __str__(self):
        return (
            f"{self.inventory_item.variant.sku} - "
            f"{self.movement_type} - "
            f"{self.quantity}"
        )