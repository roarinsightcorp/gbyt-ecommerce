from rest_framework import serializers

from .models import InventoryItem, InventoryLocation, InventoryMovement


class InventoryLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = InventoryLocation
        fields = [
            "id",
            "name",
            "code",
            "location_type",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "country",
            "is_active",
            "metadata",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class InventoryItemSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(
        source="variant.sku",
        read_only=True,
    )
    product_name = serializers.CharField(
        source="variant.product.name",
        read_only=True,
    )
    location_name = serializers.CharField(
        source="location.name",
        read_only=True,
    )
    available_quantity = serializers.IntegerField(
        read_only=True,
    )
    is_low_stock = serializers.BooleanField(
        read_only=True,
    )

    class Meta:
        model = InventoryItem
        fields = [
            "id",
            "variant",
            "sku",
            "product_name",
            "location",
            "location_name",
            "quantity",
            "reserved_quantity",
            "available_quantity",
            "reorder_level",
            "is_low_stock",
            "is_active",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "quantity",
            "reserved_quantity",
            "available_quantity",
            "is_low_stock",
            "created_at",
            "updated_at",
        ]


class InventoryMovementSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(
        source="inventory_item.variant.sku",
        read_only=True,
    )

    class Meta:
        model = InventoryMovement
        fields = [
            "id",
            "inventory_item",
            "sku",
            "movement_type",
            "quantity",
            "reference",
            "notes",
            "performed_by",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "performed_by",
            "created_at",
        ]


class StockOperationSerializer(serializers.Serializer):
    
    inventory_item = serializers.PrimaryKeyRelatedField(
        queryset=InventoryItem.objects.filter(is_active=True)
    )
    quantity = serializers.IntegerField(min_value=1)
    reference = serializers.CharField(
        max_length=150,
        required=False,
        allow_blank=True,
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
    )
    
    
