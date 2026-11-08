from rest_framework.permissions import BasePermission


class IsStaffUser(BasePermission):
    """Allows authenticated staff members."""

    message = "Staff access is required."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_staff
            and user.role == "STAFF"
        )


class IsAdmin(BasePermission):
    """Allows ordinary administrators and super administrators."""

    message = "Administrator access is required."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_staff
            and user.role == "STAFF"
            and (user.is_admin or user.is_superuser)
        )


class IsSuperAdmin(BasePermission):
    """Allows only Django super administrators."""

    message = "Super administrator access is required."

    def has_permission(self, request, view):
        user = request.user

        return bool(
            user
            and user.is_authenticated
            and user.is_staff
            and user.role == "STAFF"
            and user.is_superuser
        )
