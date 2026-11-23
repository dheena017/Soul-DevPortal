"""
Port Conflict Management & Process Termination Engine (@workspace/runner/internal).
Detects in-use TCP ports, inspects occupying PIDs, and safely frees socket listeners.
"""
from __future__ import annotations

import os
import socket
import subprocess
import sys
import time
from pathlib import Path
from typing import Set

from .installer import (
    BOLD,
    CYAN,
    RED,
    RESET,
    WHITE,
    YELLOW,
    _format_box_lines,
    get_terminal_width,
)


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks if a TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as tcp_socket:
        tcp_socket.settimeout(0.3)
        return tcp_socket.connect_ex((host, port)) == 0


def get_process_name_by_pid(pid: str) -> str:
    """Returns the descriptive process executable name for a given PID."""
    if sys.platform == "win32":
        try:
            res = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
                capture_output=True,
                text=True,
                check=False,
            )
            first_line = res.stdout.strip().splitlines()[0] if res.stdout.strip() else ""
            if first_line:
                return first_line.split(",")[0].strip('"')
        except Exception:
            pass
    else:
        try:
            res = subprocess.run(["ps", "-p", pid, "-o", "comm="], capture_output=True, text=True, check=False)
            if res.stdout.strip():
                return res.stdout.strip()
        except Exception:
            pass

    return f"PID {pid}"


def kill_process_on_port(port: int) -> list[str]:
    """Finds and terminates any process bound to the specified TCP port."""
    terminated: list[str] = []
    current_pid_str = str(os.getpid())

    if sys.platform == "win32":
        try:
            netstat = subprocess.run(["netstat", "-ano", "-p", "tcp"], capture_output=True, text=True, check=False)
            pids: Set[str] = set()
            for line in netstat.stdout.splitlines():
                if f":{port} " in line and "LISTENING" in line:
                    cols = line.strip().split()
                    if len(cols) >= 5 and cols[-1].isdigit():
                        pids.add(cols[-1])

            for pid in pids:
                if pid != "0" and pid != current_pid_str:
                    name = get_process_name_by_pid(pid)
                    subprocess.run(["taskkill", "/F", "/T", "/PID", pid], capture_output=True, check=False)
                    try:
                        wmi = (
                            f"Get-CimInstance Win32_Process | Where-Object {{ $_.ParentProcessId -eq {pid} }} | "
                            f"ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}"
                        )
                        subprocess.run(["powershell", "-NoProfile", "-Command", wmi], capture_output=True, check=False)
                    except Exception:
                        pass
                    terminated.append(f"{name} (PID: {pid})")
        except Exception:
            pass
    else:
        try:
            lsof = subprocess.run(["lsof", "-ti", f"tcp:{port}"], capture_output=True, text=True, check=False)
            pids = [p.strip() for p in lsof.stdout.splitlines() if p.strip().isdigit()]
            for pid in pids:
                if pid != current_pid_str:
                    name = get_process_name_by_pid(pid)
                    subprocess.run(["kill", "-9", pid], capture_output=True, check=False)
                    terminated.append(f"{name} (PID: {pid})")
        except Exception:
            pass

    return terminated


def find_next_free_port(start_port: int, max_attempts: int = 50, host: str = "127.0.0.1") -> int:
    """Finds the next free TCP port starting from start_port."""
    for candidate in range(start_port, start_port + max_attempts):
        if not is_port_in_use(candidate, host=host):
            return candidate
    return start_port


def _render_port_conflict_card(port: int, occupying_info: str, service_name: str) -> None:
    """Renders a structured, rounded port conflict card detailing occupying process and fixes."""
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4
    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    print(file=sys.stderr)
    print(f" {RED}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}", file=sys.stderr)
    title = f" ⚠️   {BOLD}{RED}PORT CONFLICT DETECTED ON PORT {port}{RESET}"
    for l in _format_box_lines(title, inner_width, RED):
        print(l, file=sys.stderr)
    print(f" {RED}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}", file=sys.stderr)

    p_line = f"    Target Port : {CYAN}:{port}{RESET} is currently in use"
    o_line = f"    Occupied By : {BOLD}{WHITE}{occupying_info}{RESET}"
    for l in _format_box_lines(p_line, inner_width, RED):
        print(l, file=sys.stderr)
    for l in _format_box_lines(o_line, inner_width, RED):
        print(l, file=sys.stderr)

    print(f" {RED}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}", file=sys.stderr)
    h1 = f"    {YELLOW}➜ Fix 1 (Auto){RESET} : Pass {CYAN}--kill-port{RESET} to terminate conflicting process"
    h2 = f"    {YELLOW}➜ Fix 2 (Port){RESET} : Pass {CYAN}--client-port <num>{RESET} or {CYAN}--server-port <num>{RESET}"
    h3 = f"    {YELLOW}➜ Fix 3 (Wait){RESET} : Stop the existing process running on :{port}"
    for l in _format_box_lines(h1, inner_width, RED):
        print(l, file=sys.stderr)
    for l in _format_box_lines(h2, inner_width, RED):
        print(l, file=sys.stderr)
    for l in _format_box_lines(h3, inner_width, RED):
        print(l, file=sys.stderr)

    print(f" {RED}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}", file=sys.stderr)
    print(file=sys.stderr)


