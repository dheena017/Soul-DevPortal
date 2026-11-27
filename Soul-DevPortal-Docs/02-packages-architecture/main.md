# Shared Packages Architecture — Master Technical Blueprint & Guide

> **Scope**: Monorepo Shared Libraries (`@workspace/*`) & Cross-Runtime Polyglot Tooling  
> **Applies to**: `@workspace/config`, `@workspace/logger`, `@workspace/runner`, and all future shared packages  
> **Status**: `AUTHORITATIVE ARCHITECTURE BLUEPRINT`

---

## Architecture Topology Overview

The Soul Monorepo centralizes all reusable functionality into `Soul-DevPortal-Packages/`. These packages are consumed polyglot across both TypeScript (via NPM workspaces) and Python (via pip editable packages):

```mermaid
graph TD
    subgraph Root["Soul Monorepo Root"]
        Packages["Soul-DevPortal-Packages/"]
        Projects["Soul-DevPortal-Projects/ (9 Micro-Apps)"]
        DevPortal["DevPortal Hub (:5181 / :8008)"]
    end

    subgraph CorePackages["Shared Core Packages"]
        Config["@workspace/config<br/>• Central Ports Matrix<br/>• Tailwind v4 Presets<br/>• TSConfig Bases"]
        Logger["@workspace/logger<br/>• 5-Column ANSI Output<br/>• PII & Secret Masking<br/>• Client Console Bridge<br/>• Vite HMR Banner"]
        Runner["@workspace/runner<br/>• Dual-Stack Supervisor<br/>• Windows Job Objects<br/>• Active Socket Prober<br/>• Interactive Hotkeys"]
    end

    Packages --> Config & Logger & Runner
    Config & Logger & Runner --> Projects
    Config & Logger & Runner --> DevPortal
```

---

## 1. Deep Dive: The Three Core Workspace Packages

### 1.1 `@workspace/config` (Centralized Configuration & Presets)

#### Core Purpose
`@workspace/config` serves as the authoritative single source of truth for:
- Workspace port allocations and network topology.
- Standardized TypeScript compiler configurations (`tsconfig.json`).
- Tailwind CSS v4 design tokens and color scales.
- Code style rules (`prettier`, `eslint`, `pyproject.toml`).

#### Module Architecture & Exports
```text
Soul-DevPortal-Packages/config/
├── package.json                   # NPM manifest with subpath exports
├── pyproject.toml                 # PEP 621 Python manifest
├── setup.py                       # Legacy setuptools build compatibility
├── README.md                      # Package documentation
├── index.js                       # JavaScript/TypeScript design tokens & Tailwind preset
├── internal/                      # Tier 1: Core engines (ports, tokens, env)
│   ├── ports_integrity.py        # Port matrix verification and JSON sync
│   └── token_definitions.ts       # Shared theme variables
├── external/                      # Tier 2: Public facade, run_ports.py & presets/
│   ├── run_ports.py               # Active TCP port conflict auditor CLI
│   └── presets/                   # Presets for tsconfig, tailwind, prettier, eslint
│       ├── tsconfig/react.json    # React 19 + Vite tsconfig preset
│       ├── tsconfig/node.json     # Node.js backend tsconfig preset
│       └── tailwind/preset.js     # Shared design system theme preset
└── tests/                         # Tier 3: Verification suite
    ├── test_ports_integrity.py    # Automated port matrix test
    ├── test_internal.py           # Unit tests for internal logic
    └── test_external.py           # Unit tests for public CLI runners
```

#### Consumption Patterns

**A. TypeScript Configuration (`client/tsconfig.json`)**:
```json
{
  "extends": "@workspace/config/tsconfig/react.json",
  "include": ["src"]
}
```

**B. Tailwind CSS v4 Integration (`client/src/index.css`)**:
```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #3b82f6;
  --color-surface-obsidian: #09090c;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**C. Port Conflict Scanner CLI**:
```bash
# Scan all monorepo ports for collisions or zombie processes
python Soul-DevPortal-Packages/config/external/run_ports.py

