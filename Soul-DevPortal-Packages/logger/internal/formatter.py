"""
5-Column Universal Terminal Log Formatter & Syntax Highlighter Engine.
Renders logs conforming to the workspace standard schema:
[HH:MM:SS] [SCOPE   ] [ LEVEL ] [MODULE-TAG    ] MESSAGE
"""
from __future__ import annotations

import logging
import os
import re
import sys
from datetime import datetime
from typing import Any

from .colors import Colors, strip_ansi
from .sanitizer import mask_sensitive_text


class UvicornNoiseFilter(logging.Filter):
    """Suppresses routine Uvicorn lifecycle noise and health poll chatter."""
    NOISE_PHRASES = (
        "waiting for application startup",
        "waiting for application shutdown",
        "started server process",
        "finished server process",
        "shutting down",
        "application shutdown complete",
        "application startup complete",
        "will watch for changes in these directories",
        "started reloader process",
        "uvicorn running on",
    )

    def filter(self, record: logging.LogRecord) -> bool:
        msg = record.getMessage().lower()
        return not any(phrase in msg for phrase in self.NOISE_PHRASES)


def colorize_log_message(msg: str) -> str:
    """Intelligently syntax-highlights paths, URLs, metrics, UUIDs, and SQL tokens."""
    if "\033[" in msg:
        return msg

    clean = msg

    # Highlight URLs & Endpoints
    clean = re.sub(
        r"(https?://[^\s\)]+)",
        rf"{Colors.BRIGHT_CYAN}{Colors.UNDERLINE}\1{Colors.RESET}",
        clean,
    )

    # Highlight file paths
    clean = re.sub(
        r"((?:/[\w\.\-]+)+|(?:[a-zA-Z]:\\[\w\.\-\\]+))",
        rf"{Colors.CYAN}\1{Colors.RESET}",
        clean,
    )

    # Highlight UUIDs and Request IDs
    clean = re.sub(
        r"\b([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})\b",
        rf"{Colors.YELLOW}\1{Colors.RESET}",
        clean,
    )

    # Highlight metrics and sizes (ms, s, KB, MB, GB, rows, tokens)
    clean = re.sub(
        r"\b(\d+\.?\d*\s*(?:ms|s|seconds|bytes|KB|MB|GB|rows|tokens|words|items|records))\b",
        rf"{Colors.BRIGHT_GREEN}\1{Colors.RESET}",
        clean,
        flags=re.IGNORECASE,
    )

    # Highlight SQL verbs
    sql_verbs = r"\b(SELECT|INSERT INTO|UPDATE|DELETE FROM|JOIN|LEFT JOIN|WHERE|ORDER BY|GROUP BY|HAVING|LIMIT)\b"
    clean = re.sub(sql_verbs, rf"{Colors.BRIGHT_MAGENTA}{Colors.BOLD}\1{Colors.RESET}", clean)

    # Highlight AI Models
    clean = re.sub(
        r"\b(gemini-[\w\.\-]+|gpt-[\w\.\-]+|claude-[\w\.\-]+)\b",
        rf"{Colors.BRIGHT_MAGENTA}{Colors.BOLD}\1{Colors.RESET}",
        clean,
    )

    # Highlight double/single quoted strings
    clean = re.sub(r'\"([^\"]+)\"', rf'"{Colors.BRIGHT_WHITE}\1{Colors.RESET}"', clean)
    clean = re.sub(r"'([^']+)'", rf"'{Colors.BRIGHT_WHITE}\1{Colors.RESET}'", clean)

    # Arrow and delimiter symbols
    clean = clean.replace(" -> ", f" {Colors.GRAY}➔{Colors.RESET} ")
    clean = clean.replace(" | ", f" {Colors.GRAY}│{Colors.RESET} ")

    return clean


