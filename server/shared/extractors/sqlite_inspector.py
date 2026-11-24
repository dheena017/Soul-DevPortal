"""
SQLite Database & Schema Inspector.
Extracts DDL tables from schema.sql and live table schemas from {project}.db.
"""

from __future__ import annotations

import sqlite3
from pathlib import Path
from typing import Any, Dict, List


def inspect_sqlite_database(server_dir: Path, project_name: str) -> Dict[str, Any]:
    """Inspects project schema.sql and connects in read-only mode to {project}.db to extract tables."""
    result: Dict[str, Any] = {
        "dbPath": f"server/data/{project_name}.db",
        "dbEngine": "SQLite (WAL Mode)",
        "schemaSql": "",
        "tables": [],
        "tableDetails": [],
        "existsOnDisk": False,
    }

    # 1. Read schema.sql
    schema_sql_path = server_dir / "database" / "schema.sql"
    if not schema_sql_path.exists():
        schema_sql_path = server_dir / "data" / "schema.sql"

    if schema_sql_path.exists():
        try:
            result["schemaSql"] = schema_sql_path.read_text(encoding="utf-8")
        except Exception:
            pass

    # 2. Inspect active .db file
    db_file = server_dir / "data" / f"{project_name}.db"
    if not db_file.exists():
        # Fallback common name check
        db_candidates = list((server_dir / "data").glob("*.db"))
        if db_candidates:
            db_file = db_candidates[0]

    if db_file.exists():
        result["existsOnDisk"] = True
        try:
            # Read-only URI connection
            uri = f"file:{db_file.resolve()}?mode=ro"
            conn = sqlite3.connect(uri, uri=True, timeout=2.0)
            cursor = conn.cursor()
            cursor.execute("SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%';")
            table_names = [row[0] for row in cursor.fetchall()]
            result["tables"] = table_names

            details = []
            for t in table_names:
                cursor.execute(f"PRAGMA table_info({t});")
                cols = cursor.fetchall()
                details.append({
                    "name": t,
                    "columns": [
                        {"cid": c[0], "name": c[1], "type": c[2], "notnull": bool(c[3]), "dflt_value": c[4], "pk": bool(c[5])}
                        for c in cols
                    ],
                })
            result["tableDetails"] = details
            conn.close()
        except Exception:
            pass

    return result
