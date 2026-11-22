"""
CLI tool and argparse inspector for runner executable scripts.
"""

from __future__ import annotations

import ast
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


def inspect_cli_tool(file_path: Path, relative_path: str) -> Optional[Dict[str, Any]]:
    """Inspects a Python CLI executable script (e.g. runner/bin/*.py)."""
    try:
        content = file_path.read_text(encoding="utf-8")
        tree = ast.parse(content, filename=str(file_path))
        docstring = ast.get_docstring(tree) or ""

        flags: List[Dict[str, Any]] = []

        class CliVisitor(ast.NodeVisitor):
            def visit_Call(self, node: ast.Call):
                if isinstance(node.func, ast.Attribute) and node.func.attr == "add_argument":
                    flag_names = [ast.unparse(arg).strip("'\"") for arg in node.args if isinstance(arg, ast.Constant)]
                    kwargs = {kw.arg: ast.unparse(kw.value) for kw in node.keywords if kw.arg}

                    long_flag = next((f for f in flag_names if f.startswith("--")), None)
                    short_flag = next((f for f in flag_names if f.startswith("-") and not f.startswith("--")), None)

                    if long_flag or short_flag:
                        flags.append({
                            "flag": long_flag or short_flag or "",
                            "short": short_flag,
                            "type": kwargs.get("type", "string"),
                            "defaultValue": kwargs.get("default", "None"),
                            "description": kwargs.get("help", "").strip("'\""),
                        })
                self.generic_visit(node)

        CliVisitor().visit(tree)

        # Standard runner flags fallback detection
        if "--kill-port" in content and not any(f["flag"] == "--kill-port" for f in flags):
            flags.append({
                "flag": "--kill-port",
                "short": None,
                "type": "boolean",
                "defaultValue": "false",
                "description": "Automatically terminate conflicting processes occupying service ports",
            })

        if "--project" in content and not any(f["flag"] == "--project" for f in flags):
            flags.append({
                "flag": "--project",
                "short": "-p",
                "type": "string",
                "defaultValue": "None",
                "description": "Explicit target project slug or directory name",
            })

        return {
            "name": file_path.name,
            "relativePath": relative_path,
            "description": docstring,
            "flags": flags,
            "usage": f"python packages/{relative_path} [--kill-port]",
        }
    except Exception as exc:
        print(f"Warning: Failed to inspect CLI tool {relative_path}: {exc}", file=sys.stderr)
        return None
