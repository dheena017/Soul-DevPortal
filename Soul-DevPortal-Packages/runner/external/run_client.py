#!/usr/bin/env python3
"""
Client Dev Server CLI Launcher (@workspace/runner).
Runs client dev servers with process supervision and deterministic port conflict guards.

Usage:
  python packages/runner/bin/run-client.py [--project <name>] [--port <number>] [--kill-port] [--open]
"""

from __future__ import annotations

import argparse
import sys
import threading
import time
import webbrowser
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
from internal.supervisor import ensure_port_free, run_single_process
from logger.external.banners import print_frontend_banner


def main() -> None:
    parser = argparse.ArgumentParser(description="Client Dev Server CLI Launcher (@workspace/runner)")
    parser.add_argument("positional_project", nargs="?", default=None, help="Target project identifier or path")
    parser.add_argument("--project", "-p", type=str, default=None, help="Target project identifier")
    parser.add_argument("--port", "--client-port", "-cp", "--frontend-port", "-fp", type=int, default=None, help="Override client port")
    parser.add_argument("--kill-port", action="store_true", help="Auto-kill any process occupying the port")
    parser.add_argument("--open", "-o", action="store_true", help="Auto-open client URL in browser once launched")
    parser.add_argument("--install", "-i", action="store_true", help="Auto-install dependencies if missing")
    parser.add_argument("--check-deps", action="store_true", help="Audit dependencies and exit")
    args, _ = parser.parse_known_args()

    proj_name, cfg, proj_dir = detect_target_project()

    # Load cascading environment hierarchy (.env, .env.local) dynamically
    env_vars, _ = load_cascading_env(project_dir=proj_dir)

    # Pre-flight dependency audit
    install_info = inspect_project_install(proj_dir)
    if args.check_deps:
        print_installation_banner(install_info, action_message="Client Dependency Audit Complete")
        sys.exit(0 if install_info["frontend"].get("is_installed") else 1)

    if args.install or (not install_info["frontend"].get("is_installed") and install_info["frontend"].get("has_manifest")):
        run_project_installation(proj_dir, scope="client")

    # Resolve port dynamically: CLI flag > env variable > detected project config > default fallback (5173)
    port = args.port or int(env_vars.get("FRONTEND_PORT", env_vars.get("CLIENT_PORT", env_vars.get("PORT", cfg.get("frontend_port", 5173)))))

    client_cmd = cfg.get("client_cmd") or cfg.get("frontend_cmd")
    if not client_cmd:
        print(f"\033[31m[Error]\033[0m No client dev command detected for '{proj_name}'.")
        sys.exit(1)

    ensure_port_free(port, auto_kill=args.kill_port, service_name=f"{cfg.get('title', proj_name)} (Client)")

    proj_display_title = cfg.get("name") or cfg.get("title") or proj_name.replace("-", " ").title()
    print_frontend_banner(
        title=f"{proj_display_title.upper()} — CLIENT DEV",
        port=port,
        backend_port=int(env_vars.get("BACKEND_PORT", env_vars.get("SERVER_PORT", cfg.get("backend_port", 8000)))),
        framework=cfg.get("framework", "React 19 + Vite 8 + Tailwind CSS v4"),
    )

    if args.open:
        def _open_browser():
            time.sleep(1.5)
            webbrowser.open(f"http://localhost:{port}")
        threading.Thread(target=_open_browser, daemon=True).start()

    run_single_process(client_cmd, scope="CLIENT", cwd=proj_dir, service_name=cfg.get("title", proj_name))


if __name__ == "__main__":
    main()
