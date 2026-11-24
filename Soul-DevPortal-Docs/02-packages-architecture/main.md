# Shared Packages Architecture — Master Technical Blueprint & Guide

> **Scope**: Monorepo Shared Libraries (`@workspace/*`) & Cross-Runtime Tooling  
> **Applies to**: `@workspace/config`, `@workspace/logger`, `@workspace/runner`, and all shared packages

---

# Shared Packages Architecture & Development

All shared functionality across the monorepo is housed in `Soul-DevPortal-Packages/` and consumed via npm workspaces (`@workspace/*`) and Python editable packages.

---

## 📦 Core Workspace Packages Overview

Rather than fragmented files, the core capabilities and usage guides for the three workspace packages are consolidated below:

### 1. `@workspace/config` (Centralized Configuration & Presets)
- **Purpose**: Unified polyglot configuration presets, design tokens, and canonical network port topology.
- **TypeScript Presets (`tsconfig.json`)**:
  ```json
  {
    "extends": "@workspace/config/tsconfig/react.json",
    "include": ["src"]
  }
  ```
- **Tailwind CSS Presets (`tailwind.config.js`)**:
  ```javascript
  import preset from '@workspace/config/tailwind/preset';
  export default {
    presets: [preset],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  };
  ```
- **Port Conflict Scanner**:
  ```bash
  python Soul-DevPortal-Packages/config/external/run_ports.py
  python Soul-DevPortal-Packages/config/external/run_ports.py --kill-conflicts
  ```

---

### 2. `@workspace/logger` (5-Column Telemetry & PII Masking)
- **Purpose**: Unified 5-column ANSI terminal logging, browser console bridge, Starlette/FastAPI request middleware, and automated secret masking.
- **Client / Browser**:
  ```typescript
  import { consoleLogger } from '@workspace/logger';
  consoleLogger.info('AUTH', 'User session restored');
  consoleLogger.action('STUDIO', 'Video generation started');
  ```
- **Vite HMR Bridge**:
  ```typescript
  import { workspaceLoggerPlugin } from '@workspace/logger/vite';
  export default { plugins: [workspaceLoggerPlugin()] };
  ```
- **Python FastAPI Middleware**:
  ```python
  from fastapi import FastAPI
  from external.middleware import init_app_logger
  app = FastAPI()
  init_app_logger(app, title="APEXMIND STUDIO", port=8000)
  ```

---

### 3. `@workspace/runner` (Process Supervision & Healthcheck Probing)
- **Purpose**: Micro-service discovery, dual-stack dependency auditing, active TCP healthcheck polling, and process supervision with Windows Job Objects and Linux process groups.
- **Key Capabilities**:
  - Kernel-level sandboxing (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` on Windows; `os.setsid` on Linux).
  - Sub-second active TCP/HTTP readiness probing.
  - Interactive terminal hotkeys (`[r]` restart backend, `[f]` restart frontend, `[p]` process stats, `[c]` clear screen, `[q]` quit).
- **Execution Runbook**:
  ```bash
  # Fullstack dev runner with automatic port conflict resolution
  python Soul-DevPortal-Packages/runner/external/run_dev.py --project apexmind-ai --kill-port --open

  # Standalone service runners
  python Soul-DevPortal-Packages/runner/external/run_client.py --project apexmind-ai --kill-port
  python Soul-DevPortal-Packages/runner/external/run_server.py --project apexmind-ai --kill-port
  ```

---

## 🏛️ Packages Layout & Directory Architecture

All shared packages in `Soul-DevPortal-Packages` strictly adhere to the standardized **Packages Layout Architecture**:

```text
Soul-DevPortal-Packages/
├── config/                            # Enterprise shared configuration & port topology
│   ├── package.json                   # NPM manifest with subpath exports
│   ├── pyproject.toml                 # PEP 621 Python manifest
│   ├── setup.py                       # Legacy setuptools build compatibility
│   ├── README.md                      # Package documentation
│   ├── index.js                       # JavaScript/TypeScript design tokens & Tailwind preset
│   ├── internal/                      # Tier 1: Core engines (ports, tokens, env)
│   ├── external/                      # Tier 2: Public facade, run_ports.py & presets/
│   │   └── presets/                   # Presets for tsconfig, tailwind, prettier, eslint, python
│   └── tests/                         # Tier 3: Verification suite (ports, internal, external)
│
├── logger/                            # Universal 5-column logging & telemetry
│   ├── package.json
│   ├── pyproject.toml
│   ├── setup.py
│   ├── README.md
│   ├── tsconfig.json
│   ├── client/                        # TypeScript browser logger & Vite HMR bridge
│   ├── internal/                      # Tier 1: Core ANSI formatters, sanitizer, box renderer
│   ├── external/                      # Tier 2: Public server_logger, middleware, banners, ai/db
│   └── tests/                         # Tier 3: Unit tests (test_internal.py, test_external.py)
│
└── runner/                            # High-performance process supervision & hotkeys
    ├── package.json
    ├── pyproject.toml
    ├── setup.py
    ├── README.md
    ├── internal/                      # Tier 1: Supervisor, controller, sandboxing, ports, healthcheck
    ├── external/                      # Tier 2: Public CLI runners (run_dev.py, run_server.py, etc.)
    └── tests/                         # Tier 3: Unit tests (test_registry.py, test_supervisor.py)
```

---

## 🛠️ Step-by-Step Package Authoring Guide

Follow this standard procedure when creating any new shared library in `Soul-DevPortal-Packages/`:

### 1. Name the Package

* TypeScript / NPM: `@workspace/<name>`
* Python / PyPI: `workspace-<name>` (module: `workspace_<name>`)

### 2. Scaffold the 2-Tier Directories

```text
Soul-DevPortal-Packages/<name>/
├── internal/
│   └── __init__.py
├── external/
│   └── __init__.py
└── tests/
```

### 3. Add Internal Implementation

All core engines and private machinery live inside `internal/`:

```python
# internal/core.py
def private_helper():
    return 'internal core logic'
```

### 4. Add Public External Facade

The public interface exposes clean, documented functions with `__all__`:

```python
# external/__init__.py
from internal.core import private_helper

__all__ = ['public_service']

def public_service():
    return private_helper()
```

### 5. Add Manifests (`package.json`, `pyproject.toml`, `setup.py`)

Add `package.json`:

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

Add `pyproject.toml`:

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

[tool.setuptools.package-data]
"*" = ["py.typed", "*.pyi"]
```

Add `setup.py`:

```python
from setuptools import setup, find_packages
setup(name="workspace-<name>", version="1.0.0", packages=find_packages())
```

### 6. Register and Verify

```powershell
npm install
pip install -e Soul-DevPortal-Packages/<name>
python Soul-DevPortal-Packages/<name>/tests/test_external.py
```

---

## 🧪 Package Verification Suite & Manifest Parity

Run the complete test suite across all shared packages to verify manifest parity, subpath exports, and isolated imports:

```powershell
python config/tests/test_ports_integrity.py; python config/tests/test_internal.py; python config/tests/test_external.py; python runner/tests/test_registry.py; python runner/tests/test_visual_len.py; python runner/tests/test_supervisor.py; python logger/tests/test_internal.py; python logger/tests/test_external.py; npx tsc --noEmit -p logger/tsconfig.json
```
