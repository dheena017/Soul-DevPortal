# Project API Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: All FastAPI and Express backend services in `Soul-DevPortal-Projects/`

---

## The 8 Inviolable API Rules

### 1. Mandatory Prefixing (`/api` or `/api/v1`)
- **Rule**: Every HTTP endpoint must be served under `/api` or `/api/v1`. Root-level endpoints like `/users` or `/items` are strictly prohibited.
- **Rationale**: Enables transparent reverse proxying in Vite (`/api` -> backend) without conflicting with client SPA client-side routes.

### 2. Standardized JSON Response Envelope
- **Rule**: All successful and erroneous responses must adhere to the standard envelope format:
  ```json
  {
    "success": true,
    "data": { ... },
    "error": null,
    "timestamp": "2026-11-24T12:00:00.000Z",
    "meta": {
      "version": "1.0.0",
      "requestId": "req_8f1b2c3d"
    }
  }
  ```
- **Rule**: For failures, `success` must be `false`, `data` must be `null`, and `error` must contain a structured string or object.

### 3. Strict HTTP Status Code Semantics
- **Rule**: Never return HTTP 200 OK with an error payload.
- **Standards**:
  - `200 OK`: Successful read or standard mutation.
  - `201 Created`: Successful creation of a new entity (returns entity in `data`).
  - `204 No Content`: Successful deletion or execution with no payload.
  - `400 Bad Request`: Business rule violation or domain rejection.
  - `401 Unauthorized`: Missing or invalid authentication token.
  - `403 Forbidden`: Authenticated user lacks permission.
  - `404 Not Found`: Target resource does not exist.
  - `422 Unprocessable Entity`: Schema validation failure (Pydantic / Zod).
  - `500 Internal Server Error`: Unhandled server exception.

### 4. Mandatory Health & Readiness Probes
- **Rule**: Every backend must implement `GET /api/health` and `GET /api/ready`.
- **Health Contract**:
  ```json
  {
    "status": "healthy",
    "app": "apexmind-ai",
    "timestamp": "2026-11-24T12:00:00.000Z",
    "uptime_seconds": 1840,
    "db_connected": true
  }
  ```

### 5. No Logic in `main.py`
- **Rule**: `main.py` is reserved exclusively for the application factory, lifespan management, middleware registration, and router aggregation.
- **Constraint**: Zero endpoint route handlers (`@app.get()`, `@app.post()`) may be written inside `main.py`. All handlers must reside in feature routers under `features/<feature>/router.py` or `routes/`.

### 6. Pydantic v2 Request/Response Validation
- **Rule**: Every mutating endpoint (`POST`, `PUT`, `PATCH`) must validate incoming bodies with strict Pydantic v2 models. Every endpoint must declare a typed `response_model`.
- **Prohibition**: Untyped `dict` parameters (`data: dict = Body(...)`) are forbidden.

### 7. Explicit Async Handlers
- **Rule**: Every FastAPI route handler must be declared as `async def`.
- **Constraint**: If performing synchronous blocking I/O (e.g., legacy SDK or CPU video transformation), wrap it in `await asyncio.to_thread(...)`.

### 8. Structured Error Handling & Global Interceptor
- **Rule**: Application code must raise standard `HTTPException` or custom domain exceptions.
- **Constraint**: The global exception interceptor must catch uncaught exceptions, log the stack trace using `@workspace/logger` with sensitive data masked, and return a clean 500 JSON envelope without leaking internal stack traces to the client.
