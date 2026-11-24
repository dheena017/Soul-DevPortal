"""
Workspace telemetry and code metrics calculator.
"""

from __future__ import annotations

from typing import Any, Dict, List


def compute_workspace_telemetry(
    projects: List[Dict[str, Any]],
    packages: List[Dict[str, Any]],
    docs: List[Dict[str, Any]],
) -> Dict[str, Any]:
    """Computes total projects, packages, docs, files, lines of code, and symbols."""
    total_files = sum(p.get("stats", {}).get("fileCount", 0) for p in packages)
    total_lines = sum(p.get("stats", {}).get("linesOfCode", 0) for p in packages)
    total_symbols = sum(p.get("stats", {}).get("symbolsCount", 0) for p in packages)
    total_bytes = sum(p.get("stats", {}).get("sizeBytes", 0) for p in packages)

    return {
        "projectsCount": len(projects),
        "packagesCount": len(packages),
        "docsCount": len(docs),
        "totalFiles": total_files,
        "totalLines": total_lines,
        "totalSymbols": total_symbols,
        "totalBytes": total_bytes,
    }