# Automatically terminate rogue processes holding workspace ports
python Soul-DevPortal-Packages/config/external/run_ports.py --kill-conflicts
```

---

### 1.2 `@workspace/logger` (5-Column Telemetry & PII Masking)

#### Core Purpose
`@workspace/logger` provides enterprise-grade structured observability across all client and server runtimes:
- Deterministic 5-column ANSI terminal logging.
- Automatic regular-expression masking of secrets, tokens, and passwords.
- Browser console logging bridge with colored tags and expandable JSON payloads.
- Vite plugin for injecting development server startup banners and HMR telemetry.
- FastAPI / Starlette request logging middleware with execution latency measurement.

#### Module Architecture & Exports
```text
Soul-DevPortal-Packages/logger/
├── package.json
├── pyproject.toml
├── setup.py
├── README.md
├── tsconfig.json
├── client/                        # TypeScript browser logger & Vite HMR bridge
│   ├── index.ts                   # Public browser consoleLogger export
│   ├── vite-plugin.ts             # Workspace dev server banner Vite plugin
│   └── types.ts                   # LogLevel and LoggerOptions interfaces
├── internal/                      # Tier 1: Core ANSI formatters, sanitizer, box renderer
│   ├── sanitizer.py               # Automated PII & secret regex masking engine
│   ├── formatter.py               # 5-column ANSI layout generator
│   └── box_renderer.py            # Unicode CLI banner frame renderer
├── external/                      # Tier 2: Public server_logger, middleware, banners
│   ├── __init__.py                # Root facade exporting get_logger, server_logger
│   ├── middleware.py              # FastAPI / Starlette logging middleware
│   └── server_logger.py           # Universal server-side logging class
└── tests/                         # Tier 3: Unit tests
    ├── test_internal.py           # Tests sanitizer and formatters
    └── test_external.py           # Tests middleware and facade re-exports
```

#### Consumption Patterns

**A. Browser & React Applications (`client/src/App.tsx`)**:
```typescript
import { consoleLogger } from '@workspace/logger';

// Colored structured logging in browser console
consoleLogger.info('AUTH', 'User session established', { userId: 'usr_9281' });
consoleLogger.action('CART', 'Item added to checkout', { itemsCount: 3 });
consoleLogger.error('API', 'Payment gateway timeout', new Error('Gateway Timeout 504'));
```

**B. Vite HMR Dev Server Banner (`client/vite.config.ts`)**:
```typescript
import { defineConfig } from 'vite';
import { workspaceLoggerPlugin } from '@workspace/logger/vite-plugin';

export default defineConfig({
  plugins: [
    workspaceLoggerPlugin({
      serviceName: 'APEXMIND STUDIO AI',
      version: '1.0.0',
      port: 5173,
    }),
  ],
});
```

**C. Python FastAPI Backend (`server/main.py`)**:
```python
from fastapi import FastAPI
from logger.external import get_logger
from logger.external.middleware import init_app_logger

app = FastAPI(title="ApexMind Studio AI")
init_app_logger(app, title="APEXMIND STUDIO", port=8000)

logger = get_logger("API")

@app.get("/api/v1/sessions")
async def get_sessions():
    logger.info("Retrieved active user sessions", extra={"count": 14})
    return {"sessions": []}
```

---

### 1.3 `@workspace/runner` (Process Supervision & Healthcheck Probing)

#### Core Purpose
`@workspace/runner` provides atomic process management, port conflict resolution, and active readiness verification across all 9 micro-applications:
- **Kernel-Level Sandboxing**: Windows Job Objects (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`) and POSIX process groups (`os.setsid`) to guarantee 100% atomic child process cleanup on exit.
- **Sub-Second Active Socket Probing**: Non-blocking TCP socket connect before reporting service status.
- **Interactive Terminal Hotkeys**:
  - `[r]`: Restart backend server.
  - `[f]`: Restart frontend client.
  - `[p]`: Display live process CPU & memory telemetry.
  - `[c]`: Clear terminal console.
  - `[q]`: Cleanly exit all child processes and release ports.

#### Module Architecture & Exports
```text
Soul-DevPortal-Packages/runner/
├── package.json
├── pyproject.toml
├── setup.py
├── README.md
├── internal/                      # Tier 1: Supervisor, controller, sandboxing, ports
│   ├── supervisor.py              # Master multi-process coordinator
│   ├── job_objects.py             # Windows Job Object kernel sandboxing
│   ├── socket_prober.py           # Non-blocking TCP readiness prober
│   └── hotkeys.py                 # Interactive terminal hotkey listener
├── external/                      # Tier 2: Public CLI runners
│   ├── run_dev.py                 # Fullstack dev runner with port-kill
│   ├── run_client.py              # Standalone frontend client launcher
│   ├── run_server.py              # Standalone backend server launcher
│   └── run_ports.py               # Port scanner CLI
└── tests/                         # Tier 3: Unit tests
    ├── test_registry.py           # Projects registry validator
    └── test_supervisor.py         # Supervisor lifecycle tests
```

#### Consumption Patterns

**A. Fullstack Development with Automatic Port Cleanup**:
```bash
# Launch both client and server concurrently with automatic port conflict resolution
python Soul-DevPortal-Packages/runner/external/run_dev.py --project apexmind-ai --kill-port --open

# Or via monorepo npm scripts:
npm run dev:apexmind
```

**B. Launching All 9 Applications Concurrently**:
```bash
# Boots the full monorepo stack with managed supervisor
npx @workspace/runner all
```

---

## 2. Standardized Packages Layout & Directory Architecture

Every shared library in `Soul-DevPortal-Packages/` strictly implements the 3-Tier standard:

