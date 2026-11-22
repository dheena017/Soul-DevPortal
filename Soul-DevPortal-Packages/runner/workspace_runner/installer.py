"""
Dual-Stack Dependency Inspector & Automated Installer Component (@workspace/runner).
Orchestrates frontend (Node.js/npm) and backend (Python/venv) pre-flight inspection,
generates high-visibility terminal banners, and runs reliable dependency installations.
"""

from __future__ import annotations

import json
import os
import re
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Terminal Color Codes
RESET = "\033[0m"
BOLD = "\033[1m"
DIM = "\033[2m"
BLUE = "\033[38;5;39m"
CYAN = "\033[38;5;45m"
GREEN = "\033[38;5;48m"
YELLOW = "\033[38;5;220m"
RED = "\033[38;5;196m"
MAGENTA = "\033[38;5;213m"
GRAY = "\033[38;5;244m"
BG_DARK = "\033[48;5;235m"

NPM_BIN = "npm.cmd" if sys.platform == "win32" else "npm"
PYTHON_BIN = sys.executable


def get_terminal_width(default: int = 76) -> int:
    try:
        return min(max(shutil.get_terminal_size((default, 24)).columns, 60), 80)
    except Exception:
        return default


def inspect_project_install(proj_dir: Path) -> Dict[str, Any]:
    """Inspects frontend and backend project structure, manifests, and installation state."""
    name = proj_dir.name
    info: Dict[str, Any] = {
        "name": name,
        "path": proj_dir,
        "frontend": {
            "has_manifest": False,
            "manifest_path": None,
            "package_manager": "npm",
            "is_installed": False,
            "node_modules_path": None,
            "dep_count": 0,
            "dev_dep_count": 0,
            "key_packages": [],
        },
        "backend": {
            "has_manifest": False,
            "manifest_type": None,
            "manifest_path": None,
            "venv_path": None,
            "python_executable": PYTHON_BIN,
            "is_installed": False,
            "req_count": 0,
            "key_packages": [],
        },
        "overall_ready": False,
    }

    # ── 1. Frontend Inspection ──────────────────────────────────────────
    # Check project root, then client/ or frontend/
    fe_dirs = [proj_dir, proj_dir / "client", proj_dir / "frontend"]
    target_fe_dir = None
    target_pkg_json = None

    for d in fe_dirs:
        pj = d / "package.json"
        if pj.is_file():
            target_fe_dir = d
            target_pkg_json = pj
            break

    if target_fe_dir and target_pkg_json:
        info["frontend"]["has_manifest"] = True
        info["frontend"]["manifest_path"] = target_pkg_json
        node_modules = target_fe_dir / "node_modules"
        info["frontend"]["node_modules_path"] = node_modules
        info["frontend"]["is_installed"] = node_modules.is_dir() and any(node_modules.iterdir())

        try:
            with open(target_pkg_json, "r", encoding="utf-8") as f:
                pj_data = json.load(f)
            deps = pj_data.get("dependencies", {})
            dev_deps = pj_data.get("devDependencies", {})
            info["frontend"]["dep_count"] = len(deps)
            info["frontend"]["dev_dep_count"] = len(dev_deps)

            all_deps = {**deps, **dev_deps}
            keys_to_track = [
                "react", "react-dom", "vite", "next", "tailwindcss",
                "@workspace/config", "@workspace/logger", "@workspace/runner",
                "framer-motion", "lucide-react", "zustand", "three",
            ]
            info["frontend"]["key_packages"] = [k for k in keys_to_track if k in all_deps]
        except Exception:
            pass

    # ── 2. Backend Inspection ───────────────────────────────────────────
    # Look for virtual environment
    venv_candidates = [
        proj_dir / ".venv",
        proj_dir / "venv",
        proj_dir / "server" / ".venv",
        proj_dir / "backend" / ".venv",
    ]
    detected_venv = None
    for v in venv_candidates:
        if v.is_dir():
            detected_venv = v
            break

    if detected_venv:
        info["backend"]["venv_path"] = detected_venv
        if sys.platform == "win32":
            py_exe = detected_venv / "Scripts" / "python.exe"
        else:
            py_exe = detected_venv / "bin" / "python"
        if py_exe.is_file():
            info["backend"]["python_executable"] = str(py_exe)
            info["backend"]["is_installed"] = True
    else:
        # Check if project root virtual environment or active sys.executable
        info["backend"]["is_installed"] = True

    # Look for requirements.txt or pyproject.toml
    req_candidates = [
        proj_dir / "requirements.txt",
        proj_dir / "server" / "requirements.txt",
        proj_dir / "backend" / "requirements.txt",
        proj_dir / "pyproject.toml",
    ]
    for r in req_candidates:
        if r.is_file():
            info["backend"]["has_manifest"] = True
            info["backend"]["manifest_path"] = r
            info["backend"]["manifest_type"] = r.name
            try:
                lines = [line.strip() for line in r.read_text(encoding="utf-8").splitlines() if line.strip() and not line.startswith("#")]
                info["backend"]["req_count"] = len(lines)
                keys_to_track_py = [
                    "fastapi", "uvicorn", "starlette", "pydantic", "sqlalchemy",
                    "aiosqlite", "sqlite3", "google-genai", "google-generativeai",
                    "pytest", "workspace-logger", "workspace-runner", "workspace-config",
                ]
                text_content = r.read_text(encoding="utf-8").lower()
                info["backend"]["key_packages"] = [k for k in keys_to_track_py if k in text_content]
            except Exception:
                pass
            break

    # ── 3. Overall Readiness ────────────────────────────────────────────
    fe_ready = (not info["frontend"]["has_manifest"]) or info["frontend"]["is_installed"]
    be_ready = (not info["backend"]["has_manifest"]) or info["backend"]["is_installed"]
    info["overall_ready"] = fe_ready and be_ready

    return info


