# Shared Packages Philosophy & The 5 Golden Rules

Shared packages in `Soul-DevPortal-Packages/` provide shared infrastructure, unified telemetry, process orchestration, and styling presets across all monorepo applications. They operate under a strict, disciplined architectural contract.

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

## The 5 Golden Rules of Shared Packages

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
