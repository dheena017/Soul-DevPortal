"""
5-Column Server Logger & Terminal Formatter (@workspace/logger/external).
Provides high-visibility ANSI styling, Uvicorn dictConfig, and root logger setup.
"""
from __future__ import annotations

import logging
import os
import sys
from typing import Any

from internal.colors import Colors
from internal.formatter import (
    UniversalColoredFormatter,
    UvicornNoiseFilter,
    colorize_log_message,
)
from .json_logger import JsonFormatter


def get_uvicorn_log_config(use_color: bool | None = None) -> dict[str, Any]:
    """Returns a production dictConfig dictionary for Uvicorn using the universal colored formatter."""
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


def setup_colored_logging(level: int = logging.INFO, scope: str = "BACKEND ", format: str = "ansi") -> None:
    """Initializes root and third-party loggers with the 5-column universal formatter or structured JSON."""
    handler = logging.StreamHandler(sys.stdout)
    if format.lower() == "json" or os.environ.get("LOG_FORMAT", "").lower() == "json":
        handler.setFormatter(JsonFormatter(scope=scope))
    else:
        handler.setFormatter(UniversalColoredFormatter(scope=scope))
    handler.addFilter(UvicornNoiseFilter())

    root_logger = logging.getLogger()
    root_logger.setLevel(level)

    if not any(
        isinstance(h, logging.StreamHandler) and isinstance(h.formatter, UniversalColoredFormatter)
        for h in root_logger.handlers
    ):
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


def get_logger(name: str | None = None) -> logging.Logger:
    """Retrieves a named logger instance."""
    return logging.getLogger(name)


__all__ = [
    "Colors",
    "UniversalColoredFormatter",
    "colorize_log_message",
    "get_uvicorn_log_config",
    "setup_colored_logging",
    "get_logger",
]
