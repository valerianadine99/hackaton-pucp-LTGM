from rest_framework.response import Response
from rest_framework.views import APIView

from apps.districts.models import District


class DistrictGeojsonApi(APIView):
    """FeatureCollection de los distritos con geometría, para el choropleth (Leaflet).

    La geometría vive en la BD (Principio VIII), no embebida en el frontend.
    """

    authentication_classes = []
    permission_classes = []

    def get(self, request):
        features = [
            {
                "type": "Feature",
                "geometry": d.geom,
                "properties": {
                    "ubigeo_code": d.ubigeo_code,
                    "name": d.name,
                    "department": d.department,
                    "count": d.count,
                    "level": d.level,
                },
            }
            for d in District.objects.exclude(geom__isnull=True)
        ]
        return Response({"type": "FeatureCollection", "features": features})
