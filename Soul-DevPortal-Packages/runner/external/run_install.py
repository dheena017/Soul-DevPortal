#!/usr/bin/env python3
"""
Dual-Stack Dependency Installer CLI Launcher (@workspace/runner).
Audits and installs client (npm/pnpm/yarn) and server (pip/venv) requirements for workspace applications.

Usage:
  python packages/runner/bin/run-install.py [--project <name>] [--scope all|client|server] [--check-only] [--parallel] [--clean]
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
for _pkg in ("logger", "config"):
    _p = str(_packages_root / _pkg)
    if _p not in sys.path:
        sys.path.append(_p)

from internal.env import load_cascading_env
from internal.installer import inspect_project_install, print_installation_banner, run_project_installation
from internal.registry import detect_target_project


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Workspace Dual-Stack Dependency Installer (Client & Server)",
        formatter_class=argparse.RawDescriptionHelpFormatter,
    )
    parser.add_argument("positional_project", nargs="?", default=None, help="Target project identifier or path")
    parser.add_argument("--project", "-p", type=str, default=None, help="Target project identifier")
    parser.add_argument(
        "--scope",
        "-s",
        choices=["all", "client", "server", "frontend", "backend"],
        default="all",
        help="Installation scope (default: all)",
    )
    parser.add_argument("--check-only", "--check", action="store_true", help="Only audit and print banner without installing")
    parser.add_argument("--parallel", "-P", action="store_true", help="Concurrently install client and server in parallel threads")
    parser.add_argument("--clean", action="store_true", help="Clean existing node_modules before fresh install")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose install details")
    args, _ = parser.parse_known_args()

    # Detect target project dynamically
    proj_name, cfg, proj_dir = detect_target_project()

    # Pre-flight audit
    info = inspect_project_install(proj_dir)

    if args.check_only:
        print_installation_banner(info, action_message="Audit Complete (Ready to run)")
        sys.exit(0 if info.get("overall_ready") else 1)

    # Run installation
    success = run_project_installation(
        proj_dir,
        scope=args.scope,
        verbose=args.verbose,
        parallel=args.parallel,
        clean=args.clean,
    )
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
