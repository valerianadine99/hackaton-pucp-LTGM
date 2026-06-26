from django.contrib import admin

from apps.districts.models import ChecklistItem, District


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("ubigeo_code", "name", "level", "count")
    list_filter = ("level",)
    search_fields = ("ubigeo_code", "name")
    ordering = ("name",)


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin):
    list_display = ("level", "order", "text")
    list_filter = ("level",)
    ordering = ("level", "order")
