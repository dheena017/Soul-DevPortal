#!/usr/bin/env python3
"""
Soul Workspace - Server Launcher & CLI Entrypoint.
Usage:
    python server/main.py [--port 8008] [--host 127.0.0.1] [--reload] [--extract-only]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent
if str(SERVER_DIR) not in sys.path:
    sys.path.insert(0, str(SERVER_DIR))

import uvicorn
from features.dashboard.service import DashboardService


def main():
    parser = argparse.ArgumentParser(description="Soul Workspace FastAPI Backend Server")
    parser.add_argument("--port", type=int, default=8008, help="Backend port (default: 8008)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload on code changes")
    parser.add_argument("--extract-only", action="store_true", help="Only run live extraction and update SQLite DB without starting Uvicorn")
    args = parser.parse_args()

    svc = DashboardService()

    if args.extract_only:
        print("🚀 Running pure-live AST & workspace extraction...")
        data = svc.get_dashboard_overview()
        stats = data.get("stats", {})
        print(f"✅ Extraction completed! Discovered {stats.get('projectsCount')} projects, {stats.get('packagesCount')} packages, {stats.get('docsCount')} docs, {stats.get('totalSymbols')} symbols.")
        return

    uvicorn.run(
        "app.server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        app_dir=str(SERVER_DIR),
        log_level="warning",
    )


if __name__ == "__main__":
    main()
