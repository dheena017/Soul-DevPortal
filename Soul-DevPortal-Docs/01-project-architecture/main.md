# Project Architecture — Master Technical Blueprint & Guide

> **Scope**: Enterprise Monorepo Architecture & Engineering Runbooks  
> **Applies to**: All micro-applications, shared packages, and developer portal components

---

---

## 1. Monorepo Structural Blueprint & Directory Layout

> **Domain**: Monorepo Topology, Directory Hierarchy & Module Scoping  
> **Applies to**: All micro-applications and shared packages across the workspace

---

### 1.1 Monorepo Top-Level Topology & Domains

The Soul Monorepo organizes all assets into three clear top-level domains:

- **`Soul-DevPortal-Packages/`**: Shared core libraries consumed by projects (`@workspace/logger`, `@workspace/runner`, `@workspace/config`).
- **`Soul-DevPortal-Projects/`**: Autonomous micro-applications adhering to the Three-Pillar standard.
- **`Soul-DevPortal-Docs/`**: The central engineering knowledge base and architectural standards portal.

```
                              SOUL MONOREPO ROOT
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                                                                             │
 │  ├── Soul-DevPortal-Packages/                                               │
 │  │   ├── workspace-config/   (@workspace/config)                            │
 │  │   ├── workspace-logger/   (@workspace/logger)                            │
 │  │   └── workspace-runner/   (@workspace/runner)                            │
 │  │                                                                          │
 │  ├── Soul-DevPortal-Projects/                                               │
 │  │   ├── apexmind-ai/                 (:5173 / :8000)                       │
 │  │   ├── outpass-system/              (:5174 / :8001)                       │
 │  │   ├── free-api-hub/                (:5175 / :8002)                       │
 │  │   ├── sonikoma/                    (:5176 / :8006)                       │
 │  │   ├── spatial-dimensions/          (:5177 / :8007)                       │
 │  │   ├── college-management-system/   (:5178 / :8005)                       │
 │  │   ├── globalpulse-ai/              (:5179 / :8003)                       │
 │  │   ├── postcraft-ai/                (:5180 / :8004)                       │
 │  │   └── devportal/                   (:5181 / :8008)                       │
 │  │                                                                          │
 │  └── Soul-DevPortal-Docs/                                                   │
 │      ├── 01-project-architecture/                                           │
 │      ├── 02-packages-architecture/                                          │
 │      ├── 03-networking-and-ports/                                           │
 │      └── 04-cheatsheets/                                                    │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 Workspace Dependency & Consumption Graph

```mermaid
graph TD
    subgraph Packages["Shared Workspace Core Packages (Soul-DevPortal-Packages/)"]
        Logger["@workspace/logger (TypeScript & Python)"]
        Config["@workspace/config (TypeScript, Tailwind, Prettier)"]
        Runner["@workspace/runner (CLI Supervisor & Orchestrator)"]
    end

    subgraph Projects["Autonomous Micro-Applications (Soul-DevPortal-Projects/)"]
        P1["apexmind-ai (:5173 / :8000)"]
        P2["outpass-system (:5174 / :8001)"]
        P3["free-api-hub (:5175 / :8002)"]
        P4["globalpulse-ai (:5179 / :8003)"]
        P5["postcraft-ai (:5180 / :8004)"]
        P6["college-management-system (:5178 / :8005)"]
        P7["sonikoma (:5176 / :8006)"]
        P8["spatial-dimensions (:5177 / :8007)"]
        P9["devportal (:5181 / :8008)"]
    end

    Logger --> P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8 & P9
    Config --> P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8 & P9
    Runner --> P1 & P2 & P3 & P4 & P5 & P6 & P7 & P8 & P9
```

---

### 1.3 Canonical Project Directory Tree

Every individual project inside `Soul-DevPortal-Projects/<app>/` adheres strictly to this layout:

```text
Soul-DevPortal-Projects/<app>/
├── client/                                    # Frontend Application (React 19 + Vite 8 + Tailwind v4)
│   ├── public/                                # Uncompiled static web assets
│   │   ├── logos/                             # Application branding
│   │   │   ├── logo.svg                       # Primary vector logo (Rendered by DevPortal)
│   │   │   └── logo-dark.svg                  # Dark mode variant
│   │   ├── favicon.svg                        # Tab icon
│   │   └── robots.txt                         # Crawler directives
│   ├── src/                                   # Client TypeScript source code
│   │   ├── app/                               # App factory, router & global layout
│   │   │   ├── App.tsx                        # Main shell component
│   │   │   ├── AppRouter.tsx                  # Declarative client-side routing
│   │   │   └── providers.tsx                  # Theme & query context providers
│   │   ├── features/                          # Domain feature slices
│   │   │   └── <feature-name>/                # Self-contained business capability
│   │   │       ├── api/                       # Typed API fetchers (/api/v1/...)
│   │   │       ├── components/                # Domain-specific UI cards & forms
│   │   │       ├── hooks/                     # Custom React 19 hooks
│   │   │       ├── types.ts                   # Domain TypeScript models
│   │   │       └── index.ts                   # Public barrier export
│   │   ├── shared/                            # Cross-feature reusable primitives
│   │   │   ├── components/ui/                 # Generic buttons, badges, inputs
│   │   │   ├── lib/                           # Utility helpers (cn, formatters)
│   │   │   └── hooks/                         # Generic browser hooks (useMediaQuery)
│   │   ├── index.css                          # Tailwind v4 @import entry point
│   │   └── main.tsx                           # DOM bootstrap entry
│   ├── index.html                             # Single Page Application HTML root
│   ├── package.json                           # Client dependencies & scripts
│   ├── tsconfig.json                          # TypeScript configuration with @/* alias
│   └── vite.config.ts                         # Bundler config with reverse proxy
│
├── server/                                    # Backend Service (Python FastAPI + Uvicorn)
│   ├── app/                                   # Application factory & lifespan
│   │   ├── factory.py                         # FastAPI create_app() & middleware
│   │   └── lifespan.py                        # Startup/shutdown lifecycle hooks
│   ├── features/                              # Domain feature slices
│   │   └── <feature-name>/                    # Domain capability
│   │       ├── router.py                      # APIRouter endpoint definitions
│   │       ├── service.py                     # Business algorithms & external APIs
│   │       ├── schemas.py                     # Pydantic v2 input/output models
│   │       └── __init__.py                    # Feature exports
│   ├── database/                              # Persistence management
│   │   ├── connection.py                      # SQLite WAL connection factory
│   │   ├── schema.sql                         # Canonical DDL table definitions
│   │   └── repository.py                      # CRUD repository helpers
│   ├── data/                                  # Persistent storage boundary (Ignored in Git)
│   │   ├── <app>.db                           # SQLite database file
│   │   └── .gitkeep                           # Git directory preservation
│   ├── shared/                                # Server utilities & logging wrappers
│   ├── main.py                                # Process bootstrap entry point
│   └── requirements.txt                       # Python dependencies
│
├── metadata.json                              # Canonical machine-readable project manifest
├── package.json                               # Workspace runner orchestration scripts
├── README.md                                  # Comprehensive onboarding & project guide
└── .env.example                               # Safe environment baseline template
```

---

### 1.4 Directory Responsibilities Matrix

| Directory | Mandatory Contents | Strict Boundaries & Prohibitions |
| --- | --- | --- |
| `client/src/features/` | Components, hooks, types, API calls scoped to 1 domain | Never import from private internals of other features; use `index.ts` |
| `client/src/app/` | Router, Providers, Shell Frame | Never write direct SQL, API mutations, or business calculations |
| `client/src/shared/` | UI primitives (Button, Modal, Input), formatting helpers | Must be strictly domain-agnostic; no business domain state |
| `server/features/` | Router, Service, Pydantic Schemas | Router must only handle HTTP/status codes; logic belongs in Service |
| `server/database/` | DDL schemas, connection factory, migrations | All file paths must be resolved dynamically; never hardcode `C:\...` |
| `server/data/` | SQLite `.db`, `.db-wal`, uploads, media | Strictly ignored in `.gitignore`; no code or configs allowed here |

---

## 2. Canonical Tech Stack & Framework Architecture

> **Domain**: Unified Framework Selection, Languages, Runtimes & Cross-Stack Tooling  
> **Applies to**: All 8 Micro-Applications & DevPortal in `Soul-DevPortal-Projects/`

---

### 2.1 Framework Selection Principles & Philosophy

To eliminate tooling fragmentation, maximize developer velocity, and ensure instant startup across the monorepo, all applications must strictly implement the **Unified Three-Pillar Standard**:

```
                       SOUL MONOREPO THREE-PILLAR STANDARD
 ┌─────────────────────────────────┐     ┌─────────────────────────────────┐
 │        CLIENT APPLICATION       │     │        BACKEND REST API         │
 │  React 19 + Vite 8 + Tailwind 4 │────►│    Python FastAPI + Uvicorn     │
 │  Ports: :5173 – :5181           │     │    Ports: :8000 – :8008         │
 └─────────────────────────────────┘     └────────────────┬────────────────┘
                                                          │
                                                          ▼
                                         ┌─────────────────────────────────┐
                                         │       PERSISTENCE LAYER         │
                                         │   SQLite (WAL Mode Engine)      │
                                         │   Location: server/data/<app>.db│
                                         └─────────────────────────────────┘
