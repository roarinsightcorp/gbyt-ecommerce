from rest_framework import serializers

from .models import (
    Category,
    Product,
    ProductMedia,
    ProductOption,
    ProductOptionValue,
    ProductRelationship,
    ProductVariant,
    VariantOptionValue,
)


# ============================================================
# CATEGORY
# ============================================================


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


# ============================================================
# MEDIA
# ============================================================


class ProductMediaSerializer(serializers.ModelSerializer):
    url = serializers.SerializerMethodField()

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

        read_only_fields = ["id"]

    def get_url(self, obj):
        value = obj.url or ""

        if value.startswith("catalog/"):
            from django.urls import reverse

            media_path = reverse(
                "catalog-media",
                kwargs={"key": value},
            )

            request = self.context.get("request")

            if request:
                return request.build_absolute_uri(media_path)

            return media_path

        return value


class ProductMediaUploadSerializer(serializers.Serializer):
    file = serializers.FileField()

    media_type = serializers.ChoiceField(
        choices=ProductMedia.MediaType.choices,
        default=ProductMedia.MediaType.IMAGE,
    )

    alt_text = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    title = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=255,
    )

    sort_order = serializers.IntegerField(
        required=False,
        default=0,
        min_value=0,
    )

    is_primary = serializers.BooleanField(
        required=False,
        default=False,
    )

    variant_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    def validate_file(self, value):
        max_size = 50 * 1024 * 1024

        if value.size > max_size:
            raise serializers.ValidationError(
                "File size must not exceed 50 MB."
            )

        allowed_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
            "video/mp4",
            "video/webm",
            "video/quicktime",
            "application/pdf",
        }

        content_type = getattr(
            value,
            "content_type",
            None,
        )

        if content_type not in allowed_types:
            raise serializers.ValidationError(
                "Unsupported file type."
            )

        return value

    def validate(self, attrs):
        media_type = attrs.get(
            "media_type",
            ProductMedia.MediaType.IMAGE,
        )

        uploaded_file = attrs["file"]
        content_type = getattr(
            uploaded_file,
            "content_type",
            None,
        )

        image_types = {
            "image/jpeg",
            "image/png",
            "image/webp",
            "image/gif",
        }

        video_types = {
            "video/mp4",
            "video/webm",
            "video/quicktime",
        }

        document_types = {
            "application/pdf",
        }

        allowed_by_type = {
            ProductMedia.MediaType.IMAGE: image_types,
            ProductMedia.MediaType.VIDEO: video_types,
            ProductMedia.MediaType.DOCUMENT: document_types,
        }

        allowed = allowed_by_type.get(media_type, set())

        if content_type not in allowed:
            raise serializers.ValidationError(
                {
                    "file": (
                        f"The uploaded file does not match "
                        f"media type '{media_type}'."
                    )
                }
            )

        if (
            attrs.get("is_primary", False)
            and media_type != ProductMedia.MediaType.IMAGE
        ):
            raise serializers.ValidationError(
                {
                    "is_primary": (
                        "Only images can be marked as primary media."
                    )
                }
            )

        return attrs


# ============================================================
# OPTIONS
# ============================================================


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


# ============================================================
# VARIANTS
# ============================================================


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


# ============================================================
# RELATIONSHIPS
# ============================================================


class ProductRelationshipSerializer(
    serializers.ModelSerializer
):
    target_product_id = serializers.IntegerField(
        source="target_product.id",
        read_only=True,
    )

    target_product_name = serializers.CharField(
        source="target_product.name",
        read_only=True,
    )

    target_product_slug = serializers.CharField(
        source="target_product.slug",
        read_only=True,
    )

    target_product_short_description = serializers.CharField(
        source="target_product.short_description",
        read_only=True,
    )

    target_product_brand = serializers.CharField(
        source="target_product.brand",
        read_only=True,
    )

    class Meta:
        model = ProductRelationship

        fields = [
            "id",
            "relationship_type",
            "target_product_id",
            "target_product_name",
            "target_product_slug",
            "target_product_short_description",
            "target_product_brand",
            "sort_order",
            "metadata",
        ]

        read_only_fields = [
            "id",
            "target_product_id",
            "target_product_name",
            "target_product_slug",
            "target_product_short_description",
            "target_product_brand",
        ]


# ============================================================
# PUBLIC PRODUCT SERIALIZERS
# ============================================================


class ProductListSerializer(
    serializers.ModelSerializer
):
    category = CategorySerializer(
        read_only=True,
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
                media[0],
                context=self.context,
            ).data

        media = getattr(
            obj,
            "prefetched_images",
            None,
        )

        if media:
           return ProductMediaSerializer(
                media[0],
                context=self.context,
            ).data

        return None


class ProductDetailSerializer(
    serializers.ModelSerializer
):
    category = CategorySerializer(
        read_only=True,
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

    relationships = ProductRelationshipSerializer(
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
            "relationships",
        ]

        read_only_fields = [
            "id",
            "slug",
            "created_at",
            "updated_at",
        ]


# ============================================================
# ADMIN PRODUCT SERIALIZERS
# ============================================================


class AdminProductListSerializer(
    serializers.ModelSerializer
):
    category = CategorySerializer(
        read_only=True,
    )

    variant_count = serializers.IntegerField(
        read_only=True,
    )

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
            "has_physical_item",
            "has_digital_item",
            "variant_count",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "category",
            "variant_count",
            "created_at",
            "updated_at",
        ]


