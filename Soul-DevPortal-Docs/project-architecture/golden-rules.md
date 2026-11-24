# The 10 Golden Architectural Invariants

> **Scope**: Monorepo Workspace Architectural Rules  
> **Applies to**: All micro-applications, shared packages, and developer portal components

---

## 1. Unified Three-Pillar Standard
Every micro-application must implement React 19 + Vite 8 + Tailwind CSS v4 on the frontend, Python 3.12+ + FastAPI + Uvicorn on the backend, and embedded SQLite with WAL mode for persistence.

## 2. Strict Feature-Slice Co-Location (FSD)
All domain-specific UI components, hooks, API fetchers, types, and server endpoints must be co-located within dedicated feature folders under `src/features/<feature>/` (client) and `features/<feature>/` (server).

## 3. The Public Facade Barrier (`index.ts`)
Features export only approved public interfaces via `index.ts`. No module may import private internal files of another feature.

## 4. Decoupled Application Shell (`src/app/`)
The `src/app/` directory serves purely as an application factory, router, provider tree, and layout frame. It must contain zero business domain logic or direct database mutations.

## 5. Mandatory Reverse Proxying via Vite
Client applications must never hardcode backend hostnames or ports. All network calls use `/api` and `/ws`, transparently reverse-proxied by Vite to the designated FastAPI port with `strictPort: true`.

## 6. Standardized JSON Response Envelopes
All API endpoints must return uniform envelopes: `{ "success": boolean, "data": T, "error": string | null, "timestamp": string }` with semantic HTTP status codes.

## 7. Isolated SQLite Persistence (`server/data/`)
All database binary and journal files (`.db`, `.db-wal`, `.db-shm`) must reside strictly in `server/data/<app>.db` and be permanently excluded from version control via `.gitignore`.

## 8. Canonical Manifest Parity (`metadata.json`)
Every project root must maintain an authoritative `metadata.json` declaring its title, ports, framework, server stack, database, and commands, matching `projects.json`.

## 9. Zero-Secret-in-Git & Prefix Scoping
No `.env` or credential files may be committed to Git. All variables must adhere to prefix scoping (`VITE_`, `SERVER_`, `DB_`, `AI_`, `AUTH_`) and be mirrored in `.env.example`.

## 10. Fail-Fast Boot Validation & Sanitized Logging
Backends must validate all required environment configurations on startup and terminate immediately if invalid. All logs must sanitize sensitive keys and passwords before emission.
