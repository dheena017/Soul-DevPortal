"""
Projects Domain Service.
Handles projects discovery, navigation tree, socket probes, and granular per-tab content.
"""

from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor
import os
import threading
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from shared.paths import PROJECTS_ROOT, ROOT_PROJECTS_JSON
from shared.extractors.manifest_reader import read_json_manifest
from shared.extractors.projects_crawler import crawl_projects, is_port_live
from shared.extractors.fastapi_inspector import inspect_fastapi_routers
from shared.extractors.sqlite_inspector import inspect_sqlite_database
from shared.extractors.env_inspector import inspect_dual_environment
from shared.extractors.markdown_parser import parse_markdown_to_blocks


_SHARED_CACHE_LOCK = threading.Lock()
_SHARED_PROJECTS_CACHE: Dict[str, tuple[float, List[Dict[str, Any]]]] = {}


class ProjectService:
    _CACHE_TTL_SECONDS = 300.0

    def __init__(self, projects_root: Path = PROJECTS_ROOT):
        self.projects_root = projects_root

    def _get_registry(self) -> Dict[str, Any]:
        return read_json_manifest(ROOT_PROJECTS_JSON)

    def get_navigation(self) -> List[Dict[str, Any]]:
        """Returns the dynamic navigation tree of all projects with their available tabs."""
        projects = self.get_all_projects()
        return [
            {
                "id": p["id"],
                "name": p["name"],
                "title": p["title"],
                "ports": {"client": p["frontendPort"], "server": p["backendPort"]},
                "status": {"client": p["frontend"]["isLive"], "server": p["backend"]["isLive"]},
                "tabs": p["tabs"],
            }
            for p in projects
        ]

    def get_all_projects(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Returns all consumer projects with shared static AST cache and live TCP port probes."""
        cache_key = str(self.projects_root.resolve())
        now = time.monotonic()
        cached_projects: Optional[List[Dict[str, Any]]] = None

        with _SHARED_CACHE_LOCK:
            entry = _SHARED_PROJECTS_CACHE.get(cache_key)
            if not force_refresh and entry is not None and (now - entry[0]) < self._CACHE_TTL_SECONDS:
                cached_projects = entry[1]

        if cached_projects is not None:
            ports: List[int] = []
            for p in cached_projects:
                ports.append(p.get("frontendPort") or 0)
                ports.append(p.get("backendPort") or 0)
            with ThreadPoolExecutor(max_workers=12) as pool:
                live_flags = list(pool.map(is_port_live, ports))
            refreshed: List[Dict[str, Any]] = []
            for idx, proj in enumerate(cached_projects):
                fe_live = live_flags[idx * 2]
                be_live = live_flags[idx * 2 + 1]
                refreshed.append({
                    **proj,
                    "frontend": {"port": proj.get("frontendPort"), "isLive": fe_live},
                    "backend": {"port": proj.get("backendPort"), "isLive": be_live},
                })
            return refreshed

        with _SHARED_CACHE_LOCK:
            entry = _SHARED_PROJECTS_CACHE.get(cache_key)
            now = time.monotonic()
            if not force_refresh and entry is not None and (now - entry[0]) < self._CACHE_TTL_SECONDS:
                projects = entry[1]
            else:
                projects = crawl_projects(self.projects_root, self._get_registry())
                _SHARED_PROJECTS_CACHE[cache_key] = (time.monotonic(), projects)
        return projects

    def get_project_by_id(self, project_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single project's top-level metadata."""
        all_projs = self.get_all_projects()
        return next((p for p in all_projs if p["id"] == project_name or p["slug"] == project_name), None)

    def get_project_health(self, project_name: str) -> Dict[str, Any]:
        """Probes live socket reachability for a single project."""
        proj = self.get_project_by_id(project_name)
        if not proj:
            return {"id": project_name, "found": False}

        fe_port = proj.get("frontendPort", 0)
        be_port = proj.get("backendPort", 0)
        return {
            "id": project_name,
            "name": proj.get("name"),
            "frontend": {"port": fe_port, "isLive": is_port_live(fe_port)},
            "backend": {"port": be_port, "isLive": is_port_live(be_port)},
        }

    def get_tab_content(self, project_name: str, tab: str) -> Dict[str, Any]:
        """Serves specific tab data for a project without hardcoded data."""
        proj_dir = self.projects_root / project_name
        if not proj_dir.is_dir():
            return {"error": f"Project '{project_name}' not found on disk"}

        meta = read_json_manifest(proj_dir / "metadata.json")
        pkg = read_json_manifest(proj_dir / "package.json")

        if tab == "overview":
            readme_text = ""
            if (proj_dir / "README.md").is_file():
                readme_text = (proj_dir / "README.md").read_text(encoding="utf-8")[:300]
            return {
                "id": project_name,
                "name": meta.get("name") or project_name.replace("-", " ").title(),
                "description": meta.get("description") or readme_text,
                "features": meta.get("features", []),
                "techStack": meta.get("techStack", {}),
                "localServices": meta.get("localServices", {}),
                "commands": meta.get("commands", {}),
            }

        elif tab == "api":
            cached_proj = self.get_project_by_id(project_name)
            endpoints = list(cached_proj.get("rawEndpoints") or []) if cached_proj else []
            if not endpoints:
                server_dir = proj_dir / "server"
                endpoints = inspect_fastapi_routers(server_dir)
            # If no router files found, fallback to metadata.json apiEndpoints
            if not endpoints and meta.get("apiEndpoints"):
                for ep in meta.get("apiEndpoints", []):
                    parts = ep.split(" ", 1)
                    method = parts[0] if len(parts) > 1 else "GET"
                    path = parts[1] if len(parts) > 1 else parts[0]
                    path_parts = path.strip("/").split("/")
                    group = "General"
                    if len(path_parts) >= 3 and path_parts[0] == "api":
                        group = f"{path_parts[1].title()} · {path_parts[2].replace('-', ' ').title()}"
                    elif len(path_parts) >= 2 and path_parts[0] == "api":
                        group = path_parts[1].replace("-", " ").title()
                    endpoints.append({
                        "method": method,
                        "path": path,
                        "handler": "",
                        "summary": path.split("/")[-1].replace("-", " ").replace("_", " ").capitalize(),
                        "group": group,
                        "isAsync": True,
                    })
            return {
                "id": project_name,
                "totalEndpoints": len(endpoints),
                "endpoints": endpoints,
            }

        elif tab == "database":
            server_dir = proj_dir / "server"
            return inspect_sqlite_database(server_dir, project_name)

        elif tab == "env":
            return inspect_dual_environment(proj_dir)

        elif tab == "scripts":
            return {
                "id": project_name,
                "scripts": pkg.get("scripts", {}),
                "dependencies": pkg.get("dependencies", {}),
                "devDependencies": pkg.get("devDependencies", {}),
            }

        elif tab == "files":
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
            return {
                "id": project_name,
                "totalItems": len(file_tree),
                "totalDirectories": dir_count,
                "totalSourceFiles": file_count,
                "totalFiles": len(file_tree),
                "fileTree": file_tree,
                "tree": file_tree,
            }

        elif tab == "readme":
            readme_path = proj_dir / "README.md"
            if readme_path.is_file():
                blocks = parse_markdown_to_blocks(readme_path.read_text(encoding="utf-8"))
            else:
                blocks = [{"type": "paragraph", "text": "No README.md found in project root."}]
            return {
                "id": project_name,
                "blocks": blocks,
            }

        return {"error": f"Unknown tab '{tab}' for project '{project_name}'"}
