"""
Universal Project Resolver & Runtime Registry for Workspace (@workspace/runner).

Dynamically discovers and configures projects from workspace configurations, CLI flags,
and project filesystem structures without hardcoding project specifics.
"""

from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path
from typing import Any, Dict, Optional, Tuple

# Platform-specific executable names
NPM_BIN = "npm.cmd" if sys.platform == "win32" else "npm"
NPX_BIN = "npx.cmd" if sys.platform == "win32" else "npx"


def _is_workspace_root_directory(candidate_dir: Path) -> bool:
    """Checks whether a directory contains monorepo root marker files."""
    if (candidate_dir / "projects.json").exists() or (candidate_dir / "pnpm-workspace.yaml").exists():
        return True
    if (candidate_dir / "package.json").exists() and (
        (candidate_dir / "packages").is_dir() or (candidate_dir / "Soul-DevPortal-Packages").is_dir()
    ):
        return True
    return False


def find_workspace_root(start_dir: Optional[Path] = None) -> Path:
    """Traverses upward from start_dir to locate the workspace root directory."""
    current_directory = (start_dir or Path.cwd()).resolve()
    for parent_directory in [current_directory, *current_directory.parents]:
        if _is_workspace_root_directory(parent_directory):
            return parent_directory
    return current_directory


def load_workspace_registry(workspace_root: Path) -> Dict[str, Dict[str, Any]]:
    """Loads external project configurations from projects.json or workspace.json if present."""
    config_filenames = ("projects.json", "workspace.json", "projects.config.json")
    for config_filename in config_filenames:
        config_path = workspace_root / config_filename
        if config_path.is_file():
            try:
                with open(config_path, "r", encoding="utf-8") as file_handle:
                    registry_data = json.load(file_handle)
                if isinstance(registry_data, dict):
                    return registry_data
            except Exception:
                pass
    return {}


def _detect_ports_and_title(project_name: str) -> tuple[int, int, str]:
    """Determines default port bindings and title based on project folder name."""
    clean_title = project_name.replace("-", " ").title()
    normalized_name = project_name.lower()

    if "devportal" in normalized_name or "dev-portal" in normalized_name:
        return 5181, 8008, "Soul Developer Portal"

    return 5173, 8000, clean_title


def _detect_frontend_framework_and_title(project_dir: Path, fallback_title: str) -> tuple[str, str]:
    """Extracts framework and display title by inspecting project package.json."""
    detected_framework = "Web Application"
    resolved_title = fallback_title

    package_json_path = project_dir / "package.json"
    if package_json_path.is_file():
        try:
            with open(package_json_path, "r", encoding="utf-8") as file_handle:
                metadata = json.load(file_handle)

            resolved_title = metadata.get("displayName") or metadata.get("title") or metadata.get("name", fallback_title)
            dependencies = {**metadata.get("dependencies", {}), **metadata.get("devDependencies", {})}

            if "next" in dependencies:
                detected_framework = "Next.js"
            elif "react" in dependencies and "vite" in dependencies:
                detected_framework = "React + Vite"
            elif "vue" in dependencies:
                detected_framework = "Vue"
        except Exception:
            pass

    return detected_framework, resolved_title


def _detect_frontend_command(project_dir: Path) -> list[str]:
    """Determines the appropriate npm command to run the client / frontend dev server."""
    if (project_dir / "client" / "package.json").is_file():
        return [NPM_BIN, "run", "dev", "--prefix", "client"]
    if (project_dir / "frontend" / "package.json").is_file():
        return [NPM_BIN, "run", "dev", "--prefix", "frontend"]
    
    # Check if project has a dev:client script in package.json
    pkg_path = project_dir / "package.json"
    if pkg_path.is_file():
        try:
            with open(pkg_path, "r", encoding="utf-8") as f:
                pkg_data = json.load(f)
            scripts = pkg_data.get("scripts", {})
            if "dev:client" in scripts and "soul-runner client" not in scripts["dev:client"]:
                return [NPM_BIN, "run", "dev:client"]
        except Exception:
            pass

    # Direct Vite fallback if vite config is present at project root
    if (project_dir / "vite.config.js").is_file() or (project_dir / "vite.config.ts").is_file():
        return [NPX_BIN, "vite"]

    return [NPM_BIN, "run", "dev"]


