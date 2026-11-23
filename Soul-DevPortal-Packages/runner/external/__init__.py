"""
Public CLI Launchers & Runners for Workspace (@workspace/runner/external).
"""
from __future__ import annotations

import sys
from pathlib import Path

_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from internal.supervisor import (
    ProcessController,
    enable_process_sandboxing,
    enable_windows_kill_on_close,
    ensure_port_free,
    find_next_free_port,
    format_universal_line,
    get_process_name_by_pid,
    is_port_in_use,
    kill_process_on_port,
    print_fullstack_dashboard,
    print_help_menu,
    print_hotkey_toolbar,
    print_single_tier_dashboard,
    run_dual_supervisor,
    run_single_process,
    wait_for_server_healthy,
)
from internal.registry import detect_target_project, find_workspace_root, load_workspace_registry
from internal.env import load_cascading_env
from internal.installer import inspect_project_install, print_installation_banner, run_project_installation
from internal.orchestrator import load_projects_manifest, print_master_banner, run_master_orchestrator

__version__ = "1.0.0"

__all__ = [
    "__version__",
    "run_master_orchestrator",
    "load_projects_manifest",
    "print_master_banner",
    "ProcessController",
    "run_dual_supervisor",
    "run_single_process",
    "ensure_port_free",
    "is_port_in_use",
    "kill_process_on_port",
    "find_next_free_port",
    "wait_for_server_healthy",
    "print_fullstack_dashboard",
    "print_single_tier_dashboard",
    "print_hotkey_toolbar",
    "print_help_menu",
    "format_universal_line",
    "enable_process_sandboxing",
    "enable_windows_kill_on_close",
    "detect_target_project",
    "find_workspace_root",
    "load_workspace_registry",
    "load_cascading_env",
    "inspect_project_install",
    "print_installation_banner",
    "run_project_installation",
]
