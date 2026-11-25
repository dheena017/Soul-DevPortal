"""
Packages Domain Service.
Handles shared packages discovery, AST symbols, manifests, and playgrounds.
"""

from __future__ import annotations

import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from shared.paths import PACKAGES_ROOT
from shared.extractors.packages_crawler import crawl_packages
from shared.extractors.markdown_parser import parse_markdown_to_blocks


class PackageService:
    _CACHE_TTL_SECONDS = 20.0

    def __init__(self, packages_root: Path = PACKAGES_ROOT):
        self.packages_root = packages_root
        self._packages_cache: Optional[List[Dict[str, Any]]] = None
        self._cache_timestamp: float = 0.0

    def get_navigation(self) -> List[Dict[str, Any]]:
        """Returns dynamic navigation tree of all packages with their available tabs."""
        packages = self.get_all_packages()
        return [
            {
                "id": p["id"],
                "name": p["name"],
                "version": p["version"],
                "description": p["description"],
                "tabs": p["tabs"],
            }
            for p in packages
        ]

    def get_all_packages(self, force_refresh: bool = False) -> List[Dict[str, Any]]:
        """Returns live list of all shared packages with short TTL cache to avoid burst re-crawls."""
        now = time.monotonic()
        if (
            not force_refresh
            and self._packages_cache is not None
            and (now - self._cache_timestamp) < self._CACHE_TTL_SECONDS
        ):
            return self._packages_cache
        packages = crawl_packages(self.packages_root)
        self._packages_cache = packages
        self._cache_timestamp = now
        return packages

    def get_package_by_id(self, package_name: str) -> Optional[Dict[str, Any]]:
        """Retrieves a single package's complete metadata and AST."""
        all_pkgs = self.get_all_packages()
        return next((p for p in all_pkgs if p["id"] == package_name or p["name"] == package_name), None)

    def get_tab_content(self, package_name: str, tab: str) -> Dict[str, Any]:
        """Serves specific tab data for a package."""
        pkg_dir = self.packages_root / package_name
        if not pkg_dir.is_dir():
            return {"error": f"Package '{package_name}' not found on disk"}

        pkg_data = self.get_package_by_id(package_name)
        if not pkg_data:
            return {"error": f"Package '{package_name}' could not be loaded"}

        if tab == "docs":
            readme_path = pkg_dir / "README.md"
            if readme_path.is_file():
                blocks = parse_markdown_to_blocks(readme_path.read_text(encoding="utf-8"))
            else:
                blocks = [{"type": "paragraph", "text": "No README.md found in package root."}]
            return {
                "id": package_name,
                "name": pkg_data["name"],
                "blocks": blocks,
            }

        elif tab == "api":
            return {
                "id": package_name,
                "name": pkg_data["name"],
                "symbolsCount": len(pkg_data.get("symbols", [])),
                "symbols": pkg_data.get("symbols", []),
            }

        elif tab == "manifest":
            manifests = pkg_data.get("manifests", {})
            return {
                "id": package_name,
                "name": pkg_data["name"],
                "manifests": manifests,
                "npmManifest": manifests.get("npm", {}),
                "pythonManifest": manifests.get("python", {}),
                "exports": pkg_data.get("exports", []),
                "pythonDependencies": pkg_data.get("pythonDependencies", []),
                "dependencies": pkg_data.get("dependencies", {}),
                "devDependencies": pkg_data.get("devDependencies", {}),
                "peerDependencies": pkg_data.get("peerDependencies", {}),
            }

        elif tab == "playground":
            # Dynamic integration code snippet
            if package_name == "logger":
                snippets = [
                    {"lang": "ts", "title": "Client Logging", "code": 'import { consoleLogger } from "@workspace/logger";\nconsoleLogger.success("APP", "Connected to Soul Workspace");'},
                    {"lang": "python", "title": "FastAPI Middleware", "code": "from logger.external import RequestLoggingMiddleware\napp.add_middleware(RequestLoggingMiddleware)"},
                ]
            elif package_name == "runner":
                snippets = [
                    {"lang": "bash", "title": "Run Monorepo", "code": "soul-runner all --kill-port"},
                    {"lang": "python", "title": "Port Clearance", "code": "from runner.internal.ports import ensure_port_free\nensure_port_free(8000)"},
                ]
            else:
                snippets = [
                    {"lang": "ts", "title": "Tailwind Preset", "code": 'import workspacePreset from "@workspace/config/tailwind/preset";\nexport default { presets: [workspacePreset] };'},
                ]
            return {
                "id": package_name,
                "snippets": snippets,
            }

        return {"error": f"Unknown tab '{tab}' for package '{package_name}'"}
