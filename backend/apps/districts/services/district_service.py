from apps.districts.models import RiskLevel


class DistrictService:

    @staticmethod
    def compute_level(count: int) -> str:
        if count == 0:
            return RiskLevel.NO_RECORD
        if count < 9:
            return RiskLevel.LOW
        if count < 19:
            return RiskLevel.MEDIUM
        return RiskLevel.HIGH
