from django.urls import path

from apps.districts.api.v1.district_detail_api import DistrictDetailApi
from apps.districts.api.v1.district_list_api import DistrictListApi

urlpatterns = [
    path("districts", DistrictListApi.as_view(), name="district-list"),
    path("districts/<str:ubigeo_code>", DistrictDetailApi.as_view(), name="district-detail"),
]
