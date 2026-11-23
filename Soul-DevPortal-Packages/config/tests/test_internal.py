"""
Unit tests for internal modules of @workspace/config (@workspace/config/internal).
Tests ports, design tokens, environment resolution, and process probing utilities.
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
    find_next_free_port,
    get_all_ports,
    get_project_config,
    get_project_ports,
    is_port_in_use,
)
from internal.tokens import (
    ACCENT_COLORS,
    BRAND_COLORS,
    DESIGN_TOKENS,
    SURFACE_COLORS,
)
from internal.env import (
    get_workspace_root,
    load_project_env,
)


def test_internal_ports():
    assert len(MONOREPO_PROJECTS) >= 9
    assert "devportal" in MONOREPO_PROJECTS
    c_port, s_port = get_project_ports("devportal")
    assert c_port == 5181
    assert s_port == 8008

    free_port = find_next_free_port(49152)
    assert free_port >= 49152
    assert not is_port_in_use(free_port)


def test_internal_tokens():
    assert "500" in BRAND_COLORS
    assert BRAND_COLORS["500"] == "#3b82f6"
    assert "900" in SURFACE_COLORS
    assert SURFACE_COLORS["900"] == "#121212"
    assert "brand" in DESIGN_TOKENS
    assert "surface" in DESIGN_TOKENS
    assert "accent" in DESIGN_TOKENS
    assert "font" in DESIGN_TOKENS


def test_internal_env():
    root = get_workspace_root()
    assert root.exists()
    assert (root / "Soul-DevPortal-Packages").exists()


if __name__ == "__main__":
    test_internal_ports()
    test_internal_tokens()
    test_internal_env()
    print("✓ All config internal tests passed!")
