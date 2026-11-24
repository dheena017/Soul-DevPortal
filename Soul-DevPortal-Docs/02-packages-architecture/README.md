# Shared Packages Architecture & Development

All shared functionality across the monorepo is housed in `Soul-DevPortal-Packages/` and consumed via npm workspaces (`@workspace/*`) and Python editable packages.

---

## 📚 Documents in this Section
1. [The 5 Golden Rules of Shared Packages](golden-rules.md) — Public facade barriers, snake_case internals, and verification standards.
2. [Packages Layout Architecture](packages-layout.md) — Mandatory package folder hierarchy, internal/external tier separation, and manifest parity.
3. [Package Authoring Guide](package-authoring-guide.md) — Complete walkthrough for authoring, registering, and exporting new packages.
4. [Package Verification](package-verification.md) — Test suites, subpath export verification, and triple-manifest parity.

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
