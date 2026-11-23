"""
Aggregated API router registering all 4 Pillar routers and workspace endpoints.

4 Pillars:
  1. /api/projects  -> projects.py
  2. /api/packages  -> packages.py
  3. /api/docs      -> docs.py
  4. /api/explore   -> explore.py

Core & Compatibility Routers:
  - /api/workspace  -> workspace.py
  - /api/symbols    -> symbols.py
  - /api/cli-tools  -> cli_tools.py
  - /api/telemetry  -> telemetry.py
"""

from __future__ import annotations

from fastapi import APIRouter

# 4 Pillar Routers
from .projects import router as projects_router
from .packages import router as packages_router
from .docs import router as docs_router
from .explore import router as explore_router

# Core & Compatibility Routers
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

# Register Core & Compatibility Routers
api_router.include_router(workspace_router)
api_router.include_router(symbols_router)
api_router.include_router(cli_tools_router)
api_router.include_router(telemetry_router)

__all__ = ["api_router"]
