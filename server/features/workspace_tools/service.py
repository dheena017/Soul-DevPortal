"""
SQLite-backed storage service for human productivity tools (tasks, notes, habits, bookmarks, scratchpad, focus).
"""

from __future__ import annotations

import json
from datetime import datetime, timezone
from typing import Any, Dict

from database.connection import get_db_connection
from shared.paths import DB_PATH

ALLOWED_NAMESPACES = frozenset({
    "tasks",
    "notes",
    "habits",
    "bookmarks",
    "scratchpad",
    "focus",
    "expenses",
    "goals",
    "catalog",
    "schedule",
    "checklists",
})

_DDL = """
CREATE TABLE IF NOT EXISTS user_workspace_state (
    namespace TEXT PRIMARY KEY,
    payload_json TEXT NOT NULL,
    updated_at TEXT NOT NULL
);
"""


def _ensure_table() -> None:
    with get_db_connection(DB_PATH) as conn:
        conn.execute(_DDL)
        conn.commit()


class WorkspaceToolsService:
    @staticmethod
    def validate_namespace(namespace: str) -> str:
        clean = (namespace or "").strip().lower()
        if clean not in ALLOWED_NAMESPACES:
            raise ValueError(f"Unsupported workspace tools namespace: {namespace}")
        return clean

    @classmethod
    def get_state(cls, namespace: str) -> Dict[str, Any]:
        ns = cls.validate_namespace(namespace)
        _ensure_table()
        with get_db_connection(DB_PATH) as conn:
            row = conn.execute(
                "SELECT payload_json, updated_at FROM user_workspace_state WHERE namespace = ?",
                (ns,),
            ).fetchone()
        if row is None:
            return {
                "namespace": ns,
                "exists": False,
                "data": None,
                "updatedAt": None,
            }
        try:
            parsed = json.loads(row["payload_json"])
        except Exception:
            parsed = None
        return {
            "namespace": ns,
            "exists": True,
            "data": parsed,
            "updatedAt": row["updated_at"],
        }

    @classmethod
    def save_state(cls, namespace: str, data: Any) -> Dict[str, Any]:
        ns = cls.validate_namespace(namespace)
        _ensure_table()
        now = datetime.now(timezone.utc).isoformat()
        payload = json.dumps(data, ensure_ascii=False)
        with get_db_connection(DB_PATH) as conn:
            conn.execute(
                """
                INSERT INTO user_workspace_state (namespace, payload_json, updated_at)
                VALUES (?, ?, ?)
                ON CONFLICT(namespace) DO UPDATE SET
                    payload_json = excluded.payload_json,
                    updated_at = excluded.updated_at
                """,
                (ns, payload, now),
            )
            conn.commit()
        return {
            "saved": True,
            "namespace": ns,
            "updatedAt": now,
        }

    @classmethod
    def get_summary(cls) -> Dict[str, Any]:
        _ensure_table()
        with get_db_connection(DB_PATH) as conn:
            rows = conn.execute(
                "SELECT namespace, payload_json, updated_at FROM user_workspace_state"
            ).fetchall()
        counts: Dict[str, Any] = {}
        for row in rows:
            try:
                parsed = json.loads(row["payload_json"])
                counts[row["namespace"]] = len(parsed) if isinstance(parsed, (list, dict)) else 1
            except Exception:
                counts[row["namespace"]] = 0
        return {
            "namespaces": sorted(ALLOWED_NAMESPACES),
            "counts": counts,
        }
