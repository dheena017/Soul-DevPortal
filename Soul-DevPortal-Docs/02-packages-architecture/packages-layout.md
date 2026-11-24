# Packages Layout & Directory Architecture Standards

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

## Architectural Rules & Standards
All packages in `Soul-DevPortal-Packages` must strictly adhere to the following rules:

### Rule 1: Strict 2-Tier Separation

* **`internal/`**: Private engine machinery. External consumers should NOT import directly from `internal/`.
* **`external/`**: Stable public interfaces and CLI runners with explicit `__all__` lists.

### Rule 2: Valid Python File Identifiers (Snake Case)

* **MANDATORY**: All Python files MUST use underscores (`_`), NEVER hyphens (`-`).
  * ✅ `run_dev.py`, `run_server.py`, `run_ports.py`, `run_build.py`
  * ❌ `run-dev.py`, `run-server.py`, `run-ports.py`, `run-build.py`
* Hyphenated filenames cause syntax errors on `import external.run-dev`. Snake-case allows dual usage as standalone scripts and importable modules.

### Rule 3: Zero Redundant Duplicate Shims

* Never create duplicate files or bare alias re-assignments (`alias = original`).
* One canonical source of truth per function, class, or script.

### Rule 4: Clean Imports & No Fallback Ladders

* Relative imports within `internal/`:

  ```python
  from .env import load_cascading_env
  from .installer import get_terminal_width
  ```

* **Zero nested `try...except ImportError` ladders**. Scripts resolve root deterministically:

  ```python
  import sys
  from pathlib import Path

  _pkg_root = Path(__file__).resolve().parent.parent
  if str(_pkg_root) in sys.path:
      sys.path.remove(str(_pkg_root))
  sys.path.insert(0, str(_pkg_root))
  ```

### Rule 5: `sys.path` Priority & Isolation

* An executable script in `external/` prepends its own package root at **index 0** of `sys.path`.
* Sibling packages (`logger`, `config`) are **appended** at the end:

  ```python
  _packages_root = _pkg_root.parent
  for _pkg in ("logger", "config"):
      _p = str(_packages_root / _pkg)
      if _p not in sys.path:
          sys.path.append(_p)
  ```

* Prevents sibling packages that both have an `internal/` directory from shadowing each other.

### Rule 6: Triple-Manifest Parity

Every package must maintain:

1. `package.json`: NPM package manifest, exports, `files` array, and `test` scripts.
2. `pyproject.toml`: PEP 621 metadata, `include = ["internal*", "external*"]`, and typing data.
3. `setup.py`: Standard setuptools setup for legacy editable pip support.
4. `README.md`: Architecture diagrams and usage guides.

### Rule 7: Mandatory Verification Suite

Every change must pass the test suite with 0 failures before landing:

```bash
python <package>/tests/test_internal.py
python <package>/tests/test_external.py
```

---
