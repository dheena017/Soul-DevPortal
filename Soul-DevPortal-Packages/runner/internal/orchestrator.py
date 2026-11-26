"""
Master Multi-App Supervisor & Process Orchestrator (@workspace/runner/internal).
Manages concurrent execution, live port polling, process sandboxing,
streaming log multiplexing, and Windows Job Object cleanup for all monorepo applications.
"""

from __future__ import annotations

import ctypes
import io
import json
import os
import shutil
import signal
import socket
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path
from typing import Dict, List, Optional, Tuple

# Enable Windows Virtual Terminal Processing for ANSI colors and line clears
if sys.platform == "win32":
    try:
        kernel32 = ctypes.windll.kernel32
        hStdOut = kernel32.GetStdHandle(-11)
        mode = ctypes.c_ulong()
        if kernel32.GetConsoleMode(hStdOut, ctypes.byref(mode)):
            kernel32.SetConsoleMode(hStdOut, mode.value | 0x0004)
    except Exception:
        pass

# ANSI terminal color constants
CLR_RESET = "\033[0m"
CLR_BOLD = "\033[1m"
CLR_CYAN = "\033[36m"
CLR_GREEN = "\033[32m"
CLR_YELLOW = "\033[33m"
CLR_BLUE = "\033[34m"
CLR_MAGENTA = "\033[35m"
CLR_RED = "\033[31m"
CLR_DIM = "\033[2m"

PROJECT_COLORS = [
    "\033[36m",  # Cyan
    "\033[32m",  # Green
    "\033[33m",  # Yellow
    "\033[34m",  # Blue
    "\033[35m",  # Magenta
    "\033[96m",  # Bright Cyan
    "\033[92m",  # Bright Green
    "\033[93m",  # Bright Yellow
    "\033[95m",  # Bright Magenta
]


def get_lan_ip() -> str:
    """Discovers local network IPv4 address for mobile/LAN testing."""
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as s:
            s.connect(("8.8.8.8", 80))
            return s.getsockname()[0]
    except Exception:
        return "127.0.0.1"


def is_port_listening(port: int, host: str = "127.0.0.1", timeout: float = 0.25) -> bool:
    """Checks if a TCP port is actively listening."""
    if not port:
        return False
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            s.settimeout(timeout)
            return s.connect_ex((host, port)) == 0
    except Exception:
        return False


def load_projects_manifest(workspace_root: Path) -> Dict[str, dict]:
    """Loads authoritative projects.json manifest from monorepo root."""
    manifest_path = workspace_root / "projects.json"
    if not manifest_path.is_file():
        sys.stderr.write(f"{CLR_RED}[Error]{CLR_RESET} projects.json not found at {manifest_path}\n")
        sys.exit(1)
    with open(manifest_path, "r", encoding="utf-8") as f:
        return json.load(f)


