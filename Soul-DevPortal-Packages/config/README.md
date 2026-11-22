# @workspace/config

> **Enterprise Shared Configuration Presets**  
> Unified, zero-duplication presets for TypeScript, Tailwind CSS, Prettier, ESLint, and Python across the entire monorepo.

---

## 📦 What is `@workspace/config`?

In a high-scale polyglot monorepo, having each project maintain its own 40-line `tsconfig.json`, copy-pasted Tailwind themes, and diverging Prettier configs creates maintenance drift, subtle bugs, and broken builds.

`@workspace/config` centralizes all configuration into a single, versioned package:
* **TypeScript Presets**: Strict, battle-tested compiler configs for React, Next.js, Node.js, Libraries, and Testing.
* **Tailwind CSS Design System**: Unified design tokens (colors, surface hierarchy, glowing highlights, glassmorphism) and keyframe animations.
* **Prettier Presets**: Standardized code formatting with automatic Tailwind class sorting and clean import ordering.
* **ESLint Presets**: Modern linting for pure TypeScript, React, and Next.js.
* **Python Tooling**: High-speed Ruff linter rules and Pytest testing configurations.

---

## 🚀 Quick Usage Guide

### 1. TypeScript (`tsconfig.json`)

Instead of 40 lines of compiler options, each project needs only a 3-line `tsconfig.json`:

#### For React (Vite) Applications
```json
{
  "extends": "@workspace/config/tsconfig/react.json",
  "include": ["src"]
}
```

#### For Next.js Applications
```json
{
  "extends": "@workspace/config/tsconfig/next.json",
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"]
}
```

#### For Node.js / Express Backends
```json
{
  "extends": "@workspace/config/tsconfig/node.json",
  "include": ["src"]
}
```

#### For Monorepo Packages (`packages/*`)
```json
{
  "extends": "@workspace/config/tsconfig/library.json",
  "include": ["src"]
}
```

---

### 2. Tailwind CSS (`tailwind.config.js`)

Inherit the monorepo design system, colors, elevation shadows, and animations:

```javascript
import preset from '@workspace/config/tailwind/preset';

/** @type {import('tailwindcss').Config} */
export default {
  presets: [preset],
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      // Add project-specific custom overrides here if needed
    },
  },
};
```

#### Included Design Tokens
* **Surface Hierarchy**: `surface-50` through `surface-950`
* **Brand Colors**: `brand-50` through `brand-950` (Primary: `brand-600` / `#2563EB`)
* **Interactive Accent**: `accent-50` through `accent-950` (Primary: `accent-600` / `#7C3AED`)
* **Luminous Shadows**: `shadow-glow-brand`, `shadow-glow-accent`, `shadow-glow-success`
* **Animations**: `animate-fade-in`, `animate-slide-up`, `animate-shimmer`, `animate-pulse-glow`

---

### 3. Prettier (`.prettierrc`)

In the monorepo root or individual projects:

```json
"@workspace/config/prettier"
```

To use a JSON configuration file:
```json
{
  "$schema": "https://json.schemastore.org/prettierrc",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true,
  "singleQuote": true
}
```

---

### 4. ESLint (`.eslintrc.cjs` or `eslint.config.js`)

#### React Projects
```javascript
export default [
  ...require('@workspace/config/eslint/react')
];
```

#### Next.js Projects
```javascript
export default [
  ...require('@workspace/config/eslint/next')
];
```

---

### 5. Python Tooling (`ruff.toml` & `pytest.ini`)

Copy or link the centralized Python configuration:
* **Linter & Formatter**: [`packages/config/python/ruff.toml`](./python/ruff.toml)
* **Test Runner**: [`packages/config/python/pytest.ini`](./python/pytest.ini)

---

## 📁 Package Directory Structure

```text
packages/config/
├── package.json               # NPM package manifest with subpath exports
├── README.md                  # This documentation file
│
├── tsconfig/                  # TypeScript Compiler Presets
│   ├── base.json              # Strict baseline compiler options
│   ├── react.json             # React 18/19 & Vite JSX runtime
│   ├── next.json              # Next.js App Router & Web Workers
│   ├── node.json              # Node.js LTS ESModule backend
│   ├── library.json           # Monorepo packages & type distribution
│   └── test.json              # Vitest & testing globals
│
├── tailwind/                  # Tailwind CSS Design System
│   ├── tokens.js              # Canonical color, surface, and status tokens
│   └── preset.js              # Master preset (fonts, shadows, glows, animations)
│
├── prettier/                  # Prettier Code Formatter
│   ├── index.json             # Rules, plugin sorting, and file overrides
│   └── .prettierignore        # Standard workspace exclusions
│
├── eslint/                    # ESLint Code Quality Rules
│   ├── base.js                # Core TypeScript linting
│   ├── react.js               # React & Hooks linting
│   └── next.js                # Next.js Core Web Vitals
│
└── python/                    # Python Tooling Standards
    ├── ruff.toml              # 10x-speed Ruff linter & formatter
    └── pytest.ini             # Pytest configuration
```

---

## 🔒 Enterprise Standards Compliance
* **Zero Personal Information**: Contains no developer names, emails, or personal usernames.
* **Modern Subpath Exports**: Uses Node.js `exports` map for direct, clean tree-shaking and resolution.
* **Self-Contained**: Can be safely extended by any workspace project without circular dependencies.
