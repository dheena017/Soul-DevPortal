"""
Universal Workspace Logger Package (@workspace/logger / workspace-logger).
Provides high-visibility 5-column ANSI logging, Starlette/FastAPI request middleware,
Unicode box-drawing banners, LAN IP auto-discovery, and process supervision.
"""

from __future__ import annotations

__version__ = "1.0.0"

from .banners import (
    Ansi,
    render_box,
    get_local_lan_ip,
    print_fullstack_banner,
    print_frontend_banner,
    print_backend_banner,
    print_startup_banner,
)
from .server_logger import (
    Colors,
    UniversalColoredFormatter,
    ColoredFormatter,
    RequestLoggingMiddleware,
    UvicornNoiseFilter,
    colorize_log_message,
    get_uvicorn_log_config,
    setup_server_logging,
    setup_colored_logging,
    init_app_logger,
    get_logger,
)
from .supervisor import (
    enable_windows_kill_on_close,
    is_port_in_use,
    kill_process_on_port,
    find_next_free_port,
    ensure_port_free,
    wait_for_server_healthy,
    format_universal_line,
    run_single_process,
    run_dual_supervisor,
)

__all__ = [
    "__version__",
    # Banners & Presentation
    "Ansi",
    "render_box",
    "get_local_lan_ip",
    "print_fullstack_banner",
    "print_frontend_banner",
    "print_backend_banner",
    "print_startup_banner",
    # Server Logging
    "Colors",
    "UniversalColoredFormatter",
    "ColoredFormatter",
    "RequestLoggingMiddleware",
    "UvicornNoiseFilter",
    "colorize_log_message",
    "get_uvicorn_log_config",
    "setup_server_logging",
    "setup_colored_logging",
    "init_app_logger",
    "get_logger",
    # Process & Port Supervision
    "enable_windows_kill_on_close",
    "is_port_in_use",
    "kill_process_on_port",
    "find_next_free_port",
    "ensure_port_free",
    "wait_for_server_healthy",
    "format_universal_line",
    "run_single_process",
    "run_dual_supervisor",
]
