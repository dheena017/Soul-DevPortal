"""
FastAPI router for packages list and package detail.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/packages", tags=["Packages"])


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
    """Retrieves full package data including deep AST symbols, CLI tools, and README blocks."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    pkg = next((p for p in data.get("packages", []) if p["id"] == package_id), None)
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Package '{package_id}' not found")
    return pkg
