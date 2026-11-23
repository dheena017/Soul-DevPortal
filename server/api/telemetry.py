"""
FastAPI router for codebase telemetry and statistics.
"""

from __future__ import annotations

from fastapi import APIRouter
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/telemetry", tags=["Telemetry"])


@router.get("")
def get_telemetry():
    """Returns real-time code metrics, total LOC, file counts, and symbol statistics."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    return {
        "stats": data.get("stats", {}),
        "generatedAt": data.get("meta", {}).get("scannedAt"),
    }
