"""
Universal Process & Port Supervisor Component for Workspace (@workspace/runner).
Handles cross-platform kernel binding (Windows Job Objects & POSIX process groups),
deterministic port conflict resolution, active TCP/HTTP healthcheck probing,
demultiplexed universal logging, and interactive hotkey control.
"""

from __future__ import annotations

import ctypes
import os
import re
import select
import signal
import socket
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from datetime import datetime
from pathlib import Path
from typing import Any

from workspace_runner.env import get_env_summary, load_cascading_env
from workspace_runner.stats import format_process_stats_table

# Windows console ANSI support
if sys.platform == "win32":
    try:
        from ctypes import wintypes
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
        from ctypes import wintypes
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


def _linux_preexec_fn():
    """Sets new process session and registers Linux PR_SET_PDEATHSIG so children terminate on parent death."""
    try:
        os.setsid()
    except Exception:
        pass
    if sys.platform.startswith("linux"):
        try:
            # PR_SET_PDEATHSIG = 1, signal.SIGTERM = 15
            ctypes.CDLL(None).prctl(1, signal.SIGTERM)
        except Exception:
            pass


def enable_process_sandboxing() -> None:
    """Enables kernel-level process sandboxing across Windows and POSIX."""
    if sys.platform == "win32":
        enable_windows_kill_on_close()


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Checks if a TCP port is currently occupied."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex((host, port)) == 0


def get_process_name_by_pid(pid: str) -> str:
    """Returns process name for a given PID."""
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
            comm = res.stdout.strip()
            if comm:
                return comm
        except Exception:
            pass
    return f"PID {pid}"


def kill_process_on_port(port: int) -> list[str]:
    """Finds and terminates any process bound to the specified TCP port across OS platforms."""
    killed: list[str] = []

    if sys.platform == "win32":
        try:
            res = subprocess.run(
                ["netstat", "-ano", "-p", "tcp"],
                capture_output=True,
                text=True,
                check=False,
            )
            pids: set[str] = set()
            for line in res.stdout.splitlines():
                if f":{port} " in line and "LISTENING" in line:
                    parts = line.strip().split()
                    if len(parts) >= 5 and parts[-1].isdigit():
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
    else:
        # POSIX (Linux / macOS)
        try:
            res = subprocess.run(["lsof", "-ti", f"tcp:{port}"], capture_output=True, text=True, check=False)
            pids = [p.strip() for p in res.stdout.splitlines() if p.strip().isdigit()]
            for pid in pids:
                if pid != str(os.getpid()):
                    pname = get_process_name_by_pid(pid)
                    subprocess.run(["kill", "-9", pid], capture_output=True, check=False)
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


def wait_for_server_healthy(
    port: int,
    host: str = "127.0.0.1",
    health_endpoint: str | None = None,
    timeout: float = 15.0,
    interval: float = 0.1,
) -> tuple[bool, float]:
    """
    Actively probes TCP socket and optional HTTP endpoint until accepting connections.
    Returns: (is_healthy, elapsed_seconds)
    """
    start = time.perf_counter()
    while time.perf_counter() - start < timeout:
        if is_port_in_use(port, host=host):
            # Port is listening; probe HTTP if endpoint specified
            if health_endpoint:
                try:
                    url = f"http://{host}:{port}{health_endpoint}"
                    req = urllib.request.Request(url, headers={"User-Agent": "Workspace-Healthcheck/1.0"})
                    with urllib.request.urlopen(req, timeout=1.0) as resp:
                        if 200 <= resp.status < 500:
                            return True, round(time.perf_counter() - start, 3)
                except Exception:
                    time.sleep(interval)
                    continue
            return True, round(time.perf_counter() - start, 3)
        time.sleep(interval)
    return False, round(time.perf_counter() - start, 3)


