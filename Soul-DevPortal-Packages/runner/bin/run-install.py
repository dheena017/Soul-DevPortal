#!/usr/bin/env python3
"""
Dual-Stack Dependency Installer CLI Launcher (@workspace/runner).
Audits and installs frontend (npm) and backend (pip/venv) requirements for workspace micro-apps.
Usage:
  python Soul-DevPortal-Packages/runner/bin/run-install.py [--project <name>] [--scope all|client|server] [--check-only]
"""

from __future__ import annotations

import argparse
import sys
from pathlib import Path

# Add local packages to sys.path
_packages_root = Path(__file__).resolve().parent.parent.parent
if str(_packages_root / "runner") not in sys.path:
    sys.path.insert(0, str(_packages_root / "runner"))
if str(_packages_root / "logger") not in sys.path:
    sys.path.insert(0, str(_packages_root / "logger"))
if str(_packages_root / "config") not in sys.path:
    sys.path.insert(0, str(_packages_root / "config"))

from workspace_runner.installer import (
    inspect_project_install,
    print_installation_banner,
    run_project_installation,
)
from workspace_runner.registry import detect_target_project, find_workspace_root, load_workspace_registry


def main():
    parser = argparse.ArgumentParser(description="Workspace Dual-Stack Dependency Installer")
    parser.add_argument("--project", "-p", type=str, default=None, help="Target project ID")
    parser.add_argument("--scope", "-s", choices=["all", "client", "server", "frontend", "backend"], default="all", help="Installation scope")
    parser.add_argument("--check-only", "--check", action="store_true", help="Only audit and print banner without installing")
    args, _ = parser.parse_known_args()

    # Detect project
    proj_name, cfg, proj_dir = detect_target_project()
    info = inspect_project_install(proj_dir)

    if args.check_only:
        print_installation_banner(info, action_message="Audit Complete (Ready to run)")
        sys.exit(0 if info.get("overall_ready") else 1)

    # Run installation
    success = run_project_installation(proj_dir, scope=args.scope)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
