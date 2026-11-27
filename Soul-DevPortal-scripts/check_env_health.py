"""Check local environment health: Python, Node, npm, Git, FFmpeg, SQLite, Torch/CUDA, and disk space."""

from __future__ import annotations

import argparse
import importlib.util
import json
import shutil
import sqlite3
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent


def _cmd_version(cmd: list[str]) -> str | None:
    exe = shutil.which(cmd[0])
    if not exe:
        return None
    try:
        out = subprocess.check_output([exe, *cmd[1:]], text=True, stderr=subprocess.STDOUT, timeout=5)
        return out.strip().splitlines()[0]
    except Exception:
        return "installed"


def collect_health() -> dict:
    usage = shutil.disk_usage(ROOT)
    has_torch = importlib.util.find_spec("torch") is not None
    cuda = False
    if has_torch:
        try:
            import torch  # type: ignore
            cuda = bool(torch.cuda.is_available())
        except Exception:
            cuda = False

    return {
        "python": sys.version.split()[0],
        "sqlite": sqlite3.sqlite_version,
        "node": _cmd_version(["node", "-v"]),
        "npm": _cmd_version(["npm.cmd" if sys.platform == "win32" else "npm", "-v"]),
        "git": _cmd_version(["git", "--version"]),
        "ffmpeg": _cmd_version(["ffmpeg", "-version"]),
        "torch": has_torch,
        "cuda_available": cuda,
        "disk_free_gb": round(usage.free / (1024 ** 3), 2),
    }


def main() -> int:
    parser = argparse.ArgumentParser(description="Check Soul-DevPortal environment health.")
    parser.add_argument("--json", action="store_true", help="Print JSON output.")
    args = parser.parse_args()

    report = collect_health()
    if args.json:
        print(json.dumps(report, indent=2))
    else:
        for k, v in report.items():
            print(f"{k:16s}: {v}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
