from rest_framework.response import Response
from rest_framework.views import APIView

from apps.districts.selectors.district_selector import DistrictSelectors

# Metadatos curados (fijos). El texto que lee el ciudadano va en español; las llaves, en inglés.
SOURCE = "INDECI — Recomendaciones ante lluvias intensas, huaicos e inundaciones"
SOURCE_URL = "https://www.gob.pe/indeci"
DISCLAIMER = (
    "Información de referencia; no reemplaza a las indicaciones de las autoridades "
    "oficiales (INDECI / ENFEN / municipalidad)."
)


class ChecklistsApi(APIView):
    """Checklist curado de INDECI agrupado por nivel de riesgo (no lo genera la IA)."""

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        return Response({
            "source": SOURCE,
            "source_url": SOURCE_URL,
            "disclaimer": DISCLAIMER,
            "levels": DistrictSelectors.get_checklists_by_level(),
        })
