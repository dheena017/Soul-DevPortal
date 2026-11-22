# Projects Rules & Standards Guide

> **Monorepo Standard Specification v1.0.0**  
> Official development, structure, networking, security, and integration rules governing all 8 workspace applications consuming the `@workspace/*` shared packages ecosystem.

---

## 1. Core Architecture Principles

Every project in the Soul monorepo (`Soul-DevPortal-Projects/<project-name>`) is an autonomous, production-ready application designed to run independently while seamlessly integrating with monorepo shared packages and tools.

```
                             SOUL WORKSPACE MONOREPO
 ┌─────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                 │
 │   SHARED PACKAGES LAYER (PILLAR 2)                                              │
 │   ├── @workspace/config   (Design tokens, Tailwind v4 presets, Vite configs)     │
 │   ├── @workspace/logger   (5-column terminal logger, browser DevTools, masking) │
 │   └── @workspace/runner   (Process lifecycle orchestrator, port killer & prober)│
 │                                                                                 │
 └───────────────────────┬─────────────────────────────────┬───────────────────────┘
                         │                                 │
                         ▼                                 ▼
 ┌───────────────────────────────────────┐ ┌───────────────────────────────────────┐
 │   CLIENT APPLICATIONS (5173 - 5181)   │ │   SERVER REST SERVICES (8000 - 8008)  │
 │   ├── apexmind-ai           (:5173)   │ │   ├── apexmind-ai           (:8000)   │
 │   ├── outpass-system        (:5174)   │ │   ├── outpass-system        (:8001)   │
 │   ├── free-api-hub          (:5175)   │ │   ├── free-api-hub          (:8002)   │
 │   ├── sonikoma              (:5176)   │ │   ├── sonikoma              (:8006)   │
 │   ├── spatial-dimensions    (:5177)   │ │   ├── spatial-dimensions    (:8007)   │
 │   ├── college-management    (:5178)   │ │   ├── college-management    (:8005)   │
 │   ├── globalpulse-ai        (:5179)   │ │   ├── globalpulse-ai        (:8003)   │
 │   └── postcraft-ai          (:5180)   │ │   └── postcraft-ai          (:5180)   │
 └───────────────────────────────────────┘ └───────────────────────────────────────┘
```

---

## 2. Mandatory Project Layout & Directory Structure

Every project in `Soul-DevPortal-Projects/` must follow the standardized directory structure:

```
Soul-DevPortal-Projects/<project-name>/
├── client/                     # Frontend client application (React 19 / Vite or Next.js)
│   ├── src/                    # Feature-driven client application source code
│   │   ├── features/           # Modular domain feature slices (components, hooks, state, API)
│   │   ├── shared/             # Shared UI components, layout primitives, lib & utilities
│   │   ├── app/                # Application shell, routing setup & global providers
│   │   ├── App.tsx             # Root application component
│   │   ├── main.tsx            # DOM mount & client entry point
│   │   ├── index.css           # Global stylesheets & design token variables
│   │   └── README.md           # Client source structure documentation
│   ├── public/                 # Static web assets, branding logos, icons, favicons
│   ├── index.html              # HTML entry point (for Vite SPA)
│   ├── vite.config.ts          # Bundler configuration with /api reverse proxy
│   ├── tsconfig.json           # Client TypeScript configuration
│   ├── package.json            # Client dependencies & scripts
│   └── README.md               # Client architecture guide & dev workflow
├── server/                     # Backend API server (Python FastAPI or Node.js Express)
│   ├── app/                    # Application factory, server lifespan, middleware & CORS
│   ├── features/               # Modular domain feature slices (routes, controllers & domain logic)
│   ├── shared/                 # Shared utilities, AI model clients, logger & configuration
│   ├── database/               # Database connection, repository layer & schemas (SQL/Pydantic)
│   ├── data/                   # Embedded SQLite persistent storage, cache & media assets
│   ├── openapi/                # OpenAPI/Swagger documentation & custom endpoint schemas
│   ├── main.py (or index.ts)   # Server entry point & application bootstrap
│   ├── requirements.txt        # Server dependencies (or package.json if Node.js)
│   └── README.md               # Backend API architecture guide, setup & endpoints
├── metadata.json               # Canonical machine-readable project manifest
├── package.json                # Project root workspace scripts, dependencies & runner hooks
├── README.md                   # Comprehensive project architecture guide & onboarding setup
├── .env.example                # Standardized template environment variables (no secrets)
└── scripts/                    # Automation scripts & standalone dev runners (e.g. dev.py)
```

