# Project Layout Architecture — Technical Specification & Guide

> **Domain**: Monorepo Topology, Directory Hierarchy & Module Scoping  
> **Applies to**: All micro-applications and shared packages across the workspace

---

## 1. Monorepo Structural Blueprint

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
 │  │   └── postcraft-ai/                (:5180 / :8004)                       │
 │  │                                                                          │
 │  └── Soul-DevPortal-Docs/                                                   │
 │      ├── project-architecture/                                              │
 │      ├── 02-packages/                                                       │
 │      ├── 03-networking-and-ports/                                           │
 │      └── 04-cheatsheets/                                                    │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Canonical Project Directory Tree

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

## 3. Directory Responsibilities Matrix

| Directory | Mandatory Contents | Strict Boundaries & Prohibitions |
|---|---|---|
| `client/src/features/` | Components, hooks, types, API calls scoped to 1 domain | Never import from private internals of other features; use `index.ts` |
| `client/src/app/` | Router, Providers, Shell Frame | Never write direct SQL, API mutations, or business calculations |
| `client/src/shared/` | UI primitives (Button, Modal, Input), formatting helpers | Must be strictly domain-agnostic; no business domain state |
| `server/features/` | Router, Service, Pydantic Schemas | Router must only handle HTTP/status codes; logic belongs in Service |
| `server/database/` | DDL schemas, connection factory, migrations | All file paths must be resolved dynamically; never hardcode `C:\...` |
| `server/data/` | SQLite `.db`, `.db-wal`, uploads, media | Strictly ignored in `.gitignore`; no code or configs allowed here |
