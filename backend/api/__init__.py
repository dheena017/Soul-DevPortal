"""
Aggregated API router registering all 4 Pillar routers and legacy endpoints.

4 Pillars:
  1. /api/projects  -> ProjectsRouter
  2. /api/packages  -> PackagesRouter
  3. /api/docs      -> DocsRouter
  4. /api/explore   -> ExploreRouter
"""

from __future__ import annotations

from fastapi import APIRouter

# Import 4 Pillar Routers
from .projects import router as projects_router
from .packages import router as packages_router
from .docs import router as docs_router
from .explore import router as explore_router

# Legacy / Secondary routers for backward compatibility
from .workspace import router as workspace_router
from .symbols import router as symbols_router
from .cli_tools import router as cli_tools_router
from .telemetry import router as telemetry_router

api_router = APIRouter(prefix="/api")

# Register 4 Pillar Routers
api_router.include_router(projects_router)
api_router.include_router(packages_router)
api_router.include_router(docs_router)
api_router.include_router(explore_router)

# Register Backward-Compatible Routers
api_router.include_router(workspace_router)
api_router.include_router(symbols_router)
api_router.include_router(cli_tools_router)
api_router.include_router(telemetry_router)

__all__ = ["api_router"]
