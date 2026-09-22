from rest_framework import serializers

from .models import (
    Category,
    Product,
    ProductMedia,
    ProductOption,
    ProductOptionValue,
    ProductVariant,
    VariantOptionValue,
)


class CategorySerializer(serializers.ModelSerializer):
    parent_name = serializers.CharField(
        source="parent.name",
        read_only=True,
    )

    class Meta:
        model = Category
        fields = [
            "id",
            "name",
            "slug",
            "description",
            "parent",
            "parent_name",
            "image",
            "is_active",
            "sort_order",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "parent_name",
            "created_at",
            "updated_at",
        ]


class ProductMediaSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductMedia
        fields = [
            "id",
            "media_type",
            "url",
            "alt_text",
            "title",
            "sort_order",
            "is_primary",
            "is_active",
            "metadata",
        ]

        read_only_fields = [
            "id",
        ]


class ProductOptionValueSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ProductOptionValue
        fields = [
            "id",
            "value",
            "slug",
            "is_active",
            "sort_order",
        ]

        read_only_fields = [
            "id",
            "slug",
        ]


class ProductOptionSerializer(
    serializers.ModelSerializer
):
    values = ProductOptionValueSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ProductOption
        fields = [
            "id",
            "name",
            "slug",
            "is_required",
            "is_active",
            "sort_order",
            "values",
        ]

        read_only_fields = [
            "id",
            "slug",
        ]


class VariantOptionValueSerializer(
    serializers.ModelSerializer
):
    option_id = serializers.IntegerField(
        source="option.id",
        read_only=True,
    )

    option_name = serializers.CharField(
        source="option.name",
        read_only=True,
    )

    option_slug = serializers.CharField(
        source="option.slug",
        read_only=True,
    )

    value_id = serializers.IntegerField(
        source="value.id",
        read_only=True,
    )

    value = serializers.CharField(
        source="value.value",
        read_only=True,
    )

    value_slug = serializers.CharField(
        source="value.slug",
        read_only=True,
    )

    class Meta:
        model = VariantOptionValue
        fields = [
            "id",
            "option_id",
            "option_name",
            "option_slug",
            "value_id",
            "value",
            "value_slug",
        ]

        read_only_fields = [
            "id",
            "option_id",
            "option_name",
            "option_slug",
            "value_id",
            "value",
            "value_slug",
        ]


class ProductVariantSerializer(
    serializers.ModelSerializer
):
    option_values = VariantOptionValueSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = ProductVariant

        fields = [
            "id",
            "name",
            "sku",
            "barcode",
            "price",
            "compare_at_price",
            "cost_price",
            "weight",
            "length",
            "width",
            "height",
            "is_active",
            "is_default",
            "metadata",
            "option_values",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]


class ProductListSerializer(
    serializers.ModelSerializer
):
    category = CategorySerializer(
        read_only=True
    )

    primary_image = serializers.SerializerMethodField()

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "slug",
            "short_description",
            "category",
            "brand",
            "product_type",
            "status",
            "is_featured",
            "is_active",
            "primary_image",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]

    def get_primary_image(self, obj):
        media = getattr(
            obj,
            "prefetched_primary_images",
            None,
        )

        if media:
            return ProductMediaSerializer(
                media[0]
            ).data

        media = getattr(
            obj,
            "prefetched_images",
            None,
        )

        if media:
            return ProductMediaSerializer(
                media[0]
            ).data

        return None


class ProductDetailSerializer(
    serializers.ModelSerializer
):
    category = CategorySerializer(
        read_only=True
    )

    options = ProductOptionSerializer(
        many=True,
        read_only=True,
    )

    variants = ProductVariantSerializer(
        many=True,
        read_only=True,
    )

    media = ProductMediaSerializer(
        many=True,
        read_only=True,
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
            "slug",
            "description",
            "short_description",
            "category",
            "brand",
            "product_type",
            "status",
            "is_featured",
            "is_active",
            "has_physical_item",
            "has_digital_item",
            "metadata",
            "seo_title",
            "seo_description",
            "options",
            "variants",
            "media",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]