#!/usr/bin/env python3
"""
Backend API Server CLI Launcher (@workspace/runner).
Runs backend microservices with Windows Job Object process supervision.
Usage:
  python packages/runner/bin/run-backend.py [--project <name>] [--kill-port]
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add local packages to sys.path as fallback if not installed globally
_packages_root = Path(__file__).resolve().parent.parent.parent
if str(_packages_root / "runner") not in sys.path:
    sys.path.insert(0, str(_packages_root / "runner"))
if str(_packages_root / "logger") not in sys.path:
    sys.path.insert(0, str(_packages_root / "logger"))

from workspace_runner.registry import detect_target_project
from workspace_runner.supervisor import ensure_port_free, run_single_process
from workspace_logger.banners import print_backend_banner


def main():
    auto_kill = "--kill-port" in sys.argv
    proj_name, cfg, proj_dir = detect_target_project()

    be_cmd = cfg.get("backend_cmd")
    if be_cmd is None:
        sys.stderr.write(
            f"\033[33m[Warning]\033[0m Project '{proj_name}' is a fullstack serverless application.\n"
            f"Run frontend instead: \033[36mpython packages/runner/bin/run-frontend.py --project {proj_name}\033[0m\n"
        )
        sys.exit(0)

    be_port = cfg.get("backend_port", 8000)
    title = f"{cfg.get('title', proj_name.upper())}  —  BACKEND API SERVER"
    db_info = cfg.get("db_info", "Local Store")
    ai_engine = cfg.get("ai_engine", "N/A")

    # Ensure port is free
    ensure_port_free(be_port, auto_kill=auto_kill, service_name=cfg.get("title", proj_name))

    # Print stylized banner
    print_backend_banner(
        title=title,
        port=be_port,
        db_info=db_info,
        ai_engine=ai_engine,
    )

    # Run Backend Process under Job Object
    run_single_process(
        be_cmd,
        scope="BACKEND",
        cwd=proj_dir,
        service_name=cfg.get("title", proj_name),
    )


if __name__ == "__main__":
    main()
