"""
Django settings, overridable via environment variables or a .env file.

Mock-first: no database models are defined, so the default contrib apps that
require migrations (admin, auth, sessions) are intentionally left out. Swap them
back in once a real data source is introduced.
"""
import os
from pathlib import Path

from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent

# Load environment variables from a local .env file if present.
load_dotenv(BASE_DIR / ".env")

APP_NAME = os.getenv("APP_NAME", "Hackathon API")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-me")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

# Comma-separated list of allowed hosts. Defaults are dev-friendly.
ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1,.railway.app").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "corsheaders",
    "rest_framework",
    "api",
]

MIDDLEWARE = [
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {"context_processors": []},
    },
]

WSGI_APPLICATION = "config.wsgi.application"

# No database is configured: the API serves static mock data. Add a DATABASES
# entry (and the auth/admin apps above) when a real data source is wired in.

# Comma-separated list of allowed CORS origins (the Next.js frontend in dev).
CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

REST_FRAMEWORK = {
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
    # No auth in this mock-first starter: skip authentication entirely so the
    # `django.contrib.auth` app (and its migrations/DB) isn't required.
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "UNAUTHENTICATED_USER": None,
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"
