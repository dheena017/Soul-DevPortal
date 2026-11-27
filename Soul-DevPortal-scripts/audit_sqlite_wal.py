"""Audit all SQLite databases in the workspace for WAL journal mode and size."""

from __future__ import annotations

import argparse
import sqlite3
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP_PARTS = {"node_modules", ".git", ".venv", "venv"}


def find_databases(root: Path = ROOT) -> list[Path]:
    dbs: list[Path] = []
    for ext in ("*.db", "*.sqlite", "*.sqlite3"):
        for p in root.rglob(ext):
            if any(part in SKIP_PARTS for part in p.parts):
                continue
            dbs.append(p)
    return sorted(dbs)


def inspect_db(path: Path, enable_wal: bool = False) -> tuple[str, float]:
    conn = sqlite3.connect(str(path))
    try:
        if enable_wal:
            conn.execute("PRAGMA journal_mode=WAL;")
            conn.execute("PRAGMA synchronous=NORMAL;")
        mode = conn.execute("PRAGMA journal_mode;").fetchone()
        size_kb = round(path.stat().st_size / 1024, 1)
        return (str(mode[0]) if mode else "unknown", size_kb)
    finally:
        conn.close()


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit SQLite databases for WAL mode.")
    parser.add_argument("--enable-wal", action="store_true", help="Convert non-WAL databases to WAL mode.")
    args = parser.parse_args()

    dbs = find_databases()
    if not dbs:
        print("No SQLite database files found.")
        return 0

    for db in dbs:
        mode, size_kb = inspect_db(db, enable_wal=args.enable_wal)
        print(f"{db.relative_to(ROOT)} | mode={mode} | size={size_kb} KB")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
