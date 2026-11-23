# Core Architecture Philosophy & The 5 Golden Rules

The Soul Monorepo architecture enforces strict separation of concerns, modular domain boundaries, isolated state persistence, and reproducible builds across all micro-applications and shared packages.

```
                   SOUL MONOREPO ARCHITECTURAL DOMAINS
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         CANONICAL WORKSPACE ROOT                            │
 │    ├── Soul-DevPortal-Packages/ (Shared Libraries: logger, runner, config)  │
 │    ├── Soul-DevPortal-Projects/ (Independent Micro-Apps: apexmind-ai, etc.) │
 │    └── Soul-DevPortal-Docs/     (Modularized Knowledge & Standards Base)    │
 └─────────────────────────────────────────────────────────────────────────────┘
                                  │
         ┌────────────────────────┴────────────────────────┐
         ▼                                                 ▼
 ┌──────────────────────────────┐          ┌──────────────────────────────┐
 │    SHARED PACKAGES DOMAIN    │          │     MICRO-PROJECTS DOMAIN    │
 │  ├── Strict 2-tier facades   │          │  ├── Feature-slice co-location│
 │  ├── Reusable across apps    │          │  ├── Decoupled app shell      │
 │  └── Triple-manifest parity  │          │  └── Isolated SQLite storage  │
 └──────────────────────────────┘          └──────────────────────────────┘
```

---

## The 5 Golden Rules of Architecture

### 1. Strict Feature-Slice Co-location
- All domain-specific UI components, custom hooks, API clients, and TypeScript types must be co-located within dedicated feature folders under `src/features/<feature-name>/`.
- Do not create horizontal dumping grounds (e.g., global `src/components/`, `src/hooks/`) for code that only belongs to a single business capability. Only truly generic, project-wide primitives (buttons, modals) live in `src/components/ui/`.

### 2. Decoupled Application Shell (`app/`)
- The `src/app/` directory functions purely as the application factory, router, provider wrapper, and global layout shell.
- It must **never** contain domain business logic, direct database access, or feature-specific state management. Features export clean facades imported by the shell.

### 3. Isolated Persistence Boundary (`server/data/`)
- All database files (`.db`, `.sqlite`), local document caches, JSON stores, and uploaded blobs must reside exclusively within `server/data/`.
- Database definitions, schemas, and migrations belong in `server/database/`.
- Persistent data directories must be ignored in Git (`server/data/*.db*`), guaranteeing zero dirty state commits into version control.

### 4. Canonical Manifest Parity (`metadata.json`)
- Every project root must maintain an accurate, schema-compliant `metadata.json` declaring its official name, category, allocated client/server ports, technology stack, and description.
- This manifest serves as the single source of truth for the monorepo runner, documentation generators, and port compliance checkers.

### 5. Uniform Response Envelopes & Lifespan Architecture
- Backend APIs (FastAPI or Express) must emit standardized JSON response envelopes containing structured status codes, data payloads, and explicit error schemas.
- Server startup and shutdown routines must use standard ASGI lifespan handlers or clean shutdown signals to release resources, close database pools, and log lifecycle transitions cleanly via `@workspace/logger`.
