"""
TypeScript and JavaScript interface, type, and function symbol extractor.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List


def parse_typescript_symbols(content: str, relative_path: str) -> List[Dict[str, Any]]:
    """Extracts TypeScript interfaces, types, and exported functions."""
    symbols: List[Dict[str, Any]] = []

    # Interfaces
    for match in re.finditer(r"export\s+interface\s+([A-Za-z0-9_$]+)(?:<[^>]+>)?(?:\s+extends\s+[^{]+)?\s*\{([\s\S]*?)\}", content):
        name = match.group(1)
        body = match.group(2)
        start_idx = match.start()
        line_num = content[:start_idx].count("\n") + 1

        properties = [
            line.strip().rstrip(";")
            for line in body.splitlines()
            if line.strip() and not line.strip().startswith(("//", "/*", "*"))
        ]

        symbols.append({
            "language": "typescript",
            "kind": "interface",
            "name": name,
            "signature": f"interface {name}",
            "docstring": "",
            "properties": properties,
            "file": relative_path,
            "line": line_num,
        })

    # Types
    for match in re.finditer(r"export\s+type\s+([A-Za-z0-9_$]+)(?:<[^>]+>)?\s*=\s*([^;]+);", content):
        name = match.group(1)
        type_def = match.group(2).strip()
        start_idx = match.start()
        line_num = content[:start_idx].count("\n") + 1

        symbols.append({
            "language": "typescript",
            "kind": "type",
            "name": name,
            "signature": f"type {name} = {type_def}",
            "docstring": "",
            "file": relative_path,
            "line": line_num,
        })

    # Functions
    for match in re.finditer(r"export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)\s*(?:<[^>]+>)?\s*\(([\s\S]*?)\)(?:\s*:\s*([^;{]+))?", content):
        name = match.group(1)
        params = re.sub(r"\s+", " ", match.group(2).strip())
        ret = match.group(3).strip() if match.group(3) else "void"
        start_idx = match.start()
        line_num = content[:start_idx].count("\n") + 1

        symbols.append({
            "language": "typescript",
            "kind": "function",
            "name": name,
            "signature": f"function {name}({params}): {ret}",
            "docstring": "",
            "file": relative_path,
            "line": line_num,
        })

    return symbols
