"""Summarize git branch and working-tree status for root and Soul-DevPortal-Projects/*."""

from __future__ import annotations

import argparse
import json
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
PROJECTS_ROOT = ROOT / "Soul-DevPortal-Projects"


def git_summary(repo_dir: Path) -> dict:
    def _run(args: list[str]) -> str:
        return subprocess.check_output(["git", *args], cwd=str(repo_dir), text=True, stderr=subprocess.DEVNULL).strip()

    try:
        branch = _run(["rev-parse", "--abbrev-ref", "HEAD"])
        status_lines = _run(["status", "--short"]).splitlines()
        return {"repo": repo_dir.name, "branch": branch, "dirty_files": len(status_lines)}
    except Exception:
        return {"repo": repo_dir.name, "branch": "not-a-git-repo", "dirty_files": 0}


def main() -> int:
    parser = argparse.ArgumentParser(description="Git status across Soul-DevPortal monorepo.")
    parser.add_argument("--json", action="store_true", help="Print JSON output.")
    args = parser.parse_args()

    repos = [ROOT]
    if PROJECTS_ROOT.is_dir():
        repos.extend(sorted(p for p in PROJECTS_ROOT.iterdir() if p.is_dir() and (p / ".git").exists()))

    summaries = [git_summary(r) for r in repos]
    if args.json:
        print(json.dumps(summaries, indent=2))
    else:
        for s in summaries:
            print(f"{s['repo']:28s} | branch={s['branch']:15s} | dirty={s['dirty_files']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
