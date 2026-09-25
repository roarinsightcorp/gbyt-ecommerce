 
from django.urls import path

from .views import (
    AddressDetailView,
    AddressListCreateView,
    AdminAccessView,
    AdminCreateStaffView,
    AdminCustomerProfileUpdateView,
    AdminStaffProfileUpdateView,
    AdminUserDetailView,
    AdminUserListView,
    AdminUserSummaryView,
    CSRFTokenView,
    LoginView,
    LogoutView,
    MeView,
    RefreshTokenView,
    RegisterView,
)


urlpatterns = [
    # ========================================================
    # AUTHENTICATION
    # ========================================================

    path(
        "auth/csrf/",
        CSRFTokenView.as_view(),
        name="csrf",
    ),

    path(
        "auth/register/",
        RegisterView.as_view(),
        name="register",
    ),

    path(
        "auth/login/",
        LoginView.as_view(),
        name="login",
    ),

    path(
        "auth/refresh/",
        RefreshTokenView.as_view(),
        name="token_refresh",
    ),

    path(
        "auth/logout/",
        LogoutView.as_view(),
        name="logout",
    ),

    # ========================================================
    # ACCOUNT
    # ========================================================

    path(
        "account/me/",
        MeView.as_view(),
        name="me",
    ),

    path(
        "account/addresses/",
        AddressListCreateView.as_view(),
        name="address-list-create",
    ),

    path(
        "account/addresses/<int:pk>/",
        AddressDetailView.as_view(),
        name="address-detail",
    ),
    path(
        "admin/access/",
        AdminAccessView.as_view(),
        name="admin-access",
    ),
    path(
        "admin/users/summary/",
        AdminUserSummaryView.as_view(),
        name="admin-user-summary",
    ),
    path(
        "admin/users/",
        AdminUserListView.as_view(),
        name="admin-user-list",
    ),
    path(
        "admin/users/<int:pk>/",
        AdminUserDetailView.as_view(),
        name="admin-user-detail",
    ),
    path(
        "admin/users/staff/",
        AdminCreateStaffView.as_view(),
        name="admin-create-staff",
    ),
    path(
        "admin/users/<int:pk>/customer-profile/",
        AdminCustomerProfileUpdateView.as_view(),
        name="admin-customer-profile-update",
    ),
    path(
        "admin/users/<int:pk>/staff-profile/",
        AdminStaffProfileUpdateView.as_view(),
        name="admin-staff-profile-update",
    ),

]
