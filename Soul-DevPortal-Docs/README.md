# Soul-DevPortal Documentation Portal

Welcome to the central documentation portal for **Soul-DevPortal**. This repository houses all technical guides, architectural standards, environment rules, shared package specifications, and developer runbooks.

---

## 📚 Documentation Categories

### 🏛️ [01. Architecture & Standards](01-architecture/README.md)
System architecture, feature-slice directory structures, FastAPI/Express routing standards, database persistence, and project manifest schemas.
- **[The 5 Golden Rules of Architecture](01-architecture/golden-rules.md)**
- [Monorepo Structure](01-architecture/monorepo-structure.md)
- [Project Layout Rules](01-architecture/project-layout-rules.md)
- [API Design Standards](01-architecture/api-design-standards.md)
- [Database Persistence](01-architecture/database-persistence.md)
- [Project Metadata Schema](01-architecture/project-metadata-schema.md)

### 💻 [02. Tech Stack & Ecosystem](02-tech-stack/README.md)
Language specifications, runtime requirements, configuration standards, and cross-language communication patterns.
- **[The 5 Golden Rules of the Tech Stack](02-tech-stack/golden-rules.md)**
- [Programming Languages](02-tech-stack/programming-languages.md)
- [Styling & Tooling](02-tech-stack/styling-and-tooling.md)
- [Cross-Stack Integration](02-tech-stack/cross-stack-integration.md)

### 📦 [03. Shared Packages](03-packages/README.md)
Architectural standards for reusable packages, public facade patterns, and catalog guides.
- **[The 5 Golden Rules of Shared Packages](03-packages/golden-rules.md)**
- [Strict 2-Tier Architecture](03-packages/two-tier-architecture.md)
- [Workspace Logger (`@workspace/logger`)](03-packages/workspace-logger.md)
- [Workspace Runner (`@workspace/runner`)](03-packages/workspace-runner.md)
- [Workspace Config (`@workspace/config`)](03-packages/workspace-config.md)
- [Package Authoring Guide](03-packages/package-authoring-guide.md)
- [Package Verification](03-packages/package-verification.md)

### 🌐 [04. Networking & Ports](04-networking-and-ports/README.md)
Port reservation matrices, reverse proxy configurations, socket lifecycle, and detailed micro-application specifications.
- **[The 5 Golden Rules of Networking & Ports](04-networking-and-ports/golden-rules.md)**
- [Port Allocation Matrix](04-networking-and-ports/port-allocation-matrix.md)
- [Socket Cleanup Protocol](04-networking-and-ports/socket-cleanup-protocol.md)
- [Micro-App Specifications](04-networking-and-ports/projects/)

### 🔐 [05. Environment & Security](05-environment-and-security/README.md)
Environment variables hygiene, scoping prefixes, sensitive data masking, and complete `.env.example` templates.
- **[The 5 Golden Rules of Environment Security](05-environment-and-security/golden-rules.md)**
- [Universal .env Baseline](05-environment-and-security/universal-env-baseline.md)
- [Variable Naming Standards](05-environment-and-security/variable-naming-standards.md)
- [Sensitive Data Masking](05-environment-and-security/sensitive-data-masking.md)
- [Validation Code Patterns](05-environment-and-security/env-validation-patterns.md)
- [Per-Project .env Templates](05-environment-and-security/templates/)

### ⚡ [06. Developer Cheatsheets](06-cheatsheets/README.md)
Quick-reference runbooks, CLI commands, and pre-commit audit checklists.
- [Monorepo Scripts](06-cheatsheets/monorepo-scripts.md)
- [Direct CLI Commands](06-cheatsheets/direct-cli-commands.md)
- [Compliance Checklist](06-cheatsheets/compliance-checklist.md)

---

## 🗄️ Legacy Documentation
Original monolithic guides are safely archived in [`_legacy/`](_legacy/).
