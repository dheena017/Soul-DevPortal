# Shared Packages Architecture — The Golden Architectural Invariants & Rules

> **Scope**: Monorepo Workspace Architectural Rules & Engineering Invariants  
> **Applies to**: `@workspace/config`, `@workspace/logger`, `@workspace/runner`, and all shared packages

```
                    STRICT 2-TIER PACKAGE ARCHITECTURE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         PUBLIC EXTERNAL FACADE                              │
 │   • TypeScript Facade: packages/<pkg>/index.ts                              │
 │   • Python Facade:     packages/<pkg>/__init__.py                           │
 │   • Re-exports public classes, helpers, and types with clean signatures     │
 └─────────────────────────────────────────────────────────────────────────────┘
                                  │ (Strict Boundary)
                                  ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                         INTERNAL IMPLEMENTATION                             │
 │   • TypeScript Engine: packages/<pkg>/src/**/*.ts                           │
 │   • Python Engine:     packages/<pkg>/_internal/**/*.py                     │
 │   • Internal mechanics, private helpers, formatters, and platform logic     │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## Part I: The 5 Golden Rules of Shared Packages

### 1. Strict 2-Tier Architecture
- Every shared package must strictly decouple its **Public External Facade** from its **Internal Implementation**.
- Consumers must import only from the root package facade (`from workspace_logger import get_logger` or `import { getLogger } from '@workspace/logger'`). Direct deep imports into internal files (e.g. `import ... from 'packages/logger/src/internals'`) are strictly forbidden.

### 2. Snake_case Identifiers for Python Engines
- All Python file names within package internals must use standard snake_case identifiers (e.g., `logger_engine.py`, `format_handlers.py`), **never** kebab-case (e.g., `logger-engine.py`).
- Kebab-cased filenames break standard Python module resolution, cause lint errors, and fail dynamic import inspection.

### 3. Zero Redundant Shims & Duplication
- Every package must have exactly one canonical implementation of any feature.
- Never introduce duplicate fallback wrapper shims or competing utility implementations. If an API evolves, refactor the canonical engine and export backward-compatible aliases from the facade.

### 4. Triple-Manifest Parity
- Packages supporting both Node.js and Python ecosystems must maintain strict metadata, versioning, and name synchronization across three manifest files:
  1. `package.json` (NPM workspace manifest)
  2. `pyproject.toml` (Modern PEP 517/621 build specification)
  3. `setup.py` (Legacy and editable `pip install -e` compatibility)

### 5. Mandatory Isolated Verification Suite
- A shared package must never rely on downstream projects to test its functionality.
- Every package must contain an isolated test suite (`tests/` directory) with automated tests verifying imports, facade exports, masking behavior, and edge cases before publishing or linking.

---

## Part II: Inviolable Package Engineering Standards

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
Every package must include automated tests in `tests/`:
* `test_internal.py`: Tests internal engines directly.
* `test_external.py`: Tests public facade re-exports and CLI runners.
* Both must pass with zero warnings before any commit.
