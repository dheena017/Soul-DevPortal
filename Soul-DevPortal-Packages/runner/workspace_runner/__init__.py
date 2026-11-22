"""
Universal Process Supervisor and Fullstack Runner for Workspace (@workspace/runner / workspace-runner).
"""
from __future__ import annotations

__version__ = "1.0.0"

from .env import (
    get_env_summary,
    load_cascading_env,
    parse_env_file,
)
from .registry import (
    PROJECT_REGISTRY,
    detect_target_project,
    resolve_project_name,
)
from .stats import (
    format_process_stats_table,
)
from .installer import (
    inspect_project_install,
    print_installation_banner,
    run_project_installation,
)
from .supervisor import (
    ProcessController,
    enable_process_sandboxing,
    enable_windows_kill_on_close,
    ensure_port_free,
    find_next_free_port,
    is_port_in_use,
    kill_process_on_port,
    print_help_menu,
    print_hotkey_toolbar,
    run_dual_supervisor,
    run_single_process,
    wait_for_server_healthy,
)

__all__ = [
    "__version__",
    "PROJECT_REGISTRY",
    "detect_target_project",
    "resolve_project_name",
    "load_cascading_env",
    "get_env_summary",
    "parse_env_file",
    "format_process_stats_table",
    "inspect_project_install",
    "print_installation_banner",
    "run_project_installation",
    "ProcessController",
    "enable_process_sandboxing",
    "enable_windows_kill_on_close",
    "is_port_in_use",
    "kill_process_on_port",
    "find_next_free_port",
    "ensure_port_free",
    "wait_for_server_healthy",
    "print_hotkey_toolbar",
    "print_help_menu",
    "run_single_process",
    "run_dual_supervisor",
]
