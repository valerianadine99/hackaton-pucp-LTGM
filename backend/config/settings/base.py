import os
from pathlib import Path

import dj_database_url
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent.parent.parent

load_dotenv(BASE_DIR / ".env")

APP_NAME = os.getenv("APP_NAME", "Vigia API")

SECRET_KEY = os.getenv("SECRET_KEY", "dev-insecure-secret-key-change-me")
DEBUG = os.getenv("DEBUG", "True").lower() == "true"

ALLOWED_HOSTS = [
    host.strip()
    for host in os.getenv("ALLOWED_HOSTS", "localhost,127.0.0.1").split(",")
    if host.strip()
]

INSTALLED_APPS = [
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    "corsheaders",
    "rest_framework",
    "apps.core",
    "apps.districts",
    "apps.enfen",
]

MIDDLEWARE = [
    "django.contrib.sessions.middleware.SessionMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
]

ROOT_URLCONF = "config.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ]
        },
    },
]

WSGI_APPLICATION = "config.wsgi.application"

def database_config(*, conn_max_age):
    """Build the DATABASES["default"] entry from DATABASE_URL.

    Sanitizes the connection so it works behind a transaction pooler
    (Supabase pgbouncer on :6543) with psycopg3:

    - Drops the ``pgbouncer`` query param. It's a Prisma/Supabase-docs flag,
      not a libpq option; dj-database-url forwards it into OPTIONS and
      psycopg3 raises ``invalid connection option "pgbouncer"``.
    - Sets ``prepare_threshold=None`` to disable server-side prepared
      statements, which pgbouncer transaction-pooling mode does not support.
    """
    config = dj_database_url.config(
        default="postgres://vigia:vigia@localhost:5432/vigia",
        conn_max_age=conn_max_age,
    )
    options = config.setdefault("OPTIONS", {})
    options.pop("pgbouncer", None)
    options.setdefault("prepare_threshold", None)
    return config


DATABASES = {"default": database_config(conn_max_age=600)}

CORS_ALLOWED_ORIGINS = [
    origin.strip()
    for origin in os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
    if origin.strip()
]

REST_FRAMEWORK = {
    "EXCEPTION_HANDLER": "apps.core.exception_handler.application_exception_handler",
    "DEFAULT_AUTHENTICATION_CLASSES": [],
    "UNAUTHENTICATED_USER": None,
    "DEFAULT_RENDERER_CLASSES": [
        "rest_framework.renderers.JSONRenderer",
        "rest_framework.renderers.BrowsableAPIRenderer",
    ],
}

LANGUAGE_CODE = "en-us"
TIME_ZONE = "UTC"
USE_I18N = True
USE_TZ = True

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

STATIC_URL = "static/"

ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
