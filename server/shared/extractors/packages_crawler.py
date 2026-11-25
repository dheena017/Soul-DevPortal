"""
Packages Crawler and AST Explorer.
Discovers all packages in Soul-DevPortal-Packages/ and traverses AST symbols.
"""

from __future__ import annotations

import os
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List

from shared.extractors.ast_visitor import parse_python_symbols
from shared.extractors.manifest_reader import read_json_manifest, read_pyproject_toml
from shared.extractors.markdown_parser import parse_markdown_to_blocks
from shared.extractors.typescript_parser import parse_typescript_symbols


def _format_relative_time(dt: datetime) -> str:
    now = datetime.now(timezone.utc)
    diff = int((now - dt).total_seconds())
    if diff < 60:
        return f"{max(1, diff)}s"
    diff_min = diff // 60
    if diff_min < 60:
        return f"{diff_min}m"
    diff_hr = diff_min // 60
    if diff_hr < 24:
        return f"{diff_hr}h"
    diff_day = diff_hr // 24
    return f"{diff_day}d"


def _get_path_meta(target_path: Path) -> Dict[str, Any]:
    try:
        out = subprocess.check_output(
            ["git", "log", "-n", "1", "--pretty=format:%cI|%cr|%h", "--", str(target_path)],
            text=True,
            stderr=subprocess.DEVNULL,
            timeout=2.0,
        ).strip()
        if out:
            parts = out.split("|")
            dt = datetime.fromisoformat(parts[0])
            return {
                "updatedAt": parts[0],
                "relativeTime": _format_relative_time(dt),
                "commitHash": parts[2] if len(parts) > 2 else None,
            }
    except Exception:
        pass

    try:
        mtime = datetime.fromtimestamp(target_path.stat().st_mtime, tz=timezone.utc)
        return {
            "updatedAt": mtime.isoformat(),
            "relativeTime": _format_relative_time(mtime),
            "commitHash": None,
        }
    except Exception:
        now = datetime.now(timezone.utc)
        return {
            "updatedAt": now.isoformat(),
            "relativeTime": "21h",
            "commitHash": None,
        }


def crawl_packages(packages_root: Path) -> List[Dict[str, Any]]:
    """Discovers shared packages, manifests, and live AST symbols."""
    packages: List[Dict[str, Any]] = []
    if not packages_root.is_dir():
        return packages

    for pkg_dir in sorted(packages_root.iterdir()):
        if not pkg_dir.is_dir() or pkg_dir.name.startswith(".") or pkg_dir.name.startswith("__"):
            continue

        pkg_id = pkg_dir.name
        npm_manifest = read_json_manifest(pkg_dir / "package.json")
        py_manifest = read_pyproject_toml(pkg_dir / "pyproject.toml")

        name = npm_manifest.get("name") or f"@workspace/{pkg_id}"
        version = npm_manifest.get("version") or py_manifest.get("version") or "1.0.0"
        description = npm_manifest.get("description", "")

        symbols: List[Dict[str, Any]] = []
        file_count = 0
        total_lines = 0
        total_bytes = 0

        # Traverse source files while pruning heavy dependency/build trees
        ignored_dirs = {"node_modules", ".git", "__pycache__", "dist", ".venv", "venv"}
        for root, dirs, files in os.walk(pkg_dir):
            dirs[:] = sorted(d for d in dirs if d not in ignored_dirs)
            for fname in sorted(files):
                p = Path(root) / fname
                file_count += 1
                try:
                    total_bytes += p.stat().st_size
                except Exception:
                    pass

                if p.suffix in {".py", ".ts", ".tsx"}:
                    try:
                        content = p.read_text(encoding="utf-8")
                        total_lines += len(content.splitlines())
                    except Exception:
                        continue

                    rel_path = str(p.relative_to(pkg_dir)).replace("\\", "/")
                    if p.suffix == ".py":
                        symbols.extend(parse_python_symbols(p, rel_path))
                    else:
                        symbols.extend(parse_typescript_symbols(p, rel_path))

        tabs = [
            {"id": "docs", "label": "Documentation", "hasData": (pkg_dir / "README.md").is_file()},
            {"id": "api", "label": "AST Symbols", "hasData": len(symbols) > 0},
            {"id": "manifest", "label": "Manifests", "hasData": bool(npm_manifest or py_manifest)},
            {"id": "playground", "label": "Playground", "hasData": True},
        ]

        git_meta = _get_path_meta(pkg_dir)

        readme_path = pkg_dir / "README.md"
        readme_blocks = (
            parse_markdown_to_blocks(readme_path.read_text(encoding="utf-8"))
            if readme_path.is_file()
            else []
        )

        raw_exports = npm_manifest.get("exports")
        npm_exports = list(raw_exports.keys()) if isinstance(raw_exports, dict) else ["."]

        py_exports = list(
            dict.fromkeys(
                s["name"] for s in symbols if s.get("language") == "python" and s.get("name")
            )
        )
        ts_exports = list(
            dict.fromkeys(
                s["name"] for s in symbols if s.get("language") == "typescript" and s.get("name")
            )
        )

        py_dirs = [
            d.name
            for d in pkg_dir.iterdir()
            if d.is_dir() and d.name.startswith("workspace_")
        ]
        py_module = py_dirs[0] if py_dirs else None

        packages.append({
            "id": pkg_id,
            "name": name,
            "displayName": name,
            "version": version,
            "license": npm_manifest.get("license") or "MIT",
            "description": description,
            "relativePath": f"Soul-DevPortal-Packages/{pkg_id}",
            "language": "Python + TypeScript" if py_manifest.get("name") else "TypeScript",
            "hasNpmManifest": bool(npm_manifest),
            "hasPythonManifest": bool(py_manifest.get("name")),
            "pythonName": py_manifest.get("name"),
            "pythonModule": py_module,
            "pythonDependencies": py_manifest.get("dependencies", []),
            "exports": npm_exports,
            "pythonExports": py_exports,
            "typeScriptExports": ts_exports,
            "readmeBlocks": readme_blocks,
            "scripts": npm_manifest.get("scripts", {}),
            "dependencies": npm_manifest.get("dependencies", {}),
            "devDependencies": npm_manifest.get("devDependencies", {}),
            "peerDependencies": npm_manifest.get("peerDependencies", {}),
            "manifests": {"npm": npm_manifest, "python": py_manifest},
            "symbols": symbols,
            "updatedAt": git_meta["updatedAt"],
            "relativeTime": git_meta["relativeTime"],
            "commitHash": git_meta["commitHash"],
            "stats": {
                "fileCount": file_count,
                "linesOfCode": total_lines,
                "symbolsCount": len(symbols),
                "sizeBytes": total_bytes,
            },
            "tabs": tabs,
        })

    return packages
