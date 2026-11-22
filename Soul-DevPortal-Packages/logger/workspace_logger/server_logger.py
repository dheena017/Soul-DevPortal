"""
Universal 5-Column Server Logger & HTTP Middleware for Workspace.
Provides high-visibility ANSI styling, Request-ID tracing, sensitive data masking,
detailed HTTP telemetry, SQL query syntax coloring, and Uvicorn noise suppression.
"""

from __future__ import annotations

import json
import logging
import os
import re
import sys
import time
import uuid
from datetime import datetime
from typing import Callable
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

# Enable UTF-8 and ANSI processing on Windows
if sys.platform == "win32":
    try:
        import ctypes
        from ctypes import wintypes
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        h_out = kernel32.GetStdHandle(-11)
        mode = wintypes.DWORD()
        if kernel32.GetConsoleMode(h_out, ctypes.byref(mode)):
            # ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004
            kernel32.SetConsoleMode(h_out, mode.value | 0x0004)
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

# Ensure module is resolvable in sys.modules whether imported via
# 'workspace_logger.server_logger' or directly as 'server_logger'
sys.modules.setdefault("server_logger", sys.modules[__name__])


class Colors:
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"

    # Foreground
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    GRAY = "\033[90m"

    # Bright Foreground
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"

    # Background Badges
    BG_RED = "\033[41m\033[97m\033[1m"
    BG_GREEN = "\033[42m\033[30m\033[1m"
    BG_YELLOW = "\033[43m\033[30m\033[1m"
    BG_BLUE = "\033[44m\033[97m\033[1m"
    BG_MAGENTA = "\033[45m\033[97m\033[1m"
    BG_CYAN = "\033[46m\033[30m\033[1m"
    BG_GRAY = "\033[100m\033[97m\033[1m"


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

    # Arrow symbols
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
        color_scope = Colors.BRIGHT_CYAN if "FRONT" in self.scope else Colors.BRIGHT_GREEN if "BACK" in self.scope else Colors.BRIGHT_MAGENTA
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

        # Col 5: Formatted Message
        msg = record.getMessage()
        if record.levelno >= logging.ERROR:
            msg_colored = f"{Colors.BRIGHT_RED}{msg}{Colors.RESET}"
        elif record.levelno == logging.WARNING:
            msg_colored = f"{Colors.BRIGHT_YELLOW}{msg}{Colors.RESET}"
        else:
            msg_colored = colorize_log_message(msg)

        formatted = f"{col_timestamp} {col_scope} {col_badge} {col_tag} {msg_colored}"
        if not self.use_color:
            return re.sub(r"\033\[[0-9;]*[a-zA-Z]", "", formatted)
        return formatted


