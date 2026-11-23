# Tech Stack Philosophy & The 5 Golden Rules

The Soul Monorepo enforces a strict two-language ecosystem: **Python** powers high-performance backends, artificial intelligence workflows, and system utilities, while **TypeScript** drives type-safe client applications, component lifecycles, and interactive interfaces.

```
                     DUAL-LANGUAGE SPECIALIZATION MATRIX
 ┌───────────────────────────────────────┬─────────────────────────────────────┐
 │    PYTHON 3.11+ (SYSTEMS & AI)        │    TYPESCRIPT 5+ (UI & CLIENTS)     │
 ├───────────────────────────────────────┼─────────────────────────────────────┤
 │ • FastAPI / Uvicorn ASGI engines      │ • React 19 / Vite 8 SPA clients     │
 │ • PyTorch / Gemini GenAI pipelines    │ • Tailwind CSS v4 styling & tokens  │
 │ • SQLite WAL / SQLAlchemy persistence │ • Strict TS config (Zero `any`)     │
 │ • Package Facade: pyproject.toml      │ • Package Facade: package.json      │
 └───────────────────────────────────────┴─────────────────────────────────────┘
```

---

## The 5 Golden Rules of the Tech Stack

### 1. Dual-Language Specialization (Python Server, TypeScript Client)
- Backend services, AI pipelines, system automations, and heavy data transformations must be written in **Python 3.11+**.
- User interfaces, web applications, and interactive widgets must be built in **TypeScript 5+** with modern frontends (React 19 / Vite 8).
- Do not introduce ad-hoc third languages (e.g. Go, Ruby, PHP) or un-typed JavaScript files into production workflows without RFC approval.

### 2. Strict Type Safety & Zero `any`
- TypeScript configurations must enforce strict type checking (`"strict": true`, `"noImplicitAny": true`). The use of `any` is strictly prohibited; use typed interfaces, generics, or `unknown` with type guards.
- Python code must utilize type annotations and enforce request/response validation through **Pydantic v2** models and static analysis tools.

### 3. Centralized Design Tokens & Styling Standard
- All UI styling is governed by **Tailwind CSS v4** coupled with shared design tokens from `@workspace/config`.
- Do not author raw CSS files or inline style objects for layout and colors. Always leverage shared tokens, utility classes, and CSS custom properties defined in the monorepo theme preset.

### 4. Reverse Proxy as Single Communication Gateway
- In local development, client applications must never make hardcoded direct cross-origin HTTP calls (e.g. `fetch("http://127.0.0.1:8000/...")`).
- All API communication must route through the Vite `/api` reverse proxy, ensuring identical relative paths (`/api/v1/...`) across local development, staging, and production without CORS friction.

### 5. Unified NPM & Lifecycle Script Parity
- Every child project must implement the canonical lifecycle scripts in its `package.json`:
  - `npm run dev` (Full-stack concurrent execution)
  - `npm run dev:client` (Frontend Vite runner)
  - `npm run dev:server` (Backend Uvicorn/Express runner)
  - `npm run build` (Production compilation)
  - `npm run typecheck` (TypeScript & lint verification)
  - `npm run clean` (Cache, build, and socket cleanup)
