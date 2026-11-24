"""
Packages Domain Service.
Handles shared packages discovery, AST symbols, manifests, and playgrounds.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from shared.paths import PACKAGES_ROOT
from shared.extractors.packages_crawler import crawl_packages
from shared.extractors.markdown_parser import parse_markdown_to_blocks


class PackageService:
    def __init__(self, packages_root: Path = PACKAGES_ROOT):
        self.packages_root = packages_root

    def get_navigation(self) -> List[Dict[str, Any]]:
        """Returns dynamic navigation tree of all packages with their available tabs."""
        packages = crawl_packages(self.packages_root)
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

    def get_all_packages(self) -> List[Dict[str, Any]]:
        """Returns live list of all shared packages."""
        return crawl_packages(self.packages_root)

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
            return {
                "id": package_name,
                "name": pkg_data["name"],
                "manifests": pkg_data.get("manifests", {}),
                "dependencies": pkg_data.get("dependencies", {}),
                "devDependencies": pkg_data.get("devDependencies", {}),
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
