"""
Universal Process & Port Supervisor Component for Workspace.
Handles Windows Job Object kernel binding, port conflict resolution with process inspection,
subprocess output demultiplexing, and dual-process supervisor lifecycle.
"""

from __future__ import annotations

import ctypes
import os
import re
import signal
import socket
import subprocess
import sys
import threading
import time
from ctypes import wintypes
from datetime import datetime
from pathlib import Path

# Enable UTF-8 and ANSI colors on Windows console
if sys.platform == "win32":
    try:
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        h_out = kernel32.GetStdHandle(-11)
        mode = wintypes.DWORD()
        if kernel32.GetConsoleMode(h_out, ctypes.byref(mode)):
            kernel32.SetConsoleMode(h_out, mode.value | 0x0004)
        if hasattr(sys.stdout, "reconfigure"):
            sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass

_JOB_HANDLE = None


def enable_windows_kill_on_close() -> None:
    """Binds subprocesses to a Windows Job Object that automatically kills children if parent exits."""
    global _JOB_HANDLE
    if sys.platform != "win32":
        return

    try:
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        CreateJobObjectW = kernel32.CreateJobObjectW
        CreateJobObjectW.argtypes = (wintypes.LPVOID, wintypes.LPCWSTR)
        CreateJobObjectW.restype = wintypes.HANDLE

        SetInformationJobObject = kernel32.SetInformationJobObject
        SetInformationJobObject.argtypes = (wintypes.HANDLE, ctypes.c_int, wintypes.LPVOID, wintypes.DWORD)
        SetInformationJobObject.restype = wintypes.BOOL

        AssignProcessToJobObject = kernel32.AssignProcessToJobObject
        AssignProcessToJobObject.argtypes = (wintypes.HANDLE, wintypes.HANDLE)
        AssignProcessToJobObject.restype = wintypes.BOOL

        job = CreateJobObjectW(None, None)
        if not job:
            return

        class JOBOBJECT_BASIC_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("PerProcessUserTimeLimit", wintypes.LARGE_INTEGER),
                ("PerJobUserTimeLimit", wintypes.LARGE_INTEGER),
                ("LimitFlags", wintypes.DWORD),
                ("MinimumWorkingSetSize", ctypes.c_size_t),
                ("MaximumWorkingSetSize", ctypes.c_size_t),
                ("ActiveProcessLimit", wintypes.DWORD),
                ("Affinity", ctypes.POINTER(ctypes.c_ulong)),
                ("PriorityClass", wintypes.DWORD),
                ("SchedulingClass", wintypes.DWORD),
            ]

        class IO_COUNTERS(ctypes.Structure):
            _fields_ = [
                ("ReadOperationCount", ctypes.c_ulonglong),
                ("WriteOperationCount", ctypes.c_ulonglong),
                ("OtherOperationCount", ctypes.c_ulonglong),
                ("ReadTransferCount", ctypes.c_ulonglong),
                ("WriteTransferCount", ctypes.c_ulonglong),
                ("OtherTransferCount", ctypes.c_ulonglong),
            ]

        class JOBOBJECT_EXTENDED_LIMIT_INFORMATION(ctypes.Structure):
            _fields_ = [
                ("BasicLimitInformation", JOBOBJECT_BASIC_LIMIT_INFORMATION),
                ("IoInfo", IO_COUNTERS),
                ("ProcessMemoryLimit", ctypes.c_size_t),
                ("JobMemoryLimit", ctypes.c_size_t),
                ("PeakProcessMemoryLimit", ctypes.c_size_t),
                ("PeakJobMemoryLimit", ctypes.c_size_t),
            ]

        JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE = 0x00002000
        JobObjectExtendedLimitInformation = 9

        info = JOBOBJECT_EXTENDED_LIMIT_INFORMATION()
        info.BasicLimitInformation.LimitFlags = JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE
        SetInformationJobObject(job, JobObjectExtendedLimitInformation, ctypes.byref(info), ctypes.sizeof(info))

        GetCurrentProcess = kernel32.GetCurrentProcess
        GetCurrentProcess.restype = wintypes.HANDLE
        AssignProcessToJobObject(job, GetCurrentProcess())

        _JOB_HANDLE = job
    except Exception:
        pass


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks if a TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.5)
        return s.connect_ex((host, port)) == 0


def get_process_name_by_pid(pid: str) -> str:
    """Returns process name for a given PID on Windows."""
    if sys.platform != "win32":
        return f"PID {pid}"
    try:
        res = subprocess.run(["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"], capture_output=True, text=True, check=False)
        first_line = res.stdout.strip().splitlines()[0] if res.stdout.strip() else ""
        if first_line:
            return first_line.split(",")[0].strip('"')
    except Exception:
        pass
    return f"PID {pid}"


