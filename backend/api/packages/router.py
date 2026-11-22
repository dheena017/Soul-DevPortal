"""
[Pillar 2: Packages API Router]
Exposes monorepo shared packages, AST exports, dependencies, and README blocks.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/packages", tags=["Pillar 2: Packages"])


@router.get("")
def list_packages():
    """Lists all indexed packages with their core manifest information."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    return [
        {
            "id": p["id"],
            "name": p["name"],
            "displayName": p["displayName"],
            "version": p["version"],
            "description": p["description"],
            "license": p["license"],
            "ecosystems": p["ecosystems"],
            "pythonName": p["pythonName"],
            "pythonModule": p["pythonModule"],
            "stats": p["stats"],
        }
        for p in data.get("packages", [])
    ]


@router.get("/{package_id}")
def get_package_detail(package_id: str):
    """Retrieves full package data including AST symbols, CLI tools, and README blocks."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    pkg = next((p for p in data.get("packages", []) if p["id"] == package_id), None)
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Package '{package_id}' not found")
    return pkg


@router.get("/{package_id}/symbols")
def get_package_symbols(
    package_id: str,
    language: Optional[str] = Query(None, description="Filter by language: python or typescript"),
    kind: Optional[str] = Query(None, description="Filter by kind: class, function, method, interface, type"),
):
    """Returns extracted AST symbols for a specific package."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    pkg = next((p for p in data.get("packages", []) if p["id"] == package_id), None)
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Package '{package_id}' not found")

    symbols = pkg.get("symbols", [])
    if language:
        symbols = [s for s in symbols if s.get("language") == language.lower()]
    if kind:
        symbols = [s for s in symbols if s.get("kind") == kind.lower()]

    return {"packageId": package_id, "symbolsCount": len(symbols), "symbols": symbols}


@router.get("/{package_id}/readme")
def get_package_readme(package_id: str):
    """Returns structured GFM markdown blocks for a package's README.md."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    pkg = next((p for p in data.get("packages", []) if p["id"] == package_id), None)
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Package '{package_id}' not found")
    return {"packageId": package_id, "blocks": pkg.get("readmeBlocks", [])}
