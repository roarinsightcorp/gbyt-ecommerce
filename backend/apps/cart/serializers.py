from rest_framework import serializers

from apps.catalog.models import ProductMedia

from .models import Cart, CartItem, Wishlist, WishlistItem


class CartItemSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(
        source="variant.sku",
        read_only=True,
    )
    product_name = serializers.CharField(
        source="variant.product.name",
        read_only=True,
    )
    product_slug = serializers.CharField(
        source="variant.product.slug",
        read_only=True,
    )
    unit_price = serializers.DecimalField(
        source="variant.price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )
    line_total = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = CartItem
        fields = [
            "id",
            "variant",
            "sku",
            "product_name",
            "product_slug",
            "unit_price",
            "quantity",
            "line_total",
            "primary_image",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "sku",
            "product_name",
            "product_slug",
            "unit_price",
            "line_total",
            "primary_image",
            "created_at",
            "updated_at",
        ]

    def get_primary_image(self, obj):
        media = (
            obj.variant.product.media
            .filter(
                media_type=ProductMedia.MediaType.IMAGE,
                is_active=True,
                is_primary=True,
            )
            .first()
        )

        if not media:
            media = (
                obj.variant.product.media
                .filter(
                    media_type=ProductMedia.MediaType.IMAGE,
                    is_active=True,
                )
                .first()
            )

        if not media:
            return None

        return {
            "id": media.id,
            "url": media.url,
            "alt_text": media.alt_text,
            "title": media.title,
        }


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=14,
        decimal_places=2,
        read_only=True,
    )
    item_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = Cart
        fields = [
            "id",
            "items",
            "subtotal",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields


class CartItemCreateSerializer(serializers.Serializer):
    variant = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)


class CartItemUpdateSerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=1)


class WishlistItemSerializer(serializers.ModelSerializer):
    sku = serializers.CharField(
        source="variant.sku",
        read_only=True,
    )
    product_name = serializers.CharField(
        source="variant.product.name",
        read_only=True,
    )
    product_slug = serializers.CharField(
        source="variant.product.slug",
        read_only=True,
    )
    price = serializers.DecimalField(
        source="variant.price",
        max_digits=12,
        decimal_places=2,
        read_only=True,
    )

    class Meta:
        model = WishlistItem
        fields = [
            "id",
            "variant",
            "sku",
            "product_name",
            "product_slug",
            "price",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "sku",
            "product_name",
            "product_slug",
            "price",
            "created_at",
        ]


class WishlistSerializer(serializers.ModelSerializer):
    items = WishlistItemSerializer(many=True, read_only=True)
    item_count = serializers.SerializerMethodField()

    class Meta:
        model = Wishlist
        fields = [
            "id",
            "items",
            "item_count",
            "created_at",
            "updated_at",
        ]
        read_only_fields = fields

    def get_item_count(self, obj):
        return obj.items.count()


class WishlistItemCreateSerializer(serializers.Serializer):
    variant = serializers.IntegerField()