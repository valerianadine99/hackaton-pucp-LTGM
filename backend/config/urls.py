from django.urls import include, path

from api.views import health

urlpatterns = [
    # Liveness probe used by deploy platforms and the frontend connectivity check.
    path("health", health, name="health"),
    path("api/", include("api.urls")),
]
