"""
FastAPI Router Inspector.
Extracts declared HTTP endpoints, paths, methods, and docstrings from project router files.
"""

from __future__ import annotations

import ast
from pathlib import Path
from typing import Any, Dict, List


def inspect_fastapi_routers(server_dir: Path) -> List[Dict[str, Any]]:
    """Walks a project's server directory and parses all FastAPI @router and @app decorators."""
    endpoints: List[Dict[str, Any]] = []
    if not server_dir.is_dir():
        return endpoints

    candidate_files = []
    for py_file in sorted(server_dir.rglob("*.py")):
        if any(ignored in py_file.parts for ignored in ("tests", "test", "scripts", "venv", ".venv", "__pycache__", "migrations")):
            continue
        candidate_files.append(py_file)

    seen = set()
    for rf in candidate_files:
        try:
            source = rf.read_text(encoding="utf-8")
            tree = ast.parse(source, filename=str(rf))
        except Exception:
            continue

        for node in ast.walk(tree):
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for dec in node.decorator_list:
                    # Match @router.get('/path'), @router.post(...), @app.get(...), @api_router.get(...)
                    if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                        method = dec.func.attr.upper()
                        if method in {"GET", "POST", "PUT", "DELETE", "PATCH", "WEBSOCKET"}:
                            route_path = "/api"
                            if dec.args and isinstance(dec.args[0], ast.Constant):
                                route_path = str(dec.args[0].value)

                            key = f"{method}:{route_path}"
                            if key in seen:
                                continue
                            seen.add(key)

                            docstring = ast.get_docstring(node) or ""
                            
                            # Derive group from router file path and route path
                            rel_parts = rf.relative_to(server_dir).parts
                            meaningful = [p for p in rel_parts[:-1] if p not in ("features", "api", "app", "router", "routers", "endpoints")]
                            group = " ".join(meaningful).replace("_", " ").replace("-", " ").title() if meaningful else "General"
                            
                            if group == "General" or group == "Workspace":
                                path_parts = route_path.strip("/").split("/")
                                if len(path_parts) >= 3 and path_parts[0] == "api":
                                    group = f"{path_parts[1].title()} · {path_parts[2].replace('-', ' ').title()}"
                                elif len(path_parts) >= 2 and path_parts[0] == "api":
                                    group = path_parts[1].replace("-", " ").title()

                            endpoints.append({
                                "method": method,
                                "path": route_path,
                                "handler": node.name,
                                "summary": docstring.split("\n")[0].strip() if docstring else node.name.replace("_", " ").capitalize(),
                                "description": docstring,
                                "isAsync": isinstance(node, ast.AsyncFunctionDef),
                                "group": group,
                                "file": rf.name,
                            })

    return endpoints