def _detect_backend_command(project_dir: Path) -> Optional[list[str]]:
    """Inspects project structure to locate the server / backend entrypoint and appropriate runner."""
    if (project_dir / "server" / "main.py").is_file():
        return [sys.executable, "-u", "server/main.py"]
    if (project_dir / "server" / "app.py").is_file():
        return [sys.executable, "-u", "server/app.py"]
    if (project_dir / "backend" / "main.py").is_file():
        return [sys.executable, "-u", "backend/main.py"]
    if (project_dir / "backend" / "app.py").is_file():
        return [sys.executable, "-u", "backend/app.py"]
    if (project_dir / "main.py").is_file():
        return [sys.executable, "-u", "main.py"]
    if (project_dir / "app.py").is_file():
        return [sys.executable, "-u", "app.py"]
    if (project_dir / "server" / "index.ts").is_file():
        return [NPX_BIN, "tsx", "server/index.ts"]
    if (project_dir / "server" / "index.js").is_file():
        return ["node", "server/index.js"]
    return None


def auto_detect_project(proj_dir: Path) -> Dict[str, Any]:
    """Inspects a project folder to auto-detect client/server commands, frameworks, and titles."""
    project_name = proj_dir.name
    frontend_port, backend_port, default_title = _detect_ports_and_title(project_name)
    framework, title = _detect_frontend_framework_and_title(proj_dir, default_title)

    fe_cmd = _detect_frontend_command(proj_dir)
    be_cmd = _detect_backend_command(proj_dir)

    # Attempt to retrieve authoritative metadata from config.internal.ports if available
    db_info = "Local Store"
    ai_engine = "N/A"
    try:
        try:
            from config.internal.ports import PORT_REGISTRY
        except ImportError:
            # Fallback dynamic path resolution
            import importlib.util
            _ports_file = proj_dir / "Soul-DevPortal-Packages" / "config" / "internal" / "ports.py"
            if not _ports_file.is_file():
                _ports_file = Path(__file__).resolve().parent.parent.parent / "config" / "internal" / "ports.py"
            if _ports_file.is_file():
                spec = importlib.util.spec_from_file_location("dynamic_ports", _ports_file)
                if spec and spec.loader:
                    mod = importlib.util.module_from_spec(spec)
                    spec.loader.exec_module(mod)
                    PORT_REGISTRY = getattr(mod, "PORT_REGISTRY", {})
                else:
                    PORT_REGISTRY = {}
            else:
                PORT_REGISTRY = {}

        normalized = project_name.lower()
        matched_key = None
        for k in PORT_REGISTRY:
            if k == normalized or k in normalized or normalized in k:
                matched_key = k
                break
        if not matched_key and ("devportal" in normalized or "dev-portal" in normalized):
            matched_key = "devportal"

        if matched_key and matched_key in PORT_REGISTRY:
            meta = PORT_REGISTRY[matched_key]
            title = meta.get("name", title)
            frontend_port = meta.get("client", frontend_port)
            backend_port = meta.get("server", backend_port)
            framework = meta.get("framework", framework)
            db_info = meta.get("db", db_info)
            ai_engine = meta.get("ai", ai_engine)
    except Exception:
        pass

    return {
        "title": title,
        "frontend_port": frontend_port,
        "backend_port": backend_port,
        "client_port": frontend_port,
        "server_port": backend_port,
        "frontend_cmd": fe_cmd,
        "backend_cmd": be_cmd,
        "client_cmd": fe_cmd,
        "server_cmd": be_cmd,
        "framework": framework,
        "db_info": db_info,
        "ai_engine": ai_engine,
    }


def resolve_project_name(query: str | None, registry: Dict[str, Any]) -> str | None:
    """Fuzzy-matches a query string to a registered project name in registry."""
    if not query:
        return None
    normalized_query = query.strip().lower()
    if normalized_query in registry:
        return normalized_query

    for registered_name in registry:
        if normalized_query in registered_name or registered_name.startswith(normalized_query):
            return registered_name
    return None


