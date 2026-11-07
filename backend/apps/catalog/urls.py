
from django.urls import path

from .views import (
    CategoryDetailView,
    CategoryListView,
    ProductDetailView,
    ProductListView,
)
from .storage_views import catalog_media

urlpatterns = [
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
]
