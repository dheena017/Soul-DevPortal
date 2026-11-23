# Supporting Configuration, Styling & Tooling Languages

### 1. JavaScript (`.js`, `.mjs`)

- **Role**: Presets and build configuration scripts.
- **Usage**:
  - `packages/config/tailwind/tokens.js`: Canonical design token definitions.
  - `packages/config/tailwind/preset.js`: Master Tailwind CSS design system preset.
  - `packages/config/eslint/*.js`: Code quality rules for Base, React, and Next.js projects.

### 2. Tailwind CSS (`.css`)

- **Role**: Atomic, utility-first UI styling.
- **Usage**:
  - Unified color hierarchy (`surface: 50-950`, `brand: 50-950`, `accent: 50-950`).
  - Elevation shadow system with luminous AI glows (`glow-brand`, `glow-accent`).
  - Micro-animations (`shimmer`, `pulse-glow`, `fade-in`, `slide-up`).

### 3. JSON (`.json`)

- **Role**: Structured configurations and registries.
- **Usage**:
  - `package.json`: NPM workspace manifests and lifecycle scripts.
  - `projects.json`: Decoupled registry of all monorepo applications, ports, and framework types.
  - `tsconfig/*.json`: Reusable TypeScript compiler configurations.
  - `prettier/index.json`: Master code formatting specifications.

### 4. TOML (`.toml`)

- **Role**: Modern Python packaging and linting specifications.
- **Usage**:
  - `pyproject.toml`: PEP 517/621 package metadata for `workspace-logger` and `workspace-runner`.
  - `packages/config/python/ruff.toml`: 10x-speed Ruff linter and formatter settings.

---
