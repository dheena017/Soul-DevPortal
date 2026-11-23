#!/usr/bin/env python3
"""
Soul Monorepo — Master Multi-App Supervisor (`dev:all`) CLI Launcher.
Part of @workspace/runner (@workspace/runner/external/run_all.py).

Usage:
  python Soul-DevPortal-Packages/runner/external/run_all.py [--kill-port] [--with-portal] [--project <pid>]
"""

from __future__ import annotations

import argparse
import os
import sys
from pathlib import Path

# Ensure runner package root is at the front of sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) in sys.path:
    sys.path.remove(str(_pkg_root))
sys.path.insert(0, str(_pkg_root))

_packages_root = _pkg_root.parent
for _pkg in ("logger", "config"):
    _p = str(_packages_root / _pkg)
    if _p not in sys.path and Path(_p).is_dir():
        sys.path.append(_p)

from internal.registry import find_workspace_root
from internal.supervisor import enable_windows_kill_on_close
from internal.orchestrator import load_projects_manifest, run_master_orchestrator


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Soul Monorepo Master Multi-App Supervisor (dev:all)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("--kill-port", action="store_true", default=True, help="Auto-kill processes on conflicting ports")
    parser.add_argument("--no-kill-port", dest="kill_port", action="store_false", help="Do not auto-kill conflicting ports")
    parser.add_argument("--with-portal", action="store_true", default=True, help="Include DevPortal Hub (:5181 / :8008)")
    parser.add_argument("--no-portal", dest="with_portal", action="store_false", help="Exclude DevPortal Hub")
    parser.add_argument("--project", "-p", type=str, default=None, help="Run a single project by ID")
    parser.add_argument("--client-only", action="store_true", default=False, help="Launch only frontend client applications")
    parser.add_argument("--server-only", action="store_true", default=False, help="Launch only backend API server applications")
    parser.add_argument("--open", "-o", action="store_true", default=True, help="Auto-open DevPortal Hub or project in browser once ready")
    parser.add_argument("--no-open", dest="open", action="store_false", help="Do not auto-open browser")
    parser.add_argument("--verbose", "-v", action="store_true", default=False, help="Stream child process stdout/stderr directly to console")
    args, _ = parser.parse_known_args()

    # Enable Windows Job Object auto-kill to prevent orphaned child processes
    enable_windows_kill_on_close()

    # Instruct child scripts to suppress redundant standalone box banners
    os.environ["SOUL_DEV_ALL"] = "1"
    os.environ["WORKSPACE_QUIET_BANNERS"] = "1"
    os.environ["WORKSPACE_SUPERVISOR_ACTIVE"] = "1"
    os.environ["PYTHONUNBUFFERED"] = "1"

    workspace_root = find_workspace_root()
    registry = load_projects_manifest(workspace_root)

    target_open_url = "http://localhost:5181/"
    if args.project:
        if args.project not in registry:
            sys.stderr.write(f"\033[31m[Error]\033[0m Unknown project '{args.project}'. Available: {list(registry.keys())}\n")
            sys.exit(1)
        registry = {args.project: registry[args.project]}
        args.with_portal = False
        fe_p = registry[args.project].get("frontend_port")
        be_p = registry[args.project].get("backend_port")
        if args.server_only and be_p:
            target_open_url = f"http://localhost:{be_p}/docs"
        elif fe_p:
            target_open_url = f"http://localhost:{fe_p}/"

    run_master_orchestrator(
        workspace_root=workspace_root,
        registry=registry,
        kill_port=args.kill_port,
        with_portal=args.with_portal,
        client_only=args.client_only,
        server_only=args.server_only,
        auto_open=args.open,
        target_open_url=target_open_url,
        verbose=args.verbose,
    )


if __name__ == "__main__":
    main()
