
from django.urls import path

from .views import (
    AdminProductDetailView,
    AdminProductListCreateView,
    AdminProductOptionDetailView,
    AdminProductOptionListCreateView,
    AdminProductOptionValueDetailView,
    AdminProductOptionValueListCreateView,
    AdminProductRelationshipDetailView,
    AdminProductRelationshipListCreateView,
    AdminProductVariantDetailView,
    AdminProductVariantListCreateView,
    AdminVariantOptionValueDetailView,
    AdminVariantOptionValueListCreateView,
    CategoryDetailView,
    CategoryListView,
    ProductDetailView,
    ProductListView,
    ProductMediaUploadView,
)
from .storage_views import catalog_media

urlpatterns = [
    # ------------------------------------------------------------------
    # Public catalog
    # ------------------------------------------------------------------
    path(
        "media/<path:key>",
        catalog_media,
        name="catalog-media",
    ),
    path(
        "categories/",
        CategoryListView.as_view(),
        name="category-list",
    ),
    path(
        "categories/<slug:slug>/",
        CategoryDetailView.as_view(),
        name="category-detail",
    ),
    path(
        "products/",
        ProductListView.as_view(),
        name="product-list",
    ),
    path(
        "products/<slug:slug>/",
        ProductDetailView.as_view(),
        name="product-detail",
    ),
    path(
        "products/<slug:slug>/media/upload/",
        ProductMediaUploadView.as_view(),
        name="product-media-upload",
    ),

    # ------------------------------------------------------------------
    # Admin products
    # ------------------------------------------------------------------
    path(
        "admin/products/",
        AdminProductListCreateView.as_view(),
        name="admin-product-list-create",
    ),
    path(
        "admin/products/<slug:slug>/",
        AdminProductDetailView.as_view(),
        name="admin-product-detail",
    ),

    # ------------------------------------------------------------------
    # Admin product options
    # ------------------------------------------------------------------
    path(
        "admin/products/<slug:slug>/options/",
        AdminProductOptionListCreateView.as_view(),
        name="admin-product-option-list-create",
    ),
    path(
        "admin/products/<slug:slug>/options/<int:option_id>/",
        AdminProductOptionDetailView.as_view(),
        name="admin-product-option-detail",
    ),

    # ------------------------------------------------------------------
    # Admin option values
    # ------------------------------------------------------------------
    path(
        "admin/products/<slug:slug>/options/<int:option_id>/values/",
        AdminProductOptionValueListCreateView.as_view(),
        name="admin-product-option-value-list-create",
    ),
    path(
        "admin/products/<slug:slug>/options/<int:option_id>/values/<int:value_id>/",
        AdminProductOptionValueDetailView.as_view(),
        name="admin-product-option-value-detail",
    ),

    # ------------------------------------------------------------------
    # Admin product variants
    # ------------------------------------------------------------------
    path(
        "admin/products/<slug:slug>/variants/",
        AdminProductVariantListCreateView.as_view(),
        name="admin-product-variant-list-create",
    ),
    path(
        "admin/products/<slug:slug>/variants/<int:variant_id>/",
        AdminProductVariantDetailView.as_view(),
        name="admin-product-variant-detail",
    ),

    # ------------------------------------------------------------------
    # Admin variant option assignments
    # ------------------------------------------------------------------
    path(
        "admin/products/<slug:slug>/variants/<int:variant_id>/options/",
        AdminVariantOptionValueListCreateView.as_view(),
        name="admin-variant-option-value-list-create",
    ),
    path(
        "admin/products/<slug:slug>/variants/<int:variant_id>/options/<int:assignment_id>/",
        AdminVariantOptionValueDetailView.as_view(),
        name="admin-variant-option-value-detail",
    ),

    # ------------------------------------------------------------------
    # Admin product relationships
    # ------------------------------------------------------------------
    path(
        "admin/products/<slug:slug>/relationships/",
        AdminProductRelationshipListCreateView.as_view(),
        name="admin-product-relationship-list-create",
    ),
    path(
        "admin/products/<slug:slug>/relationships/<int:relationship_id>/",
        AdminProductRelationshipDetailView.as_view(),
        name="admin-product-relationship-detail",
    ),
]