### Required Files Checklist

1. **`metadata.json`**: Must declare `features`, `techStack`, `commands`, `localServices`, `apiEndpoints`, and `configuration`.
2. **`README.md`**: Must explain project purpose, features, installation, environment setup, and API routes (with dedicated `README.md` guides in project root, `client/`, and `server/`).
3. **`.env.example`**: Must list every required environment variable with descriptive placeholder values.
4. **`public/` Logo Asset**: Must provide a high-resolution SVG or PNG logo for portal branding.

---

### Feature Slice Architecture (`features/`)

Every application in the monorepo follows a strict **Domain-Driven Feature Slice** pattern across both Client and Server. Instead of grouping files globally by technical type (e.g. all components together, all routes together), all logic, state, and UI belonging to a single domain capability are self-contained inside its feature slice:

#### 1. Client Feature Slice (`client/src/features/<feature-name>/`)

```text
client/src/features/<feature-name>/
├── api/                        # Typed API client fetchers & endpoint caller functions
├── components/ (or pages/)     # Domain-specific React UI components, cards, forms & modals
├── hooks/                      # Custom React hooks encapsulating feature behaviors & events
├── context/ (or state/)        # Local state stores, React Context, or Zustand slices
├── types.ts                    # TypeScript interfaces, DTOs & response schemas
└── README.md                   # Feature overview, dependencies & usage notes
```

- **Domain Isolation**: Code inside `<feature-name>` only imports from its own slice or from `src/shared/`. Slices should not directly depend on internal files of other feature slices.
- **Shared Primitives**: Reusable UI components (buttons, badges, inputs, layout wrappers) belong in `src/shared/components/`.

#### 2. Server Feature Slice (`server/features/<feature-name>/`)

```text
server/features/<feature-name>/
├── router.py                   # FastAPI APIRouter declaring REST/WebSocket endpoints
├── service.py                  # Core business logic, domain algorithms & service workflows
├── schemas.py                  # Pydantic request validation & response serialization models
├── repository.py (optional)    # Dedicated SQLite queries, database transactions & queries
└── __init__.py                 # Feature module exports
```

- **Clean Router-Service Separation**: `router.py` only handles HTTP parameters, status codes, and authorization; all business logic and external API calls belong in `service.py`.
- **Schema Validation**: All payloads must be strictly typed using Pydantic models in `schemas.py`.

---

### Public Assets Directory (`public/`)

The `public/` directory hosts static, uncompiled web assets served directly at the root URL path (`/`) without processing by the Vite bundler:

```text
client/public/
├── icons/                      # Application icons & PWA assets
│   ├── icon-192x192.png        # Standard mobile home screen icon
│   └── icon-512x512.png        # High-DPI splash screen icon
├── logos/                      # Primary vector & raster branding
│   ├── logo.svg                # Master scalable vector logo (preferred)
│   └── logo-dark.svg           # High-contrast / dark theme variation
├── favicon.svg                 # Scalable modern browser tab favicon
├── favicon.ico                 # Legacy browser fallback favicon
├── manifest.json               # Web App Manifest (PWA metadata & theme colors)
├── robots.txt                  # Search engine crawler indexing directives
└── og-image.png                # Social media Open Graph preview banner (1200x630)
```