def print_installation_banner(info: Dict[str, Any], action_message: Optional[str] = None) -> None:
    """Renders a beautiful, high-visibility dual-stack installation banner."""
    width = get_terminal_width(74)
    inner_w = width - 4

    def line(content: str = "", fill: str = " ") -> str:
        # Strip ANSI codes for length calculation
        raw = re.sub(r"\033\[[0-9;]*m", "", content)
        pad = max(0, inner_w - len(raw))
        return f" {BLUE}│{RESET} {content}{' ' * pad} {BLUE}│{RESET}"

    border_top = f" {BLUE}┌{'─' * (inner_w + 2)}┐{RESET}"
    border_mid = f" {BLUE}├{'─' * (inner_w + 2)}┤{RESET}"
    border_bot = f" {BLUE}└{'─' * (inner_w + 2)}┘{RESET}"

    name = info.get("name", "PROJECT").upper()
    fe = info.get("frontend", {})
    be = info.get("backend", {})

    print()
    print(border_top)
    print(line(f"{BOLD}{CYAN}⚡ WORKSPACE PRE-FLIGHT DEPENDENCY & INSTALLATION AUDIT{RESET}"))
    print(line(f"{GRAY}Target Micro-App:{RESET} {BOLD}{GREEN}{name}{RESET}  {GRAY}·{RESET}  {DIM}Soul Workspace Monorepo{RESET}"))
    print(border_mid)

    # ── Frontend Section ──
    fe_status = f"{GREEN}[READY / INSTALLED]{RESET}" if fe.get("is_installed") else f"{YELLOW}[NEEDS INSTALL]{RESET}"
    if not fe.get("has_manifest"):
        fe_status = f"{GRAY}[NOT CONFIGURED]{RESET}"

    fe_summary = f"{BOLD}Client Tier (Node.js):{RESET} {fe_status}"
    print(line(fe_summary))
    if fe.get("has_manifest"):
        deps_info = f"{GRAY}Dependencies:{RESET} {fe.get('dep_count', 0)} prod, {fe.get('dev_dep_count', 0)} dev  {GRAY}·{RESET}  Manager: {CYAN}npm{RESET}"
        print(line(deps_info))
        if fe.get("key_packages"):
            pkgs = ", ".join(fe["key_packages"][:6])
            print(line(f"{GRAY}Key Packages:{RESET} {CYAN}{pkgs}{RESET}"))
    print(border_mid)

    # ── Backend Section ──
    be_status = f"{GREEN}[READY / INSTALLED]{RESET}" if be.get("is_installed") else f"{YELLOW}[NEEDS INSTALL]{RESET}"
    if not be.get("has_manifest"):
        be_status = f"{GRAY}[CLIENT-ONLY / NONE]{RESET}"

    be_summary = f"{BOLD}Server Tier (Python):{RESET} {be_status}"
    print(line(be_summary))
    if be.get("has_manifest"):
        py_exe_name = Path(be.get("python_executable", "python")).name
        if be.get("venv_path"):
            venv_name = f".venv ({py_exe_name})"
        else:
            venv_name = f"System ({py_exe_name})"
        reqs_info = f"{GRAY}Requirements:{RESET} {be.get('req_count', 0)} packages  {GRAY}·{RESET}  Env: {MAGENTA}{venv_name}{RESET}"
        print(line(reqs_info))
        if be.get("key_packages"):
            pkgs = ", ".join(be["key_packages"][:6])
            print(line(f"{GRAY}Key Packages:{RESET} {MAGENTA}{pkgs}{RESET}"))

    if action_message:
        print(border_mid)
        print(line(f"{BOLD}{YELLOW}→ ACTION:{RESET} {action_message}"))

    print(border_bot)
    print()


