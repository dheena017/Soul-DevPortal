# Soul Monorepo — Project Rules & Architecture Standards

> **Workspace Global Specification & Golden Architectural Rulebook**  
> Complete technical reference governing all 8 micro-applications and the Developer Portal in `Soul-DevPortal-Projects/`.

---

## 1. Executive Summary: The Universal Three-Pillar Tech Stack

To eliminate tooling fragmentation, maximize performance, and ensure consistent developer ergonomics across the entire monorepo, **every application must strictly adhere to the unified three-pillar technology standard**:

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

## 2. Deep Dive: The Three Pillars

### Pillar 1: Client Stack — `React 19 + Vite 8 + Tailwind CSS v4`

All client applications live in the `client/` directory and run as modern, high-speed Single Page Applications (SPAs).

#### A. React 19 Core Standards

- **Modern Hook Primitives**: Utilize React 19's native `useActionState`, `useOptimistic`, `use`, and `<Suspense>` boundaries for asynchronous UI states. Avoid deprecated lifecycle methods.
- **Strict Mode & React Compiler Ready**: All components must be pure and free of side-effects during render.
- **Client Routing**: Use declarative client routing (e.g., `AppRouter.tsx` with browser history / `popstate` shims or React Router). When migrating legacy Next.js components, route through standard shims (`next-link.tsx`, `next-navigation.ts`, `next-image.tsx`) to guarantee zero regression.

#### B. Vite 8 Bundler Engine

- **Dedicated Plugin Configuration**: Client configurations (`client/vite.config.ts`) must consume `@vitejs/plugin-react` and `@tailwindcss/vite`.
- **Strict Port Allocation**: Configure `server.port` explicitly to the assigned project client port (`5173` – `5181`) with `strictPort: true`.
- **Transparent Reverse Proxy**: Forward all `/api` and `/ws` traffic to the corresponding FastAPI backend port:

  ```ts
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  }
  ```

- **Path Aliasing**: Enforce `@/*` mapping directly to `./src/*` to maintain clean import trees.

#### C. Tailwind CSS v4 Architecture

- **Pure CSS-First Engine**: Do **not** use legacy `tailwind.config.js`, `tailwind.config.ts`, or `postcss.config.js`. Tailwind CSS v4 is compiled natively by `@tailwindcss/vite`.
- **Entrypoint**: In `client/src/index.css` (or `globals.css`), declare:

  ```css
  @import "tailwindcss";
  ```

- **Design Tokens**: Bind theme variables (`--color-*`, `--font-*`, `--radius-*`) in the `@theme` directive or standard CSS variables.

---

### Pillar 2: Server Stack — `Python FastAPI + Uvicorn`

Every backend service lives in the `server/` directory and exposes asynchronous HTTP REST and WebSocket APIs powered by **FastAPI** and **Uvicorn**.

#### A. Asynchronous Architecture (`async` / `await`)

- **Non-Blocking I/O**: All route handlers (`@app.get()`, `@app.post()`) interacting with databases, external AI APIs (Gemini), or files must be declared as `async def`.
- **Worker Execution**: Offload heavy computational tasks (audio encoding, image transformation) to background threadpools using `asyncio.to_thread()`.

#### B. Schema Validation with Pydantic v2

- **Strict Data Contracts**: Every incoming payload and outgoing response must define a strict Pydantic v2 `BaseModel`.
- **Auto-Generated Documentation**: FastAPI automatically generates interactive OpenAPI/Swagger docs at `http://127.0.0.1:<PORT>/docs`.

#### C. Cross-Origin Resource Sharing (CORS) & Middleware

- Enable standard CORS middleware to support local development and Vite proxying:

  ```python
  from fastapi import FastAPI
  from fastapi.middleware.cors import CORSMiddleware

  app = FastAPI(title="Microservice API", version="1.0.0")

  app.add_middleware(
      CORSMiddleware,
      allow_origins=["*"],
      allow_credentials=True,
      allow_methods=["*"],
      allow_headers=["*"],
  )
  ```

