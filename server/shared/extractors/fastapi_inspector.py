"""
FastAPI Router Inspector.
Extracts declared HTTP endpoints, paths, methods, and docstrings from project router files.
"""

from __future__ import annotations

import ast
import os
from pathlib import Path
from typing import Any, Dict, List, Optional


_IGNORED_ROUTER_DIRS = {
    "tests",
    "test",
    "scripts",
    "venv",
    ".venv",
    "__pycache__",
    "migrations",
    "data",
    "logs",
    "media",
    "image_cache",
    "node_modules",
    ".git",
    "dist",
    "build",
}


def _str_const(node: Optional[ast.AST]) -> Optional[str]:
    if isinstance(node, ast.Constant) and isinstance(node.value, str):
        return node.value
    return None


def _tags_list(node: Optional[ast.AST]) -> List[str]:
    if isinstance(node, (ast.List, ast.Tuple, ast.Set)):
        vals = []
        for el in node.elts:
            s = _str_const(el)
            if s:
                vals.append(s)
        return vals
    return []


def _join_route_paths(*parts: str) -> str:
    cleaned = [p.strip("/") for p in parts if p and p.strip("/")]
    if not cleaned:
        return "/"
    return "/" + "/".join(cleaned)


def _derive_clean_group(
    route_path: str,
    tags: List[str],
    rel_parts: tuple[str, ...],
) -> str:
    if tags:
        # Clean numbered prefixes like "01A. Creator Profile" cleanly only if needed; keep readable tag
        tag = tags[0].strip()
        if tag:
            return tag

    meaningful = [
        p
        for p in rel_parts[:-1]
        if p not in ("features", "api", "app", "router", "routers", "endpoints", "v1", "v2")
    ]
    if meaningful:
        return " · ".join(p.replace("_", " ").replace("-", " ").title() for p in meaningful)

    static_parts = [
        p
        for p in route_path.strip("/").split("/")
        if p and not (p.startswith("{") and p.endswith("}")) and p not in ("api", "v1", "v2")
    ]
    if len(static_parts) >= 2:
        return f"{static_parts[0].replace('-', ' ').title()} · {static_parts[1].replace('-', ' ').title()}"
    if len(static_parts) == 1:
        return static_parts[0].replace("-", " ").title()
    return "General"


def _resolve_import_target(base_mod: str, mod_spec: Optional[str], level: int, name: str, known_modules: set[str]) -> Optional[tuple[str, str]]:
    if level > 0:
        parts = base_mod.split(".")
        # Drop current module leaf; pop (level - 1) additional segments
        pkg_parts = parts[:-level] if len(parts) >= level else []
        if mod_spec:
            candidate_base = ".".join(pkg_parts + mod_spec.split("."))
        else:
            candidate_base = ".".join(pkg_parts)
    else:
        candidate_base = mod_spec or ""

    if candidate_base in known_modules:
        return (candidate_base, name)
    # Handle package import like `from server.features.auth import router` or `from .features.auth import router`
    with_init = f"{candidate_base}.__init__" if candidate_base else "__init__"
    if with_init in known_modules:
        return (with_init, name)
    sub_mod = f"{candidate_base}.{name}" if candidate_base else name
    if sub_mod in known_modules:
        return (sub_mod, "__module__")
    # Strip leading `server.` or similar container prefix if server_dir is already `server/`
    if "." in candidate_base:
        trimmed = candidate_base.split(".", 1)[1]
        if trimmed in known_modules:
            return (trimmed, name)
        if f"{trimmed}.{name}" in known_modules:
            return (f"{trimmed}.{name}", "__module__")
    return None


