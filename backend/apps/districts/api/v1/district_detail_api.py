from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import NotFound
from apps.districts.api.v1.serializers import DistrictDetailSerializer
from apps.districts.models import District
from apps.districts.selectors.district_selector import DistrictSelectors
from apps.enfen.selectors.enfen_selector import EnfenSelectors


class DistrictDetailApi(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request, ubigeo_code: str):
        try:
            district = DistrictSelectors.get_by_ubigeo_code(ubigeo_code)
        except District.DoesNotExist:
            raise NotFound("District not found")

        checklist = DistrictSelectors.get_checklist(district.level)
        enfen_summary = EnfenSelectors.get_latest_summary()

        data = {
            "ubigeo_code": district.ubigeo_code,
            "name": district.name,
            "department": district.department,
            "count": district.count,
            "level": district.level,
            "years": district.years,
            "enfen_summary": enfen_summary,
            "checklist": checklist,
        }
        return Response(DistrictDetailSerializer(data).data)
