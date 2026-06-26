from django.urls import path

from api import views

urlpatterns = [
    path("items", views.list_items, name="list_items"),
    path("items/<int:item_id>", views.get_item, name="get_item"),
]
