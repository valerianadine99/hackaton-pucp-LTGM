from rest_framework.response import Response
from rest_framework.views import APIView

from apps.districts.api.v1.serializers import DistrictSummarySerializer
from apps.districts.selectors.district_selector import DistrictSelectors


class DistrictListApi(APIView):
    authentication_classes = []
    permission_classes = []

    def get(self, request):
        districts = DistrictSelectors.get_all()
        return Response(DistrictSummarySerializer(districts, many=True).data)
