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

# Substrings identifying sensitive variables requiring redaction in logs/summaries
_SENSITIVE_KEY_PATTERN = re.compile(
    r"(KEY|SECRET|PASSWORD|TOKEN|AUTH|CREDENTIAL|PRIVATE|CERT)",
    re.IGNORECASE,
)

# Variable interpolation syntax: ${VAR_NAME} or ${VAR_NAME:-default_value}
_VARIABLE_EXPANSION_PATTERN = re.compile(r"\$\{([A-Za-z0-9_]+)(?::-([^}]*))?\}")


def _clean_env_line(raw_line: str) -> str | None:
    """Strips whitespace and comments from an environment file line."""
    stripped_line = raw_line.strip()
    if not stripped_line or stripped_line.startswith("#"):
        return None

    # Strip optional POSIX 'export ' prefix
    if stripped_line.startswith("export ") and len(stripped_line) > 7:
        stripped_line = stripped_line[7:].strip()

    return stripped_line if "=" in stripped_line else None


def _strip_enclosing_quotes(raw_value: str) -> str:
    """Removes matching enclosing single or double quotes from a value."""
    if len(raw_value) >= 2:
        has_double_quotes = raw_value.startswith('"') and raw_value.endswith('"')
        has_single_quotes = raw_value.startswith("'") and raw_value.endswith("'")
        if has_double_quotes or has_single_quotes:
            return raw_value[1:-1]
    return raw_value


def _strip_inline_comments(raw_value: str) -> str:
    """Strips trailing inline comments (e.g., 'PORT=8000 # default') for unquoted values."""
    if " #" in raw_value:
        return raw_value.split(" #", 1)[0].strip()
    return raw_value


def _parse_line_key_value(cleaned_line: str) -> tuple[str, str] | None:
    """Splits a single cleaned KEY=VALUE line into its key and sanitized value."""
    key, raw_value = cleaned_line.split("=", 1)
    normalized_key = key.strip()
    if not normalized_key:
        return None

    trimmed_value = raw_value.strip()
    quoted_value = _strip_enclosing_quotes(trimmed_value)
    if quoted_value != trimmed_value:
        final_value = quoted_value
    else:
        final_value = _strip_inline_comments(trimmed_value)

    return normalized_key, final_value


def parse_env_file(file_path: Path) -> dict[str, str]:
    """
    Parses a single .env file into a dictionary without third-party dependencies.
    Supports comments (#), export prefixes, single/double quotes, and inline comments.
    """
    parsed_variables: dict[str, str] = {}
    if not file_path.is_file():
        return parsed_variables

    try:
        file_content = file_path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return parsed_variables

    for raw_line in file_content.splitlines():
        cleaned_line = _clean_env_line(raw_line)
        if not cleaned_line:
            continue

        parsed_pair = _parse_line_key_value(cleaned_line)
        if parsed_pair is not None:
            variable_key, variable_value = parsed_pair
            parsed_variables[variable_key] = variable_value

    return parsed_variables


def _interpolate_variables(env_dict: dict[str, str], base_env: dict[str, str]) -> dict[str, str]:
    """Resolves ${VAR:-default} and ${VAR} style variable expansions against merged environment."""
    merged_lookup_context = {**base_env, **env_dict}
    interpolated_variables: dict[str, str] = {}

    def _resolve_match(match: re.Match[str]) -> str:
        variable_name = match.group(1)
        fallback_default = match.group(2) or ""
        return merged_lookup_context.get(variable_name, fallback_default)

    for variable_name, raw_expression in env_dict.items():
        interpolated_variables[variable_name] = _VARIABLE_EXPANSION_PATTERN.sub(
            _resolve_match,
            raw_expression,
        )

    return interpolated_variables


def _resolve_default_workspace_root() -> Path:
    """Finds default repo root (4 levels up from this module: packages/runner/internal/env.py -> workspace)."""
    return Path(__file__).resolve().parent.parent.parent.parent


def _collect_cascading_env_files(project_dir: Path | None, repo_root: Path) -> list[Path]:
    """Gathers candidate .env file paths in cascading priority order."""
    candidate_paths: list[Path] = [
        repo_root / ".env",
        repo_root / ".env.local",
    ]

    if project_dir and project_dir != repo_root:
        candidate_paths.extend([
            project_dir / ".env",
            project_dir / ".env.local",
        ])

    return candidate_paths


