"""
[Pillar 1: Projects API Router]
Exposes consumer projects metadata, port mappings, and live socket probes.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/projects", tags=["Pillar 1: Projects"])


@router.get("")
def list_projects():
    """
    Lists all 8 monorepo consumer projects with live TCP socket probing
    showing if frontend (5173-5181) and backend (8000-8008) are active.
    """
    service = WorkspaceService.get_instance()
    return service.get_projects_live()


@router.get("/{slug}")
def get_project_by_slug(slug: str):
    """Retrieves metadata and port configurations for a specific project."""
    service = WorkspaceService.get_instance()
    projects = service.get_projects_live()
    proj = next((p for p in projects if p.get("slug") == slug), None)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{slug}' not found")
    return proj


@router.get("/{slug}/health")
def get_project_health(slug: str):
    """Probes live socket health for a single project's frontend and backend ports."""
    service = WorkspaceService.get_instance()
    projects = service.get_projects_live()
    proj = next((p for p in projects if p.get("slug") == slug), None)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{slug}' not found")

    fe = proj.get("frontend", {})
    be = proj.get("backend", {})
    return {
        "slug": slug,
        "name": proj.get("name"),
        "frontend": {"port": fe.get("port"), "isLive": fe.get("isLive", False)},
        "backend": {"port": be.get("port"), "isLive": be.get("isLive", False)},
    }
