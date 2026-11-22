# Port & Network Topology Guide

> **Zero-Collision Port Matrix & Service Architecture**  
> Comprehensive technical specification of all projects in the monorepo, detailing dedicated ports (:5173 - :5181 / :8000 - :8008), runtime frameworks, inter-service proxies, databases, and GitHub repositories.

---

## 1. Monorepo Port & Network Architecture

All projects have been assigned **guaranteed unique, non-overlapping ports**. You can run all 8 applications simultaneously without port collisions or process interference.

### Port Ranges Overview

- **Client Services Block**: `5173` – `5181`
- **Server APIs & Services Block**: `8000` – `8008`

```
   CLIENT SERVICES                             SERVER REST APIs
 ┌──────────────────────────────────────┐     ┌────────────────────────────────────┐
 │  5173  apexmind-ai (Vite)            │───► │  8000  apexmind-ai (FastAPI)       │
 │  5174  outpass-system (Vite)         │───► │  8001  outpass-system (FastAPI)     │
 │  5175  free-api-hub (Vite)           │───► │  8002  free-api-hub (FastAPI)       │
 │  5176  sonikoma (Vite)               │───► │  8006  sonikoma (FastAPI)           │
 │  5177  spatial-dimensions (Vite)     │───► │  8007  spatial-dimensions (Express) │
 │  5178  college-management (Vite)     │───► │  8005  college-management (Express) │
 │  5179  globalpulse-ai (Next.js)      │───► │  8003  globalpulse-ai (FastAPI)     │
 │  5180  postcraft-ai (Next.js)        │     │  (Fullstack Serverless API)        │
 └──────────────────────────────────────┘     └────────────────────────────────────┘
```

---

## 2. Master Comparison Table

