from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """
    Allows access to authenticated staff members.

    Staff users have:
        role = STAFF
        is_staff = True

    Customers are denied.
    """

    message = "Staff access is required."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_staff
            and user.role == "STAFF"
        )


class IsSuperAdmin(BasePermission):
    """
    Allows access only to Django superusers.

    Super admins are represented by:
        role = STAFF
        is_staff = True
        is_superuser = True
    """

    message = "Super administrator access is required."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_superuser
            and user.is_staff
            and user.role == "STAFF"
        )