def _find_project_dir_by_name(workspace_root: Path, project_name: str) -> Path:
    """Resolves directory path for a known project name across standard monorepo locations."""
    if project_name in ("devportal", "portal", "dev-portal"):
        return workspace_root
    candidate_locations = [
        workspace_root / "Soul-DevPortal-Projects" / project_name,
        workspace_root / "projects" / project_name,
        workspace_root / project_name,
    ]
    for candidate in candidate_locations:
        if candidate.is_dir():
            return candidate
    return candidate_locations[0]


def _resolve_cli_query(
    workspace_root: Path,
    raw_query: str,
    registry: Dict[str, Any],
) -> Tuple[str, Dict[str, Any], Path]:
    """Resolves project name, configuration, and directory from a user-specified CLI query string."""
    matched_name = resolve_project_name(raw_query, registry)
    if matched_name:
        project_dir = _find_project_dir_by_name(workspace_root, matched_name)
        return matched_name, registry[matched_name], project_dir

    # Check if raw_query is a direct directory path
    candidate_dir = Path(raw_query).resolve()
    if not candidate_dir.is_dir():
        candidate_dir = (workspace_root / "Soul-DevPortal-Projects" / raw_query).resolve()
    if not candidate_dir.is_dir():
        candidate_dir = (workspace_root / "projects" / raw_query).resolve()
    if not candidate_dir.is_dir():
        candidate_dir = (workspace_root / raw_query).resolve()

    if candidate_dir.is_dir():
        return candidate_dir.name, auto_detect_project(candidate_dir), candidate_dir

    import difflib
    available_projects = list(registry.keys())
    close_matches = difflib.get_close_matches(raw_query.lower(), available_projects, n=3, cutoff=0.3)

    try:
        from .installer import (
            BOLD,
            BRIGHT_GREEN,
            CYAN,
            GRAY,
            RED,
            RESET,
            WHITE,
            YELLOW,
            _format_box_lines,
            get_terminal_width,
        )

        terminal_width = get_terminal_width(78)
        inner_width = terminal_width - 4
        b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
        b_h, b_ml, b_mr = "─", "├", "┤"

        print(file=sys.stderr)
        print(f" {RED}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}", file=sys.stderr)
        title = f" ⚠️   {BOLD}{RED}TARGET PROJECT NOT FOUND{RESET}"
        for l in _format_box_lines(title, inner_width, RED):
            print(l, file=sys.stderr)
        print(f" {RED}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}", file=sys.stderr)

        q_line = f"    Requested Query : {BOLD}{WHITE}'{raw_query}'{RESET}"
        for l in _format_box_lines(q_line, inner_width, RED):
            print(l, file=sys.stderr)

        if close_matches:
            sug_line = f"    {YELLOW}Did you mean{RESET}    : {BOLD}{BRIGHT_GREEN}[ {', '.join(close_matches)} ]{RESET} ?"
            for l in _format_box_lines(sug_line, inner_width, RED):
                print(l, file=sys.stderr)

        if available_projects:
            av_line = f"    Registered      : {CYAN}{', '.join(available_projects)}{RESET}"
            for l in _format_box_lines(av_line, inner_width, RED):
                print(l, file=sys.stderr)

        hint = f"    {YELLOW}➜ Fix{RESET}           : Pass {CYAN}--project <name>{RESET} from the list above"
        for l in _format_box_lines(hint, inner_width, RED):
            print(l, file=sys.stderr)

        print(f" {RED}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}", file=sys.stderr)
        print(file=sys.stderr)
    except Exception:
        sys.stderr.write(f"\033[31m[Error]\033[0m Could not locate project '{raw_query}'.\n")
        if close_matches:
            sys.stderr.write(f"Did you mean: {', '.join(close_matches)}?\n")
        if available_projects:
            sys.stderr.write(f"Available: {', '.join(available_projects)}\n")

    sys.exit(1)