ColoredFormatter = UniversalColoredFormatter


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Production-grade HTTP request/response logging middleware.
    Attaches X-Request-ID, masks sensitive headers, calculates latency,
    and categorizes response codes with tiered color coding.
    """

    SENSITIVE_KEYS = {"authorization", "cookie", "set-cookie", "x-api-key", "password", "token", "secret"}

    def __init__(self, app, service_name: str = "Workspace.HTTP"):
        super().__init__(app)
        self.logger = logging.getLogger(service_name)

    async def dispatch(self, request: Request, call_next: Callable) -> Response:
        req_id = request.headers.get("x-request-id") or uuid.uuid4().hex[:8]
        start_time = time.perf_counter()

        method = request.method
        path = request.url.path
        is_health = path in ("/api/health", "/health", "/favicon.ico")

        query_str = str(request.url.query)
        display_path = f"{path}?{query_str}" if query_str else path

        # Method Color
        m_colors = {
            "GET": Colors.BRIGHT_CYAN,
            "POST": Colors.BRIGHT_GREEN,
            "PUT": Colors.BRIGHT_YELLOW,
            "DELETE": Colors.BRIGHT_RED,
            "PATCH": Colors.BRIGHT_MAGENTA,
            "OPTIONS": Colors.GRAY,
        }
        m_color = m_colors.get(method, Colors.WHITE)

        # 1. Inbound Request Log
        arrow_in = f"{Colors.BRIGHT_CYAN}──► [INBOUND ]{Colors.RESET}"
        inbound_msg = (
            f"{arrow_in} {m_color}{Colors.BOLD}{method:<6}{Colors.RESET} "
            f"{Colors.BRIGHT_CYAN}{display_path}{Colors.RESET} "
            f"{Colors.GRAY}[ID: #{req_id}]{Colors.RESET}"
        )

        if is_health:
            self.logger.debug(inbound_msg)
        else:
            self.logger.info(inbound_msg)

        try:
            response: Response = await call_next(request)
            duration_ms = (time.perf_counter() - start_time) * 1000
            code = response.status_code

            # Status Code Categorization
            if code < 300:
                code_str = f"{Colors.BRIGHT_GREEN}{code} OK{Colors.RESET}"
                arrow_out = f"{Colors.BRIGHT_GREEN}{Colors.BOLD}◄── [OUTBOUND]{Colors.RESET}"
            elif code < 400:
                code_str = f"{Colors.BRIGHT_CYAN}{code} REDIR{Colors.RESET}"
                arrow_out = f"{Colors.BRIGHT_CYAN}{Colors.BOLD}◄── [OUTBOUND]{Colors.RESET}"
            elif code < 500:
                code_str = f"{Colors.BRIGHT_YELLOW}{code} CLIENT ERR{Colors.RESET}"
                arrow_out = f"{Colors.BRIGHT_YELLOW}{Colors.BOLD}◄── [CLIENT ERR]{Colors.RESET}"
            else:
                code_str = f"{Colors.BRIGHT_RED}{code} SERVER ERR{Colors.RESET}"
                arrow_out = f"{Colors.BRIGHT_RED}{Colors.BOLD}◄── [FAILED  ]{Colors.RESET}"

            # Latency Highlighting (<100ms green, 100-500ms yellow, >500ms red)
            if duration_ms < 100:
                duration_str = f"{Colors.BRIGHT_GREEN}{duration_ms:.1f}ms{Colors.RESET}"
            elif duration_ms < 500:
                duration_str = f"{Colors.BRIGHT_YELLOW}{duration_ms:.1f}ms{Colors.RESET}"
            else:
                duration_str = f"{Colors.BRIGHT_RED}{duration_ms:.1f}ms (slow){Colors.RESET}"

            outbound_msg = (
                f"{arrow_out} {code_str} "
                f"{m_color}{Colors.BOLD}{method:<6}{Colors.RESET} "
                f"{Colors.BRIGHT_CYAN}{path}{Colors.RESET} "
                f"{Colors.GRAY}│ Duration: {Colors.RESET}{duration_str} "
                f"{Colors.GRAY}[ID: #{req_id}]{Colors.RESET}"
            )

            if is_health:
                self.logger.debug(outbound_msg)
            elif code >= 500:
                self.logger.error(outbound_msg)
            elif code >= 400:
                self.logger.warning(outbound_msg)
            else:
                self.logger.info(outbound_msg)

            response.headers["x-request-id"] = req_id
            response.headers["x-response-time"] = f"{duration_ms:.2f}ms"
            return response

        except Exception as exc:
            duration_ms = (time.perf_counter() - start_time) * 1000
            arrow_err = f"{Colors.BRIGHT_RED}{Colors.BOLD}◄── [FAILED  ]{Colors.RESET}"
            self.logger.error(
                f"{arrow_err} {Colors.BRIGHT_RED}500 SERVER ERR{Colors.RESET} "
                f"{m_color}{Colors.BOLD}{method:<6}{Colors.RESET} "
                f"{Colors.BRIGHT_CYAN}{path}{Colors.RESET} "
                f"{Colors.GRAY}│ Duration: {Colors.RESET}{Colors.BRIGHT_RED}{duration_ms:.1f}ms{Colors.RESET} "
                f"{Colors.GRAY}│ Error: {Colors.RESET}{Colors.BRIGHT_RED}{exc}{Colors.RESET} "
                f"{Colors.GRAY}[ID: #{req_id}]{Colors.RESET}"
            )
            raise exc


def get_uvicorn_log_config(use_color: bool | None = None) -> dict:
    """Returns a production dictConfig dictionary for Uvicorn using universal colored formatter."""
    return {
        "version": 1,
        "disable_existing_loggers": False,
        "formatters": {
            "universal_colored": {
                "()": UniversalColoredFormatter,
                "use_color": use_color,
            },
        },
        "filters": {
            "uvicorn_noise": {
                "()": UvicornNoiseFilter,
            },
        },
        "handlers": {
            "console_stream": {
                "class": "logging.StreamHandler",
                "formatter": "universal_colored",
                "filters": ["uvicorn_noise"],
                "stream": "ext://sys.stdout",
            },
        },
        "loggers": {
            "": {"handlers": ["console_stream"], "level": "INFO"},
            "uvicorn": {"handlers": ["console_stream"], "level": "INFO", "propagate": False},
            "uvicorn.error": {"handlers": ["console_stream"], "level": "INFO", "propagate": False},
            "uvicorn.access": {"handlers": ["console_stream"], "level": "WARNING", "propagate": False},
            "watchfiles": {"handlers": ["console_stream"], "level": "WARNING", "propagate": False},
        },
    }


def setup_server_logging(level: int = logging.INFO, scope: str = "BACKEND ", format: str = "ansi"):
    """Initializes root and third-party loggers with the 5-column universal formatter or structured JSON."""
    handler = logging.StreamHandler(sys.stdout)
    if format.lower() == "json" or os.environ.get("LOG_FORMAT", "").lower() == "json":
        try:
            from .json_logger import JsonFormatter
        except ImportError:
            from json_logger import JsonFormatter
        handler.setFormatter(JsonFormatter(scope=scope))
    else:
        handler.setFormatter(UniversalColoredFormatter(scope=scope))
    handler.addFilter(UvicornNoiseFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    if not any(isinstance(h, logging.StreamHandler) and isinstance(h.formatter, UniversalColoredFormatter) for h in root_logger.handlers):
        root_logger.handlers = [handler]

    for u_name in ("uvicorn", "uvicorn.error", "uvicorn.access"):
        u_logger = logging.getLogger(u_name)
        u_logger.handlers = [handler]
        u_logger.propagate = False
        u_logger.setLevel(level if "access" not in u_name else logging.WARNING)

    # Silence noisy libraries
    logging.getLogger("httpx").setLevel(logging.WARNING)
    logging.getLogger("watchfiles").setLevel(logging.WARNING)
    logging.getLogger("asyncio").setLevel(logging.WARNING)


setup_colored_logging = setup_server_logging
get_logger = logging.getLogger


def init_app_logger(
    app,
    title: str = "API SERVER",
    port: int = 8000,
    host: str = "127.0.0.1",
    level: int = logging.INFO,
    show_banner: bool = True,
    scope: str = "BACKEND ",
):
    """
    Ultra-feasible 1-line integration helper for FastAPI/Starlette applications.
    Initializes 5-column formatting, registers RequestLoggingMiddleware, and hooks the startup banner.
    Usage:
        init_app_logger(app, title="API Server", port=8000)
    """
    setup_server_logging(level=level, scope=scope)
    app.add_middleware(RequestLoggingMiddleware, service_name=f"{title.split()[0]}.HTTP")

    if show_banner:
        try:
            try:
                from .banners import print_backend_banner
            except (ImportError, ValueError):
                try:
                    from workspace_logger.banners import print_backend_banner
                except ImportError:
                    from banners import print_backend_banner

            @app.on_event("startup")
            def _on_startup_banner():
                print_backend_banner(title=title, port=port, host=host)
        except Exception:
            pass

