"""
TypeScript AST & Export Parser.
Extracts interfaces, types, and exported functions.
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List


def parse_typescript_symbols(file_path: Path, relative_path: str) -> List[Dict[str, Any]]:
    """Extracts interfaces, types, and exported functions from TypeScript files."""
    symbols: List[Dict[str, Any]] = []
    try:
        content = file_path.read_text(encoding="utf-8")
    except Exception:
        return symbols

    lines = content.splitlines()

    for idx, line in enumerate(lines, start=1):
        trimmed = line.strip()

        # Interface detection: export interface Foo { ... }
        if_match = re.match(r"^(export\s+)?interface\s+([A-Za-z0-9_]+)", trimmed)
        if if_match:
            name = if_match.group(2)
            symbols.append({
                "language": "typescript",
                "kind": "interface",
                "name": name,
                "signature": trimmed.rstrip("{").strip(),
                "docstring": "",
                "line": idx,
                "file": relative_path,
                "methods": [],
            })
            continue

        # Type detection: export type Foo = ...
        type_match = re.match(r"^(export\s+)?type\s+([A-Za-z0-9_]+)\s*=", trimmed)
        if type_match:
            name = type_match.group(2)
            symbols.append({
                "language": "typescript",
                "kind": "type",
                "name": name,
                "signature": trimmed.rstrip(";").strip(),
                "docstring": "",
                "line": idx,
                "file": relative_path,
                "methods": [],
            })
            continue

        # Exported function detection: export function foo(...) or export const foo = (...) =>
        fn_match = re.match(r"^export\s+(async\s+)?function\s+([A-Za-z0-9_]+)\s*\((.*?)\)", trimmed)
        if fn_match:
            is_async = bool(fn_match.group(1))
            name = fn_match.group(2)
            params = fn_match.group(3)
            symbols.append({
                "language": "typescript",
                "kind": "function",
                "name": name,
                "signature": f"{'async ' if is_async else ''}function {name}({params})",
                "docstring": "",
                "isAsync": is_async,
                "line": idx,
                "file": relative_path,
                "methods": [],
            })

    return symbols
