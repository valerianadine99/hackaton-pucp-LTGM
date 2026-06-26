from apps.enfen.models import EnfenSummary


class EnfenSelectors:

    @staticmethod
    def get_latest() -> EnfenSummary | None:
        return EnfenSummary.objects.order_by("-date").first()

    @staticmethod
    def get_latest_summary() -> str | None:
        latest = EnfenSelectors.get_latest()
        return latest.summary if latest else None
