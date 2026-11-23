"""
Port & Subprocess Supervisor (@workspace/logger/external).
Provides process lifecycle management, port cleanup, and dual server runners.
"""
from __future__ import annotations

from internal.network import (
    find_next_free_port,
    is_port_in_use,
)
from internal.supervisor import (
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
    "enable_windows_kill_on_close",
    "ensure_port_free",
    "find_next_free_port",
    "format_universal_line",
    "get_process_name_by_pid",
    "is_port_in_use",
    "kill_process_on_port",
    "run_dual_supervisor",
    "run_single_process",
    "wait_for_server_healthy",
]
