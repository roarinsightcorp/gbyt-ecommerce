from django.db import models
from django.conf import settings
from django.db.migrations import serializer
from django.db.migrations import serializer
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
from .models import (
    Address,
    CustomerProfile,
    StaffProfile,
    User,
)
from .serializers import (
    AddressSerializer,
    AdminCustomerProfileUpdateSerializer,
    AdminStaffProfileUpdateSerializer,
    AdminUserDetailSerializer,
    AdminUserListSerializer,
    AdminUserUpdateSerializer,
    MeSerializer,
    RegisterSerializer,
)

from .permissions import IsSuperAdmin

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
class AdminAccessView(APIView):
    """
    Check whether the authenticated user can access
    the administration interface.
    """

    permission_classes = [IsSuperAdmin]
    authentication_classes = [CookieJWTAuthentication]

    def get(self, request):
        return Response(
            {
                "is_admin": True,
                "is_super_admin": True,
                "role": request.user.role,
            }
        )
class AdminUserSummaryView(APIView):
    """
    Summary statistics for the admin user-management dashboard.
    """

    permission_classes = [IsSuperAdmin]
    authentication_classes = [CookieJWTAuthentication]

    def get(self, request):
        queryset = User.objects.all()

        total_users = queryset.count()
        customers = queryset.filter(
            role=User.Role.CUSTOMER
        ).count()
        staff = queryset.filter(
            role=User.Role.STAFF
        ).count()

        active_users = queryset.filter(
            is_active=True
        ).count()
        inactive_users = queryset.filter(
            is_active=False
        ).count()

        verified_users = queryset.filter(
            is_email_verified=True
        ).count()
        unverified_users = queryset.filter(
            is_email_verified=False
        ).count()

        return Response(
            {
                "total_users": total_users,
                "customers": customers,
                "staff": staff,
                "active_users": active_users,
                "inactive_users": inactive_users,
                "verified_users": verified_users,
                "unverified_users": unverified_users,
            }
        )

class AdminUserListView(generics.ListAPIView):
    """
    Super-admin user directory.

    Supported query parameters:
        ?search=john
        ?role=CUSTOMER
        ?role=STAFF
        ?status=active
        ?status=inactive
        ?verified=true
        ?verified=false
        ?ordering=date_joined
        ?ordering=-date_joined
        ?ordering=email
        ?ordering=-email
        ?page=2
    """

    serializer_class = AdminUserListSerializer
    permission_classes = [IsSuperAdmin]
    authentication_classes = [CookieJWTAuthentication]

    def get_queryset(self):
        queryset = (
            User.objects
            .all()
            .select_related("customer_profile", "staff_profile")
        )

        search = self.request.query_params.get("search", "").strip()
        role = self.request.query_params.get("role", "").strip().upper()
        status_filter = (
            self.request.query_params.get("status", "")
            .strip()
            .lower()
        )
        verified = (
            self.request.query_params.get("verified", "")
            .strip()
            .lower()
        )
        ordering = (
            self.request.query_params.get("ordering", "")
            .strip()
        )

        # --------------------------------------------------------
        # Search
        # --------------------------------------------------------
        if search:
            queryset = queryset.filter(
                models.Q(email__icontains=search)
                | models.Q(first_name__icontains=search)
                | models.Q(last_name__icontains=search)
            )

        # --------------------------------------------------------
        # Role
        # --------------------------------------------------------
        if role in {User.Role.CUSTOMER, User.Role.STAFF}:
            queryset = queryset.filter(role=role)

        # --------------------------------------------------------
        # Account status
        # --------------------------------------------------------
        if status_filter == "active":
            queryset = queryset.filter(is_active=True)
        elif status_filter == "inactive":
            queryset = queryset.filter(is_active=False)

        # --------------------------------------------------------
        # Email verification
        # --------------------------------------------------------
        if verified == "true":
            queryset = queryset.filter(is_email_verified=True)
        elif verified == "false":
            queryset = queryset.filter(is_email_verified=False)

        # --------------------------------------------------------
        # Safe ordering
        # --------------------------------------------------------
        allowed_ordering = {
            "date_joined",
            "-date_joined",
            "email",
            "-email",
            "first_name",
            "-first_name",
            "last_name",
            "-last_name",
            "updated_at",
            "-updated_at",
        }

        if ordering in allowed_ordering:
            queryset = queryset.order_by(ordering)
        else:
            queryset = queryset.order_by("-date_joined")

        return queryset

