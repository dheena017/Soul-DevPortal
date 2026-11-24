# Project Layout Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: All project directories in `Soul-DevPortal-Projects/`

---

## The 8 Inviolable Directory Layout Rules

### 1. Dual-Pillar Root Structure
- **Rule**: Every project in `Soul-DevPortal-Projects/<app>/` must contain strictly:
  - `client/`: React 19 + Vite 8 frontend application.
  - `server/`: Python FastAPI + Uvicorn backend service.
  - `metadata.json`: Machine-readable project manifest.
  - `package.json`: Monorepo scripts (`dev`, `build`, `lint`).
  - `README.md`: Project onboarding guide.
  - `.env.example`: Safe environment baseline template.
- **Prohibition**: Arbitrary loose files in project roots (e.g. `test.js`, `temp.py`, `data.db`) are strictly forbidden.

### 2. Path Aliasing Standard (`@/*`)
- **Rule**: Client source code must map `@/*` directly to `src/*` in both `tsconfig.json` and `vite.config.ts`.
- **Prohibition**: Relative upward imports exceeding two levels (e.g. `../../../components`) are prohibited. Use `@/features/...` or `@/shared/...`.

### 3. Absolute Cross-Project Boundary Isolation
- **Rule**: A project in `Soul-DevPortal-Projects/<app-a>` may **never** import files from `Soul-DevPortal-Projects/<app-b>` via relative paths (`../../app-b/src`).
- **Constraint**: Code sharing across microservices is allowed strictly through versioned packages in `Soul-DevPortal-Packages/` (e.g. `@workspace/logger`).

### 4. Client Feature-Slice Co-location
- **Rule**: Domain code must be co-located in `client/src/features/<feature-name>/`.
- **Structure**: Each feature must contain its own `components/`, `api/`, `hooks/`, `types.ts`, and `index.ts`.
- **Constraint**: Do not dump feature-specific components into global `src/components/`.

### 5. Decoupled Application Shell (`src/app/`)
- **Rule**: `client/src/app/` functions purely as the application factory, router, layout frame, and global provider tree.
- **Constraint**: Zero domain business logic, data mutations, or direct fetch calls may exist in `src/app/`.

### 6. Public Static Asset Boundaries (`client/public/`)
- **Rule**: Uncompiled assets (SVGs, PNGs, favicons, fonts) must reside in `client/public/`.
- **Constraint**: Every project must supply `client/public/logos/logo.svg` for DevPortal catalog rendering.

### 7. Server Feature Slice Standard
- **Rule**: Server features must reside in `server/features/<feature-name>/`, containing:
  - `router.py`: FastAPI endpoint declarations.
  - `service.py`: Business logic and external API communication.
  - `schemas.py`: Pydantic request and response models.
  - `__init__.py`: Public feature interface.

### 8. Persistence Isolation (`server/data/`)
- **Rule**: All runtime database files, caches, and uploaded assets must live strictly in `server/data/`.