#### D. Server Directory Structure

```
server/
├── main.py              # Application entrypoint, FastAPI instance & Uvicorn runner
├── api/                 # API routers modularized by domain (/api/v1/...)
├── core/                # Core settings, security, and configuration loader
├── data/                # SQLite database files (*.db) and migrations
├── models/              # Pydantic schemas and database entity models
├── services/            # Business logic, AI engine integrations & utilities
└── requirements.txt     # Python dependencies (or pyproject.toml)
```

---

### Pillar 3: Database Engine — `SQLite` (Write-Ahead Logging Engine)

Every micro-application maintains its own dedicated, autonomous SQLite database file.

#### A. Mandatory PRAGMA Settings

To prevent database locks (`database is locked`) and support high concurrency between background workers and web requests, every SQLite connection **must** execute:

```sql
PRAGMA journal_mode = WAL;          -- Enforce Write-Ahead Logging
PRAGMA foreign_keys = ON;            -- Enforce relational integrity
PRAGMA synchronous = NORMAL;         -- Optimize disk write throughput
PRAGMA busy_timeout = 5000;          -- Wait up to 5 seconds before locking error
```

#### B. Storage Path & Dynamic Path Independence

- **Directory**: All `.db` files must reside inside `server/data/` (or `backend/data/`).
- **Path Resolution**: Never hardcode paths (`C:\Users\...` or `./data.db`). Resolve paths dynamically relative to the module file:

  ```python
  from pathlib import Path

  DATA_DIR = Path(__file__).resolve().parent / "data"
  DATA_DIR.mkdir(parents=True, exist_ok=True)
  DB_PATH = DATA_DIR / "project_name.db"
  ```

- **Schema Management**: Keep a pristine declarative `schema.sql` file alongside the database to allow rapid bootstrapping and automated test runs.

---

## 3. Master Port & Database Registry

All projects have **guaranteed unique, non-overlapping ports**.

| Project Name | Client Port | Client Stack | Server Port | Server Stack | Dedicated SQLite Database |
| :--- | :---: | :--- | :---: | :--- | :--- |
| **`apexmind-ai`** | **`5173`** | React 19 + Vite 8 + Tailwind v4 | **`8000`** | Python FastAPI + Uvicorn | `server/data/apexmind.db` |
| **`outpass-system`** | **`5174`** | React 19 + Vite 8 + Tailwind v4 | **`8001`** | Python FastAPI + Uvicorn | `server/data/outpass.db` |
| **`free-api-hub`** | **`5175`** | React 19 + Vite 8 + Tailwind v4 | **`8002`** | Python FastAPI + Uvicorn | `server/data/free_api_hub.db` |
| **`sonikoma`** | **`5176`** | React 19 + Vite 8 + Tailwind v4 | **`8006`** | Python FastAPI + Uvicorn | `server/data/sonikoma.db` |
| **`spatial-dimensions`** | **`5177`** | React 19 + Vite 8 + Tailwind v4 | **`8007`** | Python FastAPI + Uvicorn | `server/data/spatial_dimensions.db` |
| **`college-management-system`** | **`5178`** | React 19 + Vite 8 + Tailwind v4 | **`8005`** | Python FastAPI + Uvicorn | `server/data/college_management.db` |
| **`globalpulse-ai`** | **`5179`** | React 19 + Vite 8 + Tailwind v4 | **`8003`** | Python FastAPI + Uvicorn | `server/data/globalpulse.db` |
| **`postcraft-ai`** | **`5180`** | React 19 + Vite 8 + Tailwind v4 | **`8004`** | Python FastAPI + Uvicorn | `server/data/postcraft.db` |
| **`devportal`** (Hub) | **`5181`** | React 19 + Vite 8 + Tailwind v4 | **`8008`** | Python FastAPI + Uvicorn | `backend/data/workspace.db` |

---

## 4. Master Command Architecture: Unified Single-Template Standard

