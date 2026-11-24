"""
Projects Domain API Router.
Granular navigation, list-all, live socket health, and per-tab detail endpoints.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from features.projects.service import ProjectService

router = APIRouter(prefix="/projects", tags=["Pillar 1: Projects"])
service = ProjectService()


@router.get("/navigation")
def get_projects_navigation():
    """Serves the complete dynamic navigation tree for all projects with available tabs."""
    return service.get_navigation()


@router.get("/list-all")
def get_projects_list_all():
    """Lists all 8 micro-applications with real-time TCP socket probes and assigned ports."""
    return service.get_all_projects()


@router.get("")
def get_projects_alias():
    """Alias for list-all."""
    return service.get_all_projects()


@router.get("/{project_name}/health")
def get_project_health(project_name: str):
    """Instant live TCP socket ping for a single project's client and server ports."""
    health = service.get_project_health(project_name)
    if not health.get("found", True):
        raise HTTPException(status_code=404, detail=f"Project '{project_name}' not found")
    return health


@router.get("/details/{project_name}/{tab}")
def get_project_tab_content(project_name: str, tab: str):
    """Serves granular tab data (overview, api, database, env, scripts, files, readme)."""
    data = service.get_tab_content(project_name, tab)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@router.get("/details/{project_name}")
@router.get("/{project_name}")
def get_project_detail(project_name: str):
    """Retrieves full specification for a project."""
    proj = service.get_project_by_id(project_name)
    if not proj:
        raise HTTPException(status_code=404, detail=f"Project '{project_name}' not found")
    return proj
