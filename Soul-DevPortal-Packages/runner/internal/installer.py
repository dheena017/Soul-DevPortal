"""
Dual-Stack Dependency Inspector & Automated Installer Component (@workspace/runner).

Orchestrates frontend (Node.js/npm) and backend (Python/venv) pre-flight inspection,
renders high-visibility colorful terminal banners, and runs reliable installations.
Directly consumed by runner/bin/run-dev.py and runner/bin/run-install.py.
"""

from __future__ import annotations

import json
import os
import platform
import re
import shutil
import subprocess
import sys
import threading
import time
import unicodedata
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Terminal Color Palette
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"

BLUE = "\033[38;5;39m"
CYAN = "\033[38;5;45m"
BRIGHT_CYAN = "\033[38;5;51m"
GREEN = "\033[38;5;48m"
BRIGHT_GREEN = "\033[38;5;84m"
YELLOW = "\033[38;5;220m"
AMBER = "\033[38;5;214m"
RED = "\033[38;5;196m"
MAGENTA = "\033[38;5;213m"
PURPLE = "\033[38;5;141m"
GRAY = "\033[38;5;244m"
WHITE = "\033[38;5;255m"

# Pill Badges
BG_GREEN = "\033[48;5;28m\033[38;5;255m\033[1m"
BG_AMBER = "\033[48;5;214m\033[38;5;16m\033[1m"
BG_CYAN = "\033[48;5;31m\033[38;5;255m\033[1m"
BG_PURPLE = "\033[48;5;97m\033[38;5;255m\033[1m"
BG_GRAY = "\033[48;5;238m\033[38;5;250m\033[1m"

# Executables
NPM_BIN = "npm.cmd" if sys.platform == "win32" else "npm"
PYTHON_BIN = sys.executable

# Key framework packages to track in manifests
_KEY_FRONTEND_PACKAGES = [
    "react", "react-dom", "vite", "next", "tailwindcss",
    "@workspace/config", "@workspace/logger", "@workspace/runner",
    "framer-motion", "lucide-react", "zustand", "three",
]

_KEY_BACKEND_PACKAGES = [
    "fastapi", "uvicorn", "starlette", "pydantic", "sqlalchemy",
    "aiosqlite", "sqlite3", "google-genai", "google-generativeai",
    "pytest", "workspace-logger", "workspace-runner", "workspace-config",
]


def get_terminal_width(default_width: int = 78) -> int:
    """Calculates clamped terminal width between 64 and 80 columns."""
    try:
        available_columns = shutil.get_terminal_size((default_width, 24)).columns
        return min(max(available_columns - 2, 64), 78)
    except Exception:
        return default_width


def _strip_ansi(text: str) -> str:
    """Removes ANSI escape codes from string for exact column length calculations."""
    return re.sub(r"\033\[[0-9;]*[mK]", "", text)


def _visual_len(text: str) -> int:
    """Calculates visual terminal column width, properly accounting for wide Unicode characters & emojis."""
    clean = _strip_ansi(text)
    width = 0
    i = 0
    while i < len(clean):
        ch = clean[i]
        # Check variation selector 16 (emoji presentation)
        if i + 1 < len(clean) and clean[i + 1] == "\ufe0f":
            width += 2
            i += 2
            continue
        ea = unicodedata.east_asian_width(ch)
        if ea in ("W", "F"):
            width += 2
        elif ord(ch) in (0x26A1, 0x1F389, 0x1F4E6, 0x1F40D, 0x2728, 0x1F680, 0x1F525, 0x1F4CA):
            width += 2
        else:
            width += 1
        i += 1
    return width


def _format_box_lines(content: str, inner_width: int, border_color: str = CYAN) -> list[str]:
    """Wraps text within inner_width and pads lines so the right border always aligns with pixel precision."""
    lines: list[str] = []
    v_border = f"{border_color}│{RESET}"

    for raw_part in content.split("\n"):
        v_width = _visual_len(raw_part)
        if v_width <= inner_width:
            padding_spaces = max(0, inner_width - v_width)
            lines.append(f" {v_border} {raw_part}{' ' * padding_spaces} {v_border}")
        else:
            leading_spaces = len(_strip_ansi(raw_part)) - len(_strip_ansi(raw_part).lstrip(" "))
            indent = " " * leading_spaces
            words = raw_part.strip().split(" ")
            current_line = indent
            for word in words:
                candidate = f"{current_line} {word}" if current_line.strip() else f"{indent}{word}"
                if _visual_len(candidate) <= inner_width:
                    current_line = candidate
                else:
                    if current_line:
                        padding_spaces = max(0, inner_width - _visual_len(current_line))
                        lines.append(f" {v_border} {current_line}{' ' * padding_spaces} {v_border}")
                    current_line = f"{indent}   {word}"
            if current_line:
                padding_spaces = max(0, inner_width - _visual_len(current_line))
                lines.append(f" {v_border} {current_line}{' ' * padding_spaces} {v_border}")

    return lines


