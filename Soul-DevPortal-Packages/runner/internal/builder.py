"""
Production Distribution & Build Engine (@workspace/runner).

Orchestrates frontend/client production asset compilation (Vite, Next.js),
pre-clean handling, and bundle size telemetry across projects.
"""

from __future__ import annotations

import json
import os
import shutil
import subprocess
import sys
import time
from pathlib import Path
from typing import Any, Dict, List, Optional

from .env import load_cascading_env
from .installer import (
    BOLD,
    BRIGHT_GREEN,
    CYAN,
    GRAY,
    GREEN,
    RED,
    RESET,
    WHITE,
    YELLOW,
    _format_box_lines,
    get_terminal_width,
)

NPM_BIN = "npm.cmd" if sys.platform == "win32" else "npm"


def format_bytes(size_bytes: int) -> str:
    """Formats raw bytes into human-readable B, kB, or MB string."""
    if size_bytes < 1024:
        return f"{size_bytes} B"
    if size_bytes < 1024 * 1024:
        return f"{size_bytes / 1024:.2f} kB"
    return f"{size_bytes / (1024 * 1024):.2f} MB"


def audit_dist_output(project_dir: Path) -> Dict[str, Any]:
    """Scans and calculates total size, file count, and top largest assets in dist/."""
    candidate_dirs = [
        project_dir / "dist",
        project_dir / "client" / "dist",
        project_dir / "frontend" / "dist",
        project_dir / "build",
        project_dir / ".next",
    ]
    target_dist: Optional[Path] = None
    for cand in candidate_dirs:
        if cand.is_dir() and any(cand.iterdir()):
            target_dist = cand
            break

    if not target_dist:
        return {"exists": False, "total_size": 0, "file_count": 0, "assets": [], "dir": project_dir / "dist"}

    assets: List[tuple[str, int]] = []
    total_size = 0
    for file_path in target_dist.glob("**/*"):
        if file_path.is_file():
            size = file_path.stat().st_size
            total_size += size
            assets.append((file_path.name, size))

    assets.sort(key=lambda x: x[1], reverse=True)
    return {
        "exists": True,
        "total_size": total_size,
        "file_count": len(assets),
        "assets": assets[:5],
        "dir": target_dist,
    }


