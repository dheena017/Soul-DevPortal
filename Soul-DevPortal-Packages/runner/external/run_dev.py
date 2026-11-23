#!/usr/bin/env python3
"""
Fullstack Dual-Supervisor CLI Launcher (@workspace/runner).
Runs Client and Server concurrently with process supervision,
active TCP/HTTP healthcheck probing, and interactive hotkeys.

Usage:
  python packages/runner/bin/run-dev.py [--project <name>] [--kill-port] [--install] [--open]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Ensure runner package root is at the front of sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) in sys.path:
    sys.path.remove(str(_pkg_root))
sys.path.insert(0, str(_pkg_root))

_packages_root = _pkg_root.parent
if str(_packages_root) not in sys.path:
    sys.path.insert(0, str(_packages_root))
for _pkg in ("runner", "logger", "config"):
    _p = str(_packages_root / _pkg)
    if _p not in sys.path:
        sys.path.append(_p)

from internal.env import load_cascading_env
from internal.installer import inspect_project_install, print_installation_banner, run_project_installation
from internal.registry import detect_target_project
from internal.supervisor import (
    ensure_port_free,
    print_fullstack_dashboard,
    print_single_tier_dashboard,
    run_dual_supervisor,
    run_single_process,
)
from logger.external.banners import print_fullstack_banner, print_frontend_banner, print_backend_banner

import threading
import webbrowser


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Fullstack Dual-Supervisor CLI Launcher (@workspace/runner)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("positional_project", nargs="?", default=None, help="Target project identifier or path")
    parser.add_argument("--project", "-p", type=str, default=None, help="Target project identifier")
    parser.add_argument("--client-port", "-cp", "--frontend-port", "-fp", type=int, default=None, help="Override client port")
    parser.add_argument("--server-port", "-sp", "--backend-port", "-bp", type=int, default=None, help="Override server port")
    parser.add_argument("--kill-port", action="store_true", help="Auto-kill any conflicting processes on target ports")
    parser.add_argument("--install", "-i", action="store_true", help="Auto-install missing dependencies")
    parser.add_argument("--check-deps", action="store_true", help="Pre-flight audit dependencies and exit")
    parser.add_argument("--open", "-o", action="store_true", help="Auto-open client UI in default browser once healthy")
    parser.add_argument("--open-docs", "-b", action="store_true", help="Auto-open API Swagger docs in default browser")
    parser.add_argument("--client-only", "--no-server", action="store_true", help="Launch only client tier")
    parser.add_argument("--server-only", "--no-client", action="store_true", help="Launch only server tier")
    parser.add_argument("--parallel", action="store_true", help="Run installation in parallel if missing")
    args, _ = parser.parse_known_args()

    proj_name, cfg, proj_dir = detect_target_project()

    # Load cascading environment hierarchy (.env, .env.local) dynamically
    env_vars, _ = load_cascading_env(project_dir=proj_dir)

    # Pre-flight dependency audit
    install_info = inspect_project_install(proj_dir)

    if args.check_deps:
        print_installation_banner(install_info, action_message="Audit Complete (Ready to run)")
        sys.exit(0 if install_info.get("overall_ready") else 1)

    if args.install or not install_info.get("overall_ready"):
        print_installation_banner(install_info, action_message="Installing Missing Dependencies...")
        run_project_installation(proj_dir, scope="all", parallel=args.parallel)

    # Resolve ports dynamically: CLI flag > env variable > detected project config > default fallback
    fe_port = args.client_port or int(env_vars.get("FRONTEND_PORT", env_vars.get("CLIENT_PORT", env_vars.get("PORT", cfg.get("frontend_port", 5173)))))
    be_port = args.server_port or int(env_vars.get("BACKEND_PORT", env_vars.get("SERVER_PORT", cfg.get("backend_port", 8000))))

    proj_display_title = cfg.get("title") or cfg.get("name") or proj_name.replace("-", " ").title()
    title = f"{proj_display_title.upper()} — FULLSTACK DEV"
    db_info = cfg.get("db_info") or cfg.get("db") or env_vars.get("DATABASE_URL", "SQLite Database")
    ai_engine = cfg.get("ai_engine") or cfg.get("ai") or env_vars.get("AI_MODEL", "Google Gemini 2.5 Flash")

    client_cmd = cfg.get("client_cmd") or cfg.get("frontend_cmd")
    server_cmd = cfg.get("server_cmd") or cfg.get("backend_cmd")

    def show_banner() -> None:
        print_fullstack_banner(
            title=title,
            frontend_port=fe_port,
            backend_port=be_port,
            ai_engine=ai_engine,
            db_info=db_info,
        )
        from internal.dashboard import print_hotkey_toolbar
        print_hotkey_toolbar()

    # Client-only mode
    if args.client_only:
        ensure_port_free(fe_port, auto_kill=args.kill_port, service_name=cfg.get("title", proj_name))
        print_frontend_banner(
            title=f"{proj_display_title.upper()} — CLIENT DEV",
            port=fe_port,
            backend_port=be_port,
            framework=cfg.get("framework", "React 19 + Vite 8 + Tailwind CSS v4"),
        )
        if args.open:
            threading.Timer(1.0, lambda: webbrowser.open(f"http://localhost:{fe_port}")).start()
        run_single_process(client_cmd, scope="CLIENT", cwd=proj_dir, service_name=cfg.get("title", proj_name))
        return

    # Server-only mode
    if args.server_only and server_cmd:
        ensure_port_free(be_port, auto_kill=args.kill_port, service_name=cfg.get("title", proj_name))
        print_backend_banner(
            title=f"{proj_display_title.upper()} — SERVER API",
            port=be_port,
            ai_engine=ai_engine,
            db_info=db_info,
        )
        if args.open_docs:
            threading.Timer(1.0, lambda: webbrowser.open(f"http://localhost:{be_port}/docs")).start()
        run_single_process(server_cmd, scope="SERVER", cwd=proj_dir, service_name=cfg.get("title", proj_name))
        return

    # Dual-Supervisor Fullstack Mode
    ensure_port_free(fe_port, auto_kill=args.kill_port, service_name=f"{cfg.get('title', proj_name)} (Client)")
    if server_cmd:
        ensure_port_free(be_port, auto_kill=args.kill_port, service_name=f"{cfg.get('title', proj_name)} (Server)")

    show_banner()

    if args.open:
        threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{fe_port}")).start()
    if args.open_docs:
        threading.Timer(1.5, lambda: webbrowser.open(f"http://localhost:{be_port}/docs")).start()

    run_dual_supervisor(
        frontend_cmd=client_cmd,
        backend_cmd=server_cmd,
        cwd=proj_dir,
        service_name=cfg.get("title", proj_name),
        frontend_port=fe_port,
        backend_port=be_port,
        banner_callback=show_banner,
    )


if __name__ == "__main__":
    main()
