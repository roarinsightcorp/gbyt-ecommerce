from django.urls import path

from .views import (
    CartItemCreateView,
    CartItemDetailView,
    CartView,
    WishlistItemCreateView,
    WishlistItemDetailView,
    WishlistView,
)

urlpatterns = [
    path(
        "cart/",
        CartView.as_view(),
        name="cart",
    ),
    path(
        "cart/items/",
        CartItemCreateView.as_view(),
        name="cart-item-create",
    ),
    path(
        "cart/items/<int:pk>/",
        CartItemDetailView.as_view(),
        name="cart-item-detail",
    ),
    path(
        "wishlist/",
        WishlistView.as_view(),
        name="wishlist",
    ),
    path(
        "wishlist/items/",
        WishlistItemCreateView.as_view(),
        name="wishlist-item-create",
    ),
    path(
        "wishlist/items/<int:pk>/",
        WishlistItemDetailView.as_view(),
        name="wishlist-item-detail",
    ),
]