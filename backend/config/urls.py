from django.contrib import admin
from django.urls import include, path

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", include("apps.core.health")),
    path("api/", include("apps.districts.api.v1.urls")),
    path("api/", include("apps.enfen.api.v1.urls")),
]