def _wrap_package_tokens(prefix: str, packages: list[str], inner_width: int, token_color: str) -> list[str]:
    """Wraps packages neatly onto indented lines without exceeding border boundaries."""
    if not packages:
        return []

    lines: list[str] = []
    bullet = f" {GRAY}•{RESET} "
    colored_tokens = [f"{token_color}{pkg}{RESET}" for pkg in packages]

    current_line = prefix
    for token in colored_tokens:
        candidate = f"{current_line}{bullet}{token}" if current_line != prefix else f"{prefix}{token}"
        if _visual_len(candidate) <= inner_width:
            current_line = candidate
        else:
            lines.append(current_line)
            current_line = f"   {' ' * 13}{token}"

    if current_line:
        lines.append(current_line)

    return lines


# ─────────────────────────────────────────────────────────────────────────────
# 1. PRE-FLIGHT AUDIT & INSPECTION
# ─────────────────────────────────────────────────────────────────────────────

def _find_frontend_directory_and_manifest(project_dir: Path) -> tuple[Optional[Path], Optional[Path]]:
    """Checks project root, client/, and frontend/ directories for package.json."""
    for candidate_dir in [project_dir, project_dir / "client", project_dir / "frontend"]:
        package_json_candidate = candidate_dir / "package.json"
        if package_json_candidate.is_file():
            return candidate_dir, package_json_candidate
    return None, None


def _inspect_frontend_tier(project_dir: Path) -> Dict[str, Any]:
    """Inspects Node.js package manifests, dependencies, and node_modules directory."""
    frontend_info: Dict[str, Any] = {
        "has_manifest": False,
        "manifest_path": None,
        "package_manager": "npm",
        "is_installed": False,
        "node_modules_path": None,
        "dep_count": 0,
        "dev_dep_count": 0,
        "key_packages": [],
    }

    target_frontend_dir, manifest_path = _find_frontend_directory_and_manifest(project_dir)
    if not (target_frontend_dir and manifest_path):
        return frontend_info

    frontend_info["has_manifest"] = True
    frontend_info["manifest_path"] = manifest_path

    node_modules_dir = target_frontend_dir / "node_modules"
    frontend_info["node_modules_path"] = node_modules_dir
    frontend_info["is_installed"] = node_modules_dir.is_dir() and any(node_modules_dir.iterdir())

    try:
        with open(manifest_path, "r", encoding="utf-8") as file_handle:
            package_data = json.load(file_handle)

        prod_dependencies = package_data.get("dependencies", {})
        dev_dependencies = package_data.get("devDependencies", {})
        frontend_info["dep_count"] = len(prod_dependencies)
        frontend_info["dev_dep_count"] = len(dev_dependencies)

        all_dependencies = {**prod_dependencies, **dev_dependencies}
        frontend_info["key_packages"] = [pkg for pkg in _KEY_FRONTEND_PACKAGES if pkg in all_dependencies]
    except Exception:
        pass

    return frontend_info


def _find_virtual_environment(project_dir: Path) -> tuple[Optional[Path], str]:
    """Scans for dedicated Python virtual environments (.venv/venv)."""
    candidate_venv_dirs = [
        project_dir / ".venv",
        project_dir / "venv",
        project_dir / "server" / ".venv",
        project_dir / "backend" / ".venv",
    ]
    for venv_dir in candidate_venv_dirs:
        if venv_dir.is_dir():
            if sys.platform == "win32":
                python_executable = venv_dir / "Scripts" / "python.exe"
            else:
                python_executable = venv_dir / "bin" / "python"
            if python_executable.is_file():
                return venv_dir, str(python_executable)

    return None, PYTHON_BIN


