"""
Soul Workspace - Core Internal Configuration (@workspace/config/internal).
Centralizes network topology, design tokens, and workspace environment handling.
"""

from __future__ import annotations

__version__ = "1.0.0"

from .ports import (
    PORT_REGISTRY,
    MONOREPO_PROJECTS,
    get_project_ports,
    get_project_config,
    get_all_ports,
    is_port_in_use,
    get_process_name_by_pid,
    find_process_on_port,
    kill_process_on_port,
    find_next_free_port,
)
from .tokens import (
    DESIGN_TOKENS,
    BRAND_COLORS,
    SURFACE_COLORS,
    ACCENT_COLORS,
)
from .env import (
    load_project_env,
    get_workspace_root,
)

__all__ = [
    "__version__",
    "PORT_REGISTRY",
    "MONOREPO_PROJECTS",
    "get_project_ports",
    "get_project_config",
    "get_all_ports",
    "is_port_in_use",
    "get_process_name_by_pid",
    "find_process_on_port",
    "kill_process_on_port",
    "find_next_free_port",
    "DESIGN_TOKENS",
    "BRAND_COLORS",
    "SURFACE_COLORS",
    "ACCENT_COLORS",
    "load_project_env",
    "get_workspace_root",
]