def run_project_build(
    project_dir: Path,
    project_name: Optional[str] = None,
    clean: bool = False,
    env: Optional[Dict[str, str]] = None,
) -> bool:
    """
    Builds distribution assets for a target project using its detected package manager.
    Injects cascading environment variables from .env files.
    """
    effective_name = project_name or project_dir.name
    full_env, _ = load_cascading_env(project_dir=project_dir)
    if env:
        full_env.update(env)

    # 1. Clean output artifacts if requested
    if clean:
        for dist_folder in ("dist", "build", ".next"):
            target_path = project_dir / dist_folder
            if target_path.is_dir():
                print(f" {YELLOW}🧹 Cleaning existing output directory ({dist_folder}/)...{RESET}")
                shutil.rmtree(target_path, ignore_errors=True)

    # 2. Determine build command from package.json
    pkg_json = project_dir / "package.json"
    build_cwd = project_dir

    if not pkg_json.is_file():
        # Check client or frontend subfolder
        for sub in ("client", "frontend"):
            sub_pkg = project_dir / sub / "package.json"
            if sub_pkg.is_file():
                pkg_json = sub_pkg
                build_cwd = project_dir / sub
                break

    if not pkg_json.is_file():
        terminal_width = get_terminal_width(78)
        inner_width = terminal_width - 4
        b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
        b_h, b_ml, b_mr = "─", "├", "┤"

        print()
        print(f" {YELLOW}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}")
        title = f" ⚠️   {BOLD}{YELLOW}NO BUILD MANIFEST DETECTED{RESET}"
        for l in _format_box_lines(title, inner_width, YELLOW):
            print(l)
        print(f" {YELLOW}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")
        p_line = f"    Target Project : {BOLD}{WHITE}[ {effective_name.upper()} ]{RESET}"
        i_line = f"    Issue          : package.json missing in root, client/, and frontend/"
        h_line = f"    {YELLOW}➜ Fix{RESET}          : Initialize client tier or verify project directory"
        for l in _format_box_lines(p_line, inner_width, YELLOW):
            print(l)
        for l in _format_box_lines(i_line, inner_width, YELLOW):
            print(l)
        for l in _format_box_lines(h_line, inner_width, YELLOW):
            print(l)
        print(f" {YELLOW}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}")
        print()
        return False

    try:
        with open(pkg_json, "r", encoding="utf-8") as f:
            data = json.load(f)
        scripts = data.get("scripts", {})
    except Exception:
        scripts = {}

    build_script_name = "build" if "build" in scripts else None
    if not build_script_name:
        terminal_width = get_terminal_width(78)
        inner_width = terminal_width - 4
        b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
        b_h, b_ml, b_mr = "─", "├", "┤"

        available_scripts = ", ".join(scripts.keys()) if scripts else "None"
        print()
        print(f" {YELLOW}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}")
        title = f" ⚠️   {BOLD}{YELLOW}NO BUILD SCRIPT CONFIGURED{RESET}"
        for l in _format_box_lines(title, inner_width, YELLOW):
            print(l)
        print(f" {YELLOW}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")
        p_line = f"    Target Project : {BOLD}{WHITE}[ {effective_name.upper()} ]{RESET}"
        i_line = f"    Manifest Path  : {CYAN}{pkg_json.name}{RESET} has no 'build' script defined"
        s_line = f"    Defined Scripts: {GRAY}{available_scripts}{RESET}"
        h_line = f"    {YELLOW}➜ Fix{RESET}          : Add '\"build\": \"vite build\"' to package.json scripts"
        for l in _format_box_lines(p_line, inner_width, YELLOW):
            print(l)
        for l in _format_box_lines(i_line, inner_width, YELLOW):
            print(l)
        for l in _format_box_lines(s_line, inner_width, YELLOW):
            print(l)
        for l in _format_box_lines(h_line, inner_width, YELLOW):
            print(l)
        print(f" {YELLOW}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}")
        print()
        return False

    build_cmd = [NPM_BIN, "run", build_script_name]
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    top_border = f" {CYAN}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    bot_border = f" {CYAN}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    print()
    print(top_border)
    title_line = f" 🚀  {BOLD}{WHITE}PRODUCTION BUILD COMPILATION{RESET}"
    for l in _format_box_lines(title_line, inner_width, CYAN):
        print(l)
    sub_line = f"    Target Project : {BOLD}{BRIGHT_GREEN}[ {effective_name.upper()} ]{RESET}  {GRAY}·  Command: {' '.join(build_cmd)}{RESET}"
    for l in _format_box_lines(sub_line, inner_width, CYAN):
        print(l)
    dir_line = f"    Directory      : {CYAN}{build_cwd.name}/{RESET}"
    for l in _format_box_lines(dir_line, inner_width, CYAN):
        print(l)
    print(bot_border)
    print()

    start_time = time.time()
    try:
        result = subprocess.run(
            build_cmd,
            cwd=build_cwd,
            env=full_env,
            check=False,
        )
        duration = round(time.time() - start_time, 2)

        if result.returncode == 0:
            audit = audit_dist_output(project_dir)
            size_str = format_bytes(audit["total_size"])
            card_color = BRIGHT_GREEN
            top_card = f" {card_color}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
            mid_card = f" {card_color}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
            bot_card = f" {card_color}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

            print()
            print(top_card)
            succ_title = f" 🎉  {BOLD}{WHITE}BUILD COMPILATION SUCCEEDED{RESET}  {GRAY}·{RESET}  {BRIGHT_GREEN}{duration}s{RESET}"
            for l in _format_box_lines(succ_title, inner_width, card_color):
                print(l)
            print(mid_card)
            size_line = f"    ● {BOLD}Bundle Size{RESET} : {BOLD}{WHITE}{size_str}{RESET} {GRAY}({audit['file_count']} files in {audit['dir'].name}/){RESET}"
            for l in _format_box_lines(size_line, inner_width, card_color):
                print(l)
            if audit["assets"]:
                top_asset_name, top_asset_sz = audit["assets"][0]
                asset_line = f"    ● {BOLD}Top Asset{RESET}   : {CYAN}{top_asset_name}{RESET} {GRAY}({format_bytes(top_asset_sz)}){RESET}"
                for l in _format_box_lines(asset_line, inner_width, card_color):
                    print(l)
            print(bot_card)
            print()
            return True
        else:
            top_card = f" {RED}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
            mid_card = f" {RED}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
            bot_card = f" {RED}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

            print()
            print(top_card)
            fail_title = f" ✗  {BOLD}{RED}BUILD COMPILATION FAILED (Exit Code {result.returncode}){RESET}  {GRAY}·{RESET}  {RED}{duration}s{RESET}"
            for l in _format_box_lines(fail_title, inner_width, RED):
                print(l)
            print(mid_card)
            p_line = f"    Target Project : {BOLD}{WHITE}[ {effective_name.upper()} ]{RESET}"
            for l in _format_box_lines(p_line, inner_width, RED):
                print(l)
            h1 = f"    {YELLOW}➜ Fix 1{RESET} : Run static typecheck: {CYAN}python runner/bin/run-typecheck.py{RESET}"
            h2 = f"    {YELLOW}➜ Fix 2{RESET} : Check terminal compiler errors above for missing imports or syntax"
            for l in _format_box_lines(h1, inner_width, RED):
                print(l)
            for l in _format_box_lines(h2, inner_width, RED):
                print(l)
            print(bot_card)
            print()
            return False
    except Exception as exc:
        print(f"\n {RED}✗ Build exception: {exc}{RESET}\n")
        return False
