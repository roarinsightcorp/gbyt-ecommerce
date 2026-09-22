
import requests


BASE_URL = "http://127.0.0.1:8000/api/v1"

session = requests.Session()


def show_response(label, response):
    print(f"\n{'=' * 60}")
    print(label)
    print(f"Status: {response.status_code}")

    try:
        print("Response:", response.json())
    except Exception:
        print("Response:", response.text[:500])

    print(
        "Cookies:",
        {
            key: (
                "<HttpOnly cookie>"
                if key in session.cookies
                else None
            )
            for key in session.cookies.keys()
        },
    )


# ------------------------------------------------------------
# 1. GET CSRF TOKEN
# ------------------------------------------------------------

response = session.get(
    f"{BASE_URL}/auth/csrf/"
)

show_response(
    "1. GET CSRF TOKEN",
    response,
)

if response.status_code != 200:
    raise SystemExit(
        "CSRF endpoint failed. Stop here."
    )

csrf_token = response.json().get(
    "csrfToken"
)

if not csrf_token:
    raise SystemExit(
        "No CSRF token returned. Stop here."
    )


# ------------------------------------------------------------
# 2. REGISTER
# ------------------------------------------------------------

register_payload = {
    "email": "auth-test@gbyt.local",
    "first_name": "Auth",
    "last_name": "Test",
    "password": "TestPassword123!",
    "password_confirm": "TestPassword123!",
}

response = session.post(
    f"{BASE_URL}/auth/register/",
    json=register_payload,
    headers={
        "X-CSRFToken": csrf_token,
        "Origin": "http://127.0.0.1:3000",
    },
)

show_response(
    "2. POST REGISTER",
    response,
)

if response.status_code not in (201, 400):
    raise SystemExit(
        "Unexpected registration response."
    )


# ------------------------------------------------------------
# 3. IF USER ALREADY EXISTS, LOGIN
# ------------------------------------------------------------

response = session.post(
    f"{BASE_URL}/auth/login/",
    json={
        "email": register_payload["email"],
        "password": register_payload["password"],
    },
    headers={
        "X-CSRFToken": csrf_token,
        "Origin": "http://127.0.0.1:3000",
    },
)

show_response(
    "3. POST LOGIN",
    response,
)

if response.status_code != 200:
    raise SystemExit(
        "Login failed. Stop here."
    )


# ------------------------------------------------------------
# 4. CHECK COOKIES
# ------------------------------------------------------------

print("\n" + "=" * 60)
print("4. AUTH COOKIES")

cookie_names = list(
    session.cookies.keys()
)

print(
    "Cookie names:",
    cookie_names,
)

if "gbyt_access" not in cookie_names:
    raise SystemExit(
        "gbyt_access cookie was not created."
    )

if "gbyt_refresh" not in cookie_names:
    raise SystemExit(
        "gbyt_refresh cookie was not created."
    )

print(
    "PASS: access and refresh cookies exist."
)


# ------------------------------------------------------------
# 5. GET CURRENT USER
# ------------------------------------------------------------

response = session.get(
    f"{BASE_URL}/account/me/",
)

show_response(
    "5. GET CURRENT USER",
    response,
)

if response.status_code != 200:
    raise SystemExit(
        "Authenticated /account/me/ failed."
    )


# ------------------------------------------------------------
# 6. REFRESH TOKEN
# ------------------------------------------------------------

old_refresh = session.cookies.get(
    "gbyt_refresh"
)

response = session.post(
    f"{BASE_URL}/auth/refresh/",
    headers={
        "X-CSRFToken": csrf_token,
        "Origin": "http://127.0.0.1:3000",
    },
)

show_response(
    "6. POST REFRESH",
    response,
)

if response.status_code != 200:
    raise SystemExit(
        "Refresh failed."
    )


new_refresh = session.cookies.get(
    "gbyt_refresh"
)

if old_refresh == new_refresh:
    print(
        "WARNING: refresh cookie did not change."
    )
else:
    print(
        "PASS: refresh token rotated."
    )


# ------------------------------------------------------------
# 7. LOGOUT
# ------------------------------------------------------------

response = session.post(
    f"{BASE_URL}/auth/logout/",
    headers={
        "X-CSRFToken": csrf_token,
        "Origin": "http://127.0.0.1:3000",
    },
)

show_response(
    "7. POST LOGOUT",
    response,
)

if response.status_code != 200:
    raise SystemExit(
        "Logout failed."
    )


# ------------------------------------------------------------
# 8. CONFIRM AUTH IS GONE
# ------------------------------------------------------------

response = session.get(
    f"{BASE_URL}/account/me/",
)

show_response(
    "8. GET CURRENT USER AFTER LOGOUT",
    response,
)

if response.status_code != 401:
    raise SystemExit(
        "SECURITY FAILURE: request remained authenticated after logout."
    )


print("\n" + "=" * 60)
print("ALL COOKIE AUTH TESTS PASSED")
print("=" * 60)
