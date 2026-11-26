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

    @staticmethod
    def _infer_update_surface(rel_path: str) -> str:
        """Maps a workspace-relative file path to its Changelog/Portal surface key."""
        norm = rel_path.replace("\\", "/").lower().lstrip("./")
        if (
            "features/everyday/" in norm
            or "features/productivity/" in norm
            or "workspace_tools" in norm
        ):
            return "everyday"
        if (
            "features/system/" in norm
            or "server/features/system/" in norm
            or "system_inspector" in norm
            or "system_decoders" in norm
        ):
            return "computer"
        if (
            norm.startswith("soul-devportal-projects/")
            or "features/projects/" in norm
            or norm == "projects.json"
        ):
            return "project"
        if (
            norm.startswith("soul-devportal-packages/")
            or "features/packages/" in norm
        ):
            return "package"
        if (
            norm.startswith("soul-devportal-docs/")
            or "features/docs/" in norm
            or norm.endswith(".md")
        ):
            return "documentation"
        return "desktop"

    @staticmethod
    def _format_date_label(date_key: str) -> str:
        """Converts YYYY-MM-DD into e.g. 'November 25, 2026'."""
        try:
            dt = datetime.strptime(date_key, "%Y-%m-%d")
            return f"{dt.strftime('%B')} {dt.day}, {dt.year}"
        except Exception:
            return date_key

    @staticmethod
    def _format_time_12h(dt: datetime) -> str:
        """Formats a datetime in 12-hour clock format (e.g. '10:15 PM')."""
        hour = dt.hour % 12 or 12
        ampm = "AM" if dt.hour < 12 else "PM"
        return f"{hour:02d}:{dt.minute:02d} {ampm}"

    @classmethod
    def get_code_updates(cls, limit: int = 80) -> Dict[str, Any]:
        """Discovers live working-tree modifications and git commit history grouped by date."""
        safe_limit = max(10, min(200, int(limit or 80)))
        repo_root = cls._resolve_repo_root()
        git_bin = shutil.which("git")
        today_key = datetime.now().strftime("%Y-%m-%d")

        commits_list: List[Dict[str, Any]] = []
        working_files: List[Dict[str, Any]] = []
        source_mode = "git"

        if git_bin and (repo_root / ".git").exists():
            # 1. Read git commit history with per-file numstat
            log_fmt = "@@@COMMIT@@@%H|%h|%aI|%an|%s"
            try:
                log_proc = subprocess.run(
                    [
                        git_bin,
                        "-c",
                        "core.quotepath=false",
                        "log",
                        f"-n{safe_limit}",
                        "--date=iso-strict",
                        "--numstat",
                        f"--format={log_fmt}",
                    ],
                    cwd=str(repo_root),
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=8,
                    check=False,
                )
                if log_proc.returncode == 0 and log_proc.stdout:
                    current_commit: Optional[Dict[str, Any]] = None
                    for raw_line in log_proc.stdout.splitlines():
                        line = raw_line.strip()
                        if not line:
                            continue
                        if line.startswith("@@@COMMIT@@@"):
                            if current_commit is not None:
                                commits_list.append(current_commit)
                            meta = line[len("@@@COMMIT@@@") :].split("|", 4)
                            full_hash = meta[0] if len(meta) > 0 else ""
                            short_hash = meta[1] if len(meta) > 1 else full_hash[:7]
                            iso_date = meta[2] if len(meta) > 2 else ""
                            author = meta[3] if len(meta) > 3 else "developer"
                            subject = meta[4] if len(meta) > 4 else ""
                            date_key = iso_date[:10] if len(iso_date) >= 10 else today_key
                            time_12h = ""
                            try:
                                parsed_dt = datetime.fromisoformat(iso_date).astimezone()
                                date_key = parsed_dt.strftime("%Y-%m-%d")
                                time_12h = cls._format_time_12h(parsed_dt)
                            except Exception:
                                time_12h = ""
                            current_commit = {
                                "hash": full_hash,
                                "shortHash": short_hash,
                                "isoDate": iso_date,
                                "dateKey": date_key,
                                "dateLabel": cls._format_date_label(date_key),
                                "timeLabel": time_12h,
                                "author": author,
                                "subject": subject,
                                "surfaces": [],
                                "files": [],
                                "totalFiles": 0,
                                "totalAdditions": 0,
                                "totalDeletions": 0,
                            }
                        elif current_commit is not None:
                            parts = raw_line.split("\t")
                            if len(parts) == 3:
                                add_str, del_str, file_path = parts
                                adds = int(add_str) if add_str.isdigit() else 0
                                dels = int(del_str) if del_str.isdigit() else 0
                                surf = cls._infer_update_surface(file_path)
                                if surf not in current_commit["surfaces"]:
                                    current_commit["surfaces"].append(surf)
                                current_commit["files"].append({
                                    "path": file_path.strip(),
                                    "additions": adds,
                                    "deletions": dels,
                                    "surface": surf,
                                })
                                current_commit["totalFiles"] += 1
                                current_commit["totalAdditions"] += adds
                                current_commit["totalDeletions"] += dels
                    if current_commit is not None:
                        commits_list.append(current_commit)
            except Exception:
                source_mode = "filesystem"

            # 2. Read live working-tree status (modified/added/untracked workspace files)
            try:
                status_proc = subprocess.run(
                    [git_bin, "-c", "core.quotepath=false", "status", "--porcelain"],
                    cwd=str(repo_root),
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=6,
                    check=False,
                )
                if status_proc.returncode == 0 and status_proc.stdout:
                    for raw_line in status_proc.stdout.splitlines():
                        if len(raw_line) < 4:
                            continue
                        code = raw_line[:2]
                        rel_path = raw_line[3:].strip().strip('"')
                        if " -> " in rel_path:
                            rel_path = rel_path.split(" -> ", 1)[1].strip()
                        if not rel_path or rel_path.startswith("server/data/"):
                            continue
                        if "?" in code:
                            change_kind = "New File"
                        elif "A" in code:
                            change_kind = "Added"
                        elif "D" in code:
                            change_kind = "Deleted"
                        elif "R" in code:
                            change_kind = "Renamed"
                        else:
                            change_kind = "Modified"

                        full_p = repo_root / rel_path
                        file_date_key = today_key
                        file_time_12h = cls._format_time_12h(datetime.now())
                        try:
                            if full_p.exists():
                                mtime_dt = datetime.fromtimestamp(full_p.stat().st_mtime)
                                file_date_key = mtime_dt.strftime("%Y-%m-%d")
                                file_time_12h = cls._format_time_12h(mtime_dt)
                        except Exception:
                            pass
                        working_files.append({
                            "path": rel_path.replace("\\", "/"),
                            "status": change_kind,
                            "dateKey": file_date_key,
                            "timeLabel": file_time_12h,
                            "surface": cls._infer_update_surface(rel_path),
                        })
            except Exception:
                pass
        else:
            source_mode = "filesystem"

        # Fallback mtime scan when running outside a .git repository
        if source_mode == "filesystem" and not commits_list and not working_files:
            scan_roots = ["src", "server", "electron"]
            candidates: List[tuple[float, str]] = []
            for sub in scan_roots:
                base = repo_root / sub
                if not base.is_dir():
                    continue
                for fpath in base.rglob("*"):
                    if not fpath.is_file():
                        continue
                    norm = fpath.as_posix()
                    if any(skip in norm for skip in ("/node_modules/", "/__pycache__/", "/dist/", "/data/")):
                        continue
                    try:
                        candidates.append((fpath.stat().st_mtime, fpath.relative_to(repo_root).as_posix()))
                    except Exception:
                        continue
            candidates.sort(key=lambda pair: pair[0], reverse=True)
            for mtime, rel in candidates[:60]:
                dt = datetime.fromtimestamp(mtime)
                working_files.append({
                    "path": rel,
                    "status": "Updated",
                    "dateKey": dt.strftime("%Y-%m-%d"),
                    "timeLabel": cls._format_time_12h(dt),
                    "surface": cls._infer_update_surface(rel),
                })

        # Group both working-tree changes & commits cleanly by dateKey (descending)
        grouped: Dict[str, Dict[str, Any]] = {}

        def ensure_group(dkey: str) -> Dict[str, Any]:
            if dkey not in grouped:
                grouped[dkey] = {
                    "dateKey": dkey,
                    "dateLabel": cls._format_date_label(dkey),
                    "isToday": dkey == today_key,
                    "surfaces": [],
                    "commits": [],
                    "workingFiles": [],
                }
            return grouped[dkey]

        for wf in working_files:
            grp = ensure_group(wf["dateKey"])
            grp["workingFiles"].append(wf)
            if wf["surface"] not in grp["surfaces"]:
                grp["surfaces"].append(wf["surface"])

        for c in commits_list:
            grp = ensure_group(c["dateKey"])
            grp["commits"].append(c)
            for surf in c["surfaces"]:
                if surf not in grp["surfaces"]:
                    grp["surfaces"].append(surf)

        date_groups = sorted(grouped.values(), key=lambda g: g["dateKey"], reverse=True)
        for g in date_groups:
            g["workingFiles"].sort(key=lambda f: f["path"])

        return {
            "source": source_mode,
            "generatedAt": datetime.now(timezone.utc).isoformat(),
            "generatedTimeLabel": cls._format_time_12h(datetime.now()),
            "todayKey": today_key,
            "totalDates": len(date_groups),
            "totalCommits": len(commits_list),
            "totalWorkingFiles": len(working_files),
            "dateGroups": date_groups,
        }
