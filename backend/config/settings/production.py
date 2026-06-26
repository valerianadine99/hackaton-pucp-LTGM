from .base import *  # noqa: F401, F403
from .base import database_config

DEBUG = False
STATIC_ROOT = BASE_DIR / "staticfiles"

# conn_max_age=0 — let the pooler own connection lifetime, don't persist
# connections across requests on serverless/pooled deployments.
DATABASES = {"default": database_config(conn_max_age=0)}
