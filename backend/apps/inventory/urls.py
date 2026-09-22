from django.urls import path

from .views import (
    AdjustStockView,
    InventoryItemListView,
    InventoryLocationListCreateView,
    InventoryMovementListView,
    ReceiveStockView,
    RemoveStockView,
    ReleaseStockView,
    ReserveStockView,
)


urlpatterns = [
    path(
        "inventory/locations/",
        InventoryLocationListCreateView.as_view(),
        name="inventory-location-list-create",
    ),

    path(
        "inventory/items/",
        InventoryItemListView.as_view(),
        name="inventory-item-list",
    ),

    path(
        "inventory/movements/",
        InventoryMovementListView.as_view(),
        name="inventory-movement-list",
    ),

    path(
        "inventory/receive/",
        ReceiveStockView.as_view(),
        name="inventory-receive",
    ),

    path(
        "inventory/remove/",
        RemoveStockView.as_view(),
        name="inventory-remove",
    ),

    path(
        "inventory/reserve/",
        ReserveStockView.as_view(),
        name="inventory-reserve",
    ),

    path(
        "inventory/release/",
        ReleaseStockView.as_view(),
        name="inventory-release",
    ),

    path(
        "inventory/adjust/",
        AdjustStockView.as_view(),
        name="inventory-adjust",
    ),
]