"""
Unit Tests for External Consumer Interface (@workspace/logger/external).
Verifies both:
1. Root package interface (from external import ...)
2. Modular submodules (from external.server_logger import ..., etc.)
"""
from __future__ import annotations

import logging
import sys
from pathlib import Path

# Ensure logger root in sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

# 1. Root Facade Imports
from external import (
    AITelemetryTracker,
    Colors,
    DBQueryTimer,
    JsonFormatter,
    RequestLoggingMiddleware,
    UniversalColoredFormatter,
    ensure_port_free,
    get_local_lan_ip,
    get_logger,
    get_uvicorn_log_config,
    init_app_logger,
    is_port_in_use,
    log_ai_call,
    log_db_query,
    print_backend_banner,
    print_frontend_banner,
    print_fullstack_banner,
    render_box,
    setup_colored_logging,
    setup_json_logging,
)

# 2. Modular Submodule Imports
from external.server_logger import (
    setup_colored_logging as mod_setup_colored_logging,
    get_uvicorn_log_config as mod_get_uvicorn_log_config,
)
from external.middleware import (
    RequestLoggingMiddleware as ModRequestLoggingMiddleware,
    init_app_logger as mod_init_app_logger,
)
from external.banners import (
    print_fullstack_banner as mod_print_fullstack_banner,
    print_frontend_banner as mod_print_frontend_banner,
    print_backend_banner as mod_print_backend_banner,
)
from external.ai_logger import (
    log_ai_call as mod_log_ai_call,
    AITelemetryTracker as ModAITelemetryTracker,
)
from external.db_logger import (
    log_db_query as mod_log_db_query,
    DBQueryTimer as ModDBQueryTimer,
)
from external.json_logger import (
    JsonFormatter as ModJsonFormatter,
    setup_json_logging as mod_setup_json_logging,
)
from external.supervisor import (
    is_port_in_use as mod_is_port_in_use,
    find_next_free_port as mod_find_next_free_port,
)


def test_server_logging_setup():
    setup_colored_logging(level=logging.INFO, scope="TEST")
    logger = get_logger("test.service")
    assert isinstance(logger, logging.Logger)

    cfg = get_uvicorn_log_config()
    assert "formatters" in cfg
    assert "universal_colored" in cfg["formatters"]

    mod_cfg = mod_get_uvicorn_log_config()
    assert mod_cfg == cfg


def test_middleware_instantiation():
    class DummyApp:
        pass

    middleware = RequestLoggingMiddleware(DummyApp(), service_name="Test.Service")
    assert middleware.logger.name == "Test.Service"

    mod_middleware = ModRequestLoggingMiddleware(DummyApp(), service_name="Test.Modular")
    assert mod_middleware.logger.name == "Test.Modular"


def test_banners_invocation():
    lan_ip = get_local_lan_ip()
    assert isinstance(lan_ip, str)
    box = render_box("TITLE", [("Key", "Val", Colors.GREEN)])
    assert "TITLE" in box


def test_ai_telemetry():
    log_ai_call(model="gemini-2.5-flash", prompt_tokens=100, completion_tokens=200, duration_ms=150.0)
    with AITelemetryTracker("gemini-2.5-flash") as tracker:
        assert tracker.model == "gemini-2.5-flash"

    mod_log_ai_call(model="gemini-2.5-flash", duration_ms=80.0)
    with ModAITelemetryTracker("gemini-2.5-flash") as mod_tracker:
        assert mod_tracker.model == "gemini-2.5-flash"


def test_db_telemetry():
    log_db_query("SELECT id FROM users", duration_ms=12.5, rows=4)
    with DBQueryTimer("SELECT 1", db_name="sqlite") as timer:
        timer.set_rows(1)
        assert timer.rows == 1

    mod_log_db_query("SELECT 1", duration_ms=5.0)
    with ModDBQueryTimer("SELECT 1", db_name="sqlite") as mod_timer:
        mod_timer.set_rows(2)
        assert mod_timer.rows == 2


def test_json_formatter():
    formatter = JsonFormatter(scope="CLOUD")
    record = logging.LogRecord(
        name="api.order",
        level=logging.INFO,
        pathname=__file__,
        lineno=10,
        msg="Order placed with token sk-9876543210zyxw",
        args=(),
        exc_info=None,
    )
    output = formatter.format(record)
    assert '"level": "INFO"' in output
    assert '"scope": "CLOUD"' in output
    assert "sk-9876543210zyxw" not in output

    mod_formatter = ModJsonFormatter(scope="CLOUD")
    mod_output = mod_formatter.format(record)
    assert mod_output == output


def test_supervisor_helpers():
    assert isinstance(is_port_in_use(65530), bool)
    assert isinstance(mod_is_port_in_use(65530), bool)
    port = mod_find_next_free_port(65000, max_attempts=5)
    assert port >= 65000


if __name__ == "__main__":
    test_server_logging_setup()
    test_middleware_instantiation()
    test_banners_invocation()
    test_ai_telemetry()
    test_db_telemetry()
    test_json_formatter()
    test_supervisor_helpers()
    print("✓ All external unit tests passed!")
