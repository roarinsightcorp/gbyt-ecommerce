from django.db import transaction
from rest_framework import serializers

from .models import Address, CustomerProfile, User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_email_verified",
            "date_joined",
        ]
        read_only_fields = [
            "id",
            "email",
            "role",
            "is_email_verified",
            "date_joined",
        ]


class CustomerProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomerProfile
        fields = [
            "phone_number",
            "date_of_birth",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "created_at",
            "updated_at",
        ]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        min_length=8,
        style={"input_type": "password"},
    )
    password_confirm = serializers.CharField(
        write_only=True,
        style={"input_type": "password"},
    )

    class Meta:
        model = User
        fields = [
            "email",
            "first_name",
            "last_name",
            "password",
            "password_confirm",
        ]

    def validate_email(self, value):
        value = value.lower().strip()

        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError(
                "A user with this email already exists."
            )

        return value

    def validate(self, attrs):
        if attrs["password"] != attrs["password_confirm"]:
            raise serializers.ValidationError(
                {"password_confirm": "Passwords do not match."}
            )

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        validated_data.pop("password_confirm")

        password = validated_data.pop("password")

        user = User.objects.create_user(
            password=password,
            role=User.Role.CUSTOMER,
            **validated_data,
        )

        CustomerProfile.objects.create(user=user)

        return user


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = [
            "id",
            "address_type",
            "first_name",
            "last_name",
            "phone_number",
            "address_line_1",
            "address_line_2",
            "city",
            "state",
            "country",
            "postal_code",
            "is_default",
            "created_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "created_at",
            "updated_at",
        ]

    def validate(self, attrs):
        user = self.context["request"].user

        if attrs.get("is_default"):
            Address.objects.filter(
                user=user,
                address_type=attrs.get(
                    "address_type",
                    Address.AddressType.SHIPPING,
                ),
                is_default=True,
            ).exclude(
                pk=self.instance.pk if self.instance else None
            ).update(is_default=False)

        return attrs

    def create(self, validated_data):
        return Address.objects.create(
            user=self.context["request"].user,
            **validated_data,
        )


class MeSerializer(serializers.ModelSerializer):
    customer_profile = CustomerProfileSerializer(read_only=True)

    class Meta:
        model = User
        fields = [
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "is_email_verified",
            "date_joined",
            "customer_profile",
        ]
        read_only_fields = fields