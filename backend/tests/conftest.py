"""Shared test fixtures.

The environment is seeded before `app.main` is imported: that module builds the app at
import time, and building it requires a valid environment (config.py fails fast).
"""

from __future__ import annotations

import os
from collections.abc import Iterator

TEST_ENVIRONMENT = {
    "APP_ENV": "development",
    "ALLOWED_ORIGINS": "http://127.0.0.1:5502",
    "LOG_LEVEL": "WARNING",
}
for name, value in TEST_ENVIRONMENT.items():
    os.environ[name] = value

import pytest  # noqa: E402
from fastapi.testclient import TestClient  # noqa: E402

from app.core.config import get_settings  # noqa: E402
from app.main import create_app  # noqa: E402


@pytest.fixture(autouse=True)
def _isolated_settings() -> Iterator[None]:
    """Give every test a settings object built from the test environment."""
    get_settings.cache_clear()
    yield
    get_settings.cache_clear()


@pytest.fixture
def client() -> Iterator[TestClient]:
    with TestClient(create_app()) as test_client:
        yield test_client