class AdminUserDetailView(
    generics.RetrieveUpdateAPIView
):
    """
    View or update a user's safe editable fields.

    Sensitive privilege changes are handled separately.
    """

    permission_classes = [IsSuperAdmin]
    authentication_classes = [
        CookieJWTAuthentication
    ]

    def get_queryset(self):
        return User.objects.all()

    def get_serializer_class(self):
        if self.request.method in {
            "PUT",
            "PATCH",
        }:
            return AdminUserUpdateSerializer

        return AdminUserDetailSerializer

    def perform_update(self, serializer):
        from rest_framework.exceptions import ValidationError

        target_user = self.get_object()
        new_is_active = serializer.validated_data.get(
            "is_active",
            target_user.is_active,
        )

        # Never allow the currently authenticated super admin
        # to deactivate their own account.
        if (
            target_user.pk == self.request.user.pk
            and new_is_active is False
        ):
            raise ValidationError(
                {
                    "is_active": (
                        "You cannot deactivate your own account."
                    )
                }
            )

        # Protect other super administrators from accidental
        # deactivation through the ordinary user-management API.
        if (
            target_user.is_superuser
            and new_is_active is False
        ):
            raise ValidationError(
                {
                    "is_active": (
                        "Super administrator accounts cannot be "
                        "deactivated from this endpoint."
                    )
                }
            )

        serializer.save()
    
class AdminCustomerProfileUpdateView(generics.UpdateAPIView):
    """
    Update the customer profile belonging to a user.
    """

    permission_classes = [IsSuperAdmin]
    authentication_classes = [CookieJWTAuthentication]
    serializer_class = AdminCustomerProfileUpdateSerializer

    def get_queryset(self):
        return User.objects.filter(
            role=User.Role.CUSTOMER
        ).select_related("customer_profile")

    def get_object(self):
        user = super().get_object()

        try:
            return user.customer_profile
        except CustomerProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound(
                "This customer does not have a customer profile."
            )


class AdminStaffProfileUpdateView(generics.UpdateAPIView):
    """
    Update the staff profile belonging to a user.
    """

    permission_classes = [IsSuperAdmin]
    authentication_classes = [CookieJWTAuthentication]
    serializer_class = AdminStaffProfileUpdateSerializer

    def get_queryset(self):
        return User.objects.filter(
            role=User.Role.STAFF
        ).select_related("staff_profile")

    def get_object(self):
        user = super().get_object()

        try:
            return user.staff_profile
        except StaffProfile.DoesNotExist:
            from rest_framework.exceptions import NotFound

            raise NotFound(
                "This staff member does not have a staff profile."
            )

