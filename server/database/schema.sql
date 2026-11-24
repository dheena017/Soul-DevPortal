PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;
PRAGMA synchronous = NORMAL;
PRAGMA busy_timeout = 5000;

-- 1. Projects Table
CREATE TABLE IF NOT EXISTS projects (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    title TEXT NOT NULL,
    frontend_port INTEGER,
    backend_port INTEGER,
    framework TEXT,
    db_info TEXT,
    ai_engine TEXT,
    description TEXT,
    features TEXT,          -- JSON array
    api_endpoints TEXT,     -- JSON array
    configuration TEXT,     -- JSON array of env keys
    commands TEXT,          -- JSON object
    local_services TEXT,    -- JSON object
    last_scanned_at TEXT
);

-- 2. Packages Table
CREATE TABLE IF NOT EXISTS packages (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    version TEXT,
    description TEXT,
    relative_path TEXT,
    language TEXT,
    symbols_count INTEGER DEFAULT 0,
    file_count INTEGER DEFAULT 0,
    lines_of_code INTEGER DEFAULT 0,
    size_bytes INTEGER DEFAULT 0,
    manifests TEXT,         -- JSON object (npm, python)
    last_scanned_at TEXT
);

-- 3. AST Symbols Table
CREATE TABLE IF NOT EXISTS symbols (
    id TEXT PRIMARY KEY,
    package_id TEXT NOT NULL,
    language TEXT NOT NULL,
    kind TEXT NOT NULL,
    name TEXT NOT NULL,
    signature TEXT,
    docstring TEXT,
    file_path TEXT,
    line_number INTEGER,
    is_async INTEGER DEFAULT 0,
    methods TEXT,           -- JSON array of method specs
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE CASCADE
);

-- 4. Documentation Guides Table
CREATE TABLE IF NOT EXISTS docs (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,
    topic TEXT,
    tab TEXT NOT NULL,
    title TEXT NOT NULL,
    relative_path TEXT NOT NULL,
    description TEXT,
    badge TEXT,
    headings TEXT,          -- JSON array
    last_modified TEXT
);

-- 5. Telemetry & Snapshots
CREATE TABLE IF NOT EXISTS telemetry_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scanned_at TEXT NOT NULL,
    total_projects INTEGER DEFAULT 0,
    total_packages INTEGER DEFAULT 0,
    total_docs INTEGER DEFAULT 0,
    total_files INTEGER DEFAULT 0,
    total_lines INTEGER DEFAULT 0,
    total_symbols INTEGER DEFAULT 0,
    total_bytes INTEGER DEFAULT 0
);

-- 6. Workspace Metadata Key-Value Store
CREATE TABLE IF NOT EXISTS workspace_metadata (
    key TEXT PRIMARY KEY,
    value TEXT,
    updated_at TEXT
);
