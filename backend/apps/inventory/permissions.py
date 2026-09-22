from rest_framework.permissions import BasePermission


class IsInventoryStaff(BasePermission):
    message = "You do not have permission to manage inventory."

    allowed_roles = {
        "STAFF",
        "SUPER_ADMIN",
        "ADMIN",
        "MANAGER",
        "INVENTORY_STAFF",
    }

    def has_permission(self, request, view):
        user = request.user

        if not user or not user.is_authenticated:
            return False

        if user.is_superuser:
            return True

        return getattr(user, "role", None) in self.allowed_roles