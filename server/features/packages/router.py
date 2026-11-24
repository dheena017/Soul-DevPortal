"""
Packages Domain API Router.
Granular navigation, list-all, and per-tab endpoints (docs, api, manifest, playground).
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from features.packages.service import PackageService

router = APIRouter(prefix="/packages", tags=["Pillar 2: Packages"])
service = PackageService()


@router.get("/navigation")
def get_packages_navigation():
    """Serves the complete dynamic navigation tree for all packages with available tabs."""
    return service.get_navigation()


@router.get("/list-all")
def get_packages_list_all():
    """Lists all shared monorepo packages with versions, descriptions, LOC, and symbol counts."""
    return service.get_all_packages()


@router.get("")
def get_packages_alias():
    """Alias for list-all."""
    return service.get_all_packages()


@router.get("/details/{package_name}/{tab}")
def get_package_tab_content(package_name: str, tab: str):
    """Serves granular tab data (docs, api, manifest, playground)."""
    data = service.get_tab_content(package_name, tab)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@router.get("/details/{package_name}")
@router.get("/{package_name}")
def get_package_detail(package_name: str):
    """Retrieves full specification for a package."""
    pkg = service.get_package_by_id(package_name)
    if not pkg:
        raise HTTPException(status_code=404, detail=f"Package '{package_name}' not found")
    return pkg
