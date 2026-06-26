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
    def get_checklist(level: str) -> list[str]:
        return list(
            ChecklistItem.objects.filter(level=level)
            .order_by("order")
            .values_list("text", flat=True)
        )
