"""
Soul Dev Portal Service.
Serves lifecycle commands from root package.json and server health.
"""

from __future__ import annotations

import time
from datetime import datetime, timezone
from typing import Any, Dict, List

from shared.paths import ROOT_PACKAGE_JSON, DB_PATH
from shared.extractors.manifest_reader import read_json_manifest
from shared.config import PORT, APP_VERSION, SERVICE_NAME

START_TIME = time.time()


class SoulDevPortalService:
    @staticmethod
    def get_commands() -> Dict[str, Any]:
        """Reads scripts directly from root package.json."""
        manifest = read_json_manifest(ROOT_PACKAGE_JSON)
        scripts = manifest.get("scripts", {})

        command_list = []
        for name, cmd in scripts.items():
            category = "apps" if any(p in name for p in ("apexmind", "sonikoma", "outpass", "free-api", "spatial", "college", "globalpulse", "postcraft")) else "orchestration"
            command_list.append({
                "id": name,
                "name": f"npm run {name}",
                "command": cmd,
                "category": category,
            })

        return {
            "source": str(ROOT_PACKAGE_JSON.name),
            "totalCommands": len(command_list),
            "rawScripts": scripts,
            "commands": command_list,
        }

    @staticmethod
    def get_health() -> Dict[str, Any]:
        """Returns live process and SQLite WAL health."""
        uptime_seconds = int(time.time() - START_TIME)
        return {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": APP_VERSION,
            "port": PORT,
            "uptimeSeconds": uptime_seconds,
            "dbMode": "WAL",
            "dbExists": DB_PATH.exists(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def get_overview() -> Dict[str, Any]:
        """Root landing overview and service status."""
        return {
            "service": "Soul DevPortal Engine",
            "version": APP_VERSION,
            "status": "online",
            "port": PORT,
            "docsUrl": "/docs",
            "openapiUrl": "/openapi.json",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }
