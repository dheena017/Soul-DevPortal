# Soul Workspace — Web Portal Backend Server

FastAPI application server for the Soul Workspace monorepo, running on dedicated Port **`8008`**.

---

## Architecture Standards

Adheres strictly to the **Universal Three-Pillar Standard** defined in `PROJECT_RULES.md`:
- **Pillar 2 (Server Stack)**: Python FastAPI + Uvicorn with asynchronous non-blocking handlers.
- **Pillar 3 (Persistence)**: Dedicated SQLite Write-Ahead Logging (`server/data/workspace.db`) with mandatory PRAGMA settings.
- **Domain Feature Slices**: Cleanly modularized into `features/dashboard/`, `features/soul_dev_portal/`, `features/projects/`, `features/packages/`, `features/docs/`.
- **Zero Hardcoded Data**: 100% live extraction from `Soul-DevPortal-Projects`, `Soul-DevPortal-Packages`, `Soul-DevPortal-Docs`, and root `package.json`.

---

## Directory Layout

```text
server/
├── app/                  # Application factory (factory.py), lifespan, CORS, server runtime
├── features/             # Dedicated domain feature slices
│   ├── dashboard/        # GET /api/dashboard/overview (consolidated all 3 domains)
│   ├── soul_dev_portal/  # GET /api/soul-dev-portal/commands, /health, /overview
│   ├── projects/         # /api/projects/navigation, list-all, {name}/health, details/{name}/{tab}
│   ├── packages/         # /api/packages/navigation, list-all, details/{name}/{tab}
│   └── docs/             # /api/docs/navigation, list-all, details/{category}/{topic}/{tab}
├── database/             # SQLite WAL connection factory, schema.sql, repository
├── data/                 # SQLite database storage (workspace.db)
├── shared/               # Dynamic paths, config, telemetry, and live extractors
│   └── extractors/       # ast_visitor, typescript_parser, markdown_parser, fastapi_inspector, etc.
├── main.py               # Unified CLI runner (--port 8008, --reload, --extract-only)
└── requirements.txt      # FastAPI, Uvicorn, Pydantic v2
```

---

## Running the Server

### Start Live Server (Port 8008)
```powershell
python server/main.py --port 8008 --reload
```
Interactive OpenAPI/Swagger documentation is available at `http://127.0.0.1:8008/docs`.

### Run Live Extraction Only
```powershell
python server/main.py --extract-only
```
