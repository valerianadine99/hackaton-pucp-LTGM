from rest_framework import serializers


class DistrictSummarySerializer(serializers.Serializer):
    ubigeo_code = serializers.CharField()
    name = serializers.CharField()
    department = serializers.CharField()
    count = serializers.IntegerField()
    level = serializers.CharField()
    years = serializers.ListField(child=serializers.IntegerField())


class MemoryByYearSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    intensity = serializers.CharField()  # peak | high | medium | low (código visual)


class MemorySerializer(serializers.Serializer):
    streak_years = serializers.IntegerField()
    peak_year = serializers.IntegerField(allow_null=True)
    dominant_phenomenon = serializers.CharField(allow_null=True)  # valor en español
    by_year = MemoryByYearSerializer(many=True)


class ChecklistItemSerializer(serializers.Serializer):
    emoji = serializers.CharField()
    title = serializers.CharField()    # texto en español (lo lee el ciudadano)
    detail = serializers.CharField()


class DistrictDetailSerializer(serializers.Serializer):
    ubigeo_code = serializers.CharField()
    name = serializers.CharField()
    department = serializers.CharField()
    count = serializers.IntegerField()
    level = serializers.CharField()
    memory = MemorySerializer()
    checklist = ChecklistItemSerializer(many=True)
