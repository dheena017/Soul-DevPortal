"""Safely clean build and cache directories (__pycache__, .pytest_cache, .vite, dist) across the monorepo."""

from __future__ import annotations

import argparse
import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
TARGET_NAMES = {"__pycache__", ".pytest_cache", ".vite", "dist"}
SKIP_PARENTS = {"node_modules", ".git", ".venv", "venv"}


def find_cache_dirs(root: Path = ROOT) -> list[Path]:
    found: list[Path] = []
    for path in root.rglob("*"):
        if not path.is_dir():
            continue
        if any(part in SKIP_PARENTS for part in path.parts):
            continue
        if path.name in TARGET_NAMES:
            found.append(path)
    return sorted(found)


def main() -> int:
    parser = argparse.ArgumentParser(description="Clean cache directories in Soul-DevPortal.")
    parser.add_argument("--apply", action="store_true", help="Actually delete matched directories (default is dry-run).")
    args = parser.parse_args()

    dirs = find_cache_dirs()
    for d in dirs:
        rel = d.relative_to(ROOT)
        if args.apply:
            shutil.rmtree(d, ignore_errors=True)
            print(f"REMOVED {rel}")
        else:
            print(f"DRY-RUN {rel}")

    print(f"\nTotal: {len(dirs)} directories ({'removed' if args.apply else 'previewed'}).")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
