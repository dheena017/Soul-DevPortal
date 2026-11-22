# @workspace/logger

**Package:** `@workspace/logger`

**Python distribution:** `workspace-logger`

**Python module:** `workspace_logger`

The logger package provides a consistent terminal logging experience for the Workspace monorepo. It includes TypeScript browser logging, a Vite terminal bridge, Python ANSI formatters, FastAPI/Starlette request middleware, and terminal banners.

## Features

- Standard 5-column ANSI log format for Python and Node.js services
- Browser console badges, route tracing, state changes, and event logging
- Sensitive-value masking for passwords, tokens, cookies, API keys, and authorization headers
- Automatic `window.fetch` network tracing with latency & status code formatting
- In-memory ring buffer (up to 300 logs) with direct browser JSON export
- Breadcrumbs tracking for debugging unhandled errors and user workflows
- Node.js & Express / Fastify 5-column request logging middleware
- Vite HMR forwarding for browser logs with strict ANSI terminal output
- Structured JSON logging (`JsonFormatter`) for Docker, Kubernetes, and Cloud Logging
- AI & LLM telemetry logger (`log_ai_call`, `AITelemetryTracker`) for Gemini/Claude/GPT
- Database & slow query alerting (`log_db_query`, `DBQueryTimer`)
- LAN and localhost Unicode box-drawing startup banners
- Windows Job Object auto-kill on process exit and port conflict auto-recovery

## Package Structure

```text
logger/
├── package.json
├── pyproject.toml
├── setup.py
├── README.md
├── src/
│   ├── index.ts
│   ├── client.ts
│   └── vite-plugin.ts
└── workspace_logger/
    ├── __init__.py
    ├── banners.py
    ├── server_logger.py
    └── supervisor.py
```

## Installation

### TypeScript or JavaScript

The package is available through the monorepo npm workspaces:

```powershell
npm install
```

It can then be imported as `@workspace/logger`.

### Python

Install it in editable mode from the monorepo root:

```powershell
pip install -e packages/logger
```

This package requires Python 3.11 or newer and is installed with FastAPI and Starlette dependencies.

## TypeScript API

Import the main logger:

```typescript
import { consoleLogger } from '@workspace/logger';

consoleLogger.info('AUTH', 'Session restored');
consoleLogger.action('ROUTER', 'Navigation requested');
consoleLogger.warn('CACHE', 'Cache entry is stale');
consoleLogger.error('API', 'Request failed');
```

Available methods include:

| Method | Purpose |
| --- | --- |
| `log(level, module, message, detail?)` | Write a structured console log |
| `info(module, message, detail?)` | Write an informational log |
| `action(module, message, detail?)` | Write a user or application action |
| `success(module, message, detail?)` | Write a success message using an informational badge |
| `warn(module, message, detail?)` | Write a warning |
| `error(module, message, detail?)` | Write an error |
| `state(module, stateName, prev, next)` | Log a reactive state transition |
| `event(module, eventName, payload?)` | Log a user or business event |
| `attachFetchInterceptor()` | Automatically trace all outbound `fetch()` calls with latency and masking |
| `breadcrumb(category, message, data?)` | Record an in-memory breadcrumb for diagnostics |
| `getHistory()` | Retrieve ring-buffered log history (up to 300 entries) |
| `downloadLogs(filename?)` | Export current logs & breadcrumbs as a downloadable JSON file |
| `setLevel(level)` | Filter console output (`DEBUG` • `INFO` • `ACTION` • `WARN` • `ERROR` • `SILENT`) |
| `group(title, fn, collapsed?)` | Group related logs in browser console |
| `api(method, endpoint, status, duration, detail?)` | Log an HTTP API result |
| `apiSent(method, url)` | Log an outgoing request |
| `apiComing(method, url, status, duration, err?)` | Log an HTTP response |
| `nav(from, to)` | Log route navigation |
| `time(label)` | Start a browser performance timer |
| `timeEnd(label, module?)` | Finish a timer and log its duration |
| `table(module, data)` | Log a record count and display a browser table |
| `installGlobalErrorHandlers()` | Capture window and promise errors |
| `printDevBanner()` | Print the client logger banner |

The default export is `consoleLogger`.

## Sensitive Data Masking

Browser details are masked before console output or forwarding. Matching object keys are replaced with `********`, and base64 media and long strings are shortened.

```typescript
consoleLogger.info('AUTH', 'Payload received', {
  username: 'alex',
  password: 'secret123',
  token: 'private-token',
});
```

