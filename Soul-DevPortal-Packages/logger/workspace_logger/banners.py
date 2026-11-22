"""
Universal Box Banner Presentation Component for Workspace.
Provides dynamic LAN IP resolution, system telemetry, 80-column Unicode borders,
and visual status dashboards for Fullstack, Frontend, and Backend environments.
"""

from __future__ import annotations

import os
import platform
import shutil
import socket
import sys


class Ansi:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"

    # Standard Colors
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    GRAY = "\033[90m"

    # Bright Colors
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"


def get_local_lan_ip() -> str:
    """Discovers the active local LAN IPv4 address (e.g. 192.168.x.x or 10.x.x.x)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def render_box(
    title: str,
    lines: list[tuple[str, str, str]],
    border_color: str = Ansi.BRIGHT_CYAN,
    width: int | None = None,
) -> str:
    """Renders a double-line Unicode box with exact column padding and ASCII fallback."""
    if width is None:
        term_width = shutil.get_terminal_size((80, 24)).columns
        width = max(70, min(80, term_width - 2))

    try:
        b_tl, b_tr, b_bl, b_br, b_ml, b_mr, b_h, b_v = "╔", "╗", "╚", "╝", "╠", "╣", "═", "║"
        top = f"{border_color}{b_tl}{b_h * width}{b_tr}{Ansi.RESET}"
        mid = f"{border_color}{b_ml}{b_h * width}{b_mr}{Ansi.RESET}"
        bot = f"{border_color}{b_bl}{b_h * width}{b_br}{Ansi.RESET}"
        v_bar = f"{border_color}{b_v}{Ansi.RESET}"

        title_pad = width - len(title) - 3
        title_line = f"{v_bar}   {Ansi.BRIGHT_WHITE}{Ansi.BOLD}{title}{Ansi.RESET}{' ' * max(0, title_pad)}{v_bar}"

        content_lines = []
        for label, val, color in lines:
            prefix = f"   {label:<14}: "
            raw_len = len(prefix) + len(val)
            pad = width - raw_len
            line = f"{v_bar}{Ansi.GRAY}{prefix}{Ansi.RESET}{color}{val}{Ansi.RESET}{' ' * max(0, pad)}{v_bar}"
            content_lines.append(line)

        return "\n" + "\n".join([top, title_line, mid] + content_lines + [bot]) + "\n"

    except Exception:
        # Fallback to standard clean ASCII border
        ascii_top = f"+{'-' * width}+"
        out = [f"\n{ascii_top}", f"|   {title}{' ' * max(0, width - len(title) - 4)}|", f"+{'-' * width}+"]
        for label, val, _ in lines:
            line_str = f"|   {label:<14}: {val}"
            out.append(f"{line_str}{' ' * max(0, width - len(line_str) + 1)}|")
        out.append(f"{ascii_top}\n")
        return "\n".join(out)


def print_fullstack_banner(
    title: str = "WORKSPACE  —  FULLSTACK DEV ENVIRONMENT (DUAL-SUPERVISOR)",
    frontend_port: int = 5173,
    backend_port: int = 8000,
    host: str = "127.0.0.1",
    ai_engine: str = "Google Gemini 2.5 Flash",
    db_info: str = "SQLite Database",
    extra_lines: list[tuple[str, str, str]] | None = None,
) -> None:
    """Prints the Fullstack Dual-Supervisor Banner for `npm run dev`."""
    lan_ip = get_local_lan_ip()
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    os_name = f"{platform.system()} ({platform.machine()})"

    lines = [
        ("Runtime Mode", "Fullstack Dual-Supervisor (Vite + FastAPI)", Ansi.BRIGHT_MAGENTA),
        ("Frontend URL", f"http://localhost:{frontend_port}/", Ansi.BRIGHT_CYAN),
        ("Network URL", f"http://{lan_ip}:{frontend_port}/ (Mobile/LAN)", Ansi.CYAN),
        ("Backend API", f"http://{host}:{backend_port}/", Ansi.BRIGHT_GREEN),
        ("API Proxy", f"/api ➔ http://{host}:{backend_port}", Ansi.CYAN),
        ("OpenAPI Docs", f"http://{host}:{backend_port}/api/docs", Ansi.BRIGHT_CYAN),
        ("AI Engine", ai_engine, Ansi.BRIGHT_YELLOW),
        ("Database", db_info, Ansi.BRIGHT_GREEN),
        ("System Specs", f"Python {py_ver} • {os_name}", Ansi.GRAY),
        ("Supervisor", "Active (Windows Job Object • Auto-Kill on Exit)", Ansi.BRIGHT_WHITE),
    ]
    if extra_lines:
        lines.extend(extra_lines)

    sys.stdout.write(render_box(title, lines, border_color=Ansi.BRIGHT_CYAN))
    sys.stdout.flush()


def print_frontend_banner(
    title: str = "WORKSPACE  —  FRONTEND DEV SERVER (CLIENT ONLY)",
    port: int = 5173,
    backend_port: int = 8000,
    framework: str = "React 19 + Vite 8 + Tailwind CSS v4",
    network_url: str | None = None,
) -> None:
    """Prints the Standalone Client Banner for `npm run frontend`."""
    lan_ip = get_local_lan_ip()
    net_url = network_url or f"http://{lan_ip}:{port}/"

    lines = [
        ("Runtime Mode", "Standalone Client Dev Server", Ansi.BRIGHT_CYAN),
        ("Framework", framework, Ansi.BRIGHT_GREEN),
        ("Local URL", f"http://localhost:{port}/", Ansi.BRIGHT_WHITE),
        ("Network URL", f"{net_url} (Mobile/LAN)", Ansi.CYAN),
        ("API Proxy", f"/api ➔ http://127.0.0.1:{backend_port} (Forwarding)", Ansi.GRAY),
        ("Client Bridge", "Vite HMR WebSocket (client-log active)", Ansi.BRIGHT_YELLOW),
        ("Health Check", f"http://localhost:{port}", Ansi.BRIGHT_GREEN),
    ]
    sys.stdout.write(render_box(title, lines, border_color=Ansi.BRIGHT_CYAN))
    sys.stdout.flush()


def print_backend_banner(
    title: str = "WORKSPACE  —  BACKEND API SERVER (REST / AI ENGINE)",
    port: int = 8000,
    host: str = "127.0.0.1",
    docs_path: str = "/api/docs",
    health_path: str = "/api/health",
    db_info: str = "SQLite Database",
    ai_core: str | None = None,
    ai_engine: str | None = None,
    **kwargs,
) -> None:
    """Prints the Standalone Backend API Banner for `npm run backend`."""
    display_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    chosen_ai = ai_engine or ai_core or "Google Gemini 2.5 Flash + TTS Audio Generator"

    lines = [
        ("Runtime Mode", "Standalone REST API & AI Service (Uvicorn Hot-Reload)", Ansi.BRIGHT_GREEN),
        ("Framework", f"FastAPI 2.0 (Python {py_ver})", Ansi.BRIGHT_WHITE),
        ("Server URL", f"http://{display_host}:{port}", Ansi.BRIGHT_WHITE),
        ("OpenAPI Docs", f"http://{display_host}:{port}{docs_path}", Ansi.BRIGHT_CYAN),
        ("Health Check", f"http://{display_host}:{port}{health_path}", Ansi.BRIGHT_GREEN),
        ("Database", db_info, Ansi.BRIGHT_YELLOW),
        ("AI Core", chosen_ai, Ansi.BRIGHT_MAGENTA),
    ]
    sys.stdout.write(render_box(title, lines, border_color=Ansi.BRIGHT_GREEN))
    sys.stdout.flush()


# Backward compatibility
print_startup_banner = print_backend_banner
