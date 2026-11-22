#!/usr/bin/env python3
"""
Frontend Dev Server CLI Launcher (@workspace/runner).
Runs the client dev server with Windows Job Object process supervision.
Usage:
  python packages/runner/bin/run-frontend.py [--project <name>] [--kill-port]
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
from workspace_logger.banners import print_frontend_banner


def main():
    auto_kill = "--kill-port" in sys.argv
    proj_name, cfg, proj_dir = detect_target_project()

    fe_port = cfg.get("frontend_port", 5173)
    title = f"{cfg.get('title', proj_name.upper())}  —  FRONTEND DEV SERVER"
    framework = cfg.get("framework", "Web Application")

    # Ensure port is available
    ensure_port_free(fe_port, auto_kill=auto_kill, service_name=cfg.get("title", proj_name))

    # Print Frontend Banner
    print_frontend_banner(
        title=title,
        port=fe_port,
        framework=framework,
    )

    # Run Frontend Process under Job Object
    run_single_process(
        cfg["frontend_cmd"],
        scope="FRONTEND",
        cwd=proj_dir,
        service_name=cfg.get("title", proj_name),
    )


if __name__ == "__main__":
    main()