class UniversalColoredFormatter(logging.Formatter):
    """
    Renders the universal 5-column layout:
    [HH:MM:SS] [SCOPE   ] [ LEVEL ] [MODULE-TAG    ] MESSAGE
    """

    LEVEL_BADGES = {
        logging.DEBUG: f"{Colors.BG_GRAY} DEBUG {Colors.RESET}",
        logging.INFO: f"{Colors.BG_BLUE}  INFO {Colors.RESET}",
        logging.WARNING: f"{Colors.BG_YELLOW}  WARN {Colors.RESET}",
        logging.ERROR: f"{Colors.BG_RED} ERROR {Colors.RESET}",
        logging.CRITICAL: f"{Colors.BG_RED} FATAL {Colors.RESET}",
    }

    MODULE_COLORS = {
        "DATABASE": Colors.BRIGHT_GREEN,
        "SQL": Colors.GREEN,
        "AI": Colors.BRIGHT_MAGENTA,
        "WORKSPACE": Colors.BRIGHT_BLUE,
        "NOTIFICATIONS": Colors.BRIGHT_YELLOW,
        "DASHBOARD": Colors.BRIGHT_CYAN,
        "HTTP": Colors.CYAN,
        "ROUTER": Colors.BRIGHT_CYAN,
        "WEBSOCKET": Colors.BRIGHT_YELLOW,
        "CACHE": Colors.BRIGHT_MAGENTA,
        "TRANSFER": Colors.BRIGHT_GREEN,
        "SERVER": Colors.BRIGHT_CYAN,
        "AUTH": Colors.BRIGHT_GREEN,
        "SECURITY": Colors.BRIGHT_RED,
        "APP": Colors.BRIGHT_CYAN,
        "SYSTEM": Colors.GRAY,
    }

    def __init__(self, scope: str = "BACKEND ", use_color: bool | None = None):
        super().__init__()
        self.scope = scope.strip()
        if use_color is None:
            use_color = sys.stdout.isatty() or os.environ.get("FORCE_COLOR", "").strip() not in ("", "0")
        self.use_color = use_color and os.environ.get("NO_COLOR") is None

    def format(self, record: logging.LogRecord) -> str:
        # Col 1: Timestamp (10 chars with brackets)
        now = datetime.fromtimestamp(record.created).strftime("%H:%M:%S")
        col_timestamp = f"{Colors.GRAY}[{now}]{Colors.RESET}"

        # Col 2: Scope (10 chars with brackets)
        scope_str = self.scope.ljust(8)
        color_scope = (
            Colors.BRIGHT_CYAN
            if "FRONT" in self.scope
            else Colors.BRIGHT_GREEN
            if "BACK" in self.scope
            else Colors.BRIGHT_MAGENTA
        )
        col_scope = f"{color_scope}[{scope_str}]{Colors.RESET}"

        # Col 3: Level Badge (9 chars)
        col_badge = self.LEVEL_BADGES.get(record.levelno, f"[{record.levelname:<7}]")

        # Col 4: Module Tag (16 chars with brackets)
        raw_name = record.name.split(".")[-1].upper()
        if "UVICORN" in raw_name or "SERVER" in raw_name:
            tag = "SERVER"
        elif "HTTP" in raw_name:
            tag = "HTTP"
        elif "WS" in raw_name or "WEBSOCKET" in raw_name:
            tag = "WEBSOCKET"
        elif "TRANSFER" in raw_name:
            tag = "TRANSFER"
        elif "GEMINI" in raw_name or "AI" in raw_name:
            tag = "GEMINI"
        elif "DATABASE" in raw_name or "DB" in raw_name or "SQL" in raw_name:
            tag = "DATABASE"
        elif "AUTH" in raw_name or "GUARD" in raw_name:
            tag = "AUTH"
        else:
            tag = raw_name[:12] if raw_name else "APP"

        tag_color = self.MODULE_COLORS.get(tag, Colors.CYAN)
        col_tag = f"{tag_color}{Colors.BOLD}[{tag:<14}]{Colors.RESET}"

        # Col 5: Formatted Message (with secret masking)
        msg = mask_sensitive_text(record.getMessage())
        if record.levelno >= logging.ERROR:
            msg_colored = f"{Colors.BRIGHT_RED}{msg}{Colors.RESET}"
        elif record.levelno == logging.WARNING:
            msg_colored = f"{Colors.BRIGHT_YELLOW}{msg}{Colors.RESET}"
        else:
            msg_colored = colorize_log_message(msg)

        formatted = f"{col_timestamp} {col_scope} {col_badge} {col_tag} {msg_colored}"
        if not self.use_color:
            return strip_ansi(formatted)
        return formatted


def format_universal_line(scope: str, level: str, module: str, message: str) -> str:
    """Renders a single line conforming to the 5-column universal schema."""
    now = datetime.now().strftime("%H:%M:%S")
    col_time = f"{Colors.GRAY}[{now}]{Colors.RESET}"

    color_scope = (
        Colors.BRIGHT_CYAN
        if "FRONT" in scope.upper()
        else Colors.BRIGHT_GREEN
        if "BACK" in scope.upper()
        else Colors.BRIGHT_MAGENTA
    )
    col_scope = f"{color_scope}[{scope.ljust(8)}]{Colors.RESET}"

    badge_map = {
        "DEBUG": f"{Colors.BG_GRAY} DEBUG {Colors.RESET}",
        "INFO": f"{Colors.BG_BLUE}  INFO {Colors.RESET}",
        "ACTION": f"{Colors.BG_MAGENTA} ACTION{Colors.RESET}",
        "WARN": f"{Colors.BG_YELLOW}  WARN {Colors.RESET}",
        "ERROR": f"{Colors.BG_RED} ERROR {Colors.RESET}",
    }
    col_badge = badge_map.get(level.upper(), f"[{level:<7}]")
    col_module = f"{Colors.CYAN}{Colors.BOLD}[{module[:14]:<14}]{Colors.RESET}"

    clean_msg = mask_sensitive_text(message)
    return f"{col_time} {col_scope} {col_badge} {col_module} {colorize_log_message(clean_msg)}"

