"""Ingesta: data/processed/*.json + comunicado ENFEN -> PostgreSQL.

Lee los insumos del rol Datos (ver data/DATA_DICTIONARY.md), mapea los valores en
español a los códigos en inglés del modelo y puebla las tablas. Idempotente:
re-ejecutar reemplaza el contenido.

Uso:
    python manage.py ingest_data            # carga District/Emergency/Checklist (+ENFEN sin resumen)
    python manage.py ingest_data --enfen    # además llama a Claude para el resumen ENFEN (requiere API key)
"""
import csv
import json
import re
import unicodedata
from datetime import date
from pathlib import Path

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.districts.models import ChecklistItem, District, Emergency
from apps.enfen.models import AlertLevel, EnfenSummary

DATA = settings.BASE_DIR.parent / "data"
PROCESSED = DATA / "processed"
ENFEN_TXT = DATA / "raw" / "enfen" / "comunicado-enfen-11-2026.txt"
ENFEN_URL = "https://enfen.imarpe.gob.pe/comunicados/"

# Niveles: español (data) -> código del modelo (inglés).
LEVEL_MAP = {"alto": "high", "medio": "medium", "bajo": "low", "sin_registro": "no_record"}

MONTHS_ES = {
    "enero": 1, "febrero": 2, "marzo": 3, "abril": 4, "mayo": 5, "junio": 6,
    "julio": 7, "agosto": 8, "setiembre": 9, "septiembre": 9, "octubre": 10,
    "noviembre": 11, "diciembre": 12,
}


def _strip(s: str) -> str:
    return "".join(c for c in unicodedata.normalize("NFD", s) if unicodedata.category(c) != "Mn")


def normalize_phenomenon(raw: str) -> str:
    """EMERGENCIA del SINPAD -> etiqueta en español para el ciudadano."""
    u = _strip(raw or "").upper()
    if "LLUVIA" in u:
        return "Lluvias intensas"
    if "INUNDAC" in u:
        return "Inundación"
    if "HUAYCO" in u:
        return "Huayco"
    if "DESLIZ" in u:
        return "Deslizamiento"
    return (raw or "").strip().title()


def _int(value) -> int:
    try:
        return int(float(value))
    except (TypeError, ValueError):
        return 0


