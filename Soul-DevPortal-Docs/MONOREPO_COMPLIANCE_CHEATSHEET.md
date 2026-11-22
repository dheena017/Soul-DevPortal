# Monorepo Compliance Cheatsheet

> **Authoritative Operational Reference & Checklist**  
> Complete rulebook, directory standards, port matrix, database conventions, and root CLI commands governing all 8 micro-applications in the Soul Workspace monorepo.

---

## 1. Executive Summary & Core Rules

Every micro-application residing in `Soul-DevPortal-Projects/<project-name>/` must adhere to these unified monorepo rules. Violations introduce port collisions, broken runner scripts, environment leaks, or process synchronization failures.

```
                           SOUL MONOREPO ARCHITECTURE
 ┌────────────────────────────────────────────────────────────────────────────┐
 │  CLI SUPERVISOR:  npm run dev:all / dev:client / dev:server / dev:project  │
 └─────────────────────────────────────┬──────────────────────────────────────┘
                                       │
        ┌──────────────────────────────┴──────────────────────────────┐
        ▼                                                             ▼
┌──────────────────────────────┐              ┌──────────────────────────────┐
│  CLIENT ECOSYSTEM (TS 5.x)   │              │  SERVER ECOSYSTEM (Py 3.11+) │
│  Ports: 5173 – 5181          │              │  Ports: 8000 – 8008          │
│  React 19 / Vite / Next.js   │              │  Python FastAPI / Express.js │
│  Tailwind CSS v4             │              │  SQLite (WAL Mode)           │
│  @workspace/logger (browser) │              │  workspace_logger (5-column) │
└──────────────────────────────┘              └──────────────────────────────┘
```

---

## 2. Master Standards Matrix

| # | Standard | Category | Severity | Canonical Rule |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **Package Scoping** | Packages | `MANDATORY` | npm packages use `@workspace/<name>`; Python modules use `workspace_<name>`. |
| **02** | **Dual Manifests** | Packages | `MANDATORY` | Shared libraries maintain synchronized `package.json` and `pyproject.toml`. |
| **03** | **Port Allocations** | Networking | `MANDATORY` | Client: `5173`–`5181`; Server: `8000`–`8008`. Zero overlapping ports allowed. |
| **04** | **Data Masking** | Security | `CRITICAL` | `@workspace/logger` must sanitize API keys, Bearer tokens, and passwords. |
| **05** | **Directory Naming** | Architecture | `MANDATORY` | Every project must use `client/` and `server/`. No legacy `frontend/` or `backend/`. |
| **06** | **Feature Slices** | Architecture | `STANDARD` | Co-locate domain logic inside `features/<name>/` slices across Client and Server. |
| **07** | **Database Pragmas** | Persistence | `STANDARD` | SQLite engines must enable WAL mode, enforce foreign keys, and keep DDL in `schema.sql`. |
| **08** | **Static Web Assets** | Assets | `STANDARD` | Place uncompiled web assets in `client/public/`. Reference via root `/` URLs; never JS import. |
| **09** | **Path Independence** | Reliability | `CRITICAL` | Always resolve filesystem paths dynamically via `Path(__file__).resolve()`. |
| **10** | **Runner Automation** | Tooling | `STANDARD` | Run and manage micro-apps through root `npm run dev:*` scripts with automated port-kill. |

---

## 3. Canonical Directory Layout

Every project must follow the standardized directory structure:

