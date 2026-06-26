from rest_framework.decorators import api_view
from rest_framework.exceptions import NotFound
from rest_framework.request import Request
from rest_framework.response import Response

from api.mocks import MOCK_ITEMS
from api.serializers import ItemSerializer


@api_view(["GET"])
def health(request: Request) -> Response:
    """Liveness probe used by deploy platforms and the frontend connectivity check."""
    return Response({"status": "ok"})


@api_view(["GET"])
def list_items(request: Request) -> Response:
    """Sample resource served from static mock data so the frontend is unblocked from hour one."""
    return Response(ItemSerializer(MOCK_ITEMS, many=True).data)


@api_view(["GET"])
def get_item(request: Request, item_id: int) -> Response:
    for item in MOCK_ITEMS:
        if item["id"] == item_id:
            return Response(ItemSerializer(item).data)
    raise NotFound("Item not found")
