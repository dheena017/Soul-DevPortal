"""
Live Process Statistics & Metrics Formatter for Workspace Runner (@workspace/runner).

Renders clean ANSI ASCII tables displaying active subprocess PIDs, port allocations,
memory consumption (RSS), and real-time uptime duration.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from datetime import timedelta
from typing import Any

from .installer import _visual_len

# ANSI Colors and Symbols
_ANSI_RESET = "\033[0m"
_ANSI_BOLD = "\033[1m"
_ANSI_CYAN = "\033[38;5;45m"
_ANSI_GRAY = "\033[38;5;244m"
_ANSI_GREEN = "\033[38;5;48m"
_ANSI_YELLOW = "\033[38;5;220m"
_ANSI_RED = "\033[38;5;196m"
_ANSI_WHITE = "\033[38;5;255m"


def _pad_cell(text: str, width: int) -> str:
    """Pads text to exact visual column width, ignoring invisible ANSI escape codes."""
    v_len = _visual_len(text)
    spaces = max(0, width - v_len)
    return f"{text}{' ' * spaces}"


def _get_windows_memory_rss_mb(pid: int) -> float | None:
    """Queries Windows tasklist to extract RSS memory in megabytes for a given PID."""
    try:
        command_result = subprocess.run(
            ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
            capture_output=True,
            text=True,
            check=False,
        )
        first_line = command_result.stdout.strip().splitlines()[0] if command_result.stdout.strip() else ""
        if not first_line:
            return None

        # Tasklist CSV format: "Image Name","PID","Session Name","Session#","Mem Usage"
        columns = [col.strip('"') for col in first_line.split(",")]
        if len(columns) >= 5:
            raw_mem = columns[4].replace(" K", "").replace(",", "").replace(".", "").strip()
            if raw_mem.isdigit():
                return round(int(raw_mem) / 1024, 1)
    except Exception:
        pass
    return None


def _get_posix_memory_rss_mb(pid: int) -> float | None:
    """Queries POSIX ps command to extract RSS memory in megabytes for a given PID."""
    try:
        command_result = subprocess.run(
            ["ps", "-o", "rss=", "-p", str(pid)],
            capture_output=True,
            text=True,
            check=False,
        )
        raw_output = command_result.stdout.strip()
        if raw_output.isdigit():
            return round(int(raw_output) / 1024, 1)
    except Exception:
        pass
    return None


def _get_memory_usage_mb(pid: int) -> float | None:
    """Dispatches platform-specific memory query to retrieve RSS memory in megabytes."""
    if pid <= 0:
        return None
    if sys.platform == "win32":
        return _get_windows_memory_rss_mb(pid)
    return _get_posix_memory_rss_mb(pid)


def _get_status_indicator(status_code: str) -> str:
    """Returns a colored bullet indicator corresponding to the process health status."""
    normalized_status = status_code.upper()
    if normalized_status in ("RUNNING", "HEALTHY"):
        return f"{_ANSI_GREEN}●{_ANSI_RESET}"
    if normalized_status in ("RESTARTING", "STARTING"):
        return f"{_ANSI_YELLOW}⟳{_ANSI_RESET}"
    return f"{_ANSI_RED}■{_ANSI_RESET}"


def _format_uptime_duration(start_timestamp: float, current_timestamp: float) -> str:
    """Formats the elapsed runtime duration into an HH:MM:SS string."""
    elapsed_seconds = int(max(0, current_timestamp - start_timestamp))
    return str(timedelta(seconds=elapsed_seconds))


def _build_table_header() -> list[str]:
    """Generates the rounded top box-drawing border and column headers."""
    c = _ANSI_CYAN
    r = _ANSI_RESET
    b = _ANSI_BOLD
    w = _ANSI_WHITE

    # Total width = 76 columns (matching terminal 78 width standard)
    top = f" {c}╭──────────────────────────────────────────────────────────────────────────╮{r}"
    title_text = f" {b}{w}WORKSPACE PROCESS SUPERVISOR — LIVE STATUS{r}"
    title = f" {c}│{r}{_pad_cell(title_text, 74)}{c}│{r}"
    div1 = f" {c}├──────────────┬──────────┬────────┬──────────┬───────────┬────────────────┤{r}"
    hdr = (
        f" {c}│{r} {_pad_cell(f'{b}SERVICE{r}', 12)} "
        f"{c}│{r} {_pad_cell(f'{b}SCOPE{r}', 8)} "
        f"{c}│{r} {_pad_cell(f'{b}PID{r}', 6)} "
        f"{c}│{r} {_pad_cell(f'{b}PORT{r}', 8)} "
        f"{c}│{r} {_pad_cell(f'{b}MEMORY{r}', 9)} "
        f"{c}│{r} {_pad_cell(f'{b}UPTIME / STAT{r}', 14)} {c}│{r}"
    )
    div2 = f" {c}├──────────────┼──────────┼────────┼──────────┼───────────┼────────────────┤{r}"
    return [top, title, div1, hdr, div2]


def _format_process_row(process_info: dict[str, Any], current_timestamp: float) -> str:
    """Formats a single process entry as a pixel-perfect bordered table row."""
    c = _ANSI_CYAN
    r = _ANSI_RESET
    b = _ANSI_BOLD

    raw_name = process_info.get("name", "Service")
    service_name = f"{b}{raw_name[:12]}{r}"
    service_scope = process_info.get("scope", "APP")[:8]

    pid_value = process_info.get("pid")
    pid_display = str(pid_value)[:6] if pid_value else "N/A"

    port_value = process_info.get("port")
    port_display = f":{port_value}"[:8] if port_value else "N/A"

    memory_mb = _get_memory_usage_mb(pid_value) if pid_value else None
    memory_display = f"{memory_mb:.1f} MB" if memory_mb is not None else "N/A"

    start_timestamp = process_info.get("start_time", current_timestamp)
    uptime_display = _format_uptime_duration(start_timestamp, current_timestamp)

    status_code = process_info.get("status", "RUNNING")
    status_indicator = _get_status_indicator(status_code)
    status_cell = f"{status_indicator} {uptime_display}"

    return (
        f" {c}│{r} {_pad_cell(service_name, 12)} "
        f"{c}│{r} {_pad_cell(service_scope, 8)} "
        f"{c}│{r} {_pad_cell(pid_display, 6)} "
        f"{c}│{r} {_pad_cell(port_display, 8)} "
        f"{c}│{r} {_pad_cell(memory_display, 9)} "
        f"{c}│{r} {_pad_cell(status_cell, 14)} {c}│{r}"
    )


def _build_table_footer() -> str:
    """Generates the bottom rounded border for the status table."""
    c = _ANSI_CYAN
    r = _ANSI_RESET
    return f" {c}╰──────────────┴──────────┴────────┴──────────┴───────────┴────────────────╯{r}"


def format_process_stats_table(processes: list[dict[str, Any]]) -> str:
    """
    Renders an 80-column ASCII status table for monitored child processes.
    Each item in processes: {
        "name": str,
        "scope": str,
        "pid": int | None,
        "port": int | None,
        "status": str,
        "start_time": float,
    }
    """
    current_timestamp = time.time()
    table_lines: list[str] = _build_table_header()

    for process_info in processes:
        table_lines.append(_format_process_row(process_info, current_timestamp))

    table_lines.append(_build_table_footer())
    return "\n".join(table_lines)
