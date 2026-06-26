import datetime

import pytest
from rest_framework.test import APIClient

from apps.districts.models import ChecklistItem, District, Emergency, RiskLevel


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def district_high(db):
    d = District.objects.create(
        ubigeo_code="200104",
        name="Catacaos",
        department="Piura",
        count=20,
        level=RiskLevel.HIGH,
        years=[2017, 2023],
        geom={"type": "Polygon", "coordinates": [[[0, 0], [0, 1], [1, 1], [0, 0]]]},
    )
    Emergency.objects.create(district=d, year=2017, phenomenon="Lluvias intensas",
                             displaced=100, affected=500)
    Emergency.objects.create(district=d, year=2017, phenomenon="Inundación", affected=50)
    Emergency.objects.create(district=d, year=2023, phenomenon="Lluvias intensas", affected=10)
    return d


@pytest.fixture
def district_no_record(db):
    return District.objects.create(
        ubigeo_code="200199",
        name="Distrito Sin Registro",
        department="Piura",
        count=0,
        level=RiskLevel.NO_RECORD,
        years=[],
    )


@pytest.fixture
def checklist_high(db):
    ChecklistItem.objects.create(level=RiskLevel.HIGH, order=0, emoji="🎒",
                                 title="Arma tu mochila", detail="Agua, linterna, documentos.")
    ChecklistItem.objects.create(level=RiskLevel.HIGH, order=1, emoji="🚪",
                                 title="Practica tu ruta de evacuación", detail="Hacia la zona segura.")


@pytest.mark.django_db
def test_list_districts_returns_correct_shape(client, district_high):
    response = client.get("/api/districts")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    row = next(r for r in body if r["ubigeo_code"] == "200104")
    assert row["department"] == "Piura"
    assert row["level"] == "high"
    assert row["count"] == 20
    assert 2017 in row["years"]


@pytest.mark.django_db
def test_district_detail_returns_memory_and_rich_checklist(client, district_high, checklist_high):
    response = client.get("/api/districts/200104")
    assert response.status_code == 200
    body = response.json()
    assert body["ubigeo_code"] == "200104"
    # checklist enriquecido (emoji/título/detalle)
    assert len(body["checklist"]) == 2
    assert body["checklist"][0]["emoji"] == "🎒"
    assert body["checklist"][0]["title"] == "Arma tu mochila"
    # memoria derivada de Emergency
    mem = body["memory"]
    assert mem["dominant_phenomenon"] == "Lluvias intensas"
    assert mem["peak_year"] == 2017
    assert {bp["year"] for bp in mem["by_year"]} == {2017, 2023}
    peak = next(bp for bp in mem["by_year"] if bp["year"] == 2017)
    assert peak["intensity"] == "peak"


@pytest.mark.django_db
def test_districts_geojson_returns_feature_collection(client, district_high):
    response = client.get("/api/districts/geojson")
    assert response.status_code == 200
    body = response.json()
    assert body["type"] == "FeatureCollection"
    assert len(body["features"]) == 1
    feat = body["features"][0]
    assert feat["geometry"]["type"] == "Polygon"
    assert feat["properties"]["level"] == "high"


@pytest.mark.django_db
def test_district_detail_not_found_returns_404(client):
    response = client.get("/api/districts/999999")
    assert response.status_code == 404
    assert response.json()["code"] == "not_found"


@pytest.mark.django_db
def test_no_record_district_has_empty_memory_and_checklist(client, district_no_record):
    response = client.get("/api/districts/200199")
    assert response.status_code == 200
    body = response.json()
    assert body["level"] == "no_record"
    assert body["checklist"] == []
    assert body["memory"]["by_year"] == []
    assert body["memory"]["streak_years"] == 0
