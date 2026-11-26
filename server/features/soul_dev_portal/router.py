"""
Soul Dev Portal API Router.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException, Query
from fastapi.responses import FileResponse
from features.soul_dev_portal.service import SoulDevPortalService

router = APIRouter(prefix="/soul-dev-portal", tags=["Soul Dev Portal"])


@router.get("/commands")
def get_portal_commands():
    """Serves all monorepo lifecycle runner commands directly from root package.json."""
    return SoulDevPortalService.get_commands()


@router.get("/health")
def get_portal_health():
    """Process supervisor health check verifying FastAPI uptime and SQLite WAL status."""
    return SoulDevPortalService.get_health()


@router.get("/overview")
def get_portal_overview():
    """Core portal service metadata and documentation links."""
    return SoulDevPortalService.get_overview()


@router.get("/code-updates")
def get_code_updates(limit: int = Query(default=80, ge=10, le=200)):
    """Returns live workspace file modifications and git commit updates grouped by date."""
    return SoulDevPortalService.get_code_updates(limit=limit)


@router.get("/desktop-info")
def get_desktop_info():
    """Lists available standalone Windows Electron installers built under release/."""
    return SoulDevPortalService.get_desktop_info()


@router.get("/desktop-download")
def download_desktop_app(variant: str = Query(default="auto", pattern="^(auto|setup|portable)$")):
    """Streams the Windows standalone Desktop App (.exe) installer or portable binary."""
    artifact = SoulDevPortalService.resolve_desktop_artifact(variant)
    if artifact is None or not artifact.is_file():
        raise HTTPException(
            status_code=404,
            detail="Windows desktop installer not built yet. Run 'npm run desktop:build' to generate release artifacts.",
        )
    return FileResponse(
        path=str(artifact),
        filename=artifact.name,
        media_type="application/vnd.microsoft.portable-executable",
    )


@router.post("/desktop-shortcut")
def create_desktop_shortcut():
    """Creates a single-click Windows Desktop & Start Menu shortcut for the standalone Desktop App."""
    result = SoulDevPortalService.create_desktop_shortcut()
    if not result.get("success"):
        raise HTTPException(status_code=500, detail=result.get("error", "Shortcut creation failed"))
    return result


@router.post("/desktop-launch")
def launch_desktop_app():
    """Launches the standalone Electron Desktop Application window with embedded UI and FastAPI backend."""
    result = SoulDevPortalService.launch_desktop_app()
    if not result.get("launched"):
        raise HTTPException(status_code=500, detail=result.get("error", "Failed to launch desktop app"))
    return result
