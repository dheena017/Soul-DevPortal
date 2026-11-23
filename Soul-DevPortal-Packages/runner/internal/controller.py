"""
Central Process Controller & Hotkey Dispatcher (@workspace/runner/internal).
Supervises child processes, handles demultiplexed streams, and handles interactive keyboard hotkeys.
"""
from __future__ import annotations

import os
import signal
import subprocess
import sys
import threading
import time
import webbrowser
from pathlib import Path
from typing import Any

from .dashboard import print_help_menu, print_hotkey_toolbar
from .env import get_env_summary, load_cascading_env
from .formatting import _stream_output, format_universal_line
from .healthcheck import wait_for_server_healthy
from .installer import (
    BOLD,
    CYAN,
    GRAY,
    RED,
    RESET,
    WHITE,
    _format_box_lines,
    get_terminal_width,
)
from .ports import (
    _render_backend_crash_card,
    ensure_port_free,
    kill_process_on_port,
)
from .sandboxing import _linux_preexec_fn
from .stats import format_process_stats_table


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

        self.env, self.loaded_env_files = load_cascading_env(project_dir=cwd)
        runner_flags = {
            "WORKSPACE_SUPERVISOR_ACTIVE": "1",
            "WORKSPACE_RUNNER_ACTIVE": "1",
            "WORKSPACE_QUIET_BANNERS": "1",
            "WORKSPACE_CHILD_PROCESS": "1",
        }
        self.env.update(runner_flags)
        for k, v in runner_flags.items():
            os.environ[k] = v

        self.p_backend: subprocess.Popen | None = None
        self.p_frontend: subprocess.Popen | None = None
        self.be_start_time: float = 0.0
        self.fe_start_time: float = 0.0

        self._shutdown_event = threading.Event()
        self._lock = threading.Lock()

    def _spawn_process(self, cmd: list[str]) -> subprocess.Popen:
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

    def _terminate_process(self, proc: subprocess.Popen | None, port: int | None = None) -> None:
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
        if not self.backend_cmd:
            return True

        with self._lock:
            self._terminate_process(self.p_backend, self.backend_port)
            ensure_port_free(self.backend_port, auto_kill=True, service_name=self.service_name)

            self.p_backend = self._spawn_process(self.backend_cmd)
            self.be_start_time = time.time()

            t_be = threading.Thread(target=_stream_output, args=(self.p_backend.stdout, "BACKEND "), daemon=True)
            t_be.start()

        healthy, elapsed = wait_for_server_healthy(
            self.backend_port,
            timeout=12.0,
            process_handle=self.p_backend,
        )
        if healthy:
            pass
        else:
            if self.p_backend and self.p_backend.poll() is not None:
                exit_code = self.p_backend.poll()
                msg = f"Backend process crashed on startup with exit code {exit_code} (in {int(elapsed * 1000)}ms)"
                print(format_universal_line("SYSTEM  ", "ERROR", "HEALTHCHECK", msg), flush=True)
                _render_backend_crash_card(self.backend_port, exit_code, self.cwd)
            else:
                msg = f"Backend did not respond on port {self.backend_port} within 12s, proceeding..."
                print(format_universal_line("SYSTEM  ", "WARN", "HEALTHCHECK", msg), flush=True)

        return healthy

    def start_frontend(self) -> None:
        if not self.frontend_cmd:
            return

        with self._lock:
            self._terminate_process(self.p_frontend, self.frontend_port)
            ensure_port_free(self.frontend_port, auto_kill=True, service_name=self.service_name)

            self.p_frontend = self._spawn_process(self.frontend_cmd)
            self.fe_start_time = time.time()

            t_fe = threading.Thread(target=_stream_output, args=(self.p_frontend.stdout, "FRONTEND"), daemon=True)
            t_fe.start()

    def restart_backend(self) -> None:
        print(format_universal_line("SYSTEM  ", "ACTION", "SUPERVISOR", f"Restarting backend server (:{self.backend_port})..."), flush=True)
        self.start_backend()

    def restart_frontend(self) -> None:
        print(format_universal_line("SYSTEM  ", "ACTION", "SUPERVISOR", f"Restarting frontend dev server (:{self.frontend_port})..."), flush=True)
        self.start_frontend()

    def restart_all(self) -> None:
        print(format_universal_line("SYSTEM  ", "ACTION", "SUPERVISOR", "Reloading fullstack environment..."), flush=True)
        self.start_backend()
        self.start_frontend()

    def open_frontend(self) -> None:
        url = f"http://localhost:{self.frontend_port}"
        print(format_universal_line("SYSTEM  ", "ACTION", "BROWSER", f"Opening {url}..."), flush=True)
        webbrowser.open(url)

    def open_backend_docs(self) -> None:
        url = f"http://localhost:{self.backend_port}/docs"
        print(format_universal_line("SYSTEM  ", "ACTION", "BROWSER", f"Opening {url}..."), flush=True)
        webbrowser.open(url)

    def clear_screen(self) -> None:
        os.system("cls" if sys.platform == "win32" else "clear")
        if self.banner_callback:
            self.banner_callback()
        print_hotkey_toolbar()

    def show_stats(self) -> None:
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

    def show_env_info(self) -> None:
        summary = get_env_summary(project_dir=self.cwd)
        terminal_width = get_terminal_width(78)
        inner_width = terminal_width - 4

        b_tl, b_tr, b_bl, b_br = "╭", "╮", "╰", "╯"
        b_h, b_ml, b_mr = "─", "├", "┤"

        print()
        print(f" {CYAN}{b_tl}{b_h * (inner_width + 2)}{b_tr}{RESET}")
        title = f" 🔒  {BOLD}{WHITE}LOADED ENVIRONMENT HIERARCHY{RESET}"
        for l in _format_box_lines(title, inner_width, CYAN):
            print(l)
        print(f" {CYAN}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")

        if summary.get("loaded_files"):
            h = f"    {BOLD}Cascading Sources (Priority Order):{RESET}"
            for l in _format_box_lines(h, inner_width, CYAN):
                print(l)
            cwd_str = str(Path.cwd())
            for idx, f in enumerate(summary["loaded_files"], 1):
                p_rel = f.replace(cwd_str, ".").replace("\\", "/")
                fl = f"      {idx}. {CYAN}{p_rel}{RESET}"
                for l in _format_box_lines(fl, inner_width, CYAN):
                    print(l)
        else:
            no_env = f"    {GRAY}No local .env files detected. Running on system environment.{RESET}"
            for l in _format_box_lines(no_env, inner_width, CYAN):
                print(l)

        print(f" {CYAN}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")
        total_vars = summary.get("total_variables", 0)
        vl = f"    Total Project Variables: {BOLD}{WHITE}{total_vars}{RESET}"
        for l in _format_box_lines(vl, inner_width, CYAN):
            print(l)

        if summary.get("variables"):
            print(f" {CYAN}{b_ml}{b_h * (inner_width + 2)}{b_mr}{RESET}")
            for k, v in sorted(summary["variables"].items()):
                v_line = f"    {CYAN}{k[:24]:<24}{RESET} : {str(v)[:38]}"
                for l in _format_box_lines(v_line, inner_width, CYAN):
                    print(l)

        print(f" {CYAN}{b_bl}{b_h * (inner_width + 2)}{b_br}{RESET}")
        print()

    def shutdown(self, _sig: Any = None, _frame: Any = None) -> None:
        if self._shutdown_event.is_set():
            return
        self._shutdown_event.set()

        sys.stdout.write(f"\n\033[33m[{self.service_name}]\033[0m Stopping fullstack environment...\n")
        sys.stdout.flush()

        with self._lock:
            self._terminate_process(self.p_frontend, self.frontend_port)
            self._terminate_process(self.p_backend, self.backend_port)

        sys.stdout.write(f"\033[32m[{self.service_name}] Stopped cleanly. Ports freed.\033[0m\n")
        sys.stdout.flush()
        # Ensure fast, clean exit
        os._exit(0)

    def run_keyboard_listener(self) -> None:
        if sys.platform == "win32":
            def _win_loop():
                try:
                    import msvcrt
                    while not self._shutdown_event.is_set():
                        if msvcrt.kbhit():
                            ch = msvcrt.getch()
                            if ch in (b"\x00", b"\xe0"):
                                msvcrt.getch()
                                continue
                            try:
                                key = ch.decode("utf-8", errors="ignore").lower()
                            except Exception:
                                continue
                            self._dispatch_hotkey(key)
                        time.sleep(0.05)
                except Exception:
                    pass

            t_win = threading.Thread(target=_win_loop, daemon=True)
            t_win.start()
        else:
            try:
                import select
                import termios
                import tty
                fd = sys.stdin.fileno()
                old = termios.tcgetattr(fd)
                tty.setcbreak(fd)

                def _posix_loop():
                    try:
                        while not self._shutdown_event.is_set():
                            r, _, _ = select.select([sys.stdin], [], [], 0.1)
                            if r:
                                key = sys.stdin.read(1).lower()
                                self._dispatch_hotkey(key)
                    finally:
                        termios.tcsetattr(fd, termios.TCSADRAIN, old)

                t_posix = threading.Thread(target=_posix_loop, daemon=True)
                t_posix.start()
            except Exception:
                pass

        def _stdin_fallback():
            try:
                while not self._shutdown_event.is_set():
                    line = sys.stdin.readline()
                    if not line:
                        time.sleep(0.2)
                        continue
                    for c in line.strip().lower():
                        self._dispatch_hotkey(c)
            except Exception:
                pass

        t_stdin = threading.Thread(target=_stdin_fallback, daemon=True)
        t_stdin.start()

    def _dispatch_hotkey(self, key: str) -> None:
        actions = {
            "r": self.restart_backend,
            "f": self.restart_frontend,
            "a": self.restart_all,
            "o": self.open_frontend,
            "b": self.open_backend_docs,
            "c": self.clear_screen,
            "p": self.show_stats,
            "e": self.show_env_info,
            "h": print_help_menu,
        }
        handler = actions.get(key)
        if handler:
            handler()
        elif key in ("q", "\x03"):
            self.shutdown()


__all__ = [
    "ProcessController",
]
