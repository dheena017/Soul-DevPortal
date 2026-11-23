"""
Database & SQL Query Telemetry Logger (@workspace/logger/external).
Logs execution time, query syntax highlighting, and slow query warnings.
"""
from __future__ import annotations

import logging
import time
from typing import Any

from internal.colors import Colors
from internal.formatter import colorize_log_message

_db_logger = logging.getLogger("workspace.database")


def log_db_query(
    query: str,
    duration_ms: float = 0.0,
    rows: int | None = None,
    db_name: str = "sqlite",
) -> None:
    """Logs a database query with execution time, row counts, and slow query warnings."""
    clean_sql = " ".join(query.strip().split())
    if len(clean_sql) > 120:
        clean_sql = clean_sql[:120] + "..."

    colored_sql = colorize_log_message(clean_sql)

    if duration_ms >= 200.0:
        badge = f"{Colors.BG_RED} SLOW QUERY {Colors.RESET}"
        dur_str = f"{Colors.BRIGHT_RED}{duration_ms:.1f}ms{Colors.RESET}"
    elif duration_ms >= 50.0:
        badge = f"{Colors.BG_YELLOW} SLOW QUERY {Colors.RESET}"
        dur_str = f"{Colors.BRIGHT_YELLOW}{duration_ms:.1f}ms{Colors.RESET}"
    else:
        badge = ""
        dur_str = f"{Colors.BRIGHT_GREEN}{duration_ms:.1f}ms{Colors.RESET}"

    rows_str = f" │ {Colors.BRIGHT_CYAN}{rows} rows{Colors.RESET}" if rows is not None else ""
    alert_prefix = f"{badge} " if badge else ""

    msg = f"{alert_prefix}[{db_name.upper()}] {colored_sql} │ Time: {dur_str}{rows_str}"

    if duration_ms >= 200.0:
        _db_logger.warning(msg)
    else:
        _db_logger.info(msg)


class DBQueryTimer:
    """Context manager to measure and log database query duration."""

    def __init__(self, query: str, db_name: str = "sqlite"):
        self.query = query
        self.db_name = db_name
        self.start: float = 0.0
        self.rows: int | None = None

    def set_rows(self, count: int) -> None:
        self.rows = count

    def __enter__(self) -> DBQueryTimer:
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        duration_ms = (time.perf_counter() - self.start) * 1000
        log_db_query(self.query, duration_ms=duration_ms, rows=self.rows, db_name=self.db_name)


__all__ = [
    "DBQueryTimer",
    "log_db_query",
]
