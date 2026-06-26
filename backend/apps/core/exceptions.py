class ApplicationError(Exception):
    default_message = "An unexpected error occurred."
    default_code = "error"
    status_code = 500

    def __init__(self, message=None, code=None):
        self.message = message or self.default_message
        self.code = code or self.default_code
        super().__init__(self.message)


class NotFound(ApplicationError):
    default_message = "Resource not found."
    default_code = "not_found"
    status_code = 404


class ValidationError(ApplicationError):
    default_message = "Validation failed."
    default_code = "validation_error"
    status_code = 400

    def __init__(self, message=None, code=None, errors=None):
        super().__init__(message, code)
        self.errors = errors or {}