The resulting log contains the username but masks the password and token values.

## Vite Integration

Register the Vite plugin to forward browser logs to the server terminal:

```typescript
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { workspaceLoggerPlugin } from '@workspace/logger/vite';

export default defineConfig({
  plugins: [
    react(),
    workspaceLoggerPlugin(),
  ],
});
```

The plugin:

1. Accepts Vite HMR messages on `workspace:client-log`.
2. Also listens on `client:log`.
3. Provides a `POST /__client_log` fallback endpoint.
4. Prints received events as `[CLIENT_LOG] LEVEL|MODULE|MESSAGE`.

Custom options are available:

```typescript
workspaceLoggerPlugin({
  channel: 'my-app:client-log',
  tag: '[BROWSER]',
});
```

The browser logger sends to Vite HMR first and falls back to `/__client_log` when HMR is unavailable.

## Python API

Configure logging and HTTP middleware:

```python
from fastapi import FastAPI
from workspace_logger import (
    RequestLoggingMiddleware,
    init_app_logger,
)

app = FastAPI(title="Order Service")

init_app_logger(
    app,
    title="ORDER SERVICE",
    port=8005,
)
```

`init_app_logger()` configures the formatter and middleware and prints a startup banner. It also accepts scope and host values depending on the application setup.

For manual setup:

```python
from fastapi import FastAPI
from workspace_logger import (
    RequestLoggingMiddleware,
    setup_server_logging,
)

setup_server_logging()

app = FastAPI()
app.add_middleware(RequestLoggingMiddleware)
```

## Python Exports

The package re-exports these commonly used APIs:

### Banners

- `Ansi`
- `render_box`
- `get_local_lan_ip`
- `print_fullstack_banner`
- `print_frontend_banner`
- `print_backend_banner`
- `print_startup_banner`

### Server Logging

- `UniversalColoredFormatter`
- `ColoredFormatter`
- `RequestLoggingMiddleware`
- `UvicornNoiseFilter`
- `colorize_log_message`
- `get_uvicorn_log_config`
- `setup_server_logging`
- `setup_colored_logging`
- `init_app_logger`
- `get_logger`

### Process Helpers

- `enable_windows_kill_on_close`
- `is_port_in_use`
- `kill_process_on_port`
- `find_next_free_port`
- `ensure_port_free`
- `wait_for_server_healthy`
- `format_universal_line`
- `run_single_process`
- `run_dual_supervisor`

## Terminal Banners

Print a fullstack, frontend, or backend banner:

```python
from workspace_logger import (
    print_fullstack_banner,
    print_frontend_banner,
    print_backend_banner,
)

print_fullstack_banner(
    title="ORDER APPLICATION",
    frontend_port=5173,
    backend_port=8005,
)

print_frontend_banner(
    title="ORDER FRONTEND",
    port=5173,
)

print_backend_banner(
    title="ORDER API",
    port=8005,
)
```

The banners display localhost URLs, network URLs where available, backend paths, database and AI details supplied by the caller, and system information.

## 5-Column Python Format

Python service logs use this layout:

```text
[HH:MM:SS] [SCOPE   ] [ LEVEL ] [MODULE-TAG    ] MESSAGE
```

Example:

```python
import logging
from workspace_logger import setup_server_logging

setup_server_logging()

logger = logging.getLogger("api.database")
logger.info("Connected in 184ms")
logger.warning("Retrying database connection")
```

Color can be controlled with standard terminal environment behavior and the package logging configuration.

## HTTP Middleware

`RequestLoggingMiddleware`:

- Adds an `X-Request-ID` response header
- Uses an existing request ID header when one is supplied
- Records request method, path, status, and elapsed time
- Masks sensitive headers in the log output
- Categorizes response latency and status values

Register it after creating the FastAPI or Starlette application:

```python
app.add_middleware(RequestLoggingMiddleware)
```

## Subpath Exports

The npm package exposes two subpaths:

```typescript
import { consoleLogger } from '@workspace/logger';
import { consoleLogger as clientLogger } from '@workspace/logger/client';
import { workspaceLoggerPlugin } from '@workspace/logger/vite';
```

The `@workspace/logger` root re-exports the client logger and Vite plugin exports.

## Development

Check the TypeScript source:

```powershell
npm run typecheck -w @workspace/logger
```

Verify Python imports:

```powershell
python -c "import workspace_logger; print(workspace_logger.__version__)"
```

## License

MIT
