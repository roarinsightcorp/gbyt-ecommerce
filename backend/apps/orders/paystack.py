import hashlib
import hmac
import logging
from decimal import Decimal

import requests
from django.conf import settings
from django.db import transaction
from django.utils import timezone

from .models import Order, Payment

logger = logging.getLogger(__name__)


class PaystackError(Exception):
    """Raised when a Paystack operation fails."""

    pass


class PaystackClient:
    """
    Small wrapper around the Paystack API.

    Secret key is only used server-side.
    """

    def __init__(self):
        self.secret_key = settings.PAYSTACK_SECRET_KEY
        self.base_url = settings.PAYSTACK_BASE_URL.rstrip("/")

        if not self.secret_key:
            raise PaystackError(
                "PAYSTACK_SECRET_KEY is not configured."
            )

    @property
    def headers(self):
        return {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json",
        }

    def initialize_transaction(
        self,
        *,
        email,
        amount,
        reference,
        currency="NGN",
        callback_url=None,
        metadata=None,
    ):
        """
        Initialize a Paystack transaction.

        Paystack expects amount in the smallest currency unit.
        For NGN:

            ₦16,000.00 -> 1600000 kobo
        """

        amount = Decimal(str(amount))

        if amount <= 0:
            raise PaystackError(
                "Payment amount must be greater than zero."
            )

        amount_in_subunit = int(
            amount * Decimal("100")
        )

        payload = {
            "email": email,
            "amount": str(amount_in_subunit),
            "currency": currency,
            "reference": reference,
        }

        if callback_url:
            payload["callback_url"] = callback_url

        if metadata:
            payload["metadata"] = metadata

        try:
            response = requests.post(
                f"{self.base_url}/transaction/initialize",
                headers=self.headers,
                json=payload,
                timeout=30,
            )
        except requests.RequestException as exc:
            logger.exception(
                "Paystack initialization request failed."
            )
            raise PaystackError(
                "Unable to connect to Paystack."
            ) from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise PaystackError(
                "Paystack returned an invalid response."
            ) from exc

        if not response.ok or not data.get("status"):
            message = data.get(
                "message",
                "Paystack transaction initialization failed.",
            )

            raise PaystackError(message)

        transaction_data = data.get("data") or {}

        authorization_url = transaction_data.get(
            "authorization_url"
        )
        access_code = transaction_data.get(
            "access_code"
        )
        returned_reference = transaction_data.get(
            "reference"
        )

        if not authorization_url:
            raise PaystackError(
                "Paystack did not return an authorization URL."
            )

        if returned_reference and returned_reference != reference:
            raise PaystackError(
                "Paystack returned an unexpected transaction reference."
            )

        return {
            "authorization_url": authorization_url,
            "access_code": access_code,
            "reference": returned_reference or reference,
            "raw_response": data,
        }

    def verify_transaction(self, reference):
        """
        Verify a transaction using its Paystack reference.
        """

        if not reference:
            raise PaystackError(
                "Transaction reference is required."
            )

        try:
            response = requests.get(
                f"{self.base_url}/transaction/verify/{reference}",
                headers=self.headers,
                timeout=30,
            )
        except requests.RequestException as exc:
            logger.exception(
                "Paystack verification request failed."
            )
            raise PaystackError(
                "Unable to connect to Paystack."
            ) from exc

        try:
            data = response.json()
        except ValueError as exc:
            raise PaystackError(
                "Paystack returned an invalid verification response."
            ) from exc

        if not response.ok or not data.get("status"):
            message = data.get(
                "message",
                "Paystack transaction verification failed.",
            )

            raise PaystackError(message)

        transaction_data = data.get("data") or {}

        return {
            "data": transaction_data,
            "raw_response": data,
        }

    def verify_webhook_signature(
        self,
        payload: bytes,
        signature: str,
    ):
        """
        Verify Paystack webhook authenticity.

        Paystack signs the raw request body using HMAC SHA512.
        """

        if not signature:
            return False

        expected_signature = hmac.new(
            self.secret_key.encode("utf-8"),
            payload,
            hashlib.sha512,
        ).hexdigest()

        return hmac.compare_digest(
            expected_signature,
            signature,
        )


