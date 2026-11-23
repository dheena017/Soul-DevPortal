#!/usr/bin/env python3
"""
Server API / Backend CLI Launcher (@workspace/runner).
Runs backend microservices and REST APIs with process supervision,
deterministic port conflict resolution, and active healthcheck probing.

Usage:
  python packages/runner/bin/run-server.py [--project <name>] [--port <number>] [--kill-port] [--open-docs]
"""

from __future__ import annotations

import argparse
import sys
import threading
import time
import urllib.request
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
from internal.supervisor import ensure_port_free, format_universal_line, run_single_process
from logger.external.banners import print_backend_banner


def _probe_server_health(port: int, host: str = "127.0.0.1", timeout: float = 12.0) -> None:
    """Background thread probe verifying server healthcheck once process is up."""
    start_time = time.time()
    endpoints = [
        f"http://{host}:{port}/api/health",
        f"http://{host}:{port}/health",
        f"http://{host}:{port}/api/docs",
        f"http://{host}:{port}/docs",
        f"http://{host}:{port}/",
    ]

    time.sleep(1.0)
    while time.time() - start_time < timeout:
        for url in endpoints:
            try:
                req = urllib.request.Request(url, headers={"User-Agent": "Workspace-HealthProbe/1.0"})
                with urllib.request.urlopen(req, timeout=1.0) as resp:
                    if resp.status in (200, 301, 302, 307, 308, 404):
                        elapsed = round(time.time() - start_time, 2)
                        print(format_universal_line("SERVER  ", "OK", "HEALTHCHECK", f"API server active at http://{host}:{port} ({elapsed}s)"), flush=True)
                        return
            except Exception:
                pass
        time.sleep(0.2)


def main() -> None:
    parser = argparse.ArgumentParser(description="Server API / Backend CLI Launcher (@workspace/runner)")
    parser.add_argument("positional_project", nargs="?", default=None, help="Target project identifier or path")
    parser.add_argument("--project", "-p", type=str, default=None, help="Target project identifier")
    parser.add_argument("--port", "--server-port", "-sp", "--backend-port", "-bp", type=int, default=None, help="Override server port")
    parser.add_argument("--kill-port", action="store_true", help="Auto-kill any process occupying the port")
    parser.add_argument("--open-docs", "-b", action="store_true", help="Auto-open API Swagger docs in browser")
    parser.add_argument("--install", "-i", action="store_true", help="Auto-install backend requirements if missing")
    parser.add_argument("--check-deps", action="store_true", help="Audit backend dependencies and exit")
    args, _ = parser.parse_known_args()

    proj_name, cfg, proj_dir = detect_target_project()

    # Load cascading environment hierarchy (.env, .env.local) dynamically
    env_vars, _ = load_cascading_env(project_dir=proj_dir)

    # Pre-flight dependency audit
    install_info = inspect_project_install(proj_dir)
    if args.check_deps:
        print_installation_banner(install_info, action_message="Server Dependency Audit Complete")
        sys.exit(0 if install_info["backend"].get("is_installed") else 1)

    if args.install or (not install_info["backend"].get("is_installed") and install_info["backend"].get("has_manifest")):
        run_project_installation(proj_dir, scope="server")

    # Resolve port dynamically: CLI flag > env variable > detected project config > default fallback (8000)
    port = args.port or int(env_vars.get("BACKEND_PORT", env_vars.get("SERVER_PORT", env_vars.get("PORT", cfg.get("backend_port", 8000)))))

    server_cmd = cfg.get("server_cmd") or cfg.get("backend_cmd")
    if not server_cmd:
        print(f"\033[31m[Error]\033[0m No backend server command detected for '{proj_name}'.")
        sys.exit(1)

    ensure_port_free(port, auto_kill=args.kill_port, service_name=f"{cfg.get('title', proj_name)} (Server)")

    proj_display_title = cfg.get("name") or cfg.get("title") or proj_name.replace("-", " ").title()
    print_backend_banner(
        title=f"{proj_display_title.upper()} — SERVER API",
        port=port,
        ai_engine=cfg.get("ai") or env_vars.get("AI_MODEL", "Google Gemini 2.5 Flash"),
        db_info=cfg.get("db") or env_vars.get("DATABASE_URL", "SQLite Database"),
    )

    # Start non-blocking background healthcheck probe
    threading.Thread(target=_probe_server_health, args=(port,), daemon=True).start()

    if args.open_docs:
        def _open_docs():
            time.sleep(2.0)
            webbrowser.open(f"http://localhost:{port}/docs")
        threading.Thread(target=_open_docs, daemon=True).start()

    run_single_process(server_cmd, scope="SERVER", cwd=proj_dir, service_name=cfg.get("title", proj_name))


if __name__ == "__main__":
    main()