```text
Soul-DevPortal-Projects/<project-name>/
├── client/                     # Frontend client application (React 19 / Vite or Next.js)
│   ├── src/                    # Feature-driven client source code
│   │   ├── features/           # Modular domain feature slices (components, hooks, state, API)
│   │   ├── shared/             # Shared UI components, layout primitives, lib & utilities
│   │   ├── app/                # Application shell, routing setup & global providers
│   │   ├── App.tsx             # Root application component
│   │   ├── main.tsx            # DOM mount & client entry point
│   │   ├── index.css           # Global stylesheets & design token variables
│   │   └── README.md           # Client source structure documentation
│   ├── public/                 # Static web assets, branding logos, icons, favicons
│   │   ├── logos/              # Scalable SVG application logos
│   │   ├── icons/              # Mobile home-screen & PWA icons
│   │   ├── favicon.svg         # Modern vector favicon
│   │   └── robots.txt          # Crawler directives
│   ├── index.html              # HTML entry point (for Vite SPA)
│   ├── vite.config.ts          # Bundler configuration with /api reverse proxy
│   ├── tsconfig.json           # Client TypeScript configuration
│   ├── package.json            # Client dependencies & scripts
│   └── README.md               # Client architecture guide & dev workflow
├── server/                     # Backend API server (Python FastAPI or Node.js Express)
│   ├── app/                    # Application factory, server lifespan, middleware & CORS
│   │   ├── factory.py          # FastAPI create_app() & lifespan manager
│   │   ├── server.py           # Server runtime initialization
│   │   └── README.md           # Server architecture guide
│   ├── features/               # Modular domain feature slices (routes, controllers & logic)
│   │   └── <feature-name>/
│   │       ├── router.py       # APIRouter endpoint definitions
│   │       ├── service.py      # Core business logic & workflows
│   │       ├── schemas.py      # Pydantic request/response models
│   │       └── repository.py   # Database query transactions
│   ├── shared/                 # Shared utilities, AI model clients, logger & configuration
│   ├── database/               # Database connection, repository layer & schemas
│   │   ├── connection.py       # Connection factory with SQLite WAL pragmas
│   │   ├── schema.py           # Database schema models & entity classes
│   │   ├── schema.sql          # Canonical DDL SQL schema (CREATE TABLE IF NOT EXISTS)
│   │   └── repository.py       # Central repository class with domain CRUD
│   ├── data/                   # Embedded SQLite persistent storage, cache & media assets
│   │   ├── <project>.db        # SQLite database file (ignored in git)
│   │   ├── audio/              # Voiceover narration & audio buffers (.gitkeep tracked)
│   │   ├── media/              # Video stock footage & preview assets (.gitkeep tracked)
│   │   ├── rendered_shorts/    # Exported video files (.gitkeep tracked)
│   │   ├── cache/              # Intermediate caches (.gitkeep tracked)
│   │   └── README.md           # Storage guide & maintenance instructions
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

---

## 4. Port Reservation & Socket Cleanup Rules

Ports are statically allocated to guarantee multi-app concurrency without process collisions:

### Client Port Block (`5173` – `5181`)

* `5173`: `apexmind-ai` (Vite 8 + React 19)
* `5174`: `outpass-system` (Vite + React 18 + Capacitor)
* `5175`: `free-api-hub` (Vite + React 18)
* `5176`: `sonikoma` (Vite + React 19)
* `5177`: `spatial-dimensions` (Vite 6 + React 19)
* `5178`: `college-management-system` (Vite 6 + React 19)
* `5179`: `globalpulse-ai` (Next.js 14)
* `5180`: `postcraft-ai` (Next.js 14)

### Server Port Block (`8000` – `8008`)

* `8000`: `apexmind-ai` (Python FastAPI)
* `8001`: `outpass-system` (Python FastAPI)
* `8002`: `free-api-hub` (Python FastAPI)
* `8003`: `globalpulse-ai` (Python FastAPI)
* `8005`: `college-management-system` (Node.js Express)
* `8006`: `sonikoma` (Python FastAPI)
* `8007`: `spatial-dimensions` (Node.js Express)

### Reverse Proxy Standard

Client bundlers (`vite.config.ts`) must proxy `/api` requests to `127.0.0.1:<server_port>` to eliminate local development CORS issues:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://127.0.0.1:8000',
      changeOrigin: true,
    },
  },
}
```

---

## 5. Shared Package Integration

Every project must consume shared utilities from monorepo packages instead of duplicating logic:

### 1. `@workspace/logger` (Universal Telemetry)

* **Python Server**:

  ```python
  from workspace_logger import setup_server_logging
  logger = setup_server_logging("ApexMind")
  logger.info("Server started on port 8000")
  ```

* **Client App**:

  ```typescript
  import { consoleLogger } from '@workspace/logger';
  consoleLogger.info('APP', 'Client initialized', { port: 5173 });
  ```

* **Masking Rules**: Always sanitizes `Bearer sk_...`, `GEMINI_API_KEY`, passwords, and credentials automatically.

### 2. `@workspace/config` (Design Tokens & Presets)

* Extend Tailwind presets in `tailwind.config.js`:

  ```javascript
  import preset from '@workspace/config/tailwind/preset';
  export default { presets: [preset] };
  ```

* Extend TypeScript configurations in `tsconfig.json`:

  ```json
  { "extends": "@workspace/config/tsconfig/react.json" }
  ```

### 3. `@workspace/runner` (Process Supervisor)

