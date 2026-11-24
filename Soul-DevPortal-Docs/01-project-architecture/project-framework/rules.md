# Project Framework & Tech Stack — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: Framework selection, compiler versions, and runtime technologies across all projects

---

## The 8 Inviolable Framework & Tech Stack Rules

### 1. Mandatory Three-Pillar Standard
- **Rule**: Every project in `Soul-DevPortal-Projects/` must strictly adopt the three canonical pillars:
  1. **Frontend Client**: React 19 + TypeScript 5.8+ + Vite 8 + Tailwind CSS v4.
  2. **Backend Server**: Python 3.12+ + FastAPI + Uvicorn.
  3. **Persistence Layer**: Embedded SQLite with Write-Ahead Logging (WAL).
- **Prohibition**: Ad-hoc introduction of alternate stacks (e.g., Express.js, Django, Vue, Angular, PostgreSQL containers for local development) without workspace architectural approval is strictly prohibited.

### 2. React 19 Frontend Invariants
- **Rule**: Consume React 19 features natively (`useActionState`, `useOptimistic`, `use`, `<Suspense>`).
- **Constraint**: Code must be strictly compatible with the React Compiler (pure render functions, zero mutable side effects during render).
- **Prohibition**: Legacy React patterns (`componentWillMount`, class components, unsafe lifecycles) are forbidden.

### 3. Vite 8 Bundler Standard
- **Rule**: All frontend clients must use Vite 8 bundled with `@vitejs/plugin-react` and `@tailwindcss/vite`.
- **Constraint**: `server.strictPort` must be set to `true` to ensure port predictability.

### 4. Pure CSS-First Tailwind CSS v4
- **Rule**: Styling must be powered natively by `@tailwindcss/vite`.
- **Prohibition**: Legacy `tailwind.config.js`, `tailwind.config.ts`, and `postcss.config.js` are prohibited.
- **Entrypoint**: Import Tailwind via `@import "tailwindcss";` in `src/index.css`. Theme variables must be declared in `@theme`.

### 5. Python 3.12+ Backend Standard
- **Rule**: Backends must run on Python 3.12 or newer.
- **Standards**:
  - Web Framework: **FastAPI** (current stable release).
  - ASGI Server: **Uvicorn** with standard worker loop.
  - Data Validation: **Pydantic v2** (`BaseModel`, `Field`).
  - Configuration: `pydantic-settings` (`BaseSettings`).

### 6. TypeScript Strict Mode
- **Rule**: `tsconfig.json` must enforce `"strict": true`, `"noImplicitAny": true`, `"strictNullChecks": true`, and `"skipLibCheck": true`.
- **Prohibition**: Explicit or implicit `any` is forbidden in production code.

### 7. AI Engine Integrations (Gemini Standard)
- **Rule**: Microservices featuring AI generative capabilities must use Google Gemini (`google-genai` Python SDK or `@google/genai` TypeScript SDK).
- **Model Standard**: Default to `gemini-2.5-flash` for high-speed streaming and JSON structuring.

### 8. Tooling & Formatting Uniformity
- **Rule**: Linting and formatting must follow ESLint / Prettier (or Biome) standards on the frontend, and Ruff / Black / Pyright on Python backends.
