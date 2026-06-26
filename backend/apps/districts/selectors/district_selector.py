from django.db.models import QuerySet

from apps.districts.models import ChecklistItem, District


class DistrictSelectors:

    @staticmethod
    def get_all() -> QuerySet:
        return District.objects.defer("geom").order_by("name")

    @staticmethod
    def get_by_ubigeo_code(ubigeo_code: str) -> District:
        return District.objects.get(pk=ubigeo_code)

    @staticmethod
    def get_checklist(level: str) -> list[dict]:
        return list(
            ChecklistItem.objects.filter(level=level)
            .order_by("order")
            .values("emoji", "title", "detail")
        )

    @staticmethod
    def get_checklists_by_level() -> dict[str, list[dict]]:
        """Todos los ítems del checklist agrupados por código de nivel."""
        grouped: dict[str, list[dict]] = {}
        for item in ChecklistItem.objects.order_by("level", "order").values(
            "level", "emoji", "title", "detail"
        ):
            grouped.setdefault(item["level"], []).append(
                {"emoji": item["emoji"], "title": item["title"], "detail": item["detail"]}
            )
        return grouped
