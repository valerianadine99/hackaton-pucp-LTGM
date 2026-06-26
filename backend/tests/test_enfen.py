import datetime

import pytest
from rest_framework.test import APIClient

from apps.enfen.models import EnfenSummary


@pytest.fixture
def client():
    return APIClient()


@pytest.mark.django_db
def test_enfen_returns_latest(client):
    EnfenSummary.objects.create(
        alert_level="alert",
        summary="Resumen de prueba.",
        bulletin_number="N°11-2026",
        source_url="https://enfen.imarpe.gob.pe/comunicados/",
        date=datetime.date(2026, 6, 26),
    )
    response = client.get("/api/enfen")
    assert response.status_code == 200
    body = response.json()
    # `state` se expone en español (display del choice)
    assert body["state"] == "Alerta de El Niño Costero"
    assert body["summary"] == "Resumen de prueba."
    assert body["bulletin_number"] == "N°11-2026"
    assert body["date"] == "2026-06-26"


@pytest.mark.django_db
def test_enfen_returns_404_when_no_data(client):
    response = client.get("/api/enfen")
    assert response.status_code == 404
    assert response.json()["code"] == "not_found"
