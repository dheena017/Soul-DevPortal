# @workspace/config (workspace-config)

> **Enterprise Shared Configuration Presets, Network Port Topology & Design Tokens**  
> Unified, zero-duplication presets for TypeScript, Tailwind CSS, Prettier, ESLint, Python, and micro-service network topology across the entire monorepo.

---

## 📦 Architecture & Directory Layout

```text
Soul-DevPortal-Packages/config/
├── package.json               # NPM package manifest with subpath exports & scripts
├── pyproject.toml             # Python package definition (workspace-config)
├── setup.py                   # Standard setuptools configuration
├── README.md                  # Comprehensive architecture & usage documentation
├── index.js                   # JavaScript/TypeScript entrypoint (tokens & Tailwind preset)
│
├── internal/                  # 1. Core Internal Python Implementation
│   ├── __init__.py            # Internal exports
│   ├── ports.py               # Canonical port registry & network socket probing
│   ├── tokens.py              # Python design tokens (brand, surface, accent)
│   └── env.py                 # Monorepo root detection & project env parser
│
├── external/                  # 2. Public Facades, Presets & CLI Launchers
│   ├── __init__.py            # Public unified Python facade
│   ├── run_ports.py           # Network Port Topology & Conflict Scanner CLI
│   │
│   └── presets/               # Polyglot Configuration Presets
│       ├── tsconfig/          # TypeScript Compiler Presets (base, react, next, node, library, test)
│       ├── tailwind/          # Tailwind CSS Design System (preset.js, tokens.js)
│       ├── prettier/          # Prettier Code Formatter (index.json, .prettierignore)
│       ├── eslint/            # ESLint Code Quality Rules (base.js, react.js, next.js)
│       └── python/            # Python Tooling Standards (ruff.toml, pytest.ini)
│
└── tests/                     # Test Suite
    ├── test_ports_integrity.py# Port uniqueness & range validation tests
    ├── test_internal.py       # Internal module unit tests
    └── test_external.py       # External facade tests
```

---

## 🌐 Canonical Network Port Topology

Every application in the monorepo has deterministic, non-overlapping client and server ports:

| Project | Client Port | Server Port | Stack |
| :--- | :---: | :---: | :--- |
| **ApexMind Studio AI** (`apexmind-ai`) | `5173` | `8000` | React 19 + Vite 8 / Python FastAPI |
| **Outpass System** (`outpass-system`) | `5174` | `8001` | React 19 + Vite 8 / Python FastAPI |
| **Free API Hub** (`free-api-hub`) | `5175` | `8002` | React 19 + Vite 8 / Python FastAPI |
| **Sonikoma AI Studio** (`sonikoma`) | `5176` | `8006` | React 19 + Vite 8 / Python FastAPI |
| **Spatial Dimensions** (`spatial-dimensions`) | `5177` | `8007` | React 19 + Vite 8 / Python FastAPI |
| **College Management** (`college-management-system`) | `5178` | `8005` | React 19 + Vite 8 / Python FastAPI |
| **GlobalPulse AI** (`globalpulse-ai`) | `5179` | `8003` | React 19 + Vite 8 / Python FastAPI |
| **PostCraft AI** (`postcraft-ai`) | `5180` | `8004` | React 19 + Vite 8 / Python FastAPI |
| **Soul DevPortal** (`devportal`) | `5181` | `8008` | React 19 + Vite 8 / Python FastAPI |

### Port Audit & Conflict Scanner CLI

```bash
# Scan all registered micro-app ports and detect live collisions
python external/run_ports.py

# Terminate any rogue processes locking assigned ports
python external/run_ports.py --kill-conflicts

# Output machine-readable JSON
python external/run_ports.py --json
```

---

## 🚀 Quick Usage Guide

### 1. Python Usage

```python
# Direct import from external facade:
from external import PORT_REGISTRY, get_project_ports, DESIGN_TOKENS

# Or from internal core modules:
from internal.ports import PORT_REGISTRY, get_project_ports

client_port, server_port = get_project_ports("apexmind-ai")
print(f"Client: {client_port}, Server: {server_port}")
```

### 2. TypeScript (`tsconfig.json`)

```json
{
  "extends": "@workspace/config/tsconfig/react.json",
  "include": ["src"]
}
```

Available presets:
* `@workspace/config/tsconfig/base.json`
* `@workspace/config/tsconfig/react.json`
* `@workspace/config/tsconfig/next.json`
* `@workspace/config/tsconfig/node.json`
* `@workspace/config/tsconfig/library.json`
* `@workspace/config/tsconfig/test.json`

### 3. Tailwind CSS (`tailwind.config.js`)

```javascript
import preset from '@workspace/config/tailwind/preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
};
```

### 4. JavaScript/TypeScript Programmatic Imports

```javascript
import { tokens, preset } from '@workspace/config';
```

---

## 🧪 Testing

Run the test suite across all configuration and port integrity checks:

```bash
python tests/test_ports_integrity.py
python tests/test_internal.py
python tests/test_external.py
```
