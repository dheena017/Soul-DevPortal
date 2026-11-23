"""
Unit Tests for Internal Engine Machinery (@workspace/logger/internal).
Tests colors, sanitization, formatting, network discovery, and box rendering.
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

# Ensure logger root in sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from internal.colors import Colors, strip_ansi, supports_color
from internal.sanitizer import (
    SENSITIVE_FIELD_NAMES,
    mask_secret,
    mask_sensitive_text,
    sanitize_headers,
)
from internal.formatter import (
    UniversalColoredFormatter,
    UvicornNoiseFilter,
    colorize_log_message,
)
from internal.network import (
    PORT_BACKEND_MAP,
    find_next_free_port,
    get_local_lan_ip,
    is_port_in_use,
    resolve_backend_port,
    should_suppress_child_banners,
)
from internal.box_renderer import render_box
from internal.supervisor import (
    format_universal_line,
    get_process_name_by_pid,
)


def test_colors():
    assert Colors.RED.startswith("\033[")
    assert Colors.GREEN.startswith("\033[")
    assert Colors.RESET == "\033[0m"
    colored_text = f"{Colors.BRIGHT_MAGENTA}Test Message{Colors.RESET}"
    assert strip_ansi(colored_text) == "Test Message"
    assert isinstance(supports_color(), bool)


def test_sanitizer():
    # Secret masking
    assert mask_secret("sk-1234567890abcdef") == "sk-1***def"
    assert mask_secret("short") == "***"

    # Redacting Bearer tokens and API keys in prose
    raw = "User Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xyz called AIzaSyD1234567890abcdef"
    clean = mask_sensitive_text(raw)
    assert "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9" not in clean
    assert "AIzaSyD1234567890abcdef" not in clean
    assert "Bearer" in clean

    # Redacting headers
    headers = {
        "Authorization": "Bearer secret-jwt-token-999",
        "Content-Type": "application/json",
        "X-Api-Key": "AIzaSyD1234567890",
    }
    clean_headers = sanitize_headers(headers)
    assert "secret-jwt-token-999" not in clean_headers["Authorization"]
    assert clean_headers["Content-Type"] == "application/json"
    assert "AIzaSyD1234567890" not in clean_headers["X-Api-Key"]


def test_formatter():
    formatter = UniversalColoredFormatter(scope="BACKEND")
    record = logging.LogRecord(
        name="test.api.server",
        level=logging.INFO,
        pathname=__file__,
        lineno=50,
        msg="Inference completed for gemini-2.5-flash with sk-1234567890abcdef",
        args=(),
        exc_info=None,
    )
    formatted = formatter.format(record)
    assert "BACKEND" in formatted
    assert "INFO" in formatted
    assert "SERVER" in formatted
    assert "sk-1234567890abcdef" not in formatted

    # Uvicorn noise filter
    noise_filter = UvicornNoiseFilter()
    noisy_record = logging.LogRecord(
        name="uvicorn",
        level=logging.INFO,
        pathname=__file__,
        lineno=50,
        msg="Waiting for application startup.",
        args=(),
        exc_info=None,
    )
    assert noise_filter.filter(noisy_record) is False

    valid_record = logging.LogRecord(
        name="uvicorn",
        level=logging.INFO,
        pathname=__file__,
        lineno=50,
        msg="Application custom event logged.",
        args=(),
        exc_info=None,
    )
    assert noise_filter.filter(valid_record) is True


def test_network():
    lan_ip = get_local_lan_ip()
    assert isinstance(lan_ip, str)
    assert len(lan_ip) >= 7

    assert PORT_BACKEND_MAP[5173] == 8000
    assert resolve_backend_port(5173) == 8000
    assert resolve_backend_port(9999, default=8000) == 8000

    assert isinstance(is_port_in_use(65530), bool)
    next_free = find_next_free_port(65000, max_attempts=10)
    assert next_free >= 65000


def test_box_renderer():
    box = render_box("SYSTEM AUDIT", [("Status", "Operational", Colors.BRIGHT_GREEN)])
    assert "SYSTEM AUDIT" in box
    assert "Status" in box
    assert "Operational" in box


def test_supervisor_helpers():
    line = format_universal_line("BACKEND", "INFO", "ROUTER", "Health checked OK")
    assert "BACKEND" in line
    assert "INFO" in line
    assert "ROUTER" in line
    assert "Health checked OK" in line


if __name__ == "__main__":
    test_colors()
    test_sanitizer()
    test_formatter()
    test_network()
    test_box_renderer()
    test_supervisor_helpers()
    print("✓ All internal unit tests passed!")
