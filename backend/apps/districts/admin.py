from django.contrib import admin

from apps.districts.models import ChecklistItem, District, Emergency


@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ("ubigeo_code", "name", "department", "level", "count")
    list_filter = ("level", "department")
    search_fields = ("ubigeo_code", "name")
    ordering = ("name",)


@admin.register(ChecklistItem)
class ChecklistItemAdmin(admin.ModelAdmin):
    list_display = ("level", "order", "emoji", "title")
    list_filter = ("level",)
    ordering = ("level", "order")


@admin.register(Emergency)
class EmergencyAdmin(admin.ModelAdmin):
    list_display = ("sinpad_id", "year", "district", "phenomenon", "displaced", "affected")
    list_filter = ("year", "phenomenon")
    search_fields = ("district__name",)
    ordering = ("-year",)
