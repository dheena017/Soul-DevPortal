"""
AI & LLM Inference Telemetry Logger (@workspace/logger/external).
Measures inference latency, tokens, model branding, and execution status.
"""
from __future__ import annotations

import logging
import time
from typing import Any

from internal.colors import Colors

_ai_logger = logging.getLogger("workspace.ai")


def log_ai_call(
    model: str,
    prompt_tokens: int | None = None,
    completion_tokens: int | None = None,
    duration_ms: float = 0.0,
    status: str = "OK",
    metadata: dict[str, Any] | None = None,
) -> None:
    """Logs an AI/LLM inference operation with model tagging, token counts, and latency."""
    m_color = Colors.BRIGHT_MAGENTA
    model_badge = f"{m_color}{Colors.BOLD}[{model}]{Colors.RESET}"

    token_info: list[str] = []
    if prompt_tokens is not None:
        token_info.append(f"Prompt: {Colors.BRIGHT_GREEN}{prompt_tokens} tokens{Colors.RESET}")
    if completion_tokens is not None:
        token_info.append(f"Completion: {Colors.BRIGHT_GREEN}{completion_tokens} tokens{Colors.RESET}")
    token_str = f" │ {', '.join(token_info)}" if token_info else ""

    dur_color = (
        Colors.BRIGHT_GREEN
        if duration_ms < 1000
        else Colors.BRIGHT_YELLOW
        if duration_ms < 3000
        else Colors.BRIGHT_RED
    )
    dur_str = f" │ Duration: {dur_color}{duration_ms:.1f}ms{Colors.RESET}"

    status_str = (
        f"{Colors.BRIGHT_GREEN}OK{Colors.RESET}"
        if status == "OK"
        else f"{Colors.BRIGHT_RED}{status}{Colors.RESET}"
    )

    msg = f"AI Inference {model_badge} ──► {status_str}{token_str}{dur_str}"
    if status == "OK":
        _ai_logger.info(msg)
    else:
        _ai_logger.error(msg)


class AITelemetryTracker:
    """Context manager to measure and log AI call latency."""

    def __init__(self, model: str):
        self.model = model
        self.start: float = 0.0
        self.duration_ms: float = 0.0

    def __enter__(self) -> AITelemetryTracker:
        self.start = time.perf_counter()
        return self

    def __exit__(self, exc_type: Any, exc_val: Any, exc_tb: Any) -> None:
        self.duration_ms = (time.perf_counter() - self.start) * 1000
        status = "FAILED" if exc_type else "OK"
        log_ai_call(model=self.model, duration_ms=self.duration_ms, status=status)


__all__ = [
    "AITelemetryTracker",
    "log_ai_call",
]
