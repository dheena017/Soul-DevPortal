"""
Soul Dev Portal Service.
Serves lifecycle commands from root package.json and server health.
"""

from __future__ import annotations

import os
import shutil
import subprocess
import time
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from shared.paths import WORKSPACE_ROOT, ROOT_PACKAGE_JSON, DB_PATH
from shared.extractors.manifest_reader import read_json_manifest
from shared.config import PORT, APP_VERSION, SERVICE_NAME

START_TIME = time.time()


class SoulDevPortalService:
    @staticmethod
    def get_commands() -> Dict[str, Any]:
        """Reads scripts directly from root package.json."""
        manifest = read_json_manifest(ROOT_PACKAGE_JSON)
        scripts = manifest.get("scripts", {})

        command_list = []
        for name, cmd in scripts.items():
            category = "apps" if any(p in name for p in ("apexmind", "sonikoma", "outpass", "free-api", "spatial", "college", "globalpulse", "postcraft")) else "orchestration"
            command_list.append({
                "id": name,
                "name": f"npm run {name}",
                "command": cmd,
                "category": category,
            })

        return {
            "source": str(ROOT_PACKAGE_JSON.name),
            "totalCommands": len(command_list),
            "rawScripts": scripts,
            "commands": command_list,
        }

    @staticmethod
    def get_health() -> Dict[str, Any]:
        """Returns live process and SQLite WAL health."""
        uptime_seconds = int(time.time() - START_TIME)
        return {
            "status": "healthy",
            "service": SERVICE_NAME,
            "version": APP_VERSION,
            "port": PORT,
            "uptimeSeconds": uptime_seconds,
            "dbMode": "WAL",
            "dbExists": DB_PATH.exists(),
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def get_overview() -> Dict[str, Any]:
        """Root landing overview and service status."""
        return {
            "service": "Soul DevPortal Engine",
            "version": APP_VERSION,
            "status": "online",
            "port": PORT,
            "docsUrl": "/docs",
            "openapiUrl": "/openapi.json",
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

    @staticmethod
    def _candidate_release_dirs() -> List[Path]:
        """Returns unique existing release/ directories to check for Windows executables."""
        candidates = [
            WORKSPACE_ROOT / "release",
            Path(__file__).resolve().parents[3] / "release",
        ]
        seen = set()
        dirs: List[Path] = []
        for c in candidates:
            resolved = str(c.resolve())
            if resolved not in seen and c.is_dir():
                seen.add(resolved)
                dirs.append(c)
        return dirs

    @classmethod
    def get_desktop_info(cls) -> Dict[str, Any]:
        """Discovers built Windows installer & portable executables inside release/."""
        artifacts: List[Dict[str, Any]] = []
        seen_names = set()
        for rel_dir in cls._candidate_release_dirs():
            for item in sorted(rel_dir.glob("*.exe"), key=lambda p: p.stat().st_mtime, reverse=True):
                if item.name in seen_names or not item.is_file() or "__uninstaller" in item.name.lower():
                    continue
                stat = item.stat()
                if stat.st_size < 10 * 1024 * 1024:
                    continue
                seen_names.add(item.name)
                variant = "setup" if "setup" in item.name.lower() else "portable"
                size_mb = round(stat.st_size / (1024 * 1024), 1)
                artifacts.append({
                    "name": item.name,
                    "variant": variant,
                    "sizeBytes": stat.st_size,
                    "sizeLabel": f"{size_mb} MB",
                    "downloadUrl": f"/api/soul-dev-portal/desktop-download?variant={variant}",
                    "modifiedAt": datetime.fromtimestamp(stat.st_mtime, timezone.utc).isoformat(),
                })

        artifacts.sort(key=lambda a: (0 if a["variant"] == "setup" else 1, a["name"]))
        setup_art = next((a for a in artifacts if a["variant"] == "setup"), None)
        portable_art = next((a for a in artifacts if a["variant"] == "portable"), None)
        primary = setup_art or portable_art
        desktop_dir, _programs_dir = cls._resolve_windows_shell_dirs()
        shortcut_file = desktop_dir / "Soul DevPortal.lnk" if desktop_dir else None
        launch_script = cls._resolve_launch_script()
        node_bin = shutil.which("node")
        can_launch = bool(node_bin and launch_script and launch_script.is_file())
        return {
            "available": primary is not None,
            "recommendedVariant": primary["variant"] if primary else None,
            "primaryDownloadUrl": "/api/soul-dev-portal/desktop-download?variant=auto" if primary else None,
            "artifacts": artifacts,
            "githubReleasesUrl": "https://github.com/dheena017/Soul-DevPortal/releases/tag/v0.0.1",
            "buildCommand": "npm run desktop:build",
            "launchCommand": "npm run desktop",
            "shortcutSupported": bool(os.name == "nt" and can_launch),
            "shortcutInstalled": bool(shortcut_file and shortcut_file.is_file()),
            "desktopShortcutPath": str(shortcut_file) if shortcut_file else None,
            "canLaunchDesktop": can_launch,
        }

    @staticmethod
    def _resolve_repo_root() -> Path:
        repo_root = Path(__file__).resolve().parents[3]
        if (WORKSPACE_ROOT / "electron" / "launch.cjs").is_file():
            return WORKSPACE_ROOT
        return repo_root

    @classmethod
    def _resolve_launch_script(cls) -> Optional[Path]:
        candidate = cls._resolve_repo_root() / "electron" / "launch.cjs"
        return candidate if candidate.is_file() else None

    @staticmethod
    def _resolve_windows_shell_dirs() -> tuple[Optional[Path], Optional[Path]]:
        if os.name != "nt":
            return None, None
        try:
            import winreg

            with winreg.OpenKey(
                winreg.HKEY_CURRENT_USER,
                r"Software\Microsoft\Windows\CurrentVersion\Explorer\User Shell Folders",
            ) as key:
                desktop_raw, _ = winreg.QueryValueEx(key, "Desktop")
                programs_raw, _ = winreg.QueryValueEx(key, "Programs")
            desktop = Path(os.path.expandvars(str(desktop_raw)))
            programs = Path(os.path.expandvars(str(programs_raw)))
            return desktop, programs
        except Exception:
            desktop = Path.home() / "Desktop"
            appdata = os.environ.get("APPDATA", "")
            programs = Path(appdata) / "Microsoft" / "Windows" / "Start Menu" / "Programs" if appdata else None
            return desktop, programs

    @classmethod
    def create_desktop_shortcut(cls) -> Dict[str, Any]:
        """Creates Windows Desktop & Start Menu .lnk shortcuts to launch the standalone Desktop App."""
        if os.name != "nt":
            return {"success": False, "error": "Desktop shortcut creation is currently supported on Windows only."}

        node_bin = shutil.which("node")
        launch_script = cls._resolve_launch_script()
        repo_root = cls._resolve_repo_root()
        icon_file = repo_root / "electron" / "assets" / "icon.ico"
        desktop_dir, programs_dir = cls._resolve_windows_shell_dirs()

        if not node_bin or not launch_script or not desktop_dir:
            return {"success": False, "error": "Node.js runtime or electron/launch.cjs is unavailable in this installation."}

        desktop_dir.mkdir(parents=True, exist_ok=True)
        desktop_lnk = desktop_dir / "Soul DevPortal.lnk"
        targets = [desktop_lnk]
        start_menu_lnk: Optional[Path] = None
        if programs_dir is not None:
            programs_dir.mkdir(parents=True, exist_ok=True)
            start_menu_lnk = programs_dir / "Soul DevPortal.lnk"
            targets.append(start_menu_lnk)

        ps_script = (
            "$ws = New-Object -ComObject WScript.Shell; "
            "foreach ($lnkPath in @($env:SOUL_LNK_DESKTOP, $env:SOUL_LNK_START)) { "
            "  if (-not $lnkPath) { continue }; "
            "  $sc = $ws.CreateShortcut($lnkPath); "
            "  $sc.TargetPath = $env:SOUL_NODE_BIN; "
            "  $sc.Arguments = ('\"' + $env:SOUL_LAUNCH_JS + '\" --detached'); "
            "  $sc.WorkingDirectory = $env:SOUL_WORKDIR; "
            "  if ($env:SOUL_ICON_ICO) { $sc.IconLocation = ($env:SOUL_ICON_ICO + ',0'); } "
            "  $sc.WindowStyle = 7; "
            "  $sc.Description = 'Soul DevPortal Standalone Desktop App (Embedded UI + Auto FastAPI :8008)'; "
            "  $sc.Save(); "
            "}"
        )
        env = {
            **os.environ,
            "SOUL_LNK_DESKTOP": str(desktop_lnk),
            "SOUL_LNK_START": str(start_menu_lnk) if start_menu_lnk else "",
            "SOUL_NODE_BIN": str(node_bin),
            "SOUL_LAUNCH_JS": str(launch_script),
            "SOUL_WORKDIR": str(repo_root),
            "SOUL_ICON_ICO": str(icon_file) if icon_file.is_file() else "",
        }
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", ps_script],
            env=env,
            capture_output=True,
            text=True,
            check=False,
        )
        if proc.returncode != 0 or not desktop_lnk.is_file():
            return {"success": False, "error": (proc.stderr or proc.stdout or "Failed to write Windows shortcut").strip()}

        return {
            "success": True,
            "desktopShortcut": str(desktop_lnk),
            "startMenuShortcut": str(start_menu_lnk) if start_menu_lnk and start_menu_lnk.is_file() else None,
        }

    @classmethod
    def launch_desktop_app(cls) -> Dict[str, Any]:
        """Launches the standalone Electron desktop application with auto-started FastAPI backend."""
        node_bin = shutil.which("node")
        launch_script = cls._resolve_launch_script()
        repo_root = cls._resolve_repo_root()
        if not node_bin or not launch_script:
            return {"launched": False, "error": "Desktop launcher runtime not found."}

        clean_env = dict(os.environ)
        clean_env.pop("ELECTRON_RUN_AS_NODE", None)
        kwargs: Dict[str, Any] = {
            "cwd": str(repo_root),
            "env": clean_env,
            "stdin": subprocess.DEVNULL,
            "stdout": subprocess.DEVNULL,
            "stderr": subprocess.DEVNULL,
        }
        if os.name == "nt":
            kwargs["creationflags"] = subprocess.DETACHED_PROCESS | subprocess.CREATE_NEW_PROCESS_GROUP
        subprocess.Popen([str(node_bin), str(launch_script), "--detached"], **kwargs)
        return {"launched": True}

    @classmethod
    def resolve_desktop_artifact(cls, variant: str = "auto") -> Optional[Path]:
        """Resolves the requested Windows installer (.exe) inside release/."""
        setup_file: Optional[Path] = None
        portable_file: Optional[Path] = None
        for rel_dir in cls._candidate_release_dirs():
            for item in sorted(rel_dir.glob("*.exe"), key=lambda p: p.stat().st_mtime, reverse=True):
                if not item.is_file() or "__uninstaller" in item.name.lower() or item.stat().st_size < 10 * 1024 * 1024:
                    continue
                is_setup = "setup" in item.name.lower()
                if is_setup and setup_file is None:
                    setup_file = item
                elif not is_setup and portable_file is None:
                    portable_file = item

        if variant == "setup":
            return setup_file
        if variant == "portable":
            return portable_file
        return setup_file or portable_file
