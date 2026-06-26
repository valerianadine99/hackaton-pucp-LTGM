from rest_framework.test import APIClient

client = APIClient()


def test_health_returns_ok():
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_list_items_happy_path():
    """Happy path: the items endpoint returns 200 and a non-empty list."""
    response = client.get("/api/items")
    assert response.status_code == 200
    body = response.json()
    assert isinstance(body, list)
    assert body[0]["id"] == 1


def test_get_item_not_found_returns_404():
    """Error case: requesting a missing item returns 404."""
    response = client.get("/api/items/999")
    assert response.status_code == 404
    assert response.json()["detail"] == "Item not found"
