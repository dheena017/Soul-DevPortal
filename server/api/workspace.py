"""
FastAPI router for full workspace data and dynamic refresh.
"""

from __future__ import annotations

from fastapi import APIRouter
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/workspace", tags=["Workspace"])


@router.get("")
def get_workspace_data():
    """Returns the complete, authoritative workspace data contract."""
    service = WorkspaceService.get_instance()
    return service.get_data()


@router.post("/refresh")
def refresh_workspace_data():
    """Triggers an on-demand re-scan of the entire monorepo AST symbols and manifests."""
    service = WorkspaceService.get_instance()
    fresh_data = service.refresh()
    return {
        "status": "success",
        "scannedAt": fresh_data["meta"]["scannedAt"],
        "packagesCount": fresh_data["stats"]["packagesCount"],
        "symbolsCount": fresh_data["stats"]["totalSymbols"],
    }
