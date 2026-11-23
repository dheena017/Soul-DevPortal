# Architecture & Project Standards

This section governs system architecture, repository structure, feature-slice layout, database conventions, and project metadata manifests for all workspaces in the monorepo.

## Documents in this Section
1. [The 5 Golden Rules of Architecture](golden-rules.md) — Core architecture principles, domain boundaries, and isolation.
2. [Monorepo Structure](monorepo-structure.md) — Canonical monorepo tree, workspace isolation, and core principles.
3. [Project Layout Rules](project-layout-rules.md) — Mandatory folder hierarchy (`features/`, `app/`, `public/`, `server/`).
4. [API Design Standards](api-design-standards.md) — FastAPI / Express routing standards, lifespan handlers, and JSON envelope formats.
5. [Database Persistence](database-persistence.md) — SQLite persistence, WAL mode, pathing conventions, and data retention rules.
6. [Project Metadata Schema](project-metadata-schema.md) — Canonical `metadata.json` schema specification and requirements.
