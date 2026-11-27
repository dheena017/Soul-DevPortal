"""
Terminal Execution & Interactive PTY Service.
Manages workspace-scoped shell profiles, directory resolution, and ConPTY (pywinpty) sessions.
"""

from __future__ import annotations

import importlib
import os
import shutil
import sys
import sysconfig
from pathlib import Path
from typing import Any, Dict, List, Optional

from shared.paths import DOCS_ROOT, PACKAGES_ROOT, PROJECTS_ROOT, WORKSPACE_ROOT


def _get_winpty_process() -> Any:
    if sys.platform != "win32":
        return None
    try:
        importlib.invalidate_caches()
        mod = importlib.import_module("winpty")
        return getattr(mod, "PtyProcess", None)
    except Exception:
        return None


class PtySession:
    """Thin cross-platform wrapper around a live pseudo-terminal process."""

    def __init__(self, proc: Any, profile: str, cwd: Path) -> None:
        self._proc = proc
        self.profile = profile
        self.cwd = cwd

    @property
    def pid(self) -> Optional[int]:
        return getattr(self._proc, "pid", None)

    @property
    def exitstatus(self) -> Optional[int]:
        return getattr(self._proc, "exitstatus", None)

    def isalive(self) -> bool:
        try:
            return bool(self._proc.isalive())
        except Exception:
            return False

    def read(self, size: int = 4096) -> str:
        try:
            data = self._proc.read(size)
            return data if isinstance(data, str) else data.decode("utf-8", errors="replace")
        except EOFError:
            return ""
        except Exception:
            return ""

    def write(self, data: str) -> None:
        if not data:
            return
        self._proc.write(data)

    def resize(self, rows: int, cols: int) -> None:
        safe_rows = max(2, min(int(rows), 500))
        safe_cols = max(10, min(int(cols), 500))
        try:
            self._proc.setwinsize(safe_rows, safe_cols)
        except Exception:
            pass

    def terminate(self) -> None:
        try:
            if self.isalive():
                self._proc.terminate(force=True)
        except Exception:
            pass
        try:
            if hasattr(self._proc, "close"):
                self._proc.close()
        except Exception:
            pass


