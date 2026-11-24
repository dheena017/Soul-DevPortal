# Project Framework & Tech Stack — Technical Specification & Guide

> **Domain**: Unified Framework Selection, Languages, Runtimes & Cross-Stack Tooling  
> **Applies to**: All 8 Micro-Applications & DevPortal in `Soul-DevPortal-Projects/`

---

## 1. Executive Summary: What Framework & Tech Stack to Use

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

## 2. Pillar 1: Client Application Framework

### A. React 19
- **Core Primitives**:
  - `useActionState`: For form submission states, pending indicators, and action rollbacks.
  - `useOptimistic`: Instant UI updates before network responses settle.
  - `use()`: Reading resources (Promises, Context) directly inside component trees.
  - `<Suspense>`: Async boundary wrapping for streaming data.
- **Compiler Readiness**: Render functions must be strictly idempotent and pure.

### B. Vite 8 Bundler Engine
- **Plugins**: `@vitejs/plugin-react`, `@tailwindcss/vite`.
- **Path Aliasing**: Enforce `@/*` -> `./src/*`.
- **Port Strategy**: Strict port binding (`strictPort: true`) matching the matrix in `projects.json`.
- **Proxy**: Forward `/api` and `/ws` to the corresponding FastAPI backend.

### C. Tailwind CSS v4
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

## 3. Pillar 2: Server Application Framework

### A. Python 3.12+ & FastAPI
- **Asynchronous Architecture**: Non-blocking I/O using `async def` route handlers.
- **Pydantic v2**: High-performance schema validation, serialization, and OpenAPI document generation (`/api/docs`).
- **Application Factory**: Modular app creation with ASGI `@asynccontextmanager` `lifespan`.

### B. Uvicorn ASGI Server
- **Run Command**: `uvicorn main:app --host 127.0.0.1 --port <PORT> --reload`.
- **Graceful Lifecycle**: 5-second shutdown window to drain active connections and close database handles cleanly.

---

## 4. Pillar 3: Persistence Layer (SQLite WAL)

- **Engine**: SQLite with Write-Ahead Logging (`PRAGMA journal_mode = WAL;`).
- **Location**: `server/data/<project-name>.db` (strictly git-ignored).
- **Concurrency**: Unlimited parallel readers + non-blocking single writer.
- **Connection Management**: Scoped per request via FastAPI `Depends()`.

---

## 5. Technology Matrix across Micro-Applications

| Application | Client Framework | Server Framework | Persistence | AI Capabilities |
|---|---|---|---|---|
| **apexmind-ai** | React 19 + Vite 8 + Tailwind 4 (:5173) | FastAPI + Uvicorn (:8000) | SQLite WAL (`apexmind.db`) | Gemini 2.5 Flash + TTS |
| **outpass-system** | React 19 + Vite 8 + Tailwind 4 (:5174) | FastAPI + Uvicorn (:8001) | SQLite WAL (`outpass.db`) | N/A |
| **free-api-hub** | React 19 + Vite 8 + Tailwind 4 (:5175) | FastAPI + Uvicorn (:8002) | SQLite WAL (`free_api_hub.db`) | Dynamic Mock Engine |
| **sonikoma** | React 19 + Vite 8 + Tailwind 4 (:5176) | FastAPI + Uvicorn (:8006) | SQLite WAL (`sonikoma.db`) | Gemini Video & Voice |
| **spatial-dimensions** | React 19 + Vite 8 + Tailwind 4 (:5177) | FastAPI + Uvicorn (:8007) | SQLite WAL (`spatial_dimensions.db`)| 3D Scene Transforms |
| **college-management** | React 19 + Vite 8 + Tailwind 4 (:5178) | FastAPI + Uvicorn (:8005) | SQLite WAL (`college_management.db`)| N/A |
| **globalpulse-ai** | React 19 + Vite 8 + Tailwind 4 (:5179) | FastAPI + Uvicorn (:8003) | SQLite WAL (`globalpulse.db`) | Gemini News Synthesizer |
| **postcraft-ai** | React 19 + Vite 8 + Tailwind 4 (:5180) | FastAPI + Uvicorn (:8004) | SQLite WAL (`postcraft.db`) | Gemini Creative GenAI |
| **devportal** | React 19 + Vite 8 + Tailwind 4 (:5181) | FastAPI + Uvicorn (:8008) | SQLite WAL (`workspace.db`) | AST Parsing + Port Monitor |
