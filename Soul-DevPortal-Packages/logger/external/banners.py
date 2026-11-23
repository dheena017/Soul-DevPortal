"""
Terminal Banner & Status Dashboard Formatter (@workspace/logger/external).
Renders double-line Unicode framed ASCII banners for Fullstack, Frontend, and Backend tiers.
"""
from __future__ import annotations

import platform
import sys
from typing import Any

from internal.box_renderer import render_box, safe_write_box
from internal.colors import Colors
from internal.network import (
    get_local_lan_ip,
    resolve_backend_port,
    should_suppress_child_banners,
)


def print_fullstack_banner(
    title: str = "WORKSPACE  —  FULLSTACK DEV ENVIRONMENT (DUAL-SUPERVISOR)",
    frontend_port: int = 5173,
    backend_port: int = 8000,
    host: str = "127.0.0.1",
    ai_engine: str = "Google Gemini 2.5 Flash",
    db_info: str = "SQLite Database",
    extra_lines: list[tuple[str, str, str]] | None = None,
) -> None:
    """Prints the Fullstack Dual-Supervisor Banner for fullstack dev environments."""
    if should_suppress_child_banners():
        return
    lan_ip = get_local_lan_ip()
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    os_name = f"{platform.system()} ({platform.machine()})"

    lines: list[tuple[str, str, str]] = [
        ("Client Tier", f"http://localhost:{frontend_port}/ (React 19 + Vite 8)", Colors.BRIGHT_GREEN),
        ("Client Network", f"http://{lan_ip}:{frontend_port}/ (Mobile/LAN Test)", Colors.CYAN),
        ("Server API", f"http://{host}:{backend_port}/ (Python {py_ver} + FastAPI)", Colors.BRIGHT_MAGENTA),
        ("OpenAPI Docs", f"http://{host}:{backend_port}/docs (Swagger Interactive)", Colors.BRIGHT_YELLOW),
        ("AI Engine", ai_engine, Colors.BRIGHT_CYAN),
        ("Persistence", db_info, Colors.GREEN),
        ("Host Platform", os_name, Colors.GRAY),
    ]

    if extra_lines:
        lines.extend(extra_lines)

    safe_write_box(render_box(title, lines, border_color=Colors.BRIGHT_CYAN))


def print_frontend_banner(
    title: str = "WORKSPACE  —  CLIENT DEV SERVER (STANDALONE)",
    port: int = 5173,
    backend_port: int | None = None,
    framework: str = "React 19 + Vite 8 + Tailwind CSS v4",
    network_url: str | None = None,
) -> None:
    """Prints the Client / Frontend Dev Server Banner."""
    if should_suppress_child_banners():
        return
    lan_ip = get_local_lan_ip()
    net_url = network_url or f"http://{lan_ip}:{port}/"
    resolved_backend_port = backend_port or resolve_backend_port(port, 8000)

    lines: list[tuple[str, str, str]] = [
        ("Runtime Mode", "Standalone Client Dev Server", Colors.BRIGHT_CYAN),
        ("Framework", framework, Colors.BRIGHT_GREEN),
        ("Local URL", f"http://localhost:{port}/", Colors.BRIGHT_WHITE),
        ("Network URL", f"{net_url} (Mobile/LAN)", Colors.CYAN),
        ("API Proxy", f"/api ➔ http://127.0.0.1:{resolved_backend_port} (Forwarding)", Colors.GRAY),
        ("Client Bridge", "Vite HMR WebSocket (client-log active)", Colors.BRIGHT_YELLOW),
        ("Health Check", f"http://localhost:{port}", Colors.BRIGHT_GREEN),
    ]

    safe_write_box(render_box(title, lines, border_color=Colors.BRIGHT_GREEN))


def print_backend_banner(
    title: str = "WORKSPACE  —  SERVER API (STANDALONE)",
    port: int = 8000,
    host: str = "127.0.0.1",
    ai_engine: str | None = None,
    db_info: str = "SQLite Database (WAL Mode)",
    ai_core: str | None = None,
    **kwargs: Any,
) -> None:
    """Prints the Server / Backend API Banner."""
    if should_suppress_child_banners():
        return
    if title in ("127.0.0.1", "0.0.0.0", "localhost"):
        host = title
        title = "APEXMIND STUDIO AI  -  BACKEND API SERVER" if port == 8000 else "WORKSPACE  —  BACKEND API SERVER"
    display_host = "127.0.0.1" if host in ("0.0.0.0", "::", "") else host
    py_ver = f"{sys.version_info.major}.{sys.version_info.minor}.{sys.version_info.micro}"
    chosen_ai = ai_engine or ai_core or "Google Gemini 2.5 Flash + TTS Audio Generator"

    lines: list[tuple[str, str, str]] = [
        ("Runtime Mode", "Standalone Backend API Server", Colors.BRIGHT_MAGENTA),
        ("FastAPI Engine", f"Uvicorn ASGI Engine (Python {py_ver})", Colors.BRIGHT_GREEN),
        ("Local API", f"http://{display_host}:{port}/", Colors.BRIGHT_WHITE),
        ("OpenAPI Docs", f"http://{display_host}:{port}/docs (Swagger UI)", Colors.BRIGHT_YELLOW),
        ("ReDoc Specs", f"http://{display_host}:{port}/redoc", Colors.YELLOW),
        ("Health Probe", f"http://{display_host}:{port}/api/health", Colors.CYAN),
        ("AI Core", chosen_ai, Colors.BRIGHT_CYAN),
        ("Storage Engine", db_info, Colors.GREEN),
    ]

    safe_write_box(render_box(title, lines, border_color=Colors.BRIGHT_MAGENTA))


__all__ = [
    "Colors",
    "get_local_lan_ip",
    "print_backend_banner",
    "print_frontend_banner",
    "print_fullstack_banner",
    "render_box",
]
