"""
[Pillar 4: Explore API Router]
Exposes monorepo-wide AST symbol searches, port collision matrix, telemetry, and snippet generation.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Query, Body
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/explore", tags=["Pillar 4: Explore"])


@router.get("/symbols")
def search_explore_symbols(
    q: Optional[str] = Query(None, description="Search query string"),
    language: Optional[str] = Query(None, description="Filter by language: python or typescript"),
    kind: Optional[str] = Query(None, description="Filter by kind: class, function, method, interface, type"),
    package_id: Optional[str] = Query(None, description="Filter by package ID"),
):
    """Searches and filters AST symbols across all monorepo packages."""
    service = WorkspaceService.get_instance()
    data = service.get_data()

    all_symbols = []
    for pkg in data.get("packages", []):
        if package_id and pkg["id"] != package_id:
            continue
        for sym in pkg.get("symbols", []):
            all_symbols.append({
                "packageId": pkg["id"],
                "packageName": pkg["name"],
                **sym,
            })

    results = all_symbols
    if language:
        results = [s for s in results if s.get("language") == language.lower()]
    if kind:
        results = [s for s in results if s.get("kind") == kind.lower()]
    if q:
        needle = q.lower().strip()
        results = [
            s for s in results
            if needle in s.get("name", "").lower()
            or needle in s.get("signature", "").lower()
            or needle in s.get("docstring", "").lower()
        ]

    return {
        "query": q,
        "total": len(results),
        "results": results,
    }


@router.get("/ports")
def get_explore_ports():
    """Returns the monorepo port matrix with live socket probe status."""
    service = WorkspaceService.get_instance()
    projects = service.get_projects_live()
    return {
        "totalProjects": len(projects),
        "projects": projects,
    }


@router.get("/telemetry")
def get_explore_telemetry():
    """Returns real-time code telemetry, total LOC, file counts, and symbol statistics."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    return {
        "stats": data.get("stats", {}),
        "generatedAt": data.get("meta", {}).get("scannedAt"),
    }


@router.post("/snippets")
def generate_integration_snippet(payload: dict = Body(...)):
    """Generates starter code snippets for importing packages into consumer apps."""
    pkg_id = payload.get("packageId", "config")
    framework = payload.get("framework", "vite")

    snippets = {
        "config": {
            "title": "Config Package Integration",
            "snippet": 'import workspacePreset from "@workspace/config/tailwind/preset";\n\nexport default { presets: [workspacePreset] };',
        },
        "logger": {
            "title": "Logger Package Integration",
            "snippet": 'import { consoleLogger } from "@workspace/logger";\n\nconsoleLogger.success("APP", "Connected to Soul Workspace");',
        },
        "runner": {
            "title": "Runner CLI Task Integration",
            "snippet": 'from runner.external import run_single_process\n\nrun_single_process(["python", "server/main.py"])',
        },
    }

    selected = snippets.get(pkg_id, snippets["config"])
    return {
        "packageId": pkg_id,
        "framework": framework,
        **selected,
    }
