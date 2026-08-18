"""Security headers applied to every response (engineering-rules.md section 6.2)."""

from __future__ import annotations

from collections.abc import Awaitable, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# This API returns JSON only, so a browser should never load anything on its behalf.
API_CONTENT_SECURITY_POLICY = "default-src 'none'; frame-ancestors 'none'"
ONE_YEAR_IN_SECONDS = 31_536_000

# Swagger UI pulls its assets from a CDN, which the policy above would block. The docs
# are served in development only (see create_app), so nothing is relaxed in production.
DOCS_PATH_PREFIXES = ("/docs", "/redoc", "/openapi.json")


def apply_security_headers(response: Response, *, path: str, is_production: bool) -> None:
    """Set the headers on one response.

    Kept separate from the middleware because the 500 handler runs *outside* the
    middleware stack and has to apply them itself — an error response is exactly the one
    a browser should trust least.
    """
    response.headers["X-Content-Type-Options"] = "nosniff"
    response.headers["Referrer-Policy"] = "no-referrer"
    response.headers["X-Frame-Options"] = "DENY"

    if not path.startswith(DOCS_PATH_PREFIXES):
        response.headers["Content-Security-Policy"] = API_CONTENT_SECURITY_POLICY

    if is_production:
        response.headers["Strict-Transport-Security"] = (
            f"max-age={ONE_YEAR_IN_SECONDS}; includeSubDomains"
        )


class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    def __init__(self, app: Callable[..., Awaitable[None]], *, is_production: bool) -> None:
        super().__init__(app)
        self.is_production = is_production

    async def dispatch(
        self, request: Request, call_next: Callable[[Request], Awaitable[Response]]
    ) -> Response:
        response = await call_next(request)
        apply_security_headers(response, path=request.url.path, is_production=self.is_production)
        return response
