from django.contrib import admin

from .models import Address, CustomerProfile, StaffProfile, User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = (
        "email",
        "first_name",
        "last_name",
        "role",
        "is_active",
        "is_email_verified",
        "date_joined",
    )

    list_filter = (
        "role",
        "is_active",
        "is_email_verified",
        "is_staff",
    )

    search_fields = (
        "email",
        "first_name",
        "last_name",
    )

    ordering = ("-date_joined",)


@admin.register(CustomerProfile)
class CustomerProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "phone_number",
        "created_at",
    )

    search_fields = (
        "user__email",
        "user__first_name",
        "user__last_name",
    )


@admin.register(StaffProfile)
class StaffProfileAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "job_title",
        "employee_id",
        "phone_number",
    )

    search_fields = (
        "user__email",
        "employee_id",
    )


@admin.register(Address)
class AddressAdmin(admin.ModelAdmin):
    list_display = (
        "user",
        "address_type",
        "city",
        "state",
        "country",
        "is_default",
    )

    list_filter = (
        "address_type",
        "country",
        "state",
        "is_default",
    )

    search_fields = (
        "user__email",
        "city",
        "state",
    )