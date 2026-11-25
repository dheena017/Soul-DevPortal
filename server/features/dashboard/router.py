"""
Dashboard Aggregator Router.
Serves GET /api/dashboard/overview, GET /api/workspace, and POST /api/workspace/refresh.
"""

from __future__ import annotations

from fastapi import APIRouter
from features.dashboard.service import DashboardService

router = APIRouter(tags=["Dashboard & Workspace"])
service = DashboardService()


@router.get("/dashboard/overview")
def get_dashboard_overview():
    """Consolidates ALL Projects, ALL Packages, and ALL Docs for Overview.tsx."""
    return service.get_dashboard_overview()


@router.get("/workspace")
def get_workspace_bundle():
    """Master contract for DevPortal client (fetchWorkspaceData in api.ts)."""
    return service.get_dashboard_overview()


@router.post("/workspace/refresh")
def refresh_workspace_bundle():
    """Triggers live filesystem re-scan, re-computes telemetry, and syncs SQLite."""
    data = service.get_dashboard_overview(force_refresh=True)
    return {
        "success": True,
        "message": "Workspace refreshed successfully.",
        "stats": data.get("stats", {}),
    }
