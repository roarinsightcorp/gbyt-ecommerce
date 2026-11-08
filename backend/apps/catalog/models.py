import uuid
from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import (
    Case,
    IntegerField,
    Q,
    Value,
    When,
)
from django.utils.text import slugify


class Category(models.Model):
    name = models.CharField(
        max_length=150,
        unique=True,
    )

    slug = models.SlugField(
        max_length=180,
        unique=True,
        blank=True,
    )

    description = models.TextField(
        blank=True,
    )

    parent = models.ForeignKey(
        "self",
        on_delete=models.PROTECT,
        null=True,
        blank=True,
        related_name="children",
    )

    image = models.URLField(
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    sort_order = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["sort_order", "name"]
        verbose_name_plural = "Categories"

        indexes = [
            models.Index(
                fields=["is_active", "sort_order"]
            ),
            models.Index(
                fields=["parent", "is_active"]
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class Product(models.Model):
    class ProductType(models.TextChoices):
        PHYSICAL = "PHYSICAL", "Physical"
        DIGITAL = "DIGITAL", "Digital"
        HYBRID = "HYBRID", "Hybrid"

    class Status(models.TextChoices):
        DRAFT = "DRAFT", "Draft"
        ACTIVE = "ACTIVE", "Active"
        INACTIVE = "INACTIVE", "Inactive"
        ARCHIVED = "ARCHIVED", "Archived"

    name = models.CharField(
        max_length=255,
    )

    slug = models.SlugField(
        max_length=255,
        unique=True,
        blank=True,
    )

    description = models.TextField()

    short_description = models.CharField(
        max_length=500,
        blank=True,
    )

    category = models.ForeignKey(
        Category,
        on_delete=models.PROTECT,
        related_name="products",
    )

    brand = models.CharField(
        max_length=150,
        blank=True,
    )

    product_type = models.CharField(
        max_length=20,
        choices=ProductType.choices,
        default=ProductType.PHYSICAL,
        db_index=True,
    )

    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.DRAFT,
        db_index=True,
    )

    is_featured = models.BooleanField(
        default=False,
        db_index=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    has_physical_item = models.BooleanField(
        default=True,
    )

    has_digital_item = models.BooleanField(
        default=False,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    seo_title = models.CharField(
        max_length=255,
        blank=True,
    )

    seo_description = models.TextField(
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-created_at"]

        indexes = [
            models.Index(
                fields=["status", "is_active"]
            ),
            models.Index(
                fields=["category", "status"]
            ),
            models.Index(
                fields=["product_type", "status"]
            ),
            models.Index(
                fields=["is_featured", "status"]
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return self.name


class ProductOption(models.Model):
    """
    Defines a configurable dimension of a product.

    Examples:
        Size
        Pages
        Cover
        Paper
        Pack
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="options",
    )

    name = models.CharField(
        max_length=100,
    )

    slug = models.SlugField(
        max_length=120,
        blank=True,
    )

    is_required = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    sort_order = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["sort_order", "name"]

        constraints = [
            models.UniqueConstraint(
                fields=["product", "name"],
                name="unique_product_option_name",
            ),
        ]

        indexes = [
            models.Index(
                fields=["product", "is_active"]
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.product.name} - {self.name}"


class ProductOptionValue(models.Model):
    """
    Defines a possible value for a ProductOption.

    Examples:

        Option: Size
        Values:
            A4
            A5

        Option: Pages
        Values:
            40
            60
            80
            100
    """

    option = models.ForeignKey(
        ProductOption,
        on_delete=models.CASCADE,
        related_name="values",
    )

    value = models.CharField(
        max_length=100,
    )

    slug = models.SlugField(
        max_length=120,
        blank=True,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    sort_order = models.PositiveIntegerField(
        default=0,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["sort_order", "value"]

        constraints = [
            models.UniqueConstraint(
                fields=["option", "value"],
                name="unique_option_value",
            ),
        ]

        indexes = [
            models.Index(
                fields=["option", "is_active"]
            ),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.value)

        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.option.name}: {self.value}"


class ProductVariant(models.Model):
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="variants",
    )

    name = models.CharField(
        max_length=150,
        blank=True,
    )

    sku = models.CharField(
        max_length=100,
        unique=True,
    )

    barcode = models.CharField(
        max_length=100,
        unique=True,
        null=True,
        blank=True,
    )

    price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
    )

    compare_at_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    cost_price = models.DecimalField(
        max_digits=12,
        decimal_places=2,
        null=True,
        blank=True,
    )

    weight = models.DecimalField(
        max_digits=10,
        decimal_places=3,
        null=True,
        blank=True,
        help_text="Weight in kilograms.",
    )

    length = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Length in centimeters.",
    )

    width = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Width in centimeters.",
    )

    height = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Height in centimeters.",
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    is_default = models.BooleanField(
        default=False,
    )

    default_product_id = models.GeneratedField(
        expression=Case(
            When(
                is_default=True,
                then="product_id",
            ),
            default=Value(None),
            output_field=IntegerField(),
        ),
        output_field=IntegerField(
            null=True,
        ),
        db_persist=True,
    )


    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["-is_default", "name"]

        constraints = [
            models.UniqueConstraint(
                fields=["default_product_id"],
                name="unique_default_variant_per_product",
            ),
        ]

        indexes = [
            models.Index(
                fields=["product", "is_active"]
            ),
            models.Index(
                fields=["product", "is_default"]
            ),
        ]

    def __str__(self):
        if self.name:
            return f"{self.product.name} - {self.name}"

        return f"{self.product.name} - {self.sku}"


class VariantOptionValue(models.Model):
    """
    Connects a ProductVariant to one value of a ProductOption.

    Example:

        Variant:
            EXB-A4-80-SOFT-RULED-50

        Option:
            Size

        Value:
            A4
    """

    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="option_values",
    )

    option = models.ForeignKey(
        ProductOption,
        on_delete=models.CASCADE,
        related_name="variant_values",
    )

    value = models.ForeignKey(
        ProductOptionValue,
        on_delete=models.CASCADE,
        related_name="variant_assignments",
    )

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=["variant", "option"],
                name="unique_variant_option",
            ),
            models.UniqueConstraint(
                fields=["variant", "value"],
                name="unique_variant_option_value",
            ),
        ]

        indexes = [
            models.Index(
                fields=["variant", "option"]
            ),
            models.Index(
                fields=["option", "value"]
            ),
        ]

    def clean(self):
        if self.value_id and self.option_id:
            if self.value.option_id != self.option_id:
                raise ValidationError(
                    {
                        "value": (
                            "This value does not belong to the selected option."
                        )
                    }
                )

        if self.variant_id and self.option_id:
            if self.variant.product_id != self.option.product_id:
                raise ValidationError(
                    {
                        "option": (
                            "This option does not belong to the variant's product."
                        )
                    }
                )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.variant} - {self.option.name}: {self.value.value}"


class ProductMedia(models.Model):
    class MediaType(models.TextChoices):
        IMAGE = "IMAGE", "Image"
        VIDEO = "VIDEO", "Video"
        DOCUMENT = "DOCUMENT", "Document"

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="media",
    )

    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.CASCADE,
        related_name="media",
        null=True,
        blank=True,
    )

    media_type = models.CharField(
        max_length=20,
        choices=MediaType.choices,
        default=MediaType.IMAGE,
    )

    url = models.URLField(
        max_length=1000,
    )
    storage_key = models.CharField(
        max_length=1000,
        blank=True,
        help_text="Bunny Storage object key.",
    )

    alt_text = models.CharField(
        max_length=255,
        blank=True,
    )

    title = models.CharField(
        max_length=255,
        blank=True,
    )

    sort_order = models.PositiveIntegerField(
        default=0,
    )

    is_primary = models.BooleanField(
        default=False,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = ["sort_order", "-created_at"]

        indexes = [
            models.Index(
                fields=["product", "is_active"]
            ),
            models.Index(
                fields=["product", "sort_order"]
            ),
            models.Index(
                fields=["variant", "is_active"]
            ),
            models.Index(
                fields=["media_type", "is_active"]
            ),
        ]

    def __str__(self):
        return self.title or f"{self.product.name} - {self.media_type}"

class ProductRelationship(models.Model):
    class RelationshipType(models.TextChoices):
        RELATED = "RELATED", "Related"
        COMPLEMENTARY = "COMPLEMENTARY", "Complementary"
        ACCESSORY = "ACCESSORY", "Accessory"
        ALTERNATIVE = "ALTERNATIVE", "Alternative"
        UPSELL = "UPSELL", "Upsell"
        CROSS_SELL = "CROSS_SELL", "Cross-sell"
        REPLACEMENT = "REPLACEMENT", "Replacement"

    source_product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="outgoing_relationships",
    )

    target_product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name="incoming_relationships",
    )

    relationship_type = models.CharField(
        max_length=30,
        choices=RelationshipType.choices,
        db_index=True,
    )

    sort_order = models.PositiveIntegerField(
        default=0,
    )

    is_active = models.BooleanField(
        default=True,
        db_index=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    created_at = models.DateTimeField(
        auto_now_add=True,
    )

    updated_at = models.DateTimeField(
        auto_now=True,
    )

    class Meta:
        ordering = [
            "sort_order",
            "-created_at",
        ]

        constraints = [
            models.UniqueConstraint(
                fields=[
                    "source_product",
                    "target_product",
                    "relationship_type",
                ],
                name="unique_product_relationship",
            ),
        ]

        indexes = [
            models.Index(
                fields=[
                    "source_product",
                    "relationship_type",
                    "is_active",
                ],
            ),
            models.Index(
                fields=[
                    "target_product",
                    "relationship_type",
                    "is_active",
                ],
            ),
        ]

    def clean(self):
        if (
            self.source_product_id
            and self.target_product_id
            and self.source_product_id == self.target_product_id
        ):
            raise ValidationError(
                {
                    "target_product": (
                        "A product cannot have a relationship with itself."
                    )
                }
            )

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

    def __str__(self):
        return (
            f"{self.source_product.name} "
            f"→ {self.get_relationship_type_display()} → "
            f"{self.target_product.name}"
        )

class ProductEvent(models.Model):
    class EventType(models.TextChoices):
        VIEWED = "VIEWED", "Viewed"
        SEARCHED = "SEARCHED", "Searched"
        VARIANT_SELECTED = "VARIANT_SELECTED", "Variant Selected"
        IMAGE_VIEWED = "IMAGE_VIEWED", "Image Viewed"
        ADDED_TO_CART = "ADDED_TO_CART", "Added to Cart"
        REMOVED_FROM_CART = "REMOVED_FROM_CART", "Removed from Cart"
        CHECKOUT_STARTED = "CHECKOUT_STARTED", "Checkout Started"
        PURCHASED = "PURCHASED", "Purchased"
        SHARED = "SHARED", "Shared"
        FAVORITED = "FAVORITED", "Favorited"

    id = models.UUIDField(
        primary_key=True,
        editable=False,
        default=uuid.uuid4,
    )

    event_type = models.CharField(
        max_length=40,
        choices=EventType.choices,
        db_index=True,
    )

    product = models.ForeignKey(
        Product,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )

    variant = models.ForeignKey(
        ProductVariant,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="events",
    )

    user = models.ForeignKey(
        "accounts.User",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="product_events",
    )

    session_key = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    anonymous_id = models.CharField(
        max_length=100,
        blank=True,
        db_index=True,
    )

    source = models.CharField(
        max_length=50,
        blank=True,
    )

    metadata = models.JSONField(
        default=dict,
        blank=True,
    )

    occurred_at = models.DateTimeField(
        auto_now_add=True,
        db_index=True,
    )

    class Meta:
        ordering = ["-occurred_at"]

        indexes = [
            models.Index(
                fields=[
                    "product",
                    "event_type",
                    "-occurred_at",
                ],
            ),
            models.Index(
                fields=[
                    "variant",
                    "event_type",
                    "-occurred_at",
                ],
            ),
            models.Index(
                fields=[
                    "user",
                    "-occurred_at",
                ],
            ),
            models.Index(
                fields=[
                    "event_type",
                    "-occurred_at",
                ],
            ),
        ]

    def __str__(self):
        product_name = (
            self.product.name
            if self.product_id
            else "Unknown Product"
        )

        return (
            f"{self.get_event_type_display()} "
            f"- {product_name}"
        )
