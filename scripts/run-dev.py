#!/usr/bin/env python3
"""
Soul DevPortal — Fullstack Dual-Supervisor Runner
Powered by @workspace/runner and @workspace/logger
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add local packages to sys.path
_root = Path(__file__).resolve().parent.parent
_packages = _root / "Soul-DevPortal-Packages"
for pkg in ("runner", "logger", "config"):
    p = str(_packages / pkg)
    if p not in sys.path:
        sys.path.insert(0, p)

from workspace_config.ports import PORT_REGISTRY, get_project_ports
from workspace_runner.installer import inspect_project_install, print_installation_banner, run_project_installation
from workspace_runner.supervisor import ensure_port_free, run_dual_supervisor
from workspace_logger.banners import print_fullstack_banner


def main():
    auto_kill = "--kill-port" in sys.argv
    do_install = "--install" in sys.argv
    check_deps = "--check-deps" in sys.argv

    # Pre-flight audit
    install_info = inspect_project_install(_root)
    if check_deps:
        print_installation_banner(install_info, action_message="Audit Complete (Ready to run)")
        sys.exit(0 if install_info.get("overall_ready") else 1)

    if do_install or not install_info.get("overall_ready"):
        print_installation_banner(install_info, action_message="Installing Missing Dependencies...")
        run_project_installation(_root, scope="all")

    fe_port, be_port = get_project_ports("devportal")
    cfg = PORT_REGISTRY["devportal"]
    title = f"{cfg['name'].upper()}  —  FULLSTACK DEV ENVIRONMENT"
    db_info = cfg["db"]
    ai_engine = cfg["ai"]

    def show_banner():
        print_fullstack_banner(
            title=title,
            frontend_port=fe_port,
            backend_port=be_port,
            ai_engine=ai_engine,
            db_info=db_info,
        )

    ensure_port_free(fe_port, auto_kill=auto_kill, service_name="DevPortal Client")
    ensure_port_free(be_port, auto_kill=auto_kill, service_name="DevPortal Backend")

    show_banner()

    npx_cmd = "npx.cmd" if sys.platform == "win32" else "npx"
    fe_cmd = [npx_cmd, "vite", "--port", str(fe_port)]
    be_cmd = [sys.executable, "backend/main.py", "--port", str(be_port), "--reload"]

    run_dual_supervisor(
        frontend_cmd=fe_cmd,
        backend_cmd=be_cmd,
        cwd=_root,
        service_name="Soul DevPortal",
        frontend_port=fe_port,
        backend_port=be_port,
        banner_callback=show_banner,
    )


if __name__ == "__main__":
    main()
