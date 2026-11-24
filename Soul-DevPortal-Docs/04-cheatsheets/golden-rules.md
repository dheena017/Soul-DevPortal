# The 5 Golden Rules of Developer Commands & Workflows

> **Scope**: Monorepo CLI ergonomics, script standards & audit workflows  
> **Applies to**: Local development, CI automation, and workspace management

---

## 1. Always Run Workspace-Aware Commands from Monorepo Root

When executing multi-service commands (`dev`, `build`, `lint`), run them from the repository root through `@workspace/runner` or root npm scripts (e.g. `npm run dev:all`). Never start projects without port coordination.

## 2. Strict Port Isolation During Single-Project Runs

When working on an isolated child project (e.g. `Soul-DevPortal-Projects/apexmind-ai`), invoke the standard scripts:

- Frontend: `npm run dev:client` (binds strictly to assigned port, e.g. 5173).
- Backend: `npm run dev:server` (binds strictly to assigned port, e.g. 8000).
Never alter ports manually in code or command line without updating `projects.json`.

## 3. Pre-Commit Compliance Audit

Before pushing code or opening PRs, execute the compliance verification:

- `npm run lint` / `npm run typecheck`: Ensures zero TypeScript errors.
- Verify `metadata.json` matches actual ports and frameworks.
- Verify zero `.db` or `.env` files are staged in git status.

## 4. Immediate Zombie Process Termination

If a server fails to start with `EADDRINUSE` or `Address already in use`, do not change the port. Execute the socket cleanup script:

```powershell
Get-Process -Id (Get-NetTCPConnection -LocalPort <PORT>).OwningProcess | Stop-Process -Force
```

## 5. Idempotent Environment Setup

Ensure environment setup scripts (`npm run setup`, `pip install -r requirements.txt`) are idempotent and safe to run multiple times without corrupting local SQLite databases or overwriting configured `.env` files.
