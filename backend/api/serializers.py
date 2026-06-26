from rest_framework import serializers


class ItemSerializer(serializers.Serializer):
    """Shape of an item returned by the API. Not backed by a model (mock-first)."""

    id = serializers.IntegerField()
    name = serializers.CharField()
    description = serializers.CharField()
