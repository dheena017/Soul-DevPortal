"""
Package and project manifest reader (package.json and pyproject.toml).
"""

from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict


def read_json_manifest(file_path: Path) -> Dict[str, Any]:
    """Reads and parses a JSON manifest file."""
    if not file_path.is_file():
        return {}
    try:
        return json.loads(file_path.read_text(encoding="utf-8"))
    except Exception:
        return {}


def read_pyproject_toml(file_path: Path) -> Dict[str, Any]:
    """Extracts project name, version, and dependencies from pyproject.toml without external libraries."""
    if not file_path.is_file():
        return {}
    result: Dict[str, Any] = {"name": "", "version": "", "dependencies": []}
    try:
        content = file_path.read_text(encoding="utf-8")
        for line in content.splitlines():
            trimmed = line.strip()
            if trimmed.startswith("name ="):
                result["name"] = trimmed.split("=", 1)[1].strip().strip("'\"")
            elif trimmed.startswith("version ="):
                result["version"] = trimmed.split("=", 1)[1].strip().strip("'\"")
    except Exception:
        pass
    return result
