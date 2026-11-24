"""
Soul Dev Portal API Router.
"""

from __future__ import annotations

from fastapi import APIRouter
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
