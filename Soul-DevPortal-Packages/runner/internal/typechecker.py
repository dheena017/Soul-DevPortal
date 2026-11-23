"""
TypeScript Static Type Analysis Engine (@workspace/runner).

Locates local or root TypeScript compilers, runs static type diagnostics,
and reports type-safety compliance across workspace projects.
"""

from __future__ import annotations

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


def locate_tsconfig(project_dir: Path) -> Optional[Path]:
    """Finds tsconfig.json in project root, client/, or frontend/."""
    candidates = [
        project_dir / "tsconfig.json",
        project_dir / "client" / "tsconfig.json",
        project_dir / "frontend" / "tsconfig.json",
        project_dir / "tsconfig.app.json",
    ]
    for cand in candidates:
        if cand.is_file():
            return cand
    return None


def find_tsc_command(project_dir: Path) -> List[str]:
    """Locates the nearest valid TypeScript compiler runner without relying on global installs."""
    from .registry import find_workspace_root

    root = find_workspace_root(project_dir)
    candidates = [
        project_dir / "node_modules" / ".bin" / ("tsc.cmd" if sys.platform == "win32" else "tsc"),
        project_dir / "node_modules" / "typescript" / "bin" / "tsc",
        project_dir / "client" / "node_modules" / ".bin" / ("tsc.cmd" if sys.platform == "win32" else "tsc"),
        project_dir / "frontend" / "node_modules" / ".bin" / ("tsc.cmd" if sys.platform == "win32" else "tsc"),
        root / "node_modules" / ".bin" / ("tsc.cmd" if sys.platform == "win32" else "tsc"),
        root / "node_modules" / "typescript" / "bin" / "tsc",
    ]

    for cand in candidates:
        if cand.is_file():
            if cand.suffix in ("", ".cmd"):
                return [str(cand)]
            if cand.name == "tsc":
                return ["node", str(cand)]

    # Check system PATH
    tsc_path = shutil.which("tsc")
    if tsc_path:
        return [tsc_path]

    # Fallback to npx
    npx_bin = "npx.cmd" if sys.platform == "win32" else "npx"
    return [npx_bin, "tsc"]


def run_project_typecheck(
    project_dir: Path,
    project_name: Optional[str] = None,
    watch: bool = False,
    env: Optional[Dict[str, str]] = None,
) -> bool:
    """
    Executes TypeScript type checking for a project.
    Injects cascading environment variables from .env hierarchy.
    """
    effective_name = project_name or project_dir.name
    tsconfig = locate_tsconfig(project_dir)

    if not tsconfig:
        terminal_width = get_terminal_width(78)
        inner_width = terminal_width - 4
        b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
        b_h, b_ml, b_mr = "─", "├", "┤"

        print()
        print(f" {YELLOW}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}")
        title = f" ⚠️   {BOLD}{YELLOW}NO TYPESCRIPT CONFIGURATION DETECTED{RESET}"
        for l in _format_box_lines(title, inner_width, YELLOW):
            print(l)
        print(f" {YELLOW}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")
        p_line = f"    Target Project : {BOLD}{WHITE}[ {effective_name.upper()} ]{RESET}"
        i_line = f"    Diagnostics    : tsconfig.json not found in project or client/"
        h_line = f"    {YELLOW}➜ Action{RESET}       : Skipping typecheck (JavaScript-only project)"
        for l in _format_box_lines(p_line, inner_width, YELLOW):
            print(l)
        for l in _format_box_lines(i_line, inner_width, YELLOW):
            print(l)
        for l in _format_box_lines(h_line, inner_width, YELLOW):
            print(l)
        print(f" {YELLOW}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}")
        print()
        return True

    full_env, _ = load_cascading_env(project_dir=project_dir)
    if env:
        full_env.update(env)

    target_dir = tsconfig.parent
    tsc_cmd = find_tsc_command(project_dir)
    typecheck_args = list(tsc_cmd) + (["--watch"] if watch else ["--noEmit"])

    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    top_border = f" {CYAN}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    bot_border = f" {CYAN}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    print()
    print(top_border)
    title_line = f" 📘  {BOLD}{WHITE}TYPESCRIPT STATIC TYPE SAFETY AUDIT{RESET}"
    for l in _format_box_lines(title_line, inner_width, CYAN):
        print(l)
    sub_line = f"    Target Project : {BOLD}{BRIGHT_GREEN}[ {effective_name.upper()} ]{RESET}  {GRAY}·  Config: {tsconfig.name}{RESET}"
    for l in _format_box_lines(sub_line, inner_width, CYAN):
        print(l)
    short_args = [arg.replace(str(project_dir), project_dir.name).replace("\\", "/") for arg in typecheck_args]
    cmd_line = f"    Runner Command : {CYAN}{' '.join(short_args)}{RESET}"
    for l in _format_box_lines(cmd_line, inner_width, CYAN):
        print(l)
    print(bot_border)
    print()

    start_time = time.time()
    try:
        result = subprocess.run(
            typecheck_args,
            cwd=target_dir,
            env=full_env,
            check=False,
        )
        duration = round(time.time() - start_time, 2)

        card_color = BRIGHT_GREEN if result.returncode == 0 else RED
        top_card = f" {card_color}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
        mid_card = f" {card_color}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
        bot_card = f" {card_color}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

        print()
        print(top_card)
        if result.returncode == 0:
            succ_title = f" 🎉  {BOLD}{WHITE}ALL TYPESCRIPT TYPES VERIFIED SOUND{RESET}  {GRAY}·{RESET}  {BRIGHT_GREEN}{duration}s{RESET}"
            for l in _format_box_lines(succ_title, inner_width, card_color):
                print(l)
            print(mid_card)
            status_line = f"    ● {BOLD}Diagnostic Results{RESET} : 0 errors reported across TypeScript project"
            mode_line = f"    ● {BOLD}Verification Mode{RESET}  : Static strict emit verification (noEmit)"
            for l in _format_box_lines(status_line, inner_width, card_color):
                print(l)
            for l in _format_box_lines(mode_line, inner_width, card_color):
                print(l)
            print(bot_card)
            print()
            return True
        else:
            fail_title = f" ⚠️   {BOLD}{RED}TYPESCRIPT TYPECHECK REPORTED ERRORS{RESET}  {GRAY}·{RESET}  {RED}{duration}s{RESET}"
            for l in _format_box_lines(fail_title, inner_width, card_color):
                print(l)
            print(bot_card)
            print()
            return False
    except Exception as exc:
        print(f"\n {RED}✗ Typecheck exception: {exc}{RESET}\n")
        return False
