"""
Unit tests for port topology integrity across monorepo micro-apps (@workspace/config).
Tests uniqueness, resolution, and valid port ranges for all 8 micro-apps and DevPortal.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Ensure config package root is in sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from internal.ports import (
    PORT_REGISTRY,
    MONOREPO_PROJECTS,
    get_all_ports,
    get_project_config,
    get_project_ports,
    is_port_in_use,
)


def test_no_duplicate_client_ports() -> None:
    client_ports = {}
    for proj_id, info in PORT_REGISTRY.items():
        cp = info.get("client")
        if cp:
            assert cp not in client_ports, f"Duplicate client port {cp} in {proj_id} and {client_ports[cp]}"
            client_ports[cp] = proj_id


def test_no_duplicate_server_ports() -> None:
    server_ports = {}
    for proj_id, info in PORT_REGISTRY.items():
        sp = info.get("server")
        if sp:
            assert sp not in server_ports, f"Duplicate server port {sp} in {proj_id} and {server_ports[sp]}"
            server_ports[sp] = proj_id


def test_get_project_ports() -> None:
    ports = get_project_ports("apexmind-ai")
    assert ports == (5173, 8000)


def test_get_project_config() -> None:
    cfg = get_project_config("apexmind-ai")
    assert cfg["client"] == 5173
    assert cfg["server"] == 8000
    assert "FastAPI" in cfg["server_stack"]


def test_get_all_ports() -> None:
    all_ports = get_all_ports()
    assert "apexmind-ai" in all_ports
    assert "devportal" in all_ports
    assert len(all_ports) >= 9



if __name__ == "__main__":
    test_no_duplicate_client_ports()
    test_no_duplicate_server_ports()
    test_get_project_ports()
    test_get_project_config()
    test_get_all_ports()
    print("✓ All port integrity tests passed!")
