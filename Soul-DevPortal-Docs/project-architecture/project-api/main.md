# Project API Architecture — Technical Specification & Guide

> **Domain**: Backend API Architecture & Routing Standards  
> **Applies to**: Python FastAPI + Uvicorn Services & React 19 Client Proxy

---

## 1. Architectural Overview

In the Soul Monorepo, the API layer is designed to achieve zero client-server coupling, uniform error telemetry, and predictable developer ergonomics. The client never communicates directly with backend hostnames; instead, all requests pass through Vite's development reverse proxy or production load balancers.

```
                           API COMMUNICATION TOPOLOGY
 ┌─────────────────────────────────┐
 │       Client Application        │
 │  fetch('/api/v1/sessions')      │
 └────────────────┬────────────────┘
                  │ (Port 5173 - 5181)
                  ▼
 ┌─────────────────────────────────┐
 │     Vite Dev Reverse Proxy      │
 │  proxy: '/api' -> :8000         │
 └────────────────┬────────────────┘
                  │ HTTP / WebSocket (Port 8000 - 8008)
                  ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                FastAPI Application Pipeline                 │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ Middleware 1: CORS & Security Headers                 │  │
 │  │ Middleware 2: Request ID Injection (`X-Request-ID`)    │  │
 │  │ Middleware 3: Timing & @workspace/logger Masking      │  │
 │  │ Middleware 4: Global Exception Interceptor            │  │
 │  └───────────────────────────┬───────────────────────────┘  │
 │                              ▼                              │
 │  ┌───────────────────────────────────────────────────────┐  │
 │  │ Feature Router (`features/chat/router.py`)            │  │
 │  │ ├─ Input Validation: Pydantic v2 Schema               │  │
 │  │ ├─ Business Service: Dependency Injection (`Depends`) │  │
 │  │ └─ Response Envelope: `{ success, data, error }`      │  │
 │  └───────────────────────────────────────────────────────┘  │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Standard JSON Response Envelope

Every endpoint in the monorepo returns data wrapped in a deterministic envelope.

### Python Envelope Implementation (`server/shared/schemas.py`)

```python
from typing import Generic, TypeVar, Optional, Any
from datetime import datetime, timezone
from pydantic import BaseModel, Field

T = TypeVar("T")

class MetaData(BaseModel):
    version: str = "1.0.0"
    requestId: Optional[str] = None

class ApiResponse(BaseModel, Generic[T]):
    success: bool
    data: Optional[T] = None
    error: Optional[str] = None
    timestamp: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())
    meta: Optional[MetaData] = None

    @classmethod
    def ok(cls, data: T, request_id: Optional[str] = None) -> "ApiResponse[T]":
        return cls(
            success=True,
            data=data,
            error=None,
            meta=MetaData(requestId=request_id) if request_id else None
        )

    @classmethod
    def fail(cls, error_msg: str, request_id: Optional[str] = None) -> "ApiResponse[None]":
        return cls(
            success=false,
            data=None,
            error=error_msg,
            meta=MetaData(requestId=request_id) if request_id else None
        )
```

---

## 3. Router Composition & Lifespan Architecture

Routes must be organized into feature-level routers and mounted cleanly in the application factory.

### Router Pattern (`server/features/projects/router.py`)

```python
from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, Field
from typing import List

router = APIRouter(prefix="/projects", tags=["Projects"])

class CreateProjectSchema(BaseModel):
    title: str = Field(..., min_length=3, max_length=100)
    category: str = Field(..., description="Project category slug")

class ProjectResponse(BaseModel):
    id: str
    title: str
    category: str

@router.post("/", response_model=ApiResponse[ProjectResponse], status_code=status.HTTP_201_CREATED)
async def create_project(payload: CreateProjectSchema):
    # Service execution...
    created = ProjectResponse(id="proj_123", title=payload.title, category=payload.category)
    return ApiResponse.ok(created)
```

### Application Factory (`server/app/factory.py`)

```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Initialize SQLite WAL connection pool, load models
    print("[SERVER] Starting up and initializing databases...")
    yield
    # Shutdown: Release connections, flush cache, close sockets
    print("[SERVER] Gracefully shutting down...")

def create_app() -> FastAPI:
    app = FastAPI(
        title="Soul-DevPortal Microservice API",
        version="1.0.0",
        docs_url="/api/docs",
        openapi_url="/api/openapi.json",
        lifespan=lifespan
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    # Mount feature routers with unified prefix
    from features.projects.router import router as projects_router
    app.include_router(projects_router, prefix="/api/v1")

    return app
```

---

## 4. Health Check Specification

Every service exposes `GET /api/health`:

```python
import time
from fastapi import APIRouter

health_router = APIRouter(prefix="/api", tags=["System"])
START_TIME = time.time()

@health_router.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "uptime": int(time.time() - START_TIME)
    }
```

---

## 5. Streaming & WebSocket Architecture

For AI streaming (e.g. Gemini narrative synthesis in `apexmind-ai` and `globalpulse-ai`), use Server-Sent Events (SSE) or WebSockets under `/api/ws/`:

```python
from fastapi import WebSocket, WebSocketDisconnect
from fastapi.responses import StreamingResponse
import asyncio

@router.get("/stream")
async def stream_data():
    async def event_generator():
        for i in range(5):
            await asyncio.sleep(0.5)
            yield f"data: {{\"step\": {i}, \"message\": \"Synthesizing\"}}\n\n"
    return StreamingResponse(event_generator(), media_type="text/event-stream")
```