#### Rules for Public Assets

1. **Never Import via JS Bundler**: Reference files in `public/` with absolute root paths (e.g. `<img src="/logos/logo.svg" />` or `<link rel="icon" href="/favicon.svg" />`), never `import logo from '../public/logo.svg'`.
2. **Prefer Vector SVGs**: Use SVG for logos and icons for crisp rendering across all screen densities.
3. **Monorepo Logo Integration**: The project's primary logo must also be registered in the root portal's `public/project-logos/<project-name>.svg` for portal card display.

---

### Application Shell & Factory Architecture (`app/`)

Both Client and Server maintain dedicated `app/` directories that isolate global orchestration, bootstrapping, and lifecycle management away from domain features:

#### 1. Client Application Shell (`client/src/app/`)

```text
client/src/app/
├── AppLayout.tsx               # Master shell layout: sidebar, navigation header, status bar & breadcrumbs
├── AppRouter.tsx               # Primary declarative view router, path matching & route guards
├── routes.ts                   # Centralized route paths, navigation menus, and permission levels
├── providers/                  # Global React context providers (Auth, Theme, QueryClient, Toast notifications)
└── README.md                   # Client orchestration documentation
```

- **Separation of Concerns**: `AppRouter.tsx` only maps URLs to feature pages; it does not embed heavy business logic or deep UI markup.
- **Unified Shell**: `AppLayout.tsx` provides a consistent responsive framing shell (navigation, user profile menu, breadcrumbs) wrapping across all feature views.

#### 2. Server Application Factory (`server/app/`)

```text
server/app/
├── factory.py                  # FastAPI application factory (create_app()), lifespan context & middleware
├── server.py                   # Server runtime initialization & entrypoint launcher
├── middleware.py (optional)    # Custom ASGI middlewares (request telemetry, CORS, security headers)
├── __init__.py                 # Module exports
└── README.md                   # Server bootstrap architecture documentation
```

- **Application Factory Pattern**: The backend relies on `create_app()` so that test runners, CLI scripts, and serverless wrappers can instantiate instances with mockable configurations.
- **Lifespan Context**: Startup tasks (database table initialization, schema verification, background task schedulers) and graceful shutdown cleanup are managed cleanly inside `@asynccontextmanager async def lifespan(app: FastAPI)`.

---

### Database Architecture Directory (`server/database/`)

The `server/database/` directory manages all database connectivity, connection pooling, schema migrations, DDL definitions, and repository query abstractions:

```text
server/database/
├── connection.py               # Database engine, connection factory, session management & SQLite pragmas
├── schema.py                   # Pydantic validation models, ORM mappings (SQLAlchemy/SQLModel) & dataclasses
├── schema.sql                  # Canonical DDL SQL script (CREATE TABLE IF NOT EXISTS, indexes, triggers)
├── repository.py               # Central repository class with domain CRUD transactions & SQL queries
├── migrations/ (optional)      # Sequential database migration scripts (e.g. 001_initial.sql, 002_add_index.sql)
│   ├── 001_initial_schema.sql  # Initial baseline schema creation
│   └── 002_add_audit_logs.sql  # Incremental schema migration step
├── seeds/ (optional)           # Initial dummy or baseline test data fixtures (.sql or .json)
│   └── seed_data.json          # Development test seed fixtures
├── __init__.py                 # Database package module exports (get_db, init_db, Repository)
└── README.md                   # Database layer architecture, ER diagram, schema notes & migration guide
```

#### Database Architecture Standards & Best Practices

1. **Isolated Connection Factory (`connection.py`)**:
   - Centralize all database connection logic into a clean context manager or dependency (e.g. `get_db()`).
   - For SQLite, enforce high-concurrency pragmas upon every new connection:
     - `PRAGMA journal_mode = WAL;` (Write-Ahead Logging for concurrent readers & non-blocking writes)
     - `PRAGMA synchronous = NORMAL;` (Optimal durability and I/O throughput)
     - `PRAGMA foreign_keys = ON;` (Strict referential integrity enforcement)
     - `PRAGMA busy_timeout = 5000;` (Wait up to 5 seconds before raising database lock errors)
