"""
Soul Workspace - Environment Configuration & Workspace Directory Resolution.
"""

from __future__ import annotations

import os
from pathlib import Path
from typing import Dict, Optional


def get_workspace_root() -> Path:
    """Resolves the absolute root directory of the Soul Workspace monorepo."""
    current = Path(__file__).resolve().parent
    while current != current.parent:
        if (current / "Soul-DevPortal-Packages").exists() and (current / "package.json").exists():
            return current
        current = current.parent
    return Path(__file__).resolve().parent.parent.parent.parent


def load_project_env(project_id: str, env_file: Optional[str] = None) -> Dict[str, str]:
    """Loads and parses environment variables for a given project."""
    root = get_workspace_root()
    proj_dir = root / "Soul-DevPortal-Projects" / project_id
    target = proj_dir / (env_file or ".env")
    env_vars: Dict[str, str] = {}
    if target.exists():
        with open(target, "r", encoding="utf-8", errors="replace") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key, val = line.split("=", 1)
                    env_vars[key.strip()] = val.strip().strip("'\"")
    return env_vars
