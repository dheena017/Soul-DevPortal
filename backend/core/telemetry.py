"""
Workspace telemetry and code metrics calculator.
"""

from __future__ import annotations

from typing import Any, Dict, List


def compute_workspace_telemetry(packages: List[Dict[str, Any]], projects: List[Dict[str, Any]]) -> Dict[str, Any]:
    """Computes total files, lines of code, and symbol counts across all packages."""
    total_files = sum(p["stats"]["fileCount"] for p in packages)
    total_lines = sum(p["stats"]["linesOfCode"] for p in packages)
    total_symbols = sum(p["stats"]["symbolsCount"] for p in packages)
    total_bytes = sum(p["stats"]["sizeBytes"] for p in packages)

    return {
        "packagesCount": len(packages),
        "projectsCount": len(projects),
        "totalFiles": total_files,
        "totalLines": total_lines,
        "totalSymbols": total_symbols,
        "totalBytes": total_bytes,
    }