2. **Canonical DDL in `schema.sql`**:
   - Maintain a single clean, readable `schema.sql` defining all tables with `CREATE TABLE IF NOT EXISTS`.
   - Never hardcode raw SQL string definitions across routers or services; keep schema DDL in `database/`.
3. **Repository Pattern (`repository.py`)**:
   - Feature services must not execute raw SQL queries directly inside HTTP handlers. Services call strongly typed methods on the Repository class (e.g. `repo.get_project(id)`, `repo.create_video_record(data)`).
   - Return row objects converted to dictionary or Pydantic models from `schema.py`.
4. **Idempotent Bootstrapping**:
   - The database initialization routine (`init_db()`) must execute automatically during the application factory's lifespan event without dropping or wiping existing user data.

---

### Persistent Data & Storage Directory (`server/data/`)

The `server/data/` directory is the dedicated location for all persistent application state, SQLite database files, temporary binary buffers, AI media assets, and cached files:

```text
server/data/
├── <project-name>.db           # Primary SQLite database file (e.g. apexmind.db, outpass.db)
├── <project-name>.db-wal       # SQLite Write-Ahead Log buffer (auto-generated during runtime)
├── <project-name>.db-shm       # SQLite Shared-Memory index file (auto-generated during runtime)
├── audio/                      # Synthesized AI voiceover narration, TTS audio clips & WAV buffers
│   └── .gitkeep                # Tracks directory structure in Git while ignoring binary assets
├── media/                      # Downloaded video stock clips, images, canvas textures & previews
│   └── .gitkeep                # Tracks directory structure in Git while ignoring binary assets
├── rendered_shorts/ (or exports/) # Final exported videos, generated documents, PDFs, or zips
│   └── .gitkeep                # Tracks directory structure in Git while ignoring binary assets
├── cache/                      # Temporary API response cache, thumbnail caches & model buffers
│   └── .gitkeep                # Tracks directory structure in Git while ignoring binary assets
└── README.md                   # Data storage documentation, backup commands & retention rules
```

#### Rules for Data & Storage

1. **Absolute Path Independence**:
   - Resolve database and storage paths relative to `server/` using Python's `pathlib.Path(__file__).resolve()`:

     ```python
     DATA_DIR = Path(__file__).resolve().parent.parent / "data"
     DB_PATH = DATA_DIR / "<project-name>.db"
     ```

   - Never use relative string paths like `"data/db.sqlite"` or `"./apexmind.db"` which fail when launched from different working directories or runner scripts.
2. **Strict Git Tracking Boundaries (`.gitignore`)**:
   - **Tracked in Git**: Every subfolder must include a `.gitkeep` file so empty directories exist upon clone.
   - **Ignored in Git**: All `.db`, `.db-wal`, `.db-shm`, `.mp4`, `.mp3`, `.wav`, and temporary cache files must be excluded in the project `.gitignore`:

     ```gitignore
     # Local database and media storage
     server/data/*.db
     server/data/*.db-wal
     server/data/*.db-shm
     server/data/audio/*
     !server/data/audio/.gitkeep
     server/data/media/*
     !server/data/media/.gitkeep
     server/data/rendered_shorts/*
     !server/data/rendered_shorts/.gitkeep
     server/data/cache/*
     !server/data/cache/.gitkeep
     ```

3. **Database Direct Inspection & Backup**:
   - Standard commands for developers to inspect tables or backup SQLite databases:

     ```bash
     # Inspect tables
     sqlite3 server/data/<project-name>.db ".tables"

     # Create atomic online backup without interrupting server
     sqlite3 server/data/<project-name>.db ".backup server/data/<project-name>_backup.db"
     ```

