"""The single error boundary: full detail to the logs, a safe envelope to the client.

Services and routes raise `ApiError`; nothing below the route layer builds an HTTP
response. Every failure leaves here shaped as
`{"error": {"code": ..., "message": ...}}` — stack traces, queries, and file paths
never reach a browser. See engineering-rules.md §5 and §8.
"""

from __future__ import annotations

import logging

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from starlette.exceptions import HTTPException as StarletteHTTPException

from app.core.config import get_settings
from app.core.logging import REQUEST_ID_HEADER, request_id_var
from app.core.security_headers import apply_security_headers

logger = logging.getLogger(__name__)

GENERIC_ERROR_MESSAGE = "Something went wrong on our end. Please try again."

# Stable, machine-checkable codes for the failures FastAPI raises on our behalf.
ERROR_CODE_BY_STATUS = {
    400: "INVALID_REQUEST",
    401: "UNAUTHENTICATED",
    403: "FORBIDDEN",
    404: "NOT_FOUND",
    405: "METHOD_NOT_ALLOWED",
    429: "RATE_LIMITED",
    500: "INTERNAL_ERROR",
}
FALLBACK_ERROR_CODE = "INTERNAL_ERROR"


class ApiError(Exception):
    """An error we intend the client to see.

    `message` is shown to a user verbatim, so keep it calm and free of internals.
    `code` is stable and machine-checkable — renaming one is a breaking API change.
    """

    def __init__(self, status_code: int, code: str, message: str) -> None:
        super().__init__(message)
        self.status_code = status_code
        self.code = code
        self.message = message


def error_response(status_code: int, code: str, message: str) -> JSONResponse:
    """Build the one error envelope the API is allowed to return."""
    return JSONResponse(
        status_code=status_code,
        content={"error": {"code": code, "message": message}},
    )


async def handle_api_error(request: Request, exc: ApiError) -> JSONResponse:
    logger.warning("Request rejected", extra={"error_code": exc.code, "status": exc.status_code})
    return error_response(exc.status_code, exc.code, exc.message)


async def handle_http_exception(request: Request, exc: StarletteHTTPException) -> JSONResponse:
    code = ERROR_CODE_BY_STATUS.get(exc.status_code, FALLBACK_ERROR_CODE)
    message = exc.detail if isinstance(exc.detail, str) else GENERIC_ERROR_MESSAGE
    return error_response(exc.status_code, code, message)


async def handle_validation_error(request: Request, exc: RequestValidationError) -> JSONResponse:
    """Map FastAPI's 422 to the 400 the API contract promises for invalid input.

    The per-field detail stays in the logs: it echoes whatever the caller sent, which
    for this API can include a member's personal data (§7.3).
    """
    logger.info("Request failed validation", extra={"error_code": "INVALID_REQUEST"})
    return error_response(400, "INVALID_REQUEST", "Some of the information sent was not valid.")


async def handle_unexpected_error(request: Request, exc: Exception) -> JSONResponse:
    """Last resort: our bug. Log it in full, tell the client nothing specific.

    This handler runs outside the middleware stack, so the headers and request id that
    middleware adds to every other response have to be applied here by hand. Without
    this, a crash is the one response that reaches a browser unprotected.
    """
    logger.error(
        "Unhandled exception",
        exc_info=exc,
        extra={"method": request.method, "path": request.url.path, "status": 500},
    )
    response = error_response(500, "INTERNAL_ERROR", GENERIC_ERROR_MESSAGE)
    apply_security_headers(
        response, path=request.url.path, is_production=get_settings().is_production
    )
    response.headers[REQUEST_ID_HEADER] = request_id_var.get()
    return response


def register_error_handlers(app: FastAPI) -> None:
    """Wire the boundary handlers onto the app."""
    app.add_exception_handler(ApiError, handle_api_error)  # type: ignore[arg-type]
    app.add_exception_handler(StarletteHTTPException, handle_http_exception)  # type: ignore[arg-type]
    app.add_exception_handler(RequestValidationError, handle_validation_error)  # type: ignore[arg-type]
    app.add_exception_handler(Exception, handle_unexpected_error)
