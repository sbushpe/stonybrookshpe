"""Structured JSON logging with a request id on every line.

Logs are grepped by whoever is on call — a human at 2 a.m. — so they are machine
readable and carry no member PII: ids, routes, and status codes only, never names,
emails, or majors. See engineering-rules.md §7.3 and §8.
"""

from __future__ import annotations

import json
import logging
import time
import uuid
from collections.abc import Awaitable, Callable
from contextvars import ContextVar
from datetime import UTC, datetime
from typing import Any

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

REQUEST_ID_HEADER = "X-Request-Id"

request_id_var: ContextVar[str] = ContextVar("request_id", default="-")

# Attributes every LogRecord carries. Anything else was passed as `extra=` by us and
# belongs in the JSON output.
_BUILT_IN_RECORD_ATTRS = frozenset(vars(logging.LogRecord("", 0, "", 0, "", None, None))) | {
    "asctime",
    "message",
    "taskName",
}


class JsonLogFormatter(logging.Formatter):
    """Render one log record as a single line of JSON."""

    def format(self, record: logging.LogRecord) -> str:
        payload: dict[str, Any] = {
            "timestamp": datetime.fromtimestamp(record.created, UTC).isoformat(),
            "level": record.levelname,
            "logger": record.name,
            "message": record.getMessage(),
            "request_id": request_id_var.get(),
        }
        for key, value in record.__dict__.items():
            if key not in _BUILT_IN_RECORD_ATTRS:
                payload[key] = value
        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)
        return json.dumps(payload, default=str)


def configure_logging(level: str) -> None:
    """Point the root logger at stdout with the JSON formatter.

    Replaces existing handlers so uvicorn's plain-text output does not double up.
    """
    handler = logging.StreamHandler()
    handler.setFormatter(JsonLogFormatter())

    root = logging.getLogger()
    root.handlers = [handler]
    root.setLevel(level)

    for uvicorn_logger in ("uvicorn", "uvicorn.error"):
        logger = logging.getLogger(uvicorn_logger)
        logger.handlers = []
        logger.propagate = True

    # Silenced, not reformatted: uvicorn.access logs the same event RequestContextMiddleware
    # already logs, minus the duration. Two lines per request is double the log bill and
    # double the noise when someone is grepping an incident.
    access_logger = logging.getLogger("uvicorn.access")
    access_logger.handlers = []
    access_logger.propagate = False


class RequestContextMiddleware(BaseHTTPMiddleware):
    """Tag each request with an id and log how it finished."""

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        # Generated here, never read from the client: an id we did not mint is an id we
        # cannot trust in our own logs.
        request_id = uuid.uuid4().hex
        # Deliberately not reset afterwards. The 500 boundary runs *outside* this
        # middleware, and clearing the id here would strip it from exactly the log line
        # someone is paged about. Each request gets its own context, so nothing leaks.
        request_id_var.set(request_id)

        started_at = time.perf_counter()
        response = await call_next(request)
        duration_ms = round((time.perf_counter() - started_at) * 1000, 2)

        logging.getLogger("app.request").info(
            "Request completed",
            extra={
                "method": request.method,
                # Path only: query strings can carry member data.
                "path": request.url.path,
                "status": response.status_code,
                "duration_ms": duration_ms,
            },
        )
        response.headers[REQUEST_ID_HEADER] = request_id
        return response
