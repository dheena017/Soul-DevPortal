"""
Soul Workspace - Shared Configuration Package (workspace_config)
Dual-runtime configuration presets, canonical port topology, and design tokens.
"""

from __future__ import annotations

from .ports import (
    PORT_REGISTRY,
    MONOREPO_PROJECTS,
    get_project_ports,
    get_project_config,
    get_all_ports,
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

__version__ = "1.0.0"

__all__ = [
    "PORT_REGISTRY",
    "MONOREPO_PROJECTS",
    "get_project_ports",
    "get_project_config",
    "get_all_ports",
    "DESIGN_TOKENS",
    "BRAND_COLORS",
    "SURFACE_COLORS",
    "ACCENT_COLORS",
    "load_project_env",
    "get_workspace_root",
    "__version__",
]