```text
Soul-DevPortal-Packages/<package-name>/
├── package.json                   # NPM manifest with subpath exports
├── pyproject.toml                 # Modern PEP 517/621 build specification
├── setup.py                       # Legacy setuptools build compatibility
├── README.md                      # Architectural overview & usage guide
├── internal/                      # Tier 1: Private Engine (Consumers must NOT import)
│   ├── __init__.py                # Package initialization
│   ├── core.py                    # Core algorithms and business logic (snake_case)
│   └── formatters.py              # Data formatting helpers
├── external/                      # Tier 2: Public External Facade
│   ├── __init__.py                # Explicit __all__ facade exports
│   └── cli.py                     # Executable command-line runner
└── tests/                         # Tier 3: Isolated Verification Suite
    ├── test_internal.py           # Unit tests targeting internal core
    └── test_external.py           # Integration tests targeting public facade
```

---

## 3. Step-by-Step Package Authoring Playbook

Follow this 6-step runbook when creating a new shared library in `Soul-DevPortal-Packages/`:

### Step 1: Package Naming Conventions
* **NPM / TypeScript Scope**: `@workspace/<name>` (lowercase kebab-case).
* **Python / PyPI Scope**: `workspace-<name>` (module name: `workspace_<name>`).

### Step 2: Scaffold 3-Tier Directories
```bash
mkdir -p Soul-DevPortal-Packages/<name>/internal
mkdir -p Soul-DevPortal-Packages/<name>/external
mkdir -p Soul-DevPortal-Packages/<name>/tests
touch Soul-DevPortal-Packages/<name>/internal/__init__.py
touch Soul-DevPortal-Packages/<name>/external/__init__.py
```

### Step 3: Implement Private Core (`internal/`)
```python
# Soul-DevPortal-Packages/<name>/internal/engine.py
def calculate_metric(data: list[float]) -> float:
    if not data:
        return 0.0
    return sum(data) / len(data)
```

### Step 4: Expose Public Facade (`external/__init__.py`)
```python
# Soul-DevPortal-Packages/<name>/external/__init__.py
from internal.engine import calculate_metric

__all__ = ["calculate_metric"]
```

### Step 5: Author Synchronized Manifests

**A. `package.json`**:
```json
{
  "name": "@workspace/<name>",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js"
  }
}
```

**B. `pyproject.toml`**:
```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "workspace-<name>"
version = "1.0.0"
description = "Shared package in Soul monorepo"
authors = [{ name = "Soul Team" }]

[tool.setuptools.packages.find]
where = ["."]
include = ["internal*", "external*"]
```

**C. `setup.py`**:
```python
from setuptools import setup, find_packages
setup(name="workspace-<name>", version="1.0.0", packages=find_packages())
```

### Step 6: Verify Isolated Test Suite
```bash
python Soul-DevPortal-Packages/<name>/tests/test_internal.py
python Soul-DevPortal-Packages/<name>/tests/test_external.py
```

### Step 7: Add Live Runtime Preview (`Package Preview` Tab)
Register a live preview section for the new package folder in `src/features/packages/detail/PackagePreviousTab.tsx` so developers can inspect how the package renders and behaves in real workspace projects directly inside the **Package Preview** tab of `PackageDetailView`.

---

## 4. DevPortal Package Inspector Tabs

Every package in `Soul-DevPortal-Packages/` is rendered in `PackageDetailView` with 5 canonical tabs:

| Tab | Component | Purpose |
| :--- | :--- | :--- |
| **Documentation** | `PackageDocsTab.tsx` | Parsed `README.md` guides and architecture notes |
| **API & Exports** | `PackageApiTab.tsx` | TypeScript & Python exported symbols and signatures |
| **Code Generator** | `PackagePlaygroundTab.tsx` | Copy-ready import snippets and usage boilerplate |
| **Manifest & Metadata** | `PackageManifestTab.tsx` | `package.json`, `pyproject.toml`, scripts, and dependencies |
| **Package Preview (`LIVE`)** | `PackagePreviousTab.tsx` | Live interactive runtime preview showing how the package looks in actual projects |

---

## 5. Automated Verification Suite & Manifest Parity

To ensure zero drift across all shared packages, execute the complete verification suite:

```powershell
python Soul-DevPortal-Packages/config/tests/test_ports_integrity.py; `
python Soul-DevPortal-Packages/config/tests/test_internal.py; `
python Soul-DevPortal-Packages/config/tests/test_external.py; `
python Soul-DevPortal-Packages/runner/tests/test_registry.py; `
python Soul-DevPortal-Packages/runner/tests/test_supervisor.py; `
python Soul-DevPortal-Packages/logger/tests/test_internal.py; `
python Soul-DevPortal-Packages/logger/tests/test_external.py; `
npx tsc --noEmit -p Soul-DevPortal-Packages/logger/tsconfig.json
```
