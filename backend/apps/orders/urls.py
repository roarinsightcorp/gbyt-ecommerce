from django.urls import path

from .views import (
    CheckoutView,
    OrderDetailView,
    OrderListView,
    PaymentInitializeView,
    PaymentVerifyView,
    PaystackWebhookView,
)

urlpatterns = [
    path(
        "checkout/",
        CheckoutView.as_view(),
        name="checkout",
    ),

    path(
        "orders/",
        OrderListView.as_view(),
        name="order-list",
    ),

    path(
        "orders/<str:order_number>/",
        OrderDetailView.as_view(),
        name="order-detail",
    ),

    path(
        "payments/initialize/",
        PaymentInitializeView.as_view(),
        name="payment-initialize",
    ),

    path(
        "payments/verify/<str:reference>/",
        PaymentVerifyView.as_view(),
        name="payment-verify",
    ),

    path(
        "payments/webhook/",
        PaystackWebhookView.as_view(),
        name="paystack-webhook",
    ),
]