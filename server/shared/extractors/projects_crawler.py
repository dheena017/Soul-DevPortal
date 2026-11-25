"""
Projects Crawler and Navigation Tree Builder.
Discovers all projects in Soul-DevPortal-Projects/ and probes live TCP sockets.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import os
import socket
from pathlib import Path
from typing import Any, Dict, List

from shared.extractors.manifest_reader import read_json_manifest
from shared.extractors.fastapi_inspector import inspect_fastapi_routers
from shared.extractors.packages_crawler import _get_path_meta
from shared.paths import WORKSPACE_ROOT


def is_port_live(port: int, host: str = "127.0.0.1", timeout: float = 0.15) -> bool:
    """Performs non-blocking TCP socket connect to probe port health."""
    if not port or port <= 0:
        return False
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def crawl_projects(projects_root: Path, registry: Dict[str, Any]) -> List[Dict[str, Any]]:
    """Discovers all projects, reads metadata, and probes live socket states."""
    projects: List[Dict[str, Any]] = []
    if not projects_root.is_dir():
        return projects

    for proj_dir in sorted(projects_root.iterdir()):
        if not proj_dir.is_dir() or proj_dir.name.startswith(".") or proj_dir.name.startswith("__"):
            continue

        pid = proj_dir.name
        spec = registry.get(pid, {})
        meta = read_json_manifest(proj_dir / "metadata.json")
        pkg = read_json_manifest(proj_dir / "package.json")

        fe_port = spec.get("frontend_port") or (5173 + len(projects))
        be_port = spec.get("backend_port") or (8000 + len(projects))

        with ThreadPoolExecutor(max_workers=2) as pool:
            fe_future = pool.submit(is_port_live, fe_port)
            be_future = pool.submit(is_port_live, be_port)
            fe_live = fe_future.result()
            be_live = be_future.result()

        title = spec.get("title") or meta.get("name") or pid.replace("-", " ").title()
        description = meta.get("description") or spec.get("description", "")
        framework = spec.get("framework") or "React 19 + Vite 8 + Tailwind CSS v4"
        db_info = spec.get("db_info") or f"SQLite (server/data/{pid}.db)"
        ai_engine = meta.get("aiEngine") or spec.get("ai_engine") or "N/A"
        version = pkg.get("version") or meta.get("version") or "0.0.0"
        
        logo = ""
        png_logo = WORKSPACE_ROOT / "public" / "project-logos" / f"{pid}.png"
        svg_logo = WORKSPACE_ROOT / "public" / "project-logos" / f"{pid}.svg"
        if png_logo.is_file():
            logo = f"/project-logos/{pid}.png"
        elif svg_logo.is_file():
            logo = f"/project-logos/{pid}.svg"

        # Discover file tree for structure exploration with proper trailing slashes for directories
        file_tree = []
        dir_count = 0
        file_count = 0
        ignored_dirs = {"node_modules", ".git", "__pycache__", ".venv", "dist", ".vscode", ".vite", ".next"}
        for root, dirs, files in os.walk(proj_dir):
            dirs[:] = [d for d in dirs if d not in ignored_dirs and not (d.startswith(".") and d != ".env")]
            rel_root = Path(root).relative_to(proj_dir)
            rel_root_str = str(rel_root).replace("\\", "/")
            if rel_root_str != ".":
                file_tree.append(f"{rel_root_str}/")
                dir_count += 1
            for f in files:
                if f.endswith(".pyc") or f == ".DS_Store":
                    continue
                file_rel = f if rel_root_str == "." else f"{rel_root_str}/{f}"
                file_tree.append(file_rel)
                file_count += 1
        file_tree.sort()

        # Discover available tabs based on files
        tabs = [
            {"id": "overview", "label": "Overview", "hasData": True},
            {"id": "files", "label": "Files & Structure", "hasData": len(file_tree) > 0},
            {"id": "api", "label": "API Endpoints", "hasData": True},
            {"id": "database", "label": "Database", "hasData": True},
            {"id": "scripts", "label": "Scripts", "hasData": True},
            {"id": "env", "label": "Environment", "hasData": True},
            {"id": "readme", "label": "Documentation", "hasData": True},
        ]

        # Extract endpoints from FastAPI routers
        server_dir = proj_dir / "server"
        ast_endpoints = inspect_fastapi_routers(server_dir) if server_dir.is_dir() else []
        api_endpoints = [f"{ep['method']} {ep['path']}" for ep in ast_endpoints]
        if not api_endpoints and meta.get("apiEndpoints"):
            api_endpoints = meta.get("apiEndpoints", [])

        git_meta = _get_path_meta(proj_dir)

        projects.append({
            "id": pid,
            "slug": pid,
            "name": title,
            "title": title,
            "version": version,
            "logo": logo,
            "description": description,
            "frontendPort": fe_port,
            "backendPort": be_port,
            "framework": framework,
            "serverStack": spec.get("server_stack", "Python FastAPI + Uvicorn"),
            "dbInfo": db_info,
            "aiEngine": ai_engine,
            "features": meta.get("features", []),
            "apiEndpoints": api_endpoints,
            "rawEndpoints": ast_endpoints,
            "configuration": meta.get("configuration", []),
            "commands": meta.get("commands", {}),
            "localServices": meta.get("localServices", {}),
            "scripts": pkg.get("scripts", {}),
            "dependencies": pkg.get("dependencies", {}),
            "devDependencies": pkg.get("devDependencies", {}),
            "frontend": {"port": fe_port, "isLive": fe_live},
            "backend": {"port": be_port, "isLive": be_live},
            "tabs": tabs,
            "fileTree": file_tree,
            "tree": file_tree,
            "totalFiles": len(file_tree),
            "updatedAt": git_meta["updatedAt"],
            "relativeTime": git_meta["relativeTime"],
            "commitHash": git_meta["commitHash"],
        })

    return projects
