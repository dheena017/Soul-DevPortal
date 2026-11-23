"""
Network and Port Discovery Helpers (@workspace/logger).
Provides LAN IP auto-discovery, TCP port probing, and port pairing resolution.
"""
from __future__ import annotations

import os
import socket

# Master Client-to-Backend port registry mapping
PORT_BACKEND_MAP: dict[int, int] = {
    5173: 8000,
    5174: 8001,
    5175: 8002,
    5176: 8006,
    5177: 8007,
    5178: 8005,
    5179: 8003,
    5180: 8004,
    5181: 8008,
}


def get_local_lan_ip() -> str:
    """Discovers the active local LAN IPv4 address (e.g. 192.168.x.x or 10.x.x.x)."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks if a TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def find_next_free_port(start_port: int, max_attempts: int = 50, host: str = "127.0.0.1") -> int:
    """Finds the next free TCP port starting from start_port."""
    for p in range(start_port, start_port + max_attempts):
        if not is_port_in_use(p, host=host):
            return p
    return start_port


def resolve_backend_port(client_port: int, default: int = 8000) -> int:
    """Resolves matching backend API port for a given frontend client port."""
    return PORT_BACKEND_MAP.get(client_port, default)


def should_suppress_child_banners() -> bool:
    """Returns True if running under a supervisor or master orchestrator that manages banners."""
    return any(
        os.environ.get(k) == "1"
        for k in (
            "SOUL_DEV_ALL",
            "WORKSPACE_QUIET_BANNERS",
            "WORKSPACE_SUPERVISOR_ACTIVE",
            "WORKSPACE_RUNNER_ACTIVE",
            "WORKSPACE_CHILD_PROCESS",
        )
    )