def inspect_fastapi_routers(server_dir: Path) -> List[Dict[str, Any]]:
    """Walks a project's server directory, resolves APIRouter prefixes/tags, and parses FastAPI endpoints."""
    endpoints: List[Dict[str, Any]] = []
    if not server_dir.is_dir():
        return endpoints

    candidate_files: List[Path] = []
    for root, dirs, files in os.walk(server_dir):
        dirs[:] = sorted(d for d in dirs if d not in _IGNORED_ROUTER_DIRS and not d.startswith("."))
        for fname in sorted(files):
            if fname.endswith(".py"):
                candidate_files.append(Path(root) / fname)

    parsed_modules: Dict[str, tuple[Path, ast.AST]] = {}
    raw_modules: List[tuple[str, Path]] = []
    for rf in candidate_files:
        try:
            source = rf.read_text(encoding="utf-8")
        except Exception:
            continue
        if (
            "@" not in source
            and "APIRouter" not in source
            and "FastAPI" not in source
            and "include_router" not in source
            and "API_" not in source
        ):
            continue
        try:
            tree = ast.parse(source, filename=str(rf))
        except Exception:
            continue
        rel = rf.relative_to(server_dir)
        mod_name = ".".join(rel.with_suffix("").parts)
        parsed_modules[mod_name] = (rf, tree)
        raw_modules.append((mod_name, rf))

    known_modules = set(parsed_modules.keys())

    # 1. Single AST walk per module: imports, constants, router defs, include_router calls, and raw decorated functions
    router_defs_raw: List[tuple[str, str, Optional[ast.AST], List[str]]] = []
    include_calls_raw: List[tuple[str, str, ast.AST, Optional[ast.AST], List[str]]] = []
    raw_routes: List[tuple[str, Path, ast.AST, ast.Call, str, str]] = []
    imports_map: Dict[tuple[str, str], tuple[str, str]] = {}
    str_constants: Dict[str, str] = {}

    def _resolve_prefix(node: Optional[ast.AST]) -> str:
        direct = _str_const(node)
        if direct is not None:
            return direct
        if isinstance(node, ast.Attribute) and node.attr in str_constants:
            return str_constants[node.attr]
        if isinstance(node, ast.Name) and node.id in str_constants:
            return str_constants[node.id]
        return ""

    for mod_name, (rf, tree) in parsed_modules.items():
        for node in ast.walk(tree):
            if isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    local_name = alias.asname or alias.name
                    resolved = _resolve_import_target(mod_name, node.module, node.level, alias.name, known_modules)
                    if resolved:
                        imports_map[(mod_name, local_name)] = resolved
            elif isinstance(node, ast.AnnAssign) and isinstance(node.target, ast.Name) and node.value is not None:
                val = _str_const(node.value)
                if val and val.startswith("/"):
                    str_constants.setdefault(node.target.id, val)
            elif isinstance(node, ast.Assign):
                if isinstance(node.value, ast.Call):
                    call = node.value
                    func_name = call.func.id if isinstance(call.func, ast.Name) else (call.func.attr if isinstance(call.func, ast.Attribute) else "")
                    if func_name in ("APIRouter", "FastAPI"):
                        kw = {k.arg: k.value for k in call.keywords if k.arg}
                        tags = _tags_list(kw.get("tags"))
                        for tgt in node.targets:
                            if isinstance(tgt, ast.Name):
                                router_defs_raw.append((mod_name, tgt.id, kw.get("prefix"), tags))
                else:
                    val = _str_const(node.value)
                    if val and val.startswith("/"):
                        for tgt in node.targets:
                            if isinstance(tgt, ast.Name):
                                str_constants.setdefault(tgt.id, val)
            elif isinstance(node, ast.Call) and isinstance(node.func, ast.Attribute) and node.func.attr == "include_router":
                if node.args and isinstance(node.func.value, ast.Name):
                    kw = {k.arg: k.value for k in node.keywords if k.arg}
                    include_calls_raw.append((mod_name, node.func.value.id, node.args[0], kw.get("prefix"), _tags_list(kw.get("tags"))))
            elif isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef)):
                for dec in node.decorator_list:
                    if isinstance(dec, ast.Call) and isinstance(dec.func, ast.Attribute):
                        method = dec.func.attr.upper()
                        if method in {"GET", "POST", "PUT", "DELETE", "PATCH", "WEBSOCKET"}:
                            router_var = dec.func.value.id if isinstance(dec.func.value, ast.Name) else "router"
                            raw_routes.append((mod_name, rf, node, dec, method, router_var))

    # Follow `__init__.py` re-exports cleanly (e.g., `from .router import router`)
    for (mod_name, sym), target in list(imports_map.items()):
        if target in imports_map and target != (mod_name, sym):
            imports_map[(mod_name, sym)] = imports_map[target]

    router_defs: Dict[tuple[str, str], Dict[str, Any]] = {
        (mod_name, var_name): {"prefix": _resolve_prefix(pref_node), "tags": tags}
        for mod_name, var_name, pref_node, tags in router_defs_raw
    }

    include_edges: Dict[tuple[str, str], List[tuple[tuple[str, str], str, List[str]]]] = {}
    for mod_name, parent_id, arg0, pref_node, inc_tags in include_calls_raw:
        child_key: Optional[tuple[str, str]] = None
        if isinstance(arg0, ast.Name):
            child_key = imports_map.get((mod_name, arg0.id), (mod_name, arg0.id))
        elif isinstance(arg0, ast.Attribute) and isinstance(arg0.value, ast.Name):
            mod_target = imports_map.get((mod_name, arg0.value.id))
            if mod_target:
                child_key = (mod_target[0], arg0.attr)
        if not child_key:
            continue
        if child_key in imports_map:
            child_key = imports_map[child_key]
        include_edges.setdefault(child_key, []).append(((mod_name, parent_id), _resolve_prefix(pref_node), inc_tags))

    def resolve_router_chain(key: tuple[str, str], visited: Optional[set[tuple[str, str]]] = None) -> tuple[str, List[str]]:
        if visited is None:
            visited = set()
        if key in visited:
            return ("", [])
        visited.add(key)
        local = router_defs.get(key, {})
        local_pref = local.get("prefix", "")
        local_tags = list(local.get("tags", []))

        parents = include_edges.get(key)
        if parents:
            parent_key, inc_pref, inc_tags = parents[0]
            p_pref, p_tags = resolve_router_chain(parent_key, visited)
            combined_pref = _join_route_paths(p_pref, inc_pref, local_pref)
            combined_tags = local_tags or inc_tags or p_tags
            return (combined_pref, combined_tags)
        return (_join_route_paths(local_pref), local_tags)

    # 2. Materialize routes with resolved prefixes, tags, and summaries
    seen = set()
    for mod_name, rf, node, dec, method, router_var in raw_routes:
        rel_parts = rf.relative_to(server_dir).parts
        rel_file = str(rf.relative_to(server_dir)).replace("\\", "/")
        raw_sub_path = _str_const(dec.args[0]) if dec.args else "/"
        if raw_sub_path is None:
            raw_sub_path = "/"

        router_pref, router_tags = resolve_router_chain((mod_name, router_var))
        full_path = _join_route_paths(router_pref, raw_sub_path)

        key = f"{method}:{full_path}"
        if key in seen:
            continue
        seen.add(key)

        kw = {k.arg: k.value for k in dec.keywords if k.arg}
        dec_summary = _str_const(kw.get("summary"))
        dec_desc = _str_const(kw.get("description"))
        dec_tags = _tags_list(kw.get("tags"))
        docstring = ast.get_docstring(node) or ""

        summary = dec_summary or (docstring.split("\n")[0].strip() if docstring else "")
        description = dec_desc or docstring
        tags = dec_tags or router_tags
        group = _derive_clean_group(full_path, tags, rel_parts)

        endpoints.append({
            "method": method,
            "path": full_path,
            "handler": node.name,
            "summary": summary,
            "description": description,
            "isAsync": isinstance(node, ast.AsyncFunctionDef),
            "group": group,
            "file": rel_file,
        })

    return endpoints
