"""
Universal Process & Port Supervisor Component for Workspace (@workspace/runner/internal).
Coordinates cross-platform kernel binding, deterministic port conflict handling,
active TCP/HTTP healthcheck probing, and interactive hotkey control.
"""
from __future__ import annotations

import signal
import subprocess
import sys
import threading
import time
from pathlib import Path
from typing import Any

from .controller import ProcessController
from .dashboard import (
    get_local_lan_ip,
    print_fullstack_dashboard,
    print_help_menu,
    print_hotkey_toolbar,
    print_single_tier_dashboard,
)
from .env import load_cascading_env
from .formatting import _stream_output, format_universal_line
from .healthcheck import wait_for_server_healthy
from .ports import (
    ensure_port_free,
    find_next_free_port,
    get_process_name_by_pid,
    is_port_in_use,
    kill_process_on_port,
)
from .sandboxing import (
    _linux_preexec_fn,
    enable_process_sandboxing,
    enable_windows_kill_on_close,
)


def run_single_process(
    cmd: list[str],
    scope: str,
    cwd: Path | None = None,
    service_name: str = "Workspace",
) -> None:
    """Runs a single process with clean signal handling and universal logging."""
    enable_process_sandboxing()
    full_env, _ = load_cascading_env(project_dir=cwd)

    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    preexec = None if sys.platform == "win32" else _linux_preexec_fn

    real_cmd = list(cmd)
    if sys.platform == "win32" and real_cmd:
        bin_name = real_cmd[0].lower()
        if bin_name in ("npm", "npx", "pnpm", "yarn"):
            real_cmd[0] = f"{bin_name}.cmd"

    proc = subprocess.Popen(
        real_cmd,
        cwd=str(cwd) if cwd else None,
        env=full_env,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        creationflags=creationflags,
        preexec_fn=preexec,
    )

    def _on_interrupt(_sig: Any, _frame: Any) -> None:
        sys.stdout.write(f"\n\033[33m[{service_name}]\033[0m Stopping {scope} server...\n")
        sys.stdout.flush()

        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True, check=False)
        else:
            try:
                os.killpg(os.getpgid(proc.pid), signal.SIGTERM)
            except Exception:
                proc.terminate()

        sys.stdout.write(f"\033[32m[{service_name}]\033[0m {scope} stopped cleanly.\n")
        sys.stdout.flush()
        sys.exit(0)

    signal.signal(signal.SIGINT, _on_interrupt)

    try:
        _stream_output(proc.stdout, scope=scope)
        proc.wait()
    except KeyboardInterrupt:
        _on_interrupt(None, None)


def run_dual_supervisor(
    frontend_cmd: list[str],
    backend_cmd: list[str],
    cwd: Path | None = None,
    service_name: str = "Workspace",
    frontend_port: int = 5173,
    backend_port: int = 8000,
    banner_callback: Any = None,
) -> None:
    """Runs frontend and backend concurrently with interactive hotkeys and active healthcheck."""
    enable_process_sandboxing()

    controller = ProcessController(
        frontend_cmd=frontend_cmd,
        backend_cmd=backend_cmd,
        cwd=cwd,
        service_name=service_name,
        frontend_port=frontend_port,
        backend_port=backend_port,
        banner_callback=banner_callback,
    )

    signal.signal(signal.SIGINT, controller.shutdown)

    # 1. Start Backend with Active Healthcheck
    controller.start_backend()

    # 2. Start Frontend
    controller.start_frontend()

    # 3. Start Non-Blocking Keyboard Listener Thread
    t_kb = threading.Thread(target=controller.run_keyboard_listener, daemon=True)
    t_kb.start()

    try:
        while not controller._shutdown_event.is_set():
            time.sleep(0.5)
    except KeyboardInterrupt:
        controller.shutdown(None, None)


__all__ = [
    # Sandboxing
    "enable_process_sandboxing",
    "enable_windows_kill_on_close",
    # Ports
    "ensure_port_free",
    "find_next_free_port",
    "get_process_name_by_pid",
    "is_port_in_use",
    "kill_process_on_port",
    # Healthcheck
    "wait_for_server_healthy",
    # Formatting
    "format_universal_line",
    "_stream_output",
    # Dashboard
    "get_local_lan_ip",
    "print_fullstack_dashboard",
    "print_single_tier_dashboard",
    "print_hotkey_toolbar",
    "print_help_menu",
    # Controller & Entrypoints
    "ProcessController",
    "run_single_process",
    "run_dual_supervisor",
]
