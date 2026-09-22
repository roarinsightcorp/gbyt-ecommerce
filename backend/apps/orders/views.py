from django.core.exceptions import ValidationError as DjangoValidationError
from django.db.models import Prefetch
import logging


from rest_framework import status
from rest_framework.generics import ListAPIView, RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

from .paystack import (
    PaystackClient,
    PaystackError,
    initialize_order_payment,
    verify_and_process_payment,
)

from .models import Order, OrderItem, Payment
from .serializers import CheckoutSerializer, OrderSerializer
from .services import create_checkout_order


class CheckoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = CheckoutSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        try:
            order, payment = create_checkout_order(
                user=request.user,
                shipping_address_id=serializer.validated_data.get(
                    "shipping_address_id"
                ),
                customer_note=serializer.validated_data.get(
                    "customer_note",
                    "",
                ),
            )

        except DjangoValidationError as exc:
            return Response(
                {"detail": str(exc)},
                status=status.HTTP_400_BAD_REQUEST,
            )

        order = (
            Order.objects
            .prefetch_related(
                Prefetch(
                    "items",
                    queryset=OrderItem.objects.all(),
                ),
            )
            .select_related("payment")
            .get(pk=order.pk)
        )

        return Response(
            OrderSerializer(order).data,
            status=status.HTTP_201_CREATED,
        )


class OrderListView(ListAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .select_related("payment")
            .prefetch_related("items")
        )


class OrderDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class = OrderSerializer

    def get_queryset(self):
        return (
            Order.objects
            .filter(user=self.request.user)
            .select_related("payment")
            .prefetch_related("items")
        )

    lookup_field = "order_number"
    
class PaymentInitializeView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        order_number = request.data.get("order_number")

        if not order_number:
            return Response(
                {
                    "detail": "order_number is required."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            order = (
                Order.objects
                .select_related("payment", "user")
                .get(
                    order_number=order_number,
                    user=request.user,
                )
            )
        except Order.DoesNotExist:
            return Response(
                {
                    "detail": "Order not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        if order.payment_status == Order.PaymentStatus.PAID:
            return Response(
                {
                    "detail": "This order has already been paid."
                },
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            payment = initialize_order_payment(order)

        except PaystackError as exc:
            logger.exception(
                "Paystack initialization failed for order %s: %s",
                order.order_number,
                exc,
            )

            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_502_BAD_GATEWAY,
            )

        except Exception:
            logger.exception(
                "Unexpected error initializing payment "
                "for order %s.",
                order.order_number,
            )

            return Response(
                {
                    "detail": (
                        "An unexpected error occurred while "
                        "initializing payment."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "order_number": order.order_number,
                "payment_reference": payment.reference,
                "authorization_url": payment.authorization_url,
                "access_code": payment.access_code,
                "amount": payment.amount,
                "currency": payment.currency,
            },
            status=status.HTTP_200_OK,
        )
        
class PaymentVerifyView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, reference):
        from .models import Payment

        try:
            payment = (
                Payment.objects
                .select_related("order")
                .get(
                    reference=reference,
                    order__user=request.user,
                )
            )
        except Payment.DoesNotExist:
            return Response(
                {
                    "detail": "Payment not found."
                },
                status=status.HTTP_404_NOT_FOUND,
            )

        try:
            order, payment, gateway_data = (
                verify_and_process_payment(reference)
            )
        except PaystackError as exc:
            return Response(
                {
                    "detail": str(exc)
                },
                status=status.HTTP_400_BAD_REQUEST,
            )
        except Exception:
            return Response(
                {
                    "detail": (
                        "Unable to verify payment at this time."
                    )
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        return Response(
            {
                "order_number": order.order_number,
                "payment_reference": payment.reference,
                "payment_status": payment.status,
                "order_status": order.status,
                "gateway_status": gateway_data.get("status"),
            },
            status=status.HTTP_200_OK,
        )
        
        
class PaystackWebhookView(APIView):
    """
    Paystack webhook endpoint.

    This endpoint is intentionally public because Paystack
    must be able to reach it.

    Security comes from HMAC SHA512 signature verification.
    """

    authentication_classes = []
    permission_classes = []

    def post(self, request):
        signature = request.headers.get(
            "x-paystack-signature"
        )

        try:
            client = PaystackClient()
        except PaystackError:
            return Response(
                {
                    "detail": "Paystack is not configured."
                },
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

        if not client.verify_webhook_signature(
            request.body,
            signature,
        ):
            return Response(
                {
                    "detail": "Invalid signature."
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        event = request.data

        event_name = event.get("event")
        event_data = event.get("data") or {}

        if event_name == "charge.success":
            reference = event_data.get("reference")

            if not reference:
                return Response(
                    {
                        "detail": "Missing payment reference."
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            try:
                verify_and_process_payment(reference)
            except Payment.DoesNotExist:
                logger.warning(
                    "Received Paystack webhook for unknown "
                    "payment reference: %s",
                    reference,
                )

                # Return 200 so Paystack does not keep retrying
                # an event that belongs to another system.
                return Response(
                    {"status": True},
                    status=status.HTTP_200_OK,
                )

            except PaystackError:
                logger.exception(
                    "Paystack webhook payment processing failed."
                )

                return Response(
                    {
                        "detail": "Payment processing failed."
                    },
                    status=status.HTTP_500_INTERNAL_SERVER_ERROR,
                )

        return Response(
            {
                "status": True
            },
            status=status.HTTP_200_OK,
        )