class TerminalService:
    """Provides safe, workspace-scoped PTY sessions, shell profiles, and directory resolution."""

    @staticmethod
    def is_pty_supported() -> bool:
        return _get_winpty_process() is not None

    @staticmethod
    def resolve_cwd(cwd: Optional[str] = None) -> Path:
        root = WORKSPACE_ROOT.resolve()
        if not cwd or not cwd.strip():
            return root
        raw = cwd.strip()
        candidate = Path(raw)
        if not candidate.is_absolute():
            candidate = root / candidate
        resolved = candidate.resolve()
        try:
            resolved.relative_to(root)
        except ValueError as exc:
            raise ValueError(f"Working directory must stay inside workspace root: {root}") from exc
        if not resolved.is_dir():
            raise ValueError(f"Directory does not exist: {resolved}")
        return resolved

    @classmethod
    def _relative_cwd(cls, path: Path) -> str:
        root = WORKSPACE_ROOT.resolve()
        rel = path.resolve().relative_to(root)
        return "." if str(rel) == "." else str(rel).replace("\\", "/")

    @staticmethod
    def _find_git_bash() -> Optional[str]:
        candidates = [
            shutil.which("bash"),
            r"C:\Program Files\Git\bin\bash.exe",
            r"C:\Program Files (x86)\Git\bin\bash.exe",
        ]
        for candidate in candidates:
            if candidate and Path(candidate).is_file():
                # Avoid WSL bash.exe in System32 if Git Bash is available, unless it's the only one
                if "system32" in candidate.lower():
                    continue
                return candidate
        wsl_bash = shutil.which("bash")
        if wsl_bash and Path(wsl_bash).is_file():
            return wsl_bash
        return None

    @classmethod
    def get_shell_profiles(cls) -> List[Dict[str, Any]]:
        if sys.platform == "win32":
            pwsh_path = shutil.which("pwsh") or shutil.which("powershell") or "powershell.exe"
            cmd_path = os.environ.get("COMSPEC") or shutil.which("cmd") or "cmd.exe"
            bash_path = cls._find_git_bash()
            python_path = sys.executable

            return [
                {
                    "id": "powershell",
                    "label": "PowerShell",
                    "command": pwsh_path,
                    "args": ["-NoLogo"],
                    "available": True,
                    "description": "Windows PowerShell / PowerShell 7",
                },
                {
                    "id": "cmd",
                    "label": "Command Prompt",
                    "command": cmd_path,
                    "args": [],
                    "available": True,
                    "description": "cmd.exe",
                },
                {
                    "id": "bash",
                    "label": "Git Bash",
                    "command": bash_path or "bash.exe",
                    "args": ["--login", "-i"],
                    "available": bool(bash_path),
                    "description": "Git Bash (MINGW64)",
                },
                {
                    "id": "python",
                    "label": "Python REPL",
                    "command": python_path,
                    "args": ["-i", "-u"],
                    "available": bool(python_path),
                    "description": f"Python {sys.version.split()[0]} Interactive",
                },
            ]

        sh_path = os.environ.get("SHELL") or shutil.which("bash") or "/bin/sh"
        return [
            {
                "id": "bash",
                "label": "Shell",
                "command": sh_path,
                "args": ["-i"],
                "available": True,
                "description": sh_path,
            },
            {
                "id": "python",
                "label": "Python REPL",
                "command": sys.executable,
                "args": ["-i", "-u"],
                "available": True,
                "description": f"Python {sys.version.split()[0]}",
            },
        ]

    @classmethod
    def resolve_profile(cls, profile_id: str) -> Dict[str, Any]:
        profiles = cls.get_shell_profiles()
        for p in profiles:
            if p["id"] == profile_id and p["available"]:
                return p
        for p in profiles:
            if p["available"]:
                return p
        raise RuntimeError("No available shell profiles found.")

    @classmethod
    def spawn_pty(
        cls,
        profile_id: str = "powershell",
        cwd: Optional[str] = None,
        cols: int = 100,
        rows: int = 30,
    ) -> PtySession:
        winpty_cls = _get_winpty_process()
        if winpty_cls is None:
            raise RuntimeError(
                "pywinpty ConPTY backend is not installed. Run: pip install pywinpty"
            )

        active_dir = cls.resolve_cwd(cwd)
        profile = cls.resolve_profile(profile_id)
        argv = [profile["command"], *profile.get("args", [])]

        env = os.environ.copy()
        extra_paths = [
            str(WORKSPACE_ROOT / "node_modules" / ".bin"),
            str(Path(sys.executable).parent),
            str(Path(sys.executable).parent / "Scripts"),
        ]
        scripts_dir = sysconfig.get_path("scripts")
        if scripts_dir:
            extra_paths.append(scripts_dir)
        existing_path = env.get("PATH", "")
        env["PATH"] = os.pathsep.join([p for p in extra_paths if p and Path(p).is_dir()] + ([existing_path] if existing_path else []))
        env["TERM"] = "xterm-256color"
        env["COLORTERM"] = "truecolor"
        env["FORCE_COLOR"] = "1"
        env["PYTHONUNBUFFERED"] = "1"
        env["PYTHONIOENCODING"] = "utf-8"
        env["PYTHONUTF8"] = "1"

        safe_rows = max(2, min(int(rows), 500))
        safe_cols = max(10, min(int(cols), 500))

        proc = winpty_cls.spawn(
            argv,
            cwd=str(active_dir),
            env=env,
            dimensions=(safe_rows, safe_cols),
        )
        return PtySession(proc=proc, profile=profile["id"], cwd=active_dir)

    @classmethod
    def get_info(cls) -> Dict[str, Any]:
        directories: List[Dict[str, str]] = [
            {"label": "Workspace Root", "path": str(WORKSPACE_ROOT.resolve()), "relativePath": "."},
        ]
        if PROJECTS_ROOT.is_dir():
            for child in sorted(PROJECTS_ROOT.iterdir()):
                if child.is_dir() and not child.name.startswith("."):
                    directories.append(
                        {
                            "label": f"Project · {child.name}",
                            "path": str(child.resolve()),
                            "relativePath": f"Soul-DevPortal-Projects/{child.name}",
                        }
                    )
        if PACKAGES_ROOT.is_dir():
            for child in sorted(PACKAGES_ROOT.iterdir()):
                if child.is_dir() and not child.name.startswith("."):
                    directories.append(
                        {
                            "label": f"Package · {child.name}",
                            "path": str(child.resolve()),
                            "relativePath": f"Soul-DevPortal-Packages/{child.name}",
                        }
                    )
        if DOCS_ROOT.is_dir():
            directories.append(
                {
                    "label": "Docs Root",
                    "path": str(DOCS_ROOT.resolve()),
                    "relativePath": "Soul-DevPortal-Docs",
                }
            )

        return {
            "workspaceRoot": str(WORKSPACE_ROOT.resolve()),
            "shell": os.environ.get("COMSPEC", "powershell.exe") if sys.platform == "win32" else os.environ.get("SHELL", "/bin/sh"),
            "platform": sys.platform,
            "ptySupported": cls.is_pty_supported(),
            "profiles": cls.get_shell_profiles(),
            "directories": directories,
        }
