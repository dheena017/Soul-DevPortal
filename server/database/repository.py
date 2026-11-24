"""
Database Repository Layer.
Handles DDL initialization and transactional persistence for projects, packages, symbols, docs, and telemetry.
"""

from __future__ import annotations

import json
import sqlite3
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from database.connection import get_db_connection


class DatabaseRepository:
    def __init__(self, db_path: Path, schema_path: Path):
        self.db_path = db_path
        self.schema_path = schema_path
        self.init_schema()

    def init_schema(self) -> None:
        """Executes schema.sql DDL to ensure all tables exist."""
        if not self.schema_path.exists():
            return
        sql = self.schema_path.read_text(encoding="utf-8")
        with get_db_connection(self.db_path) as conn:
            conn.executescript(sql)
            conn.commit()

    def save_projects(self, projects: List[Dict[str, Any]]) -> None:
        """Upserts all projects into the projects table."""
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection(self.db_path) as conn:
            for p in projects:
                conn.execute(
                    """
                    INSERT INTO projects (
                        id, name, title, frontend_port, backend_port,
                        framework, db_info, ai_engine, description,
                        features, api_endpoints, configuration, commands,
                        local_services, last_scanned_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        title = excluded.title,
                        frontend_port = excluded.frontend_port,
                        backend_port = excluded.backend_port,
                        framework = excluded.framework,
                        db_info = excluded.db_info,
                        ai_engine = excluded.ai_engine,
                        description = excluded.description,
                        features = excluded.features,
                        api_endpoints = excluded.api_endpoints,
                        configuration = excluded.configuration,
                        commands = excluded.commands,
                        local_services = excluded.local_services,
                        last_scanned_at = excluded.last_scanned_at
                    """,
                    (
                        p.get("id"),
                        p.get("name") or p.get("title", ""),
                        p.get("title") or p.get("name", ""),
                        p.get("frontendPort"),
                        p.get("backendPort"),
                        p.get("framework", ""),
                        p.get("dbInfo", ""),
                        p.get("aiEngine", ""),
                        p.get("description", ""),
                        json.dumps(p.get("features", [])),
                        json.dumps(p.get("apiEndpoints", [])),
                        json.dumps(p.get("configuration", []) or p.get("envKeys", [])),
                        json.dumps(p.get("commands", {}) or p.get("scripts", {})),
                        json.dumps(p.get("localServices", {})),
                        now,
                    ),
                )
            conn.commit()

    def save_packages(self, packages: List[Dict[str, Any]]) -> None:
        """Upserts packages and their extracted symbols."""
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection(self.db_path) as conn:
            for pkg in packages:
                pkg_id = pkg.get("id", "")
                conn.execute(
                    """
                    INSERT INTO packages (
                        id, name, version, description, relative_path,
                        language, symbols_count, file_count, lines_of_code,
                        size_bytes, manifests, last_scanned_at
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        name = excluded.name,
                        version = excluded.version,
                        description = excluded.description,
                        relative_path = excluded.relative_path,
                        language = excluded.language,
                        symbols_count = excluded.symbols_count,
                        file_count = excluded.file_count,
                        lines_of_code = excluded.lines_of_code,
                        size_bytes = excluded.size_bytes,
                        manifests = excluded.manifests,
                        last_scanned_at = excluded.last_scanned_at
                    """,
                    (
                        pkg_id,
                        pkg.get("name", ""),
                        pkg.get("version", "1.0.0"),
                        pkg.get("description", ""),
                        pkg.get("relativePath", ""),
                        pkg.get("language", ""),
                        pkg.get("stats", {}).get("symbolsCount", 0),
                        pkg.get("stats", {}).get("fileCount", 0),
                        pkg.get("stats", {}).get("linesOfCode", 0),
                        pkg.get("stats", {}).get("sizeBytes", 0),
                        json.dumps(pkg.get("manifests", {})),
                        now,
                    ),
                )

                # Delete and replace symbols for clean update
                conn.execute("DELETE FROM symbols WHERE package_id = ?", (pkg_id,))
                for sym in pkg.get("symbols", []):
                    file_ref = sym.get("file", "") or sym.get("filePath", "")
                    sym_id = f"{pkg_id}::{file_ref}::{sym.get('language')}::{sym.get('name')}::{sym.get('kind')}::{sym.get('line', 0)}"
                    conn.execute(
                        """
                        INSERT OR REPLACE INTO symbols (
                            id, package_id, language, kind, name,
                            signature, docstring, file_path, line_number,
                            is_async, methods
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            sym_id,
                            pkg_id,
                            sym.get("language", ""),
                            sym.get("kind", ""),
                            sym.get("name", ""),
                            sym.get("signature", ""),
                            sym.get("docstring", ""),
                            file_ref,
                            sym.get("line", 0),
                            1 if sym.get("isAsync") else 0,
                            json.dumps(sym.get("methods", [])),
                        ),
                    )
            conn.commit()

    def save_docs(self, docs: List[Dict[str, Any]]) -> None:
        """Upserts documentation guides."""
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection(self.db_path) as conn:
            for doc in docs:
                conn.execute(
                    """
                    INSERT INTO docs (
                        id, category, topic, tab, title,
                        relative_path, description, badge, headings, last_modified
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    ON CONFLICT(id) DO UPDATE SET
                        category = excluded.category,
                        topic = excluded.topic,
                        tab = excluded.tab,
                        title = excluded.title,
                        relative_path = excluded.relative_path,
                        description = excluded.description,
                        badge = excluded.badge,
                        headings = excluded.headings,
                        last_modified = excluded.last_modified
                    """,
                    (
                        doc.get("id"),
                        doc.get("category", ""),
                        doc.get("topic", ""),
                        doc.get("tab", ""),
                        doc.get("title", ""),
                        doc.get("relativePath", ""),
                        doc.get("description", ""),
                        doc.get("badge", ""),
                        json.dumps(doc.get("headings", [])),
                        doc.get("lastModified", now),
                    ),
                )
            conn.commit()

    def record_telemetry(self, stats: Dict[str, Any]) -> None:
        """Records a timestamped telemetry snapshot."""
        now = datetime.now(timezone.utc).isoformat()
        with get_db_connection(self.db_path) as conn:
            conn.execute(
                """
                INSERT INTO telemetry_snapshots (
                    scanned_at, total_projects, total_packages, total_docs,
                    total_files, total_lines, total_symbols, total_bytes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (
                    now,
                    stats.get("projectsCount", 0),
                    stats.get("packagesCount", 0),
                    stats.get("docsCount", 0),
                    stats.get("totalFiles", 0),
                    stats.get("totalLines", 0),
                    stats.get("totalSymbols", 0),
                    stats.get("totalBytes", 0),
                ),
            )
            conn.commit()