def run_project_installation(
    proj_dir: Path,
    scope: str = "all",
    verbose: bool = True,
) -> bool:
    """Executes clean automated installation for frontend and backend dependencies."""
    info = inspect_project_install(proj_dir)
    print_installation_banner(info, action_message="Executing Automated Dual-Stack Installation...")

    start_time = time.time()
    fe_ok = True
    be_ok = True

    # 1. Frontend Installation
    if scope in ("all", "client", "frontend") and info["frontend"]["has_manifest"]:
        fe_dir = info["frontend"]["manifest_path"].parent
        print(f" {CYAN}📦 Installing Frontend Dependencies (npm install in {fe_dir.name}/)...{RESET}")
        try:
            res = subprocess.run([NPM_BIN, "install"], cwd=fe_dir, check=True)
            print(f" {GREEN}✓ Frontend installation succeeded.{RESET}")
        except Exception as e:
            print(f" {RED}✗ Frontend installation failed: {e}{RESET}")
            fe_ok = False

    # 2. Backend Installation
    if scope in ("all", "server", "backend") and info["backend"]["has_manifest"]:
        req_file = info["backend"]["manifest_path"]
        print(f" {MAGENTA}🐍 Installing Python Backend Requirements ({req_file.name})...{RESET}")
        py_exe = info["backend"].get("python_executable") or sys.executable
        try:
            res = subprocess.run(
                [py_exe, "-m", "pip", "install", "-r", str(req_file)],
                cwd=req_file.parent,
                check=True,
            )
            print(f" {GREEN}✓ Python backend requirements installed.{RESET}")
        except Exception as e:
            print(f" {RED}✗ Backend installation failed: {e}{RESET}")
            be_ok = False

    elapsed = round(time.time() - start_time, 2)
    if fe_ok and be_ok:
        print(f"\n {GREEN}{BOLD}🎉 Pre-flight dual installation completed successfully in {elapsed}s!{RESET}\n")
        return True
    else:
        print(f"\n {RED}{BOLD}⚠️ Installation finished with errors in {elapsed}s.{RESET}\n")
        return False
