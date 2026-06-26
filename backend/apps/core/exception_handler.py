import logging

from django.core.exceptions import ObjectDoesNotExist
from django.db import IntegrityError
from rest_framework import status
from rest_framework.exceptions import ValidationError as DRFValidationError
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler

from apps.core.exceptions import ApplicationError

logger = logging.getLogger(__name__)


def application_exception_handler(exc, context):
    if isinstance(exc, ApplicationError):
        data = {"message": exc.message, "code": exc.code}
        if hasattr(exc, "errors") and exc.errors:
            data["errors"] = exc.errors
        return Response(data, status=exc.status_code)

    if isinstance(exc, IntegrityError):
        logger.error("Unhandled IntegrityError: %s", exc)
        return Response(
            {"message": "A resource with these details already exists.", "code": "conflict"},
            status=status.HTTP_409_CONFLICT,
        )

    if isinstance(exc, ObjectDoesNotExist):
        return Response(
            {"message": "Resource not found.", "code": "not_found"},
            status=status.HTTP_404_NOT_FOUND,
        )

    if isinstance(exc, ValueError):
        return Response(
            {"message": str(exc), "code": "bad_request"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        return None

    if isinstance(exc, DRFValidationError):
        errors = dict(response.data)
        non_field = errors.pop("non_field_errors", [])
        message = str(non_field[0]) if non_field else "Invalid input."
        response.data = {"message": message, "code": "validation_error", "errors": errors}
    else:
        detail = response.data.get("detail", "An error occurred.")
        response.data = {"message": str(detail), "code": getattr(exc, "default_code", "error")}

    return response
