# Soul Workspace — Web Portal Backend

FastAPI application server and modular Python AST extraction engine for the Soul Workspace portal.

---

## Directory Structure

```text
backend/
├── __init__.py                # Package version & metadata
├── main.py                    # Server & extraction CLI launcher
├── server.py                  # FastAPI application with CORS and middleware
│
├── api/                       # Modular REST API route controllers
│   ├── __init__.py            # Aggregated /api router
│   ├── workspace.py           # /api/workspace and /api/workspace/refresh
│   ├── packages.py            # /api/packages and /api/packages/{id}
│   ├── projects.py            # /api/projects with live socket port probing
│   ├── symbols.py             # /api/symbols with search and filtering
│   ├── cli_tools.py           # /api/cli-tools with argparse specs
│   ├── guides.py              # /api/guides (monorepo architecture blocks)
│   └── telemetry.py           # /api/telemetry (LOC and code metrics)
│
├── core/                      # Core configuration and services
│   ├── __init__.py
│   ├── paths.py               # Canonical path resolutions
│   ├── telemetry.py           # Aggregated metrics calculation
│   └── workspace_service.py   # In-memory service with live socket probes
│
├── extractors/                # Specialized AST and manifest parsers
│   ├── __init__.py
│   ├── ast_visitor.py         # Native Python AST parser (classes, methods, docstrings)
│   ├── cli_inspector.py       # runner/bin/*.py argument parser
│   ├── manifest_reader.py     # pyproject.toml & package.json inspector
│   ├── markdown_parser.py     # Structured markdown block converter
│   ├── preset_inspector.py    # Tailwind, ESLint, Prettier, Ruff presets
│   └── typescript_parser.py   # TypeScript interface and type extractor
│
├── models/                    # Typed schema definitions
│   ├── __init__.py
│   └── schemas.py             # Strong typing for symbols, packages, and projects
│
└── exporters/                 # Output persistence & datasets
    ├── __init__.py
    ├── json_exporter.py       # Atomic multi-dataset serializer
    │
    └── data/                  # Separated domain datasets
        ├── workspace.json     # Master unified workspace contract
        ├── packages.json      # Packages metadata and dependencies
        ├── symbols.json       # 59+ deep AST symbols
        ├── projects.json      # Consumer projects with assigned ports
        ├── cli_tools.json     # CLI executable specs and flags
        ├── guides.json        # Markdown AST blocks for guides
        └── telemetry.json     # Lines of code (4,184) and file counts
```

---

## Running the Backend

### Start Live FastAPI Server (Port 8008)
```powershell
python backend/main.py --port 8008 --reload
```
- **Interactive OpenAPI/Swagger Docs**: `http://127.0.0.1:8008/docs`
- **Health Check**: `http://127.0.0.1:8008/api/health`
- **Live Projects Status**: `http://127.0.0.1:8008/api/projects`

### Run Extraction Pipeline Only
```powershell
python backend/main.py --extract-only
```

---

## Consumed Monorepo Packages
1. **`@workspace/logger`** (`workspace_logger`):
   - `RequestLoggingMiddleware` for colored HTTP request logs.
   - `print_backend_banner` for ANSI terminal box presentation.
2. **`@workspace/runner`** (`workspace_runner`):
   - `is_port_in_use` for live TCP socket probing across ports `5173`–`5181` and `8000`–`8008`.