def format_universal_line(scope: str, level: str, module: str, message: str) -> str:
    """Renders a single line conforming to the 5-column universal schema."""
    now = datetime.now().strftime("%H:%M:%S")
    col_time = f"\033[90m[{now}]\033[0m"

    color_scope = "\033[96m" if "FRONT" in scope.upper() else "\033[92m" if "BACK" in scope.upper() else "\033[95m"
    col_scope = f"{color_scope}[{scope.ljust(8)}]\033[0m"

    badge_map = {
        "DEBUG": "\033[100m\033[97m\033[1m DEBUG \033[0m",
        "INFO": "\033[44m\033[97m\033[1m  INFO \033[0m",
        "OK": "\033[42m\033[97m\033[1m   OK  \033[0m",
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
            if clean.startswith("\033[90m[") or clean.startswith("╔") or clean.startswith("║") or clean.startswith("╚") or clean.startswith("┌") or clean.startswith("│") or clean.startswith("└"):
                print(clean, flush=True)
                continue

            if "Console Ninja" in clean:
                continue

            print(format_universal_line(scope, "INFO", "SYSTEM", clean), flush=True)


def print_hotkey_toolbar():
    """Renders the interactive hotkey shortcut toolbar."""
    toolbar = (
        " \033[1m\033[36m[r]\033[0m Restart BE   "
        "\033[1m\033[36m[f]\033[0m Restart FE   "
        "\033[1m\033[36m[a]\033[0m Reload All   "
        "\033[1m\033[36m[o]\033[0m Open UI   "
        "\033[1m\033[36m[b]\033[0m API Docs\n"
        " \033[1m\033[36m[c]\033[0m Clear        "
        "\033[1m\033[36m[p]\033[0m Stats        "
        "\033[1m\033[36m[e]\033[0m Env Info     "
        "\033[1m\033[36m[h]\033[0m Help      "
        "\033[1m\033[31m[q]\033[0m Quit\n"
        "\033[90m────────────────────────────────────────────────────────────────────────────────\033[0m"
    )
    print(toolbar, flush=True)


def print_help_menu():
    """Renders a clean ASCII hotkey reference guide."""
    help_box = (
        "\n\033[90m┌──────────────────────────────────────────────────────────────────────────────┐\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[33mINTERACTIVE RUNNER HOTKEYS REFERENCE\033[0m                                        \033[90m│\033[0m\n"
        "\033[90m├───────┬──────────────────────┬───────────────────────────────────────────────┤\033[0m\n"
        "\033[90m│\033[0m \033[1mKEY   \033[0m\033[90m│\033[0m \033[1mACTION               \033[0m\033[90m│\033[0m \033[1mDESCRIPTION                                   \033[0m\033[90m│\033[0m\n"
        "\033[90m├───────┼──────────────────────┼───────────────────────────────────────────────┤\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36mr\033[0m    \033[90m│\033[0m Restart Backend       \033[90m│\033[0m Re-spawns API server + runs healthcheck        \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36mf\033[0m    \033[90m│\033[0m Restart Frontend      \033[90m│\033[0m Re-spawns Vite / Next.js client dev server     \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36ma\033[0m    \033[90m│\033[0m Reload All Services   \033[90m│\033[0m Fullstack restart in dependency order          \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36mo\033[0m    \033[90m│\033[0m Open UI in Browser    \033[90m│\033[0m Launches frontend URL in default browser       \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36mb\033[0m    \033[90m│\033[0m Open API Swagger Docs \033[90m│\033[0m Launches backend Swagger docs in browser       \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36mc\033[0m    \033[90m│\033[0m Clear Screen          \033[90m│\033[0m Clears terminal and redraws header banner      \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36mp\033[0m    \033[90m│\033[0m Process Statistics    \033[90m│\033[0m Displays live PIDs, memory RSS, and uptimes    \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36me\033[0m    \033[90m│\033[0m Environment Summary  \033[90m│\033[0m Lists active .env files with secrets redacted  \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[36mh\033[0m    \033[90m│\033[0m Toggle Help Menu      \033[90m│\033[0m Displays this hotkey cheatsheet overlay        \033[90m│\033[0m\n"
        "\033[90m│\033[0m  \033[1m\033[31mq\033[0m    \033[90m│\033[0m Graceful Shutdown     \033[90m│\033[0m Stops all process groups and exits cleanly     \033[90m│\033[0m\n"
        "\033[90m└───────┴──────────────────────┴───────────────────────────────────────────────┘\033[0m\n"
    )
    print(help_box, flush=True)


class ProcessController:
    """Central lifecycle supervisor and interactive hotkey controller."""

    def __init__(
        self,
        frontend_cmd: list[str] | None,
        backend_cmd: list[str] | None,
        cwd: Path | None = None,
        service_name: str = "Workspace",
        frontend_port: int = 5173,
        backend_port: int = 8000,
        banner_callback: Any = None,
    ):
        self.frontend_cmd = frontend_cmd
        self.backend_cmd = backend_cmd
        self.cwd = cwd
        self.service_name = service_name
        self.frontend_port = frontend_port
        self.backend_port = backend_port
        self.banner_callback = banner_callback

        # Load cascading environment
        self.env, self.loaded_env_files = load_cascading_env(project_dir=cwd)

        self.p_backend: subprocess.Popen | None = None
        self.p_frontend: subprocess.Popen | None = None
        self.be_start_time: float = 0.0
        self.fe_start_time: float = 0.0

        self._shutdown_event = threading.Event()
        self._lock = threading.Lock()

    def _spawn_process(self, cmd: list[str]) -> subprocess.Popen:
        """Spawns child process with cross-platform session isolation and merged env."""
        creationflags = subprocess.CREATE_NEW_PROCESS_GROUP if sys.platform == "win32" else 0
        preexec = None if sys.platform == "win32" else _linux_preexec_fn

        real_cmd = list(cmd)
        if sys.platform == "win32" and real_cmd:
            bin_name = real_cmd[0].lower()
            if bin_name in ("npm", "npx", "pnpm", "yarn"):
                real_cmd[0] = f"{bin_name}.cmd"

        return subprocess.Popen(
            real_cmd,
            cwd=str(self.cwd) if self.cwd else None,
            env=self.env,
            stdout=subprocess.PIPE,
            stderr=subprocess.STDOUT,
            text=True,
            encoding="utf-8",
            errors="replace",
            bufsize=1,
            creationflags=creationflags,
            preexec_fn=preexec,
        )

    def _terminate_process(self, proc: subprocess.Popen | None, port: int | None = None):
        """Cross-platform graceful process termination with port cleanup."""
        if not proc or proc.poll() is not None:
            if port:
                kill_process_on_port(port)
            return

        pid = proc.pid
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True, check=False)
        else:
            try:
                os.killpg(os.getpgid(pid), signal.SIGTERM)
                time.sleep(0.5)
                if proc.poll() is None:
                    os.killpg(os.getpgid(pid), signal.SIGKILL)
            except Exception:
                pass

        if port:
            kill_process_on_port(port)

    def start_backend(self) -> bool:
        """Spawns backend process and monitors active healthcheck."""
        if not self.backend_cmd:
            return True

        with self._lock:
            self._terminate_process(self.p_backend, self.backend_port)
            ensure_port_free(self.backend_port, auto_kill=True, service_name=self.service_name)

            self.p_backend = self._spawn_process(self.backend_cmd)
            self.be_start_time = time.time()

            t_be = threading.Thread(target=_stream_output, args=(self.p_backend.stdout, "BACKEND "), daemon=True)
            t_be.start()

        # Active healthcheck polling
        healthy, elapsed = wait_for_server_healthy(self.backend_port, timeout=12.0)
        if healthy:
            print(
                format_universal_line(
                    "SYSTEM  ", "OK", "HEALTHCHECK",
                    f"Backend healthy on http://127.0.0.1:{self.backend_port} (connected in {int(elapsed * 1000)}ms)"
                ),
                flush=True,
            )
        else:
            print(
                format_universal_line(
                    "SYSTEM  ", "WARN", "HEALTHCHECK",
                    f"Backend did not respond on port {self.backend_port} within 12s, proceeding..."
                ),
                flush=True,
            )
        return healthy

    def start_frontend(self):
        """Spawns frontend process."""
        if not self.frontend_cmd:
            return

        with self._lock:
            self._terminate_process(self.p_frontend, self.frontend_port)
            ensure_port_free(self.frontend_port, auto_kill=True, service_name=self.service_name)

            self.p_frontend = self._spawn_process(self.frontend_cmd)
            self.fe_start_time = time.time()

            t_fe = threading.Thread(target=_stream_output, args=(self.p_frontend.stdout, "FRONTEND"), daemon=True)
            t_fe.start()

    def restart_backend(self):
        """Hotkey 'r' handler: Restarts backend server cleanly."""
        print(format_universal_line("SYSTEM  ", "ACTION", "SUPERVISOR", f"Restarting backend server (:{self.backend_port})..."), flush=True)
        self.start_backend()

    def restart_frontend(self):
        """Hotkey 'f' handler: Restarts frontend dev server cleanly."""
        print(format_universal_line("SYSTEM  ", "ACTION", "SUPERVISOR", f"Restarting frontend dev server (:{self.frontend_port})..."), flush=True)
        self.start_frontend()

    def restart_all(self):
        """Hotkey 'a' handler: Fullstack reload in dependency order."""
        print(format_universal_line("SYSTEM  ", "ACTION", "SUPERVISOR", "Reloading fullstack environment..."), flush=True)
        self.start_backend()
        self.start_frontend()

    def open_frontend(self):
        """Hotkey 'o' handler: Launches UI in default browser."""
        url = f"http://localhost:{self.frontend_port}"
        print(format_universal_line("SYSTEM  ", "ACTION", "BROWSER", f"Opening {url}..."), flush=True)
        webbrowser.open(url)

    def open_backend_docs(self):
        """Hotkey 'b' handler: Launches Swagger docs in browser."""
        url = f"http://localhost:{self.backend_port}/docs"
        print(format_universal_line("SYSTEM  ", "ACTION", "BROWSER", f"Opening {url}..."), flush=True)
        webbrowser.open(url)

    def clear_screen(self):
        """Hotkey 'c' handler: Clears screen and redraws header banner and toolbar."""
        os.system("cls" if sys.platform == "win32" else "clear")
        if self.banner_callback:
            self.banner_callback()
        print_hotkey_toolbar()

    def show_stats(self):
        """Hotkey 'p' handler: Renders process metrics ASCII table."""
        procs = []
        if self.p_backend:
            procs.append({
                "name": "Backend API",
                "scope": "BACKEND",
                "pid": self.p_backend.pid if self.p_backend.poll() is None else None,
                "port": self.backend_port,
                "status": "RUNNING" if self.p_backend.poll() is None else "EXITED",
                "start_time": self.be_start_time,
            })
        if self.p_frontend:
            procs.append({
                "name": "Frontend UI",
                "scope": "FRONTEND",
                "pid": self.p_frontend.pid if self.p_frontend.poll() is None else None,
                "port": self.frontend_port,
                "status": "RUNNING" if self.p_frontend.poll() is None else "EXITED",
                "start_time": self.fe_start_time,
            })
        print("\n" + format_process_stats_table(procs) + "\n", flush=True)

    def show_env_info(self):
        """Hotkey 'e' handler: Renders summary of loaded environment files with secret redaction."""
        summary = get_env_summary(project_dir=self.cwd)
        lines = [
            "\n\033[90m┌──────────────────────────────────────────────────────────────────────────────┐\033[0m",
            "\033[90m│\033[0m  \033[1m\033[35mLOADED ENVIRONMENT HIERARCHY\033[0m                                                \033[90m│\033[0m",
            "\033[90m├──────────────────────────────────────────────────────────────────────────────┤\033[0m",
        ]
        if summary["loaded_files"]:
            lines.append("\033[90m│\033[0m \033[1mCascading Sources (Priority Order):\033[0m                                          \033[90m│\033[0m")
            for idx, f in enumerate(summary["loaded_files"], 1):
                p_rel = f.replace(str(Path.cwd()), ".").replace("\\", "/")
                lines.append(f"\033[90m│\033[0m   {idx}. {p_rel:<72} \033[90m│\033[0m")
        else:
            lines.append("\033[90m│\033[0m  No local .env files detected. Running on system environment.                \033[90m│\033[0m")

        lines.append("\033[90m├──────────────────────────────────────────────────────────────────────────────┤\033[0m")
        lines.append(f"\033[90m│\033[0m  Total Project Variables: {summary['total_variables']:<51} \033[90m│\033[0m")

        if summary["variables"]:
            lines.append("\033[90m├──────────────────────────────┬───────────────────────────────────────────────┤\033[0m")
            lines.append("\033[90m│\033[0m \033[1mVARIABLE                     \033[0m\033[90m│\033[0m \033[1mVALUE (SECRETS REDACTED)                      \033[0m\033[90m│\033[0m")
            lines.append("\033[90m├──────────────────────────────┼───────────────────────────────────────────────┤\033[0m")
            for k, v in sorted(summary["variables"].items()):
                k_str = k[:28].ljust(28)
                v_str = str(v)[:45].ljust(45)
                lines.append(f"\033[90m│\033[0m {k_str} \033[90m│\033[0m {v_str} \033[90m│\033[0m")

        lines.append("\033[90m└──────────────────────────────┴───────────────────────────────────────────────┘\033[0m\n")
        print("\n".join(lines), flush=True)

    def shutdown(self, _sig=None, _frame=None):
        """Coordinates graceful shutdown across all child processes and process groups."""
        if self._shutdown_event.is_set():
            return
        self._shutdown_event.set()

        sys.stdout.write(f"\n\033[33m[{self.service_name}]\033[0m Stopping fullstack environment...\n")
        sys.stdout.flush()

        with self._lock:
            self._terminate_process(self.p_frontend, self.frontend_port)
            self._terminate_process(self.p_backend, self.backend_port)

        sys.stdout.write(f"\033[32m[{self.service_name}] Fullstack environment stopped cleanly. Goodbye!\033[0m\n")
        sys.stdout.flush()
        sys.exit(0)

    def run_keyboard_listener(self):
        """Asynchronous non-blocking keyboard listener thread for interactive hotkeys."""
        if not sys.stdin.isatty():
            return

        if sys.platform == "win32":
            import msvcrt
            while not self._shutdown_event.is_set():
                if msvcrt.kbhit():
                    ch = msvcrt.getch()
                    try:
                        key = ch.decode("utf-8", errors="ignore").lower()
                    except Exception:
                        continue
                    self._dispatch_hotkey(key)
                time.sleep(0.08)
        else:
            # POSIX non-blocking raw terminal input
            try:
                import termios
                import tty
                fd = sys.stdin.fileno()
                old_settings = termios.tcgetattr(fd)
                tty.setcbreak(fd)
                try:
                    while not self._shutdown_event.is_set():
                        r, _, _ = select.select([sys.stdin], [], [], 0.1)
                        if r:
                            key = sys.stdin.read(1).lower()
                            self._dispatch_hotkey(key)
                finally:
                    termios.tcsetattr(fd, termios.TCSADRAIN, old_settings)
            except Exception:
                pass

    def _dispatch_hotkey(self, key: str):
        """Routes recognized single keypresses to controller actions."""
        if key == "r":
            self.restart_backend()
        elif key == "f":
            self.restart_frontend()
        elif key == "a":
            self.restart_all()
        elif key == "o":
            self.open_frontend()
        elif key == "b":
            self.open_backend_docs()
        elif key == "c":
            self.clear_screen()
        elif key == "p":
            self.show_stats()
        elif key == "e":
            self.show_env_info()
        elif key == "h":
            print_help_menu()
        elif key in ("q", "\x03"):  # 'q' or Ctrl+C
            self.shutdown()


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

    def handle_sigint(_sig, _frame):
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

    # 3. Print Interactive Hotkey Toolbar
    print_hotkey_toolbar()

    # 4. Start Non-Blocking Keyboard Listener Thread
    t_kb = threading.Thread(target=controller.run_keyboard_listener, daemon=True)
    t_kb.start()

    try:
        while not controller._shutdown_event.is_set():
            time.sleep(0.5)
    except KeyboardInterrupt:
        controller.shutdown(None, None)