paystack_client = PaystackClient


def initialize_order_payment(order):
    """
    Initialize Paystack payment for an existing order.

    Returns the updated Payment instance.
    """

    if order.payment_status == Order.PaymentStatus.PAID:
        raise PaystackError(
            "This order has already been paid."
        )

    payment = Payment.objects.get(order=order)

    client = PaystackClient()

    result = client.initialize_transaction(
        email=order.user.email,
        amount=order.total_amount,
        reference=payment.reference,
        currency=order.currency,
        callback_url=settings.PAYSTACK_CALLBACK_URL,
        metadata={
            "order_number": order.order_number,
            "payment_reference": payment.reference,
            "user_id": str(order.user_id),
        },
    )

    payment.authorization_url = result[
        "authorization_url"
    ]

    payment.access_code = result[
        "access_code"
    ]

    payment.gateway_response = result[
        "raw_response"
    ]

    payment.save(
        update_fields=[
            "authorization_url",
            "access_code",
            "gateway_response",
            "updated_at",
        ]
    )

    return payment


@transaction.atomic
def process_successful_payment(
    *,
    payment,
    gateway_data,
):
    """
    Convert a successful Paystack transaction into a
    paid order and finalize reserved inventory.

    This operation is idempotent.

    If Paystack sends the same successful event twice,
    inventory must NOT be deducted twice.
    """

    payment = (
        Payment.objects
        .select_for_update()
        .select_related("order")
        .get(pk=payment.pk)
    )

    order = (
        Order.objects
        .select_for_update()
        .get(pk=payment.order_id)
    )

    # Already processed.
    if (
        payment.status == Payment.Status.SUCCESS
        and order.payment_status == Order.PaymentStatus.PAID
    ):
        return order, payment

    gateway_status = gateway_data.get("status")

    if gateway_status != "success":
        raise PaystackError(
            f"Payment is not successful. "
            f"Gateway status: {gateway_status}"
        )

    gateway_reference = gateway_data.get(
        "reference"
    )

    if gateway_reference != payment.reference:
        raise PaystackError(
            "Payment reference does not match."
        )

    gateway_amount = gateway_data.get("amount")

    if gateway_amount is None:
        raise PaystackError(
            "Paystack response did not contain an amount."
        )

    expected_amount = int(
        Decimal(str(order.total_amount)) * Decimal("100")
    )

    if int(gateway_amount) != expected_amount:
        raise PaystackError(
            "Payment amount does not match the order total."
        )

    gateway_currency = gateway_data.get(
        "currency",
        order.currency,
    )

    if gateway_currency != order.currency:
        raise PaystackError(
            "Payment currency does not match the order currency."
        )

    payment.status = Payment.Status.SUCCESS
    payment.paid_at = timezone.now()
    payment.gateway_response = gateway_data

    payment.save(
        update_fields=[
            "status",
            "paid_at",
            "gateway_response",
            "updated_at",
        ]
    )

    order.payment_status = Order.PaymentStatus.PAID
    order.status = Order.Status.PAID
    order.paid_at = timezone.now()

    order.save(
        update_fields=[
            "payment_status",
            "status",
            "paid_at",
            "updated_at",
        ]
    )

    # Finalize inventory.
    #
    # Import here to avoid an unnecessary module-level
    # dependency cycle.
    from .services import finalize_order_inventory

    finalize_order_inventory(order)

    order.refresh_from_db()
    '''order.save(
        update_fields=[
            "status",
            "updated_at",
        ]
    )'''

    return order, payment


def verify_and_process_payment(payment_reference):
    """
    Verify a payment directly against Paystack and process it
    if successful.
    """

    payment = (
        Payment.objects
        .select_related("order")
        .get(reference=payment_reference)
    )

    client = PaystackClient()

    result = client.verify_transaction(
        payment.reference
    )

    gateway_data = result["data"]

    order, payment = process_successful_payment(
        payment=payment,
        gateway_data=gateway_data,
    )

    return order, payment, gateway_data