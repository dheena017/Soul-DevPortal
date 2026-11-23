"""
Universal Process Supervisor and Fullstack Runner for Workspace (@workspace/runner / workspace-runner).
"""
from __future__ import annotations

__version__ = "1.0.0"

from .builder import (
    audit_dist_output,
    run_project_build,
)
from .env import (
    get_env_summary,
    get_env_variable,
    load_cascading_env,
    parse_env_file,
)
from .installer import (
    inspect_project_install,
    print_completion_card,
    print_installation_banner,
    run_project_installation,
)
from .linter import (
    check_eslint_or_ts,
    check_python_syntax,
    run_project_lint,
)
from .orchestrator import (
    load_projects_manifest,
    print_master_banner,
    run_master_orchestrator,
)
from .registry import (
    PROJECT_REGISTRY,
    auto_detect_project,
    detect_target_project,
    find_workspace_root,
    load_workspace_registry,
    resolve_project_name,
)
from .stats import (
    format_process_stats_table,
)
from .supervisor import (
    ProcessController,
    enable_process_sandboxing,
    enable_windows_kill_on_close,
    ensure_port_free,
    find_next_free_port,
    format_universal_line,
    get_process_name_by_pid,
    is_port_in_use,
    kill_process_on_port,
    print_help_menu,
    print_hotkey_toolbar,
    print_fullstack_dashboard,
    print_single_tier_dashboard,
    run_dual_supervisor,
    run_single_process,
    wait_for_server_healthy,
)
from .typechecker import (
    find_tsc_command,
    locate_tsconfig,
    run_project_typecheck,
)

__all__ = [
    "__version__",
    "PROJECT_REGISTRY",
    "detect_target_project",
    "resolve_project_name",
    "find_workspace_root",
    "load_workspace_registry",
    "auto_detect_project",
    "load_cascading_env",
    "get_env_variable",
    "get_env_summary",
    "parse_env_file",
    "format_process_stats_table",
    "inspect_project_install",
    "print_installation_banner",
    "print_completion_card",
    "run_project_installation",
    "run_project_build",
    "audit_dist_output",
    "run_project_lint",
    "check_python_syntax",
    "check_eslint_or_ts",
    "run_project_typecheck",
    "locate_tsconfig",
    "find_tsc_command",
    "ProcessController",
    "enable_process_sandboxing",
    "enable_windows_kill_on_close",
    "is_port_in_use",
    "get_process_name_by_pid",
    "kill_process_on_port",
    "find_next_free_port",
    "ensure_port_free",
    "wait_for_server_healthy",
    "format_universal_line",
    "print_hotkey_toolbar",
    "print_help_menu",
    "print_fullstack_dashboard",
    "print_single_tier_dashboard",
    "run_single_process",
    "run_dual_supervisor",
    "load_projects_manifest",
    "print_master_banner",
    "run_master_orchestrator",
]
