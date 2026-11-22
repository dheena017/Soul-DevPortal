"""
Manifest reader for pyproject.toml and package.json files.
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Tuple

try:
    import tomllib
except ImportError:
    import tomli as tomllib  # type: ignore


def read_package_manifests(package_dir: Path) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """Reads and parses package.json and pyproject.toml from a package directory."""
    npm_manifest: Dict[str, Any] = {}
    pkg_json = package_dir / "package.json"
    if pkg_json.exists():
        try:
            npm_manifest = json.loads(pkg_json.read_text(encoding="utf-8"))
        except Exception:
            pass

    python_manifest: Dict[str, Any] = {}
    pyproject_file = package_dir / "pyproject.toml"
    if pyproject_file.exists():
        try:
            python_manifest = tomllib.loads(pyproject_file.read_text(encoding="utf-8"))
        except Exception:
            pass

    return npm_manifest, python_manifest
