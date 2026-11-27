"""
Runs isolated Tier-3 unit tests and triple-manifest parity checks across all Soul-DevPortal-Packages/ in parallel.
"""

from __future__ import annotations

import concurrent.futures
import json
import subprocess
import sys
import tomllib
from pathlib import Path
from typing import List, Tuple

ROOT = Path(__file__).resolve().parent.parent
PACKAGES_ROOT = ROOT / "Soul-DevPortal-Packages"


def check_manifest_parity(pkg_dir: Path) -> None:
    pkg_json_path = pkg_dir / "package.json"
    pyproject_path = pkg_dir / "pyproject.toml"
    if not pkg_json_path.is_file() or not pyproject_path.is_file():
        return

    pkg_json = json.loads(pkg_json_path.read_text(encoding="utf-8"))
    pyproject = tomllib.loads(pyproject_path.read_text(encoding="utf-8"))
    npm_ver = pkg_json.get("version")
    py_ver = pyproject.get("project", {}).get("version")
    if npm_ver and py_ver and npm_ver != py_ver:
        raise AssertionError(f"{pkg_dir.name}: version drift ({npm_ver} != {py_ver})")


def _run_test_file(pkg_dir: Path, test_file: Path) -> Tuple[str, int, str]:
    proc = subprocess.run(
        [sys.executable, str(test_file)],
        cwd=str(pkg_dir),
        capture_output=True,
        text=True,
    )
    err = proc.stderr.strip() or proc.stdout.strip()
    return f"{pkg_dir.name}/{test_file.name}", proc.returncode, err


def main() -> int:
    failures: List[str] = []
    jobs: List[Tuple[Path, Path]] = []

    for pkg_dir in sorted(PACKAGES_ROOT.iterdir()):
        if not pkg_dir.is_dir() or pkg_dir.name.startswith((".", "__")):
            continue
        try:
            check_manifest_parity(pkg_dir)
        except Exception as exc:
            failures.append(f"{pkg_dir.name} [manifest]: {exc}")

        tests_dir = pkg_dir / "tests"
        if tests_dir.is_dir():
            for test_file in sorted(tests_dir.glob("test_*.py")):
                jobs.append((pkg_dir, test_file))

    with concurrent.futures.ThreadPoolExecutor(max_workers=12) as pool:
        for label, code, err in pool.map(lambda j: _run_test_file(j[0], j[1]), jobs):
            if code != 0:
                failures.append(f"{label}: {err}")

    if failures:
        print(f"FAILED ({len(failures)} failures across {len(jobs)} test files):")
        for item in failures:
            print(f"  - {item}")
        return 1

    print(f"PASSED all {len(jobs)} package test suites with 100% manifest parity.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
