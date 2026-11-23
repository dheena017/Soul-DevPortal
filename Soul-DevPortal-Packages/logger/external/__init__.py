"""
Public Unified Python Logging Interface for Workspace Micro-Applications (@workspace/logger/external).
Modular facade consolidating:
  - server_logger: 5-column ANSI terminal formatting & Uvicorn dictConfig
  - middleware: FastAPI / Starlette request logging middleware & init helper
  - banners: Double-line Unicode ASCII status banners for fullstack/client/server
  - ai_logger: AI inference metrics & telemetry tracker
  - db_logger: SQL / database query telemetry and slow query warnings
  - json_logger: Structured cloud JSON log formatter
  - supervisor: Process supervision, port checking, and dual runners
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure logger root package directory is in sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from .ai_logger import AITelemetryTracker, log_ai_call
from .banners import (
    Colors,
    get_local_lan_ip,
    print_backend_banner,
    print_frontend_banner,
    print_fullstack_banner,
    render_box,
)
from .db_logger import DBQueryTimer, log_db_query
from .json_logger import JsonFormatter, setup_json_logging
from .middleware import RequestLoggingMiddleware, init_app_logger
from .server_logger import (
    UniversalColoredFormatter,
    colorize_log_message,
    get_logger,
    get_uvicorn_log_config,
    setup_colored_logging,
)
from .supervisor import (
    enable_windows_kill_on_close,
    ensure_port_free,
    find_next_free_port,
    format_universal_line,
    get_process_name_by_pid,
    is_port_in_use,
    kill_process_on_port,
    run_dual_supervisor,
    run_single_process,
    wait_for_server_healthy,
)

__version__ = "1.0.0"

__all__ = [
    "__version__",
    # Colors & Presentation
    "Colors",
    "render_box",
    "get_local_lan_ip",
    # Banners
    "print_fullstack_banner",
    "print_frontend_banner",
    "print_backend_banner",
    # Server Logging
    "UniversalColoredFormatter",
    "colorize_log_message",
    "get_uvicorn_log_config",
    "setup_colored_logging",
    "get_logger",
    # Middleware
    "RequestLoggingMiddleware",
    "init_app_logger",
    # Structured JSON
    "JsonFormatter",
    "setup_json_logging",
    # Telemetry
    "log_ai_call",
    "AITelemetryTracker",
    "log_db_query",
    "DBQueryTimer",
    # Port & Process Supervision
    "enable_windows_kill_on_close",
    "ensure_port_free",
    "is_port_in_use",
    "kill_process_on_port",
    "find_next_free_port",
    "run_single_process",
    "run_dual_supervisor",
    "format_universal_line",
    "get_process_name_by_pid",
    "wait_for_server_healthy",
]
