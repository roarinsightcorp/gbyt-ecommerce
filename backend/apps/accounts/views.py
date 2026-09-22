
from django.conf import settings
from django.middleware.csrf import get_token
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import ensure_csrf_cookie

from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView

from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import (
    TokenObtainPairSerializer,
    TokenRefreshSerializer,
)
from rest_framework_simplejwt.tokens import RefreshToken

from .authentication import CookieJWTAuthentication
from .models import Address, User
from .serializers import (
    AddressSerializer,
    MeSerializer,
    RegisterSerializer,
)


ACCESS_COOKIE_NAME = "gbyt_access"
REFRESH_COOKIE_NAME = "gbyt_refresh"


def set_auth_cookies(
    response,
    access_token,
    refresh_token,
):
    """
    Store authentication JWTs in HttpOnly cookies.

    The access token is available to the API through the cookie,
    but cannot be read by frontend JavaScript.

    The refresh token has a narrower path because it is only
    needed by authentication endpoints.
    """

    access_lifetime = settings.SIMPLE_JWT[
        "ACCESS_TOKEN_LIFETIME"
    ]

    refresh_lifetime = settings.SIMPLE_JWT[
        "REFRESH_TOKEN_LIFETIME"
    ]

    response.set_cookie(
        key=ACCESS_COOKIE_NAME,
        value=str(access_token),
        max_age=int(
            access_lifetime.total_seconds()
        ),
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/",
    )

    response.set_cookie(
        key=REFRESH_COOKIE_NAME,
        value=str(refresh_token),
        max_age=int(
            refresh_lifetime.total_seconds()
        ),
        httponly=True,
        secure=settings.AUTH_COOKIE_SECURE,
        samesite=settings.AUTH_COOKIE_SAMESITE,
        path="/api/v1/auth/",
    )


def clear_auth_cookies(response):
    """
    Delete the authentication cookies.
    """

    response.delete_cookie(
        key=ACCESS_COOKIE_NAME,
        path="/",
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )

    response.delete_cookie(
        key=REFRESH_COOKIE_NAME,
        path="/api/v1/auth/",
        samesite=settings.AUTH_COOKIE_SAMESITE,
    )


class CSRFTokenView(APIView):
    """
    Return a CSRF token to the frontend.

    The CSRF cookie itself must remain readable by JavaScript.
    The authentication JWT cookies remain HttpOnly.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    @method_decorator(ensure_csrf_cookie)
    def get(self, request):
        return Response(
            {
                "csrfToken": get_token(request),
            },
            status=status.HTTP_200_OK,
        )


class LoginView(APIView):
    """
    Authenticate using SimpleJWT and store the resulting tokens
    in HttpOnly cookies.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = TokenObtainPairSerializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        access_token = serializer.validated_data[
            "access"
        ]

        refresh_token = serializer.validated_data[
            "refresh"
        ]

        email = request.data.get("email", "").strip().lower()

        user = User.objects.get(
            email=email
        )

        response = Response(
            {
                "message": "Login successful.",
                "user": MeSerializer(user).data,
            },
            status=status.HTTP_200_OK,
        )

        set_auth_cookies(
            response,
            access_token,
            refresh_token,
        )

        return response


class RegisterView(generics.CreateAPIView):
    """
    Create a customer account and immediately authenticate
    the new browser session.
    """

    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        serializer = self.get_serializer(
            data=request.data
        )

        serializer.is_valid(
            raise_exception=True
        )

        user = serializer.save()

        refresh = RefreshToken.for_user(user)

        response = Response(
            {
                "message": (
                    "Account created successfully."
                ),
                "user": MeSerializer(user).data,
            },
            status=status.HTTP_201_CREATED,
        )

        set_auth_cookies(
            response,
            refresh.access_token,
            refresh,
        )

        return response


class RefreshTokenView(APIView):
    """
    Refresh authentication using the HttpOnly refresh cookie.

    SimpleJWT's TokenRefreshSerializer remains responsible for
    validation, rotation, and blacklist behavior.
    """

    permission_classes = [permissions.AllowAny]
    authentication_classes = []

    def post(self, request):
        refresh_token = request.COOKIES.get(
            REFRESH_COOKIE_NAME
        )

        if not refresh_token:
            return Response(
                {
                    "detail": (
                        "Refresh token is required."
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

        serializer = TokenRefreshSerializer(
            data={
                "refresh": refresh_token,
            }
        )

        try:
            serializer.is_valid(
                raise_exception=True
            )
        except TokenError:
            response = Response(
                {
                    "detail": (
                        "Authentication session "
                        "has expired."
                    )
                },
                status=status.HTTP_401_UNAUTHORIZED,
            )

            clear_auth_cookies(response)

            return response

        access_token = serializer.validated_data[
            "access"
        ]

        # With ROTATE_REFRESH_TOKENS=True, SimpleJWT
        # returns a new refresh token.
        new_refresh_token = serializer.validated_data.get(
            "refresh"
        )

        response = Response(
            {
                "message": (
                    "Authentication refreshed."
                )
            },
            status=status.HTTP_200_OK,
        )

        if new_refresh_token:
            set_auth_cookies(
                response,
                access_token,
                new_refresh_token,
            )
        else:
            # This branch supports configurations where
            # refresh rotation is disabled.
            response.set_cookie(
                key=ACCESS_COOKIE_NAME,
                value=str(access_token),
                max_age=int(
                    settings.SIMPLE_JWT[
                        "ACCESS_TOKEN_LIFETIME"
                    ].total_seconds()
                ),
                httponly=True,
                secure=settings.AUTH_COOKIE_SECURE,
                samesite=settings.AUTH_COOKIE_SAMESITE,
                path="/",
            )

        return response


class LogoutView(APIView):
    """
    Blacklist the refresh token and clear authentication
    cookies.
    """

    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [
        CookieJWTAuthentication
    ]

    def post(self, request):
        refresh_token = request.COOKIES.get(
            REFRESH_COOKIE_NAME
        )

        if refresh_token:
            try:
                token = RefreshToken(
                    refresh_token
                )
                token.blacklist()
            except TokenError:
                pass

        response = Response(
            {
                "message": (
                    "Logged out successfully."
                )
            },
            status=status.HTTP_200_OK,
        )

        clear_auth_cookies(response)

        return response


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = MeSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]
    authentication_classes = [
        CookieJWTAuthentication
    ]

    def get_object(self):
        return self.request.user


class AddressListCreateView(
    generics.ListCreateAPIView
):
    serializer_class = AddressSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]
    authentication_classes = [
        CookieJWTAuthentication
    ]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )


class AddressDetailView(
    generics.RetrieveUpdateDestroyAPIView
):
    serializer_class = AddressSerializer
    permission_classes = [
        permissions.IsAuthenticated
    ]
    authentication_classes = [
        CookieJWTAuthentication
    ]

    def get_queryset(self):
        return Address.objects.filter(
            user=self.request.user
        )