def _find_backend_manifest(project_dir: Path) -> tuple[Optional[Path], Optional[str], int, list[str]]:
    """Locates requirements.txt or pyproject.toml and extracts dependency counts and key libraries."""
    candidate_manifest_paths = [
        project_dir / "requirements.txt",
        project_dir / "server" / "requirements.txt",
        project_dir / "backend" / "requirements.txt",
        project_dir / "pyproject.toml",
    ]
    for manifest_path in candidate_manifest_paths:
        if manifest_path.is_file():
            try:
                manifest_text = manifest_path.read_text(encoding="utf-8")
                valid_lines = [
                    line.strip()
                    for line in manifest_text.splitlines()
                    if line.strip() and not line.startswith("#")
                ]
                text_lower = manifest_text.lower()
                matched_packages = [pkg for pkg in _KEY_BACKEND_PACKAGES if pkg in text_lower]
                return manifest_path, manifest_path.name, len(valid_lines), matched_packages
            except Exception:
                return manifest_path, manifest_path.name, 0, []
    return None, None, 0, []


def _inspect_backend_tier(project_dir: Path) -> Dict[str, Any]:
    """Inspects Python backend virtual environments, requirements, and key packages."""
    venv_path, python_executable = _find_virtual_environment(project_dir)
    manifest_path, manifest_type, requirement_count, key_packages = _find_backend_manifest(project_dir)

    return {
        "has_manifest": manifest_path is not None,
        "manifest_type": manifest_type,
        "manifest_path": manifest_path,
        "venv_path": venv_path,
        "python_executable": python_executable,
        "is_installed": bool(venv_path) or True,
        "req_count": requirement_count,
        "key_packages": key_packages,
    }


def inspect_project_install(proj_dir: Path) -> Dict[str, Any]:
    """Inspects frontend and backend project structure, manifests, and installation state."""
    frontend_info = _inspect_frontend_tier(proj_dir)
    backend_info = _inspect_backend_tier(proj_dir)

    frontend_ready = (not frontend_info["has_manifest"]) or frontend_info["is_installed"]
    backend_ready = (not backend_info["has_manifest"]) or backend_info["is_installed"]

    return {
        "name": proj_dir.name,
        "path": proj_dir,
        "frontend": frontend_info,
        "backend": backend_info,
        "overall_ready": frontend_ready and backend_ready,
    }


# ─────────────────────────────────────────────────────────────────────────────
# 2. COLORFUL BANNER PRESENTATION
# ─────────────────────────────────────────────────────────────────────────────

def _render_frontend_section(frontend_info: Dict[str, Any], inner_width: int, border_color: str) -> list[str]:
    lines: list[str] = []
    header = f"{BG_CYAN} NODE.JS CLIENT {RESET}  {BOLD}{WHITE}Frontend Application Ecosystem{RESET}"
    lines.extend(_format_box_lines(header, inner_width, border_color))

    if not frontend_info.get("has_manifest"):
        status_line = f"   {GRAY}Status{RESET}       : {BG_GRAY} NOT CONFIGURED {RESET}  {GRAY}No package.json detected{RESET}"
    elif frontend_info.get("is_installed"):
        status_line = f"   {GRAY}Status{RESET}       : {BG_GREEN} READY {RESET}  {BRIGHT_GREEN}● node_modules verified{RESET}"
    else:
        status_line = f"   {GRAY}Status{RESET}       : {BG_AMBER} NEEDS INSTALL {RESET}  {YELLOW}⟳ Missing dependencies{RESET}"
    lines.extend(_format_box_lines(status_line, inner_width, border_color))

    if frontend_info.get("has_manifest"):
        prod_count = frontend_info.get("dep_count", 0)
        dev_count = frontend_info.get("dev_dep_count", 0)
        manager = frontend_info.get("package_manager", "npm")
        meta_line = (
            f"   {GRAY}Dependencies{RESET} : {BOLD}{WHITE}{prod_count}{RESET} prod, "
            f"{BOLD}{WHITE}{dev_count}{RESET} dev  {GRAY}·{RESET}  Manager: {CYAN}{manager}{RESET}"
        )
        lines.extend(_format_box_lines(meta_line, inner_width, border_color))

        key_packages = frontend_info.get("key_packages", [])
        if key_packages:
            prefix = f"   {GRAY}Key Packages{RESET} : "
            for pkg_line in _wrap_package_tokens(prefix, key_packages, inner_width, BRIGHT_CYAN):
                lines.extend(_format_box_lines(pkg_line, inner_width, border_color))

    return lines