class AdminCreateStaffView(
    generics.CreateAPIView
):
    """
    Create a staff account.

    Only super administrators may create staff.
    """

    permission_classes = [IsSuperAdmin]
    authentication_classes = [
        CookieJWTAuthentication
    ]

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        from django.db import transaction
        from rest_framework.exceptions import (
            ValidationError,
        )

        email = (
            request.data.get("email", "")
            .strip()
            .lower()
        )

        password = request.data.get(
            "password",
            "",
        )

        first_name = request.data.get(
            "first_name",
            "",
        ).strip()

        last_name = request.data.get(
            "last_name",
            "",
        ).strip()

        job_title = request.data.get(
            "job_title",
            "",
        ).strip()

        employee_id = request.data.get(
            "employee_id"
        )

        phone_number = request.data.get(
            "phone_number",
            "",
        ).strip()

        if not email:
            raise ValidationError(
                {"email": "Email is required."}
            )

        if not password:
            raise ValidationError(
                {"password": "Password is required."}
            )

        if len(password) < 8:
            raise ValidationError(
                {
                    "password": (
                        "Password must be at least "
                        "8 characters."
                    )
                }
            )

        if User.objects.filter(
            email=email
        ).exists():
            raise ValidationError(
                {
                    "email": (
                        "A user with this email "
                        "already exists."
                    )
                }
            )

        if employee_id:
            employee_id = str(
                employee_id
            ).strip()

            if StaffProfile.objects.filter(
                employee_id=employee_id
            ).exists():
                raise ValidationError(
                    {
                        "employee_id": (
                            "This employee ID is "
                            "already in use."
                        )
                    }
                )

        with transaction.atomic():
            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.STAFF,
                is_staff=True,
                is_active=True,
            )

            StaffProfile.objects.create(
                user=user,
                job_title=job_title,
                employee_id=employee_id,
                phone_number=phone_number,
            )

        return Response(
            AdminUserDetailSerializer(
                user
            ).data,
            status=status.HTTP_201_CREATED,
        )
class AdminCreateStaffView(generics.CreateAPIView):
    """
    Create a staff account.

    Only super administrators may create staff.

    Employee IDs are generated automatically by the backend
    using the format:

        GBT-STAFF-0001
        GBT-STAFF-0002
        GBT-STAFF-0003
        ...
    """

    permission_classes = [IsSuperAdmin]
    authentication_classes = [
        CookieJWTAuthentication
    ]

    def create(
        self,
        request,
        *args,
        **kwargs,
    ):
        import re

        from django.db import transaction
        from rest_framework.exceptions import ValidationError
        from rest_framework.response import Response
        from rest_framework import status

        email = (
            request.data.get("email", "")
            .strip()
            .lower()
        )

        password = request.data.get(
            "password",
            "",
        )

        first_name = request.data.get(
            "first_name",
            "",
        ).strip()

        last_name = request.data.get(
            "last_name",
            "",
        ).strip()

        job_title = request.data.get(
            "job_title",
            "",
        ).strip()

        phone_number = request.data.get(
            "phone_number",
            "",
        ).strip()

        if not email:
            raise ValidationError(
                {"email": "Email is required."}
            )

        if not password:
            raise ValidationError(
                {"password": "Password is required."}
            )

        if len(password) < 8:
            raise ValidationError(
                {
                    "password": (
                        "Password must be at least "
                        "8 characters."
                    )
                }
            )

        if User.objects.filter(
            email=email
        ).exists():
            raise ValidationError(
                {
                    "email": (
                        "A user with this email "
                        "already exists."
                    )
                }
            )

        with transaction.atomic():
            # Lock the current super-admin row while generating
            # the employee ID. This prevents two simultaneous
            # staff creations from receiving the same ID.
            if request.user.pk:
                User.objects.select_for_update().get(
                    pk=request.user.pk
                )

            prefix = "GBT-STAFF-"

            existing_ids = (
                StaffProfile.objects
                .filter(
                    employee_id__startswith=prefix
                )
                .values_list(
                    "employee_id",
                    flat=True,
                )
            )

            highest_number = 0

            for existing_id in existing_ids:
                match = re.fullmatch(
                    r"GBT-STAFF-(\d+)",
                    existing_id or "",
                )

                if match:
                    highest_number = max(
                        highest_number,
                        int(match.group(1)),
                    )

            employee_id = (
                f"{prefix}{highest_number + 1:04d}"
            )

            user = User.objects.create_user(
                email=email,
                password=password,
                first_name=first_name,
                last_name=last_name,
                role=User.Role.STAFF,
                is_staff=True,
                is_active=True,
            )

            StaffProfile.objects.create(
                user=user,
                job_title=job_title,
                employee_id=employee_id,
                phone_number=phone_number,
            )

        return Response(
            AdminUserDetailSerializer(
                user
            ).data,
            status=status.HTTP_201_CREATED,
        )