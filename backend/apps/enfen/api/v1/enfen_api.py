from rest_framework import serializers
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.core.exceptions import NotFound
from apps.enfen.selectors.enfen_selector import EnfenSelectors


class EnfenApi(APIView):
    authentication_classes = []
    permission_classes = []

    class OutputSerializer(serializers.Serializer):
        alert_level = serializers.CharField()
        summary = serializers.CharField()
        date = serializers.DateField()

    def get(self, request):
        latest = EnfenSelectors.get_latest()
        if latest is None:
            raise NotFound("No ENFEN data available")
        return Response(self.OutputSerializer(latest).data)
