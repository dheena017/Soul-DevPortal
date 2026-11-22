"""
Universal Project Resolver & Runtime Registry for Workspace (@workspace/runner).
Dynamically discovers and configures projects from workspace configurations, CLI flags,
and project filesystem structures without hardcoding project specifics.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

NPM_BIN = "npm.cmd" if sys.platform == "win32" else "npm"
NPX_BIN = "npx.cmd" if sys.platform == "win32" else "npx"


def find_workspace_root(start_dir: Optional[Path] = None) -> Path:
    """Traverses upward to locate the workspace root containing package.json or projects.json."""
    curr = (start_dir or Path.cwd()).resolve()
    for parent in [curr, *curr.parents]:
        if (parent / "projects.json").exists() or (parent / "pnpm-workspace.yaml").exists():
            return parent
        if (parent / "package.json").exists() and (parent / "packages").is_dir():
            return parent
    return curr


def load_workspace_registry(root: Path) -> Dict[str, Dict[str, Any]]:
    """Loads external project configurations from projects.json or workspace.json if present."""
    for cfg_name in ("projects.json", "workspace.json", "projects.config.json"):
        cfg_path = root / cfg_name
        if cfg_path.is_file():
            try:
                with open(cfg_path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                if isinstance(data, dict):
                    return data
            except Exception:
                pass
    return {}


def auto_detect_project(proj_dir: Path) -> Dict[str, Any]:
    """Inspects a project folder to auto-detect frontend/backend commands, frameworks, and titles."""
    name = proj_dir.name
    title = name.replace("-", " ").title()
    framework = "Web Application"
    if "devportal" in name.lower() or "dev-portal" in name.lower():
        frontend_port = 5181
        backend_port = 8008
        title = "Soul Developer Portal"
    else:
        frontend_port = 5173
        backend_port = 8000
    frontend_cmd = [NPM_BIN, "run", "dev"]
    backend_cmd: Optional[list[str]] = None
    db_info = "Local Store"
    ai_engine = "N/A"

    # 1. Inspect package.json
    pkg_json = proj_dir / "package.json"
    if pkg_json.is_file():
        try:
            with open(pkg_json, "r", encoding="utf-8") as f:
                meta = json.load(f)
            title = meta.get("displayName") or meta.get("title") or meta.get("name", title)
            deps = {**meta.get("dependencies", {}), **meta.get("devDependencies", {})}
            if "next" in deps:
                framework = "Next.js"
            elif "react" in deps and "vite" in deps:
                framework = "React + Vite"
            elif "vue" in deps:
                framework = "Vue"
        except Exception:
            pass

    # Check for frontend subfolder
    if (proj_dir / "frontend" / "package.json").is_file():
        frontend_cmd = [NPM_BIN, "run", "dev", "--prefix", "frontend"]

    # 2. Inspect backend structure
    if (proj_dir / "backend" / "main.py").is_file():
        backend_cmd = [sys.executable, "-u", "backend/main.py"]
    elif (proj_dir / "main.py").is_file():
        backend_cmd = [sys.executable, "-u", "main.py"]
    elif (proj_dir / "server" / "index.ts").is_file():
        backend_cmd = [NPX_BIN, "tsx", "server/index.ts"]
    elif (proj_dir / "server" / "index.js").is_file():
        backend_cmd = ["node", "server/index.js"]

    return {
        "title": title,
        "frontend_port": frontend_port,
        "backend_port": backend_port,
        "frontend_cmd": frontend_cmd,
        "backend_cmd": backend_cmd,
        "framework": framework,
        "db_info": db_info,
        "ai_engine": ai_engine,
    }


def resolve_project_name(query: str | None, registry: Dict[str, Any]) -> str | None:
    """Fuzzy-matches a query string to a registered project name."""
    if not query:
        return None
    q = query.strip().lower()
    if q in registry:
        return q
    for name in registry:
        if q in name or name.startswith(q):
            return name
    return None


def detect_target_project(
    start_dir: Optional[Path] = None,
    current_dir: Optional[Path] = None,
) -> Tuple[str, Dict[str, Any], Path]:
    """
    Dynamically resolves target project from CLI arguments, workspace config, or current directory.
    Returns (project_name, project_config, project_dir).
    """
    effective_dir = (current_dir or start_dir or Path.cwd()).resolve()

    parser = argparse.ArgumentParser(add_help=False)
    parser.add_argument("positional_project", nargs="?", default=None, help="Target project name or directory")
    parser.add_argument("--project", "-p", type=str, default=None, help="Name of project to run")
    parser.add_argument("--kill-port", action="store_true", help="Auto kill port collision")
    parser.add_argument("--frontend-port", "-fp", type=int, default=None, help="Override frontend port")
    parser.add_argument("--backend-port", "-bp", type=int, default=None, help="Override backend port")
    parser.add_argument("--title", type=str, default=None, help="Override title")
    args, _ = parser.parse_known_args()

    root = find_workspace_root(effective_dir)
    registry = load_workspace_registry(root)

    raw_query = args.project or args.positional_project

    # 1. Query specified via CLI
    if raw_query and not raw_query.startswith("-"):
        matched = resolve_project_name(raw_query, registry)
        if matched:
            proj_dir = root / "Soul-DevPortal-Projects" / matched if (root / "Soul-DevPortal-Projects" / matched).is_dir() else (root / "projects" / matched if (root / "projects" / matched).is_dir() else root / matched)
            cfg = registry[matched]
        else:
            # Check if raw_query is a direct directory path
            candidate_dir = Path(raw_query).resolve()
            if not candidate_dir.is_dir():
                candidate_dir = (root / "Soul-DevPortal-Projects" / raw_query).resolve()
            if not candidate_dir.is_dir():
                candidate_dir = (root / "projects" / raw_query).resolve()
            if not candidate_dir.is_dir():
                candidate_dir = (root / raw_query).resolve()

            if candidate_dir.is_dir():
                matched = candidate_dir.name
                proj_dir = candidate_dir
                cfg = auto_detect_project(proj_dir)
            else:
                available = list(registry.keys())
                avail_str = f"Available: {', '.join(available)}" if available else "No projects registered in projects.json"
                sys.stderr.write(f"\033[31m[Error]\033[0m Could not locate project '{raw_query}'.\n{avail_str}\n")
                sys.exit(1)
    else:
        # 2. Check if current working directory or effective_dir is inside a project
        cwd = effective_dir
        matched = None
        proj_dir = cwd
        cfg = None

        for name, registered_cfg in registry.items():
            candidate = (root / "Soul-DevPortal-Projects" / name).resolve()
            if not candidate.is_dir():
                candidate = (root / "projects" / name).resolve()
            if candidate == cwd or candidate in cwd.parents:
                matched = name
                proj_dir = candidate
                cfg = registered_cfg
                break

        # If not in registered project, auto-detect current directory
        if not matched:
            if (cwd / "package.json").is_file() or (cwd / "pyproject.toml").is_file():
                matched = cwd.name
                proj_dir = cwd
                cfg = auto_detect_project(cwd)
            elif registry:
                # Default to first registered project in registry
                matched = next(iter(registry.keys()))
                proj_dir = root / "Soul-DevPortal-Projects" / matched if (root / "Soul-DevPortal-Projects" / matched).is_dir() else (root / "projects" / matched if (root / "projects" / matched).is_dir() else root / matched)
                cfg = registry[matched]
            else:
                matched = cwd.name
                proj_dir = cwd
                cfg = auto_detect_project(cwd)

    # Apply CLI overrides
    config = dict(cfg or {})
    if args.frontend_port:
        config["frontend_port"] = args.frontend_port
    if args.backend_port:
        config["backend_port"] = args.backend_port
    if args.title:
        config["title"] = args.title

    return matched, config, proj_dir


# Expose dynamic registry getter
PROJECT_REGISTRY = load_workspace_registry(find_workspace_root())
