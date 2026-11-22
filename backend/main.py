#!/usr/bin/env python3
"""
Soul Workspace - Backend Launcher & FastAPI Server Entrypoint.
Usage:
    python backend/main.py [--port 8008] [--host 127.0.0.1] [--reload] [--extract-only]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure backend root is on sys.path
BACKEND_DIR = Path(__file__).resolve().parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import uvicorn
from core.workspace_service import WorkspaceService


def main():
    parser = argparse.ArgumentParser(description="Soul Workspace FastAPI Backend Server")
    parser.add_argument("--port", type=int, default=8008, help="Backend port (default: 8008)")
    parser.add_argument("--host", type=str, default="127.0.0.1", help="Host interface (default: 127.0.0.1)")
    parser.add_argument("--reload", action="store_true", help="Enable auto-reload on code changes")
    parser.add_argument("--extract-only", action="store_true", help="Only run extraction and update exporters/data without starting the server")
    args = parser.parse_args()

    service = WorkspaceService.get_instance()

    if args.extract_only:
        print("🚀 Running AST extraction pipeline...")
        data = service.refresh()
        print(f"✅ Extraction completed! Indexed {data['stats']['packagesCount']} packages, {data['stats']['totalSymbols']} symbols.")
        return

    print("=" * 65)
    print(f"  SOUL WORKSPACE FASTAPI BACKEND SERVER")
    print(f"  Listening on: http://{args.host}:{args.port}")
    print(f"  Interactive Swagger Docs: http://{args.host}:{args.port}/docs")
    print(f"  Live REST API: http://{args.host}:{args.port}/api/workspace")
    print("=" * 65)

    uvicorn.run(
        "server:app",
        host=args.host,
        port=args.port,
        reload=args.reload,
        app_dir=str(BACKEND_DIR),
    )


if __name__ == "__main__":
    main()