def kill_process_on_port(port: int) -> list[str]:
    """Finds and kills any process bound to the specified TCP port on Windows."""
    killed = []
    if sys.platform != "win32":
        return killed

    try:
        res = subprocess.run(
            ["netstat", "-ano", "-p", "tcp"],
            capture_output=True,
            text=True,
            check=False,
        )
        pids = set()
        for line in res.stdout.splitlines():
            if f":{port} " in line and "LISTENING" in line:
                parts = line.strip().split()
                if len(parts) >= 5:
                    pids.add(parts[-1])

        for pid in pids:
            if pid != "0" and pid != str(os.getpid()):
                pname = get_process_name_by_pid(pid)
                subprocess.run(
                    ["taskkill", "/F", "/T", "/PID", pid],
                    capture_output=True,
                    check=False,
                )
                killed.append(f"{pname} (PID: {pid})")
    except Exception:
        pass
    return killed


def find_next_free_port(start_port: int, max_attempts: int = 50, host: str = "127.0.0.1") -> int:
    """Finds the next free TCP port starting from start_port."""
    for p in range(start_port, start_port + max_attempts):
        if not is_port_in_use(p, host=host):
            return p
    return start_port


def ensure_port_free(port: int, auto_kill: bool = True, service_name: str = "Workspace", allow_fallback: bool = False) -> int:
    """Ensures a port is ready for binding. Returns the port (or alternative free port if fallback is allowed)."""
    if is_port_in_use(port):
        if auto_kill:
            sys.stdout.write(f"\033[33m[{service_name} Notice]\033[0m Port {port} is occupied. Scanning processes...\n")
            sys.stdout.flush()
            killed = kill_process_on_port(port)
            if killed:
                sys.stdout.write(f"\033[32m[{service_name} OK]\033[0m Terminated: {', '.join(killed)}\n")
            time.sleep(1.0)
            if is_port_in_use(port):
                if allow_fallback:
                    next_p = find_next_free_port(port + 1)
                    sys.stdout.write(f"\033[33m[{service_name} Notice]\033[0m Port {port} occupied. Auto-switching to port {next_p}.\n")
                    return next_p
                sys.stderr.write(f"\033[31m[{service_name} Error]\033[0m Could not free port {port}. Please run terminal as Administrator.\n")
                sys.exit(1)
            else:
                sys.stdout.write(f"\033[32m[{service_name} OK]\033[0m Port {port} freed successfully.\n")
                sys.stdout.flush()
        else:
            if allow_fallback:
                next_p = find_next_free_port(port + 1)
                sys.stdout.write(f"\033[33m[{service_name} Notice]\033[0m Port {port} in use. Switching to port {next_p}.\n")
                return next_p
            sys.stderr.write(f"\033[31m[{service_name} Error]\033[0m Port {port} is occupied. Run with --kill-port.\n")
            sys.exit(1)
    return port


def wait_for_server_healthy(port: int, timeout: float = 10.0, host: str = "127.0.0.1") -> bool:
    """Polls a TCP port until it begins accepting connections or times out."""
    start = time.perf_counter()
    while time.perf_counter() - start < timeout:
        if is_port_in_use(port, host=host):
            return True
        time.sleep(0.2)
    return False


def format_universal_line(scope: str, level: str, module: str, message: str) -> str:
    """Renders a single line conforming to the 5-column universal schema."""
    now = datetime.now().strftime("%H:%M:%S")
    col_time = f"\033[90m[{now}]\033[0m"

    color_scope = "\033[96m" if "FRONT" in scope.upper() else "\033[92m" if "BACK" in scope.upper() else "\033[95m"
    col_scope = f"{color_scope}[{scope.ljust(8)}]\033[0m"

    badge_map = {
        "DEBUG": "\033[100m\033[97m\033[1m DEBUG \033[0m",
        "INFO": "\033[44m\033[97m\033[1m  INFO \033[0m",
        "ACTION": "\033[45m\033[97m\033[1m ACTION\033[0m",
        "WARN": "\033[43m\033[30m\033[1m  WARN \033[0m",
        "ERROR": "\033[41m\033[97m\033[1m ERROR \033[0m",
    }
    col_badge = badge_map.get(level.upper(), f"[{level:<7}]")
    col_module = f"\033[36m[{module[:14]:<14}]\033[0m"

    return f"{col_time} {col_scope} {col_badge} {col_module} {message}"


