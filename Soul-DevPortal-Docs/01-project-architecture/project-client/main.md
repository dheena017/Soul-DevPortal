# Project Client Architecture — Technical Specification & Guide

> **Domain**: React 19 SPA Architecture, Vite 8 Bundler & Tailwind CSS v4  
> **Applies to**: All frontend client applications in `Soul-DevPortal-Projects/`

---

## 1. Architectural Blueprint: The Modern Client Stack

Every frontend client in the Soul Monorepo is designed as a high-speed Single Page Application (SPA) running on React 19 and compiled with Vite 8.

```
                           REACT 19 CLIENT ARCHITECTURE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  index.html (HTML5 Shell)                                                   │
 │  └── src/main.tsx (createRoot / Concurrent DOM Mount)                       │
 │      └── src/app/App.tsx                                                    │
 │          ├── Theme & Query Providers (`src/app/providers.tsx`)              │
 │          └── AppRouter (`src/app/AppRouter.tsx`)                            │
 │              ├── Route: /          -> Dashboard Feature (`src/features/...`)│
 │              ├── Route: /sessions  -> Sessions Feature                     │
 │              └── Route: /settings  -> Settings Feature                     │
 └──────────────────────────────────────┬──────────────────────────────────────┘
                                        │
                         All /api & /ws requests
                                        ▼
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │  Vite 8 Reverse Proxy Layer (`client/vite.config.ts`)                       │
 │  ├─ Transparently rewrites `/api/v1/*` to `http://127.0.0.1:8000/api/v1/*`  │
 │  └─ Transparently rewrites `/ws/*` to `ws://127.0.0.1:8000/ws/*`            │
 └─────────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Canonical `vite.config.ts` Configuration

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

// Ports are mapped from projects.json (e.g., 5173 -> 8000)
const CLIENT_PORT = 5173;
const BACKEND_PORT = 8000;

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: CLIENT_PORT,
    strictPort: true, // Prevents silent fallback to arbitrary random ports
    host: '127.0.0.1',
    proxy: {
      '/api': {
        target: `http://127.0.0.1:${BACKEND_PORT}`,
        changeOrigin: true,
        secure: false,
      },
      '/ws': {
        target: `ws://127.0.0.1:${BACKEND_PORT}`,
        ws: true,
        changeOrigin: true,
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
});
```

---

## 3. Tailwind CSS v4 CSS-First Architecture

Tailwind CSS v4 replaces JavaScript configuration files with native CSS directives.

### Global Styles (`client/src/index.css`)

```css
@import "tailwindcss";

@layer base {
  :root {
    --background: #09090b;
    --foreground: #fafafa;
    --card: #18181b;
    --card-foreground: #fafafa;
    --primary: #3b82f6;
    --primary-foreground: #ffffff;
    --muted: #27272a;
    --muted-foreground: #a1a1aa;
    --border: #27272a;
    --radius: 0.5rem;
  }
}

@theme {
  --color-brand-primary: var(--primary);
  --color-surface-card: var(--card);
  --font-sans: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}
```

---

## 4. Next.js Migration Shims

For components authored with Next.js APIs, the monorepo provides zero-dependency compatibility shims in `src/shared/lib/next-shims.tsx`:

```tsx
import React from 'react';

export const Link: React.FC<React.AnchorHTMLAttributes<HTMLAnchorElement>> = ({ href, children, ...props }) => {
  return (
    <a href={href} {...props}>
      {children}
    </a>
  );
};

export const useRouter = () => {
  return {
    push: (url: string) => { window.history.pushState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); },
    replace: (url: string) => { window.history.replaceState({}, '', url); window.dispatchEvent(new PopStateEvent('popstate')); },
    back: () => window.history.back(),
  };
};
```

---

## 5. Unified HTTP Client Fetcher

```typescript
// client/src/shared/lib/api-client.ts
export interface ApiEnvelope<T> {
  success: boolean;
  data: T;
  error: string | null;
  timestamp: string;
}

export async function apiClient<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const defaultHeaders: HeadersInit = {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  };

  const response = await fetch(endpoint, {
    ...options,
    headers: { ...defaultHeaders, ...options.headers },
  });

  const body: ApiEnvelope<T> = await response.json().catch(() => {
    throw new Error(`Failed to parse JSON response from ${endpoint}`);
  });

  if (!response.ok || !body.success) {
    throw new Error(body.error || `HTTP error ${response.status}: ${response.statusText}`);
  }

  return body.data;
}
```
