from django.db.models import F
from rest_framework import status
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import (
    InventoryItem,
    InventoryLocation,
    InventoryMovement,
)
from .permissions import IsInventoryStaff
from .serializers import (
    InventoryItemSerializer,
    InventoryLocationSerializer,
    InventoryMovementSerializer,
    StockOperationSerializer,
)
from .services import (
    adjust_stock,
    receive_stock,
    remove_stock,
    release_stock,
    reserve_stock,
)


class InventoryLocationListCreateView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def get(self, request):
        locations = InventoryLocation.objects.all()

        serializer = InventoryLocationSerializer(
            locations,
            many=True,
        )

        return Response(serializer.data)

    def post(self, request):
        serializer = InventoryLocationSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)
        location = serializer.save()

        return Response(
            InventoryLocationSerializer(location).data,
            status=status.HTTP_201_CREATED,
        )


class InventoryItemListView(ListAPIView):
    serializer_class = InventoryItemSerializer
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def get_queryset(self):
        queryset = (
            InventoryItem.objects
            .select_related(
                "variant",
                "variant__product",
                "location",
            )
            .filter(is_active=True)
        )

        location = self.request.query_params.get(
            "location"
        )

        sku = self.request.query_params.get("sku")

        low_stock = self.request.query_params.get(
            "low_stock"
        )

        if location:
            queryset = queryset.filter(
                location_id=location
            )

        if sku:
            queryset = queryset.filter(
                variant__sku__iexact=sku
            )

        if low_stock and low_stock.lower() in [
            "true",
            "1",
            "yes",
        ]:
            queryset = queryset.filter(
                quantity__lte=F("reserved_quantity")
                + F("reorder_level")
            )

        return queryset


class InventoryMovementListView(ListAPIView):
    serializer_class = InventoryMovementSerializer
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def get_queryset(self):
        queryset = (
            InventoryMovement.objects
            .select_related(
                "inventory_item",
                "inventory_item__variant",
                "performed_by",
            )
        )

        inventory_item = self.request.query_params.get(
            "inventory_item"
        )

        movement_type = self.request.query_params.get(
            "movement_type"
        )

        if inventory_item:
            queryset = queryset.filter(
                inventory_item_id=inventory_item
            )

        if movement_type:
            queryset = queryset.filter(
                movement_type=movement_type.upper()
            )

        return queryset


class ReceiveStockView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def post(self, request):
        serializer = StockOperationSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        inventory, movement = receive_stock(
            inventory_item=data["inventory_item"],
            quantity=data["quantity"],
            performed_by=request.user,
            reference=data.get("reference", ""),
            notes=data.get("notes", ""),
        )

        return Response(
            {
                "inventory": InventoryItemSerializer(
                    inventory
                ).data,
                "movement": InventoryMovementSerializer(
                    movement
                ).data,
            },
            status=status.HTTP_200_OK,
        )


class RemoveStockView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def post(self, request):
        serializer = StockOperationSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        inventory, movement = remove_stock(
            inventory_item=data["inventory_item"],
            quantity=data["quantity"],
            performed_by=request.user,
            reference=data.get("reference", ""),
            notes=data.get("notes", ""),
        )

        return Response(
            {
                "inventory": InventoryItemSerializer(
                    inventory
                ).data,
                "movement": InventoryMovementSerializer(
                    movement
                ).data,
            }
        )


class ReserveStockView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def post(self, request):
        serializer = StockOperationSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        inventory, movement = reserve_stock(
            inventory_item=data["inventory_item"],
            quantity=data["quantity"],
            performed_by=request.user,
            reference=data.get("reference", ""),
            notes=data.get("notes", ""),
        )

        return Response(
            {
                "inventory": InventoryItemSerializer(
                    inventory
                ).data,
                "movement": InventoryMovementSerializer(
                    movement
                ).data,
            }
        )


class ReleaseStockView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def post(self, request):
        serializer = StockOperationSerializer(
            data=request.data
        )

        serializer.is_valid(raise_exception=True)

        data = serializer.validated_data

        inventory, movement = release_stock(
            inventory_item=data["inventory_item"],
            quantity=data["quantity"],
            performed_by=request.user,
            reference=data.get("reference", ""),
            notes=data.get("notes", ""),
        )

        return Response(
            {
                "inventory": InventoryItemSerializer(
                    inventory
                ).data,
                "movement": InventoryMovementSerializer(
                    movement
                ).data,
            }
        )


class AdjustStockView(APIView):
    permission_classes = [
        IsAuthenticated,
        IsInventoryStaff,
    ]

    def post(self, request):
        inventory_item_id = request.data.get(
            "inventory_item"
        )
        new_quantity = request.data.get(
            "quantity"
        )

        if inventory_item_id is None:
            return Response(
                {
                    "inventory_item": [
                        "This field is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        if new_quantity is None:
            return Response(
                {
                    "quantity": [
                        "This field is required."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            new_quantity = int(new_quantity)
        except (TypeError, ValueError):
            return Response(
                {
                    "quantity": [
                        "Quantity must be an integer."
                    ]
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            inventory_item = InventoryItem.objects.get(
                pk=inventory_item_id,
                is_active=True,
            )
        except InventoryItem.DoesNotExist:
            return Response(
                {
                    "inventory_item": [
                        "Inventory item not found."
                    ]
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        inventory, movement = adjust_stock(
            inventory_item=inventory_item,
            new_quantity=new_quantity,
            performed_by=request.user,
            reference=request.data.get(
                "reference",
                "",
            ),
            notes=request.data.get(
                "notes",
                "",
            ),
        )

        return Response(
            {
                "inventory": InventoryItemSerializer(
                    inventory
                ).data,
                "movement": InventoryMovementSerializer(
                    movement
                ).data,
            }
        )