| Project Name | Client Port | Client Framework | Server Port | Server Framework | Database / Storage | GitHub Repository |
| :--- | :---: | :--- | :---: | :--- | :--- | :--- |
| **`apexmind-ai`** | **`5173`** | Vite 8 + React 19 + Tailwind v4 | **`8000`** | Python FastAPI + Uvicorn | File / Local Media Cache | [apexmind-ai](https://github.com/dheena017/apexmind-ai) |
| **`outpass-system`** | **`5174`** | Vite + React 18 + Capacitor 8 | **`8001`** | Python FastAPI + Uvicorn | SQLite + SQLAlchemy | [outpass-system](https://github.com/dheena017/outpass-system) |
| **`free-api-hub`** | **`5175`** | Vite + React 18 + Tailwind v3 | **`8002`** | Python FastAPI + Uvicorn | JSON Data / File Cache | [free-api-hub](https://github.com/dheena017/free-api-hub) |
| **`sonikoma`** | **`5176`** | Vite + React 19 + Tailwind v4 | **`8006`** | Python FastAPI + Uvicorn | SQLite / Supabase PostgreSQL | [Sonikoma](https://github.com/dheena017/Sonikoma) |
| **`spatial-dimensions`** | **`5177`** | Vite 6 + React 19 + Motion | **`8007`** | Node.js Express (ESM) | JSONL Submissions Store | [spatial-dimensions](https://github.com/dheena017/spatial-dimensions) |
| **`college-management-system`** | **`5178`** | Vite 6 + React 19 + Tailwind v4 | **`8005`** | Node.js Express (TypeScript) | SQLite (`better-sqlite3`) | [college-management-system](https://github.com/dheena017/college-management-system) |
| **`globalpulse-ai`** | **`5179`** | Next.js 14 + React 18 | **`8003`** | Python FastAPI + Uvicorn | SQLite / aiosqlite | [globalpulse-ai](https://github.com/dheena017/globalpulse-ai) |
| **`postcraft-ai`** | **`5180`** | Next.js 14 + React 18 + Tailwind | — | Next.js Server Actions / API | SQLite Database | [postcraft-ai](https://github.com/dheena017/postcraft-ai) |

---

## 3. Technology Stack Categorization

### Client Frameworks

- **Next.js 14 (App Router)**:
  - `globalpulse-ai` (Port `5179`)
  - `postcraft-ai` (Port `5180`)
- **Vite + React 19 (Modern React 19 Stack)**:
  - `apexmind-ai` (Port `5173`)
  - `sonikoma` (Port `5176`)
  - `spatial-dimensions` (Port `5177`)
  - `college-management-system` (Port `5178`)
- **Vite + React 18 (Enterprise React 18 Stack)**:
  - `outpass-system` (Port `5174`, Mobile PWA via Capacitor)
  - `free-api-hub` (Port `5175`, API Explorer & Mock Tester)

### Server Frameworks

- **Python FastAPI (Asynchronous REST APIs)**:
  - `apexmind-ai` (Port `8000`)
  - `outpass-system` (Port `8001`)
  - `free-api-hub` (Port `8002`)
  - `globalpulse-ai` (Port `8003`)
  - `sonikoma` (Port `8006`)
- **Node.js Express (JavaScript / TypeScript Microservices)**:
  - `college-management-system` (Port `8005`, Express + tsx)
  - `spatial-dimensions` (Port `8007`, Express ESM)
- **Next.js Serverless Functions**:
  - `postcraft-ai` (Port `5180`, integrated App Router API)

### Database Engines

- **SQLite / aiosqlite / better-sqlite3**:
  - `college-management-system` (`hostel.db` via `better-sqlite3`)
  - `outpass-system` (`database.py` via SQLAlchemy)
  - `globalpulse-ai` (`app/db/database.py` async engine)
  - `postcraft-ai` (`sqlite.db` local store)
- **Supabase / PostgreSQL Pooler**:
  - `sonikoma` (`postgresql://...` production database)
- **JSON / JSONL Flat Storage**:
  - `free-api-hub` (`data/apis.json` & `submissions.json`)
  - `spatial-dimensions` (`submissions/contact-inquiries.jsonl`)

---

## 4. Detailed Project Specifications

### 1. `apexmind-ai`

- **Description**: AI Creative Studio for automated video creation, scriptwriting, voiceover synthesis, and YouTube publishing.
- **Client**: Port `5173` | Vite 8, React 19, Tailwind CSS v4, Motion
- **Server**: Port `8000` | Python 3.11, FastAPI, Uvicorn
- **Proxy**: `/api` requests proxied to `http://127.0.0.1:8000`
- **Run Command**:

  ```bash
  npm run dev:apexmind
  # Or inside project:
  python script/frontend.py --with-backend
  ```

- **Git Remote**: `https://github.com/dheena017/apexmind-ai.git`

---

### 2. `outpass-system`

- **Description**: Digital campus student outpass, warden approval portal, and gate security scanner with QR verification.
- **Client**: Port `5174` | Vite, React 18, Tailwind CSS v3, Capacitor 8 (Android/iOS PWA)
- **Server**: Port `8001` | Python, FastAPI, SQLAlchemy, SQLite
- **Proxy**: `/api` requests proxied to `http://localhost:8001`
- **Run Command**:

  ```bash
  npm run dev:outpass
  # Or inside project:
  python run_dev.py
  ```

- **Git Remote**: `https://github.com/dheena017/outpass-system.git`

---

### 3. `free-api-hub`

- **Description**: Developer platform cataloging verified public APIs with built-in live endpoint testing and SSRF security sandbox.
- **Client**: Port `5175` | Vite, React 18, Lucide React
- **Server**: Port `8002` | Python, FastAPI, Uvicorn, JSON storage
- **Proxy**: `/api` requests proxied to `http://127.0.0.1:8002`
- **Run Command**:

  ```bash
  npm run dev:free-api-hub
  # Or inside project:
  npm run dev
  ```

- **Git Remote**: `https://github.com/dheena017/free-api-hub.git`

---

### 4. `sonikoma`

- **Description**: AI Webtoon & Comic translation, automated panel cropping, TTS dubbing, and video export engine.
- **Client**: Port `5176` | Vite, React 19, Tailwind CSS v4, Zustand
- **Server**: Port `8006` | Python, FastAPI, Gemini Vision API, Supabase / SQLite
- **Proxy**: `/api` requests proxied to `http://127.0.0.1:8006`
- **Run Command**:

  ```bash
  npm run dev:sonikoma
  # Or inside project:
  npm run dev:all
  ```

- **Git Remote**: `https://github.com/dheena017/Sonikoma.git`

---

### 5. `spatial-dimensions`

- **Description**: 3D spatial interface & creative engineering portfolio showcasing interactive case studies with magnetic UI.
- **Client**: Port `5177` | Vite 6, React 19, Tailwind CSS v4, Motion
- **Server**: Port `8007` | Node.js, Express.js (ESM), Rate Limiting
- **Proxy**: `/api` requests proxied to `http://localhost:8007`
- **Run Command**:

  ```bash
  npm run dev:spatial
  # Or inside project:
  npm run dev
  ```

- **Git Remote**: `https://github.com/dheena017/spatial-dimensions.git`

---

### 6. `college-management-system`

- **Description**: Multi-portal campus management system for students, parents, wardens, and admin covering hostel rooms, mess bills, shuttle transport, laundry, and campus events.
- **Client**: Port `5178` | Vite 6, React 19, Tailwind CSS v4, React Router 6
- **Server**: Port `8005` | Node.js, Express.js, TypeScript (tsx), SQLite (`better-sqlite3`)
- **Proxy**: `/api` requests proxied to `http://localhost:8005`
- **Run Command**:

  ```bash
  npm run dev:college
  # Backend server:
  npm run dev:college:server
  ```

- **Git Remote**: `https://github.com/dheena017/college-management-system.git`

---

### 7. `globalpulse-ai`

- **Description**: Real-time world news intelligence platform aggregating 25+ trusted wire feeds with AI bias analysis and audio summaries.
- **Client**: Port `5179` | Next.js 14, React 18, Tailwind CSS
- **Server**: Port `8003` | Python 3.11, FastAPI, Uvicorn, aiosqlite
- **Inter-service**: Direct HTTP client to `http://localhost:8003/api/v1`
- **Run Command**:

  ```bash
  npm run dev:globalpulse
  # Or inside project:
  python run.py
  ```

- **Git Remote**: `https://github.com/dheena017/globalpulse-ai.git`

---

### 8. `postcraft-ai`

- **Description**: AI social media post designer, carousel generator, and marketing copywriter with live preview and auto-restarting runner.
- **Fullstack**: Port `5180` | Next.js 14, React 18, Tailwind CSS, TypeScript
- **Run Command**:

  ```bash
  npm run dev:postcraft
  # Or inside project:
  npm run dev
  ```

- **Git Remote**: `https://github.com/dheena017/postcraft-ai.git`

---

## 5. Root Monorepo Commands Cheatsheet

Run any project from the monorepo root (`dheena-workspace`):

```bash
# Install dependencies across all workspaces
npm run install:all

# Run individual full-stack projects
npm run dev:apexmind       # Vite (5173) + FastAPI (8000)
npm run dev:outpass        # Vite (5174) + FastAPI (8001)
npm run dev:free-api-hub   # Vite (5175) + FastAPI (8002)
npm run dev:sonikoma       # Vite (5176) + FastAPI (8006)
npm run dev:spatial        # Vite (5177) + Express (8007)
npm run dev:college        # Vite (5178) + Express (8005)
npm run dev:globalpulse    # Next.js (5179) + FastAPI (8003)
npm run dev:postcraft      # Next.js (5180)
npm run dev                # DevPortal: Vite (5181) + FastAPI (8008)
```
