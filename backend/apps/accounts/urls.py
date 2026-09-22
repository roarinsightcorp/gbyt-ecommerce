 
from django.urls import path

from .views import (
    AddressDetailView,
    AddressListCreateView,
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
]
