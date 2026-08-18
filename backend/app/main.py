"""Application entry point.

Run it with:  uvicorn app.main:app --reload   (from the backend/ directory)
"""

from __future__ import annotations

import logging

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__
from app.api.v1.router import api_router
from app.core.config import Settings, get_settings
from app.core.errors import register_error_handlers
from app.core.logging import RequestContextMiddleware, configure_logging
from app.core.security_headers import SecurityHeadersMiddleware

API_V1_PREFIX = "/api/v1"


def create_app() -> FastAPI:
    """Build the application. Raises at import time if the environment is incomplete."""
    settings: Settings = get_settings()
    configure_logging(settings.log_level)

    app = FastAPI(
        title="Stony Brook SHPE API",
        version=__version__,
        # Interactive docs describe the whole attack surface, so they stay off the
        # public deployment.
        docs_url=None if settings.is_production else "/docs",
        redoc_url=None,
        openapi_url=None if settings.is_production else "/openapi.json",
    )

    # Middleware runs outermost-first in reverse order of registration: the request id
    # is set before anything else so every log line inside carries it.
    app.add_middleware(SecurityHeadersMiddleware, is_production=settings.is_production)
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        # The browser sends the session cookie, so credentials must be allowed — which
        # is also why allow_origins can never become "*".
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE"],
        allow_headers=["Content-Type"],
    )
    app.add_middleware(RequestContextMiddleware)

    register_error_handlers(app)
    app.include_router(api_router, prefix=API_V1_PREFIX)

    logging.getLogger(__name__).info("Application started", extra={"environment": settings.app_env})
    return app


app = create_app()
