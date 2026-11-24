# Networking & Ports Architecture — Master Technical Blueprint & Guide

> **Scope**: Monorepo Port Topology, Network Partitioning & Socket Governance  
> **Applies to**: All client applications, backend services, dev proxies, and process supervisors

---

## 1. Network Topology & Port Block Partitioning

All projects in the Soul Monorepo have been assigned **guaranteed unique, non-overlapping ports**. You can run all 8 applications simultaneously without port collisions or process interference.

### Port Ranges Overview

- **Client Services Block**: `5173` – `5181` (React 19 + Vite 8 + Tailwind CSS v4)
- **Server APIs & Services Block**: `8000` – `8008` (Python FastAPI + Uvicorn)
- **Developer Portal Ingress**: `5181` (UI Portal) / `8008` (FastAPI Authority Backend)

```
   CLIENT SERVICES (React 19 + Vite 8 + Tailwind v4)      SERVER REST APIs (Python FastAPI + Uvicorn)
 ┌───────────────────────────────────────────────┐     ┌───────────────────────────────────────────┐
 │  5173  apexmind-ai (Vite 8)                   │───► │  8000  apexmind-ai (FastAPI)              │
 │  5174  outpass-system (Vite 8)                │───► │  8001  outpass-system (FastAPI)            │
 │  5175  free-api-hub (Vite 8)                  │───► │  8002  free-api-hub (FastAPI)              │
 │  5176  sonikoma (Vite 8)                      │───► │  8006  sonikoma (FastAPI)                  │
 │  5177  spatial-dimensions (Vite 8)            │───► │  8007  spatial-dimensions (FastAPI)        │
 │  5178  college-management-system (Vite 8)     │───► │  8005  college-management-system (FastAPI) │
 │  5179  globalpulse-ai (Vite 8)                │───► │  8003  globalpulse-ai (FastAPI)            │
 │  5180  postcraft-ai (Vite 8)                  │───► │  8004  postcraft-ai (FastAPI)              │
 └───────────────────────────────────────────────┘     └───────────────────────────────────────────┘
```

---

## 2. Master Project Port Allocation Matrix

| Project Name | Client Port | Client Framework | Server Port | Server Framework | Database / Storage | GitHub Repository |
| :--- | :---: | :--- | :---: | :--- | :--- | :--- |
| **`apexmind-ai`** | **`5173`** | React 19 + Vite 8 + Tailwind v4 | **`8000`** | Python FastAPI + Uvicorn | SQLite (`server/data/apexmind.db`) | [apexmind-ai](https://github.com/dheena017/apexmind-ai) |
| **`outpass-system`** | **`5174`** | React 19 + Vite 8 + Tailwind v4 | **`8001`** | Python FastAPI + Uvicorn | SQLite (`database/outpass.db`) | [outpass-system](https://github.com/dheena017/outpass-system) |
| **`free-api-hub`** | **`5175`** | React 19 + Vite 8 + Tailwind v4 | **`8002`** | Python FastAPI + Uvicorn | SQLite (`backend/data/free_api_hub.db`) | [free-api-hub](https://github.com/dheena017/free-api-hub) |
| **`sonikoma`** | **`5176`** | React 19 + Vite 8 + Tailwind v4 | **`8006`** | Python FastAPI + Uvicorn | SQLite (`backend/data/sonikoma.db`) | [Sonikoma](https://github.com/dheena017/Sonikoma) |
| **`spatial-dimensions`** | **`5177`** | React 19 + Vite 8 + Tailwind v4 | **`8007`** | Python FastAPI + Uvicorn | SQLite (`server/data/spatial_dimensions.db`) | [spatial-dimensions](https://github.com/dheena017/spatial-dimensions) |
| **`college-management-system`** | **`5178`** | React 19 + Vite 8 + Tailwind v4 | **`8005`** | Python FastAPI + Uvicorn | SQLite (`server/data/college_management.db`) | [college-management-system](https://github.com/dheena017/college-management-system) |
| **`globalpulse-ai`** | **`5179`** | React 19 + Vite 8 + Tailwind v4 | **`8003`** | Python FastAPI + Uvicorn | SQLite (`backend/data/globalpulse.db`) | [globalpulse-ai](https://github.com/dheena017/globalpulse-ai) |
| **`postcraft-ai`** | **`5180`** | React 19 + Vite 8 + Tailwind v4 | **`8004`** | Python FastAPI + Uvicorn | SQLite (`server/data/postcraft.db`) | [postcraft-ai](https://github.com/dheena017/postcraft-ai) |

---

## 3. Reverse Proxy Architecture (`/api`)

Client applications must never hardcode backend hostnames or ports. All network traffic uses transparent Vite reverse proxying:

```typescript
// vite.config.ts in client application
export default defineConfig({
  server: {
    port: 5173,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
      '/ws': {
        target: 'ws://127.0.0.1:8000',
        ws: true,
      },
    },
  },
});
```

Benefits:
- Eliminates browser CORS configuration requirements in local development.
- Mirrors production ingress topology where nginx, Cloudflare, or an API gateway routes `/api` to the backend cluster.
- Allows seamless protocol upgrades (WebSockets, Server-Sent Events) over the same origin.

---

## 4. Socket Cleanup & Zombie Process Management Protocol

Orphaned processes and unreleased sockets prevent clean service startups. The workspace enforces an automated socket cleanup runbook:

1. **Port Probing & Conflict Detection**:
   ```bash
   python Soul-DevPortal-Packages/config/external/run_ports.py
   ```
2. **Automated Force Termination (`--kill-conflicts`)**:
   ```bash
   python Soul-DevPortal-Packages/config/external/run_ports.py --kill-conflicts
   ```
3. **Kernel-Level Process Supervision**:
   The `@workspace/runner` package wraps child processes in Windows Job Objects (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`) or POSIX process groups (`os.setsid`). When a terminal session ends or `Ctrl+C` is pressed, all spawned child processes and open sockets are terminated atomically with zero zombie processes left behind.
