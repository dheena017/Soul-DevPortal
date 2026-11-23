#!/usr/bin/env python3
"""
TypeScript Static Type Checker CLI Launcher (@workspace/runner).
Audits TypeScript source files across workspace projects.

Usage:
  python packages/runner/bin/run-typecheck.py [--project <name>] [--watch] [--all]
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
from internal.registry import detect_target_project, find_workspace_root, load_workspace_registry
from internal.typechecker import run_project_typecheck


def main() -> None:
    parser = argparse.ArgumentParser(description="Workspace TypeScript Static Type Checker")
    parser.add_argument("positional_project", nargs="?", default=None, help="Target project identifier or path")
    parser.add_argument("--project", "-p", type=str, default=None, help="Target project identifier")
    parser.add_argument("--watch", "-w", action="store_true", help="Run compiler in continuous watch mode")
    parser.add_argument("--all", "-a", action="store_true", help="Typecheck all projects registered in projects.json")
    args, _ = parser.parse_known_args()

    if args.all:
        root = find_workspace_root()
        registry = load_workspace_registry(root)
        success = True
        for proj_id in registry:
            matched_id, _, proj_dir = detect_target_project(start_dir=root / "Soul-DevPortal-Projects" / proj_id)
            if not run_project_typecheck(proj_dir, project_name=matched_id, watch=args.watch):
                success = False
        sys.exit(0 if success else 1)

    proj_name, cfg, proj_dir = detect_target_project()
    success = run_project_typecheck(proj_dir, project_name=proj_name, watch=args.watch)
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()
