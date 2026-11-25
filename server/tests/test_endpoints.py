import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SERVER_DIR = Path(__file__).resolve().parent.parent
for p in (ROOT_DIR, SERVER_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

import sqlite3
import server
from fastapi.testclient import TestClient
from server.app.server import app
from server.shared.paths import DB_PATH

client = TestClient(app)

all_endpoints = [
    # Root & Portal
    ("GET", "/"),
    ("GET", "/api/soul-dev-portal/health"),
    ("GET", "/api/soul-dev-portal/commands"),
    ("GET", "/api/soul-dev-portal/overview"),
    
    # Dashboard
    ("GET", "/api/dashboard/overview"),
    ("GET", "/api/workspace"),

    # Computer & Performance
    ("GET", "/api/system/specs"),
    ("GET", "/api/system/live"),
    ("GET", "/api/system/live?window_sec=300"),
    ("GET", "/api/system/overview?window_sec=900"),
    
    # Projects
    ("GET", "/api/projects/navigation"),
    ("GET", "/api/projects/list-all"),
    ("GET", "/api/projects/apexmind-ai/health"),
    ("GET", "/api/projects/details/apexmind-ai/overview"),
    ("GET", "/api/projects/details/apexmind-ai/api"),
    ("GET", "/api/projects/details/apexmind-ai/database"),
    ("GET", "/api/projects/details/apexmind-ai/env"),
    ("GET", "/api/projects/details/apexmind-ai/scripts"),
    ("GET", "/api/projects/details/apexmind-ai/files"),
    ("GET", "/api/projects/details/apexmind-ai/readme"),
    
    # Packages
    ("GET", "/api/packages/navigation"),
    ("GET", "/api/packages/list-all"),
    ("GET", "/api/packages/details/runner/docs"),
    ("GET", "/api/packages/details/runner/api"),
    ("GET", "/api/packages/details/runner/manifest"),
    ("GET", "/api/packages/details/runner/playground"),
    
    # Docs
    ("GET", "/api/docs/navigation"),
    ("GET", "/api/docs/list-all"),
    ("GET", "/api/docs/details/01-project-architecture/main"),
    ("GET", "/api/docs/details/01-project-architecture/golden-rules"),
    ("GET", "/api/docs/details/02-packages-architecture/main"),
    ("GET", "/api/docs/details/02-packages-architecture/golden-rules"),
    ("GET", "/api/docs/details/03-networking-and-ports/main"),
    ("GET", "/api/docs/details/03-networking-and-ports/golden-rules"),
    ("GET", "/api/docs/details/04-cheatsheets/main"),
    ("GET", "/api/docs/details/04-cheatsheets/golden-rules"),
]

print("=== RUNNING FASTAPI ENDPOINT TESTS ===")
passed = 0
for method, url in all_endpoints:
    res = client.get(url)
    assert res.status_code == 200, f"FAILED {url} [{res.status_code}]: {res.text}"
    passed += 1
    print(f"[{res.status_code}] {method:<4} {url}")

print(f"\nEndpoint Tests: {passed}/{len(all_endpoints)} PASSED")

# Verify SSE streaming endpoint emits first live frame and closes cleanly
with client.stream("GET", "/api/system/stream?interval_ms=1000&window_sec=60&max_events=1") as stream_res:
    assert stream_res.status_code == 200
    assert "text/event-stream" in (stream_res.headers.get("content-type") or "")
    first_chunk = ""
    for line in stream_res.iter_lines():
        if line.startswith("data: "):
            first_chunk = line
            break
    assert '"windowSec":60' in first_chunk, f"Unexpected SSE payload: {first_chunk[:160]}"
print("[200] GET  /api/system/stream (SSE verified)")

# Verify SQLite DB
print("\n=== VERIFYING SQLITE DATABASE ===")
assert DB_PATH.exists(), f"DB not found at {DB_PATH}"
conn = sqlite3.connect(str(DB_PATH))
cur = conn.cursor()
tables = [r[0] for r in cur.execute("SELECT name FROM sqlite_master WHERE type='table'").fetchall()]
print(f"Tables in SQLite DB: {tables}")
for t in ["projects", "packages", "symbols", "docs", "telemetry_snapshots"]:
    count = cur.execute(f"SELECT COUNT(*) FROM {t}").fetchone()[0]
    print(f" - {t}: {count} rows")

journal_mode = cur.execute("PRAGMA journal_mode").fetchone()[0]
print(f"Journal Mode: {journal_mode}")
assert journal_mode.lower() == "wal", f"Expected WAL mode, got {journal_mode}"
conn.close()

print("\n==========================================")
print("SUCCESS: ALL ENDPOINTS & SQLITE WAL PASSED")
print("==========================================")
