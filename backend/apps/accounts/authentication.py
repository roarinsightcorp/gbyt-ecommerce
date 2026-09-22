'''
from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    Authenticate API requests using the access JWT stored in an
    HttpOnly cookie.

    Authorization: Bearer <token> remains supported as a fallback,
    which is useful for API clients and development/testing.
    """

    access_cookie_name = "gbyt_access"

    def authenticate(self, request):
        # First allow the standard Authorization: Bearer <token>
        # mechanism to work.
        header_auth = super().authenticate(request)

        if header_auth is not None:
            return header_auth

        # Fall back to the HttpOnly access-token cookie.
        raw_token = request.COOKIES.get(self.access_cookie_name)

        if raw_token is None:
            return None

        validated_token = self.get_validated_token(
            raw_token.encode("utf-8")
        )

        return self.get_user(validated_token), validated_token
'''



from rest_framework_simplejwt.authentication import JWTAuthentication


class CookieJWTAuthentication(JWTAuthentication):
    """
    JWT authentication for browser requests.

    The preferred authentication mechanism is the access JWT stored
    in the HttpOnly gbyt_access cookie.

    The standard Authorization: Bearer <token> header remains
    supported as a fallback for API clients and development tools.
    """

    access_cookie_name = "gbyt_access"

    def authenticate(self, request):
        # Preserve normal SimpleJWT Authorization-header support.
        header_result = super().authenticate(request)

        if header_result is not None:
            return header_result

        # Browser authentication uses the HttpOnly cookie.
        raw_token = request.COOKIES.get(
            self.access_cookie_name
        )

        if not raw_token:
            return None

        validated_token = self.get_validated_token(
            raw_token.encode("utf-8")
        )

        return (
            self.get_user(validated_token),
            validated_token,
        )

