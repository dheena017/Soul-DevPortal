# Developer Cheatsheets & Commands — Master Technical Blueprint & Guide

> **Scope**: Monorepo CLI Ergonomics, Runbooks, Command Matrices & Audit Checklists  
> **Applies to**: Local development, CI automation, and all 8 micro-applications

---

## 1. Root Workspace Scripts & Multi-Project Launchers

### Root Workspace Commands

| Command | Action | Scope / Runtime |
| :--- | :--- | :--- |
| `npm run dev` | Starts the DevPortal interactive UI | DevPortal Frontend (:5181) |
| `npm run dev:portal:server` | Starts the DevPortal FastAPI metadata extraction server | DevPortal Backend (:8008) |
| `npm run dev:all` | Concurrently boots all 8 applications (clients + servers) | Workspace Supervisor |
| `npm run dev:client` | Starts all client dev servers concurrently | Client Ecosystem (:5173-:5181) |
| `npm run dev:server` | Starts all backend API servers concurrently | Server Ecosystem (:8000-:8008) |
| `npm run build` | Builds the DevPortal production bundle | Production Bundler (Vite) |
| `npm run extract` | Runs schema extraction & AST parsing across all 8 apps | Metadata Engine |
| `npm run typecheck` | Validates TypeScript types across portal & packages | Static Analysis |

### Direct Project Launchers (Root Shortcuts)

| Command | Target Application | Client Port | Server Port |
| :--- | :--- | :---: | :---: |
| `npm run dev:apexmind` | ApexMind Studio AI | `:5173` | `:8000` |
| `npm run dev:outpass` | Outpass Management System | `:5174` | `:8001` |
| `npm run dev:free-api` | Free API Hub | `:5175` | `:8002` |
| `npm run dev:sonikoma` | Sonikoma AI Studio | `:5176` | `:8006` |
| `npm run dev:spatial` | Spatial Dimensions 3D | `:5177` | `:8007` |
| `npm run dev:college` | College Management System | `:5178` | `:8005` |
| `npm run dev:globalpulse` | GlobalPulse AI | `:5179` | `:8003` |
| `npm run dev:postcraft` | PostCraft AI | `:5180` | `:8004` |

---

## 2. Canonical Child Project Lifecycle Standard

Every micro-application implements the exact same canonical lifecycle commands in its root `package.json`:

| Command | Purpose | Target Port / Environment |
| :--- | :--- | :--- |
| `npm run dev` | Runs dual-stack supervisor (client + server concurrently) | Dual-Stack Supervisor (`--kill-port`) |
| `npm run dev:client` | Starts client development server on designated port | Assigned Port (:5173-:5181) |
| `npm run dev:server` | Starts API development server on designated port | Assigned Port (:8000-:8008) |
| `npm run build` | Compiles client assets for production | Production Bundler (Vite 8) |
| `npm run preview` | Previews production dist/ build locally | Vite Preview (:5173-:5181) |
| `npm run typecheck` | Runs strict static type check verification | TypeScript (`tsc --noEmit`) |
| `npm run test` | Executes unit, endpoint, and offline verification | Test Suite (`pytest` / `node --test`) |
| `npm run clean` | Removes build artifacts (`dist/`, cache, temporary files) | Filesystem Cleanup |

---

## 3. Direct Single-Template CLI Specification

- **Client Direct Template**: `npx vite <client-path> --port <PORT>`
- **Server Direct Template**: `python -m uvicorn <module>:app --port <PORT> --reload`
- **Build Direct Template**: `npx vite build <client-path>`
- **Typecheck Direct Template**: `npx tsc --noEmit -p <path>/tsconfig.json`

### Master Direct CLI Execution Matrix

| Project Name | Direct Client Command | Direct Server Command | Build Command | Typecheck Command | Test Command |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **`apexmind-ai`** | `npx vite client --port 5173` | `python -m uvicorn server.app.factory:create_app --port 8000 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`outpass-system`** | `npx vite client --port 5174` | `python -m uvicorn server.main:app --port 8001 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`free-api-hub`** | `npx vite client --port 5175` | `python -m uvicorn server.main:app --port 8002 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`sonikoma`** | `npx vite client --port 5176` | `python -m uvicorn server.main:app --port 8006 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`spatial-dimensions`** | `npx vite client --port 5177` | `python -m uvicorn server.main:app --port 8007 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`college-management`** | `npx vite client --port 5178` | `python -m uvicorn server.main:app --port 8005 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`globalpulse-ai`** | `npx vite client --port 5179` | `python -m uvicorn server.main:app --port 8003 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`postcraft-ai`** | `npx vite client --port 5180` | `python -m uvicorn server.main:app --port 8004 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |
| **`devportal`** (Hub) | `npx vite . --port 5181` | `python server/main.py --port 8008 --reload` | `npm run build` | `npm run typecheck` | `npm run test` |

---

## 4. Master Standards & Compliance Matrix

| # | Standard | Category | Severity | Canonical Rule |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **Package Scoping** | Packages | `MANDATORY` | npm packages use `@workspace/<name>`; Python modules use `workspace_<name>`. |
| **02** | **Dual Manifests** | Packages | `MANDATORY` | Shared libraries maintain synchronized `package.json` and `pyproject.toml`. |
| **03** | **Port Allocations** | Networking | `MANDATORY` | Client: `5173`–`5181`; Server: `8000`–`8008`. Zero overlapping ports allowed. |
| **04** | **Data Masking** | Security | `CRITICAL` | `@workspace/logger` must sanitize API keys, Bearer tokens, and passwords. |
| **05** | **Directory Naming** | Architecture | `MANDATORY` | Every project must use `client/` and `server/`. No legacy `frontend/` or `backend/`. |
| **06** | **Feature Slices** | Architecture | `STANDARD` | Co-locate domain logic inside `features/<name>/` slices across Client and Server. |
| **07** | **Database Pragmas** | Persistence | `STANDARD` | SQLite engines must enable WAL mode, enforce foreign keys, and keep DDL in `schema.sql`. |
| **08** | **Static Web Assets** | Assets | `STANDARD` | Place uncompiled web assets in `client/public/`. Reference via root `/` URLs; never JS import. |
| **09** | **Path Independence** | Reliability | `CRITICAL` | Always resolve filesystem paths dynamically via `Path(__file__).resolve()`. |
| **10** | **Runner Automation** | Tooling | `STANDARD` | Run and manage micro-apps through root `npm run dev:*` scripts with automated port-kill. |

---

## 5. Developer Pre-Commit Audit Checklist

Before committing any code or submitting a PR, verify compliance:

- [ ] **`.gitignore` Verified**: Run `git status` to ensure `.env` and `.db` files are ignored and untracked.
- [ ] **`.env.example` Synchronized**: Any newly introduced environment variables are documented in `.env.example`.
- [ ] **Prefix Verified**: Client variables use `VITE_`; backend secrets do **NOT** use public prefixes.
- [ ] **Safe Fallbacks Configured**: Server starts gracefully in development even if non-critical external API keys are unset.
- [ ] **No Hardcoded Secrets**: Scanned code for hardcoded tokens, API keys, or private credentials.
- [ ] **Port Standards Respected**: Backend binds strictly to assigned port (`8000`–`8008`) and client binds to assigned port (`5173`–`5181`).
- [ ] **`metadata.json` Updated**: Required environment variables are registered in the project manifest's `configuration` array.
