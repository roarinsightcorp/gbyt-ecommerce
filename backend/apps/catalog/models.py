from django.core.exceptions import ValidationError
from django.db import models
from django.db.models import Q
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
                fields=["product"],
                condition=Q(is_default=True),
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