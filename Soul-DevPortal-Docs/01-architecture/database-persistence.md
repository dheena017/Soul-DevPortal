# Database & Persistence Standards

## Architecture & Storage Rules
1. **Zero External Daemon Requirement**: For local development, projects must default to embedded databases (SQLite via `better-sqlite3`, `aiosqlite`, or SQLAlchemy).
2. **Database Storage Location**: SQLite database files must reside in `server/data/` or project root (e.g. `server/data/apexmind.db` or `hostel.db`).
3. **Declarative Schemas**: SQL tables must be defined in schema files (e.g. `database_schema.sql` or SQLAlchemy ORM classes) and committed to source control.
4. **Git Exclusion**: Actual database binary files (`*.db`, `*.sqlite`, `*.sqlite3`) must be ignored in `.gitignore`.

---

## Monorepo Persistence Specification
1. **SQLite Write-Ahead Logging (WAL)**:

   ```python
   conn = sqlite3.connect(DB_PATH)
   conn.execute("PRAGMA journal_mode = WAL;")
   conn.execute("PRAGMA synchronous = NORMAL;")
   conn.execute("PRAGMA foreign_keys = ON;")
   conn.execute("PRAGMA busy_timeout = 5000;")
   conn.row_factory = sqlite3.Row
   ```

2. **Dynamic Path Resolution**:

   ```python
   from pathlib import Path
   SERVER_ROOT = Path(__file__).resolve().parent.parent
   DATA_DIR = SERVER_ROOT / "data"
   DB_PATH = DATA_DIR / "<project-name>.db"
   ```

3. **Database Maintenance Commands**:

   ```bash
   # Inspect database tables:
   sqlite3 server/data/<project-name>.db ".tables"

   # Create atomic online backup:
   sqlite3 server/data/<project-name>.db ".backup server/data/<project-name>_backup.db"
   ```

---
