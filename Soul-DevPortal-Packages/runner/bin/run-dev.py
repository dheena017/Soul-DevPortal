#!/usr/bin/env python3
"""
Fullstack Dual-Supervisor CLI Launcher (@workspace/runner).
Runs both Frontend and Backend concurrently with cross-platform kernel supervision,
active TCP/HTTP healthcheck probing, and interactive hotkey controls.
Usage:
  python packages/runner/bin/run-dev.py [--project <name>] [--kill-port]
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
from workspace_runner.supervisor import ensure_port_free, run_dual_supervisor, run_single_process
from workspace_logger.banners import print_fullstack_banner


def main():
    auto_kill = "--kill-port" in sys.argv
    proj_name, cfg, proj_dir = detect_target_project()

    fe_port = cfg.get("frontend_port", 5173)
    be_port = cfg.get("backend_port", 8000)
    title = f"{cfg.get('title', proj_name.upper())}  —  FULLSTACK DEV ENVIRONMENT"
    db_info = cfg.get("db_info", "Local Store")
    ai_engine = cfg.get("ai_engine", "N/A")

    def show_banner():
        print_fullstack_banner(
            title=title,
            frontend_port=fe_port,
            backend_port=be_port,
            ai_engine=ai_engine,
            db_info=db_info,
        )

    # If project is fullstack serverless (single process)
    if cfg.get("backend_cmd") is None:
        ensure_port_free(fe_port, auto_kill=auto_kill, service_name=cfg.get("title", proj_name))
        show_banner()
        run_single_process(cfg["frontend_cmd"], scope="FULLSTACK", cwd=proj_dir, service_name=cfg.get("title", proj_name))
        return

    # Check and free ports
    ensure_port_free(fe_port, auto_kill=auto_kill, service_name=cfg.get("title", proj_name))
    ensure_port_free(be_port, auto_kill=auto_kill, service_name=cfg.get("title", proj_name))

    # Print Fullstack Dual-Supervisor Banner
    show_banner()

    # Launch dual supervisor with interactive hotkeys and active healthcheck
    run_dual_supervisor(
        frontend_cmd=cfg["frontend_cmd"],
        backend_cmd=cfg["backend_cmd"],
        cwd=proj_dir,
        service_name=cfg.get("title", proj_name),
        frontend_port=fe_port,
        backend_port=be_port,
        banner_callback=show_banner,
    )


if __name__ == "__main__":
    main()