def _stream_output(stream, scope: str):
    """Demultiplexes and prints stdout/stderr lines with universal 5-column formatting."""
    for line in iter(stream.readline, ""):
        clean = line.rstrip()
        if not clean:
            continue

        # Intercept HMR and client forwarded logs
        tag_match = re.search(r"\[[A-Za-z0-9_-]+_LOG\]", clean)
        if tag_match:
            tag_name = tag_match.group(0)
            payload = clean.split(tag_name, 1)[1].strip()
            parts = payload.split("|", 2)
            if len(parts) == 3:
                lvl, mod, msg = parts[0].strip(), parts[1].strip(), parts[2].strip()
                print(format_universal_line(scope, lvl, mod, msg), flush=True)
                continue
            elif len(parts) == 2:
                lvl, msg = parts[0].strip(), parts[1].strip()
                print(format_universal_line(scope, lvl, "CLIENT", msg), flush=True)
                continue
        else:
            # Pass through pre-formatted ANSI lines directly
            if clean.startswith("\033[90m[") or clean.startswith("╔") or clean.startswith("║") or clean.startswith("╚"):
                print(clean, flush=True)
                continue

            # Skip Console Ninja noise
            if "Console Ninja" in clean:
                continue

            # Format raw unexpected lines into universal INFO schema
            print(format_universal_line(scope, "INFO", "SYSTEM", clean), flush=True)


def run_single_process(cmd: list[str], scope: str, cwd: Path | None = None, service_name: str = "Workspace") -> None:
    """Runs a single process with clean signal handling and universal logging."""
    enable_windows_kill_on_close()

    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    proc_env = os.environ.copy()
    pkg_dir = str(Path(__file__).resolve().parent)
    current_pp = proc_env.get("PYTHONPATH", "")
    if pkg_dir not in current_pp:
        proc_env["PYTHONPATH"] = f"{pkg_dir}{os.pathsep}{current_pp}".strip(os.pathsep)

    proc = subprocess.Popen(
        cmd,
        cwd=str(cwd) if cwd else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        creationflags=creationflags,
        env=proc_env,
    )

    def handle_sigint(_sig, _frame):
        sys.stdout.write(f"\n\033[33m[{service_name}]\033[0m Stopping {scope} server...\n")
        sys.stdout.flush()
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(proc.pid)], capture_output=True, check=False)
        else:
            proc.terminate()
        sys.stdout.write(f"\033[32m[{service_name}]\033[0m {scope} stopped cleanly.\n")
        sys.stdout.flush()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_sigint)

    try:
        _stream_output(proc.stdout, scope=scope)
        proc.wait()
    except KeyboardInterrupt:
        handle_sigint(None, None)


def run_dual_supervisor(
    frontend_cmd: list[str],
    backend_cmd: list[str],
    cwd: Path | None = None,
    service_name: str = "Workspace",
) -> None:
    """Runs frontend and backend concurrently with unified stream output and synchronized shutdown."""
    enable_windows_kill_on_close()

    creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
    proc_env = os.environ.copy()
    pkg_dir = str(Path(__file__).resolve().parent)
    current_pp = proc_env.get("PYTHONPATH", "")
    if pkg_dir not in current_pp:
        proc_env["PYTHONPATH"] = f"{pkg_dir}{os.pathsep}{current_pp}".strip(os.pathsep)

    p_backend = subprocess.Popen(
        backend_cmd,
        cwd=str(cwd) if cwd else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        creationflags=creationflags,
        env=proc_env,
    )

    time.sleep(1.2)

    p_frontend = subprocess.Popen(
        frontend_cmd,
        cwd=str(cwd) if cwd else None,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
        encoding="utf-8",
        errors="replace",
        bufsize=1,
        creationflags=creationflags,
    )

    t_be = threading.Thread(target=_stream_output, args=(p_backend.stdout, "BACKEND "), daemon=True)
    t_fe = threading.Thread(target=_stream_output, args=(p_frontend.stdout, "FRONTEND"), daemon=True)

    t_be.start()
    t_fe.start()

    def handle_shutdown(_sig, _frame):
        sys.stdout.write(f"\n\033[33m[{service_name}]\033[0m Stopping fullstack services...\n")
        sys.stdout.flush()
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(p_frontend.pid)], capture_output=True, check=False)
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(p_backend.pid)], capture_output=True, check=False)
        else:
            p_frontend.terminate()
            p_backend.terminate()
        sys.stdout.write(f"\033[32m[{service_name}] Fullstack environment stopped cleanly. Goodbye!\033[0m\n")
        sys.stdout.flush()
        sys.exit(0)

    signal.signal(signal.SIGINT, handle_shutdown)

    try:
        while p_backend.poll() is None and p_frontend.poll() is None:
            time.sleep(0.5)
    except KeyboardInterrupt:
        handle_shutdown(None, None)
