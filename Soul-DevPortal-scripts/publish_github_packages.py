"""
Stage and publish all Soul-DevPortal-Packages/* to GitHub Packages (@dheena017/*)
without modifying local @workspace/* monorepo package names.
"""

from __future__ import annotations

import argparse
import getpass
import json
import os
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path
from typing import Dict

ROOT = Path(__file__).resolve().parent.parent
PACKAGES_ROOT = ROOT / "Soul-DevPortal-Packages"
GITHUB_OWNER = "dheena017"
REPO_URL = "git+https://github.com/dheena017/Soul-DevPortal-Packages.git"
REGISTRY_URL = "https://npm.pkg.github.com"


def _load_dotenv_token() -> str:
    env_file = ROOT / ".env"
    if not env_file.is_file():
        return ""
    for line in env_file.read_text(encoding="utf-8", errors="ignore").splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#") or "=" not in stripped:
            continue
        key, val = stripped.split("=", 1)
        if key.strip() in {"NODE_AUTH_TOKEN", "GITHUB_TOKEN"}:
            cleaned = val.strip().strip('"').strip("'")
            if cleaned:
                return cleaned
    return ""


def _get_auth_token() -> str:
    return (
        os.environ.get("NODE_AUTH_TOKEN")
        or os.environ.get("GITHUB_TOKEN")
        or _load_dotenv_token()
    ).strip()


def _has_user_npmrc_token() -> bool:
    npmrc = Path.home() / ".npmrc"
    if not npmrc.is_file():
        return False
    text = npmrc.read_text(encoding="utf-8", errors="ignore")
    return "npm.pkg.github.com/:_authToken" in text


def _rewrite_workspace_deps(deps: Dict[str, str] | None) -> Dict[str, str] | None:
    if not isinstance(deps, dict):
        return deps
    return {
        (f"@{GITHUB_OWNER}/{k.split('/', 1)[1]}" if k.startswith("@workspace/") else k): v
        for k, v in deps.items()
    }


def stage_package(pkg_dir: Path, stage_root: Path, version_override: str = "") -> Path:
    dest = stage_root / pkg_dir.name
    shutil.copytree(
        pkg_dir,
        dest,
        ignore=shutil.ignore_patterns("__pycache__", "*.pyc", "*.egg-info", "node_modules", ".pytest_cache", ".git"),
    )
    pkg_json_path = dest / "package.json"
    data = json.loads(pkg_json_path.read_text(encoding="utf-8"))
    data["name"] = f"@{GITHUB_OWNER}/{pkg_dir.name}"
    if version_override:
        data["version"] = version_override
    data.pop("private", None)
    data["repository"] = {"type": "git", "url": REPO_URL}
    data["publishConfig"] = {"registry": REGISTRY_URL}
    for dep_key in ("dependencies", "peerDependencies", "optionalDependencies"):
        if dep_key in data:
            data[dep_key] = _rewrite_workspace_deps(data[dep_key])
    pkg_json_path.write_text(json.dumps(data, indent=2) + "\n", encoding="utf-8")
    return dest


def _extract_error(output: str) -> str:
    lines = [
        ln.strip()
        for ln in output.splitlines()
        if ln.strip() and "A complete log of this run can be found in:" not in ln
    ]
    return " | ".join(lines[-3:]) if lines else "unknown error"


def _preflight_auth(npm_bin: str, userconfig: Path | None) -> tuple[bool, str]:
    cmd = [npm_bin, "whoami", "--registry", REGISTRY_URL]
    if userconfig is not None:
        cmd.extend(["--userconfig", str(userconfig)])
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode == 0:
        return True, proc.stdout.strip()
    return False, _extract_error((proc.stderr or proc.stdout).strip())


