"""The error boundary: every failure leaves as the envelope, with nothing leaked."""

from __future__ import annotations

from fastapi import FastAPI
from fastapi.testclient import TestClient

from app.core.errors import ApiError
from app.main import create_app

INTERNAL_DETAIL = "SELECT email FROM members WHERE id = 42"


def build_client_with_failing_routes() -> TestClient:
    """An app with routes that fail on purpose, wired through the real boundary."""
    app: FastAPI = create_app()

    @app.get("/api/v1/test-api-error")
    def raise_api_error() -> None:
        raise ApiError(403, "TIER_TOO_LOW", "Your sponsorship tier does not include this.")

    @app.get("/api/v1/test-crash")
    def crash() -> None:
        raise RuntimeError(INTERNAL_DETAIL)

    @app.get("/api/v1/test-validation")
    def needs_a_number(count: int) -> None:
        return None

    # raise_server_exceptions=False so the 500 handler's response is returned to us
    # instead of the exception being re-raised into the test.
    return TestClient(app, raise_server_exceptions=False)


def test_api_error_becomes_its_envelope() -> None:
    response = build_client_with_failing_routes().get("/api/v1/test-api-error")

    assert response.status_code == 403
    assert response.json() == {
        "error": {
            "code": "TIER_TOO_LOW",
            "message": "Your sponsorship tier does not include this.",
        }
    }


def test_unexpected_error_leaks_nothing() -> None:
    response = build_client_with_failing_routes().get("/api/v1/test-crash")

    assert response.status_code == 500
    assert response.json()["error"]["code"] == "INTERNAL_ERROR"
    assert INTERNAL_DETAIL not in response.text
    assert "Traceback" not in response.text


def test_invalid_input_is_400_not_422() -> None:
    response = build_client_with_failing_routes().get("/api/v1/test-validation?count=abc")

    assert response.status_code == 400
    assert response.json()["error"]["code"] == "INVALID_REQUEST"
    # The rejected value never comes back to the caller.
    assert "abc" not in response.text


def test_crash_response_still_carries_security_headers() -> None:
    """The 500 handler runs outside the middleware stack — it must add them itself."""
    response = build_client_with_failing_routes().get("/api/v1/test-crash")

    assert response.status_code == 500
    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "default-src 'none'" in response.headers["Content-Security-Policy"]


def test_crash_response_carries_a_request_id() -> None:
    """Support asks for this id; it is the only link from a user's report to the logs."""
    response = build_client_with_failing_routes().get("/api/v1/test-crash")

    assert response.headers["X-Request-Id"]
    assert response.headers["X-Request-Id"] != "-"
