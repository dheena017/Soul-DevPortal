"""
FastAPI Application Factory.
Configures lifespan, CORS, @workspace/logger middleware, and registers all feature routers under /api.
"""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone
from pathlib import Path

from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware

from shared.paths import PACKAGES_ROOT
from shared.config import APP_VERSION, SERVICE_NAME

# Ensure shared packages can be imported
if str(PACKAGES_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGES_ROOT))

# Feature routers
from features.dashboard.router import router as dashboard_router
from features.soul_dev_portal.router import router as portal_router
from features.projects.router import router as projects_router
from features.packages.router import router as packages_router
from features.docs.router import router as docs_router
from features.system.router import router as system_router
from features.dashboard.service import DashboardService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform background warm-up scan
    import asyncio
    svc = DashboardService()
    asyncio.create_task(asyncio.to_thread(svc.get_dashboard_overview))
    yield


def create_app() -> FastAPI:
    """Builds and returns the configured FastAPI application."""
    app = FastAPI(
        title="Soul Workspace Monorepo API",
        description="Pure-live FastAPI backend providing granular navigation, live AST symbols, port status, and monorepo telemetry.",
        version=APP_VERSION,
        lifespan=lifespan,
    )

    # 1. CORS Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # 2. Consume @workspace/logger middleware if available
    try:
        from logger.external import RequestLoggingMiddleware
        app.add_middleware(RequestLoggingMiddleware, service_name="SOUL-PORTAL-API")
    except Exception:
        pass

    # 3. Master /api router
    api_router = APIRouter(prefix="/api")
    api_router.include_router(dashboard_router)
    api_router.include_router(portal_router)
    api_router.include_router(projects_router)
    api_router.include_router(packages_router)
    api_router.include_router(docs_router)
    api_router.include_router(system_router)

    from features.system.sampler import system_sampler
    system_sampler.warm_up_async()

    # Global /api/health probe
    @api_router.get("/health", tags=["Health"])
    def global_health_probe():
        return {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": APP_VERSION,
            "port": 8008,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    app.include_router(api_router)

    # Root service index
    @app.get("/", tags=["Root"])
    def root_landing():
        return {
            "service": "Soul Workspace Monorepo API",
            "version": APP_VERSION,
            "status": "online",
            "docsUrl": "/docs",
            "openapiUrl": "/openapi.json",
            "endpoints": {
                "dashboard": "/api/dashboard/overview",
                "workspace": "/api/workspace",
                "portalCommands": "/api/soul-dev-portal/commands",
                "portalHealth": "/api/soul-dev-portal/health",
                "projectsNav": "/api/projects/navigation",
                "projectsList": "/api/projects/list-all",
                "packagesNav": "/api/packages/navigation",
                "packagesList": "/api/packages/list-all",
                "docsNav": "/api/docs/navigation",
                "docsList": "/api/docs/list-all",
                "health": "/api/health",
            },
        }

    return app
