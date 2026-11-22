"""
Cascading Environment Hierarchy & Parser for Workspace Runner (@workspace/runner).
Loads and merges .env files in cascading priority:
  1. Monorepo Root .env (lowest priority defaults)
  2. Monorepo Root .env.local
  3. Project Directory .env
  4. Project Directory .env.local (highest priority overrides)
"""

from __future__ import annotations

import os
import re
from pathlib import Path
from typing import Any

# Sensitive variable key substrings for redaction
_SENSITIVE_PATTERNS = re.compile(
    r"(KEY|SECRET|PASSWORD|TOKEN|AUTH|CREDENTIAL|PRIVATE|CERT)", re.IGNORECASE
)


def parse_env_file(file_path: Path) -> dict[str, str]:
    """
    Parses a single .env file into a dictionary without third-party dependencies.
    Supports comments (#), export prefixes, single/double quotes, and inline comments.
    """
    env_vars: dict[str, str] = {}
    if not file_path.is_file():
        return env_vars

    try:
        content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return env_vars

    for line in content.splitlines():
        line = line.strip()
        # Skip empty lines or pure comments
        if not line or line.startswith("#"):
            continue

        # Strip optional 'export ' prefix
        if line.startswith("export ") and len(line) > 7:
            line = line[7:].strip()

        # Match KEY=VALUE
        if "=" not in line:
            continue

        key, raw_val = line.split("=", 1)
        key = key.strip()
        if not key:
            continue

        val = raw_val.strip()

        # Handle quoted values
        if len(val) >= 2 and (
            (val.startswith('"') and val.endswith('"'))
            or (val.startswith("'") and val.endswith("'"))
        ):
            val = val[1:-1]
        else:
            # Handle inline comments for unquoted values (e.g. PORT=8000 # default)
            if " #" in val:
                val = val.split(" #", 1)[0].strip()

        env_vars[key] = val

    return env_vars


def _interpolate_variables(env_dict: dict[str, str], base_env: dict[str, str]) -> dict[str, str]:
    """Resolves ${VAR:-default} and ${VAR} style variable expansions."""
    merged = {**base_env, **env_dict}
    resolved: dict[str, str] = {}

    pattern = re.compile(r"\$\{([A-Za-z0-9_]+)(?::-([^}]*))?\}")

    for k, v in env_dict.items():
        def repl(m: re.Match) -> str:
            var_name = m.group(1)
            default_val = m.group(2) or ""
            return merged.get(var_name, default_val)

        resolved[k] = pattern.sub(repl, v)

    return resolved


def load_cascading_env(
    project_dir: Path | None = None,
    repo_root: Path | None = None,
) -> tuple[dict[str, str], list[Path]]:
    """
    Discovers, parses, and cascades .env files across monorepo root and project directory.
    Returns:
        (merged_env_dict, list_of_loaded_env_file_paths)
    """
    if repo_root is None:
        # Default repo root: 3 levels up from this file (packages/runner/workspace_runner/env.py -> workspace)
        repo_root = Path(__file__).resolve().parent.parent.parent.parent

    candidate_files: list[Path] = [
        repo_root / ".env",
        repo_root / ".env.local",
    ]

    if project_dir and project_dir != repo_root:
        candidate_files.extend([
            project_dir / ".env",
            project_dir / ".env.local",
        ])

    loaded_files: list[Path] = []
    accumulated_vars: dict[str, str] = {}

    for f in candidate_files:
        if f.is_file():
            parsed = parse_env_file(f)
            accumulated_vars.update(parsed)
            loaded_files.append(f)

    # Interpolate variables using existing system environment as baseline
    system_env = dict(os.environ)
    final_vars = _interpolate_variables(accumulated_vars, system_env)

    # Synthesize complete environment for subprocess execution
    full_env = {**system_env, **final_vars}

    # Ensure unbuffered output and ANSI terminal colors are forced in child runtimes
    full_env["PYTHONUNBUFFERED"] = "1"
    full_env["FORCE_COLOR"] = "1"

    return full_env, loaded_files


def get_env_summary(project_dir: Path | None = None, repo_root: Path | None = None) -> dict[str, Any]:
    """Generates a secure summary of loaded environment variables with secrets redacted."""
    full_env, loaded_files = load_cascading_env(project_dir, repo_root)

    safe_entries: dict[str, str] = {}
    total_custom_vars = 0

    # Collect custom variables loaded from files
    for f in loaded_files:
        parsed = parse_env_file(f)
        total_custom_vars += len(parsed)
        for k in parsed:
            val = full_env.get(k, "")
            if _SENSITIVE_PATTERNS.search(k) and len(val) > 4:
                safe_entries[k] = f"{val[:2]}••••••••{val[-2:]}"
            elif _SENSITIVE_PATTERNS.search(k):
                safe_entries[k] = "••••••••"
            else:
                safe_entries[k] = val

    return {
        "loaded_files": [str(f) for f in loaded_files],
        "total_variables": total_custom_vars,
        "variables": safe_entries,
    }
