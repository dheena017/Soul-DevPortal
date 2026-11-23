# Monorepo Structure & System Architecture

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
 │   └── postcraft-ai          (:5180)   │ │   └── postcraft-ai          (:8004)   │
 └───────────────────────────────────────┘ └───────────────────────────────────────┘
```

---

## 2. Canonical Directory Layout
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
