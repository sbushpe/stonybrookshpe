"""Configuration is validated at startup or the process does not start (§4.3)."""

from __future__ import annotations

import pytest
from pydantic import ValidationError

from app.core.config import Settings


def test_missing_required_variable_fails_fast(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.delenv("APP_ENV", raising=False)

    # _env_file=None so a developer's local .env cannot mask the failure.
    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_unknown_environment_is_rejected(monkeypatch: pytest.MonkeyPatch) -> None:
    monkeypatch.setenv("APP_ENV", "staging")

    with pytest.raises(ValidationError):
        Settings(_env_file=None)


def test_origins_are_split_and_trimmed() -> None:
    settings = Settings(
        app_env="development",
        allowed_origins="http://localhost:5502, https://www.stonybrookshpe.org ",
    )

    assert settings.cors_origins == [
        "http://localhost:5502",
        "https://www.stonybrookshpe.org",
    ]
    assert settings.is_production is False
