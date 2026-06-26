from django.conf import settings
from django.db import transaction

from apps.enfen.models import EnfenSummary


class EnfenService:

    @staticmethod
    @transaction.atomic
    def generate_and_cache(
        raw_bulletin: str,
        alert_level: str,
        date,
        bulletin_number: str = "",
        source_url: str = "",
    ) -> EnfenSummary:
        import anthropic  # lazy: solo se necesita cuando hay API key y se genera el resumen

        client = anthropic.Anthropic(api_key=settings.ANTHROPIC_API_KEY)
        message = client.messages.create(
            model="claude-opus-4-8",
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

        EnfenSummary.objects.filter(is_active=True).update(is_active=False)
        record, _ = EnfenSummary.objects.update_or_create(
            date=date,
            defaults={
                "alert_level": alert_level,
                "raw_text": raw_bulletin,
                "summary": summary,
                "bulletin_number": bulletin_number,
                "source_url": source_url,
                "is_active": True,
            },
        )
        return record

    @staticmethod
    def get_or_generate(
        raw_bulletin: str,
        alert_level: str,
        date,
        bulletin_number: str = "",
        source_url: str = "",
    ) -> EnfenSummary:
        existing = EnfenSummary.objects.filter(date=date).first()
        if existing:
            return existing
        return EnfenService.generate_and_cache(
            raw_bulletin, alert_level, date, bulletin_number, source_url
        )
