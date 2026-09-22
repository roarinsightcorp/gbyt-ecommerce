from django.core.exceptions import ValidationError as DjangoValidationError
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import (
    CartItemCreateSerializer,
    CartItemSerializer,
    CartItemUpdateSerializer,
    CartSerializer,
    WishlistItemCreateSerializer,
    WishlistItemSerializer,
    WishlistSerializer,
)
from .services import (
    add_to_cart,
    add_to_wishlist,
    clear_cart,
    get_or_create_cart,
    get_or_create_wishlist,
    remove_from_cart,
    remove_from_wishlist,
    update_cart_item,
)


def validation_error_response(exc):
    return Response(
        {"detail": str(exc)},
        status=status.HTTP_400_BAD_REQUEST,
    )


class CartView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        cart = (
            get_or_create_cart(request.user)
        )

        cart = (
            type(cart).objects
            .prefetch_related(
                "items__variant__product__media"
            )
            .get(pk=cart.pk)
        )

        return Response(
            CartSerializer(cart).data
        )

    def delete(self, request):
        cart = clear_cart(request.user)

        return Response(
            CartSerializer(cart).data,
            status=status.HTTP_200_OK,
        )


class CartItemCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CartItemCreateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            item = add_to_cart(
                user=request.user,
                variant_id=serializer.validated_data["variant"],
                quantity=serializer.validated_data["quantity"],
            )
        except DjangoValidationError as exc:
            return validation_error_response(exc)

        item = (
            type(item).objects
            .select_related(
                "variant",
                "variant__product",
            )
            .prefetch_related(
                "variant__product__media"
            )
            .get(pk=item.pk)
        )

        return Response(
            CartItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class CartItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def patch(self, request, pk):
        serializer = CartItemUpdateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            item = update_cart_item(
                user=request.user,
                item_id=pk,
                quantity=serializer.validated_data["quantity"],
            )
        except DjangoValidationError as exc:
            return validation_error_response(exc)

        return Response(
            CartItemSerializer(item).data
        )

    def delete(self, request, pk):
        try:
            remove_from_cart(
                user=request.user,
                item_id=pk,
            )
        except DjangoValidationError as exc:
            return validation_error_response(exc)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )


class WishlistView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        wishlist = get_or_create_wishlist(request.user)

        wishlist = (
            type(wishlist).objects
            .prefetch_related(
                "items__variant__product"
            )
            .get(pk=wishlist.pk)
        )

        return Response(
            WishlistSerializer(wishlist).data
        )


class WishlistItemCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = WishlistItemCreateSerializer(
            data=request.data
        )
        serializer.is_valid(raise_exception=True)

        try:
            item = add_to_wishlist(
                user=request.user,
                variant_id=serializer.validated_data["variant"],
            )
        except DjangoValidationError as exc:
            return validation_error_response(exc)

        item = (
            type(item).objects
            .select_related(
                "variant",
                "variant__product",
            )
            .get(pk=item.pk)
        )

        return Response(
            WishlistItemSerializer(item).data,
            status=status.HTTP_201_CREATED,
        )


class WishlistItemDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            remove_from_wishlist(
                user=request.user,
                item_id=pk,
            )
        except DjangoValidationError as exc:
            return validation_error_response(exc)

        return Response(
            status=status.HTTP_204_NO_CONTENT
        )