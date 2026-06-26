from django.urls import path

from apps.enfen.api.v1.enfen_api import EnfenApi

urlpatterns = [
    path("enfen", EnfenApi.as_view(), name="enfen"),
]