To maintain predictable operational ergonomics across the polyglot monorepo, **every single micro-application must adhere to the identical command interface and lifecycle template**.

### A. Canonical NPM Lifecycle Interface

Inside any project directory (`Soul-DevPortal-Projects/<project-name>`), the following 8 canonical commands are guaranteed to exist with identical semantics:

```bash
npm run dev           # Dual Supervisor: Starts both Client + Server with auto port-killing
npm run dev:client    # Client Dev: Launches Vite 8 dev server on assigned port
npm run dev:server    # Server Dev: Launches FastAPI/Uvicorn on assigned port
npm run build         # Production Build: Compiles client assets via Vite into dist/
npm run preview       # Preview Build: Serves production dist/ bundle locally
npm run typecheck     # Type Safety: Validates TypeScript compilation with zero emitted files
npm run test          # Verification: Executes project unit, offline, and endpoint tests
npm run clean         # Cleanup: Removes dist/ and temporary cache artifacts
```

### B. Single-Template Direct CLI Specification

Developers running processes directly without npm wrappers must follow the single unified template structure:

- **Client Direct Template**: `npx vite <client-path> --port <PORT>`
- **Server Direct Template**: `python -m uvicorn <module>:app --port <PORT> --reload`
- **Build Direct Template**: `npx vite build <client-path>`
- **Typecheck Direct Template**: `npx tsc --noEmit`

### C. Master Project Command Matrix

