from django.contrib import admin

from apps.enfen.models import EnfenSummary


@admin.register(EnfenSummary)
class EnfenSummaryAdmin(admin.ModelAdmin):
    list_display = ("date", "alert_level", "created_at")
    list_filter = ("alert_level",)
    ordering = ("-date",)
    readonly_fields = ("created_at",)
