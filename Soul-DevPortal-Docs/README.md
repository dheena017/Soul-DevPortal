# Soul-DevPortal Documentation Hub

Welcome to the unified engineering documentation portal for **Soul-DevPortal**. The documentation is organized into 4 core architectural domains, each structured with an authoritative master specification (`main.md`) and inviolable invariants (`golden-rules.md`).

---

## 📚 Master Documentation Hub

### 🏛️ 01. Project Architecture & Standards
The master architecture specification governing all 8 micro-applications, frameworks, and system boundaries.
- **[Master Technical Blueprint](01-project-architecture/main.md)** — Layout, 3-pillar framework, client (React 19), server (FastAPI), REST API, SQLite WAL, schemas, FSD, environment security, and standard file structure templates.
- **[The Golden Architectural Invariants](01-project-architecture/golden-rules.md)** — The 10 fundamental pillars and inviolable domain engineering rules.

---

### 📦 02. Shared Packages Architecture
Architectural standards for reusable workspace libraries (`@workspace/*`), 2-tier internal/external isolation, and authoring guides.
- **[Shared Packages Master Blueprint](02-packages-architecture/main.md)** — Core guides for `@workspace/config`, `@workspace/logger`, `@workspace/runner`, layout hierarchy, and step-by-step authoring walkthrough.
- **[The Golden Rules of Shared Packages](02-packages-architecture/golden-rules.md)** — The 5 golden rules, 2-tier separation, snake_case internals, and manifest parity invariants.

---

### 🌐 03. Networking & Ports Architecture
Port reservation matrices, reverse proxy configurations, socket lifecycle, and micro-application network topology.
- **[Networking & Ports Master Blueprint](03-networking-and-ports/main.md)** — Master port allocation matrix (`5173–5181` client, `8000–8008` server), Vite reverse proxying, and socket cleanup runbooks.
- **[The Golden Rules of Networking & Ports](03-networking-and-ports/golden-rules.md)** — Deterministic port blocks, immutable mapping, reverse proxy contracts, and loopback binding.

---

### ⚡ 04. Developer Cheatsheets & Commands
Quick-reference runbooks, CLI command guides, and pre-commit compliance checklists for the Soul Monorepo.
- **[Developer Cheatsheets & Commands Master Blueprint](04-cheatsheets/main.md)** — Multi-project launchers (`npm run dev:all`), single-template direct CLI commands for all 8 apps, and master compliance standards.
- **[The Golden Rules of Developer Commands](04-cheatsheets/golden-rules.md)** — Monorepo execution discipline, port isolation, and pre-commit verification gates.
