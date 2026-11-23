# @workspace/runner (workspace-runner)

> **Universal Process Supervisor, Port Resolver & Fullstack Dev Runner**  
> Enterprise multi-process orchestration engine with cross-platform kernel sandboxing, active TCP/HTTP healthcheck probing, cascading `.env` loading, and real-time interactive terminal hotkeys.

---

## 🌟 Key Capabilities

1. **Cross-Platform Kernel Sandboxing**:
   * **Windows**: Binds processes to Windows Job Objects (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`).
   * **Linux**: Spawns isolated process groups (`os.setsid`) and registers Linux kernel death signals (`PR_SET_PDEATHSIG`) so children immediately terminate if the runner exits.
   * **macOS / POSIX**: Manages session process groups (`os.killpg`) to eliminate lingering zombie processes.
2. **Active TCP / HTTP Healthcheck Probing**:
   * Replaced static startup delays with active socket polling. Probes backend ports and reports instant sub-second connection times (`connected in 184ms`) before launching the frontend.
3. **Interactive Terminal Hotkeys (Control Plane)**:
   * Control running servers directly from your terminal using non-blocking keyboard hotkeys without closing or restarting sessions.
4. **Cascading `.env` Hierarchy**:
   * Automatically discovers and cascades `.env` and `.env.local` files across monorepo root and project subdirectories, resolving variable expansions and redacting sensitive credentials.
5. **Deterministic Port Protection (`--kill-port`)**:
   * Cross-platform port occupancy scanner using Windows `netstat`/`taskkill` and POSIX `lsof`/`fuser` to free bound ports cleanly.
6. **Dynamic Zero-Hardcoding Project Discovery**:
   * Dynamically resolves applications from the filesystem or an optional root `projects.json`.

---

## ⌨️ Interactive Terminal Hotkeys

While running `run_dev.py`, the supervisor listens for single keypresses in real-time:

```text
 [r] Restart BE   [f] Restart FE   [a] Reload All   [o] Open UI   [b] API Docs
 [c] Clear        [p] Stats        [e] Env Info     [h] Help      [q] Quit
────────────────────────────────────────────────────────────────────────────────
```

| Key | Action | Description |
| :---: | :--- | :--- |
| **`r`** | **Restart Backend** | Gracefully terminates backend process group, frees port, re-spawns, and waits for healthcheck without touching the frontend. |
| **`f`** | **Restart Frontend** | Re-launches client Vite or Next.js dev server cleanly. |
| **`a`** | **Reload All** | Fullstack restart in dependency order (Backend ➔ Healthcheck ➔ Frontend). |
| **`o`** | **Open UI in Browser** | Launches `http://localhost:<frontend_port>` in your default browser. |
| **`b`** | **Open API Swagger Docs** | Launches backend API docs (`http://localhost:<backend_port>/docs`) in your browser. |
| **`c`** | **Clear Screen & Redraw** | Clears terminal scrollback and redraws the header banner and status bar. |
| **`p`** | **Live Process Stats** | Displays an ASCII table of active PIDs, port bindings, memory RSS, and uptimes. |
| **`e`** | **Environment Summary** | Displays loaded `.env` hierarchy and variable count with secrets safely redacted. |
| **`h`** | **Toggle Help** | Renders the interactive hotkey reference overlay box. |
| **`q`** | **Clean Shutdown** | Gracefully terminates all process groups and exits immediately (or press `Ctrl+C`). |

---

## 🌲 Cascading `.env` Hierarchy

The runner merges environment variables in cascading priority order:

```text
1. Monorepo Root .env          (Lowest Priority Defaults)
      ↓
2. Monorepo Root .env.local    (Root Developer Overrides)
      ↓
3. Project Directory .env      (Application Defaults)
      ↓
4. Project Directory .env.local (Highest Priority Application Overrides)
```

---

## 📦 Architecture & Directory Layout

```text
Soul-DevPortal-Packages/runner/
├── package.json               # NPM package manifest with CLI scripts
├── pyproject.toml             # Python package definition (workspace-runner)
├── setup.py                   # Standard setuptools configuration
├── README.md                  # Comprehensive architecture & usage documentation
│
├── internal/                  # Core Internal Python Supervision Engines
│   ├── __init__.py            # Internal exports
│   ├── supervisor.py          # Unified process supervisor orchestrator
│   ├── controller.py          # ProcessController lifecycle manager & threads
│   ├── sandboxing.py          # Windows Job Object & POSIX process group sandboxing
│   ├── ports.py               # TCP port conflict checking & process termination
│   ├── healthcheck.py         # Sub-second active HTTP/TCP socket probing
│   ├── formatting.py          # Universal 5-column ANSI terminal formatting
│   ├── dashboard.py           # Fullstack Unicode HUD status dashboards
│   ├── stats.py               # Real-time memory (RSS) and process metrics table
│   ├── installer.py           # Dual-stack npm/pip dependency installer engine
│   ├── builder.py             # Frontend production compilation & asset auditor
│   ├── linter.py              # ESLint, AST compiler & syntax linter engine
│   ├── typechecker.py         # TypeScript static type analysis engine
│   ├── registry.py            # Dynamic workspace root & project detection
│   └── env.py                 # Cascading .env hierarchy parser & interpolation
│
├── external/                  # Public CLI Launchers & Runners (Standard Python Modules)
│   ├── __init__.py            # Public module facade
│   ├── run_dev.py             # Fullstack Dual-Supervisor launcher
│   ├── run_client.py          # Standalone client dev server runner
│   ├── run_server.py          # Standalone server API runner
│   ├── run_install.py         # Dual-stack dependency installer runner
│   ├── run_typecheck.py       # TypeScript static type analysis runner
│   ├── run_lint.py            # Code quality & syntax linter runner
│   └── run_build.py           # Production asset compilation runner
│
└── tests/                     # Test Suite
    ├── test_registry.py       # Project detection & workspace resolution tests
    ├── test_visual_len.py     # ANSI visual column length padding tests
    └── test_supervisor.py     # Modular supervision, sandboxing & ports tests
```

---

## 🚀 Quick Usage Guide

All CLI entrypoints are located in `external/` and can be invoked directly or via npm:

### 1. Fullstack Dual-Supervisor (`run_dev.py`)

Launches client and server concurrently with interactive hotkeys, active healthcheck, and optional browser auto-open:

```bash
# Auto-detects current project directory (or first project in projects.json)
python external/run_dev.py --kill-port

# Specify a target project by name and auto-open client in browser
python external/run_dev.py --project apexmind-ai --kill-port --open

# Override client and server ports on the fly
python external/run_dev.py --project apexmind-ai --client-port 5185 --server-port 8010 --kill-port
```

### 2. Standalone Client Runner (`run_client.py`)

```bash
python external/run_client.py --project <project-name> --kill-port --open
```

### 3. Standalone Server Runner (`run_server.py`)

```bash
python external/run_server.py --project <project-name> --kill-port --open-docs
```

### 4. Dual-Stack Dependency Installer (`run_install.py`)

```bash
# Audit dependencies without installing
python external/run_install.py --check-only

# Fast concurrent parallel installation
python external/run_install.py --project apexmind-ai --parallel
```

### 5. Via NPM Scripts

```bash
npm run dev               # Runs run_dev.py with --kill-port
npm run dev:client        # Standalone client dev server
npm run dev:server        # Standalone server API
npm run test              # Runs the complete runner test suite
```

---

## 🔒 Enterprise Standards Compliance

* **Zero Personal Information**: Contains no developer names, personal emails, or usernames.
* **Standard Python Modules**: All CLI tools use standard snake_case naming without hyphens.
* **Non-Blocking Hotkeys**: Uses asynchronous threads and auto-disables in non-interactive CI/CD pipelines.
