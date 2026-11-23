"""
FastAPI Application Server for Soul Workspace Monorepo.
Serves live AST symbols, real-time port status probes, and monorepo telemetry.
Consumes shared packages: workspace_logger and workspace_runner.
Runs on dedicated Port 8008.
"""

from __future__ import annotations

import sys
from contextlib import asynccontextmanager
from datetime import datetime, timezone

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from core.paths import PACKAGES_ROOT

# Link and consume shared monorepo packages directly
if str(PACKAGES_ROOT) not in sys.path:
    sys.path.insert(0, str(PACKAGES_ROOT))

from logger.external import RequestLoggingMiddleware, print_backend_banner, is_port_in_use

from api import api_router
from core.workspace_service import WorkspaceService


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Perform AST warm cache scan in background so Uvicorn starts listening immediately
    import asyncio
    service = WorkspaceService.get_instance()
    asyncio.create_task(asyncio.to_thread(service.refresh))
    yield


app = FastAPI(
    title="Soul Workspace Monorepo API",
    description="Real-time FastAPI backend providing live AST symbols, port status, and monorepo telemetry.",
    version="2.0.0",
    lifespan=lifespan,
)

# 1. Shared Package Middleware: @workspace/logger RequestLoggingMiddleware
app.add_middleware(RequestLoggingMiddleware, service_name="PACKAGES-API")

# 2. CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 3. Register all modular API routes
app.include_router(api_router)


@app.get("/", tags=["Health"])
def root_index():
    """Service landing page and navigation overview."""
    return {
        "service": "Soul Workspace Monorepo API",
        "version": "2.0.0",
        "status": "online",
        "consumedPackages": ["@workspace/logger", "@workspace/runner", "@workspace/config"],
        "docsUrl": "/docs",
        "openapiUrl": "/openapi.json",
        "endpoints": {
            "workspace": "/api/workspace",
            "packages": "/api/packages",
            "projects": "/api/projects",
            "docs": "/api/docs",
            "explore": "/api/explore",
            "symbols": "/api/symbols",
            "cliTools": "/api/cli-tools",
            "guides": "/api/guides",
            "telemetry": "/api/telemetry",
            "health": "/api/health",
        },
    }


@app.get("/api/health", tags=["Health"])
def health_probe():
    """Healthcheck endpoint for process supervisors and uptime probes."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "port": 8008,
        "runnerSupervisor": "active",
        "loggerTelemetry": "active",
    }
