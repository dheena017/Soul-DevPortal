# Project Database Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: All persistence engines, SQLite databases, and repositories across the monorepo

---

## The 8 Inviolable Database Rules

### 1. SQLite WAL Mode is Mandatory
- **Rule**: Every SQLite connection must execute the following PRAGMAs immediately upon opening:
  ```sql
  PRAGMA journal_mode = WAL;
  PRAGMA synchronous = NORMAL;
  PRAGMA foreign_keys = ON;
  PRAGMA busy_timeout = 5000;
  ```
- **Rationale**: Write-Ahead Logging allows unlimited concurrent readers while write transactions execute, eliminating `database is locked` concurrency errors.

### 2. Isolated Storage in `server/data/`
- **Rule**: Database binary files must reside strictly inside `server/data/<project-name>.db`.
- **Prohibitions**:
  - Never place database files in `client/`, `src/`, or repository roots.
  - Never share a single SQLite file across multiple project boundaries (each microservice has its own isolated file).

### 3. Strict Git Exclusion
- **Rule**: Database binary and journal files must be completely ignored in `.gitignore`:
  ```gitignore
  server/data/*.db
  server/data/*.db-shm
  server/data/*.db-wal
  server/data/*.sqlite
  ```
- **Rule**: The `server/data/` directory must be preserved in version control using a `.gitkeep` file.

### 4. Declarative Schemas in Source Control
- **Rule**: Every database table, index, and trigger must be declaratively defined in a versioned SQL file:
  `server/database/schema.sql` (or SQLAlchemy ORM declarative models in `server/database/models.py`).

### 5. Foreign Key Integrity Enforced
- **Rule**: SQLite disables foreign key enforcement by default. Every connection factory must explicitly run `PRAGMA foreign_keys = ON;`. Deleting a parent row must adhere to defined `ON DELETE CASCADE` or `ON DELETE RESTRICT` constraints.

### 6. Busy Timeout & Connection Resilience
- **Rule**: All connection strings must set `busy_timeout = 5000` (5 seconds). If a write lock is held, callers will automatically wait up to 5000ms instead of immediately throwing an operational error.

### 7. Explicit Transactions & Safe Rollbacks
- **Rule**: Mutating multiple records must always occur inside a managed transaction context (`BEGIN ... COMMIT`).
- **Rule**: In Python, use context managers:
  ```python
  with conn:
      conn.execute(...)
  ```
  Any unhandled exception automatically issues a `ROLLBACK`.

### 8. Atomic Backup Protocols
- **Rule**: Never copy a live SQLite file using raw file copy (`cp` or `copy`) while the server is running, as it risks corrupting WAL frames. Use SQLite's online backup API:
  `sqlite3 server/data/<app>.db ".backup server/data/<app>_backup.db"`
