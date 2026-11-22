"""
FastAPI router for symbol search and inspection.
"""

from __future__ import annotations

from typing import Optional
from fastapi import APIRouter, Query
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/symbols", tags=["Symbols"])


@router.get("")
def search_symbols(
    q: Optional[str] = Query(None, description="Search query string"),
    language: Optional[str] = Query(None, description="Filter by language: python or typescript"),
    kind: Optional[str] = Query(None, description="Filter by kind: class, function, method, interface, type"),
    package_id: Optional[str] = Query(None, description="Filter by package ID"),
):
    """Search and filter AST symbols across the monorepo."""
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
        "total": len(results),
        "results": results,
    }