| Project | Client Direct CLI Command | Server Direct CLI Command | Build Command | Typecheck Command | Test / Verification Command | Preview Command |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`apexmind-ai`** | `npx vite client --port 5173` | `python -m uvicorn server.app.factory:create_app --factory --port 8000 --reload` | `npm run build` (`vite build client`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (`node --test`) | `npm run preview` (`:5173`) |
| **`outpass-system`** | `npx vite frontend --port 5174` | `python -m uvicorn backend.main:app --port 8001 --reload` | `npm run build` (`vite build frontend`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (offline suite) | `npm run preview` (`:5174`) |
| **`free-api-hub`** | `npx vite frontend --port 5175` | `python -m uvicorn backend.main:app --port 8002 --reload` | `npm run build` (`vite build frontend`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (`pytest -m offline`) | `npm run preview` (`:5175`) |
| **`sonikoma`** | `npx vite frontend --port 5176` | `python -m uvicorn backend.main:app --port 8006 --reload` | `npm run build` (`vite build frontend`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (`playwright test`) | `npm run preview` (`:5176`) |
| **`spatial-dimensions`** | `npx vite . --port 5177` | `python -m uvicorn backend.main:app --port 8007 --reload` | `npm run build` (`vite build`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (canvas tests) | `npm run preview` (`:5177`) |
| **`college-management-system`** | `npx vite . --port 5178` | `python -m uvicorn backend.main:app --port 8005 --reload` | `npm run build` (`vite build`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (database tests) | `npm run preview` (`:5178`) |
| **`globalpulse-ai`** | `npx vite frontend --port 5179` | `python -m uvicorn backend.main:app --port 8003 --reload` | `npm run build` (`vite build frontend`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (news feed suite) | `npm run preview` (`:5179`) |
| **`postcraft-ai`** | `npx vite . --port 5180` | `python -m uvicorn backend.main:app --port 8004 --reload` | `npm run build` (`vite build`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (scheduler tests) | `npm run preview` (`:5180`) |
| **`devportal`** (Hub) | `npx vite . --port 5181` | `python backend/main.py --port 8008` | `npm run build` (`vite build`) | `npm run typecheck` (`tsc --noEmit`) | `npm run test` (portal verify) | `npm run preview` (`:5181`) |

### D. Monorepo Master Multi-App Commands (Root: `c:\Users\dheen\Soul-DevPortal`)

From the monorepo root, orchestrate any individual micro-application or the entire suite simultaneously:

```bash
# Run all 8 micro-apps and the DevPortal concurrently with automated port conflict sweep:
npm run dev:all

# Run all via pure Node.js supervisor:
npm run dev:all:node

# Run any single micro-app through the master supervisor:
npm run dev:apexmind      # Client: 5173 | Server: 8000
npm run dev:outpass       # Client: 5174 | Server: 8001
npm run dev:free-api      # Client: 5175 | Server: 8002
npm run dev:sonikoma      # Client: 5176 | Server: 8006
npm run dev:spatial       # Client: 5177 | Server: 8007
npm run dev:college       # Client: 5178 | Server: 8005
npm run dev:globalpulse   # Client: 5179 | Server: 8003
npm run dev:postcraft     # Client: 5180 | Server: 8004
```

---

## 5. Shared Monorepo Packages Consumption

All projects must strictly consume and integrate the three core internal packages located in `Soul-DevPortal-Packages/`:

```
Soul-DevPortal-Packages/
├── config/       # TypeScript Compiler Presets, Prettier, Tailwind & Python Port Registry
├── logger/       # Client Telemetry, DevTools HMR Bridge & 5-Column Python Logger
└── runner/       # Dual Process Supervisor, Automated Port Killing & Process Group Teardown
```

### A. Package Integration Requirements

| Package Name | Frontend / Client Integration | Backend / Runner Integration | Purpose & Deliverables |
| :--- | :--- | :--- | :--- |
| **`@workspace/config`** | `tsconfig.json` extends `@workspace/config/tsconfig/react.json` | `from workspace_config.ports import PORT_REGISTRY, get_project_ports` | Centralized compiler options, zero-duplication linting, and canonical port registry. |
| **`@workspace/logger`** | `import '@workspace/logger';` or `import { consoleLogger } from '@workspace/logger/client';` | `from workspace_logger.banners import print_fullstack_banner` | Client-side error telemetry capture and structured terminal presentation. |
| **`@workspace/runner`** | `package.json` dependency for workspace task orchestration | `from workspace_runner.supervisor import ensure_port_free, run_dual_supervisor` | Automated TCP port clearance (`--kill-port`), process supervision, and signal handling. |

### B. Project Package Compliance Matrix

| Project | Consumes `@workspace/config` | Consumes `@workspace/logger` | Consumes `@workspace/runner` |
| :--- | :---: | :---: | :---: |
| **`apexmind-ai`** | ✅ `tsconfig.json` + `package.json` | ✅ `client/src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`outpass-system`** | ✅ `client/tsconfig.json` + `package.json` | ✅ `client/src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`free-api-hub`** | ✅ `frontend/tsconfig.json` + `package.json` | ✅ `frontend/src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`sonikoma`** | ✅ `frontend/tsconfig.json` + `package.json` | ✅ `frontend/src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`spatial-dimensions`** | ✅ `tsconfig.json` + `package.json` | ✅ `src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`college-management`** | ✅ `tsconfig.json` + `package.json` | ✅ `src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`globalpulse-ai`** | ✅ `frontend/tsconfig.json` + `package.json` | ✅ `frontend/src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`postcraft-ai`** | ✅ `tsconfig.json` + `package.json` | ✅ `src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |
| **`devportal`** (Hub) | ✅ `tsconfig.json` + `package.json` | ✅ `src/main.tsx` + `scripts/` | ✅ `scripts/run-*.py` |

---

## 6. Security & Operational Rules

1. **No Hardcoded Secrets**: Secret keys (`GEMINI_API_KEY`, `JWT_SECRET`, database credentials) must **never** be committed. Provide a documented `.env.example` file with descriptive placeholders.
2. **Client Key Safety**: Secrets must never be exposed to the client bundle. Only variables explicitly prefixed with `VITE_` may be bundled.
3. **Clean Teardown**: Development servers and runner scripts must cleanly release all TCP socket bindings upon exit.
4. **Autonomous Execution**: Every project must be runnable either from the root via `npm run dev:<project>` or independently from its own directory with `python scripts/run-dev.py`.
