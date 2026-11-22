# Shared Packages Design Guide

> **Dual-Runtime Architecture Blueprint (@workspace/*)**  
> Comprehensive specification for designing, building, and distributing shared TypeScript/JavaScript packages and Python distributions.

---

This directory contains the shared packages used across the monorepo. Packages provide one of three kinds of shared functionality:

1. Reusable TypeScript and JavaScript code.
2. Reusable Python modules.
3. Shared configuration presets.

The workspace currently contains three packages:

| Package | TypeScript/JavaScript name | Python distribution | Python module |
| --- | --- | --- | --- |
| [`logger`](./packages/logger/) | `@workspace/logger` | `workspace-logger` | `workspace_logger` |
| [`runner`](./packages/runner/) | `@workspace/runner` | `workspace-runner` | `workspace_runner` |
| [`config`](./packages/config/) | `@workspace/config` | None | None |

This is the authoritative development guide for the packages directory. Package-specific usage is documented in each package's [logger README](./packages/logger/README.md), [runner README](./packages/runner/README.md), and [config README](./packages/config/README.md).

## Requirements

Install the following tools before working with the packages:

- Node.js and npm
- Python 3.11 or newer
- A Python virtual environment
- Git

Commands in this guide are run from the monorepo root unless another directory is stated.

## Initial Setup

From the monorepo root, install both ecosystems:

```powershell
npm install
npm run install:python
```

`npm install` discovers the directories listed in the root `package.json` npm workspace configuration and links local packages.

`npm run install:python` installs the Python packages in editable mode:

```powershell
pip install -e packages/logger
pip install -e packages/runner
```

Editable installation lets Python import changes from the package source immediately. It should be run again after creating a new Python package or changing package metadata.

To install both ecosystems with one command:

```powershell
npm run install:packages
```

## Directory Structure

A polyglot package can contain both npm and Python manifests:

```text
packages/
├── logger/
│   ├── package.json
│   ├── pyproject.toml
│   ├── setup.py
│   ├── README.md
│   ├── src/
│   │   └── index.ts
│   └── workspace_logger/
│       ├── __init__.py
│       └── py.typed
│
├── runner/
│   ├── package.json
│   ├── pyproject.toml
│   ├── setup.py
│   ├── README.md
│   ├── bin/
│   └── workspace_runner/
│
└── config/
    ├── package.json
    ├── README.md
    ├── tsconfig/
    ├── tailwind/
    ├── prettier/
    ├── eslint/
    └── python/
```

Not every package needs every directory. For example, `config` is npm-only and does not require Python source.

## Package Catalog

### `@workspace/logger`

**Purpose:** Logging, terminal presentation, and HTTP request telemetry.

- Exposes TypeScript logging functions and a Vite plugin.
- Exposes Python formatters, banner helpers, process helpers, and FastAPI/Starlette middleware.
- Automatically masks sensitive values in client logs.
- Provides the 5-column terminal log format used across the workspace.

TypeScript:

```typescript
import { consoleLogger } from '@workspace/logger';

consoleLogger.info('AUTH', 'User session restored');
consoleLogger.action('STUDIO', 'Video generation started');
```

Vite:

```typescript
import { workspaceLoggerPlugin } from '@workspace/logger/vite';

export default {
  plugins: [workspaceLoggerPlugin()],
};
```

Python:

```python
from fastapi import FastAPI
from workspace_logger import init_app_logger

app = FastAPI()
init_app_logger(app, title="ORDER SERVICE", port=8005)
```

See [the logger package README](./packages/logger/README.md) for all exports and examples.

### `@workspace/runner`

**Purpose:** Discover projects and launch client and server development processes.

- Resolves projects from `projects.json`.
- Loads cascading `.env` and `.env.local` files.
- Frees occupied ports when `--kill-port` is used.
- Starts client and server processes concurrently.
- Provides interactive terminal controls.
- Cleans up child processes when the supervisor exits.

Run from the monorepo root:

```powershell
npm run dev:all
npm run dev:client
npm run dev:server
npm run dev:project -- --project=apexmind-ai
```

The Python entrypoints can also be called directly:

```powershell
python Soul-DevPortal-Packages/runner/bin/run-dev.py --project apexmind-ai --kill-port
python Soul-DevPortal-Packages/runner/bin/run-frontend.py --project apexmind-ai --kill-port
python Soul-DevPortal-Packages/runner/bin/run-backend.py --project apexmind-ai --kill-port
```

The runner depends on `workspace-logger` for banners and terminal presentation.

See [the runner package README](./packages/runner/README.md) for hotkeys, environment loading, process controls, and CLI options.

### `@workspace/config`

**Purpose:** Centralize build and code-quality configuration.

- TypeScript compiler presets
- Tailwind CSS design tokens and preset
- Prettier configuration
- ESLint presets
- Ruff and pytest configuration

React TypeScript project:

```json
{
  "extends": "@workspace/config/tsconfig/react.json",
  "include": ["src"]
}
```

Next.js project:

```json
{
  "extends": "@workspace/config/tsconfig/next.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

Tailwind:

```javascript
import preset from '@workspace/config/tailwind/preset';

export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
};
```

ESLint:

```javascript
import reactConfig from '@workspace/config/eslint/react';

export default [...reactConfig];
```

See [the config package README](./packages/config/README.md) for every available preset.

## Naming Rules

Use the same package slug everywhere:

| Artifact | Convention | Example |
| --- | --- | --- |
| Directory | Lowercase kebab-case | `packages/auth-session` |
| npm package | `@workspace/<slug>` | `@workspace/auth-session` |
| Python distribution | `workspace-<slug>` | `workspace-auth-session` |
| Python module | Snake-case | `workspace_auth_session` |

Do not mix singular and plural names. For example, `packages/auth` must be named `@workspace/auth` and `workspace-auth`, not `@workspace/authentication`.

## npm Package Standards

Every npm package must have a `package.json`.

Use subpath exports for consumers that need a focused entrypoint:

```json
{
  "name": "@workspace/example",
  "version": "1.0.0",
  "description": "Shared example utilities",
  "type": "module",
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "exports": {
    ".": {
      "types": "./src/index.ts",
      "import": "./src/index.ts",
      "default": "./src/index.ts"
    },
    "./feature": {
      "types": "./src/feature.ts",
      "import": "./src/feature.ts",
      "default": "./src/feature.ts"
    }
  },
  "files": [
    "src",
    "README.md"
  ],
  "license": "MIT"
}
```

Keep the package public API in `src/index.ts`. Do not force consumers to import deep internal files unless the package explicitly defines and documents a subpath export.

## Python Package Standards

Every Python package should include:

- `pyproject.toml` for PEP 621 metadata
- `setup.py` for compatibility with existing tooling
- `workspace_<slug>/__init__.py` for the public Python API
- `workspace_<slug>/py.typed` for PEP 561 type checking support
- `README.md` with install and usage instructions

Example `pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "workspace-example"
version = "1.0.0"
description = "Shared example utilities"
readme = "README.md"
requires-python = ">=3.11"
dependencies = []

[tool.setuptools.packages.find]
where = ["."]
include = ["workspace_example*"]

[tool.setuptools.package-data]
"*" = ["py.typed", "*.pyi"]
```

The public package API can be re-exported from `__init__.py`:

```python
from .feature import ExampleClient

__all__ = ["ExampleClient"]
```

Do not duplicate Python implementation files, and do not modify `sys.path` from applications or scripts. Install packages normally, preferably in editable mode.

## Creating a New Package

### 1. Choose a slug

For an authentication package, use `auth`, `@workspace/auth`, `workspace-auth`, and `workspace_auth`.

### 2. Create the package directories

```powershell
New-Item -ItemType Directory -Force packages/auth/src
New-Item -ItemType Directory -Force packages/auth/workspace_auth
New-Item -ItemType File packages/auth/workspace_auth/py.typed
```

### 3. Add the public TypeScript entrypoint

Create `packages/auth/src/index.ts`:

```typescript
export function authVersion(): string {
  return '1.0.0';
}
```

### 4. Add the public Python entrypoint

Create `packages/auth/workspace_auth/__init__.py`:

```python
from .client import auth_version

__all__ = ["auth_version"]
```

### 5. Add npm and Python manifests

Add `package.json`, `pyproject.toml`, `setup.py`, and `README.md`. Include only the ecosystems the package actually supports.

### 6. Register the package

Because `packages/*` is included by npm workspaces, an npm package is discovered after `npm install`.

For Python, install it in editable mode:

```powershell
pip install -e packages/auth
```

Update the root `package.json` Python install script if the package should be installed with `npm run install:python`.

### 7. Consume the package

TypeScript:

```typescript
import { authVersion } from '@workspace/auth';
```

Python:

```python
from workspace_auth import auth_version
```

## Environment and Configuration

The runner merges environment files in this order:

1. Monorepo root `.env`
2. Monorepo root `.env.local`
3. Project `.env`
4. Project `.env.local`

The project-level files and `.env.local` files take priority over earlier files. Expanded values use standard shell-style syntax such as `${PORT}` and `${PORT:-8000}`.

The `.env` hierarchy is used by child processes. It is not injected into the host shell.

## Import Rules

Client applications should import npm packages through their package names:

```typescript
import { consoleLogger } from '@workspace/logger';
import preset from '@workspace/config/tailwind/preset';
```

Server applications should import Python packages through their registered Python modules:

```python
from workspace_logger import setup_server_logging
from workspace_runner.registry import detect_target_project
```

Do not import package files with relative paths that cross package directories. Do not append package paths to `sys.path`.

## Development Checks

Type-check the logger package:

```powershell
npm run typecheck -w @workspace/logger
```

Run repository lint/build scripts from the monorepo root:

```powershell
npm run lint
npm run build:all
```

If no package-specific test script exists, verify the package through the application or process that consumes it.

## Troubleshooting

### npm Cannot Resolve `@workspace/...`

Run this from the monorepo root:

```powershell
npm install
```

Confirm that the package directory is inside `packages/*`, has a valid `package.json`, and is included in the root npm workspace list.

### Python Cannot Import `workspace_...`

Install or reinstall the package in editable mode:

```powershell
pip install -e packages/logger
pip install -e packages/runner
```

Confirm that the package name in `pyproject.toml` matches the intended distribution name and that `tool.setuptools.packages.find.include` contains the Python module.

### Python Uses a Different Environment

Activate the same virtual environment used to install the packages, then verify:

```powershell
python -m pip show workspace-runner workspace-logger
python -c "import workspace_runner, workspace_logger; print('packages available')"
```

Use `python -m pip` instead of bare `pip` when the system has multiple Python installations.

### A Port Is Already in Use

Start the runner with `--kill-port`:

```powershell
npm run dev
python packages/runner/bin/run-dev.py --kill-port
```

Only use `--kill-port` when it is safe to stop the process currently occupying the selected port.

### A Package Change Is Not Visible

- npm: rerun `npm install` after changing `package.json` exports.
- Python: editable packages generally update immediately; reinstall after changing `pyproject.toml` or package metadata.
- TypeScript: restart the consuming development server after changing exports or types.

## Maintenance Checklist

Before adding or changing a package:

- [ ] The package has one clear responsibility.
- [ ] Directory, npm, Python distribution, and Python module names follow the naming rules.
- [ ] Public APIs are exported through `src/index.ts` or `workspace_<slug>/__init__.py`.
- [ ] npm subpath exports point to files that exist.
- [ ] Python package discovery includes the module directory.
- [ ] No implementation code is duplicated across ecosystems.
- [ ] No code modifies `sys.path`.
- [ ] Package-specific README instructions are complete and accurate.
- [ ] Installation and consumer examples are verified.
- [ ] Unrelated projects and shared configuration remain unchanged.