def main() -> int:
    parser = argparse.ArgumentParser(description="Publish Soul-DevPortal-Packages to GitHub Packages.")
    parser.add_argument("--dry-run", action="store_true", help="Stage and run npm publish --dry-run.")
    parser.add_argument("--filter", default="", help="Comma-separated package folder names to publish.")
    parser.add_argument("--version", default="", help="Optional version override for staged packages.")
    parser.add_argument("--non-interactive", action="store_true", help="Fail instead of prompting for token.")
    args = parser.parse_args()

    auth_token = _get_auth_token()
    if not args.dry_run and not auth_token and not _has_user_npmrc_token():
        if not args.non_interactive and sys.stdin.isatty():
            print("No GitHub Packages token found in env, .env, or ~/.npmrc.")
            try:
                entered = getpass.getpass("Paste your GitHub PAT (ghp_..., input hidden): ").strip()
            except Exception:
                entered = input("Paste your GitHub PAT (ghp_...): ").strip()
            if entered:
                auth_token = entered
                save_choice = input("Save token to .env (gitignored) for future runs? [y/N]: ").strip().lower()
                if save_choice in {"y", "yes"}:
                    env_path = ROOT / ".env"
                    existing = env_path.read_text(encoding="utf-8") if env_path.is_file() else ""
                    sep = "\n" if existing and not existing.endswith("\n") else ""
                    env_path.write_text(f"{existing}{sep}NODE_AUTH_TOKEN={auth_token}\n", encoding="utf-8")
                    print(f"Saved NODE_AUTH_TOKEN to {env_path}")
        if not auth_token:
            print("ERROR: No GitHub Packages auth token found.")
            print("Set a GitHub Personal Access Token (with write:packages + read:packages + repo):")
            print('  PowerShell: $env:NODE_AUTH_TOKEN="ghp_your_token_here"; npm run pkg:publish')
            print(f"  Or add NODE_AUTH_TOKEN=ghp_... to {ROOT / '.env'}")
            return 1

    selected = {x.strip() for x in args.filter.split(",") if x.strip()} if args.filter else None
    pkg_dirs = [
        d for d in sorted(PACKAGES_ROOT.iterdir())
        if d.is_dir() and not d.name.startswith((".", "__")) and (d / "package.json").is_file()
        and (selected is None or d.name in selected)
    ]
    if not pkg_dirs:
        print("No matching packages found.")
        return 1

    npm_bin = shutil.which("npm.cmd" if os.name == "nt" else "npm") or "npm"
    published = 0
    skipped = 0
    failed: list[str] = []

    with tempfile.TemporaryDirectory(prefix="gh_pkg_stage_") as tmp:
        stage_root = Path(tmp)
        userconfig: Path | None = None
        if auth_token:
            userconfig = stage_root / ".npmrc.auth"
            userconfig.write_text(
                f"@{GITHUB_OWNER}:registry={REGISTRY_URL}\n//npm.pkg.github.com/:_authToken={auth_token}\n",
                encoding="utf-8",
            )

        if not args.dry_run:
            ok, info = _preflight_auth(npm_bin, userconfig)
            if not ok:
                print(f"ERROR: GitHub Packages authentication failed -> {info}")
                return 1
            print(f"Authenticated to GitHub Packages as: {info}")

        total = len(pkg_dirs)
        for idx, pkg_dir in enumerate(pkg_dirs, start=1):
            staged = stage_package(pkg_dir, stage_root, version_override=args.version)
            cmd = [npm_bin, "publish", "--registry", REGISTRY_URL]
            if userconfig is not None:
                cmd.extend(["--userconfig", str(userconfig)])
            if args.dry_run:
                cmd.append("--dry-run")

            proc = subprocess.run(cmd, cwd=str(staged), capture_output=True, text=True)
            if proc.returncode == 0:
                published += 1
                print(f"[{idx}/{total}] OK   @{GITHUB_OWNER}/{pkg_dir.name}")
            else:
                out = (proc.stderr or proc.stdout).strip()
                if "Cannot publish over previously published version" in out or "409 Conflict" in out:
                    skipped += 1
                    print(f"[{idx}/{total}] SKIP @{GITHUB_OWNER}/{pkg_dir.name} (already published)")
                else:
                    reason = _extract_error(out)
                    failed.append(f"{pkg_dir.name}: {reason}")
                    print(f"[{idx}/{total}] FAIL @{GITHUB_OWNER}/{pkg_dir.name} -> {reason}")

    print(f"\nSummary: {published} published, {skipped} skipped, {len(failed)} failed (total {len(pkg_dirs)}).")
    return 1 if failed else 0


if __name__ == "__main__":
    raise SystemExit(main())
