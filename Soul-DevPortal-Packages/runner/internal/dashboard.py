"""
Interactive Dashboards & Terminal HUD Banners (@workspace/runner/internal).
Renders rounded ASCII/Unicode fullstack dashboards, single tier cards, and hotkey toolbars.
"""
from __future__ import annotations

import socket
import sys
from pathlib import Path

from .installer import (
    BOLD,
    BRIGHT_CYAN,
    BRIGHT_GREEN,
    CYAN,
    GRAY,
    RED,
    RESET,
    WHITE,
    _format_box_lines,
    get_terminal_width,
)


def get_local_lan_ip() -> str:
    """Discovers the active local LAN IPv4 address (e.g. 192.168.x.x or 10.x.x.x)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def print_fullstack_dashboard(
    title: str,
    frontend_port: int,
    backend_port: int,
    project_dir: Path | None = None,
    framework: str = "React + Vite",
    db_info: str = "Local Store",
    ai_engine: str = "N/A",
) -> None:
    """Renders a premier, comprehensive fullstack dashboard before launching supervisors."""
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    top = f" {CYAN}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    mid = f" {CYAN}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
    bot = f" {CYAN}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    lan_ip = get_local_lan_ip()
    proj_name = project_dir.name.upper() if project_dir else "WORKSPACE"

    print()
    print(top)
    h_title = f" ⚡ {BOLD}{WHITE}WORKSPACE FULLSTACK RUNNER (DUAL-SUPERVISOR){RESET}"
    for l in _format_box_lines(h_title, inner_width, CYAN):
        print(l)
    sub = f"    Target Project : {BOLD}{BRIGHT_GREEN}[ {proj_name} ]{RESET}  {GRAY}·  Soul Workspace Monorepo{RESET}"
    for l in _format_box_lines(sub, inner_width, CYAN):
        print(l)
    print(mid)

    # Client Tier
    fe_head = f" 🌐 {BOLD}{WHITE}CLIENT DEV SERVER{RESET}  {GRAY}·  {framework}{RESET}"
    for l in _format_box_lines(fe_head, inner_width, CYAN):
        print(l)
    fe_local = f"    Local URL      : {BOLD}{BRIGHT_CYAN}http://localhost:{frontend_port}{RESET}"
    fe_network = f"    Network (LAN)  : {CYAN}http://{lan_ip}:{frontend_port}{RESET}"
    for l in _format_box_lines(fe_local, inner_width, CYAN):
        print(l)
    for l in _format_box_lines(fe_network, inner_width, CYAN):
        print(l)
    print(mid)

    # Server Tier
    be_head = f" 🚀 {BOLD}{WHITE}SERVER API & MICROSERVICES{RESET}"
    for l in _format_box_lines(be_head, inner_width, CYAN):
        print(l)
    be_local = f"    Local URL      : {BOLD}{BRIGHT_CYAN}http://localhost:{backend_port}{RESET}"
    be_docs = f"    Swagger UI     : {CYAN}http://localhost:{backend_port}/docs{RESET}"
    be_meta = f"    Database / AI  : {GRAY}{db_info}  ·  Model: {ai_engine}{RESET}"
    for l in _format_box_lines(be_local, inner_width, CYAN):
        print(l)
    for l in _format_box_lines(be_docs, inner_width, CYAN):
        print(l)
    for l in _format_box_lines(be_meta, inner_width, CYAN):
        print(l)
    print(mid)

    # Hotkeys HUD
    hk_title = f" ⌨  {BOLD}{WHITE}INTERACTIVE RUNNER HOTKEYS{RESET}"
    for l in _format_box_lines(hk_title, inner_width, CYAN):
        print(l)
    row1 = (
        f"    {BOLD}{CYAN}[r]{RESET} Restart BE    "
        f"{BOLD}{CYAN}[f]{RESET} Restart FE    "
        f"{BOLD}{CYAN}[a]{RESET} Reload All    "
        f"{BOLD}{CYAN}[o]{RESET} Open UI"
    )
    row2 = (
        f"    {BOLD}{CYAN}[b]{RESET} Swagger Docs  "
        f"{BOLD}{CYAN}[p]{RESET} Live Stats   "
        f"{BOLD}{CYAN}[e]{RESET} Env Info      "
        f"{BOLD}{RED}[q]{RESET} Quit App"
    )
    for l in _format_box_lines(row1, inner_width, CYAN):
        print(l)
    for l in _format_box_lines(row2, inner_width, CYAN):
        print(l)
    print(bot)
    print()


def print_single_tier_dashboard(
    title: str,
    tier: str,
    port: int,
    project_dir: Path | None = None,
    framework_or_runtime: str = "Web",
    docs_url: str | None = None,
) -> None:
    """Renders a sleek dashboard for single-tier (client-only or server-only) execution."""
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    top = f" {CYAN}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    mid = f" {CYAN}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
    bot = f" {CYAN}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    lan_ip = get_local_lan_ip()
    proj_name = project_dir.name.upper() if project_dir else "WORKSPACE"
    is_client = tier.lower() in ("client", "frontend")

    icon = "🌐" if is_client else "🚀"
    tier_name = "CLIENT DEV SERVER" if is_client else "SERVER API MICROSERVICE"

    print()
    print(top)
    h_title = f" ⚡ {BOLD}{WHITE}WORKSPACE {tier.upper()} RUNNER{RESET}"
    for l in _format_box_lines(h_title, inner_width, CYAN):
        print(l)
    sub = f"    Target Project : {BOLD}{BRIGHT_GREEN}[ {proj_name} ]{RESET}  {GRAY}·  {framework_or_runtime}{RESET}"
    for l in _format_box_lines(sub, inner_width, CYAN):
        print(l)
    print(mid)

    sec_head = f" {icon} {BOLD}{WHITE}{tier_name}{RESET}"
    for l in _format_box_lines(sec_head, inner_width, CYAN):
        print(l)
    loc = f"    Local URL      : {BOLD}{BRIGHT_CYAN}http://localhost:{port}{RESET}"
    net = f"    Network (LAN)  : {CYAN}http://{lan_ip}:{port}{RESET}"
    for l in _format_box_lines(loc, inner_width, CYAN):
        print(l)
    for l in _format_box_lines(net, inner_width, CYAN):
        print(l)

    if docs_url:
        docs = f"    Swagger UI     : {CYAN}{docs_url}{RESET}"
        for l in _format_box_lines(docs, inner_width, CYAN):
            print(l)

    print(bot)
    print()


def print_hotkey_toolbar() -> None:
    """Renders the interactive hotkey shortcut toolbar in a matching double-line Unicode HUD."""
    from logger.internal.box_renderer import render_box
    from logger.internal.colors import Colors

    row1 = (
        f"   {Colors.BRIGHT_CYAN}[r]{Colors.RESET} Restart BE    "
        f"{Colors.BRIGHT_CYAN}[f]{Colors.RESET} Restart FE    "
        f"{Colors.BRIGHT_CYAN}[a]{Colors.RESET} Reload All    "
        f"{Colors.BRIGHT_CYAN}[o]{Colors.RESET} Open UI"
    )
    row2 = (
        f"   {Colors.BRIGHT_CYAN}[b]{Colors.RESET} Swagger Docs  "
        f"{Colors.BRIGHT_CYAN}[p]{Colors.RESET} Live Stats   "
        f"{Colors.BRIGHT_CYAN}[e]{Colors.RESET} Env Info      "
        f"{Colors.RED}[q]{Colors.RESET} Quit App"
    )

    hud_title = "⌨  INTERACTIVE SUPERVISOR HOTKEYS"
    from logger.internal.box_renderer import safe_write_box
    safe_write_box(render_box(hud_title, [row1, row2], border_color=Colors.CYAN))


def print_help_menu() -> None:
    """Renders a rounded ASCII hotkey reference guide."""
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4

    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    top = f" {CYAN}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}"
    mid = f" {CYAN}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}"
    bot = f" {CYAN}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}"

    items = [
        ("r", "Restart Backend", "Re-spawns server + healthcheck"),
        ("f", "Restart Frontend", "Re-spawns client dev server"),
        ("a", "Reload Fullstack", "Full restart in dependency order"),
        ("o", "Open Browser UI", "Launches frontend in default browser"),
        ("b", "Open API Docs", "Launches FastAPI Swagger UI (/docs)"),
        ("c", "Clear Screen", "Clears console and redraws header"),
        ("p", "Live Statistics", "Displays PIDs, memory RSS & uptimes"),
        ("e", "Environment Info", "Lists active .env files & variables"),
        ("h", "Toggle Help Menu", "Displays interactive shortcuts guide"),
        ("q", "Graceful Shutdown", "Stops all process groups cleanly"),
    ]

    print()
    print(top)
    title = f" ⌨  {BOLD}{WHITE}INTERACTIVE SUPERVISOR HOTKEYS REFERENCE{RESET}"
    for l in _format_box_lines(title, inner_width, CYAN):
        print(l)
    print(mid)
    for key, name, desc in items:
        k_color = RED if key == "q" else BRIGHT_CYAN
        row = f"    {BOLD}{k_color}[{key}]{RESET} {BOLD}{name:<22}{RESET} {GRAY}·  {desc}{RESET}"
        for l in _format_box_lines(row, inner_width, CYAN):
            print(l)
    print(bot)
    print()


__all__ = [
    "get_local_lan_ip",
    "print_fullstack_dashboard",
    "print_help_menu",
    "print_hotkey_toolbar",
    "print_single_tier_dashboard",
]
