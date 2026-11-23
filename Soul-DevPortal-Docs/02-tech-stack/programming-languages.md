# Core Programming Languages Standard

## Core Programming Languages Matrix

| Language | Extension | Role | Primary Runtime | Key Packages & Paths |
| :--- | :---: | :--- | :--- | :--- |
| **Python** | `.py` | Server APIs, backend orchestration, process management, terminal telemetry | Python 3.11+ / CPython | `packages/runner`, `packages/logger`, `Soul-DevPortal-Projects/*/server/` |
| **TypeScript** | `.ts`, `.tsx` | Client applications, UI components, client logic, type safety | Node.js 20+ / Browser | `packages/logger/src/`, `Soul-DevPortal-Projects/*/client/` |
| **JavaScript** | `.js`, `.mjs` | Build configurations, Tailwind presets, tooling scripts | Node.js 20+ | `packages/config/tailwind/`, `vite.config.ts` |
| **Tailwind CSS** | `.css` | Semantic design system, responsive layouts, micro-animations | PostCSS / Tailwind Engine | `packages/config/tailwind/preset.js`, `globals.css` |
| **JSON / JSONC** | `.json` | Package management, project manifests, compiler configs | Native Parsers | `package.json`, `projects.json`, `tsconfig/*.json` |
| **TOML / INI** | `.toml`, `.ini` | Python package manifests, linter configurations, test runners | Ruff / Pip / Pytest | `pyproject.toml`, `packages/config/python/ruff.toml` |
| **Markdown** | `.md` | Architectural documentation, API guides, component manuals | Markdown Renderers | `README.md`, `PACKAGES_DESIGN_GUIDE.md` |

---

## 3. Deep Dive: The Two Primary Languages

### A. Python (`.py`) — The Server & Systems Language

Python serves as the backbone for asynchronous microservices, CLI tooling, and development process orchestration.

#### Key Responsibilities

1. **Process Orchestration (`workspace_runner`)**:
   - Manages simultaneous lifecycle execution for all micro-app clients and servers.
   - Enforces Windows Job Object binding so child processes cleanly terminate on `Ctrl+C`.
2. **System Telemetry & Logging (`workspace_logger`)**:
   - Formats enterprise terminal banners, timestamps, and log severities (`INFO`, `WARN`, `ERROR`, `DEBUG`).
3. **Microservice APIs (`Soul-DevPortal-Projects/*/server/`)**:
   - High-throughput asynchronous HTTP REST and WebSocket APIs powered by **FastAPI** and **Uvicorn**.

#### Python Architectural Rules

- **Strict Editable Installation**: Every shared Python library must be installed via `pip install -e packages/<name>`.
- **Zero `sys.path` Hacks**: Source code and scripts **must never** call `sys.path.insert()` or `sys.path.append()`. All packages resolve naturally through environment path pointers.
- **Standard Package Layout**: All internal Python code resides in canonical `workspace_<package_slug>/` modules containing a `py.typed` marker (PEP 561).

---

### B. TypeScript (`.ts`, `.tsx`) — The Client & Application Language

TypeScript provides 100% type-safe client-side application logic and reactive user interfaces.

#### Key Responsibilities

1. **Modern Client Micro-Apps (`Soul-DevPortal-Projects/*/client/`)**:
   - Modern Single Page Applications (SPAs) built with **React 19** and bundled via **Vite 8**.
2. **Client Telemetry (`@workspace/logger/client`)**:
   - Intercepts and bridges client-side console logs and unhandled errors directly to terminal telemetry.
3. **Shared Type Definitions & Contracts**:
   - Defines strict interfaces for API responses, UI component props, and shared utilities.

#### TypeScript Architectural Rules

- **Unified Compiler Presets**: Projects never duplicate 40-line `tsconfig.json` files; they extend `@workspace/config/tsconfig/<target>.json`.
- **Strict Null & Index Safety**: All projects enforce `noUncheckedIndexedAccess: true` and `exactOptionalPropertyTypes: true`.
- **Clean Module Syntax**: Monorepo packages use `verbatimModuleSyntax: true` to prevent unused type imports from leaking into production bundles.

---
