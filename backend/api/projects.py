"""
FastAPI router for consumer projects with real-time port status probing.
"""

from __future__ import annotations

from fastapi import APIRouter
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/projects", tags=["Projects"])


@router.get("")
def list_consumer_projects():
    """
    Returns all 8 monorepo consumer projects with live TCP socket probing
    showing if frontend (5173-5181) and backend (8000-8008) are active.
    """
    service = WorkspaceService.get_instance()
    return service.get_projects_live()
