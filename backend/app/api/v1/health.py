"""Liveness endpoint: is the service up and which environment answered."""

from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app import __version__
from app.core.config import Settings, get_settings

router = APIRouter(tags=["health"])


class HealthStatus(BaseModel):
    status: Literal["ok"]
    environment: str
    version: str


class HealthResponse(BaseModel):
    data: HealthStatus


# Public by design: uptime checks run unauthenticated. Every other route added to this
# API is private until it says otherwise (engineering-rules.md §6.1).
@router.get("/health", response_model=HealthResponse, summary="Liveness check")
def read_health(settings: Annotated[Settings, Depends(get_settings)]) -> HealthResponse:
    return HealthResponse(
        data=HealthStatus(status="ok", environment=settings.app_env, version=__version__)
    )