```

---

### 2.2 Pillar 1: Client Application Framework (React 19, Vite 8, Tailwind v4)

#### A. React 19 Frontend Engine

- **Core Primitives**:
  - `useActionState`: For form submission states, pending indicators, and action rollbacks.
  - `useOptimistic`: Instant UI updates before network responses settle.
  - `use()`: Reading resources (Promises, Context) directly inside component trees.
  - `<Suspense>`: Async boundary wrapping for streaming data.
- **Compiler Readiness**: Render functions must be strictly idempotent and pure.

#### B. Vite 8 Bundler Engine

- **Plugins**: `@vitejs/plugin-react`, `@tailwindcss/vite`.
- **Path Aliasing**: Enforce `@/*` -> `./src/*`.
- **Port Strategy**: Strict port binding (`strictPort: true`) matching the matrix in `projects.json`.
- **Proxy**: Forward `/api` and `/ws` to the corresponding FastAPI backend.

#### C. Tailwind CSS v4 Modern Styling

- **Engine**: Zero-config, Rust-based engine compiled via `@tailwindcss/vite`.
- **Syntax**:

  ```css
  /* client/src/index.css */
  @import "tailwindcss";

  @theme {
    --color-brand-primary: #3b82f6;
    --color-brand-dark: #0f172a;
    --font-heading: 'Plus Jakarta Sans', sans-serif;
  }
  ```

---

### 2.3 Pillar 2: Server Application Framework (Python 3.12+, FastAPI, Uvicorn)

#### A. Python 3.12+ & FastAPI Application Framework

- **Asynchronous Architecture**: Non-blocking I/O using `async def` route handlers.
- **Pydantic v2**: High-performance schema validation, serialization, and OpenAPI document generation (`/api/docs`).
- **Application Factory**: Modular app creation with ASGI `@asynccontextmanager` `lifespan`.

#### B. Uvicorn ASGI Production Server

- **Run Command**: `uvicorn main:app --host 127.0.0.1 --port <PORT> --reload`.
- **Graceful Lifecycle**: 5-second shutdown window to drain active connections and close database handles cleanly.

---

### 2.4 Pillar 3: Persistence Layer (SQLite WAL Mode)

- **Engine**: SQLite with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`).
- **Location**: `server/data/<project-name>.db` (strictly git-ignored).
- **Concurrency**: Unlimited parallel readers + non-blocking single writer.
- **Connection Management**: Scoped per request via FastAPI `Depends()`.

---

### 2.5 Technology Matrix across Micro-Applications

| Application | Client Framework | Server Framework | Persistence | AI Capabilities |
| --- | --- | --- | --- | --- |
| **apexmind-ai** | React 19 + Vite 8 + Tailwind 4 (:5173) | FastAPI + Uvicorn (:8000) | SQLite WAL (`apexmind.db`) | Gemini 2.5 Flash + TTS |
| **outpass-system** | React 19 + Vite 8 + Tailwind 4 (:5174) | FastAPI + Uvicorn (:8001) | SQLite WAL (`outpass.db`) | N/A |
| **free-api-hub** | React 19 + Vite 8 + Tailwind 4 (:5175) | FastAPI + Uvicorn (:8002) | SQLite WAL (`free_api_hub.db`) | Dynamic Mock Engine |
| **sonikoma** | React 19 + Vite 8 + Tailwind 4 (:5176) | FastAPI + Uvicorn (:8006) | SQLite WAL (`sonikoma.db`) | Gemini Video & Voice |
| **spatial-dimensions** | React 19 + Vite 8 + Tailwind 4 (:5177) | FastAPI + Uvicorn (:8007) | SQLite WAL (`spatial_dimensions.db`) | 3D Scene Transforms |
| **college-management** | React 19 + Vite 8 + Tailwind 4 (:5178) | FastAPI + Uvicorn (:8005) | SQLite WAL (`college_management.db`) | N/A |
| **globalpulse-ai** | React 19 + Vite 8 + Tailwind 4 (:5179) | FastAPI + Uvicorn (:8003) | SQLite WAL (`globalpulse.db`) | Gemini News Synthesizer |
| **postcraft-ai** | React 19 + Vite 8 + Tailwind 4 (:5180) | FastAPI + Uvicorn (:8004) | SQLite WAL (`postcraft.db`) | Gemini Creative GenAI |
| **devportal** | React 19 + Vite 8 + Tailwind 4 (:5181) | FastAPI + Uvicorn (:8008) | SQLite WAL (`workspace.db`) | AST Parsing + Port Monitor |

---

## 3. Client Application Architecture (React 19 + TypeScript + Vite)

> **Domain**: React 19 SPA Architecture, Vite 8 Bundler & Tailwind CSS v4  
> **Applies to**: All frontend client applications in `Soul-DevPortal-Projects/`

---

### 3.1 Modern Client Architectural Blueprint

Every frontend client in the Soul Monorepo is designed as a high-speed Single Page Application (SPA) running on React 19 and compiled with Vite 8.