def load_cascading_env(
    project_dir: Path | None = None,
    repo_root: Path | None = None,
) -> tuple[dict[str, str], list[Path]]:
    """
    Discovers, parses, and cascades .env files across monorepo root and project directory.
    Returns:
        (merged_env_dict, list_of_loaded_env_file_paths)
    """
    resolved_root = repo_root or _resolve_default_workspace_root()
    candidate_files = _collect_cascading_env_files(project_dir, resolved_root)

    loaded_file_paths: list[Path] = []
    accumulated_file_variables: dict[str, str] = {}

    for env_file in candidate_files:
        if env_file.is_file():
            parsed_entries = parse_env_file(env_file)
            accumulated_file_variables.update(parsed_entries)
            loaded_file_paths.append(env_file)

    # Interpolate variables using the host OS environment as baseline
    system_host_environment = dict(os.environ)
    interpolated_custom_variables = _interpolate_variables(
        accumulated_file_variables,
        system_host_environment,
    )

    # Synthesize the complete environment for child subprocesses
    synthesized_environment = {**system_host_environment, **interpolated_custom_variables}

    # Force unbuffered Python output and ANSI terminal colors in all spawned processes
    synthesized_environment["PYTHONUNBUFFERED"] = "1"
    synthesized_environment["FORCE_COLOR"] = "1"

    # Ensure monorepo root node_modules/.bin (soul-runner, soul-ports, soul-dev) is in PATH
    root_bin = resolved_root / "node_modules" / ".bin"
    if root_bin.is_dir():
        existing_path = synthesized_environment.get("PATH", "")
        root_bin_str = str(root_bin)
        if root_bin_str not in existing_path:
            synthesized_environment["PATH"] = (
                f"{root_bin_str}{os.pathsep}{existing_path}" if existing_path else root_bin_str
            )

    return synthesized_environment, loaded_file_paths


def get_env_variable(
    key: str,
    default: Any = None,
    fallback_keys: list[str] | None = None,
    cast_type: type | None = None,
    env: dict[str, str] | None = None,
) -> Any:
    """
    Safely retrieves an environment variable with fallback keys, default values, and type casting.
    
    Example:
        port = get_env_variable("PORT", default=5173, fallback_keys=["CLIENT_PORT", "FRONTEND_PORT"], cast_type=int)
    """
    source_env = env if env is not None else os.environ

    candidate_keys = [key] + (fallback_keys or [])
    raw_val: str | None = None
    for cand in candidate_keys:
        if cand in source_env and source_env[cand].strip() != "":
            raw_val = source_env[cand].strip()
            break

    if raw_val is None:
        return default

    if cast_type is not None:
        try:
            if cast_type is bool:
                return raw_val.lower() in ("true", "1", "yes", "on")
            return cast_type(raw_val)
        except (ValueError, TypeError):
            return default

    return raw_val


def _mask_sensitive_secret(secret_value: str) -> str:
    """Masks secret values with dots, showing only initial and trailing characters when long enough."""
    if len(secret_value) > 4:
        return f"{secret_value[:2]}••••••••{secret_value[-2:]}"
    return "••••••••"


def get_env_summary(project_dir: Path | None = None, repo_root: Path | None = None) -> dict[str, Any]:
    """Generates a secure summary of loaded environment variables with secrets redacted."""
    full_environment, loaded_env_files = load_cascading_env(project_dir, repo_root)

    safe_variables: dict[str, str] = {}
    total_custom_variables_count = 0

    for env_file in loaded_env_files:
        parsed_entries = parse_env_file(env_file)
        total_custom_variables_count += len(parsed_entries)

        for variable_key in parsed_entries:
            raw_value = full_environment.get(variable_key, "")
            if _SENSITIVE_KEY_PATTERN.search(variable_key):
                safe_variables[variable_key] = _mask_sensitive_secret(raw_value)
            else:
                safe_variables[variable_key] = raw_value

    return {
        "loaded_files": [str(file_path) for file_path in loaded_env_files],
        "total_variables": total_custom_variables_count,
        "variables": safe_variables,
    }