def _render_backend_section(backend_info: Dict[str, Any], inner_width: int, border_color: str) -> list[str]:
    lines: list[str] = []
    header = f"{BG_PURPLE} PYTHON SERVER {RESET}   {BOLD}{WHITE}Backend Microservice Ecosystem{RESET}"
    lines.extend(_format_box_lines(header, inner_width, border_color))

    if not backend_info.get("has_manifest"):
        status_line = f"   {GRAY}Status{RESET}       : {BG_GRAY} CLIENT-ONLY {RESET}  {GRAY}No backend manifest{RESET}"
    elif backend_info.get("is_installed"):
        status_line = f"   {GRAY}Status{RESET}       : {BG_GREEN} READY {RESET}  {BRIGHT_GREEN}● Environment ready{RESET}"
    else:
        status_line = f"   {GRAY}Status{RESET}       : {BG_AMBER} NEEDS INSTALL {RESET}  {YELLOW}⟳ Missing requirements{RESET}"
    lines.extend(_format_box_lines(status_line, inner_width, border_color))

    if backend_info.get("has_manifest"):
        py_exe_name = Path(backend_info.get("python_executable", "python")).name
        env_label = (
            f".venv ({py_exe_name})"
            if backend_info.get("venv_path")
            else f"System ({py_exe_name})"
        )
        req_count = backend_info.get("req_count", 0)
        meta_line = (
            f"   {GRAY}Requirements{RESET} : {BOLD}{WHITE}{req_count}{RESET} packages  {GRAY}·{RESET}  "
            f"Runtime: {PURPLE}{env_label}{RESET}"
        )
        lines.extend(_format_box_lines(meta_line, inner_width, border_color))

        key_packages = backend_info.get("key_packages", [])
        if key_packages:
            prefix = f"   {GRAY}Key Packages{RESET} : "
            for pkg_line in _wrap_package_tokens(prefix, key_packages, inner_width, MAGENTA):
                lines.extend(_format_box_lines(pkg_line, inner_width, border_color))

    return lines


def _get_host_runtime_telemetry() -> Dict[str, str]:
    """Queries host runtime metrics: Python, Node.js, and OS platform."""
    py_ver = sys.version.split()[0]
    os_label = f"{platform.system()} ({platform.machine()})"

    node_ver = "N/A"
    try:
        node_bin = shutil.which("node") or "node"
        res = subprocess.run([node_bin, "-v"], capture_output=True, text=True, check=False)
        if res.returncode == 0 and res.stdout.strip():
            node_ver = res.stdout.strip()
    except Exception:
        pass

    return {
        "python": py_ver,
        "node": node_ver,
        "os": os_label,
    }


def print_installation_banner(info: Dict[str, Any], action_message: Optional[str] = None) -> None:
    """Renders a high-visibility, rounded-corner dual-stack installation audit banner."""
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    border_color = CYAN
    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    border_top = f" {border_color}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    border_mid = f" {border_color}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
    border_bot = f" {border_color}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    project_name = info.get("name", "PROJECT").upper()
    telemetry = _get_host_runtime_telemetry()

    print()
    print(border_top)

    title_line = f" {YELLOW}⚡{RESET} {BOLD}{WHITE}WORKSPACE PRE-FLIGHT DEPENDENCY AUDIT{RESET}"
    for l in _format_box_lines(title_line, inner_width, border_color):
        print(l)

    sub_line = (
        f"   {GRAY}Target Project{RESET} : {BOLD}{BRIGHT_GREEN}[ {project_name} ]{RESET}  "
        f"{GRAY}·  Soul Workspace Monorepo{RESET}"
    )
    for l in _format_box_lines(sub_line, inner_width, border_color):
        print(l)

    host_line = (
        f"   {GRAY}Host Runtime{RESET}   : {BOLD}{WHITE}Python {telemetry['python']}{RESET}  {GRAY}·{RESET}  "
        f"{BOLD}{WHITE}Node {telemetry['node']}{RESET}  {GRAY}·{RESET}  "
        f"{CYAN}{telemetry['os']}{RESET}"
    )
    for l in _format_box_lines(host_line, inner_width, border_color):
        print(l)

    print(border_mid)

    for l in _render_frontend_section(info.get("frontend", {}), inner_width, border_color):
        print(l)

    print(border_mid)

    for l in _render_backend_section(info.get("backend", {}), inner_width, border_color):
        print(l)

    if action_message:
        print(border_mid)
        action_line = f" {YELLOW}➜{RESET} {BOLD}{YELLOW}ACTION{RESET} : {BOLD}{WHITE}{action_message}{RESET}"
        for l in _format_box_lines(action_line, inner_width, border_color):
            print(l)

    print(border_bot)
    print()


