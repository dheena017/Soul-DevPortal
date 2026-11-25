"""
Computer & Performance Monitor Router.
Serves:
  - GET  /api/system/specs
  - GET  /api/system/live
  - GET  /api/system/overview
  - POST /api/system/refresh
"""

from __future__ import annotations

from fastapi import APIRouter

from features.system.service import SystemService

router = APIRouter(prefix="/system", tags=["Computer & Performance Monitor"])
service = SystemService()


@router.get("/specs")
def get_system_specs():
    """Returns full live-probed and human-decoded host hardware inventory."""
    return service.get_specs(force_refresh=False)


@router.get("/live")
def get_system_live():
    """Returns instant live performance telemetry + 60-sample history ring buffer."""
    return service.get_live()


@router.get("/overview")
def get_system_overview():
    """Combined initial payload containing static hardware specs + live performance snapshot."""
    return service.get_overview(force_refresh=False)


@router.post("/refresh")
def refresh_system_specs():
    """Forces fresh OS hardware/peripheral/runtime discovery and updates the spec cache."""
    specs = service.get_specs(force_refresh=True)
    return {
        "success": True,
        "message": "Host hardware specifications rescanned.",
        "specs": specs,
    }
