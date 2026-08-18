"""The one place in the backend that reads the environment.

Everything else imports `get_settings()`. Required variables have no defaults, so a
missing one raises at startup instead of surfacing as a mystery 500 on the first
request. See engineering-rules.md §4.3.
"""

from __future__ import annotations

from functools import lru_cache
from pathlib import Path
from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict

# app/core/config.py -> app/core -> app -> backend/
BACKEND_DIR = Path(__file__).resolve().parents[2]

Environment = Literal["development", "production"]
LogLevel = Literal["DEBUG", "INFO", "WARNING", "ERROR"]


class Settings(BaseSettings):
    """Validated application configuration, built once per process."""

    # `extra="ignore"` so that variables documented in .env.example ahead of the slice
    # that reads them do not crash startup.
    model_config = SettingsConfigDict(
        env_file=BACKEND_DIR / ".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )

    app_env: Environment
    allowed_origins: str = Field(
        description="Comma-separated browser origins allowed to call this API.",
    )
    log_level: LogLevel = "INFO"

    @property
    def is_production(self) -> bool:
        return self.app_env == "production"

    @property
    def cors_origins(self) -> list[str]:
        """`allowed_origins` split into the list Starlette's CORS middleware wants."""
        return [origin.strip() for origin in self.allowed_origins.split(",") if origin.strip()]


@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """Return the process-wide settings, building them on first call.

    Called from `create_app()` so that a bad environment fails at boot, not mid-request.
    """
    return Settings()
