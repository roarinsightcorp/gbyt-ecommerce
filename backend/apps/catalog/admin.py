from django.contrib import admin

from .models import (
    Category,
    Product,
    ProductMedia,
    ProductOption,
    ProductOptionValue,
    ProductVariant,
    VariantOptionValue,
)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "parent",
        "is_active",
        "sort_order",
        "created_at",
    )

    list_filter = (
        "is_active",
        "parent",
    )

    search_fields = (
        "name",
        "slug",
        "description",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    ordering = (
        "sort_order",
        "name",
    )


class ProductOptionValueInline(admin.TabularInline):
    model = ProductOptionValue
    extra = 1

    fields = (
        "value",
        "slug",
        "is_active",
        "sort_order",
    )

    prepopulated_fields = {
        "slug": ("value",),
    }


class ProductOptionInline(admin.StackedInline):
    model = ProductOption
    extra = 0

    fields = (
        "name",
        "slug",
        "is_required",
        "is_active",
        "sort_order",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }


class VariantOptionValueInline(admin.TabularInline):
    model = VariantOptionValue
    extra = 0

    autocomplete_fields = (
        "option",
        "value",
    )


class ProductVariantInline(admin.StackedInline):
    model = ProductVariant
    extra = 1

    fields = (
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
    )
    


class ProductMediaInline(admin.TabularInline):
    model = ProductMedia
    extra = 0

    fields = (
        "variant",
        "media_type",
        "url",
        "alt_text",
        "title",
        "sort_order",
        "is_primary",
        "is_active",
    )


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "category",
        "brand",
        "product_type",
        "status",
        "is_featured",
        "is_active",
        "created_at",
    )

    list_filter = (
        "status",
        "product_type",
        "is_active",
        "is_featured",
        "category",
    )

    search_fields = (
        "name",
        "slug",
        "description",
        "short_description",
        "brand",
    )

    prepopulated_fields = {
        "slug": ("name",),
    }

    autocomplete_fields = (
        "category",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    fieldsets = (
        (
            "Basic Information",
            {
                "fields": (
                    "name",
                    "slug",
                    "category",
                    "brand",
                    "description",
                    "short_description",
                )
            },
        ),
        (
            "Product Configuration",
            {
                "fields": (
                    "product_type",
                    "status",
                    "is_featured",
                    "is_active",
                    "has_physical_item",
                    "has_digital_item",
                )
            },
        ),
        (
            "SEO",
            {
                "fields": (
                    "seo_title",
                    "seo_description",
                )
            },
        ),
        (
            "Metadata",
            {
                "fields": (
                    "metadata",
                ),
                "classes": ("collapse",),
            },
        ),
        (
            "System Information",
            {
                "fields": (
                    "created_at",
                    "updated_at",
                ),
                "classes": ("collapse",),
            },
        ),
    )

    inlines = (
        ProductOptionInline,
        ProductVariantInline,
        ProductMediaInline,
    )


@admin.register(ProductOption)
class ProductOptionAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "product",
        "is_required",
        "is_active",
        "sort_order",
    )

    list_filter = (
        "is_required",
        "is_active",
    )

    search_fields = (
        "name",
        "product__name",
    )

    autocomplete_fields = (
        "product",
    )

    inlines = (
        ProductOptionValueInline,
    )


@admin.register(ProductOptionValue)
class ProductOptionValueAdmin(admin.ModelAdmin):
    list_display = (
        "value",
        "option",
        "is_active",
        "sort_order",
    )

    list_filter = (
        "is_active",
        "option",
    )

    search_fields = (
        "value",
        "option__name",
        "option__product__name",
    )

    autocomplete_fields = (
        "option",
    )


@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = (
        "name",
        "product",
        "sku",
        "price",
        "cost_price",
        "is_active",
        "is_default",
    )

    list_filter = (
        "is_active",
        "is_default",
        "product",
    )

    search_fields = (
        "name",
        "sku",
        "barcode",
        "product__name",
    )

    autocomplete_fields = (
        "product",
    )

    readonly_fields = (
        "created_at",
        "updated_at",
    )

    inlines = (
        VariantOptionValueInline,
    )


@admin.register(VariantOptionValue)
class VariantOptionValueAdmin(admin.ModelAdmin):
    list_display = (
        "variant",
        "option",
        "value",
    )

    search_fields = (
        "variant__sku",
        "variant__name",
        "option__name",
        "value__value",
    )

    autocomplete_fields = (
        "variant",
        "option",
        "value",
    )


@admin.register(ProductMedia)
class ProductMediaAdmin(admin.ModelAdmin):
    list_display = (
        "title",
        "product",
        "variant",
        "media_type",
        "is_primary",
        "is_active",
        "sort_order",
    )

    list_filter = (
        "media_type",
        "is_primary",
        "is_active",
    )

    search_fields = (
        "title",
        "alt_text",
        "product__name",
        "variant__sku",
    )

    autocomplete_fields = (
        "product",
        "variant",
    )