def _resolve_from_current_directory(
    workspace_root: Path,
    current_directory: Path,
    registry: Dict[str, Any],
) -> Tuple[str, Dict[str, Any], Path]:
    """Resolves project when no specific query was passed, based on current working directory."""
    # Check if current directory is the root workspace / devportal
    if current_directory == workspace_root:
        if "devportal" in registry:
            return "devportal", registry["devportal"], workspace_root
        return "devportal", auto_detect_project(workspace_root), workspace_root

    for registered_name, registered_config in registry.items():
        if registered_name == "devportal":
            continue
        candidate_dir = _find_project_dir_by_name(workspace_root, registered_name).resolve()
        if candidate_dir == current_directory or candidate_dir in current_directory.parents:
            return registered_name, registered_config, candidate_dir

    # If current directory looks like a project, auto-detect it
    has_manifest = (current_directory / "package.json").is_file() or (current_directory / "pyproject.toml").is_file()
    if has_manifest:
        return current_directory.name, auto_detect_project(current_directory), current_directory

    # Fall back to first registered project in registry if available
    if registry:
        first_registered_name = next(iter(registry.keys()))
        first_dir = _find_project_dir_by_name(workspace_root, first_registered_name)
        return first_registered_name, registry[first_registered_name], first_dir

    return current_directory.name, auto_detect_project(current_directory), current_directory


def detect_target_project(
    start_dir: Optional[Path] = None,
    current_dir: Optional[Path] = None,
) -> Tuple[str, Dict[str, Any], Path]:
    """
    Dynamically resolves target project from CLI arguments, workspace config, or current directory.
    Returns (project_name, project_config, project_dir).
    """
    effective_dir = (current_dir or start_dir or Path.cwd()).resolve()

    argument_parser = argparse.ArgumentParser(add_help=False)
    argument_parser.add_argument("positional_project", nargs="?", default=None, help="Target project name or directory")
    argument_parser.add_argument("--project", "-p", type=str, default=None, help="Name of project to run")
    argument_parser.add_argument("--kill-port", action="store_true", help="Auto kill port collision")
    argument_parser.add_argument("--frontend-port", "-fp", type=int, default=None, help="Override client/frontend port")
    argument_parser.add_argument("--client-port", "-cp", type=int, default=None, help="Override client port")
    argument_parser.add_argument("--backend-port", "-bp", type=int, default=None, help="Override server/backend port")
    argument_parser.add_argument("--server-port", "-sp", type=int, default=None, help="Override server port")
    argument_parser.add_argument("--title", type=str, default=None, help="Override title")
    parsed_arguments, _ = argument_parser.parse_known_args()

    workspace_root = find_workspace_root(effective_dir)
    registry = load_workspace_registry(workspace_root)

    raw_query = parsed_arguments.project or parsed_arguments.positional_project

    if raw_query and not raw_query.startswith("-"):
        matched_name, project_config, project_dir = _resolve_cli_query(workspace_root, raw_query, registry)
    else:
        matched_name, project_config, project_dir = _resolve_from_current_directory(
            workspace_root,
            effective_dir,
            registry,
        )

    # Apply any CLI argument overrides
    final_config = dict(project_config or {})
    if "client_cmd" not in final_config and "frontend_cmd" in final_config:
        final_config["client_cmd"] = final_config["frontend_cmd"]
    if "server_cmd" not in final_config and "backend_cmd" in final_config:
        final_config["server_cmd"] = final_config["backend_cmd"]
    if "frontend_cmd" not in final_config and "client_cmd" in final_config:
        final_config["frontend_cmd"] = final_config["client_cmd"]
    if "backend_cmd" not in final_config and "server_cmd" in final_config:
        final_config["backend_cmd"] = final_config["server_cmd"]

    client_port_override = parsed_arguments.client_port or parsed_arguments.frontend_port
    server_port_override = parsed_arguments.server_port or parsed_arguments.backend_port
    if client_port_override:
        final_config["frontend_port"] = client_port_override
        final_config["client_port"] = client_port_override
    if server_port_override:
        final_config["backend_port"] = server_port_override
        final_config["server_port"] = server_port_override
    if parsed_arguments.title:
        final_config["title"] = parsed_arguments.title

    return matched_name, final_config, project_dir


# Expose dynamic registry getter
PROJECT_REGISTRY = load_workspace_registry(find_workspace_root())