---

## 3. Strict Port Allocation Rules

Port collisions prevent multi-application concurrency. The monorepo statically assigns ports into two dedicated blocks:

### Rule 3.1: Frontend Port Range (`5173` – `5181`)

- No application may choose an arbitrary frontend port.
- Assigned ports:
  - `5173`: `apexmind-ai`
  - `5174`: `outpass-system`
  - `5175`: `free-api-hub`
  - `5176`: `sonikoma`
  - `5177`: `spatial-dimensions`
  - `5178`: `college-management-system`
  - `5179`: `globalpulse-ai`
  - `5180`: `postcraft-ai`

### Rule 3.2: Backend Port Range (`8000` – `8008`)

- Backend servers must bind strictly to `127.0.0.1` on their assigned port:
  - `8000`: `apexmind-ai` (FastAPI)
  - `8001`: `outpass-system` (FastAPI)
  - `8002`: `free-api-hub` (FastAPI)
  - `8003`: `globalpulse-ai` (FastAPI)
  - `8005`: `college-management-system` (Express)
  - `8006`: `sonikoma` (FastAPI)
  - `8007`: `spatial-dimensions` (Express)

### Rule 3.3: Port Cleanup Protocol

Before binding to a port, launch scripts must probe for stale zombie processes and cleanly terminate them:

```bash
# Handled automatically by monorepo runner:
npx @workspace/runner project <project-id> --kill-port
```

---

## 4. Shared Packages Integration Rules

All projects must actively leverage the monorepo shared packages rather than reinventing logging, tokens, or runners.

### Rule 4.1: Logging Standard (`@workspace/logger`)

- **Python Backends**: Must import `setup_logger` or `get_logger` from `workspace_logger`.
- **Frontend Clients**: Must use `consoleLogger` from `@workspace/logger` for system banners and telemetry.
- **Sensitive Data Masking**: Loggers must automatically sanitize:
  - Authorization bearer tokens (`Bearer sk_...`)
  - API keys (`GEMINI_API_KEY`, `OPENAI_API_KEY`, `SUPABASE_KEY`)
  - Passwords and secret hashes

```python
# Python Backend Standard:
from workspace_logger import setup_logger

logger = setup_logger("apexmind-ai", level="INFO")
logger.info("SERVER", "FastAPI server running", port=8000)
```

```typescript
// Frontend Client Standard:
import { consoleLogger } from '@workspace/logger';

consoleLogger.info('INIT', 'Application mounted', { port: 5173 });
```

### Rule 4.2: Design Tokens & Styling (`@workspace/config`)

- Applications using Tailwind CSS must inherit the `@workspace/config` tokens:

```javascript
// tailwind.config.js
import { tokens } from '@workspace/config/tailwind/tokens';

export default {
  theme: {
    extend: {
      colors: tokens.colors,
      borderRadius: tokens.borderRadius,
    },
  },
};
```

### Rule 4.3: Process Lifecycle (`@workspace/runner`)

- Every project must support unified invocation via:

```bash
npx @workspace/runner project <project-id>
```

---

## 5. Backend API & Routing Standards

1. **Prefix All API Routes with `/api/`**: Never expose root endpoints like `/users`; always use `/api/users`.
2. **Mandatory Healthcheck Endpoint**: Every backend must serve a JSON health status at `GET /api/health`:

```json
{
  "status": "healthy",
  "app": "apexmind-ai",
  "timestamp": "2026-11-21T15:00:00Z",
  "uptime": 1420
}
```

3. **Vite Proxy Configuration**: The frontend must forward `/api` requests to the local backend port:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---

## 6. Database & Persistence Standards

