import dj_database_url

from .base import *  # noqa: F401, F403

DEBUG = False
STATIC_ROOT = BASE_DIR / "staticfiles"

DATABASES = {
    "default": dj_database_url.config(
        default="postgres://vigia:vigia@localhost:5432/vigia",
        conn_max_age=0,
    )
}
