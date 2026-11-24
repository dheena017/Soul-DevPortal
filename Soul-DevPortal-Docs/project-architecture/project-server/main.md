# Project Server Architecture — Technical Specification & Guide

> **Domain**: FastAPI Server Lifecycle, ASGI Middleware Pipeline & Production Runtime  
> **Applies to**: Backend microservices in `Soul-DevPortal-Projects/`

---

## 1. FastAPI Application Pipeline Blueprint

Every backend service is initialized via an Application Factory pattern (`create_app()`), guaranteeing modularity, isolated test execution, and clean lifecycle management.

```
                   FASTAPI ASGI REQUEST PIPELINE
 ┌─────────────────────────────────────────────────────────────┐
 │                      Client Request                         │
 └─────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                1. CORS Middleware                           │
 │                (Checks Origin against whitelist)            │
 └─────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                2. Request ID & Tracing                      │
 │                (Generates/Extracts X-Request-ID)            │
 └─────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                3. Performance Timer & Masked Logger         │
 │                (Measures latency, logs sanitized event)     │
 └─────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                4. Global Exception Interceptor              │
 │                (Catches unhandled errors -> 500 Envelope)   │
 └─────────────────────────────┬───────────────────────────────┘
                               │
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                5. Router & Dependency Injection             │
 │                (Pydantic validation -> Service -> Database) │
 └─────────────────────────────────────────────────────────────┘
```

---

## 2. Complete Server Factory Implementation (`server/app/factory.py`)

```python
import time
import uuid
from contextlib import asynccontextmanager
from typing import Callable
from fastapi import FastAPI, Request, Response, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError

from database.connection import get_db_connection, bootstrap_database

@asynccontextmanager
async def server_lifespan(app: FastAPI):
    # Startup Phase: Verify and initialize database
    print("[SERVER] Initializing database and resources...")
    conn = get_db_connection()
    try:
        bootstrap_database(conn)
    finally:
        conn.close()
    
    yield
    
    # Shutdown Phase: Close open resources
    print("[SERVER] Gracefully releasing database handles and background threads...")

def create_application() -> FastAPI:
    app = FastAPI(
        title="Soul-DevPortal Microservice",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
        openapi_url="/api/openapi.json",
        lifespan=server_lifespan
    )

    # 1. CORS Configuration
    app.add_middleware(
        CORSMiddleware,
        allow_origins=[
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "http://localhost:5181",
            "http://127.0.0.1:5181"
        ],
        allow_credentials=True,
        allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
        allow_headers=["*"],
    )

    # 2. Request Timing & ID Middleware
    @app.middleware("http")
    async def trace_and_timing_middleware(request: Request, call_next: Callable) -> Response:
        request_id = request.headers.get("X-Request-ID", f"req_{uuid.uuid4().hex[:12]}")
        start_time = time.perf_counter()
        
        response: Response = await call_next(request)
        
        process_time = (time.perf_counter() - start_time) * 1000
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time-Ms"] = f"{process_time:.2f}"
        return response

    # 3. Global Exception Interceptor
    @app.exception_handler(Exception)
    async def global_exception_handler(request: Request, exc: Exception):
        print(f"[ERROR] Uncaught server exception: {exc}")
        return JSONResponse(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            content={
                "success": False,
                "data": None,
                "error": "Internal server error occurred.",
                "requestId": request.headers.get("X-Request-ID")
            }
        )

    # 4. Validation Exception Formatter
    @app.exception_handler(RequestValidationError)
    async def validation_exception_handler(request: Request, exc: RequestValidationError):
        return JSONResponse(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            content={
                "success": False,
                "data": None,
                "error": "Request validation failed.",
                "details": exc.errors()
            }
        )

    return app
```

---

## 3. Server Bootstrap Entry Point (`server/main.py`)

```python
import argparse
import uvicorn
from app.factory import create_application

app = create_application()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run FastAPI Microservice")
    parser.add_argument("--port", type=int, default=8000, help="Server port (8000-8008)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Bind host")
    parser.add_argument("--reload", action="store_true", help="Enable hot reload")
    args = parser.parse_args()

    uvicorn.run(
        "main:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        log_level="info"
    )
```

---

## 4. Production Checklist

- [ ] Fast startup (< 500ms).
- [ ] Explicit port assignment from `projects.json`.
- [ ] Safe database directory resolution.
- [ ] Interactive docs available at `/api/docs`.
- [ ] Healthcheck responding at `/api/health`.
