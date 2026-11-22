#!/usr/bin/env python3
"""
Soul DevPortal — Client Dev Server Runner
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
from workspace_logger.banners import print_frontend_banner


def main():
    auto_kill = "--kill-port" in sys.argv
    fe_port, _ = get_project_ports("devportal")
    cfg = PORT_REGISTRY["devportal"]
    title = f"{cfg['name'].upper()}  —  CLIENT DEV SERVER"

    ensure_port_free(fe_port, auto_kill=auto_kill, service_name="DevPortal Client")

    print_frontend_banner(
        title=title,
        port=fe_port,
        framework=cfg.get("framework", "React 19 + Vite 7 + Tailwind CSS v4"),
    )

    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    run_single_process(
        [npx_cmd, "vite", "--port", str(fe_port)],
        scope="FRONTEND",
        cwd=_root,
        service_name="DevPortal Client",
    )


if __name__ == "__main__":
    main()
