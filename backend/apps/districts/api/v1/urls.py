from django.urls import path

from apps.districts.api.v1.checklists_api import ChecklistsApi
from apps.districts.api.v1.district_detail_api import DistrictDetailApi
from apps.districts.api.v1.district_geojson_api import DistrictGeojsonApi
from apps.districts.api.v1.district_list_api import DistrictListApi

urlpatterns = [
    path("districts", DistrictListApi.as_view(), name="district-list"),
    # /districts/geojson debe ir ANTES de /districts/<ubigeo_code> (si no, 'geojson' se
    # interpreta como ubigeo).
    path("districts/geojson", DistrictGeojsonApi.as_view(), name="district-geojson"),
    path("districts/<str:ubigeo_code>", DistrictDetailApi.as_view(), name="district-detail"),
    path("checklists", ChecklistsApi.as_view(), name="checklists"),
]
