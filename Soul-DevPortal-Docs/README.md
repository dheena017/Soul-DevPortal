# Soul-DevPortal Documentation Portal

Welcome to the central engineering documentation portal for **Soul-DevPortal**. This repository houses all technical guides, architectural standards, environment rules, shared package specifications, and developer runbooks governing the monorepo workspace.

---

## 📚 Documentation Categories

### 🏛️ [01. Project Architecture & Standards](project-architecture/README.md)
The central architecture and engineering hub governing all micro-applications, frameworks, and system boundaries.
- **[The 10 Golden Architectural Invariants](project-architecture/golden-rules.md)**
- **[Framework & Tech Stack ("What to Use")](project-architecture/project-framework/main.md)** — Canonical 3-Pillar Stack (React 19, FastAPI, SQLite WAL, Vite 8, Tailwind v4).
- **[API Design Standards](project-architecture/project-api/main.md)** — Uniform JSON envelopes, REST/WebSocket contracts, and error schemes.
- **[Database Persistence](project-architecture/project-database/main.md)** — SQLite WAL concurrency model, connection management, and migrations.
- **[Project Layout Rules](project-architecture/project-layout/main.md)** — Monorepo topology, directory hierarchy, and `@/*` path aliasing.
- **[Project Schema Contracts](project-architecture/project-schema/main.md)** — Canonical `metadata.json` schema, Pydantic v2, and Zod models.
- **[Server Architecture](project-architecture/project-server/main.md)** — FastAPI application factory, ASGI lifespan, and middleware pipeline.
- **[Feature-Sliced Design (FSD)](project-architecture/project-features/main.md)** — Domain slice co-location, public facade barriers, and state isolation.
- **[Client Architecture](project-architecture/project-client/main.md)** — React 19 SPA standards, Vite 8 reverse proxy, and Tailwind v4.
- **[Environment & Security](project-architecture/project-env/main.md)** — Prefix scoping, sensitive data masking, validation, and per-project templates.

---

### 📦 [02. Shared Packages](02-packages/README.md)
Architectural standards for reusable workspace packages, public facade patterns, and catalog guides.
- **[The 5 Golden Rules of Shared Packages](02-packages/golden-rules.md)**
- [Strict 2-Tier Architecture](02-packages/two-tier-architecture.md)
- [Workspace Logger (`@workspace/logger`)](02-packages/workspace-logger.md)
- [Workspace Runner (`@workspace/runner`)](02-packages/workspace-runner.md)
- [Workspace Config (`@workspace/config`)](02-packages/workspace-config.md)
- [Package Authoring Guide](02-packages/package-authoring-guide.md)
- [Package Verification](02-packages/package-verification.md)

---

### 🌐 [03. Networking & Ports](03-networking-and-ports/README.md)
Port reservation matrices, reverse proxy configurations, socket lifecycle, and detailed micro-application specifications.
- **[The 5 Golden Rules of Networking & Ports](03-networking-and-ports/golden-rules.md)**
- [Port Allocation Matrix](03-networking-and-ports/port-allocation-matrix.md)
- [Socket Cleanup Protocol](03-networking-and-ports/socket-cleanup-protocol.md)
- [Micro-App Specifications](03-networking-and-ports/README.md#micro-app-specifications-projects)

---

### ⚡ [04. Developer Cheatsheets](04-cheatsheets/README.md)
Quick-reference runbooks, CLI commands, and pre-commit audit checklists.
- **[The 5 Golden Rules of Developer Commands](04-cheatsheets/golden-rules.md)**
- [Monorepo Scripts](04-cheatsheets/monorepo-scripts.md)
- [Direct CLI Commands](04-cheatsheets/direct-cli-commands.md)
- [Compliance Checklist](04-cheatsheets/compliance-checklist.md)

---

## 🗄️ Legacy Documentation
Original monolithic guides are safely archived in [`_legacy/`](_legacy/).
