from .base import *


DEBUG = True

ALLOWED_HOSTS = [
    "localhost",
    "127.0.0.1",
]


# Development email backend
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"


# Development CORS
CORS_ALLOW_CREDENTIALS = True


# ============================================================
# CSRF
# ============================================================

CSRF_TRUSTED_ORIGINS = [
    "http://localhost:3000",
    #"http://127.0.0.1:3000",
]