class Command(BaseCommand):
    help = "Puebla la BD desde data/processed/ y el comunicado ENFEN."

    def add_arguments(self, parser):
        parser.add_argument(
            "--enfen", action="store_true",
            help="Llama a Claude para generar el resumen ENFEN (requiere ANTHROPIC_API_KEY).",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        self._load_districts()
        self._load_geometry()
        self._load_emergencies()
        self._load_checklists()
        self._load_enfen(with_claude=options["enfen"])
        self.stdout.write(self.style.SUCCESS("Ingesta completa."))

    # ---- District (memoria + nivel) ----
    def _load_districts(self):
        rows = json.loads((PROCESSED / "districts.json").read_text(encoding="utf-8"))
        Emergency.objects.all().delete()
        District.objects.all().delete()
        District.objects.bulk_create([
            District(
                ubigeo_code=r["ubigeo"],
                name=r["nombre"],
                department=r["departamento"],
                count=r["conteo"],
                level=LEVEL_MAP[r["nivel"]],
                years=r["anios"],
            )
            for r in rows
        ])
        self.stdout.write(f"  District: {len(rows)} cargados (con registro)")

    # ---- Geometría (GeoJSON -> District.geom; crea grises sin registro) ----
    def _load_geometry(self):
        geo = json.loads((PROCESSED / "northcoast.geojson").read_text(encoding="utf-8"))
        existing = {d.ubigeo_code: d for d in District.objects.all()}
        matched = gray = 0
        for feat in geo["features"]:
            p = feat["properties"]
            ubigeo = p.get("ubigeo")
            if not ubigeo:
                continue
            d = existing.get(ubigeo)
            if d:
                d.geom = feat["geometry"]
                d.save(update_fields=["geom"])
                matched += 1
            else:
                # Distrito sin emergencias registradas -> gris explícito (Principio V).
                District.objects.create(
                    ubigeo_code=ubigeo,
                    name=p.get("nombre", ubigeo),
                    department=p.get("departamento", ""),
                    count=0,
                    level="no_record",
                    years=[],
                    geom=feat["geometry"],
                )
                gray += 1
        self.stdout.write(f"  Geometría: {matched} con registro + {gray} grises (sin registro)")

    # ---- Emergency (detalle por evento, con daños) ----
    def _load_emergencies(self):
        by_ubigeo = {d.ubigeo_code: d for d in District.objects.all()}
        emergencies, skipped = [], 0
        with (PROCESSED / "sinpad_costa_norte.csv").open(encoding="utf-8") as fh:
            for row in csv.DictReader(fh):
                ubigeo = str(row["COD. DISTRITO"]).strip().zfill(6)
                district = by_ubigeo.get(ubigeo)
                if district is None:
                    skipped += 1
                    continue
                emergencies.append(Emergency(
                    sinpad_id=_int(row.get("CÓDIGO DE EMERGENCIA-SINPAD")) or None,
                    year=_int(row["AÑO"]),
                    district=district,
                    phenomenon=normalize_phenomenon(row["EMERGENCIA"]),
                    displaced=_int(row.get("DAMNIFICADOS")),
                    affected=_int(row.get("AFECTADOS")),
                    victims=_int(row.get("FALLECIDOS")),
                    destroyed_homes=_int(row.get("VIVIENDAS DESTRUIDAS")),
                    damaged_homes=_int(row.get("VIVIENDAS AFECTADAS")),
                ))
        Emergency.objects.bulk_create(emergencies, batch_size=1000)
        self.stdout.write(f"  Emergency: {len(emergencies)} eventos ({skipped} sin distrito, omitidos)")

    # ---- ChecklistItem (acción, curado INDECI) ----
    def _load_checklists(self):
        data = json.loads((PROCESSED / "checklists.json").read_text(encoding="utf-8"))
        ChecklistItem.objects.all().delete()
        items = []
        for nivel_es, lst in data["niveles"].items():
            level = LEVEL_MAP[nivel_es]
            for i, it in enumerate(lst):
                items.append(ChecklistItem(
                    level=level, order=i,
                    emoji=it.get("emoji", ""), title=it["titulo"], detail=it.get("detalle", ""),
                ))
        ChecklistItem.objects.bulk_create(items)
        self.stdout.write(f"  ChecklistItem: {len(items)} ítems")

    # ---- EnfenSummary (anticipación; resumen real de Claude opcional) ----
    def _load_enfen(self, with_claude: bool):
        raw = ENFEN_TXT.read_text(encoding="utf-8")
        alert_level = self._parse_alert_level(raw)
        bulletin = self._parse_bulletin(raw)
        bdate = self._parse_date(raw)

        if with_claude:
            if not settings.ANTHROPIC_API_KEY:
                self.stderr.write(self.style.WARNING(
                    "  ENFEN: --enfen pedido pero falta ANTHROPIC_API_KEY; se omite el resumen."
                ))
            else:
                from apps.enfen.services.enfen_service import EnfenService
                EnfenService.generate_and_cache(raw, alert_level, bdate, bulletin, ENFEN_URL)
                self.stdout.write(f"  EnfenSummary: {bulletin} + resumen real de Claude ✓")
                return

        # Sin Claude: guardar estado/metadatos con resumen vacío (NO inventar texto — Principio II).
        EnfenSummary.objects.filter(is_active=True).update(is_active=False)
        EnfenSummary.objects.update_or_create(
            date=bdate,
            defaults={
                "alert_level": alert_level, "raw_text": raw, "summary": "",
                "bulletin_number": bulletin, "source_url": ENFEN_URL, "is_active": True,
            },
        )
        self.stdout.write(self.style.WARNING(
            f"  EnfenSummary: {bulletin} sin resumen (corre con --enfen y ANTHROPIC_API_KEY)"
        ))

    @staticmethod
    def _parse_alert_level(raw: str) -> str:
        u = _strip(raw).lower()
        if "alerta de el nino costero" in u:
            return AlertLevel.ALERT
        if "vigilancia" in u:
            return AlertLevel.WATCH
        return AlertLevel.INACTIVE

    @staticmethod
    def _parse_bulletin(raw: str) -> str:
        m = re.search(r"COMUNICADO OFICIAL ENFEN N[°º]\s*([\d]+-[\d]{4})", raw)
        return f"N°{m.group(1)}" if m else ""

    @staticmethod
    def _parse_date(raw: str):
        m = re.search(r"(\d{1,2})\s+de\s+(\w+)\s+(\d{4})", _strip(raw).lower())
        if m:
            d, mon, y = int(m.group(1)), MONTHS_ES.get(m.group(2), 1), int(m.group(3))
            return date(y, mon, d)
        return date(2026, 6, 15)
