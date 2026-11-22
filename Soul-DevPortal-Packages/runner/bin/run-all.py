#!/usr/bin/env python3
"""
Multi-Project Monorepo Supervisor Launcher (@workspace/runner).
Launches all registered micro-applications (clients + servers) concurrently
with port conflict resolution, active process supervision, and centralized telemetry.
Usage:
  python Soul-DevPortal-Packages/runner/bin/run-all.py [--kill-port] [--project <name>]
"""

from __future__ import annotations

import argparse
import os
import signal
import subprocess
import sys
import time
from pathlib import Path

# Add local packages to sys.path as fallback if not installed globally
_packages_root = Path(__file__).resolve().parent.parent.parent
if str(_packages_root / "runner") not in sys.path:
    sys.path.insert(0, str(_packages_root / "runner"))
if str(_packages_root / "logger") not in sys.path:
    sys.path.insert(0, str(_packages_root / "logger"))

from workspace_runner.registry import find_workspace_root, load_workspace_registry
from workspace_runner.supervisor import enable_windows_kill_on_close, ensure_port_free
from workspace_logger.banners import print_fullstack_banner


def main():
    parser = argparse.ArgumentParser(description="Soul Monorepo — Run All Micro-Apps")
    parser.add_argument("--kill-port", action="store_true", help="Auto-kill processes on conflicting ports")
    parser.add_argument("--project", "-p", type=str, default=None, help="Run a specific project instead of all")
    args, unknown = parser.parse_known_args()

    root = find_workspace_root()
    registry = load_workspace_registry(root)

    if not registry:
        sys.stderr.write("\033[31m[Error]\033[0m No projects found in projects.json\n")
        sys.exit(1)

    # If specific project requested, delegate to run-dev.py
    if args.project:
        from workspace_runner.registry import detect_target_project
        from workspace_runner.supervisor import run_dual_supervisor, run_single_process

        proj_name, cfg, proj_dir = detect_target_project()
        fe_port = cfg.get("frontend_port", 5173)
        be_port = cfg.get("backend_port", 8000)

        ensure_port_free(fe_port, auto_kill=args.kill_port, service_name=cfg.get("title", proj_name))
        if cfg.get("backend_cmd"):
            ensure_port_free(be_port, auto_kill=args.kill_port, service_name=cfg.get("title", proj_name))
            run_dual_supervisor(
                frontend_cmd=cfg["frontend_cmd"],
                backend_cmd=cfg["backend_cmd"],
                cwd=proj_dir,
                service_name=cfg.get("title", proj_name),
                frontend_port=fe_port,
                backend_port=be_port,
            )
        else:
            run_single_process(cfg["frontend_cmd"], scope="FULLSTACK", cwd=proj_dir, service_name=cfg.get("title", proj_name))
        return

    # Multi-project execution
    enable_windows_kill_on_close()

    print("\033[36m" + "=" * 80 + "\033[0m")
    print("\033[1;37m   SOUL MONOREPO — ALL MICRO-APPS CONCURRENT SUPERVISOR\033[0m")
    print(f"\033[32m   Found {len(registry)} registered projects in projects.json\033[0m")
    print("\033[36m" + "=" * 80 + "\033[0m\n")

    running_processes = []

    for pid, spec in registry.items():
        proj_dir = root / "Soul-DevPortal-Projects" / pid
        if not proj_dir.is_dir():
            proj_dir = root / "projects" / pid
        if not proj_dir.is_dir():
            continue

        fe_port = spec.get("frontend_port")
        be_port = spec.get("backend_port")
        title = spec.get("title", pid)

        print(f"\033[1;34m▶ [{pid}]\033[0m {title}")
        if fe_port:
            print(f"   Client: http://localhost:{fe_port}")
            ensure_port_free(fe_port, auto_kill=args.kill_port, service_name=f"{title} (Client)")
        if be_port and be_port != fe_port:
            print(f"   Server: http://localhost:{be_port}")
            ensure_port_free(be_port, auto_kill=args.kill_port, service_name=f"{title} (Server)")

        # Launch client command
        fe_cmd = spec.get("frontend_cmd")
        if fe_cmd:
            try:
                proc = subprocess.Popen(
                    fe_cmd,
                    cwd=str(proj_dir),
                    shell=(sys.platform == "win32"),
                )
                running_processes.append((f"{pid}:client", proc))
            except Exception as e:
                print(f"   \033[31m[Failed to start client]\033[0m {e}")

        # Launch server command if separate
        be_cmd = spec.get("backend_cmd")
        if be_cmd:
            try:
                proc = subprocess.Popen(
                    be_cmd,
                    cwd=str(proj_dir),
                    shell=(sys.platform == "win32"),
                )
                running_processes.append((f"{pid}:server", proc))
            except Exception as e:
                print(f"   \033[31m[Failed to start server]\033[0m {e}")
        print()

    print("\033[32m✔ All applications initialized. Press Ctrl+C to terminate all services.\033[0m")

    try:
        while True:
            time.sleep(1)
            # Check if any processes exited
            for name, proc in list(running_processes):
                ret = proc.poll()
                if ret is not None:
                    print(f"\033[33m[Process Exited]\033[0m {name} with code {ret}")
                    running_processes.remove((name, proc))
            if not running_processes:
                break
    except KeyboardInterrupt:
        print("\n\033[33mShutting down all micro-applications...\033[0m")
        for name, proc in running_processes:
            try:
                proc.terminate()
            except Exception:
                pass
        print("\033[32m✔ Clean shutdown complete.\033[0m")


if __name__ == "__main__":
    main()
