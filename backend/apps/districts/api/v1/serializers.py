from rest_framework import serializers


class DistrictSummarySerializer(serializers.Serializer):
    ubigeo_code = serializers.CharField()
    name = serializers.CharField()
    department = serializers.CharField()
    count = serializers.IntegerField()
    level = serializers.CharField()
    years = serializers.ListField(child=serializers.IntegerField())


class DistrictDetailSerializer(serializers.Serializer):
    ubigeo_code = serializers.CharField()
    name = serializers.CharField()
    department = serializers.CharField()
    count = serializers.IntegerField()
    level = serializers.CharField()
    years = serializers.ListField(child=serializers.IntegerField())
    enfen_summary = serializers.CharField(allow_null=True)
    checklist = serializers.ListField(child=serializers.CharField())
