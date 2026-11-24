# Architecture & Project Standards

Welcome to the central architectural specification for the Soul Monorepo. This directory houses the engineering invariants, design standards, and technical runbooks governing all 8 micro-applications and shared libraries.

---

## 🏛️ Architectural Sub-Modules

Every domain follows the **Dual-Document Paradigm**: `rules.md` (strict constraints) and `main.md` (comprehensive guide).

### 1. ⚙️ [Framework & Tech Stack](project-framework/main.md)
The canonical definition of **what framework and tech stack to use**:
- [Framework Rules](project-framework/rules.md)
- [Framework Technical Specification](project-framework/main.md)

### 2. 🔌 [API Design & Routing](project-api/main.md)
FastAPI and Express routing standards, response envelopes, HTTP status codes, and streaming:
- [API Rules](project-api/rules.md)
- [API Technical Specification](project-api/main.md)

### 3. 💾 [Database & Persistence](project-database/main.md)
Embedded SQLite engine, Write-Ahead Logging (WAL), connection lifecycles, and migrations:
- [Database Rules](project-database/rules.md)
- [Database Technical Specification](project-database/main.md)

### 4. 📁 [Project Layout & Directory Standards](project-layout/main.md)
Monorepo topology, directory hierarchy, import aliasing, and asset management:
- [Layout Rules](project-layout/rules.md)
- [Layout Technical Specification](project-layout/main.md)

### 5. 📋 [Project Schema & Data Contracts](project-schema/main.md)
Canonical `metadata.json` manifest schema, Pydantic v2 server models, and Zod client validation:
- [Schema Rules](project-schema/rules.md)
- [Schema Technical Specification](project-schema/main.md)

### 6. 🚀 [Server Architecture & Lifespan](project-server/main.md)
Python FastAPI application factory, ASGI lifespan context managers, CORS, and middleware:
- [Server Rules](project-server/rules.md)
- [Server Technical Specification](project-server/main.md)

### 7. 🧩 [Feature-Sliced Design (FSD)](project-features/main.md)
Domain-driven feature slices, public facade barriers, state scoping, and co-location:
- [Feature Rules](project-features/rules.md)
- [Feature Technical Specification](project-features/main.md)

### 8. 💻 [Client Architecture & Tooling](project-client/main.md)
React 19 Single Page Applications, Vite 8 bundler, Tailwind CSS v4, and Next.js shims:
- [Client Rules](project-client/rules.md)
- [Client Technical Specification](project-client/main.md)

### 9. 🔐 [Environment & Security](project-env/main.md)
Environment hygiene, prefix scoping matrix, fail-fast validation, sensitive data masking, and master config matrix:
- [Environment Rules](project-env/rules.md)
- [Environment Technical Specification](project-env/main.md)

---

## 📜 Core Architectural Invariants
Review **[The 10 Golden Architectural Invariants](golden-rules.md)** before contributing to any repository in the workspace.