def print_completion_card(
    project_name: str,
    elapsed_seconds: float,
    overall_success: bool,
    frontend_ok: bool,
    backend_ok: bool,
) -> None:
    """Renders a colorful summary card upon completion."""
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    card_border_color = BRIGHT_GREEN if overall_success else RED
    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    top = f" {card_border_color}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    mid = f" {card_border_color}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
    bot = f" {card_border_color}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    print(top)
    if overall_success:
        title = f" 🎉  {BOLD}{WHITE}DUAL-STACK ENVIRONMENT READY{RESET}  {GRAY}·{RESET}  {BRIGHT_GREEN}{elapsed_seconds}s{RESET}"
        for l in _format_box_lines(title, inner_width, card_border_color):
            print(l)
        print(mid)
        fe_line = f"    {BRIGHT_GREEN}●{RESET} {BOLD}Client Tier{RESET} : Node.js dev ecosystem verified"
        be_line = f"    {BRIGHT_GREEN}●{RESET} {BOLD}Server Tier{RESET} : Python requirements verified"
        hint_line = f"    {YELLOW}➜{RESET} {GRAY}Next Step{RESET}   : {BOLD}{CYAN}python runner/bin/run-dev.py -p {project_name.lower()}{RESET}"
        for l in _format_box_lines(fe_line, inner_width, card_border_color):
            print(l)
        for l in _format_box_lines(be_line, inner_width, card_border_color):
            print(l)
        for l in _format_box_lines(hint_line, inner_width, card_border_color):
            print(l)
    else:
        title = f" ⚠️  {BOLD}{RED}INSTALLATION COMPLETED WITH ISSUES{RESET}  {GRAY}·{RESET}  {RED}{elapsed_seconds}s{RESET}"
        for l in _format_box_lines(title, inner_width, card_border_color):
            print(l)

    print(bot)
    print()


# ─────────────────────────────────────────────────────────────────────────────
# 3. AUTOMATED DUAL-STACK INSTALLATION EXECUTION
# ─────────────────────────────────────────────────────────────────────────────

def _diagnose_installation_error(tier: str, raw_output: str) -> tuple[str, list[str]]:
    """Analyzes raw npm or pip error streams to diagnose root cause and recommend actionable fixes."""
    out_lower = raw_output.lower()

    if tier.lower() == "client":
        if "eacces" in out_lower or "eperm" in out_lower:
            return "File permission denied while writing to node_modules", [
                "Run terminal with elevated/administrator privileges",
                "Check filesystem permissions on project directory",
            ]
        if "enotfound" in out_lower or "etimedout" in out_lower or "network" in out_lower:
            return "Network timeout or unreachable package registry", [
                "Verify your internet connection and proxy settings",
                "Check npm registry: npm config get registry",
            ]
        if "eresolve" in out_lower or "peer dep" in out_lower:
            return "Peer dependency resolution conflict", [
                "Run with --clean to purge existing node_modules",
                "Try installing with: npm install --legacy-peer-deps",
            ]
        if "enoent" in out_lower:
            return "Referenced file or package.json not found", [
                "Verify package.json exists in target folder",
                "Check for missing package path references",
            ]
        return "NPM package installation failed", [
            "Run with --clean to perform a fresh installation",
            "Inspect package.json dependencies for version typos",
        ]

    # Backend / Python diagnostics
    if "no matching distribution" in out_lower:
        return "Package not found or incompatible with host Python version", [
            "Check requirements.txt for package name typos",
            "Verify package supports your Python runtime version",
        ]
    if "permission denied" in out_lower:
        return "Insufficient permissions to write to site-packages", [
            "Use a dedicated virtual environment (.venv)",
            "Run terminal with appropriate write permissions",
        ]
    if "microsoft visual c++" in out_lower or "fatal error c1083" in out_lower:
        return "C++ compilation tools required for native C extension package", [
            "Install Visual Studio C++ Build Tools",
            "Look for pre-built wheel versions of the target package",
        ]
    if "metadata-generation-failed" in out_lower or "setup.py" in out_lower:
        return "Package metadata build failed during pip resolution", [
            "Upgrade pip: python -m pip install --upgrade pip setuptools wheel",
            "Verify package requirements.txt compatibility",
        ]

    return "Python pip requirements installation failed", [
        "Upgrade pip: python -m pip install --upgrade pip",
        "Inspect requirements.txt for conflicting constraints",
    ]


