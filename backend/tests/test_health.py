from rest_framework.test import APIClient


def test_health():
    client = APIClient()
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json()["status"] == "ok"
