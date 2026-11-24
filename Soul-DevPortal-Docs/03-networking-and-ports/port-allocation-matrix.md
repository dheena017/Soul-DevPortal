# Monorepo Port Allocation & Network Matrix

All projects have been assigned **guaranteed unique, non-overlapping ports**. You can run all 8 applications simultaneously without port collisions or process interference.

### Port Ranges Overview

- **Client Services Block**: `5173` – `5181`
- **Server APIs & Services Block**: `8000` – `8008`

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

## 2. Master Comparison Table

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
