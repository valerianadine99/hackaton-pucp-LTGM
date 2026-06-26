import anthropic
from django.conf import settings
from django.db import transaction

from apps.enfen.models import EnfenSummary


class EnfenService:

    @staticmethod
    @transaction.atomic
    def generate_and_cache(raw_bulletin: str, alert_level: str, date) -> EnfenSummary:
        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-opus-4-5",
            max_tokens=300,
            messages=[{
                "role": "user",
                "content": (
                    "Resume en 2–3 frases, en lenguaje claro para el ciudadano, "
                    "el siguiente comunicado ENFEN sobre El Niño.\n\n"
                    f"{raw_bulletin}"
                ),
            }],
        )
        summary = message.content[0].text

        record, _ = EnfenSummary.objects.update_or_create(
            date=date,
            defaults={"alert_level": alert_level, "raw_text": raw_bulletin, "summary": summary},
        )
        return record

    @staticmethod
    def get_or_generate(raw_bulletin: str, alert_level: str, date) -> EnfenSummary:
        existing = EnfenSummary.objects.filter(date=date).first()
        if existing:
            return existing
        return EnfenService.generate_and_cache(raw_bulletin, alert_level, date)
