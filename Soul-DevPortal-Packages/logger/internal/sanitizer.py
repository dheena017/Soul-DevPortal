"""
Sensitive Data Sanitizer & Secret Redaction Engine (@workspace/logger).
Masks API keys (Gemini, Supabase, OpenAI, Anthropic), Bearer tokens,
passwords, cookies, and secrets before console rendering or transmission.
"""
from __future__ import annotations

import re
from typing import Any

SENSITIVE_FIELD_NAMES: set[str] = {
    "authorization",
    "cookie",
    "set-cookie",
    "x-api-key",
    "password",
    "secret",
    "token",
    "access_token",
    "refresh_token",
    "api_key",
    "apikey",
    "jwt",
    "credentials",
    "private_key",
}

# Regex patterns matching secrets inside raw strings
_BEARER_PATTERN = re.compile(r"(Bearer\s+)([A-Za-z0-9_\-\.]+)", re.IGNORECASE)
_API_KEY_PATTERN = re.compile(r"((?:AIza|sk-|sbp_)[A-Za-z0-9_\-]{8,})", re.IGNORECASE)
_GENERIC_KEY_VALUE_PATTERN = re.compile(
    r"""(?P<prefix>(?:api[_-]?key|password|secret|token)\s*[:=]\s*["']?)(?P<val>[^"'\s,;]+)(?P<suffix>["']?)""",
    re.IGNORECASE,
)


def mask_secret(value: str, visible_start: int = 4, visible_end: int = 3) -> str:
    """Masks a secret string leaving a small visible prefix and suffix, e.g. 'sk-123***abc'."""
    if not value or len(value) <= (visible_start + visible_end):
        return "***"
    return f"{value[:visible_start]}***{value[-visible_end:]}"


def mask_sensitive_text(text: str) -> str:
    """Redacts Bearer tokens, API keys, and sensitive key-values inside arbitrary text strings."""
    if not text:
        return text

    # Redact Bearer tokens: 'Bearer eyJhbGciOi...' -> 'Bearer eyJh***...'
    text = _BEARER_PATTERN.sub(lambda m: f"{m.group(1)}{mask_secret(m.group(2))}", text)

    # Redact known API key patterns (Gemini AIza..., OpenAI sk-..., Supabase sbp_...)
    text = _API_KEY_PATTERN.sub(lambda m: mask_secret(m.group(1)), text)

    # Redact key-value pairings (e.g. password=mypassword -> password=***)
    text = _GENERIC_KEY_VALUE_PATTERN.sub(
        lambda m: f"{m.group('prefix')}***{m.group('suffix')}", text
    )

    return text


def sanitize_headers(headers: dict[str, Any] | list[tuple[str, Any]]) -> dict[str, str]:
    """Sanitizes HTTP headers, redacting credentials and tokens."""
    sanitized: dict[str, str] = {}
    items = headers.items() if isinstance(headers, dict) else headers
    for k, v in items:
        k_lower = str(k).lower()
        if k_lower in SENSITIVE_FIELD_NAMES:
            sanitized[str(k)] = mask_secret(str(v))
        else:
            sanitized[str(k)] = mask_sensitive_text(str(v))
    return sanitized
