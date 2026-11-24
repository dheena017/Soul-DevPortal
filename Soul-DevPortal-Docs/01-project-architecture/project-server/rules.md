# Project Server Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: All Python FastAPI + Uvicorn server implementations in `Soul-DevPortal-Projects/`

---

## The 8 Inviolable Server Rules

### 1. Mandatory Python FastAPI + Uvicorn Runtime
- **Rule**: All backend microservices must be built with Python 3.12+ using FastAPI and served via Uvicorn.
- **Port Allocation**: Server ports are strictly pinned between `8000` and `8008` (matching `projects.json`).

### 2. Lifespan Handler over Deprecated Startup Events
- **Rule**: Application lifecycle events must be managed using the ASGI `@asynccontextmanager` `lifespan` handler.
- **Prohibition**: Deprecated `@app.on_event("startup")` and `@app.on_event("shutdown")` are strictly forbidden.

### 3. Strict CORS Whitelisting
- **Rule**: Cross-Origin Resource Sharing (CORS) middleware must explicitly whitelist only authorized local client origins (e.g. `http://localhost:5173`, `http://127.0.0.1:5173`).
- **Prohibition**: `allow_origins=["*"]` is strictly forbidden in production configurations or with `allow_credentials=True`.

### 4. Zero Blocking Calls on the Event Loop
- **Rule**: The main async event loop must never be blocked by CPU-intensive calculations, synchronous file I/O, or blocking network calls.
- **Remediation**: Use `await asyncio.to_thread(blocking_function, *args)`.

### 5. Dependency Injection for Shared Resources
- **Rule**: Database connections, AI client instances (Gemini), and configuration objects must be supplied to route handlers using FastAPI's `Depends()` dependency injection mechanism.

### 6. Centralized Exception Handling Middleware
- **Rule**: The server must register global exception handlers for `RequestValidationError`, `HTTPException`, and uncaught `Exception`.
- **Constraint**: Uncaught exceptions must return a standardized JSON error envelope with HTTP status 500 without leaking Python tracebacks to the client.

### 7. Structured Logging with `@workspace/logger`
- **Rule**: All request access logs and system diagnostic events must be formatted using `@workspace/logger` or standardized 5-column formats:
  `[TIMESTAMP] [LEVEL] [SERVICE] [TRACE_ID] MESSAGE`
- **Constraint**: Sensitive tokens, passwords, and PII must be automatically masked before output.

### 8. Graceful Shutdown & Process Cleanup
- **Rule**: Servers must intercept `SIGINT` and `SIGTERM` signals, drain in-flight requests within a 5-second grace period, close SQLite WAL handles, and exit cleanly with code `0`.
