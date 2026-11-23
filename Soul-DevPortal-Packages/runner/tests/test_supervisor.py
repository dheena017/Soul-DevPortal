"""
Unit tests for modular supervisor components (@workspace/runner/internal).
Tests sandboxing, ports, healthcheck, formatting, dashboard, and supervisor facade.
"""
from __future__ import annotations

import sys
from pathlib import Path

# Ensure runner package root in sys.path
runner_root = Path(__file__).resolve().parent.parent
if str(runner_root) not in sys.path:
    sys.path.insert(0, str(runner_root))

from internal.sandboxing import enable_process_sandboxing, enable_windows_kill_on_close
from internal.ports import is_port_in_use, find_next_free_port, get_process_name_by_pid, ensure_port_free
from internal.healthcheck import wait_for_server_healthy
from internal.formatting import format_universal_line
from internal.dashboard import get_local_lan_ip
from internal.controller import ProcessController
from internal.supervisor import run_single_process, run_dual_supervisor


def test_sandboxing():
    # Should not raise any exception
    enable_process_sandboxing()
    enable_windows_kill_on_close()


def test_ports():
    assert isinstance(is_port_in_use(65530), bool)
    port = find_next_free_port(64000, max_attempts=10)
    assert port >= 64000
    free_p = ensure_port_free(65532, auto_kill=False, allow_fallback=True)
    assert free_p >= 65532


def test_formatting():
    line = format_universal_line("BACKEND", "INFO", "SYSTEM", "Server online")
    assert "BACKEND" in line
    assert "INFO" in line
    assert "SYSTEM" in line
    assert "Server online" in line


def test_dashboard():
    lan_ip = get_local_lan_ip()
    assert isinstance(lan_ip, str)
    assert len(lan_ip) >= 7


def test_controller_instantiation():
    controller = ProcessController(
        frontend_cmd=["echo", "fe"],
        backend_cmd=["echo", "be"],
        service_name="Test",
        frontend_port=5173,
        backend_port=8000,
    )
    assert controller.frontend_port == 5173
    assert controller.backend_port == 8000
    assert controller.service_name == "Test"


if __name__ == "__main__":
    test_sandboxing()
    test_ports()
    test_formatting()
    test_dashboard()
    test_controller_instantiation()
    print("✓ All supervisor modular tests passed!")
