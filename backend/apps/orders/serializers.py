from rest_framework import serializers

from .models import Order, OrderItem, Payment


class CheckoutSerializer(serializers.Serializer):
    shipping_address_id = serializers.IntegerField(
        required=False,
        allow_null=True,
    )

    customer_note = serializers.CharField(
        required=False,
        allow_blank=True,
    )


class OrderItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = OrderItem
        fields = [
            "id",
            "variant",
            "product_name",
            "variant_name",
            "sku",
            "quantity",
            "unit_price",
            "line_total",
            "created_at",
        ]
        read_only_fields = fields


class PaymentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Payment
        fields = [
            "reference",
            "provider",
            "status",
            "amount",
            "currency",
            "authorization_url",
            "access_code",
            "paid_at",
            "created_at",
        ]
        read_only_fields = fields


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(
        many=True,
        read_only=True,
    )

    payment = PaymentSerializer(
        read_only=True,
    )

    class Meta:
        model = Order
        fields = [
            "id",
            "order_number",
            "status",
            "payment_status",
            "currency",
            "subtotal",
            "shipping_fee",
            "tax_amount",
            "discount_amount",
            "total_amount",
            "shipping_first_name",
            "shipping_last_name",
            "shipping_phone",
            "shipping_address_line_1",
            "shipping_address_line_2",
            "shipping_city",
            "shipping_state",
            "shipping_country",
            "shipping_postal_code",
            "customer_note",
            "items",
            "payment",
            "created_at",
            "updated_at",
            "paid_at",
            "cancelled_at",
        ]
        read_only_fields = fields
        
class PaymentInitializeSerializer(serializers.Serializer):
    order_number = serializers.CharField(max_length=50)