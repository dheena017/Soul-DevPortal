# Project Client Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: All React 19 + Vite 8 + Tailwind CSS v4 frontend applications

---

## The 8 Inviolable Client Rules

### 1. Unified Tech Stack: React 19 + Vite 8 + Tailwind v4
- **Rule**: All frontend clients must run on React 19, bundled using Vite 8, and styled with Tailwind CSS v4.
- **Port Allocation**: Client ports are strictly reserved between `5173` and `5181` (per `projects.json`).

### 2. Mandatory Reverse Proxying via Vite
- **Rule**: Client code must **never** hardcode backend origins or ports (e.g. `http://localhost:8000/api`).
- **Standard**: All network requests must use relative paths (`/api/...`). The client Vite dev server must proxy `/api` and `/ws` to the corresponding backend port with `strictPort: true`:
  ```typescript
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': { target: 'http://127.0.0.1:8000', changeOrigin: true },
      '/ws': { target: 'ws://127.0.0.1:8000', ws: true }
    }
  }
  ```

### 3. Pure CSS-First Tailwind v4
- **Rule**: Do not create or use legacy `tailwind.config.js`, `tailwind.config.ts`, or `postcss.config.js`.
- **Constraint**: Tailwind CSS v4 is compiled natively by `@tailwindcss/vite`. Import it in `src/index.css` via:
  ```css
  @import "tailwindcss";
  ```
- **Custom Tokens**: Declare theme tokens using CSS custom properties under `@theme`.

### 4. Modern React 19 Primitives & React Compiler Readiness
- **Rule**: Use modern React 19 asynchronous primitives (`useActionState`, `useOptimistic`, `use`, `<Suspense>`).
- **Prohibition**: Deprecated React lifecycle methods and unsafe side-effects during render are strictly forbidden. Components must be pure functions.

### 5. Path Aliasing Enforcement (`@/*`)
- **Rule**: All project imports must consume the `@/*` alias mapped to `./src/*`.
- **Prohibition**: Never use upward traversing relative paths beyond 1 level (`../../..`).

### 6. Decoupled Application Factory (`src/app/`)
- **Rule**: `src/app/` serves as the router, provider tree, and layout shell.
- **Constraint**: No business logic, raw API fetches, or feature-specific state management may be declared in `src/app/`.

### 7. Next.js Migration Shims
- **Rule**: When porting components originally written for Next.js, route through the standard shims (`next-link.tsx`, `next-navigation.ts`, `next-image.tsx`) located in `src/shared/lib/` or `@workspace/config` to guarantee zero build failures.

### 8. Zero Unhandled Promise Rejections & Console Errors
- **Rule**: Client builds must pass with zero TypeScript errors (`tsc --noEmit`). Runtime executions must be free of unhandled Promise rejections and uncaught React exceptions in the browser console.
