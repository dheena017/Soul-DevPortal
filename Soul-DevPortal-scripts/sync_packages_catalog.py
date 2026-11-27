"""Audit all packages in Soul-DevPortal-Packages/ for manifest parity, Preview/preview.json, and tests/."""

from __future__ import annotations

import argparse
import json
import tomllib
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PACKAGES_ROOT = ROOT / "Soul-DevPortal-Packages"


def audit_packages() -> list[dict]:
    results = []
    for pkg in sorted(PACKAGES_ROOT.iterdir()):
        if not pkg.is_dir() or pkg.name.startswith((".", "__")):
            continue
        pkg_json = pkg / "package.json"
        pyproject = pkg / "pyproject.toml"
        preview = pkg / "Preview" / "preview.json"
        tests_dir = pkg / "tests"

        npm_ver = json.loads(pkg_json.read_text(encoding="utf-8")).get("version") if pkg_json.is_file() else None
        py_ver = tomllib.loads(pyproject.read_text(encoding="utf-8")).get("project", {}).get("version") if pyproject.is_file() else None
        test_count = len(list(tests_dir.glob("test_*.py"))) if tests_dir.is_dir() else 0

        results.append({
            "name": pkg.name,
            "npm_version": npm_ver,
            "py_version": py_ver,
            "version_parity": npm_ver == py_ver and npm_ver is not None,
            "has_preview": preview.is_file(),
            "test_files": test_count,
        })
    return results


def main() -> int:
    parser = argparse.ArgumentParser(description="Audit Soul-DevPortal-Packages catalog.")
    parser.add_argument("--json", action="store_true", help="Output JSON.")
    args = parser.parse_args()

    rows = audit_packages()
    if args.json:
        print(json.dumps(rows, indent=2))
        return 0

    drifts = [r for r in rows if not r["version_parity"]]
    print(f"Packages audited: {len(rows)} | Version parity OK: {len(rows) - len(drifts)} | Drifts: {len(drifts)}")
    for r in drifts:
        print(f"  DRIFT: {r['name']} (npm={r['npm_version']}, py={r['py_version']})")
    return 1 if drifts else 0


if __name__ == "__main__":
    raise SystemExit(main())
