"""
Public Unified Python Configuration Interface for Workspace (@workspace/config/external).
Exposes canonical port registry, design tokens, and environment loaders.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure config package root is in sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from internal.ports import (
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
from internal.tokens import (
    DESIGN_TOKENS,
    BRAND_COLORS,
    SURFACE_COLORS,
    ACCENT_COLORS,
)
from internal.env import (
    load_project_env,
    get_workspace_root,
)

__version__ = "1.0.0"

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
