# Project Database Architecture — Technical Specification & Guide

> **Domain**: SQLite WAL Persistence Layer, Concurrency & Schema Management  
> **Applies to**: All micro-applications in `Soul-DevPortal-Projects/`

---

## 1. Architectural Blueprint: The Embedded WAL Engine

Every micro-application in the Soul Monorepo utilizes an autonomous, embedded SQLite database running with **Write-Ahead Logging (WAL)**. This architecture eliminates external database container dependencies while providing high-performance local persistence.

```
                     SQLITE WAL CONCURRENCY MODEL
 ┌─────────────────────────────────────────────────────────────┐
 │                       server/data/                          │
 │                                                             │
 │   ┌─────────────────┐       ┌─────────────┐ ┌─────────────┐ │
 │   │  <app>.db       │       │ <app>.db-wal│ │ <app>.db-shm│ │
 │   │  (Base Tables)  │       │ (Write Log) │ │(Shared Mem) │ │
 │   └────────┬────────┘       └──────┬──────┘ └──────┬──────┘ │
 └────────────┼───────────────────────┼───────────────┼────────┘
              │                       │               │
      ┌───────┴───────────────────────┴───────────────┴───────┐
      │               FastAPI Connection Pool                 │
      │ ┌──────────────────────┐   ┌────────────────────────┐ │
      │ │ Concurrent Reader 1  │   │  Concurrent Reader 2   │ │
      │ │ (Non-blocking SELECT)│   │  (Non-blocking SELECT) │ │
      │ └──────────────────────┘   └────────────────────────┘ │
      │ ┌───────────────────────────────────────────────────┐ │
      │ │ Single Serialized Writer (INSERT / UPDATE / MERGE)│ │
      │ └───────────────────────────────────────────────────┘ │
      └───────────────────────────────────────────────────────┘
```

---

## 2. Dynamic Database Path Resolution

To guarantee portability across Windows, Linux, and macOS environments without hardcoded system paths, projects must resolve the database directory dynamically relative to the module file.

### Implementation (`server/database/connection.py`)

```python
import sqlite3
from pathlib import Path
from typing import Generator

# Resolve server root dynamically: server/database/connection.py -> server/
SERVER_ROOT = Path(__file__).resolve().parent.parent
DATA_DIR = SERVER_ROOT / "data"
DB_PATH = DATA_DIR / "app.db"

def init_db_directory() -> None:
    """Ensure the persistence directory exists."""
    DATA_DIR.mkdir(parents=True, exist_ok=True)

def get_db_connection() -> sqlite3.Connection:
    """Create and configure a high-concurrency SQLite connection."""
    init_db_directory()
    conn = sqlite3.connect(
        str(DB_PATH),
        timeout=5.0,
        check_same_thread=False
    )
    # Enable WAL mode and performance pragmas
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA busy_timeout = 5000;")
    conn.row_factory = sqlite3.Row
    return conn

def get_db() -> Generator[sqlite3.Connection, None, None]:
    """FastAPI Dependency yield pattern."""
    conn = get_db_connection()
    try:
        yield conn
    finally:
        conn.close()
```

---

## 3. Asynchronous SQLite with `aiosqlite`

For high-throughput async endpoints, `aiosqlite` provides non-blocking access:

```python
import aiosqlite
from pathlib import Path

async def get_async_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode = WAL;")
        await db.execute("PRAGMA foreign_keys = ON;")
        db.row_factory = aiosqlite.Row
        yield db
```

---

## 4. Canonical DDL Schema Definition (`server/database/schema.sql`)

Every project maintains a canonical `schema.sql`:

```sql
-- server/database/schema.sql
PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL,
    sender TEXT NOT NULL CHECK(sender IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_messages_session ON messages(session_id);
```

---

## 5. Automated Bootstrap & Migration Logic

On application startup, the lifespan handler verifies and bootstraps tables:

```python
def bootstrap_database(conn: sqlite3.Connection) -> None:
    schema_file = SERVER_ROOT / "database" / "schema.sql"
    if schema_file.exists():
        with open(schema_file, "r", encoding="utf-8") as f:
            conn.executescript(f.read())
        print(f"[DATABASE] Schema initialized at {DB_PATH}")
```

---

## 6. Monorepo Database Distribution Matrix

| Project Name | Database File Path | Primary Entities |
|---|---|---|
| `apexmind-ai` | `server/data/apexmind.db` | Prompts, Audio Sessions, Transcripts |
| `outpass-system` | `server/data/outpass.db` | Outpass Requests, Approvals, Students, Wardens |
| `free-api-hub` | `server/data/free_api_hub.db` | Mock Endpoints, Route Definitions, Schemas |
| `sonikoma` | `server/data/sonikoma.db` | Video Projects, Voice Syntheses, Timeline Clips |
| `spatial-dimensions` | `server/data/spatial_dimensions.db` | 3D Scenes, Assets, Coordinate Transforms |
| `college-management-system` | `server/data/college_management.db` | Courses, Faculty, Grades, Attendance |
| `globalpulse-ai` | `server/data/globalpulse.db` | News Articles, Summaries, Sentiment Scores |
| `postcraft-ai` | `server/data/postcraft.db` | Social Posts, Templates, Scheduled Publishes |
| `devportal` | `backend/data/workspace.db` | Monorepo Projects, Health Audits, Port Allocations |