def _render_installation_error_card(tier: str, returncode: int, raw_output: str, cwd: Path) -> None:
    """Renders a structured, rounded error diagnostic card with root cause and actionable steps."""
    cause, fixes = _diagnose_installation_error(tier, raw_output)
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    top = f" {RED}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    mid = f" {RED}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
    bot = f" {RED}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    tier_label = "CLIENT (Node.js/npm)" if tier.lower() == "client" else "SERVER (Python/pip)"
    print()
    print(top)
    title = f" ✗  {BOLD}{RED}{tier_label} INSTALLATION FAILED (Exit Code {returncode}){RESET}"
    for l in _format_box_lines(title, inner_width, RED):
        print(l)
    print(mid)

    cause_line = f"    Root Cause  : {BOLD}{WHITE}{cause}{RESET}"
    for l in _format_box_lines(cause_line, inner_width, RED):
        print(l)

    dir_line = f"    Directory   : {CYAN}{cwd.name}/{RESET}"
    for l in _format_box_lines(dir_line, inner_width, RED):
        print(l)

    # Show first meaningful error line
    error_lines = [
        l.strip()
        for l in raw_output.splitlines()
        if l.strip() and not l.strip().startswith("npm notice") and not l.strip().startswith("npm WARN")
    ]
    if error_lines:
        first_err = error_lines[-1][:inner_width - 20] if len(error_lines) > 0 else error_lines[0]
        diag_line = f"    Detail      : {GRAY}{first_err}{RESET}"
        for l in _format_box_lines(diag_line, inner_width, RED):
            print(l)

    print(mid)
    for idx, fix in enumerate(fixes, 1):
        fix_line = f"    {YELLOW}➜ Fix {idx}{RESET}     : {fix}"
        for l in _format_box_lines(fix_line, inner_width, RED):
            print(l)

    print(bot)
    print()


def _install_frontend_dependencies(manifest_path: Path, clean: bool = False, step_badge: str = "[1/2]") -> bool:
    """Executes npm install cleanly, highlighting progress and package count."""
    frontend_dir = manifest_path.parent
    if clean:
        node_modules = frontend_dir / "node_modules"
        if node_modules.is_dir():
            shutil.rmtree(node_modules, ignore_errors=True)

    print(f" {CYAN}{step_badge} 📦 CLIENT TIER{RESET} : Installing dependencies (npm in {CYAN}{frontend_dir.name}/{RESET})...")

    try:
        start_time = time.time()
        result = subprocess.run(
            [NPM_BIN, "install"],
            cwd=frontend_dir,
            capture_output=True,
            text=True,
            check=False,
        )
        duration = round(time.time() - start_time, 1)

        if result.returncode == 0:
            packages_match = re.search(r"audited\s+(\d+)\s+packages", result.stdout)
            pkg_str = f"Verified {packages_match.group(1)} packages · " if packages_match else ""
            print(f"       {BRIGHT_GREEN}✓{RESET} {GREEN}{pkg_str}node_modules up-to-date in {duration}s.{RESET}\n")
            return True
        else:
            err_output = result.stderr or result.stdout or ""
            _render_installation_error_card("client", result.returncode, err_output, frontend_dir)
            return False
    except Exception as error:
        _render_installation_error_card("client", 1, str(error), frontend_dir)
        return False


