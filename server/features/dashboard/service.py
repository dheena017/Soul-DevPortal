"""
Dashboard Aggregator Service.
Aggregates ALL Projects, ALL Packages, and ALL Docs, commands from package.json, and telemetry into one live contract.
"""

from __future__ import annotations

from datetime import datetime, timezone
from typing import Any, Dict

from features.projects.service import ProjectService
from features.packages.service import PackageService
from features.docs.service import DocService
from features.soul_dev_portal.service import SoulDevPortalService
from shared.telemetry import compute_workspace_telemetry
from shared.paths import DB_PATH, SCHEMA_PATH
from database.repository import DatabaseRepository


class DashboardService:
    def __init__(self):
        self.project_service = ProjectService()
        self.package_service = PackageService()
        self.doc_service = DocService()
        self.portal_service = SoulDevPortalService()
        self.repo = DatabaseRepository(DB_PATH, SCHEMA_PATH)

    def get_dashboard_overview(self, force_refresh: bool = False) -> Dict[str, Any]:
        """Consolidates all 3 domains into the live overview contract."""
        projects = self.project_service.get_all_projects(force_refresh=force_refresh)
        packages = self.package_service.get_all_packages(force_refresh=force_refresh)
        docs = self.doc_service.get_all_docs()
        commands_data = self.portal_service.get_commands()
        stats = compute_workspace_telemetry(projects, packages, docs)

        # Synchronize live snapshot into SQLite WAL
        try:
            self.repo.save_projects(projects)
            self.repo.save_packages(packages)
            self.repo.save_docs(docs)
            self.repo.record_telemetry(stats)
        except Exception:
            pass

        project_rules_doc = self.doc_service.get_file_content("01-project-architecture", "golden-rules")
        packages_guide_doc = self.doc_service.get_file_content("02-packages-architecture", "package-authoring-guide")
        ports_guide_doc = self.doc_service.get_file_content("03-networking-and-ports", "port-allocation-matrix")
        tech_stack_doc = self.doc_service.get_tab_content("01-project-architecture", "project-framework", "main")
        cheatsheet_doc = self.doc_service.get_file_content("04-cheatsheets", "compliance-checklist")

        docs_hierarchy = self.doc_service.get_navigation()

        return {
            "meta": {
                "generator": "Soul Workspace FastAPI Engine",
                "version": "2.0.0",
                "scannedAt": datetime.now(timezone.utc).isoformat(),
            },
            "stats": stats,
            "projects": projects,
            "packages": packages,
            "docs": docs,
            "docsHierarchy": docs_hierarchy,
            "commands": commands_data.get("commands", []),
            "rootScripts": commands_data.get("rawScripts", {}),
            "projectRulesBlocks": project_rules_doc.get("blocks", []),
            "guideBlocks": packages_guide_doc.get("blocks", []),
            "portGuideBlocks": ports_guide_doc.get("blocks", []),
            "techStackBlocks": tech_stack_doc.get("blocks", []),
            "cheatsheetBlocks": cheatsheet_doc.get("blocks", []),
        }
