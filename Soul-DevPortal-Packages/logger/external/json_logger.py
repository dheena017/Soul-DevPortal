"""
Structured JSON Logger & Cloud Formatter (@workspace/logger/external).
Formats log records as single-line JSON with credential masking for CloudWatch/GCP.
"""
from __future__ import annotations

import json
import logging
import sys
from datetime import datetime, timezone
from typing import Any

from internal.sanitizer import mask_sensitive_text


class JsonFormatter(logging.Formatter):
    """Formats log records as single-line JSON with credential masking."""

    def __init__(self, scope: str = "BACKEND "):
        super().__init__()
        self.scope = scope.strip()

    def format(self, record: logging.LogRecord) -> str:
        timestamp = datetime.fromtimestamp(record.created, tz=timezone.utc).isoformat()

        raw_name = record.name.split(".")[-1].upper()
        if "UVICORN" in raw_name or "SERVER" in raw_name:
            tag = "SERVER"
        elif "HTTP" in raw_name:
            tag = "HTTP"
        elif "DATABASE" in raw_name or "SQL" in raw_name:
            tag = "DATABASE"
        elif "AI" in raw_name or "GEMINI" in raw_name:
            tag = "AI"
        else:
            tag = raw_name[:14] if raw_name else "APP"

        clean_message = mask_sensitive_text(record.getMessage())

        payload: dict[str, Any] = {
            "timestamp": timestamp,
            "level": record.levelname,
            "scope": self.scope,
            "module": tag,
            "message": clean_message,
            "logger": record.name,
        }

        if hasattr(record, "request_id"):
            payload["request_id"] = getattr(record, "request_id")
        if hasattr(record, "duration_ms"):
            payload["duration_ms"] = getattr(record, "duration_ms")
        if hasattr(record, "status_code"):
            payload["status_code"] = getattr(record, "status_code")

        if record.exc_info:
            payload["exception"] = self.formatException(record.exc_info)

        return json.dumps(payload, default=str)


def setup_json_logging(level: int = logging.INFO, scope: str = "BACKEND ") -> None:
    """Configures the root logger to output structured single-line JSON logs."""
    handler = logging.StreamHandler(sys.stdout)
    handler.setFormatter(JsonFormatter(scope=scope))

    root = logging.getLogger()
    root.setLevel(level)
    root.handlers = [handler]


__all__ = [
    "JsonFormatter",
    "setup_json_logging",
]