def _render_backend_crash_card(port: int, exit_code: int, cwd: Path | None) -> None:
    """Renders a structured, rounded diagnostic card when backend process exits prematurely."""
    terminal_width = get_terminal_width(78)
    inner_width = terminal_width - 4
    b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
    b_h, b_ml, b_mr = "─", "├", "┤"

    print()
    print(f" {RED}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}")
    title = f" ✗  {BOLD}{RED}BACKEND PROCESS CRASHED DURING INITIALIZATION{RESET}"
    for l in _format_box_lines(title, inner_width, RED):
        print(l)
    print(f" {RED}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")
    c_line = f"    Exit Status : Process exited with return code {BOLD}{exit_code}{RESET}"
    p_line = f"    Target Port : {CYAN}:{port}{RESET} (never opened socket)"
    d_line = f"    Working Dir : {CYAN}{cwd.name if cwd else 'workspace'}/{RESET}"
    for l in _format_box_lines(c_line, inner_width, RED):
        print(l)
    for l in _format_box_lines(p_line, inner_width, RED):
        print(l)
    for l in _format_box_lines(d_line, inner_width, RED):
        print(l)
    print(f" {RED}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")
    h1 = f"    {YELLOW}➜ Fix 1{RESET}     : Run 'python runner/bin/run-install.py --scope server'"
    h2 = f"    {YELLOW}➜ Fix 2{RESET}     : Check requirements.txt or virtual environment"
    h3 = f"    {YELLOW}➜ Fix 3{RESET}     : Verify backend entrypoint syntax & module imports"
    for l in _format_box_lines(h1, inner_width, RED):
        print(l)
    for l in _format_box_lines(h2, inner_width, RED):
        print(l)
    for l in _format_box_lines(h3, inner_width, RED):
        print(l)
    print(f" {RED}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}")
    print()


def ensure_port_free(
    port: int,
    auto_kill: bool = True,
    service_name: str = "Workspace",
    allow_fallback: bool = False,
) -> int:
    """Ensures a port is ready for binding. Returns port (or fallback if allowed)."""
    if not is_port_in_use(port):
        return port

    if auto_kill:
        sys.stdout.write(f"\033[33m[{service_name} Notice]\033[0m Port {port} occupied. Freeing port...\n")
        sys.stdout.flush()

        terminated = kill_process_on_port(port)
        if terminated:
            sys.stdout.write(f"\033[32m[{service_name} OK]\033[0m Terminated: {', '.join(terminated)}\n")

        time.sleep(1.0)
        if is_port_in_use(port):
            if allow_fallback:
                fallback = find_next_free_port(port + 1)
                sys.stdout.write(f"\033[33m[{service_name} Notice]\033[0m Switching to port {fallback}.\n")
                return fallback
            occupying = "Active Listening Process"
            _render_port_conflict_card(port, occupying, service_name)
            sys.exit(1)
        else:
            sys.stdout.write(f"\033[32m[{service_name} OK]\033[0m Port {port} freed successfully.\n")
            sys.stdout.flush()
    else:
        if allow_fallback:
            fallback = find_next_free_port(port + 1)
            sys.stdout.write(f"\033[33m[{service_name} Notice]\033[0m Switching to port {fallback}.\n")
            return fallback
        occupying = "Active Listening Process"
        _render_port_conflict_card(port, occupying, service_name)
        sys.exit(1)

    return port


__all__ = [
    "ensure_port_free",
    "find_next_free_port",
    "get_process_name_by_pid",
    "is_port_in_use",
    "kill_process_on_port",
    "_render_backend_crash_card",
    "_render_port_conflict_card",
]
