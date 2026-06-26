import datetime

import pytest
from rest_framework.test import APIClient

from apps.districts.models import ChecklistItem, District, RiskLevel
from apps.enfen.models import EnfenSummary


@pytest.fixture
def client():
    return APIClient()


@pytest.fixture
def district_high(db):
    return District.objects.create(
        ubigeo_code="200104",
        name="Catacaos",
        department="Piura",
        count=20,
        level=RiskLevel.HIGH,
        years=[2017, 2023],
    )


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
    ChecklistItem.objects.create(level=RiskLevel.HIGH, order=1, text="Evacúe a zona segura")
    ChecklistItem.objects.create(level=RiskLevel.HIGH, order=2, text="Tenga mochila de emergencia")


@pytest.fixture
def enfen(db):
    return EnfenSummary.objects.create(
        alert_level="alert",
        summary="El Niño activo en la costa norte.",
        date=datetime.date(2026, 6, 26),
    )


@pytest.mark.django_db
def test_list_districts_returns_correct_shape(client, district_high):
    response = client.get("/api/districts")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert len(body) == 1
    row = body[0]
    assert row["ubigeo_code"] == "200104"
    assert row["department"] == "Piura"
    assert row["level"] == "high"
    assert row["count"] == 20
    assert 2017 in row["years"]


@pytest.mark.django_db
def test_district_detail_returns_checklist_and_enfen(client, district_high, checklist_high, enfen):
    response = client.get("/api/districts/200104")
    assert response.status_code == 200
    body = response.json()
    assert body["ubigeo_code"] == "200104"
    assert isinstance(body["checklist"], list)
    assert len(body["checklist"]) == 2
    assert body["enfen_summary"] == "El Niño activo en la costa norte."


@pytest.mark.django_db
def test_district_detail_not_found_returns_404(client):
    response = client.get("/api/districts/999999")
    assert response.status_code == 404
    assert response.json()["code"] == "not_found"


@pytest.mark.django_db
def test_no_record_district_has_empty_checklist_when_no_items_seeded(
    client, district_no_record
):
    response = client.get("/api/districts/200199")
    assert response.status_code == 200
    body = response.json()
    assert body["level"] == "no_record"
    assert body["checklist"] == []