def kill_process_on_port(port: int) -> List[str]:
    """Finds and forcefully terminates any process listening on the given port."""
    if not port:
        return []

    try:
        from .supervisor import kill_process_on_port as _sup_kill
        return _sup_kill(port)
    except Exception:
        pass

    killed: List[str] = []
    if sys.platform == "win32":
        try:
            cmd = f'netstat -ano | findstr /R /C:":{port} "'
            out = subprocess.check_output(cmd, shell=True, stderr=subprocess.DEVNULL).decode()
            pids = set()
            for line in out.strip().splitlines():
                parts = line.split()
                if len(parts) >= 5 and "LISTENING" in line.upper():
                    pids.add(parts[-1])
            current_pid = str(os.getpid())
            for pid in pids:
                if pid and pid != "0" and pid != current_pid:
                    subprocess.run(f"taskkill /F /T /PID {pid}", shell=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
                    try:
                        wmi_cmd = f"Get-CimInstance Win32_Process | Where-Object {{ $_.ParentProcessId -eq {pid} }} | ForEach-Object {{ Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }}"
                        subprocess.run(["powershell", "-NoProfile", "-Command", wmi_cmd], capture_output=True, check=False)
                    except Exception:
                        pass
                    killed.append(f"PID:{pid}")
        except Exception:
            pass
    else:
        try:
            out = subprocess.check_output(["lsof", "-t", f"-i:{port}"], stderr=subprocess.DEVNULL).decode()
            for pid in out.strip().splitlines():
                if pid and int(pid) != os.getpid():
                    os.kill(int(pid), signal.SIGKILL)
                    killed.append(f"PID:{pid}")
        except Exception:
            pass
    return killed


def print_master_banner(projects: Dict[str, dict], include_portal: bool, lan_ip: str):
    """Renders the master orchestration startup dashboard (sized to 82 cols to prevent wrapping)."""
    w = 82
    top = f"{CLR_CYAN}╔{'═' * w}╗{CLR_RESET}"
    mid = f"{CLR_CYAN}╠{'═' * w}╣{CLR_RESET}"
    sep = f"{CLR_DIM}╟{'─' * w}╢{CLR_RESET}"
    bot = f"{CLR_CYAN}╚{'═' * w}╝{CLR_RESET}"
    v = f"{CLR_CYAN}║{CLR_RESET}"

    header_title = "  🚀  SOUL MONOREPO MASTER SUPERVISOR — ALL SERVICES (`dev:all`)"
    sub_title = f"  LAN Host: http://{lan_ip}:PORT (Mobile/LAN Ready)"

    print(f"\n{top}")
    print(f"{v}{CLR_BOLD}{CLR_CYAN}{header_title:<{w}}{CLR_RESET}{v}")
    print(f"{v}{CLR_DIM}{sub_title:<{w}}{CLR_RESET}{v}")
    print(mid)

    tbl_header = f"  {'PROJECT':<26} {'CLIENT URL':<24} {'SERVER URL':<24}"
    print(f"{v}{CLR_BOLD}{tbl_header:<{w}}{CLR_RESET}{v}")
    print(sep)

    for idx, (pid, spec) in enumerate(projects.items()):
        color = PROJECT_COLORS[idx % len(PROJECT_COLORS)]
        fe_port = spec.get("frontend_port")
        be_port = spec.get("backend_port")
        fe_url = f"http://localhost:{fe_port}" if fe_port else "N/A"
        be_url = f"http://127.0.0.1:{be_port}" if be_port else "N/A"

        row = f"  {color}{pid:<26}{CLR_RESET} {fe_url:<24} {be_url:<24}"
        raw_row = f"  {pid:<26} {fe_url:<24} {be_url:<24}"
        pad = max(0, w - len(raw_row))
        print(f"{v}{row}{' ' * pad}{v}")

    if include_portal:
        portal_row = f"  {CLR_MAGENTA}{'devportal (Hub)':<26}{CLR_RESET} {'http://localhost:5181':<24} {'http://127.0.0.1:8008':<24}"
        raw_portal = f"  {'devportal (Hub)':<26} {'http://localhost:5181':<24} {'http://127.0.0.1:8008':<24}"
        pad = max(0, w - len(raw_portal))
        print(f"{v}{portal_row}{' ' * pad}{v}")

    print(bot + "\n")


def run_master_orchestrator(
    workspace_root: Path,
    registry: Dict[str, dict],
    kill_port: bool = True,
    with_portal: bool = True,
    client_only: bool = False,
    server_only: bool = False,
    auto_open: bool = True,
    target_open_url: Optional[str] = None,
    verbose: bool = False,
):
    """Executes the complete multi-process supervision and port polling lifecycle."""
    lan_ip = get_lan_ip()
    print_master_banner(registry, with_portal, lan_ip)

    running_processes: List[Tuple[str, subprocess.Popen]] = []
    log_files: List[io.TextIOWrapper] = []

    logs_dir = workspace_root / "logs" / "services"
    if not verbose:
        logs_dir.mkdir(parents=True, exist_ok=True)

    _shutdown_lock = threading.Lock()
    _shutdown_initiated = False
    tail_readers: Dict[str, Tuple[io.TextIOWrapper, str]] = {}

    def shutdown_all(*_):
        nonlocal _shutdown_initiated
        with _shutdown_lock:
            if _shutdown_initiated:
                return
            _shutdown_initiated = True

        print(f"\n\n{CLR_YELLOW}⚠️  Stopping all micro-applications and DevPortal Hub...{CLR_RESET}", flush=True)

        for f, _ in tail_readers.values():
            try:
                f.close()
            except Exception:
                pass

        if sys.platform == "win32":
            active_pids = []
            for _, proc in running_processes:
                try:
                    if proc.poll() is None:
                        active_pids.append(str(proc.pid))
                except Exception:
                    pass
            if active_pids:
                pid_args = " ".join(f"/PID {pid}" for pid in active_pids)
                subprocess.run(
                    f"taskkill /F /T {pid_args}",
                    shell=True,
                    stdout=subprocess.DEVNULL,
                    stderr=subprocess.DEVNULL,
                )
        else:
            for _, proc in running_processes:
                try:
                    proc.terminate()
                except Exception:
                    pass

        for lf in log_files:
            try:
                lf.close()
            except Exception:
                pass

        all_ports = set()
        for spec in registry.values():
            if spec.get("frontend_port"):
                all_ports.add(spec["frontend_port"])
            if spec.get("backend_port"):
                all_ports.add(spec["backend_port"])
        if with_portal:
            all_ports.update([5181, 8008])

        for pt in sorted(all_ports):
            if is_port_listening(pt):
                kill_process_on_port(pt)

        print(f"{CLR_GREEN}✔ All micro-applications safely terminated.{CLR_RESET}\n", flush=True)
        os._exit(0)

    signal.signal(signal.SIGINT, shutdown_all)
    signal.signal(signal.SIGTERM, shutdown_all)

    if sys.platform == "win32":
        try:
            from ctypes import wintypes
            kernel32 = ctypes.windll.kernel32
            HandlerRoutine = ctypes.WINFUNCTYPE(wintypes.BOOL, wintypes.DWORD)

            def _win_ctrl_handler(ctrl_type):
                shutdown_all()
                return True

            _global_ctrl_handler = HandlerRoutine(_win_ctrl_handler)
            kernel32.SetConsoleCtrlHandler(_global_ctrl_handler, True)
        except Exception:
            pass

        def _key_listener():
            try:
                import msvcrt
                while not _shutdown_initiated:
                    if msvcrt.kbhit():
                        ch = msvcrt.getch()
                        if ch in (b"\x03", b"q", b"Q", b"\x1b"):
                            shutdown_all()
                            break
                        elif ch in (b"c", b"C"):
                            print("\033[2J\033[H", end="", flush=True)
                            print_master_banner(registry, with_portal, lan_ip)
                            print(f"{CLR_BOLD}{CLR_CYAN}📡 Live Multi-Service Log Stream Active{CLR_RESET}\n", flush=True)
                    time.sleep(0.05)
            except Exception:
                pass

        threading.Thread(target=_key_listener, daemon=True).start()

    # Pre-flight port availability sweep
    if kill_port:
        freed = []
        for pid, spec in registry.items():
            fe = spec.get("frontend_port")
            be = spec.get("backend_port")
            if fe:
                k = kill_process_on_port(fe)
                if k:
                    freed.append(f":{fe}")
            if be and be != fe:
                k = kill_process_on_port(be)
                if k:
                    freed.append(f":{be}")
        if with_portal:
            k5181 = kill_process_on_port(5181)
            k8008 = kill_process_on_port(8008)
            if k5181:
                freed.append(":5181")
            if k8008:
                freed.append(":8008")

        if freed:
            print(f"{CLR_GREEN}✔ Port sweep complete ({len(freed)} conflicting ports freed: {', '.join(freed)}).{CLR_RESET}")
        else:
            print(f"{CLR_GREEN}✔ Port sweep complete (all ports ready).{CLR_RESET}")

    def start_service(label: str, cmd: List[str], cwd: Path) -> Optional[subprocess.Popen]:
        stdout_dest = None
        stderr_dest = None
        if not verbose:
            clean_name = label.replace(":", "-")
            lf = open(logs_dir / f"{clean_name}.log", "w", encoding="utf-8", errors="replace")
            log_files.append(lf)
            stdout_dest = lf
            stderr_dest = subprocess.STDOUT

        creationflags = 0
        if sys.platform == "win32":
            creationflags = subprocess.CREATE_NEW_PROCESS_GROUP

        try:
            p = subprocess.Popen(
                cmd,
                cwd=str(cwd),
                stdout=stdout_dest,
                stderr=stderr_dest,
                shell=(sys.platform == "win32"),
                creationflags=creationflags,
            )
            running_processes.append((label, p))
            return p
        except Exception as e:
            print(f"   {CLR_RED}✖ [{label}] Failed to start:{CLR_RESET} {e}")
            return None

    # Phase 1: Launch Backend API Servers First
    if not client_only:
        backend_count = sum(1 for spec in registry.values() if spec.get("backend_cmd")) + (1 if with_portal else 0)
        print(f"\n{CLR_CYAN}⚙️  Starting {backend_count} Backend API Services...{CLR_RESET}", end="", flush=True)

        for pid, spec in registry.items():
            proj_dir = workspace_root / "Soul-DevPortal-Projects" / pid
            if not proj_dir.is_dir():
                continue
            be_cmd = spec.get("backend_cmd")
            if be_cmd:
                start_service(f"{pid}:server", be_cmd, proj_dir)
                time.sleep(0.05)

        if with_portal:
            portal_be_cmd = [sys.executable, "server/main.py", "--port", "8008"]
            start_service("devportal:server", portal_be_cmd, workspace_root)

        print(f" {CLR_GREEN}Done.{CLR_RESET}")
        time.sleep(0.5)

    # Phase 2: Launch Frontend Client Applications
    if not server_only:
        frontend_count = sum(1 for spec in registry.values() if spec.get("frontend_cmd")) + (1 if with_portal else 0)
        print(f"{CLR_CYAN}🎨 Starting {frontend_count} Frontend Web Applications...{CLR_RESET}", end="", flush=True)

        for pid, spec in registry.items():
            proj_dir = workspace_root / "Soul-DevPortal-Projects" / pid
            if not proj_dir.is_dir():
                continue
            fe_cmd = spec.get("frontend_cmd")
            if fe_cmd:
                start_service(f"{pid}:client", fe_cmd, proj_dir)
                time.sleep(0.05)

        if with_portal:
            portal_fe_cmd = ["npx", "vite", "--port", "5181", "--host"]
            start_service("devportal:client", portal_fe_cmd, workspace_root)

        print(f" {CLR_GREEN}Done.{CLR_RESET}")

    # Phase 3: Active Health Verification (Wait for ports to listen)
    print(f"\n{CLR_YELLOW}⏳ Verifying service connectivity and health...{CLR_RESET}")
    pending_ports: Dict[str, Tuple[str, int]] = {}
    for pid, spec in registry.items():
        fe_p = spec.get("frontend_port")
        be_p = spec.get("backend_port")
        if fe_p and not server_only:
            pending_ports[f"{pid}:client"] = (f"http://localhost:{fe_p}", fe_p)
        if be_p and not client_only:
            pending_ports[f"{pid}:server"] = (f"http://127.0.0.1:{be_p}", be_p)
    if with_portal:
        if not server_only:
            pending_ports["devportal:client"] = ("http://localhost:5181", 5181)
        if not client_only:
            pending_ports["devportal:server"] = ("http://127.0.0.1:8008", 8008)

    total_services = len(pending_ports)
    poll_start = time.time()
    spinner_frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"]
    frame_idx = 0

    while pending_ports and (time.time() - poll_start) < 75.0:
        found_any = False
        for label, (url, port) in list(pending_ports.items()):
            if is_port_listening(port):
                del pending_ports[label]
                found_any = True
                online_count = total_services - len(pending_ports)
                color = CLR_GREEN if "client" in label else CLR_CYAN
                elapsed_service = time.time() - poll_start

                clean_name = label.replace(":", "-")
                log_path = f"logs/services/{clean_name}.log"
                sys.stdout.write(f"\r\033[2K   {color}✔ [{label:<35}]{CLR_RESET} {url:<26} {CLR_DIM}({elapsed_service:.1f}s){CLR_RESET} [{online_count}/{total_services}]\n")
                sys.stdout.write(f"     {CLR_DIM}📁 Log: {CLR_CYAN}{log_path}{CLR_RESET}\n")
                sys.stdout.flush()

        if pending_ports:
            online_count = total_services - len(pending_ports)
            elapsed = int(time.time() - poll_start)
            spin = spinner_frames[frame_idx % len(spinner_frames)]
            frame_idx += 1
            term_cols = shutil.get_terminal_size((85, 24)).columns
            pending_names = ", ".join(pending_ports.keys())
            max_name_len = max(12, term_cols - 45)
            if len(pending_names) > max_name_len:
                pending_names = pending_names[:max_name_len - 3] + "..."
            spin_line = f"   {CLR_YELLOW}{spin}{CLR_RESET} {CLR_DIM}Waiting for [{pending_names}]... [{online_count}/{total_services}] ({elapsed}s){CLR_RESET}"
            sys.stdout.write(f"\r\033[2K{spin_line[:term_cols - 1]}")
            sys.stdout.flush()
            time.sleep(0.2)

    sys.stdout.write("\r\033[2K")
    sys.stdout.flush()

    w = 82
    print(f"\n{CLR_GREEN}{'=' * w}{CLR_RESET}")
    if not pending_ports:
        print(f"{CLR_BOLD}{CLR_GREEN}✔ All {total_services} services online, verified, and listening.{CLR_RESET}")
    else:
        online_count = total_services - len(pending_ports)
        print(f"{CLR_BOLD}{CLR_YELLOW}✔ {online_count}/{total_services} services online and responding.{CLR_RESET}")
        for label, (url, port) in pending_ports.items():
            clean_name = label.replace(":", "-")
            log_path = f"logs/services/{clean_name}.log"
            print(f"   {CLR_YELLOW}• [{label:<35}]{CLR_RESET} Port :{port:<5} still initializing\n     {CLR_DIM}📁 Log: {CLR_CYAN}{log_path}{CLR_RESET}")

    print(f"{CLR_DIM}  • Click any URL in the table above to open that app in your browser.{CLR_RESET}")
    print(f"{CLR_DIM}  • Detailed logs saved to: Soul-DevPortal/logs/services/*.log{CLR_RESET}")
    print(f"{CLR_BOLD}{CLR_CYAN}  • Stop All : Press [Ctrl+C] or type [q] to stop all services immediately.{CLR_RESET}")
    print(f"{CLR_GREEN}{'=' * w}{CLR_RESET}\n")

    if auto_open and target_open_url:
        print(f"{CLR_CYAN}🚀 Launching in default browser:{CLR_RESET} {CLR_BOLD}{target_open_url}{CLR_RESET}\n")
        try:
            webbrowser.open(target_open_url)
        except Exception:
            pass

    if not verbose:
        for idx, (label, _) in enumerate(running_processes):
            clean_name = label.replace(":", "-")
            lp = logs_dir / f"{clean_name}.log"
            if lp.is_file():
                try:
                    f = open(lp, "r", encoding="utf-8", errors="replace")
                    f.seek(0, io.SEEK_END)
                    color = PROJECT_COLORS[idx % len(PROJECT_COLORS)]
                    tail_readers[label] = (f, color)
                except Exception:
                    pass

    print(f"{CLR_BOLD}{CLR_CYAN}📡 Live Multi-Service Log Stream Active{CLR_RESET} {CLR_DIM}(Incoming requests & logs stream below • Press [c] to clear, [q] to quit){CLR_RESET}\n", flush=True)

    def _dev_all_hotkey_handler(key: str):
        if key in ("q", "\x03"):
            shutdown_all()
        elif key == "c":
            os.system("cls" if sys.platform == "win32" else "clear")
            print_master_banner(registry, with_portal, lan_ip)

    def _start_hotkey_listener():
        is_tty = bool(sys.stdin and hasattr(sys.stdin, "isatty") and sys.stdin.isatty())
        if sys.platform == "win32" and is_tty:
            try:
                import msvcrt

                def _msvcrt_listener():
                    try:
                        while not _shutdown_initiated:
                            if msvcrt.kbhit():
                                ch = msvcrt.getch()
                                if ch in (b"\x00", b"\xe0"):
                                    msvcrt.getch()
                                    continue
                                try:
                                    k = ch.decode("utf-8", errors="ignore").lower()
                                except Exception:
                                    continue
                                _dev_all_hotkey_handler(k)
                            time.sleep(0.05)
                    except Exception:
                        pass

                threading.Thread(target=_msvcrt_listener, daemon=True).start()
                return
            except Exception:
                pass

        def _stdin_listener():
            try:
                while not _shutdown_initiated:
                    line = sys.stdin.readline()
                    if not line:
                        time.sleep(0.2)
                        continue
                    for char in line.strip().lower():
                        _dev_all_hotkey_handler(char)
            except Exception:
                pass

        threading.Thread(target=_stdin_listener, daemon=True).start()

    _start_hotkey_listener()

    try:
        while True:
            time.sleep(0.1)

            if pending_ports:
                for label, (url, port) in list(pending_ports.items()):
                    if is_port_listening(port):
                        del pending_ports[label]
                        color = CLR_GREEN if "client" in label else CLR_CYAN
                        clean_name = label.replace(":", "-")
                        log_path = f"logs/services/{clean_name}.log"
                        print(f"   {color}✔ [{label:<35}]{CLR_RESET} {url:<26} {CLR_BOLD}is now online and responding!{CLR_RESET}", flush=True)
                        print(f"     {CLR_DIM}📁 Log: {CLR_CYAN}{log_path}{CLR_RESET}", flush=True)

            if tail_readers:
                for label, (f, color) in list(tail_readers.items()):
                    try:
                        while True:
                            line = f.readline()
                            if not line:
                                break
                            line = line.rstrip("\r\n")
                            if not line:
                                continue
                            if "press h + enter to show help" in line:
                                continue
                            tag = f"{color}[{label:<28}]{CLR_RESET}"
                            if any(err in line for err in ("ERROR", "Error", "Exception", "Traceback", "Failed", "failed")):
                                print(f"{tag} {CLR_RED}{line}{CLR_RESET}", flush=True)
                            elif "WARN" in line or "Warning" in line:
                                print(f"{tag} {CLR_YELLOW}{line}{CLR_RESET}", flush=True)
                            elif " 200 " in line or "200 OK" in line or "[OK]" in line:
                                print(f"{tag} {CLR_GREEN}{line}{CLR_RESET}", flush=True)
                            else:
                                print(f"{tag} {line}", flush=True)
                    except Exception:
                        pass

            for item in list(running_processes):
                label, proc = item
                ret = proc.poll()
                if ret is not None:
                    clean_name = label.replace(":", "-")
                    print(f"{CLR_YELLOW}⚠️  [{label}] exited with code {ret}. See: logs/services/{clean_name}.log{CLR_RESET}")
                    running_processes.remove(item)
            if not running_processes:
                print(f"{CLR_YELLOW}All supervised processes have exited.{CLR_RESET}")
                break
    except KeyboardInterrupt:
        shutdown_all()