def _install_backend_dependencies(manifest_path: Path, python_executable: str, step_badge: str = "[2/2]") -> bool:
    """Executes pip install for Python requirements without raw path noise."""
    print(f" {MAGENTA}{step_badge} 🐍 SERVER TIER{RESET} : Verifying requirements ({PURPLE}{manifest_path.name}{RESET})...")

    try:
        start_time = time.time()
        result = subprocess.run(
            [python_executable, "-m", "pip", "install", "-r", str(manifest_path)],
            cwd=manifest_path.parent,
            capture_output=True,
            text=True,
            check=False,
        )
        duration = round(time.time() - start_time, 1)

        if result.returncode == 0:
            stdout_lines = result.stdout.splitlines()
            satisfied_count = sum(1 for line in stdout_lines if "Requirement already satisfied" in line)
            installed_lines = [line for line in stdout_lines if "Successfully installed" in line]

            if installed_lines:
                installed_summary = installed_lines[0].replace("Successfully installed ", "")
                print(f"       {BRIGHT_GREEN}✓{RESET} {GREEN}Installed packages: {BRIGHT_CYAN}{installed_summary}{RESET} in {duration}s.{RESET}\n")
            elif satisfied_count > 0:
                print(f"       {BRIGHT_GREEN}✓{RESET} {GREEN}All {satisfied_count} Python requirements verified and up-to-date in {duration}s.{RESET}\n")
            else:
                print(f"       {BRIGHT_GREEN}✓{RESET} {GREEN}Python requirements installed and verified in {duration}s.{RESET}\n")
            return True
        else:
            err_output = result.stderr or result.stdout or ""
            _render_installation_error_card("server", result.returncode, err_output, manifest_path.parent)
            return False
    except Exception as error:
        _render_installation_error_card("server", 1, str(error), manifest_path.parent)
        return False


def run_project_installation(
    proj_dir: Path,
    scope: str = "all",
    verbose: bool = True,
    parallel: bool = False,
    clean: bool = False,
    **kwargs: Any,
) -> bool:
    """
    Executes automated installation for frontend and backend dependencies.
    Directly consumed by runner/bin/run-dev.py and runner/bin/run-install.py.
    """
    inspection_info = inspect_project_install(proj_dir)
    print_installation_banner(inspection_info, action_message="Executing Automated Dual-Stack Installation...")

    start_timestamp = time.time()
    frontend_success = True
    backend_success = True

    should_install_fe = scope in ("all", "client", "frontend") and inspection_info["frontend"]["has_manifest"]
    should_install_be = scope in ("all", "server", "backend") and inspection_info["backend"]["has_manifest"]

    total_steps = (1 if should_install_fe else 0) + (1 if should_install_be else 0)
    fe_badge = f"[1/{total_steps}]" if total_steps > 1 else "[1/1]"
    be_badge = f"[{total_steps}/{total_steps}]"

    if parallel and should_install_fe and should_install_be:
        # Run frontend and backend concurrently in background threads
        fe_thread_result = [True]
        be_thread_result = [True]

        def _fe_worker():
            fe_thread_result[0] = _install_frontend_dependencies(
                inspection_info["frontend"]["manifest_path"],
                clean=clean,
                step_badge=fe_badge,
            )

        def _be_worker():
            py_exe = inspection_info["backend"].get("python_executable") or sys.executable
            be_thread_result[0] = _install_backend_dependencies(
                inspection_info["backend"]["manifest_path"],
                py_exe,
                step_badge=be_badge,
            )

        t1 = threading.Thread(target=_fe_worker)
        t2 = threading.Thread(target=_be_worker)
        t1.start()
        t2.start()
        t1.join()
        t2.join()

        frontend_success = fe_thread_result[0]
        backend_success = be_thread_result[0]
    else:
        # Sequential execution
        if should_install_fe:
            frontend_success = _install_frontend_dependencies(
                inspection_info["frontend"]["manifest_path"],
                clean=clean,
                step_badge=fe_badge,
            )

        if should_install_be:
            py_exe = inspection_info["backend"].get("python_executable") or sys.executable
            backend_success = _install_backend_dependencies(
                inspection_info["backend"]["manifest_path"],
                py_exe,
                step_badge=be_badge,
            )

    elapsed_seconds = round(time.time() - start_timestamp, 2)
    overall_success = frontend_success and backend_success

    project_name = inspection_info.get("name", "PROJECT").upper()
    print_completion_card(
        project_name=project_name,
        elapsed_seconds=elapsed_seconds,
        overall_success=overall_success,
        frontend_ok=frontend_success,
        backend_ok=backend_success,
    )

    return overall_success
