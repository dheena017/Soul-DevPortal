"""
Internal Logging Engine & Foundational Machinery (@workspace/logger/internal).
This module contains internal formatters, ANSI escape styling, secret redactors,
network probers, Unicode box renderers, and process supervisors.
"""
from __future__ import annotations

from .colors import (
    Colors,
    enable_windows_ansi_mode,
    strip_ansi,
    supports_color,
)
from .sanitizer import (
    SENSITIVE_FIELD_NAMES,
    mask_secret,
    mask_sensitive_text,
    sanitize_headers,
)
from .formatter import (
    UniversalColoredFormatter,
    UvicornNoiseFilter,
    colorize_log_message,
)
from .network import (
    PORT_BACKEND_MAP,
    find_next_free_port,
    get_local_lan_ip,
    is_port_in_use,
    resolve_backend_port,
    should_suppress_child_banners,
)
from .box_renderer import (
    render_box,
)
from .supervisor import (
    enable_windows_kill_on_close,
    ensure_port_free,
    format_universal_line,
    get_process_name_by_pid,
    kill_process_on_port,
    run_dual_supervisor,
    run_single_process,
    wait_for_server_healthy,
)

__all__ = [
    # Colors & Terminal
    "Colors",
    "strip_ansi",
    "supports_color",
    "enable_windows_ansi_mode",
    # Sanitizer
    "SENSITIVE_FIELD_NAMES",
    "mask_secret",
    "mask_sensitive_text",
    "sanitize_headers",
    # Formatter
    "UniversalColoredFormatter",
    "UvicornNoiseFilter",
    "colorize_log_message",
    # Network
    "PORT_BACKEND_MAP",
    "get_local_lan_ip",
    "is_port_in_use",
    "find_next_free_port",
    "resolve_backend_port",
    "should_suppress_child_banners",
    # Box Renderer
    "render_box",
    # Supervisor
    "enable_windows_kill_on_close",
    "get_process_name_by_pid",
    "kill_process_on_port",
    "ensure_port_free",
    "wait_for_server_healthy",
    "format_universal_line",
    "run_single_process",
    "run_dual_supervisor",
]
