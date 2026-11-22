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
   * Dynamically resolves applications from the filesystem or an optional root [`projects.json`](../../projects.json).

---

## ⌨️ Interactive Terminal Hotkeys

While running `run-dev.py`, the supervisor listens for single keypresses in real-time:

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
3. Project Directory .env      (Service-Specific Defaults)
      ↓
4. Project Directory .env.local (Highest Priority Overrides)
```

* **Variable Expansion**: Supports `${VAR}` and `${VAR:-default}` syntax.
* **Child Process Injection**: Injects directly into child process environments without mutating the host OS environment.
* **Developer Flags**: Automatically sets `PYTHONUNBUFFERED=1` and `FORCE_COLOR=1` for immediate, stylized terminal output.

---

## 📦 Package Architecture

```text
packages/runner/
├── package.json              # NPM package manifest (@workspace/runner)
├── pyproject.toml            # Python PEP 621 manifest (workspace-runner)
├── setup.py                  # Standard setuptools configuration
├── README.md                 # This documentation file
│
├── bin/                      # 🚀 Executable CLI Launchers
│   ├── run-dev.py            # Dual-supervisor launcher (Frontend + Backend + Hotkeys)
│   ├── run-frontend.py       # Standalone client dev server launcher
│   └── run-backend.py        # Standalone backend microservice launcher
│
└── workspace_runner/         # 🐍 Core Python Module
    ├── __init__.py           # Public exports
    ├── env.py                # Cascading .env loader & secret redactor
    ├── registry.py           # Dynamic project discovery & config loader
    ├── stats.py              # Process metrics & ASCII table formatter
    └── supervisor.py         # Multi-platform supervisor, healthcheck & hotkey engine
```

---

## 📥 Installation

In Python, install in editable mode within your virtual environment:

```bash
pip install -e packages/runner
```

Or via root workspace script:

```bash
npm run install:python
```

---

## 🚀 CLI Usage Guide

All CLI entrypoints are located in `packages/runner/bin/` and can be invoked from anywhere in the monorepo:

### 1. Fullstack Dual-Supervisor (`run-dev.py`)

Launches frontend and backend concurrently with interactive hotkeys and active healthcheck:

```bash
# Auto-detects current project directory (or first project in projects.json)
python packages/runner/bin/run-dev.py --kill-port

# Specify a target project by name
python packages/runner/bin/run-dev.py --project apexmind-ai --kill-port

# Override ports on the fly
python packages/runner/bin/run-dev.py --project apexmind-ai --frontend-port 5185 --backend-port 8010 --kill-port
```

### 2. Standalone Frontend Runner (`run-frontend.py`)

Launches only the client dev server:

```bash
python packages/runner/bin/run-frontend.py --project <project-name> --kill-port
```

### 3. Standalone Backend Runner (`run-backend.py`)

Launches only the backend REST/WebSocket microservice:

```bash
python packages/runner/bin/run-backend.py --project <project-name> --kill-port
```

### 4. Via Root npm Scripts

```bash
npm run dev               # Runs run-dev.py with --kill-port
npm run dev:all           # Launches all projects concurrently
npm run dev:apexmind      # Launches apexmind-ai fullstack
npm run frontend          # Standalone client dev server
npm run backend           # Standalone API server
```

---

## 🔒 Enterprise Standards Compliance

* **Zero Personal Information**: Contains no developer names, personal emails, or usernames.
* **Zero `sys.path` Manipulation**: Relies strictly on standard editable Python environment resolution.
* **Non-Blocking Hotkeys**: Uses asynchronous threads and auto-disables in non-interactive CI/CD pipelines.
