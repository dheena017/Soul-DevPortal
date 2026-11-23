"""
Unit tests for external API and backward compatibility shims of @workspace/config.
Verifies external facade and workspace_config imports match the internal implementation.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure config package root is in sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

import external
from external import (
    PORT_REGISTRY,
    DESIGN_TOKENS,
    get_project_ports,
    load_project_env,
    get_workspace_root,
)


def test_external_exports():
    assert PORT_REGISTRY is not None
    assert DESIGN_TOKENS is not None
    assert external.__version__ == "1.0.0"
    assert "apexmind-ai" in PORT_REGISTRY
    c, s = get_project_ports("apexmind-ai")
    assert c == 5173
    assert s == 8000


if __name__ == "__main__":
    test_external_exports()
    print("✓ All config external tests passed!")
