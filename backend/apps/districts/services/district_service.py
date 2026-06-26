from collections import Counter, defaultdict

from apps.districts.models import RiskLevel

# Umbrales de conteo (FR-013: regla por umbrales, NO cuantiles), afinados a la
# distribución real (mediana 13, máx 159). Mantener sincronizado con
# data/scripts/build_districts.py.
MEDIUM_THRESHOLD = 8
HIGH_THRESHOLD = 25


class DistrictService:

    @staticmethod
    def compute_level(count: int) -> str:
        if count == 0:
            return RiskLevel.NO_RECORD
        if count >= HIGH_THRESHOLD:
            return RiskLevel.HIGH
        if count >= MEDIUM_THRESHOLD:
            return RiskLevel.MEDIUM
        return RiskLevel.LOW

    @staticmethod
    def build_memory(district) -> dict:
        """Deriva la 'memoria' del distrito desde sus emergencias (no se almacena).

        Devuelve racha de años consecutivos, año pico, fenómeno dominante y la
        intensidad por año para los 'dots' del mockup ciudadano.
        """
        rows = list(district.emergencies.all())
        if not rows:
            return {
                "streak_years": 0,
                "peak_year": None,
                "dominant_phenomenon": None,
                "by_year": [],
            }

        severity_by_year: dict[int, int] = defaultdict(int)
        count_by_year: dict[int, int] = defaultdict(int)
        phenomena: Counter = Counter()
        for e in rows:
            severity_by_year[e.year] += (e.displaced + e.affected)
            count_by_year[e.year] += 1
            phenomena[e.phenomenon] += 1

        years = sorted(count_by_year)
        # Base de intensidad: severidad (damnificados+afectados); si no hay daños
        # registrados, cae al nº de emergencias del año.
        use_severity = any(severity_by_year.values())
        base = severity_by_year if use_severity else count_by_year
        peak_year = max(years, key=lambda y: (base[y], count_by_year[y]))
        peak_value = base[peak_year] or 1

        def intensity(year: int) -> str:
            if year == peak_year:
                return "peak"
            ratio = base[year] / peak_value
            if ratio >= 0.66:
                return "high"
            if ratio >= 0.33:
                return "medium"
            return "low"

        # Racha = el tramo más largo de años consecutivos con registro.
        longest = current = 1
        for i in range(1, len(years)):
            current = current + 1 if years[i] == years[i - 1] + 1 else 1
            longest = max(longest, current)

        return {
            "streak_years": longest,
            "peak_year": peak_year,
            "dominant_phenomenon": phenomena.most_common(1)[0][0],
            "by_year": [{"year": y, "intensity": intensity(y)} for y in years],
        }