* Automatically probes sockets, terminates stale listeners, loads cascaded `.env` files, and manages child processes with Windows Job Object bindings.

---

## 6. Database Persistence & Storage Rules

1. **SQLite Write-Ahead Logging (WAL)**:

   ```python
   conn = sqlite3.connect(DB_PATH)
   conn.execute("PRAGMA journal_mode = WAL;")
   conn.execute("PRAGMA synchronous = NORMAL;")
   conn.execute("PRAGMA foreign_keys = ON;")
   conn.execute("PRAGMA busy_timeout = 5000;")
   conn.row_factory = sqlite3.Row
   ```

2. **Dynamic Path Resolution**:

   ```python
   from pathlib import Path
   SERVER_ROOT = Path(__file__).resolve().parent.parent
   DATA_DIR = SERVER_ROOT / "data"
   DB_PATH = DATA_DIR / "<project-name>.db"
   ```

3. **Database Maintenance Commands**:

   ```bash
   # Inspect database tables:
   sqlite3 server/data/<project-name>.db ".tables"

   # Create atomic online backup:
   sqlite3 server/data/<project-name>.db ".backup server/data/<project-name>_backup.db"
   ```

---

## 7. Security & Environment Protocol

1. **Zero Secrets in Version Control**: Never commit real API keys, OAuth client secrets, or private tokens.
2. **Template Synchronization**: Every project must provide `.env.example` with clear placeholder values:

   ```ini
   PORT=8000
   FRONTEND_PORT=5173
   GEMINI_API_KEY=your_gemini_api_key_here
   DATABASE_URL=sqlite:///server/data/apexmind.db
   ```

3. **Gitignore Boundaries**:
   * Binary assets (`.mp4`, `.mp3`, `.wav`) and `.db` files must be ignored.
   * `.gitkeep` files in `server/data/*` subfolders must remain tracked.

---

## 8. Monorepo Scripts Cheatsheet & Command Matrix

### Root Workspace Commands

| Command | Action | Scope / Runtime |
| :--- | :--- | :--- |
| `npm run dev` | Starts the DevPortal interactive UI | DevPortal Frontend (:5181) |
| `npm run dev:portal:server` | Starts the DevPortal FastAPI metadata extraction server | DevPortal Backend (:8008) |
| `npm run dev:all` | Concurrently boots all 8 applications (clients + servers) | Workspace Supervisor |
| `npm run dev:client` | Starts all client dev servers concurrently | Client Ecosystem (:5173-:5181) |
| `npm run dev:server` | Starts all backend API servers concurrently | Server Ecosystem (:8000-:8008) |
| `npm run build` | Builds the DevPortal production bundle | Production Bundler (Vite) |
| `npm run extract` | Runs schema extraction & AST parsing across all 8 apps | Metadata Engine |
| `npm run typecheck` | Validates TypeScript types across portal & packages | Static Analysis |

### Direct Project Launchers (Root Shortcuts)

| Command | Target Application | Client Port | Server Port |
| :--- | :--- | :---: | :---: |
| `npm run dev:apexmind` | ApexMind Studio AI | `:5173` | `:8000` |
| `npm run dev:outpass` | Outpass Management System | `:5174` | `:8001` |
| `npm run dev:free-api` | Free API Hub | `:5175` | `:8002` |
| `npm run dev:sonikoma` | Sonikoma AI Studio | `:5176` | `:8006` |
| `npm run dev:spatial` | Spatial Dimensions 3D | `:5177` | `:8007` |
| `npm run dev:college` | College Management System | `:5178` | `:8005` |
| `npm run dev:globalpulse` | GlobalPulse AI | `:5179` | `:8003` |
| `npm run dev:postcraft` | PostCraft AI | `:5180` | `:5180` |

### Unified Child Project Standard (Every `package.json`)

| Command | Purpose | Target Port / Environment |
| :--- | :--- | :--- |
| `npm run dev` | Runs dual-stack supervisor (client + server concurrently) | Dual-Stack Supervisor |
| `npm run dev:client` | Starts client development server on designated port | Assigned Port (:5173-:5181) |
| `npm run dev:server` | Starts API development server on designated port | Assigned Port (:8000-:8008) |
| `npm run build` | Compiles client / fullstack assets for production | Production Bundler |
| `npm run typecheck` | Runs static type check verification | TypeScript / Linter |
| `npm run clean` | Removes build artifacts (`dist/`, `.next/`, temporary files) | Filesystem Cleanup |
