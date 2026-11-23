# Soul Monorepo Packages (`Soul-DevPortal-Packages`)

> **Enterprise Shared Polyglot Infrastructure**  
> Centralized configuration presets, universal 5-column logging & telemetry, and high-performance process supervision for all micro-applications in the Soul DevPortal workspace.

---

## 📦 Packages Overview

The `Soul-DevPortal-Packages` directory houses the three foundational packages that power every application, frontend, backend, and CLI runner across the monorepo:

| Package | NPM Scope | Python Distribution | Description |
| :--- | :--- | :--- | :--- |
| [**`config`**](./config/README.md) | `@workspace/config` | `workspace-config` | Centralized TypeScript compiler presets, Tailwind CSS v4 design system, Prettier/ESLint configs, and canonical network port topology. |
| [**`logger`**](./logger/README.md) | `@workspace/logger` | `workspace-logger` | Universal 5-column ANSI terminal logging, Vite HMR browser bridge, FastAPI request middleware, AI telemetry, and Unicode banners. |
| [**`runner`**](./runner/README.md) | `@workspace/runner` | `workspace-runner` | High-performance process supervision with Windows Job Objects, Linux process groups, active HTTP/TCP socket healthchecks, and interactive hotkeys. |

---

## 🏛️ Architectural Pattern: Strict 2-Tier Architecture

All packages in this directory adhere to a uniform **2-tier modular architecture**:

```text
<package>/
├── internal/                  # 1. Core Engines (Private Implementation)
│   ├── __init__.py            # Internal exports
│   └── *.py                   # Single-responsibility internal modules
│
├── external/                  # 2. Public Interface (Consumers & CLI)
│   ├── __init__.py            # Public unified facade with explicit __all__
│   └── run_*.py               # Standalone CLI tools & module entrypoints
│
├── tests/                     # 3. Verification Suite
│   ├── test_internal.py       # Unit tests for internal mechanics
│   └── test_external.py       # Parity & export tests for public APIs
│
├── package.json               # NPM workspace manifest (subpath exports, files)
├── pyproject.toml             # Python PEP 621 manifest (setuptools discovery)
├── setup.py                   # Legacy setuptools build compatibility
└── README.md                  # Comprehensive documentation & API guide
```

---

## 📜 Architectural Rules & Guidelines

For detailed design principles, file naming standards, and coding rules, see:
👉 [**`RULES.md`**](./RULES.md)

### Quick Rule Summary:
1. **Strict 2-Tier Separation**: Private logic stays in `internal/`; public APIs and CLI tools live in `external/`.
2. **Standard Python File Identifiers**: All Python files use snake_case (`run_dev.py`, `run_ports.py`). No hyphens (`-`) in `.py` filenames.
3. **No Redundant Aliases**: Canonical functions only. No duplicate functions or bare variable assignments (`alias = original`).
4. **Clean Imports**: No nested `try...except ImportError` ladders. Sibling internal imports use relative syntax (`from .env import ...`).
5. **Manifest Parity**: Every package maintains matching `package.json`, `pyproject.toml`, `setup.py`, and `README.md`.
6. **Zero-Warning Tests**: Every change must pass unit tests in `tests/` before landing.

---

## 🚀 Getting Started

### Python Development (Editable Install)

To install all workspace packages in editable mode:

```bash
pip install -e ./config
pip install -e ./logger
pip install -e ./runner
```

### TypeScript / JavaScript (NPM Workspaces)

From the monorepo root:

```bash
npm install
```

---

## 🧪 Monorepo Package Test Suite

Run tests across all three packages in a single command:

```bash
python config/tests/test_ports_integrity.py && python config/tests/test_internal.py && python config/tests/test_external.py && python runner/tests/test_registry.py && python runner/tests/test_visual_len.py && python runner/tests/test_supervisor.py && python logger/tests/test_internal.py && python logger/tests/test_external.py
```
