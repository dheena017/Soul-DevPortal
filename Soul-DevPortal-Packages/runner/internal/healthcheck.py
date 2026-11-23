"""
Socket & HTTP Healthcheck Probing Engine (@workspace/runner/internal).
Polls TCP ports and optional HTTP health endpoints until connection acceptance.
"""
from __future__ import annotations

import subprocess
import time
import urllib.request

from .ports import is_port_in_use


def wait_for_server_healthy(
    port: int,
    host: str = "127.0.0.1",
    health_endpoint: str | None = None,
    timeout: float = 12.0,
    interval: float = 0.1,
    process_handle: subprocess.Popen | None = None,
) -> tuple[bool, float]:
    """Actively probes TCP socket and optional HTTP endpoint until accepting connections."""
    start_time = time.perf_counter()
    while time.perf_counter() - start_time < timeout:
        if process_handle and process_handle.poll() is not None:
            return False, round(time.perf_counter() - start_time, 3)

        if is_port_in_use(port, host=host):
            if health_endpoint:
                try:
                    url = f"http://{host}:{port}{health_endpoint}"
                    req = urllib.request.Request(url, headers={"User-Agent": "Workspace-Healthcheck/1.0"})
                    with urllib.request.urlopen(req, timeout=1.0) as resp:
                        if 200 <= resp.status < 500:
                            return True, round(time.perf_counter() - start_time, 3)
                except Exception:
                    time.sleep(interval)
                    continue
            return True, round(time.perf_counter() - start_time, 3)
        time.sleep(interval)

    return False, round(time.perf_counter() - start_time, 3)


__all__ = [
    "wait_for_server_healthy",
]
