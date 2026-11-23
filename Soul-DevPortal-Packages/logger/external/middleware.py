"""
HTTP Request Logging Middleware for FastAPI and Starlette (@workspace/logger/external).
Provides X-Request-ID propagation, duration calculation, and ANSI colorized HTTP access logs.
"""
from __future__ import annotations

import logging
import time
import uuid
from typing import Any, Callable

from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
from starlette.responses import Response

from internal.colors import Colors
from internal.sanitizer import mask_sensitive_text
from .banners import print_backend_banner
from .server_logger import setup_colored_logging


class RequestLoggingMiddleware(BaseHTTPMiddleware):
    """
    Production-grade HTTP request/response logging middleware for FastAPI & Starlette.
    Attaches X-Request-ID, masks sensitive headers, calculates latency,
    and categorizes response codes with tiered color coding.
    """

    SENSITIVE_KEYS: set[str] = {
        "authorization",
        "cookie",
        "set-cookie",
        "x-api-key",
        "password",
        "token",
        "secret",
    }

    def __init__(self, app: Any, service_name: str = "Workspace.HTTP"):
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
        display_path = mask_sensitive_text(display_path)

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

        # Inbound Request Log
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


def init_app_logger(
    app: Any,
    title: str = "API SERVER",
    port: int = 8000,
    host: str = "127.0.0.1",
    level: int = logging.INFO,
    show_banner: bool = True,
    scope: str = "BACKEND ",
) -> None:
    """
    1-line integration helper for FastAPI/Starlette applications.
    Initializes 5-column formatting, registers RequestLoggingMiddleware, and hooks the startup banner.
    Usage:
        init_app_logger(app, title="API Server", port=8000)
    """
    setup_colored_logging(level=level, scope=scope)
    app.add_middleware(RequestLoggingMiddleware, service_name=f"{title.split()[0]}.HTTP")

    if show_banner:
        try:
            @app.on_event("startup")
            def _on_startup_banner() -> None:
                print_backend_banner(title=title, port=port, host=host)
        except Exception:
            pass


__all__ = [
    "RequestLoggingMiddleware",
    "init_app_logger",
]