```
                           REACT 19 CLIENT ARCHITECTURE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  index.html (HTML5 Shell)                                                   │
 │  └── src/main.tsx (createRoot / Concurrent DOM Mount)                       │
 │      └── src/app/App.tsx                                                    │
 │          ├── Theme & Query Providers (`src/app/providers.tsx`)              │
 │          └── AppRouter (`src/app/AppRouter.tsx`)                            │
 │              ├── Route: /          -> Dashboard Feature (`src/features/...`)│
 │              ├── Route: /sessions  -> Sessions Feature                     │
 │              └── Route: /settings  -> Settings Feature                     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                         All /api & /ws requests
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  Vite 8 Reverse Proxy Layer (`client/vite.config.ts`)                       │
 │  ├─ Transparently rewrites `/api/v1/*` to `http://127.0.0.1:8000/api/v1/*`  │
 │  └─ Transparently rewrites `/ws/*` to `ws://127.0.0.1:8000/ws/*`            │
 └─────────────────────────────────────────────────────────────────────────────┘
```

### Request Flow via Vite Reverse Proxy

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer / User
    participant Browser as Browser Client (:5173 - :5181)
    participant ViteProxy as Vite Reverse Proxy
    participant FastAPI as FastAPI Server (:8000 - :8008)
    participant SQLite as SQLite WAL Engine (server/data/)

    Dev->>Browser: Open Application UI
    Browser->>Browser: Render React 19 UI & Hooks (@/features)
    Browser->>ViteProxy: GET /api/v1/resource (Relative Path)
    Note over ViteProxy: Transparently proxies to localhost:8000
    ViteProxy->>FastAPI: Forward HTTP Request to designated port
    FastAPI->>FastAPI: Pydantic v2 Schema Validation
    FastAPI->>SQLite: PRAGMA journal_mode=WAL Query
    SQLite-->>FastAPI: Result Rows (Zero-lock concurrency)
    FastAPI-->>ViteProxy: Standardized JSON Envelope: { success: true, data, timestamp }
    ViteProxy-->>Browser: HTTP 200 OK Response
    Browser->>Browser: React 19 Concurrent Commit to DOM
```

---

### 3.2 Canonical ite.config.ts Configuration & Reverse Proxy

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Ports are mapped from projects.json (e.g., 5173 -> 8000)
const CLIENT_PORT = 5173;
const BACKEND_PORT = 8000;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: CLIENT_PORT,
    strictPort: true, // Prevents silent fallback to arbitrary random ports
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: `ws://127.0.0.1:${BACKEND_PORT}`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

### 3.3 Tailwind CSS v4 CSS-First Architecture

Tailwind CSS v4 replaces JavaScript configuration files with native CSS directives.

### Global Styles (`client/src/index.css`)

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: #09090b;
    --foreground: #fafafa;
    --card: #18181b;
    --card-foreground: #fafafa;
    --primary: #3b82f6;
    --primary-foreground: #ffffff;
    --muted: #27272a;
    --muted-foreground: #a1a1aa;
    --border: #27272a;
    --radius: 0.5rem;
  }
}

@theme {
  --color-brand-primary: var(--primary);
  --color-surface-card: var(--card);
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

### 3.4 Next.js Migration Shims

For components authored with Next.js APIs, the monorepo provides zero-dependency compatibility shims in `src/shared/lib/next-shims.tsx`:

```tsx
import React from 'react';

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...props }) => {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

export const useRouter = () => {
  return {
    push: (url: string) => { window.history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); },
    replace: (url: string) => { window.history.replaceState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); },
    back: () => window.history.back(),
  };
};
```

---

### 3.5 Unified HTTP Client Fetcher

```typescript
// client/src/shared/lib/api-client.ts
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
  timestamp: string;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(endpoint, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  const body: ApiEnvelope<T> = await response.json().catch(() => {
    throw new Error(`Failed to parse JSON response from ${endpoint}`);
  });

  if (!response.ok || !body.success) {
    throw new Error(body.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return body.data;
}
```

---

## 4. Server Architecture & ASGI Lifespan (Python FastAPI + Uvicorn)

> **Domain**: FastAPI Server Lifecycle, ASGI Middleware Pipeline & Production Runtime  
> **Applies to**: Backend microservices in `Soul-DevPortal-Projects/`

---

### 4.1 FastAPI Application Pipeline Blueprint

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

### 4.2 Complete Server Factory Implementation (server/app/factory.py)

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

### 4.3 Server Bootstrap Entry Point (server/main.py)

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

### 4.4 Production Deployment Checklist

- [ ] Fast startup (< 500ms).
- [ ] Explicit port assignment from `projects.json`.
- [ ] Safe database directory resolution.
- [ ] Interactive docs available at `/api/docs`.
- [ ] Healthcheck responding at `/api/health`.

---

## 5. REST API Design, Routing & Response Envelopes

> **Domain**: Backend API Architecture & Routing Standards  
> **Applies to**: Python FastAPI + Uvicorn Services & React 19 Client Proxy

---

### 5.1 Architectural Overview & URL Design

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

### 5.2 Standard JSON Response Envelope

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

### 5.3 Router Composition & Lifespan Architecture

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

### 5.4 Health Check & Readiness Specification

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

### 5.5 Streaming & WebSocket Architecture

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

---

## 6. Embedded Database & SQLite WAL Architecture

> **Domain**: SQLite WAL Persistence Layer, Concurrency & Schema Management  
> **Applies to**: All micro-applications in `Soul-DevPortal-Projects/`

---

### 6.1 Embedded WAL Engine Architectural Blueprint

Every micro-application in the Soul Monorepo utilizes an autonomous, embedded SQLite database running with **Write-Ahead Logging (WAL)**. This architecture eliminates external database container dependencies while providing high-performance local persistence.

```
                     SQLITE WAL CONCURRENCY MODEL
 ┌─────────────────────────────────────────────────────────────┐
 │                       server/data/                          │
 │                                                             │
 │   ┌─────────────────┐       ┌─────────────┐ ┌─────────────┐ │
 │   │  <app>.db       │       │ <app>.db-wal│ │ <app>.db-shm│ │
 │   │  (Base Tables)  │       │ (Write Log) │ │(Shared Mem) │ │
 │   └────────┬────────┘       └──────┬──────┘ └──────┬──────┘ │
 └────────────┼───────────────────────┼───────────────┼────────┘
              │                       │               │
      ┌───────┴───────────────────────┴───────────────┴───────┐
      │               FastAPI Connection Pool                 │
      │ ┌──────────────────────┐   ┌────────────────────────┐ │
      │ │ Concurrent Reader 1  │   │  Concurrent Reader 2   │ │
      │ │ (Non-blocking SELECT)│   │  (Non-blocking SELECT) │ │
      │ └──────────────────────┘   └────────────────────────┘ │
      │ ┌───────────────────────────────────────────────────┐ │
      │ │ Single Serialized Writer (INSERT / UPDATE / MERGE)│ │
      │ └───────────────────────────────────────────────────┘ │
      └───────────────────────────────────────────────────────┘
```

---

### 6.2 Dynamic Database Path Resolution

To guarantee portability across Windows, Linux, and macOS environments without hardcoded system paths, projects must resolve the database directory dynamically relative to the module file.

### Implementation (`server/database/connection.py`)

```python
import sqlite3
from pathlib import Path
from typing import Generator

# Resolve server root dynamically: server/database/connection.py -> server/
SERVER_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = SERVER_ROOT / "data"
DB_PATH = DATA_DIR / "app.db"

def init_db_directory() -> None:
    """Ensure the persistence directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def get_db_connection() -> sqlite3.Connection:
    """Create and configure a high-concurrency SQLite connection."""
    init_db_directory()
    conn = sqlite3.connect(
        str(DB_PATH),
        timeout=5.0,
        check_same_thread=False
    )
    # Enable WAL mode and performance pragmas
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.row_factory = sqlite3.Row
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI Dependency yield pattern."""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
```

---

### 6.3 Asynchronous SQLite with iosqlite Engine

For high-throughput async endpoints, `aiosqlite` provides non-blocking access:

```python
import aiosqlite
from pathlib import Path

async def get_async_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode = WAL;")
        await db.execute("PRAGMA foreign_keys = ON;")
        db.row_factory = aiosqlite.Row
        yield db
```

---

### 6.4 Canonical DDL Schema Definition (server/database/schema.sql)

Every project maintains a canonical `schema.sql`:

```sql
-- server/database/schema.sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
```

---

### 6.5 Automated Bootstrap & Migration Logic

On application startup, the lifespan handler verifies and bootstraps tables:

```python
def bootstrap_database(conn: sqlite3.Connection) -> None:
    schema_file = SERVER_ROOT / "database" / "schema.sql"
    if schema_file.exists():
        with open(schema_file, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        print(f"[DATABASE] Schema initialized at {DB_PATH}")
```

---

### 6.6 Monorepo Database Distribution Matrix

| Project Name | Database File Path | Primary Entities |
| --- | --- | --- |
| `apexmind-ai` | `server/data/apexmind.db` | Prompts, Audio Sessions, Transcripts |
| `outpass-system` | `server/data/outpass.db` | Outpass Requests, Approvals, Students, Wardens |
| `free-api-hub` | `server/data/free_api_hub.db` | Mock Endpoints, Route Definitions, Schemas |
| `sonikoma` | `server/data/sonikoma.db` | Video Projects, Voice Syntheses, Timeline Clips |
| `spatial-dimensions` | `server/data/spatial_dimensions.db` | 3D Scenes, Assets, Coordinate Transforms |
| `college-management-system` | `server/data/college_management.db` | Courses, Faculty, Grades, Attendance |
| `globalpulse-ai` | `server/data/globalpulse.db` | News Articles, Summaries, Sentiment Scores |
| `postcraft-ai` | `server/data/postcraft.db` | Social Posts, Templates, Scheduled Publishes |
| `devportal` | `backend/data/workspace.db` | Monorepo Projects, Health Audits, Port Allocations |

---

## 7. Project Schema & Manifest Contracts

> **Domain**: Canonical Metadata Schemas, Pydantic v2 & Zod Data Contracts  
> **Applies to**: Frontend Client & Backend Server Contracts across the Monorepo

---

### 7.1 Canonical metadata.json Schema Specification

Every project maintains a root `metadata.json` that powers the DevPortal runner, catalog cards, health monitors, and automated port verifiers.

### Complete JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "title": "SoulProjectMetadata",
  "type": "object",
  "required": [
    "name",
    "description",
    "features",
    "techStack",
    "commands",
    "localServices",
    "apiEndpoints",
    "configuration"
  ],
  "properties": {
    "name": {
      "type": "string",
      "description": "Human-readable display name of the microservice"
    },
    "description": {
      "type": "string",
      "description": "Concise summary of the micro-application purpose"
    },
    "features": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Key business capabilities offered by the project"
    },
    "techStack": {
      "type": "object",
      "required": ["frontend", "backend", "database"],
      "properties": {
        "frontend": { "type": "array", "items": { "type": "string" } },
        "backend": { "type": "array", "items": { "type": "string" } },
        "database": { "type": "array", "items": { "type": "string" } },
        "ai": { "type": "array", "items": { "type": "string" } }
      }
    },
    "commands": {
      "type": "object",
      "required": ["development", "frontend", "backend", "build"],
      "properties": {
        "development": { "type": "string" },
        "frontend": { "type": "string" },
        "backend": { "type": "string" },
        "build": { "type": "string" },
        "lint": { "type": "string" }
      }
    },
    "localServices": {
      "type": "object",
      "required": ["frontend", "backend", "apiDocs", "healthCheck"],
      "properties": {
        "frontend": { "type": "string", "format": "uri" },
        "backend": { "type": "string", "format": "uri" },
        "apiDocs": { "type": "string", "format": "uri" },
        "healthCheck": { "type": "string", "format": "uri" }
      }
    },
    "apiEndpoints": {
      "type": "array",
      "items": { "type": "string" }
    },
    "configuration": {
      "type": "array",
      "items": { "type": "string" }
    }
  }
}
```

---

### 7.2 Pydantic v2 Server Implementation Patterns

FastAPI routes leverage Pydantic v2 for data contracts, type coercion, and auto-generated Swagger documentation.

```python
from pydantic import BaseModel, Field, EmailStr, field_validator
from typing import Optional, List
from datetime import datetime, timezone

class BaseEntitySchema(BaseModel):
    """Base schema providing automated timestamping and strict config."""
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

    model_config = {
        "str_strip_whitespace": True,
        "populate_by_name": True,
        "from_attributes": True
    }

class CreateUserRequest(BaseEntitySchema):
    username: str = Field(..., min_length=3, max_length=32, pattern=r"^[a-zA-Z0-9_-]+$")
    email: EmailStr
    role: str = Field(default="user", pattern=r"^(admin|user|guest)$")

    @field_validator("username")
    @classmethod
    def validate_reserved_names(cls, v: str) -> str:
        if v.lower() in {"admin", "root", "system"}:
            raise ValueError("Username is reserved.")
        return v
```

---

### 7.3 Zod Client Schema Mirroring

On the React 19 client, Zod mirrors the server models to provide instant client-side feedback.

```typescript
// client/src/features/users/types.ts
import { z } from 'zod';

export const CreateUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'Username must be at least 3 characters')
    .max(32, 'Username cannot exceed 32 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username contains invalid characters'),
  email: z.string().trim().email('Invalid email address format'),
  role: z.enum(['admin', 'user', 'guest']).default('user'),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export interface UserResponse {
  id: string;
  username: string;
  email: string;
  role: string;
  created_at: string;
}
```

---

## 8. Feature-Sliced Design (FSD) Domain Modularity

> **Domain**: Feature-Sliced Design (FSD) across Client and Server  
> **Applies to**: Modular Domain Engineering across all Soul Monorepo applications

---

### 8.1 Feature-Sliced Design (FSD) Philosophy

Instead of organizing code by technical file type (putting all components together, all hooks together, all routers together), the Soul Monorepo organizes code into **vertical domain slices**. Each slice encapsulates all the technical components required to deliver a single business capability.

```
                  FEATURE-SLICED CO-LOCATION
 ┌─────────────────────────────────────────────────────────────┐
 │           client/src/features/chat-assistant/               │
 │                                                             │
 │   ├── api/                                                  │
 │   │   └── chatApi.ts         (Typed fetcher to /api/chat)   │
 │   ├── components/                                           │
 │   │   ├── ChatWindow.tsx     (Main chat container)          │
 │   │   ├── MessageList.tsx    (Virtual list of messages)     │
 │   │   └── ChatInput.tsx      (Prompt text input & send)     │
 │   ├── hooks/                                                │
 │   │   └── useChatSession.ts  (React 19 state & streaming)   │
 │   ├── types.ts               (Message, Session interfaces)  │
 │   ├── index.ts               (PUBLIC FACADE ENTRY POINT)    │
 │   └── README.md              (Feature documentation)        │
 └─────────────────────────────────────────────────────────────┘
                               │
               Only public exports exposed to App
                               ▼
 ┌─────────────────────────────────────────────────────────────┐
 │                      client/src/app/                        │
 │  import { ChatWindow } from '@/features/chat-assistant';    │
 └─────────────────────────────────────────────────────────────┘
```

---

### 8.2 Anatomy of a Client Feature Slice

#### A. The Public Barrier (index.ts)

```typescript
// client/src/features/chat-assistant/index.ts
// ONLY export what the application shell needs to render!
export { ChatWindow } from './components/ChatWindow';
export { useChatSession } from './hooks/useChatSession';
export type { ChatMessage, ChatSession } from './types';
```

#### B. Typed API Caller (pi/chatApi.ts)

```typescript
// client/src/features/chat-assistant/api/chatApi.ts
import type { ChatMessage, SendMessagePayload } from '../types';

export async function sendMessage(payload: SendMessagePayload): Promise<ChatMessage> {
  const response = await fetch('/api/v1/chat/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    throw new Error(`Chat API error: ${response.statusText}`);
  }

  const envelope = await response.json();
  return envelope.data;
}
```

#### C. Custom Hook with React 19 Primitives (hooks/useChatSession.ts)

```typescript
// client/src/features/chat-assistant/hooks/useChatSession.ts
import { useState, useTransition } from 'react';
import { sendMessage } from '../api/chatApi';
import type { ChatMessage } from '../types';

export function useChatSession(sessionId: string) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isPending, startTransition] = useTransition();

  const handleSend = (text: string) => {
    startTransition(async () => {
      const newMessage = await sendMessage({ sessionId, content: text });
      setMessages((prev) => [...prev, newMessage]);
    });
  };

  return { messages, isPending, handleSend };
}
```

---

### 8.3 Server Feature Slice Architecture

On the FastAPI backend, the structure mirrors the frontend domain slice:

```text
server/features/chat/
├── router.py                   # APIRouter declaring endpoints & HTTP codes
├── service.py                  # AI generation, database queries & business logic
├── schemas.py                  # Pydantic v2 request & response schemas
└── __init__.py                 # Public package interface
```

### Server Implementation Example

#### `server/features/chat/schemas.py`

```python
from pydantic import BaseModel, Field

class SendMessageRequest(BaseModel):
    session_id: str
    content: str = Field(..., min_length=1, max_length=4000)

class MessageResponse(BaseModel):
    id: str
    session_id: str
    sender: str
    content: str
    created_at: str
```

#### `server/features/chat/service.py`

```python
import uuid
from datetime import datetime, timezone
import sqlite3
from .schemas import SendMessageRequest, MessageResponse

class ChatService:
    def __init__(self, db: sqlite3.Connection):
        self.db = db

    async def post_message(self, req: SendMessageRequest) -> MessageResponse:
        msg_id = f"msg_{uuid.uuid4().hex[:10]}"
        now = datetime.now(timezone.utc).isoformat()
        
        with self.db:
            self.db.execute(
                "INSERT INTO messages (id, session_id, sender, content, created_at) VALUES (?, ?, ?, ?, ?)",
                (msg_id, req.session_id, "user", req.content, now)
            )
        
        return MessageResponse(
            id=msg_id,
            session_id=req.session_id,
            sender="user",
            content=req.content,
            created_at=now
        )
```

#### `server/features/chat/router.py`

```python
from fastapi import APIRouter, Depends, status
import sqlite3
from database.connection import get_db
from .schemas import SendMessageRequest, MessageResponse
from .service import ChatService

router = APIRouter(prefix="/chat", tags=["Chat"])

@router.post("/messages", response_model=dict, status_code=status.HTTP_201_CREATED)
async def send_message(payload: SendMessageRequest, db: sqlite3.Connection = Depends(get_db)):
    service = ChatService(db)
    result = await service.post_message(payload)
    return {"success": True, "data": result.model_dump(), "error": None}
```

---

### 8.4 Feature Directory Standards Summary

| Slice Layer | Primary Objective | Permitted Dependencies | Forbidden Patterns |
| --- | --- | --- | --- |
| `components/` | Visual rendering & UI interactions | Hooks, types, `@/shared/components/ui` | Direct SQL or raw unparsed fetch calls |
| `api/` | Network requests to backend | Types, shared HTTP client | React hooks or JSX components |
| `hooks/` | State management & side effects | React primitives, `api/`, types | Rendering UI markup |
| `types.ts` | Type safety contracts | Zod, TypeScript standard types | Runtime code or side-effects |
| `index.ts` | Public export boundary | Internal feature files | Re-exporting private components |

---

## 9. Dual-Environment Management & Security Architecture

> **Domain**: Environment Variables Hygiene, Secret Security & Validation Schemas  
> **Applies to**: Full Monorepo Workspace, Microservices & Shared Libraries

---

### 9.1 Environment Architecture & Scoping

The Soul Monorepo enforces a strict boundary between public frontend variables and private backend secrets.

```
                           ENVIRONMENT VARIABLE SCOPE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                               .env File                                     │
 ├─────────────────────────────────────────────┬───────────────────────────────┤
 │  Client-Exposed Variables (Vite Bundled)    │  Server-Only Private Secrets  │
 │  (Visible in Browser Sources!)              │  (Restricted to Python Runtime│
 │                                             │                               │
 │  VITE_APP_TITLE="ApexMind AI"               │  SERVER_PORT=8000             │
 │  VITE_API_BASE_URL="/api"                   │  AI_GEMINI_API_KEY="AIzaSy..."│
 │  VITE_ENABLE_ANALYTICS="false"              │  AUTH_JWT_SECRET="c8f1b2..."  │
 │                                             │  DB_BUSY_TIMEOUT=5000         │
 └─────────────────────────────────────────────┴───────────────────────────────┘
```

---

### 9.2 Universal .env.example Baseline

Every micro-application root provides this baseline:

```bash
# ==============================================================================
# SOUL MONOREPO — APPLICATION ENVIRONMENT BASELINE
# ==============================================================================

# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=8000
SERVER_ENV=development
SERVER_LOG_LEVEL=INFO

# Client Configuration (Exposed to Browser via Vite)
VITE_APP_TITLE=Soul Application
VITE_API_BASE_URL=/api

# Database Configuration (SQLite WAL Engine)
DB_PATH=server/data/app.db
DB_TIMEOUT=5000

# Artificial Intelligence (If Applicable)
AI_GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL_NAME=gemini-2.5-flash

# Authentication & Security
AUTH_SECRET_KEY=your_development_secret_key_change_in_production
AUTH_TOKEN_EXPIRY_MINUTES=1440
```

---

### 9.3 Server-Side Pydantic BaseSettings Validation

In FastAPI services, environment variables are loaded and validated strictly via `pydantic-settings`:

```python
# server/shared/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
from pathlib import Path

class AppSettings(BaseSettings):
    server_host: str = Field(default="127.0.0.1", alias="SERVER_HOST")
    server_port: int = Field(default=8000, alias="SERVER_PORT")
    server_env: str = Field(default="development", alias="SERVER_ENV")
    
    db_path: str = Field(default="server/data/app.db", alias="DB_PATH")
    db_timeout: int = Field(default=5000, alias="DB_TIMEOUT")
    
    ai_gemini_api_key: Optional[str] = Field(default=None, alias="AI_GEMINI_API_KEY")
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = AppSettings()
```

---

### 9.4 Sensitive Data Masking Protocol

When logging requests, errors, or configuration objects, all sensitive attributes must be obfuscated.

### Masking Implementation

```python
import re

SENSITIVE_PATTERNS = [
    re.compile(r'(?i)(api[_-]?key|secret|password|token|bearer)\s*[:=]\s*["\']?([^"\'\s]+)["\']?')
]

def mask_sensitive_string(raw: str) -> str:
    """Mask secret values, preserving only first 3 and last 4 characters."""
    def replacer(match):
        key = match.group(1)
        val = match.group(2)
        if len(val) <= 8:
            masked = "***"
        else:
            masked = f"{val[:3]}...{val[-4:]}"
        return f'{key}="{masked}"'
    
    result = raw
    for pattern in SENSITIVE_PATTERNS:
        result = pattern.sub(replacer, result)
    return result
```

---

### 9.5 Master Micro-Application Configuration Matrix

Rather than maintaining fragmented template files, all project-specific environment requirements are consolidated into this master reference matrix:

| Project Name | Required Environment Variables | Default / Fallback Values | Description |
| --- | --- | --- | --- |
| **apexmind-ai** | `AI_GEMINI_API_KEY`<br>`AI_MODEL_NAME`<br>`TTS_ENGINE` | `AI_MODEL_NAME=gemini-2.5-flash`<br>`TTS_ENGINE=edge-tts` | Audio speech generation and Google Gemini API keys |
| **outpass-system** | `AUTH_JWT_SECRET`<br>`AUTH_EXPIRE_MINUTES` | `AUTH_EXPIRE_MINUTES=1440` | Student outpass approval token signing secret |
| **free-api-hub** | `MAX_MOCK_ROUTES`<br>`MOCK_DELAY_MS` | `MAX_MOCK_ROUTES=500`<br>`MOCK_DELAY_MS=0` | Dynamic API prototyping and mock latency throttling |
| **sonikoma** | `AI_GEMINI_API_KEY`<br>`VIDEO_TEMP_DIR` | `VIDEO_TEMP_DIR=server/data/media` | Video synthesis and script generation models |
| **spatial-dimensions** | `SCENE_ASSETS_PATH`<br>`EXPORT_FORMAT` | `SCENE_ASSETS_PATH=server/data/scenes`<br>`EXPORT_FORMAT=gltf` | 3D coordinate mapping and asset storage cache |
| **college-management** | `SESSION_SECRET`<br>`ATTENDANCE_WINDOW_MINS` | `ATTENDANCE_WINDOW_MINS=60` | Campus faculty and student portal session security |
| **globalpulse-ai** | `AI_GEMINI_API_KEY`<br>`NEWS_REFRESH_INTERVAL` | `NEWS_REFRESH_INTERVAL=300` | Automated news crawler and LLM summarization pipeline |
| **postcraft-ai** | `AI_GEMINI_API_KEY`<br>`MAX_TOKENS_PER_POST` | `MAX_TOKENS_PER_POST=1024` | Social media multi-platform copy generation engine |
| **devportal** | `SERVER_PORT`<br>`WORKSPACE_MONITOR_MS` | `SERVER_PORT=8008`<br>`WORKSPACE_MONITOR_MS=2000` | Monorepo process manager and port auditing telemetry |

---

## 10. Operational Runbooks & Incident Playbooks

> **Domain**: Developer Operations, Incident Remediation & Rapid Bootstrapping  
> **Applies to**: All workspace engineers, tech leads, and autonomous agents

---

### 10.1 Bootstrapping a New Micro-Application in 3 Minutes

Follow this 7-step playbook to initialize a fully compliant micro-application:

#### Step 1: Reserve Ports in `projects.json`
Claim the next sequential frontend (`:517x`) and backend (`:800x`) ports:

```json
"my-app": {
  "title": "MY NEW APPLICATION",
  "frontend_port": 5182,
  "backend_port": 8009,
  "frontend_cmd": ["npm", "run", "dev:client"],
  "backend_cmd": ["npm", "run", "dev:server"],
  "framework": "React 19 + Vite 8 + Tailwind CSS v4",
  "server_stack": "Python FastAPI + Uvicorn",
  "db_info": "SQLite (server/data/my_app.db)",
  "ai_engine": "N/A"
}
```

#### Step 2: Scaffold Dual-Pillar Directory
Create the canonical structure:
```bash
mkdir -p Soul-DevPortal-Projects/my-app/client/src/app
mkdir -p Soul-DevPortal-Projects/my-app/client/src/features/dashboard
mkdir -p Soul-DevPortal-Projects/my-app/client/public/logos
mkdir -p Soul-DevPortal-Projects/my-app/server/app
mkdir -p Soul-DevPortal-Projects/my-app/server/database
mkdir -p Soul-DevPortal-Projects/my-app/server/features/dashboard
mkdir -p Soul-DevPortal-Projects/my-app/server/data
touch Soul-DevPortal-Projects/my-app/server/data/.gitkeep
```

#### Step 3: Configure Vite Reverse Proxy (`client/vite.config.ts`)
Set `port: 5182`, `strictPort: true`, and proxy `/api` -> `http://127.0.0.1:8009`.

#### Step 4: Setup SQLite WAL Connection (`server/database/connection.py`)
```python
import sqlite3
from pathlib import Path

DB_PATH = Path(__file__).resolve().parent.parent / "data" / "my_app.db"

def get_db():
    conn = sqlite3.connect(str(DB_PATH), check_same_thread=False, timeout=5.0)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.execute("PRAGMA foreign_keys = ON;")
    try:
        yield conn
    finally:
        conn.close()
```

#### Step 5: Mount Feature Routers (`server/app/factory.py`)
Register routers with standard `/api` prefix and lifecycle lifespan.

#### Step 6: Create Root Manifests (`metadata.json`, `.env.example`, `package.json`)
Ensure manifest keys match `projects.json` identically.

#### Step 7: Launch via `@workspace/runner`
```bash
npx @workspace/runner project my-app
```

---

### 10.2 Diagnosing Port Collisions & Stale Socket Cleanup

> [!WARNING]
> If a developer abruptly terminates the CLI with `Ctrl+C` or a background task crashes, the port may remain locked in `TIME_WAIT` or bound by an orphaned child process.

#### Symptoms:
- `[Errno 98] Address already in use` (Linux / macOS)
- `[WinError 10048] Only one usage of each socket address is normally permitted` (Windows)
- `Vite server failed to bind port :517x (strictPort: true)`

#### Remediation:

1. **Automated Cleanup**:
   ```bash
   npx @workspace/runner ports --clean
   ```

2. **Windows Manual Diagnostic**:
   ```powershell
   # Find process ID occupying port 5173
   netstat -ano | findstr :5173
   
   # Terminate the rogue PID
   taskkill /F /PID <PID>
   ```

3. **macOS / Linux Manual Diagnostic**:
   ```bash
   # Find and kill process on port 8000
   lsof -ti:8000 | xargs kill -9
   ```

---

### 10.3 Safe SQLite WAL Migrations

> [!CAUTION]
> Never attempt file copies of `.db` while active write transactions are in progress. Always perform online checkpoints before schema alterations.

#### Schema Evolution Rules:
1. **Always Additive**: Add new columns with safe defaults:
   ```sql
   ALTER TABLE users ADD COLUMN avatar_url TEXT DEFAULT '';
   ```
2. **Never Drop in-place**: Create a new table, copy data, and rename:
   ```sql
   BEGIN TRANSACTION;
   CREATE TABLE items_new (id TEXT PRIMARY KEY, title TEXT NOT NULL);
   INSERT INTO items_new SELECT id, title FROM items;
   DROP TABLE items;
   ALTER TABLE items_new RENAME TO items;
   COMMIT;
   ```
3. **Truncate WAL on Shutdown**:
   ```sql
   PRAGMA wal_checkpoint(TRUNCATE);
   ```

---

### 10.4 React 19 Concurrent Rendering & Compiler Best Practices

1. **Keep Render Functions Pure**: Never mutate objects or trigger side effects during render.
2. **Use Server Actions / `useActionState`**:
   ```tsx
   const [state, formAction, isPending] = useActionState(async (prev, formData) => {
     const res = await api.createItem(formData);
     return res.data;
   }, initialData);
   ```
3. **Wrap Suspense Boundaries Granularly**: Keep hero elements visible while child data streams in asynchronously.

---

## 11. Standard File Structure Templates & Layouts

> **Domain**: Canonical Code Templates, Block-Comment Layouts & Scaffolding Standards  
> **Applies to**: All frontend components, custom hooks, FastAPI routes, and Python services across the workspace

To maintain consistency and readability across all 9 micro-applications and packages in the Soul Monorepo, all source files must adhere to standard block-comment section layouts. Every engineer and AI coding assistant must follow these templates when authoring new files or refactoring existing modules.

---

### 11.1 Structural Sectioning & Block-Comment Header Philosophy

Every production source file is segmented into distinct, predictable functional zones using standardized ASCII block comments:

1. **Section 1: Imports & Core Dependencies**:
   Organized from highest abstraction (core framework/runtimes) down to lowest (domain types/utilities).
2. **Section 2: Contracts, Types & Interface Definitions**:
   Props, parameters, return shapes, and Pydantic validation schemas.
3. **Section 3: Primary Implementation & Logic Execution**:
   Component/handler/service logic divided into numbered sub-sections (state, lifecycle/side-effects, event handlers/actions, rendering/responses).
4. **Section 4: Entry Point / Export Barrier**:
   Public barriers or execution entry points (`if __name__ == "__main__":`).

---

### 11.2 React Component Standard Template (`.tsx`)

#### 📋 Component Checklist & Architectural Rules

- **Interfaces**: Always export a clear interface defining the component's props (e.g. `MyComponentProps`).
- **Early Return Guards**: Always place early-return guards for loading states (`isLoading`) and error states (`isError`) before rendering the main layout.
- **JSX Root Container**: The main return statement must return a single semantic root container with appropriate styling, layout classes (Tailwind CSS v4), and accessibly annotated roles and labels (e.g. `role="region"`, `aria-label="..."`).
- **Console Log Mounting**: Print clean trace logs on mount/unmount inside a `useEffect` for lifecycle debugging.
- **Path Aliasing**: Use `@/features/...` and `@/shared/...` aliases; upward relative imports traversing beyond two levels (`../../../`) are forbidden.

```tsx
// ============================================================================
// SECTION 1: IMPORTS & CORE DEPENDENCIES
// ============================================================================
// 1. Core React imports & standard hooks (useState, useEffect, useCallback, etc.)
import React from "react";

// 2. Third-party UI components (Lucide icons, etc.) or styling utilities
import { Sparkles, AlertCircle, RefreshCw } from "lucide-react";

// 3. Shared primitives & utility helpers
import { cn } from "@/shared/lib/utils";

// 4. Custom hooks or routing hooks (useAppLogic, useAppRouter)
import { useAppLogic } from "@/features/common/hooks/useAppLogic";

// 5. Types, interfaces, and model lists
import type { GeneratedPanel } from "@/features/common/types";

// ============================================================================
// SECTION 2: COMPONENT DEFINITION & EXPORT
// ============================================================================
export interface MyComponentProps {
  propA: string; // Short description of propA
  onAction: (id: string) => void; // Standard trigger action callback
  isLoading?: boolean; // Status flag indicating loading
  isError?: boolean; // Status flag indicating loading error
  errorMessage?: string; // Optional custom error text
  onRetry?: () => void; // Callback hook to retry loading
  className?: string; // Additional Tailwind utility classes
}

export default function MyComponent({
  propA,
  onAction,
  isLoading = false,
  isError = false,
  errorMessage = "Failed to load component data.",
  onRetry,
  className,
}: MyComponentProps) {
  // --------------------------------------------------------------------------
  // SUB-SECTION 2.1: STATE & HOOK INITIALIZATION
  // --------------------------------------------------------------------------
  const [internalValue, setInternalValue] = React.useState<string>("");

  // Standard lifecycle logger for debugging mounting/unmounting
  React.useEffect(() => {
    console.log("[MyComponent] Mounted with propA:", propA);
    return () => console.log("[MyComponent] Unmounted");
  }, [propA]);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.2: EVENT HANDLERS & CALLBACKS
  // --------------------------------------------------------------------------
  const handlePerformAction = React.useCallback(() => {
    if (!internalValue.trim()) return;
    console.log(
      "[MyComponent] Triggering action callback with value:",
      internalValue
    );
    onAction(internalValue);
  }, [internalValue, onAction]);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.3: RENDER OUT / JSX TREE
  // --------------------------------------------------------------------------

  // Guard: If data is loading, show a loading placeholder instead of rendering empty layouts
  if (isLoading) {
    return (
      <div
        className={cn(
          "flex flex-col items-center justify-center p-8 border border-neutral-800 rounded-2xl bg-neutral-900/50 text-neutral-400 font-mono text-xs space-y-2",
          className
        )}
        role="status"
        aria-live="polite"
      >
        <RefreshCw className="h-5 w-5 animate-spin text-purple-400" />
        <span>Loading Component Data...</span>
      </div>
    );
  }

  // Guard: If loading failed, render a structured error UI with retry action
  if (isError) {
    return (
      <div
        className={cn(
          "p-6 bg-red-950/20 border border-red-900/40 rounded-2xl flex flex-col items-center justify-center space-y-3 text-red-400 font-mono text-xs",
          className
        )}
        role="alert"
        aria-live="polite"
      >
        <div className="flex items-center gap-2 font-semibold">
          <AlertCircle className="h-4 w-4" />
          <span>{errorMessage}</span>
        </div>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-3 py-1.5 bg-red-900/40 hover:bg-red-900/60 rounded-xl transition-colors border border-red-800 text-white font-semibold cursor-pointer"
          >
            Retry Loading
          </button>
        )}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "p-6 bg-neutral-900 border border-neutral-800 rounded-2xl flex flex-col space-y-4",
        className
      )}
      role="region"
      aria-label="Interactive Component Workspace"
    >
      <div className="flex items-center gap-2 text-sm font-semibold text-neutral-200">
        <Sparkles className="h-4 w-4 text-purple-400" />
        <span>{propA}</span>
      </div>

      <input
        type="text"
        value={internalValue}
        onChange={(e) => setInternalValue(e.target.value)}
        className="px-3 py-2 bg-black/40 border border-neutral-700 rounded-xl text-neutral-100 placeholder-neutral-500 focus:outline-none focus:border-purple-500 transition-colors font-mono text-xs"
        placeholder="Enter payload..."
      />

      <button
        onClick={handlePerformAction}
        disabled={!internalValue.trim()}
        className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-xl transition-all shadow-lg hover:shadow-purple-900/30 cursor-pointer"
      >
        Submit Action
      </button>
    </div>
  );
}
```

---

### 11.3 Custom React Hook Standard Template (`.ts`)

#### 📋 Hook Checklist & Architectural Rules

- **Naming**: Always prefix the hook name with `use` (e.g. `useMyHook`).
- **Interfaces**: Clearly define the input parameter interface (`UseMyHookParams`) and return output interface (`UseMyHookResult`).
- **Callback Memoization**: Wrap all returned event functions in `useCallback` to prevent unnecessary component re-renders.
- **State Boundaries**: Manage internal variables such as loading state (`isLoading`) and error status (`isError`) within the hook itself.
- **Cleanups**: Always handle observers, timers, and flag cleanups in `useEffect` returns to avoid memory leaks.

```typescript
// ============================================================================
// SECTION 1: IMPORTS
// ============================================================================
// 1. Core React hooks & hook-dependencies
import React from "react";

// 2. Custom hooks, utility libraries, or HTTP clients
import { apiClient } from "@/shared/lib/api-client";

// 3. Types, data models, or endpoint interfaces
import type { GeneratedPanel } from "@/features/common/types";

// ============================================================================
// SECTION 2: HOOK IMPLEMENTATION
// ============================================================================
export interface UseMyHookParams {
  sourceId: string; // Parameter description
  onError?: (msg: string) => void; // Callback hook error handler
}

export interface UseMyHookResult {
  data: string | null; // Fetched/processed string output
  isLoading: boolean; // Busy loading state status
  isError: boolean; // Hook execution error state
  triggerFetch: (param: string) => Promise<void>; // Event caller action
}

export function useMyHook({
  sourceId,
  onError,
}: UseMyHookParams): UseMyHookResult {
  // --------------------------------------------------------------------------
  // SUB-SECTION 2.1: STATE DEFINITIONS
  // --------------------------------------------------------------------------
  const [data, setData] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isError, setIsError] = React.useState<boolean>(false);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.2: SIDE EFFECTS & LIFECYCLE
  // --------------------------------------------------------------------------
  React.useEffect(() => {
    let isMounted = true;
    console.log(
      "[useMyHook] Initializing hook context for sourceId:",
      sourceId
    );

    // Cleanup hook references
    return () => {
      isMounted = false;
      console.log(
        "[useMyHook] Cleaning up hook context for sourceId:",
        sourceId
      );
    };
  }, [sourceId]);

  // --------------------------------------------------------------------------
  // SUB-SECTION 2.3: EVENT ACTIONS & ASYNC OPERATIONS
  // --------------------------------------------------------------------------
  const triggerFetch = React.useCallback(
    async (param: string) => {
      setIsLoading(true);
      setIsError(false);
      try {
        // Execute operation or remote fetch via relative proxy path
        const result = `Processed ${param} for source ${sourceId}`;
        setData(result);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : "Unknown error inside useMyHook";
        console.error("[useMyHook] Operation execution failed:", err);
        setIsError(true);
        onError?.(errorMsg);
      } finally {
        setIsLoading(false);
      }
    },
    [sourceId, onError]
  );

  // Return formatted state & handler package
  return {
    data,
    isLoading,
    isError,
    triggerFetch,
  };
}
```

---

### 11.4 Backend FastAPI Route Standard Template (`.py`)

#### 📋 Route Checklist & Architectural Rules

- **Type Annotations**: Always declare type hints for route function parameters and specify `JSONResponse` (or appropriate response models) as the return type.
- **Validation**: Use Pydantic `BaseModel` and field parameters (e.g. `Field(ge=0)`) to strictly validate and cast request inputs.
- **Timing Logs**: Calculate request processing times using `time.perf_counter()` to ensure visibility of bottlenecks.
- **Return / Response Format**: Always return standard JSON responses using FastAPI's `JSONResponse` with a consistent shape: `{"success": bool, "data": dict, "error": str}`.
- **Error Handling & Safe Returns**: Wrap all handlers in a try/except block. On error, log the context with `logger.error(..., exc_info=True)` and return a safe `500` status `JSONResponse` without leaking server traces.

```python
# =============================================================================
# SECTION 1: IMPORTS & ROUTER SETUP
# =============================================================================
import time
import logging
from typing import Dict, Any, Optional
from fastapi import APIRouter, HTTPException, Depends
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field

# Setup modular namespace logging
logger = logging.getLogger("app.routes.my_feature")
router = APIRouter(prefix="/my-feature", tags=["My Feature"])

# =============================================================================
# SECTION 2: REQUEST & RESPONSE SCHEMAS
# =============================================================================
class MyFeatureRequest(BaseModel):
    image_url: str = Field(..., description="Source panel image URL to process")
    strength: float = Field(default=50.0, ge=0.0, le=100.0, description="Adjustment strength")

# =============================================================================
# SECTION 3: ROUTE HANDLERS
# =============================================================================
@router.post("/action", summary="Apply structural adjustment on target image")
async def execute_feature_action(body: MyFeatureRequest) -> JSONResponse:
    start_time = time.perf_counter()
    logger.info(f"Incoming POST action request for URL: {body.image_url}")

    try:
        # 1. Processing Logic / Service Calls
        mock_size_bytes = 204857

        duration = round((time.perf_counter() - start_time) * 1000, 1)
        logger.info(f"Completed action processing in {duration}ms")

        # 2. Return standard structured success response
        return JSONResponse(
            status_code=200,
            content={
                "success": True,
                "data": {
                    "processed": True,
                    "sizeBytes": mock_size_bytes,
                    "appliedStrength": body.strength
                },
                "error": None
            }
        )
    except Exception as err:
        logger.error(f"Execution error: {err}", exc_info=True)
        # Avoid leaking internal trace details to client, return safe 500 JSONResponse
        return JSONResponse(
            status_code=500,
            content={
                "success": False,
                "data": None,
                "error": str(err) or "Failed to execute feature action internally"
            }
        )
```

---

### 11.5 Python Service Files (`.py`)

#### 📋 Python Service Checklist & Architectural Rules

- **Type Hints**: Always add type hints to parameters and returns using the `typing` module.
- **Exception Logs**: Log failing blocks using `logger.error(..., exc_info=True)` to track root exceptions.
- **OS Path Safety**: Avoid using string concats for folder directories; always use cross-platform safe functions (e.g. `pathlib.Path` or `os.path.join`).
- **CLI Outputs**: Print `STATUS=SUCCESS` or `STATUS=ERROR` explicitly so Node.js `exec()` wrappers can easily capture exit codes.

```python
# =============================================================================
# SECTION 1: IMPORTS & CORE CONFIGURATION
# =============================================================================
import os
import sys
import argparse
import logging
from pathlib import Path
from typing import Dict, Any, List, Optional

# Setup standard formatting for backend logging
logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(message)s")
logger = logging.getLogger("workspace.services.myservice")

# =============================================================================
# SECTION 2: CORE LOGIC FUNCTIONS
# =============================================================================
def process_data(input_path: str, output_path: str, parameters: Dict[str, Any]) -> List[str]:
    """
    Processes the given files or panel boundaries.

    Args:
        input_path: Absolute directory to the source file.
        output_path: Destination directory path for final output.
        parameters: Configuration dictionary.

    Returns:
        List of generated file output names.
    """
    logger.info(f"Initiating process_data on: {input_path}")
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Source file not found: {input_path}")

    try:
        results = []
        # Main execution block (e.g. OpenCV / Pillow manipulation)
        results.append(f"Output saved at {output_path}")
        return results
    except Exception as e:
        logger.error(f"Failed to execute process_data block: {e}", exc_info=True)
        raise

# =============================================================================
# SECTION 3: CLI ENTRY POINT (IF RUN VIA SHELL)
# =============================================================================
if __name__ == "__main__":
    # Standard argparse setup
    parser = argparse.ArgumentParser(description="Standard CLI wrapper for Python backend operations")
    parser.add_argument("--input_path", required=True, help="Source image or text file path")
    parser.add_argument("--output_path", required=True, help="Destination folder output path")
    parser.add_argument("--sensitivity", type=float, default=0.5, help="Algorithm sensitivity threshold")

    args = parser.parse_args()

    try:
        config_params = {"sensitivity": args.sensitivity}
        generated_files = process_data(args.input_path, args.output_path, config_params)

        # Output markers for Node.js sub-process capture
        print("STATUS=SUCCESS")
        print(f"OUTPUTS={','.join(generated_files)}")
    except Exception as err:
        print("STATUS=ERROR", file=sys.stderr)
        print(f"ERROR_DETAILS={str(err)}", file=sys.stderr)
        sys.exit(1)
```

---

## 12. Canonical Engineering Patterns & Implementation Recipes

> **Domain**: Universal Coding Patterns, Resilience Recipes & Cross-Stack Idioms  
> **Applies to**: Full Monorepo Workspace, React 19 Clients & FastAPI Python Services

To maintain architectural harmony and prevent ad-hoc implementations across all 9 micro-applications, developers and AI agents must implement these canonical codebase patterns for AI generation, caching, inter-process communication, structured logging, and router decomposition.

---

### 12.1 Resilient Gemini API Call & Retry Pattern

Guards against rate-limiting (`429 Too Many Requests`) and transient server failures (`503 Service Unavailable`) when calling Google Gemini models across Python and TypeScript services.

#### 📋 Pattern Rules & Invariants
- **Exponential Backoff**: Multiply backoff intervals by a factor of 2.0 with jitter to prevent retry storms.
- **Terminal Fallbacks**: Catch final retry exhaustion and return structured, gracefully degraded fallbacks rather than throwing unhandled exceptions to callers.
- **Model Standard**: Default to `gemini-2.5-flash` for high-throughput generation tasks; reserve larger reasoning models for complex synthesis.

#### TypeScript Implementation (`@/shared/lib/ai-retry.ts`)

```typescript
import { GoogleGenAI } from "@google/genai";

export async function callGeminiWithRetry<T>(
  apiFn: () => Promise<T>,
  maxRetries = 4,
  initialDelayMs = 1500
): Promise<T> {
  let attempt = 0;
  let delay = initialDelayMs;

  while (attempt < maxRetries) {
    try {
      return await apiFn();
    } catch (err: any) {
      attempt++;
      const isRateLimit = err?.status === 429 || err?.message?.includes("429");
      const isTransient = err?.status === 503 || err?.message?.includes("503");

      if ((isRateLimit || isTransient) && attempt < maxRetries) {
        console.warn(
          `[GeminiRetry] Transient failure (attempt ${attempt}/${maxRetries}). Retrying in ${delay}ms...`
        );
        await new Promise((resolve) => setTimeout(resolve, delay));
        delay *= 2; // Exponential backoff
      } else {
        console.error(
          `[GeminiRetry] Fatal error or exhausted retries (${attempt}/${maxRetries}):`,
          err
        );
        throw err;
      }
    }
  }

  throw new Error(`[GeminiRetry] Failed after ${maxRetries} attempts.`);
}
```

#### Python Implementation (`server/shared/ai_client.py`)

```python
import time
import logging
from typing import Callable, TypeVar, Any
from google import genai
from google.genai import types

logger = logging.getLogger("app.shared.ai_client")
T = TypeVar("T")

def call_gemini_with_retry(
    operation: Callable[[], T],
    max_retries: int = 4,
    initial_delay: float = 1.5
) -> T:
    """Executes a Gemini SDK call with exponential backoff for 429/503 errors."""
    delay = initial_delay
    for attempt in range(1, max_retries + 1):
        try:
            return operation()
        except Exception as exc:
            err_str = str(exc)
            is_transient = "429" in err_str or "503" in err_str or "ResourceExhausted" in err_str
            if is_transient and attempt < max_retries:
                logger.warning(
                    f"[GeminiRetry] Transient failure on attempt {attempt}/{max_retries}. "
                    f"Retrying in {delay:.1f}s... Error: {exc}"
                )
                time.sleep(delay)
                delay *= 2.0
            else:
                logger.error(f"[GeminiRetry] Exhausted retries or fatal error: {exc}", exc_info=True)
                raise
```

---

### 12.2 Python Subprocess & CLI Shell Execution Pattern

Safely invokes Python background engines or CLI tools from Node.js scripts or parent supervisors with strict argument sanitation, temporary file lifecycles, and exit code propagation.

#### 📋 Pattern Rules & Invariants
- **Argument Allow-Listing**: Validate and constrain options against strict enums or schemas before shell execution to prevent command injection.
- **Cross-Platform Executable Resolution**: Use `sys.executable` in Python and resolve `python3` or `python` cleanly across platforms.
- **Temp Buffer Cleanup**: Always wrap temporary disk file writes in `try/finally` blocks to guarantee file removal on completion or failure.
- **Explicit Exit Protocol**: Inspect stdout for `STATUS=SUCCESS` or stderr for `STATUS=ERROR` protocol markers.

```typescript
import { execFile } from "child_process";
import os from "os";
import path from "path";
import fs from "fs/promises";

export interface PythonExecutionOptions {
  scriptPath: string;
  inputBuffer: Buffer;
  method: "inpaint" | "blur" | "solid_white";
  sensitivity?: number;
}

export async function executePythonTask(
  options: PythonExecutionOptions
): Promise<Buffer> {
  const tempId = `task_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const tempIn = path.join(os.tmpdir(), `${tempId}_in.png`);
  const tempOut = path.join(os.tmpdir(), `${tempId}_out.png`);

  // Write temporary input file to disk
  await fs.writeFile(tempIn, options.inputBuffer);

  const pythonBin = process.platform === "win32" ? "python" : "python3";
  const args = [
    options.scriptPath,
    "--input_path",
    tempIn,
    "--output_path",
    tempOut,
    "--sensitivity",
    String(options.sensitivity ?? 0.5),
  ];

  try {
    return await new Promise<Buffer>((resolve, reject) => {
      execFile(pythonBin, args, async (error, stdout, stderr) => {
        if (error) {
          console.error(
            "[PythonSubprocess] Execution failed:",
            stderr || error.message
          );
          return reject(
            new Error(`Subprocess failed: ${stderr || error.message}`)
          );
        }

        if (!stdout.includes("STATUS=SUCCESS")) {
          return reject(
            new Error(`Subprocess exited without success marker: ${stdout}`)
          );
        }

        try {
          const resultBuffer = await fs.readFile(tempOut);
          resolve(resultBuffer);
        } catch (readErr) {
          reject(new Error(`Failed to read generated output file: ${readErr}`));
        }
      });
    });
  } finally {
    // Guaranteed temporary cleanup
    await Promise.allSettled([
      fs.unlink(tempIn).catch(() => {}),
      fs.unlink(tempOut).catch(() => {}),
    ]);
  }
}
```

---

### 12.3 Standardized Structured Logging & Context Tagging Pattern

Enforces uniform log formatting, diagnostic traceability, and context tagging across frontend browser consoles and backend Python services.

#### 📋 Pattern Rules & Invariants
- **Uniform Format**: `[TIMESTAMP] [SCOPE] [LEVEL] [SOURCE] message`
- **Frontend Context Tags**: Wrap component/hook names in brackets `[ComponentName]` at the start of log statements.
- **Backend Namespaces**: Initialize loggers using dotted modular paths (e.g. `app.features.<feature>.<module>`).
- **Sensitive Data Masking**: Passwords, auth tokens, and API credentials must be obfuscated automatically.

#### Backend Python Logger Example
```python
import logging

# Scoped modular namespace logger
logger = logging.getLogger("app.features.video_engine.service")

# Informational diagnostic event
logger.info("Initializing high-concurrency database cache pool")

# Warning event with context
logger.warning("Optional HuggingFace credentials omitted; fallback models active")

# Error event with full stack trace preservation
logger.error("Media processing pipeline aborted due to corrupt asset", exc_info=True)
```

#### Frontend Console Logging Example
```typescript
// Standard debug/info tracing
console.log("[useCropEditor] Opening crop editor canvas viewport");

// Warning notification with degraded state
console.warn("[useBackendHealth] Backend unreachable - retrying connection in 3s");

// Error reporting with payload context
console.error("[useVideoGeneration] Video render compilation failed:", errorPayload);
```

---

### 12.4 In-Memory & Ephemeral Asset Caching Pattern

Maintains high-speed in-memory caches for transient, computationally expensive artifacts (e.g., stitched comic panels, audio buffers, or generated mock responses), avoiding repetitive disk writes and database roundtrips.

#### 📋 Pattern Rules & Invariants
- **Key Determinism**: Formulate cache keys using entity prefixes, timestamps, and content hashes: `<type>_<timestamp>_<descriptor>`.
- **History Tracking for Undo/Redo**: When caching mutated states, map new cache keys to parent keys in a transformation history map.
- **TTL / Eviction Boundaries**: Provide cache expiration or bounded sizing to prevent out-of-memory errors on large asset processing.

```typescript
// Memory cache storage structures
interface CachedAsset {
  data: Buffer;
  contentType: string;
  createdAt: number;
}

const assetCache = new Map<string, CachedAsset>();
const editHistory = new Map<string, string>(); // newUrl -> originalUrl

export function cacheTransformedAsset(
  descriptor: string,
  buffer: Buffer,
  contentType: string,
  parentUrl?: string
): string {
  const uniqueId = `asset_${Date.now()}_${descriptor}`;
  const assetUrl = `/api/v1/assets/cached/${uniqueId}`;

  assetCache.set(uniqueId, {
    data: buffer,
    contentType,
    createdAt: Date.now(),
  });

  if (parentUrl) {
    editHistory.set(assetUrl, parentUrl);
  }

  return assetUrl;
}

export function getCachedAsset(uniqueId: string): CachedAsset | undefined {
  return assetCache.get(uniqueId);
}
```

---

### 12.5 Modular Route Aggregation Pattern (FastAPI)

Separates expansive API surfaces into isolated sub-routers co-located within feature directories, preventing monolithic route sprawl in the server bootstrap entry point.

#### 📋 Pattern Rules & Invariants
- **Domain Sub-routers**: Group distinct domain actions into sub-routers (`edit.py`, `merge.py`, `cleanup.py`).
- **Feature Router Aggregator**: Aggregate child sub-routers into a primary feature `APIRouter` inside `router.py`.
- **Top-Level Factory Inclusion**: Mount feature routers with unified `/api/v1` prefixes in `server/app/factory.py`.

```python
# server/features/media/sub_routes/edit.py
from fastapi import APIRouter
edit_router = APIRouter(prefix="/edit", tags=["Media Editing"])

@edit_router.post("/crop")
async def crop_image():
    return {"success": True, "action": "crop"}

# server/features/media/sub_routes/merge.py
from fastapi import APIRouter
merge_router = APIRouter(prefix="/merge", tags=["Media Merging"])

@merge_router.post("/stitch")
async def stitch_images():
    return {"success": True, "action": "stitch"}

# server/features/media/router.py (Aggregator)
from fastapi import APIRouter
from .sub_routes.edit import edit_router
from .sub_routes.merge import merge_router

media_router = APIRouter(prefix="/media")
media_router.include_router(edit_router)
media_router.include_router(merge_router)
```

---

### 12.6 Stateful Hook Extraction & Pure Presentational Layering

Separates complex React 19 business logic, asynchronous state transitions, and API mutations from purely presentational view components.

#### 📋 Pattern Rules & Invariants
- **Pure Presentational Components**: Views focus exclusively on JSX layout, accessibility markup, and visual event forwarding.
- **Hook Encapsulation**: All `useState`, `useCallback`, `useTransition`, and API calls reside in dedicated custom hooks (`use<Feature>.ts`).
- **Action Callbacks**: Custom hooks expose stable handler functions and state observables to keep parent views declarative.

```typescript
// client/src/features/editor/hooks/useSingleImageEdits.ts
import { useState, useCallback } from "react";
import { apiClient } from "@/shared/lib/api-client";
import type { GeneratedPanel } from "../types";

export function useSingleImageEdits(
  panel: GeneratedPanel,
  onUpdate: (updated: GeneratedPanel) => void
) {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleRotate = useCallback(
    async (angle: number) => {
      setIsProcessing(true);
      try {
        const result = await apiClient<GeneratedPanel>("/api/v1/image/rotate", {
          method: "POST",
          body: JSON.stringify({ panelId: panel.id, angle }),
        });
        onUpdate(result);
      } catch (err) {
        console.error("[useSingleImageEdits] Rotation failed:", err);
      } finally {
        setIsProcessing(false);
      }
    },
    [panel.id, onUpdate]
  );

  return {
    isEditing,
    setIsEditing,
    isProcessing,
    handleRotate,
  };
}
```

---

### 12.7 URL Sanitization & Asset Path Normalization Pattern

Standardizes URL parsing, cleans localized route artifacts, and resolves cross-platform paths safely.

#### 📋 Pattern Rules & Invariants
- **Locale & Prefix Stripping**: Strip localized path segments (e.g. `/en/`, `/ko/`, `/fr/`) before routing or parsing external asset identifiers.
- **Safe Parsing Guards**: Wrap URL construction in `try/catch` and sanitize query parameters against directory traversal (`../`).

```typescript
// client/src/shared/lib/url-utils.ts
export function stripLocaleFromUrl(rawUrl: string): string {
  // Strips leading locale segments: /en/, /ko/, /fr/, etc.
  return rawUrl.replace(/\/(en|ko|ja|fr|es|zh)(\/|$)/i, "/");
}

export function parseAssetResourceUrl(rawUrl: string): {
  domain: string;
  path: string;
  resourceId?: string;
} {
  try {
    const parsed = new URL(rawUrl);
    const cleanPath = stripLocaleFromUrl(parsed.pathname);
    const pathSegments = cleanPath.split("/").filter(Boolean);
    const resourceId = pathSegments[pathSegments.length - 1];

    return {
      domain: parsed.hostname,
      path: cleanPath,
      resourceId,
    };
  } catch {
    // Relative fallback handling
    const clean = stripLocaleFromUrl(rawUrl);
    return {
      domain: "localhost",
      path: clean,
    };
  }
}
```