1. **Zero External Daemon Requirement**: For local development, projects must default to embedded databases (SQLite via `better-sqlite3`, `aiosqlite`, or SQLAlchemy).
2. **Database Storage Location**: SQLite database files must reside in `server/data/` or project root (e.g. `server/data/apexmind.db` or `hostel.db`).
3. **Declarative Schemas**: SQL tables must be defined in schema files (e.g. `database_schema.sql` or SQLAlchemy ORM classes) and committed to source control.
4. **Git Exclusion**: Actual database binary files (`*.db`, `*.sqlite`, `*.sqlite3`) must be ignored in `.gitignore`.

---

## 7. Environment Variables & Security Rules

1. **Never Commit Secrets**: `.env` must be in `.gitignore`.
2. **Mandatory `.env.example`**: Every project must maintain a complete `.env.example` documenting all configuration keys.
3. **Client vs. Server Variable Scoping**:
   - Variables accessed by the client must be prefixed with `VITE_` or `NEXT_PUBLIC_`.
   - Backend secrets (`JWT_SECRET`, `GEMINI_API_KEY`, `DATABASE_URL`) must **never** carry the `VITE_` prefix, preventing accidental bundling into client scripts.

---

## 8. Project Metadata Manifest Schema (`metadata.json`)

Each application root must contain a `metadata.json` adhering to this schema:

```json
{
  "name": "Human-Readable Application Title",
  "description": "Clear 1-2 sentence description of what the application does.",
  "features": [
    "Feature capability bullet 1",
    "Feature capability bullet 2"
  ],
  "techStack": {
    "frontend": ["React", "TypeScript", "Vite", "Tailwind CSS"],
    "backend": ["Python", "FastAPI", "Uvicorn"],
    "database": ["SQLite"],
    "ai": ["Google Gemini 2.5 Flash"]
  },
  "commands": {
    "development": "npm run dev",
    "frontend": "npm run frontend",
    "backend": "npm run backend",
    "build": "npm run build",
    "lint": "npm run lint"
  },
  "localServices": {
    "frontend": "http://localhost:5173",
    "backend": "http://localhost:8000",
    "apiDocs": "http://localhost:8000/api/docs",
    "healthCheck": "http://localhost:8000/api/health"
  },
  "apiEndpoints": [
    "GET /api/health",
    "POST /api/generate"
  ],
  "configuration": [
    "PORT",
    "FRONTEND_PORT",
    "BACKEND_URL",
    "GEMINI_API_KEY"
  ]
}
```

---

## 9. Monorepo Project Compliance Summary

| Project | Port (FE/BE) | Runtime | Database | Shared Packages Consumed |
| :--- | :---: | :--- | :--- | :--- |
| **`apexmind-ai`** | `5173` / `8000` | React 19 + FastAPI | SQLite | `@workspace/logger`, `@workspace/runner`, `@workspace/config` |
| **`outpass-system`** | `5174` / `8001` | React 18 + FastAPI | SQLite + SQLAlchemy | `@workspace/logger`, `@workspace/runner` |
| **`free-api-hub`** | `5175` / `8002` | React 18 + FastAPI | JSON Flat Store | `@workspace/logger`, `@workspace/runner` |
| **`sonikoma`** | `5176` / `8006` | React 19 + FastAPI | SQLite / Supabase | `@workspace/logger`, `@workspace/runner`, `@workspace/config` |
| **`spatial-dimensions`** | `5177` / `8007` | React 19 + Express | JSONL Store | `@workspace/logger`, `@workspace/runner` |
| **`college-management`** | `5178` / `8005` | React 19 + Express | SQLite (`better-sqlite3`) | `@workspace/logger`, `@workspace/runner`, `@workspace/config` |
| **`globalpulse-ai`** | `5179` / `8003` | Next.js 14 + FastAPI | SQLite / aiosqlite | `@workspace/logger`, `@workspace/runner` |
| **`postcraft-ai`** | `5180` / `5180` | Next.js 14 Fullstack | SQLite Database | `@workspace/logger`, `@workspace/runner` |
