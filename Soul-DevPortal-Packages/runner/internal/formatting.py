"""
Universal 5-Column Output Formatting & Stream Demultiplexer (@workspace/runner/internal).
Formats console messages and streams child process stdout/stderr cleanly.
"""
from __future__ import annotations

import re
from datetime import datetime
from typing import Any


def format_universal_line(scope: str, level: str, module: str, message: str) -> str:
    """Renders a single line conforming to the 5-column universal schema."""
    timestamp_str = datetime.now().strftime("%H:%M:%S")
    time_column = f"\033[90m[{timestamp_str}]\033[0m"

    normalized_scope = scope.upper()
    scope_color = "\033[96m" if "FRONT" in normalized_scope or "CLIENT" in normalized_scope else "\033[92m" if "BACK" in normalized_scope or "SERVER" in normalized_scope else "\033[95m"
    scope_column = f"{scope_color}[{scope.ljust(8)}]\033[0m"

    badge_lookup = {
        "DEBUG": "\033[100m\033[97m\033[1m DEBUG \033[0m",
        "INFO": "\033[44m\033[97m\033[1m  INFO \033[0m",
        "OK": "\033[42m\033[97m\033[1m   OK  \033[0m",
        "ACTION": "\033[45m\033[97m\033[1m ACTION\033[0m",
        "WARN": "\033[43m\033[30m\033[1m  WARN \033[0m",
        "ERROR": "\033[41m\033[97m\033[1m ERROR \033[0m",
    }
    badge_column = badge_lookup.get(level.upper(), f"[{level:<7}]")
    module_column = f"\033[36m[{module[:14]:<14}]\033[0m"

    return f"{time_column} {scope_column} {badge_column} {module_column} {message}"


def _stream_output(stream_handle: Any, scope: str) -> None:
    """Demultiplexes and prints stdout/stderr lines with universal 5-column formatting."""
    for raw_line in iter(stream_handle.readline, ""):
        cleaned_line = raw_line.rstrip()
        if not cleaned_line:
            continue

        tag_match = re.search(r"\[[A-Za-z0-9_-]+_LOG\]", cleaned_line)
        if tag_match:
            payload = cleaned_line.split(tag_match.group(0), 1)[1].strip()
            parts = payload.split("|", 2)
            if len(parts) == 3:
                print(format_universal_line(scope, parts[0].strip(), parts[1].strip(), parts[2].strip()), flush=True)
                continue
            if len(parts) == 2:
                print(format_universal_line(scope, parts[0].strip(), "CLIENT", parts[1].strip()), flush=True)
                continue

        uncolored = re.sub(r"\x1b\[[0-9;]*[mK]", "", cleaned_line).strip()
        if any(uncolored.startswith(c) for c in ("╔", "╠", "╚", "║", "┌", "├", "└", "│", "+", "═", "─", "╭", "╰", "=")):
            continue
        if "SOUL WORKSPACE FASTAPI BACKEND SERVER" in uncolored or "Interactive Swagger Docs:" in uncolored or "Live REST API:" in uncolored:
            continue
        if uncolored.startswith("> @") or uncolored.startswith("> python") or uncolored.startswith("> vite"):
            continue
        if "Console Ninja" in uncolored:
            continue
        # Filter raw Vite default server banners since top card provides all tier URLs
        if any(uncolored.startswith(k) for k in ("VITE v", "➜  Local:", "➜  Network:", "➜  press h", "Wi-Fi", "vEthernet")):
            continue
        if "ready in" in uncolored and ("ms" in uncolored or "s" in uncolored) and "VITE" in uncolored:
            continue
        # Filter raw Uvicorn startup and probe messages
        if any(k in uncolored for k in ("GET /api/health", "GET /health", "Will watch for changes in these directories", "Started reloader process", "Started server process", "Waiting for application startup", "Application startup complete", "Uvicorn running on")):
            continue

        if cleaned_line.startswith("\033[90m["):
            print(cleaned_line, flush=True)
            continue

        print(format_universal_line(scope, "INFO", "SYSTEM", cleaned_line), flush=True)


__all__ = [
    "format_universal_line",
    "_stream_output",
]
