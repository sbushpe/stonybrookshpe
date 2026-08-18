"""The health endpoint, plus the response guarantees every route inherits from it."""

from __future__ import annotations

from fastapi.testclient import TestClient

from app import __version__


def test_health_returns_data_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.status_code == 200
    assert response.json() == {
        "data": {"status": "ok", "environment": "development", "version": __version__}
    }


def test_health_is_reachable_without_credentials(client: TestClient) -> None:
    """The one deliberately public route (§6.1)."""
    response = client.get("/api/v1/health", headers={"Cookie": ""})

    assert response.status_code == 200


def test_response_carries_security_headers(client: TestClient) -> None:
    response = client.get("/api/v1/health")

    assert response.headers["X-Content-Type-Options"] == "nosniff"
    assert response.headers["Referrer-Policy"] == "no-referrer"
    assert response.headers["X-Frame-Options"] == "DENY"
    assert "default-src 'none'" in response.headers["Content-Security-Policy"]


def test_response_carries_request_id(client: TestClient) -> None:
    first = client.get("/api/v1/health").headers["X-Request-Id"]
    second = client.get("/api/v1/health").headers["X-Request-Id"]

    assert first and second
    assert first != second


def test_unknown_route_returns_error_envelope(client: TestClient) -> None:
    response = client.get("/api/v1/does-not-exist")

    assert response.status_code == 404
    assert response.json()["error"]["code"] == "NOT_FOUND"


def test_cors_allows_the_configured_origin_with_credentials(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"Origin": "http://127.0.0.1:5502"})

    assert response.headers["access-control-allow-origin"] == "http://127.0.0.1:5502"
    assert response.headers["access-control-allow-credentials"] == "true"


def test_cors_rejects_an_unlisted_origin(client: TestClient) -> None:
    response = client.get("/api/v1/health", headers={"Origin": "https://not-our-site.example"})

    assert "access-control-allow-origin" not in response.headers
