"""
AI & LLM Telemetry Logger for Workspace (workspace_logger.ai_logger).
Tracks prompt tokens, completion tokens, model selection (Gemini, Claude, GPT),
streaming chunk stats, and LLM latency with standardized 5-column ANSI output.
"""

from __future__ import annotations

import logging
import time
from typing import Any

from .server_logger import Colors

_ai_logger = logging.getLogger("workspace.ai")


def log_ai_call(
    model: str,
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
    duration_ms: float = 0.0,
    status: str = "OK",
    metadata: dict[str, Any] | None = None,
) -> None:
    """
    Logs an AI / LLM inference operation with model tagging, token counts, and latency.
    Usage:
        log_ai_call(model="gemini-2.5-flash", prompt_tokens=142, completion_tokens=380, duration_ms=480.2)
    """
    m_color = Colors.BRIGHT_MAGENTA
    model_badge = f"{m_color}{Colors.BOLD}[{model}]{Colors.RESET}"

    token_info = []
    if prompt_tokens is not None:
        token_info.append(f"Prompt: {Colors.BRIGHT_GREEN}{prompt_tokens} tokens{Colors.RESET}")
    if completion_tokens is not None:
        token_info.append(f"Completion: {Colors.BRIGHT_GREEN}{completion_tokens} tokens{Colors.RESET}")
    token_str = f" │ {', '.join(token_info)}" if token_info else ""

    dur_color = Colors.BRIGHT_GREEN if duration_ms < 1000 else Colors.BRIGHT_YELLOW if duration_ms < 3000 else Colors.BRIGHT_RED
    dur_str = f" │ Duration: {dur_color}{duration_ms:.1f}ms{Colors.RESET}"

    status_str = f"{Colors.BRIGHT_GREEN}OK{Colors.RESET}" if status == "OK" else f"{Colors.BRIGHT_RED}{status}{Colors.RESET}"

    msg = f"AI Inference {model_badge} ──► {status_str}{token_str}{dur_str}"
    if status == "OK":
        _ai_logger.info(msg)
    else:
        _ai_logger.error(msg)


class AITelemetryTracker:
    """Context manager to measure and log AI call latency."""

    def __init__(self, model: str):
        self.model = model
        self.start = 0.0
        self.duration_ms = 0.0

    def __enter__(self):
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.duration_ms = (time.perf_counter() - self.start) * 1000
        status = "FAILED" if exc_type else "OK"
        log_ai_call(model=self.model, duration_ms=self.duration_ms, status=status)
