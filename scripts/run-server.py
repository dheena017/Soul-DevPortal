#!/usr/bin/env python3
"""
Soul DevPortal — Backend API Server Runner
Powered by @workspace/runner and @workspace/logger
"""

from __future__ import annotations

import sys
from pathlib import Path

_root = Path(__file__).resolve().parent.parent
_packages = _root / "Soul-DevPortal-Packages"
for pkg in ("runner", "logger", "config"):
    p = str(_packages / pkg)
    if p not in sys.path:
        sys.path.insert(0, p)

from workspace_config.ports import PORT_REGISTRY, get_project_ports
from workspace_runner.supervisor import ensure_port_free, run_single_process
from workspace_logger.banners import print_backend_banner


def main():
    auto_kill = "--kill-port" in sys.argv
    _, be_port = get_project_ports("devportal")
    cfg = PORT_REGISTRY["devportal"]
    title = f"{cfg['name'].upper()}  —  BACKEND API SERVER"

    ensure_port_free(be_port, auto_kill=auto_kill, service_name="DevPortal Backend")

    print_backend_banner(
        title=title,
        port=be_port,
        db_info=cfg.get("db", "backend/data/workspace.json & AST Store"),
        ai_engine=cfg.get("ai", "FastAPI AST Metadata Engine"),
    )

    run_single_process(
        [sys.executable, "backend/main.py", "--port", "8008", "--reload"],
        scope="BACKEND",
        cwd=_root,
        service_name="DevPortal Backend",
    )


if __name__ == "__main__":
    main()