class AdminProductWriteSerializer(
    serializers.ModelSerializer
):
    category = serializers.PrimaryKeyRelatedField(
        queryset=Category.objects.all(),
        required=False,
        allow_null=True,
    )

    class Meta:
        model = Product

        fields = [
            "id",
            "name",
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
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Product name cannot be empty."
            )

        return value

    def validate(self, attrs):
        product_type = attrs.get(
            "product_type",
            getattr(
                self.instance,
                "product_type",
                None,
            ),
        )

        has_physical_item = attrs.get(
            "has_physical_item",
            getattr(
                self.instance,
                "has_physical_item",
                False,
            ),
        )

        has_digital_item = attrs.get(
            "has_digital_item",
            getattr(
                self.instance,
                "has_digital_item",
                False,
            ),
        )

        if product_type == Product.ProductType.PHYSICAL:
            if not has_physical_item:
                attrs["has_physical_item"] = True

            attrs["has_digital_item"] = False

        elif product_type == Product.ProductType.DIGITAL:
            if not has_digital_item:
                attrs["has_digital_item"] = True

            attrs["has_physical_item"] = False

        elif product_type == Product.ProductType.HYBRID:
            attrs["has_physical_item"] = True
            attrs["has_digital_item"] = True

        return attrs


class AdminProductDetailSerializer(
    serializers.ModelSerializer
):
    category = CategorySerializer(
        read_only=True,
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

    relationships = ProductRelationshipSerializer(
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
            "relationships",
            "created_at",
            "updated_at",
        ]

        read_only_fields = [
            "id",
            "slug",
            "category",
            "options",
            "variants",
            "media",
            "relationships",
            "created_at",
            "updated_at",
        ]


# ============================================================
# ADMIN OPTION WRITE SERIALIZERS
# ============================================================


class AdminProductOptionWriteSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ProductOption

        fields = [
            "id",
            "name",
            "is_required",
            "is_active",
            "sort_order",
        ]

        read_only_fields = [
            "id",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Option name cannot be empty."
            )

        return value


class AdminProductOptionValueWriteSerializer(
    serializers.ModelSerializer
):
    class Meta:
        model = ProductOptionValue

        fields = [
            "id",
            "value",
            "is_active",
            "sort_order",
        ]

        read_only_fields = [
            "id",
        ]

    def validate_value(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Option value cannot be empty."
            )

        return value

# ============================================================
# ADMIN VARIANT WRITE SERIALIZER
# ============================================================


class AdminProductVariantWriteSerializer(
    serializers.ModelSerializer
):
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
        ]

        read_only_fields = [
            "id",
        ]

    def validate_name(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "Variant name cannot be empty."
            )

        return value

    def validate_sku(self, value):
        value = value.strip()

        if not value:
            raise serializers.ValidationError(
                "SKU cannot be empty."
            )

        return value

    def validate_barcode(self, value):
        if value is None:
            return value

        value = value.strip()

        return value or None

    def validate_price(self, value):
        if value < 0:
            raise serializers.ValidationError(
                "Price cannot be negative."
            )

        return value

    def validate_compare_at_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Compare-at price cannot be negative."
            )

        return value

    def validate_cost_price(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Cost price cannot be negative."
            )

        return value

    def validate_weight(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Weight cannot be negative."
            )

        return value

    def validate_length(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Length cannot be negative."
            )

        return value

    def validate_width(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Width cannot be negative."
            )

        return value

    def validate_height(self, value):
        if value is not None and value < 0:
            raise serializers.ValidationError(
                "Height cannot be negative."
            )

        return value

    def validate(self, attrs):
        price = attrs.get(
            "price",
            getattr(
                self.instance,
                "price",
                None,
            ),
        )

        compare_at_price = attrs.get(
            "compare_at_price",
            getattr(
                self.instance,
                "compare_at_price",
                None,
            ),
        )

        if (
            compare_at_price is not None
            and price is not None
            and compare_at_price < price
        ):
            raise serializers.ValidationError(
                {
                    "compare_at_price": (
                        "Compare-at price cannot be lower "
                        "than the selling price."
                    )
                }
            )

        return attrs


# ============================================================
# ADMIN RELATIONSHIP WRITE SERIALIZER
# ============================================================


class AdminProductRelationshipWriteSerializer(
    serializers.ModelSerializer
):
    target_product = serializers.PrimaryKeyRelatedField(
        queryset=Product.objects.all(),
    )

    class Meta:
        model = ProductRelationship

        fields = [
            "id",
            "target_product",
            "relationship_type",
            "sort_order",
            "is_active",
            "metadata",
        ]

        read_only_fields = [
            "id",
        ]

    def validate(self, attrs):
        source_product = self.context.get(
            "source_product"
        )

        target_product = attrs.get(
            "target_product"
        )

        if (
            source_product is not None
            and target_product is not None
            and source_product.pk == target_product.pk
        ):
            raise serializers.ValidationError(
                {
                    "target_product": (
                        "A product cannot be related to itself."
                    )
                }
            )

        return attrs

# ============================================================
# VARIANT OPTION ASSIGNMENT
# ============================================================


class AdminVariantOptionValueWriteSerializer(
    serializers.ModelSerializer
):
    option = serializers.PrimaryKeyRelatedField(
        queryset=ProductOption.objects.all(),
    )

    value = serializers.PrimaryKeyRelatedField(
        queryset=ProductOptionValue.objects.all(),
    )

    class Meta:
        model = VariantOptionValue

        fields = [
            "id",
            "option",
            "value",
        ]

        read_only_fields = [
            "id",
        ]

    def validate(self, attrs):
        variant = self.context.get("variant")
        option = attrs.get("option")
        value = attrs.get("value")

        if variant is not None:
            if option.product_id != variant.product_id:
                raise serializers.ValidationError(
                    {
                        "option": (
                            "The option must belong to "
                            "the same product as the variant."
                        )
                    }
                )

        if value.option_id != option.id:
            raise serializers.ValidationError(
                {
                    "value": (
                        "The selected value does not belong "
                        "to the selected option."
                    )
                }
            )

        return attrs
