"""
Live Host Hardware Inspector, Hardware Code Decoder Engine, and Cross-Platform Telemetry Collectors.

100% live OS/hardware discovery — zero hardcoded machine specs or mock arrays.
Separates:
  - Static hardware discovery (cached in-memory with manual rescan)
  - Fast live telemetry (~32ms: CPU, cores, RAM, Disk/Net throughput deltas, battery)
  - Slow telemetry (~5s background cycle: Swap, Wi-Fi radio, GPU load, Processes, Listening Ports)
"""

from __future__ import annotations

import base64
from concurrent.futures import ThreadPoolExecutor
import ctypes
from ctypes import wintypes
import datetime
import json
import math
import os
import platform
import re
import shutil
import socket
import struct
import subprocess
import sys
import threading
import time
from typing import Any, Dict, List, Optional, Tuple

try:
    import winreg
except ImportError:  # pragma: no cover - non-Windows hosts
    winreg = None  # type: ignore[assignment]

import psutil

from shared.extractors.system_decoders import (
    AMD_FAMILY_MAP,
    BATTERY_CHEMISTRY_MAP,
    BATTERY_STATUS_MAP,
    CHASSIS_TYPES,
    COMMON_PORT_SERVICES,
    CPU_SOCKETS,
    EDID_VENDORS,
    INTEL_MODEL_MAP,
    IPV4_CONNECTIVITY_MAP,
    JEDEC_RAM_VENDORS,
    MEMORY_FORM_FACTORS,
    NET_CATEGORY_MAP,
    PART_PREFIX_VENDORS,
    PARTITION_STYLES,
    PCI_VENDORS,
    SMBIOS_MEMORY_TYPES,
    SOUL_PORTAL_PORTS,
    STORAGE_BUS_TYPES,
    STORAGE_HEALTH_STATES,
    STORAGE_MEDIA_TYPES,
    STORAGE_OP_STATUS,
    WORKSPACE_APP_PORTS,
    _classify_ip_scope,
    _ensure_list,
    _infer_port_service_label,
    _redact_cmdline,
    _wifi_band_from_channel,
    _wifi_generation_label,
    compute_display_geometry,
    decode_cpu_microarchitecture,
    decode_pci_ids,
    decode_ram_vendor,
    derive_cpu_topology,
    filter_clean_pnp_devices,
    format_sector_alignment,
    parse_wmi_date,
    parse_wmi_datetime_iso,
)

# ---------------------------------------------------------------------------
# Live Wi-Fi & NVIDIA Helpers (Zero Hardcode)
# ---------------------------------------------------------------------------


def probe_wifi_interfaces_windows() -> List[Dict[str, Any]]:
    if sys.platform != "win32":
        return []
    try:
        res = subprocess.run(
            ["netsh", "wlan", "show", "interfaces"],
            capture_output=True,
            text=True,
            timeout=3,
        )
        if res.returncode != 0 or not res.stdout:
            return []
    except Exception:
        return []

    interfaces: List[Dict[str, Any]] = []
    current: Dict[str, Any] = {}
    for line in res.stdout.splitlines():
        if ":" not in line:
            continue
        key, _, val = line.partition(":")
        k = key.strip().lower()
        v = val.strip()
        if k == "name":
            if current:
                interfaces.append(current)
            current = {"name": v}
        elif current:
            if k == "description":
                current["description"] = v
            elif k == "state":
                current["state"] = v
            elif k == "ssid":
                current["ssid"] = v
            elif k in ("ap bssid", "bssid"):
                current["bssid"] = v
            elif k == "radio type":
                current["radioType"] = v
                current["standardLabel"] = _wifi_generation_label(v)
            elif k == "authentication":
                current["authentication"] = v
            elif k == "channel":
                try:
                    ch = int(v)
                except ValueError:
                    ch = None
                current["channel"] = ch
                current["band"] = _wifi_band_from_channel(ch, current.get("radioType", ""))
            elif k.startswith("receive rate"):
                try:
                    current["rxRateMbps"] = float(v)
                except ValueError:
                    pass
            elif k.startswith("transmit rate"):
                try:
                    current["txRateMbps"] = float(v)
                except ValueError:
                    pass
            elif k == "signal":
                m = re.search(r"(\d+)", v)
                if m:
                    current["signalPercent"] = int(m.group(1))
    if current:
        interfaces.append(current)

    for iface in interfaces:
        if "band" not in iface and iface.get("radioType"):
            iface["band"] = _wifi_band_from_channel(iface.get("channel"), iface["radioType"])
    return interfaces


def probe_nvidia_smi() -> Optional[List[Dict[str, Any]]]:
    if not shutil.which("nvidia-smi"):
        return None
    try:
        res = subprocess.run(
            [
                "nvidia-smi",
                "--query-gpu=name,utilization.gpu,memory.used,memory.total,temperature.gpu,power.draw,clocks.gr,fan.speed",
                "--format=csv,noheader,nounits",
            ],
            capture_output=True,
            text=True,
            timeout=2,
        )
        if res.returncode != 0 or not res.stdout.strip():
            return None
        gpus: List[Dict[str, Any]] = []
        for row in res.stdout.strip().splitlines():
            parts = [p.strip() for p in row.split(",")]
            if len(parts) < 4:
                continue

            def _num(idx: int) -> Optional[float]:
                if idx >= len(parts) or parts[idx] in ("[N/A]", "N/A", ""):
                    return None
                try:
                    return float(parts[idx])
                except ValueError:
                    return None

            gpus.append(
                {
                    "name": parts[0],
                    "utilizationPercent": _num(1),
                    "vramUsedMB": _num(2),
                    "vramTotalMB": _num(3),
                    "temperatureC": _num(4),
                    "powerWatts": _num(5),
                    "clockMHz": _num(6),
                    "fanPercent": _num(7),
                }
            )
        return gpus or None
    except Exception:
        return None


def probe_windows_gpu_perf() -> Optional[Dict[str, Any]]:
    """Queries WDDM GPU engine utilization & adapter memory on Windows cleanly."""
    if sys.platform != "win32":
        return None
    ps_script = r"""
$ProgressPreference = 'SilentlyContinue'
$res = @{ engineTotal = $null; engines = @{}; dedicatedUsed = 0; sharedUsed = 0 }
try {
    $eng = Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine -ErrorAction Stop
    if ($eng) {
        $total = 0
        $buckets = @{ "3D" = 0; "Copy" = 0; "VideoDecode" = 0; "VideoEncode" = 0 }
        foreach ($e in $eng) {
            $u = [double]($e.UtilizationPercentage)
            $total += $u
            $nm = [string]$e.Name
            if ($nm -match "engtype_3D") { $buckets["3D"] += $u }
            elseif ($nm -match "engtype_Copy") { $buckets["Copy"] += $u }
            elseif ($nm -match "engtype_VideoDecode") { $buckets["VideoDecode"] += $u }
            elseif ($nm -match "engtype_VideoEncode") { $buckets["VideoEncode"] += $u }
        }
        $res.engineTotal = [math]::Min(100, [math]::Round($total, 1))
        foreach ($k in @($buckets.Keys)) { $buckets[$k] = [math]::Min(100, [math]::Round($buckets[$k], 1)) }
        $res.engines = $buckets
    }
} catch {}
try {
    $mem = Get-CimInstance Win32_PerfFormattedData_GPUPerformanceCounters_GPUAdapterMemory -ErrorAction Stop
    if ($mem) {
        $ded = ($mem | Measure-Object -Property DedicatedUsage -Sum).Sum
        $shr = ($mem | Measure-Object -Property SharedUsage -Sum).Sum
        $res.dedicatedUsed = [int64]($ded)
        $res.sharedUsed = [int64]($shr)
    }
} catch {}
$res | ConvertTo-Json -Compress -Depth 3
"""
    try:
        enc = base64.b64encode(ps_script.encode("utf-16le")).decode("ascii")
        r = subprocess.run(
            ["powershell", "-NoProfile", "-EncodedCommand", enc],
            capture_output=True,
            text=True,
            timeout=6,
        )
        if r.returncode != 0 or not r.stdout.strip():
            return None
        return json.loads(r.stdout.strip())
    except Exception:
        return None


def _probe_single_runtime(spec: Tuple[str, str, List[str], str]) -> Optional[Dict[str, Any]]:
    display_name, binary, args, category = spec
    exe_path = shutil.which(binary)
    if not exe_path:
        return None
    version_str = "Detected"
    size_bytes: Optional[int] = None
    try:
        if os.path.isfile(exe_path):
            size_bytes = os.path.getsize(exe_path)
    except OSError:
        pass
    try:
        proc = subprocess.run(
            [exe_path, *args],
            capture_output=True,
            timeout=4,
        )
        raw_bytes = proc.stdout or proc.stderr or b""
        if b"\x00" in raw_bytes[:32]:
            raw_text = raw_bytes.decode("utf-16-le", errors="replace").replace("\x00", "").strip()
        else:
            raw_text = raw_bytes.decode("utf-8", errors="replace").strip()
        lines = [ln.strip() for ln in raw_text.splitlines() if ln.strip()]
        if lines:
            target = lines[0]
            # Extract clean semver / version token across diverse CLI output styles
            m = re.search(r"(\d+\.\d+(?:\.\d+)*(?:[a-zA-Z0-9._-]+)?)", target)
            if display_name == "OpenSSH" and "OpenSSH" in target:
                version_str = target.split(",")[0].replace("OpenSSH_for_Windows_", "").replace("OpenSSH_", "").strip()
            elif m:
                version_str = m.group(1).lstrip("v").rstrip(",.;")
            else:
                cleaned = re.sub(r"^(git version|Python|Docker version|Version|rustc|cargo|go version go|psql \(PostgreSQL\))\s*", "", target, flags=re.IGNORECASE).strip()
                version_str = cleaned.lstrip("v").split(",")[0].strip()
    except Exception:
        pass
    return {
        "name": display_name,
        "binary": binary,
        "category": category,
        "version": version_str,
        "path": exe_path,
        "sizeBytes": size_bytes,
    }


def detect_developer_runtimes() -> List[Dict[str, Any]]:
    """Dynamically detects locally installed SDKs, package managers, AI/DB/infra CLIs in parallel."""
    candidates = [
        ("Python", "python", ["--version"], "Language / SDK"),
        ("Node.js", "node", ["-v"], "Language / SDK"),
        ("TypeScript", "tsc", ["--version"], "Language / SDK"),
        (".NET SDK", "dotnet", ["--version"], "Language / SDK"),
        ("Java", "java", ["-version"], "Language / SDK"),
        ("Go", "go", ["version"], "Language / SDK"),
        ("Rust", "rustc", ["--version"], "Language / SDK"),
        ("Cargo", "cargo", ["--version"], "Package / Build"),
        ("GCC", "gcc", ["--version"], "Language / SDK"),
        ("Clang", "clang", ["--version"], "Language / SDK"),
        ("npm", "npm", ["-v"], "Package / Build"),
        ("pip", "pip", ["--version"], "Package / Build"),
        ("uv", "uv", ["--version"], "Package / Build"),
        ("pnpm", "pnpm", ["-v"], "Package / Build"),
        ("yarn", "yarn", ["-v"], "Package / Build"),
        ("bun", "bun", ["--version"], "Language / SDK"),
        ("CMake", "cmake", ["--version"], "Package / Build"),
        ("Git", "git", ["--version"], "Package / Build"),
        ("Docker", "docker", ["--version"], "AI / Infra / CLI"),
        ("Ollama", "ollama", ["--version"], "AI / Infra / CLI"),
        ("PostgreSQL (psql)", "psql", ["--version"], "AI / Infra / CLI"),
        ("SQLite", "sqlite3", ["--version"], "AI / Infra / CLI"),
        ("FFmpeg", "ffmpeg", ["-version"], "AI / Infra / CLI"),
        ("OpenSSH", "ssh", ["-V"], "System Shell"),
        ("OpenSSL", "openssl", ["version"], "System Shell"),
        ("PowerShell 7", "pwsh", ["--version"], "System Shell"),
        ("Win PowerShell", "powershell", ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"], "System Shell"),
        ("VS Code", "code", ["--version"], "AI / Infra / CLI"),
        ("Google Cloud", "gcloud", ["--version"], "AI / Infra / CLI"),
        ("Azure CLI", "az", ["--version"], "AI / Infra / CLI"),
        ("WSL", "wsl", ["--version"], "System Shell"),
    ]
    with ThreadPoolExecutor(max_workers=12) as pool:
        results = list(pool.map(_probe_single_runtime, candidates))
    return [item for item in results if item is not None]


_SENSITIVE_ENV_TOKENS = (
    "KEY",
    "SECRET",
    "TOKEN",
    "PASS",
    "PWD",
    "AUTH",
    "CREDENTIAL",
    "PRIVATE",
    "COOKIE",
    "SESSION",
    "DATABASE_URL",
    "CONN",
)


def _decode_startup_location(loc: str) -> str:
    low = loc.lower()
    if low == "startup" or ("startup" in low and not low.startswith("hk")):
        return "Startup Folder"
    if "common startup" in low or "all users" in low:
        return "Common Startup Folder"
    if low.startswith("hku\\") or low.startswith("hkcu\\"):
        return "Current User Registry Run"
    if low.startswith("hklm\\"):
        return "Local Machine Registry Run"
    return loc or "System Startup"


def _startup_scope_category(loc: str) -> str:
    low = loc.lower()
    if low == "startup" or ("startup" in low and not low.startswith("hk")) or "common startup" in low:
        return "Startup Folder"
    if low.startswith("hku\\") or low.startswith("hkcu\\"):
        return "User Registry"
    if low.startswith("hklm\\"):
        return "Machine Registry"
    return "Other"


def _filetime_to_iso_date(ft: int) -> Optional[str]:
    if not ft or ft <= 116444736000000000:
        return None
    try:
        unix_ts = (ft - 116444736000000000) / 10_000_000.0
        dt = datetime.datetime.fromtimestamp(unix_ts, tz=datetime.timezone.utc)
        if 2000 <= dt.year <= 2100:
            return dt.strftime("%Y-%m-%d %H:%M UTC")
    except Exception:
        pass
    return None


def _read_startup_approved_flags() -> Dict[Tuple[str, str, str], Dict[str, Any]]:
    """Reads Windows Task Manager StartupApproved registry flags (enabled/disabled & timestamp)."""
    flags: Dict[Tuple[str, str, str], Dict[str, Any]] = {}
    if sys.platform != "win32" or winreg is None:
        return flags
    hives = ((winreg.HKEY_CURRENT_USER, "hkcu"), (winreg.HKEY_LOCAL_MACHINE, "hklm"))
    for root, hive_name in hives:
        for bucket in ("Run", "Run32", "StartupFolder"):
            reg_path = rf"SOFTWARE\Microsoft\Windows\CurrentVersion\Explorer\StartupApproved\{bucket}"
            try:
                with winreg.OpenKey(root, reg_path) as key:
                    idx = 0
                    while True:
                        try:
                            val_name, val_data, _ = winreg.EnumValue(key, idx)
                            idx += 1
                            if not isinstance(val_data, bytes) or len(val_data) < 1:
                                continue
                            is_enabled = (val_data[0] % 2) == 0
                            disabled_at: Optional[str] = None
                            if not is_enabled and len(val_data) >= 12:
                                ft = struct.unpack_from("<Q", val_data, 4)[0]
                                disabled_at = _filetime_to_iso_date(ft)
                            entry = {"enabled": is_enabled, "disabledAt": disabled_at}
                            low_name = val_name.strip().lower()
                            flags[(hive_name, bucket.lower(), low_name)] = entry
                            stem = re.sub(r"\.(lnk|exe|bat|cmd|vbs|ps1)$", "", low_name)
                            flags.setdefault((hive_name, bucket.lower(), stem), entry)
                        except OSError:
                            break
            except OSError:
                continue
    return flags


def _lookup_startup_approved(
    flags: Dict[Tuple[str, str, str], Dict[str, Any]],
    name: str,
    location: str,
    command: str,
) -> Dict[str, Any]:
    low_loc = location.lower()
    hive = "hklm" if low_loc.startswith("hklm\\") or "common startup" in low_loc else "hkcu"
    if low_loc == "startup" or ("startup" in low_loc and not low_loc.startswith("hk")):
        buckets = ("startupfolder",)
    elif "wow6432node" in low_loc:
        buckets = ("run32", "run")
    else:
        buckets = ("run", "run32")
    candidates = [name.strip().lower()]
    cmd_base = os.path.basename(command.strip().strip('"').split(" ")[0]).lower()
    if cmd_base:
        candidates.append(cmd_base)
        candidates.append(re.sub(r"\.(lnk|exe|bat|cmd)$", "", cmd_base))
    for b in buckets:
        for cand in candidates:
            hit = flags.get((hive, b, cand))
            if hit is not None:
                return hit
    # Fallback across both hives for StartupFolder shortcuts mapped under User
    if "startupfolder" in buckets:
        for h in ("hkcu", "hklm"):
            for cand in candidates:
                hit = flags.get((h, "startupfolder", cand))
                if hit is not None:
                    return hit
    return {"enabled": True, "disabledAt": None}


_PE_INFO_CACHE: Dict[str, Dict[str, Any]] = {}
_PE_CACHE_LOCK = threading.Lock()
_EXE_EXT_RE = re.compile(r"(?i)^(.+?\.(?:exe|bat|cmd|lnk|com|msi|msc|ps1))(?:\s+(.*))?$")


def _split_command_and_args(raw_cmd: str, startup_hint_name: Optional[str] = None, location: str = "") -> Tuple[Optional[str], Optional[str]]:
    cmd = (raw_cmd or "").strip()
    if not cmd:
        return None, None
    exe: Optional[str] = None
    args: Optional[str] = None
    if cmd.startswith('"'):
        end_q = cmd.find('"', 1)
        if end_q > 1:
            exe = cmd[1:end_q].strip()
            args = cmd[end_q + 1 :].strip() or None
    if exe is None:
        m = _EXE_EXT_RE.match(cmd)
        if m:
            exe = m.group(1).strip()
            args = (m.group(2) or "").strip() or None
        else:
            parts = cmd.split(None, 1)
            exe = parts[0] if parts else cmd
            args = parts[1].strip() if len(parts) > 1 else None
    if exe:
        expanded = os.path.expandvars(exe.replace("\\SystemRoot\\", os.environ.get("SystemRoot", r"C:\Windows") + "\\"))
        if expanded.lower().startswith(r"\??\\"):
            expanded = expanded[4:]
        if not os.path.isabs(expanded):
            if "startup" in location.lower() and not location.lower().startswith("hk"):
                for base_dir in (
                    os.path.join(os.environ.get("APPDATA", ""), r"Microsoft\Windows\Start Menu\Programs\Startup"),
                    os.path.join(os.environ.get("ProgramData", ""), r"Microsoft\Windows\Start Menu\Programs\Startup"),
                ):
                    for cand_name in filter(None, [expanded, f"{startup_hint_name}.lnk" if startup_hint_name else None, f"{startup_hint_name}.bat" if startup_hint_name else None]):
                        cand = os.path.join(base_dir, cand_name)
                        if os.path.isfile(cand):
                            expanded = cand
                            break
            if not os.path.isabs(expanded):
                sys_cand = shutil.which(expanded) or os.path.join(os.environ.get("SystemRoot", r"C:\Windows"), "System32", expanded)
                if os.path.isfile(sys_cand):
                    expanded = sys_cand
        exe = expanded
    return exe, args


def _read_pe_metadata(exe_path: Optional[str]) -> Dict[str, Any]:
    if not exe_path:
        return {"exists": False}
    norm = os.path.abspath(exe_path) if os.path.isabs(exe_path) else exe_path
    key = norm.lower()
    with _PE_CACHE_LOCK:
        cached = _PE_INFO_CACHE.get(key)
    if cached is not None:
        return cached
    if not os.path.isfile(norm):
        res: Dict[str, Any] = {"exists": False}
        with _PE_CACHE_LOCK:
            _PE_INFO_CACHE[key] = res
        return res
    res = {"exists": True, "sizeBytes": os.path.getsize(norm)}
    if sys.platform == "win32" and norm.lower().endswith((".exe", ".dll", ".sys")):
        try:
            ver = ctypes.windll.version
            sz = ver.GetFileVersionInfoSizeW(norm, None)
            if sz > 0:
                buf = ctypes.create_string_buffer(sz)
                if ver.GetFileVersionInfoW(norm, 0, sz, buf):
                    lp = ctypes.c_void_p()
                    ln = ctypes.c_uint()
                    if ver.VerQueryValueW(buf, r"\VarFileInfo\Translation", ctypes.byref(lp), ctypes.byref(ln)) and ln.value >= 4:
                        lang, cp = ctypes.cast(lp, ctypes.POINTER(ctypes.c_uint16 * 2)).contents
                        prefix = f"\\StringFileInfo\\{lang:04x}{cp:04x}\\"
                        for src_k, dst_k in (("CompanyName", "publisher"), ("FileDescription", "description"), ("ProductVersion", "version")):
                            vp = ctypes.c_wchar_p()
                            vl = ctypes.c_uint()
                            if ver.VerQueryValueW(buf, prefix + src_k, ctypes.byref(vp), ctypes.byref(vl)) and vl.value and vp.value:
                                cleaned = vp.value.strip()
                                if cleaned:
                                    res[dst_k] = cleaned
        except Exception:
            pass
    with _PE_CACHE_LOCK:
        _PE_INFO_CACHE[key] = res
    return res


def _read_service_registry_metadata() -> Dict[str, Dict[str, Any]]:
    """Reads DelayedAutostart, DependOnService, and LoadOrderGroup from HKLM Services registry."""
    meta: Dict[str, Dict[str, Any]] = {}
    if sys.platform != "win32" or winreg is None:
        return meta
    try:
        with winreg.OpenKey(winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Services") as root:
            i = 0
            while True:
                try:
                    sname = winreg.EnumKey(root, i)
                    i += 1
                    delayed = False
                    deps: List[str] = []
                    group: Optional[str] = None
                    try:
                        with winreg.OpenKey(root, sname) as sk:
                            try:
                                dval, _ = winreg.QueryValueEx(sk, "DelayedAutostart")
                                delayed = bool(int(dval) == 1)
                            except OSError:
                                pass
                            try:
                                dep_val, _ = winreg.QueryValueEx(sk, "DependOnService")
                                if isinstance(dep_val, (list, tuple)):
                                    deps = [str(d).strip() for d in dep_val if str(d).strip()]
                                elif isinstance(dep_val, str) and dep_val.strip():
                                    deps = [dep_val.strip()]
                            except OSError:
                                pass
                            try:
                                gval, _ = winreg.QueryValueEx(sk, "Group")
                                if isinstance(gval, str) and gval.strip():
                                    group = gval.strip()
                            except OSError:
                                pass
                    except OSError:
                        pass
                    if delayed or deps or group:
                        meta[sname.lower()] = {"delayedAutoStart": delayed, "dependencies": deps, "serviceGroup": group}
                except OSError:
                    break
    except OSError:
        pass
    return meta


def collect_windows_services() -> List[Dict[str, Any]]:
    """Collects full Windows OS services with registry flags, dependencies, publisher, account, and RSS RAM."""
    if sys.platform != "win32" or not hasattr(psutil, "win_service_iter"):
        return []
    reg_meta = _read_service_registry_metadata()
    pid_rss_cache: Dict[int, Optional[int]] = {}
    pid_share_counts: Dict[int, int] = {}
    raw_items: List[Dict[str, Any]] = []

    for svc in psutil.win_service_iter():
        try:
            info = svc.as_dict()
            pid = int(info["pid"]) if info.get("pid") else None
            if pid:
                pid_share_counts[pid] = pid_share_counts.get(pid, 0) + 1
            raw_items.append(info)
        except Exception:
            continue

    services: List[Dict[str, Any]] = []
    for info in raw_items:
        try:
            name = str(info.get("name") or "")
            status = str(info.get("status") or "unknown").lower().title()
            start_type_raw = str(info.get("start_type") or "manual").lower().title()
            pid = int(info["pid"]) if info.get("pid") else None
            bin_path = str(info.get("binpath") or "").strip() or None
            account = str(info.get("username") or "").strip() or None
            description = str(info.get("description") or "").strip() or None
            rmeta = reg_meta.get(name.lower(), {})
            delayed = bool(rmeta.get("delayedAutoStart")) and start_type_raw == "Automatic"
            start_mode_label = "Automatic (Delayed)" if delayed else start_type_raw

            exe, args = _split_command_and_args(bin_path or "")
            pe = _read_pe_metadata(exe)
            publisher = pe.get("publisher")
            low_exe = (exe or "").lower()
            is_microsoft = bool(
                (publisher and "microsoft" in publisher.lower())
                or "\\windows\\" in low_exe
                or "\\microsoft\\" in low_exe
            )

            mem_bytes: Optional[int] = None
            if pid:
                if pid not in pid_rss_cache:
                    try:
                        pid_rss_cache[pid] = int(psutil.Process(pid).memory_info().rss)
                    except Exception:
                        pid_rss_cache[pid] = None
                mem_bytes = pid_rss_cache[pid]

            services.append(
                {
                    "name": name,
                    "displayName": str(info.get("display_name") or name),
                    "description": description,
                    "status": status,
                    "startType": start_type_raw,
                    "startModeLabel": start_mode_label,
                    "delayedAutoStart": delayed,
                    "pid": pid,
                    "sharedHostCount": pid_share_counts.get(pid, 1) if pid else 0,
                    "memoryBytes": mem_bytes,
                    "account": account,
                    "binPath": bin_path,
                    "executable": exe,
                    "arguments": args,
                    "publisher": publisher or ("Microsoft Windows" if is_microsoft else None),
                    "isMicrosoft": is_microsoft,
                    "dependencies": rmeta.get("dependencies") or [],
                    "serviceGroup": rmeta.get("serviceGroup"),
                }
            )
        except Exception:
            continue
    services.sort(key=lambda s: (s["status"] != "Running", s["startType"] != "Automatic", s["displayName"].lower()))
    return services


def _read_windows_registry_env_map() -> Tuple[Dict[str, str], Dict[str, str]]:
    """Reads Machine (HKLM) and User (HKCU) persistent environment variables via winreg."""
    machine: Dict[str, str] = {}
    user: Dict[str, str] = {}
    if sys.platform != "win32" or winreg is None:
        return machine, user
    sources = (
        (winreg.HKEY_LOCAL_MACHINE, r"SYSTEM\CurrentControlSet\Control\Session Manager\Environment", machine),
        (winreg.HKEY_CURRENT_USER, r"Environment", user),
    )
    for root, subkey, target in sources:
        try:
            with winreg.OpenKey(root, subkey) as key:
                idx = 0
                while True:
                    try:
                        name, val, _ = winreg.EnumValue(key, idx)
                        idx += 1
                        if isinstance(val, str):
                            target[name.upper()] = val
                    except OSError:
                        break
        except OSError:
            continue
    return machine, user


def _normalize_win_path_token(p: str) -> str:
    expanded = os.path.expandvars(p.strip().strip('"'))
    if sys.platform == "win32":
        expanded = expanded.rstrip("\\/").lower()
    return expanded


def _categorize_env_var(key: str, is_sensitive: bool) -> str:
    if is_sensitive:
        return "Security / Secret"
    up = key.upper()
    if any(t in up for t in ("PATH", "HOME", "ROOT", "DIR", "MODULE", "PYTHON", "NODE", "NPM", "JAVA", "DOTNET", "CUDA", "CARGO", "GO", "RUST", "VSCODE", "CONDA", "VIRTUAL_ENV", "PIP", "DOCKER", "OLLAMA", "GIT")):
        return "Developer / SDK"
    if any(t in up for t in ("COMPUTERNAME", "USERNAME", "USERDOMAIN", "PROCESSOR_", "NUMBER_OF_PROCESSORS", "OS", "WINDIR", "SYSTEMDRIVE", "SYSTEMROOT", "PROGRAM", "APPDATA", "LOCALAPPDATA", "TEMP", "TMP", "PUBLIC", "HOMEDRIVE")):
        return "OS / Identity"
    if any(t in up for t in ("COMSPEC", "PSMODULEPATH", "POWERSHELL", "SHELL", "TERM", "LANG", "LC_", "ENCODING", "COLORTERM", "WT_", "SESSIONNAME")):
        return "Shell & Locale"
    return "Application / Config"


def collect_environment_and_path() -> Dict[str, Any]:
    """Inspects host PATH directories, registry provenance, executables inside each PATH folder, and env vars."""
    import locale

    machine_reg, user_reg = _read_windows_registry_env_map()
    machine_path_set = {_normalize_win_path_token(x) for x in machine_reg.get("PATH", "").split(os.pathsep) if x.strip()}
    user_path_set = {_normalize_win_path_token(x) for x in user_reg.get("PATH", "").split(os.pathsep) if x.strip()}

    raw_path = os.environ.get("PATH") or os.environ.get("Path") or ""
    seen_paths: set[str] = set()
    path_entries: List[Dict[str, Any]] = []
    missing_count = 0
    duplicate_count = 0
    total_executables = 0
    exec_exts = (".exe", ".cmd", ".bat", ".ps1", ".com")

    for part in raw_path.split(os.pathsep):
        cleaned = part.strip().strip('"')
        if not cleaned:
            continue
        norm_key = _normalize_win_path_token(cleaned) or cleaned.lower()
        if norm_key in seen_paths:
            duplicate_count += 1
            continue
        seen_paths.add(norm_key)
        exists = os.path.isdir(cleaned)
        if not exists:
            missing_count += 1

        in_machine = norm_key in machine_path_set
        in_user = norm_key in user_path_set
        if in_machine and in_user:
            registry_source = "Machine + User Registry"
        elif in_machine:
            registry_source = "Machine Registry (HKLM)"
        elif in_user:
            registry_source = "User Registry (HKCU)"
        else:
            registry_source = "Session / Runtime Injected"

        sample_exes: List[str] = []
        exe_count = 0
        if exists:
            try:
                with os.scandir(cleaned) as it:
                    for entry in it:
                        try:
                            if entry.is_file() and entry.name.lower().endswith(exec_exts):
                                exe_count += 1
                                if len(sample_exes) < 8:
                                    sample_exes.append(entry.name)
                        except OSError:
                            continue
            except OSError:
                pass
        total_executables += exe_count

        low = cleaned.lower()
        scope = "Windows / System" if ("windows" in low or "system32" in low or in_machine and not in_user and "program files" not in low) else "Developer / User"
        path_entries.append(
            {
                "index": len(path_entries) + 1,
                "path": cleaned,
                "exists": exists,
                "scope": scope,
                "registrySource": registry_source,
                "executableCount": exe_count,
                "sampleExecutables": sample_exes,
            }
        )

    env_vars: List[Dict[str, Any]] = []
    for k in sorted(os.environ.keys(), key=lambda s: s.upper()):
        if k.upper() == "PATH":
            continue
        val = str(os.environ.get(k) or "")
        k_up = k.upper()
        is_sensitive = any(tok in k_up for tok in _SENSITIVE_ENV_TOKENS)
        in_m = k_up in machine_reg
        in_u = k_up in user_reg
        if in_m and in_u:
            source = "Machine + User Registry"
        elif in_m:
            source = "Machine Registry (HKLM)"
        elif in_u:
            source = "User Registry (HKCU)"
        else:
            source = "Session / Process"
        env_vars.append(
            {
                "key": k,
                "value": "[REDACTED • Sensitive Token]" if is_sensitive else val,
                "isSensitive": is_sensitive,
                "source": source,
                "category": _categorize_env_var(k, is_sensitive),
            }
        )

    pathext_raw = os.environ.get("PATHEXT") or ".COM;.EXE;.BAT;.CMD"
    pathext_list = [p.strip() for p in pathext_raw.split(os.pathsep) if p.strip()]
    shell_profile = {
        "comspec": os.environ.get("COMSPEC") or os.environ.get("SHELL") or "cmd.exe",
        "pathext": pathext_list,
        "tempDir": os.environ.get("TEMP") or os.environ.get("TMP") or "",
        "userProfile": os.environ.get("USERPROFILE") or os.environ.get("HOME") or "",
        "preferredEncoding": locale.getpreferredencoding(False) or "utf-8",
        "fsEncoding": sys.getfilesystemencoding() or "utf-8",
        "virtualEnv": os.environ.get("VIRTUAL_ENV") or os.environ.get("CONDA_PREFIX") or None,
        "machineRegistryCount": len(machine_reg),
        "userRegistryCount": len(user_reg),
    }

    return {
        "pathEntries": path_entries,
        "envVars": env_vars,
        "totalEnvCount": len(env_vars),
        "missingPathCount": missing_count,
        "duplicatePathCount": duplicate_count,
        "totalExecutablesInPath": total_executables,
        "shellProfile": shell_profile,
    }


# ---------------------------------------------------------------------------
# Batched Windows Static CIM / Registry Probe
# ---------------------------------------------------------------------------


def _run_windows_static_probe() -> Dict[str, Any]:
    ps_script = r"""
$ProgressPreference = 'SilentlyContinue'
$OutputEncoding = [Console]::OutputEncoding = [System.Text.Encoding]::UTF8
$out = @{}
try { $out.cs = Get-CimInstance Win32_ComputerSystem | Select-Object Manufacturer,Model,SystemFamily,SystemSKUNumber,SystemType,NumberOfProcessors,NumberOfLogicalProcessors,TotalPhysicalMemory,HypervisorPresent } catch {}
try { $out.os = Get-CimInstance Win32_OperatingSystem | Select-Object Caption,Version,BuildNumber,OSArchitecture,InstallDate,LastBootUpTime } catch {}
try { $out.board = Get-CimInstance Win32_BaseBoard | Select-Object Manufacturer,Product,Version,SerialNumber } catch {}
try { $out.bios = Get-CimInstance Win32_BIOS | Select-Object Manufacturer,SMBIOSBIOSVersion,ReleaseDate,EmbeddedControllerMajorVersion,EmbeddedControllerMinorVersion } catch {}
try { $out.enclosure = Get-CimInstance Win32_SystemEnclosure | Select-Object ChassisTypes,SerialNumber } catch {}
try { $out.cpu = Get-CimInstance Win32_Processor | Select-Object Name,Manufacturer,Caption,ProcessorId,AddressWidth,DataWidth,MaxClockSpeed,ExtClock,CurrentVoltage,NumberOfCores,NumberOfLogicalProcessors,L2CacheSize,L3CacheSize,SocketDesignation,UpgradeMethod,VirtualizationFirmwareEnabled } catch {}
try { $out.caches = Get-CimInstance Win32_CacheMemory | Select-Object Level,InstalledSize,Purpose } catch {}
try { $out.memArray = Get-CimInstance Win32_PhysicalMemoryArray | Select-Object MemoryDevices,MaxCapacity } catch {}
try { $out.dimms = Get-CimInstance Win32_PhysicalMemory | Select-Object BankLabel,DeviceLocator,Manufacturer,PartNumber,SerialNumber,Capacity,Speed,ConfiguredClockSpeed,SMBIOSMemoryType,FormFactor,DataWidth,TotalWidth,ConfiguredVoltage,Attributes } catch {}
try { $out.gpus = Get-CimInstance Win32_VideoController | Select-Object Name,AdapterCompatibility,VideoProcessor,AdapterDACType,AdapterRAM,DriverVersion,DriverDate,InfFilename,PNPDeviceID,CurrentHorizontalResolution,CurrentVerticalResolution,CurrentRefreshRate,CurrentBitsPerPixel,Availability } catch {}
try {
    $out.gpuReg = Get-ItemProperty "HKLM:\SYSTEM\ControlSet001\Control\Class\{4d36e968-e325-11ce-bfc1-08002be10318}\00*" -ErrorAction SilentlyContinue | Select-Object DriverDesc,"HardwareInformation.qwMemorySize",DriverVersion
} catch {}
try {
    Add-Type -AssemblyName System.Windows.Forms -ErrorAction SilentlyContinue
    $out.screens = [System.Windows.Forms.Screen]::AllScreens | ForEach-Object { @{ DeviceName = $_.DeviceName; Primary = $_.Primary; Width = $_.Bounds.Width; Height = $_.Bounds.Height } }
} catch {}
try { $out.monBasic = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorBasicDisplayParams -ErrorAction SilentlyContinue | Select-Object MaxHorizontalImageSize,MaxVerticalImageSize } catch {}
try { $out.physDisks = Get-CimInstance -Namespace root\microsoft\windows\storage -ClassName MSFT_PhysicalDisk -ErrorAction SilentlyContinue | Select-Object FriendlyName,MediaType,BusType,HealthStatus,OperationalStatus,Size,FirmwareVersion,SerialNumber,LogicalSectorSize,PhysicalSectorSize } catch {}
try { $out.disksMeta = Get-CimInstance -Namespace root\microsoft\windows\storage -ClassName MSFT_Disk -ErrorAction SilentlyContinue | Select-Object FriendlyName,PartitionStyle,BusType,LogicalSectorSize,PhysicalSectorSize } catch {}
try { $out.partitions = Get-CimInstance -Namespace root\microsoft\windows\storage -ClassName MSFT_Partition -ErrorAction SilentlyContinue | Select-Object DiskNumber,PartitionNumber,DriveLetter,Type,Size,IsBoot,IsSystem } catch {}
try { $out.sound = Get-CimInstance Win32_SoundDevice | Select-Object Name,Manufacturer,Status,PNPDeviceID } catch {}
try { $out.usb = Get-CimInstance Win32_USBController | Select-Object Name,Manufacturer,PNPDeviceID } catch {}
try {
    $allPnp = Get-CimInstance Win32_PnPEntity -Filter "PNPClass='Camera' OR PNPClass='Image' OR PNPClass='Bluetooth' OR PNPClass='Biometric' OR PNPClass='SecurityDevices' OR PNPDeviceID LIKE 'PCI\\VEN_%' OR PNPDeviceID LIKE 'USB\\VID_%'" -ErrorAction SilentlyContinue | Select-Object Name,Manufacturer,PNPClass,PNPDeviceID,Status
    $out.pnp = @($allPnp | Where-Object { $_.PNPClass -in @('Camera','Image','Bluetooth','Biometric') })
    $out.secDev = @($allPnp | Where-Object { $_.PNPClass -eq 'SecurityDevices' })
    $out.chipset = @($allPnp | Where-Object { $_.PNPDeviceID -like 'PCI\VEN_*' })
    $out.usbDevs = @($allPnp | Where-Object { $_.PNPDeviceID -like 'USB\VID_*' })
} catch {}
try { $out.sysSlots = Get-CimInstance Win32_SystemSlot -ErrorAction SilentlyContinue | Select-Object SlotDesignation,CurrentUsage,MaxDataWidth } catch {}
try { $out.boardPorts = Get-CimInstance Win32_PortConnector -ErrorAction SilentlyContinue | Select-Object ExternalReferenceDesignator,InternalReferenceDesignator,PortType } catch {}
try { $out.physNet = Get-CimInstance Win32_NetworkAdapter -Filter "PhysicalAdapter=True" -ErrorAction SilentlyContinue | Select-Object Name,Manufacturer,MACAddress,Speed,PNPDeviceID,NetConnectionStatus } catch {}
try { $out.battery = Get-CimInstance Win32_Battery | Select-Object Name,Status,BatteryStatus,Chemistry,EstimatedChargeRemaining,DesignVoltage } catch {}
try { $out.batFull = Get-CimInstance -Namespace root\wmi -ClassName BatteryFullChargedCapacity -ErrorAction SilentlyContinue | Select-Object FullChargedCapacity } catch {}
try { $out.batCycle = Get-CimInstance -Namespace root\wmi -ClassName BatteryCycleCount -ErrorAction SilentlyContinue | Select-Object CycleCount } catch {}
try {
    $sb = Get-ItemProperty "HKLM:\SYSTEM\CurrentControlSet\Control\SecureBoot\State" -ErrorAction SilentlyContinue
    if ($sb) { $out.secureBoot = $sb.UEFISecureBootEnabled }
} catch {}
try {
    $biosReg = Get-ItemProperty "HKLM:\HARDWARE\DESCRIPTION\System\BIOS" -ErrorAction SilentlyContinue | Select-Object BIOSVersion,BIOSReleaseDate,SystemSKU
    if ($biosReg) { $out.biosReg = $biosReg }
} catch {}
try { $out.monId = Get-CimInstance -Namespace root\wmi -ClassName WmiMonitorID -ErrorAction SilentlyContinue | Select-Object InstanceName,ManufacturerName,UserFriendlyName,ProductCodeID,YearOfManufacture } catch {}
try { $out.portBat = Get-CimInstance Win32_PortableBattery -ErrorAction SilentlyContinue | Select-Object Name,DesignCapacity,ManufactureDate,Location } catch {}
try { $out.pagefile = Get-CimInstance Win32_PageFileUsage -ErrorAction SilentlyContinue | Select-Object Name,AllocatedBaseSize,CurrentUsage,PeakUsage } catch {}
try { $out.powerCaps = (powercfg /a) -join "`n" } catch {}
try { $out.netDns = Get-DnsClientServerAddress -AddressFamily IPv4 -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,ServerAddresses } catch {}
try { $out.defender = Get-CimInstance -Namespace root\Microsoft\Windows\Defender -ClassName MSFT_MpComputerStatus -ErrorAction SilentlyContinue | Select-Object RealTimeProtectionEnabled,AntivirusEnabled,AntivirusSignatureVersion,AntivirusSignatureAge,QuickScanAge } catch {}
try { $out.netProfile = Get-CimInstance -Namespace root\StandardCimv2 -ClassName MSFT_NetConnectionProfile -ErrorAction SilentlyContinue | Select-Object Name,InterfaceAlias,NetworkCategory,IPv4Connectivity } catch {}
try { $out.powerPlan = (powercfg /getactivescheme) } catch {}
try { $out.startup = Get-CimInstance Win32_StartupCommand | Select-Object Name,Command,Location,User } catch {}
try {
    $out.schedTasks = Get-ScheduledTask -ErrorAction SilentlyContinue | Select-Object TaskName,TaskPath,State,Author,Description,@{N="Trig";E={@($_.Triggers | ForEach-Object { $_.CimClass.CimClassName }) -join ","}},@{N="Exec";E={@($_.Actions | ForEach-Object { if($_.Execute){ ($_.Execute + " " + $_.Arguments).Trim() } }) -join " ; "}}
} catch {}
try {
    $out.sysDrivers = Get-CimInstance Win32_SystemDriver -ErrorAction SilentlyContinue | Select-Object Name,DisplayName,State,StartMode,ServiceType,PathName
} catch {}
try {
    $out.netCfg = Get-NetIPConfiguration -ErrorAction SilentlyContinue | Select-Object InterfaceAlias,InterfaceDescription,@{N="IPv4Gateway";E={($_.IPv4DefaultGateway | ForEach-Object { $_.NextHop }) -join ","}},@{N="DNS";E={($_.DNSServer | Where-Object { $_.AddressFamily -eq 2 } | ForEach-Object { $_.ServerAddresses }) -join ","}}
} catch {}
try {
    $out.sysEvents = Get-WinEvent -FilterHashtable @{LogName="System"; Level=1,2,3; StartTime=(Get-Date).AddDays(-7)} -MaxEvents 20 -ErrorAction SilentlyContinue | Select-Object Id,LevelDisplayName,ProviderName,TimeCreated,Message
} catch {}
try { $out.smart = Get-PhysicalDisk | Get-StorageReliabilityCounter -ErrorAction SilentlyContinue | Select-Object DeviceId,Temperature,Wear,ReadErrorsTotal,WriteErrorsTotal,PowerOnHours } catch {}
try { $out.therm = Get-CimInstance -Namespace root\wmi -ClassName MSAcpi_ThermalZoneTemperature -ErrorAction SilentlyContinue | Select-Object InstanceName,CurrentTemperature } catch {}
try { $out.keyboards = Get-CimInstance Win32_Keyboard | Select-Object Name,Description,Status } catch {}
try { $out.pointing = Get-CimInstance Win32_PointingDevice | Select-Object Name,Manufacturer,Status } catch {}
$out | ConvertTo-Json -Compress -Depth 5
"""
    try:
        enc = base64.b64encode(ps_script.encode("utf-16le")).decode("ascii")
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-EncodedCommand", enc],
            capture_output=True,
            encoding="utf-8",
            errors="replace",
            timeout=60,
        )
        if proc.returncode == 0 and proc.stdout.strip():
            return json.loads(proc.stdout.strip())
    except Exception:
        pass
    return {}


# ---------------------------------------------------------------------------
# Public Extractors: Static Specs + Fast Live + Slow Live + Health Analyzer
# ---------------------------------------------------------------------------


def _detect_cpu_instruction_sets() -> List[str]:
    """Detects live supported SIMD & hardware CPU extensions with zero shell calls."""
    supported: List[str] = []
    if platform.system() == "Windows":
        try:
            k32 = ctypes.windll.kernel32
            checks = (
                (10, "SSE2"),
                (13, "SSE3"),
                (37, "SSE4.1"),
                (38, "SSE4.2"),
                (39, "AVX"),
                (40, "AVX2"),
                (41, "AVX-512"),
                (12, "NX/DEP"),
                (32, "RDTSCP"),
            )
            for pf_id, label in checks:
                if k32.IsProcessorFeaturePresent(pf_id):
                    supported.append(label)
        except Exception:
            pass
    return supported


def get_static_hardware_specs() -> Dict[str, Any]:
    """Builds comprehensive, decoded static computer specifications from live OS probes."""
    raw = _run_windows_static_probe() if sys.platform == "win32" else {}

    cs = raw.get("cs") or {}
    os_info = raw.get("os") or {}
    board = raw.get("board") or {}
    bios = raw.get("bios") or {}
    bios_reg = raw.get("biosReg") or {}
    enclosure = raw.get("enclosure") or {}
    cpu_raw = (_ensure_list(raw.get("cpu")) or [{}])[0]
    mem_arr = (_ensure_list(raw.get("memArray")) or [{}])[0]
    dimms_raw = _ensure_list(raw.get("dimms"))
    gpus_raw = _ensure_list(raw.get("gpus"))
    gpu_reg_list = _ensure_list(raw.get("gpuReg"))
    screens_raw = _ensure_list(raw.get("screens"))
    mon_basic = (_ensure_list(raw.get("monBasic")) or [{}])[0]
    mon_ids = _ensure_list(raw.get("monId"))
    phys_disks_raw = _ensure_list(raw.get("physDisks"))
    disks_meta = _ensure_list(raw.get("disksMeta"))
    sound_raw = _ensure_list(raw.get("sound"))
    usb_raw = _ensure_list(raw.get("usb"))
    usb_devs_raw = _ensure_list(raw.get("usbDevs"))
    pnp_raw = _ensure_list(raw.get("pnp"))
    battery_raw = (_ensure_list(raw.get("battery")) or [{}])[0]
    port_bat_raw = (_ensure_list(raw.get("portBat")) or [{}])[0]
    bat_full = (_ensure_list(raw.get("batFull")) or [{}])[0]
    bat_cycle = (_ensure_list(raw.get("batCycle")) or [{}])[0]
    defender = raw.get("defender") or {}
    net_profiles = _ensure_list(raw.get("netProfile"))
    pagefile_raw = (_ensure_list(raw.get("pagefile")) or [{}])[0]

    vm = psutil.virtual_memory()
    boot_ts = psutil.boot_time()

    # --- Host Identity, Chassis, Firmware & Security ---
    chassis_codes = _ensure_list(enclosure.get("ChassisTypes"))
    chassis_code = int(chassis_codes[0]) if chassis_codes and str(chassis_codes[0]).isdigit() else None
    chassis_name = CHASSIS_TYPES.get(chassis_code, "Workstation / PC") if chassis_code is not None else "Personal Computer"

    power_plan_raw = str(raw.get("powerPlan") or "")
    power_plan_m = re.search(r"\(([^)]+)\)", power_plan_raw)
    power_plan_name = power_plan_m.group(1).strip() if power_plan_m else "System Default"

    sleep_states: List[str] = []
    caps_raw = str(raw.get("powerCaps") or "")
    if caps_raw:
        in_avail = False
        for line in caps_raw.splitlines():
            low_line = line.lower()
            if "sleep states are available" in low_line:
                in_avail = True
                continue
            if "not available" in low_line:
                break
            if in_avail:
                cleaned = line.strip()
                if cleaned and not cleaned.lower().startswith("the "):
                    sleep_states.append(cleaned)

    sec_boot_val = raw.get("secureBoot")
    secure_boot_status = (
        "Enabled" if sec_boot_val == 1 else ("Disabled" if sec_boot_val == 0 else "Unavailable")
    )

    pagefile_info = (
        {
            "path": str(pagefile_raw.get("Name") or "C:\\pagefile.sys").strip(),
            "allocatedMB": int(pagefile_raw.get("AllocatedBaseSize") or 0),
            "currentMB": int(pagefile_raw.get("CurrentUsage") or 0),
            "peakMB": int(pagefile_raw.get("PeakUsage") or 0),
        }
        if pagefile_raw and pagefile_raw.get("Name")
        else None
    )

    host_spec = {
        "hostname": socket.gethostname(),
        "manufacturer": str(cs.get("Manufacturer") or platform.node()).strip(),
        "model": str(cs.get("Model") or platform.machine()).strip(),
        "family": str(cs.get("SystemFamily") or "").strip() or None,
        "sku": str(cs.get("SystemSKUNumber") or bios_reg.get("SystemSKU") or "").strip() or None,
        "chassisType": chassis_name,
        "chassisCode": f"SMBIOS_CHASSIS:{chassis_code}" if chassis_code is not None else None,
        "serialNumber": str(enclosure.get("SerialNumber") or "").strip() or None,
        "architecture": str(os_info.get("OSArchitecture") or platform.machine()),
        "systemType": str(cs.get("SystemType") or f"{platform.machine()} PC"),
        "osName": str(os_info.get("Caption") or f"{platform.system()} {platform.release()}").strip(),
        "osVersion": str(os_info.get("Version") or platform.version()),
        "osBuild": str(os_info.get("BuildNumber") or platform.release()),
        "osInstallDate": parse_wmi_date(os_info.get("InstallDate")),
        "bootTimeEpoch": boot_ts,
        "bootTimeIso": datetime.datetime.fromtimestamp(boot_ts, tz=datetime.timezone.utc).isoformat(),
        "timezone": time.tzname[0] if time.tzname else "Local",
        "powerPlan": power_plan_name,
        "secureBoot": secure_boot_status,
        "defenderAntivirus": bool(defender.get("AntivirusEnabled")) if defender else None,
        "defenderRealTime": bool(defender.get("RealTimeProtectionEnabled")) if defender else None,
        "defenderSignatureVersion": str(defender.get("AntivirusSignatureVersion") or "").strip() or None if defender else None,
        "defenderSignatureAgeDays": int(defender["AntivirusSignatureAge"]) if defender and defender.get("AntivirusSignatureAge") is not None else None,
        "defenderQuickScanAgeDays": int(defender["QuickScanAge"]) if defender and defender.get("QuickScanAge") is not None else None,
        "sleepStates": sleep_states,
        "pagefile": pagefile_info,
    }

    ec_maj = bios.get("EmbeddedControllerMajorVersion")
    ec_min = bios.get("EmbeddedControllerMinorVersion")
    ec_version = f"{int(ec_maj)}.{int(ec_min)}" if ec_maj is not None and ec_min is not None else None

    sec_dev_list = _ensure_list(raw.get("secDev"))
    sec_dev = sec_dev_list[0] if sec_dev_list else None
    tpm_spec: Optional[Dict[str, Any]] = (
        {
            "name": str(sec_dev.get("Name") or "Trusted Platform Module").strip(),
            "manufacturer": str(sec_dev.get("Manufacturer") or "Platform").strip(),
            "status": str(sec_dev.get("Status") or "OK").strip(),
            "pnpId": str(sec_dev.get("PNPDeviceID") or "").strip() or None,
        }
        if sec_dev and sec_dev.get("Name")
        else None
    )

    motherboard_spec = {
        "manufacturer": str(board.get("Manufacturer") or "System Board").strip(),
        "product": str(board.get("Product") or "Integrated").strip(),
        "version": str(board.get("Version") or "1.0").strip(),
        "serialNumber": str(board.get("SerialNumber") or "").strip() or None,
        "biosVendor": str(bios.get("Manufacturer") or board.get("Manufacturer") or "").strip(),
        "biosVersion": str(bios.get("SMBIOSBIOSVersion") or bios_reg.get("BIOSVersion") or "").strip(),
        "biosReleaseDate": parse_wmi_date(bios_reg.get("BIOSReleaseDate") or bios.get("ReleaseDate")),
        "ecVersion": ec_version,
        "tpm": tpm_spec,
    }

    # --- CPU Silicon, Cache Pyramid & Topology ---
    phys_cores = psutil.cpu_count(logical=False) or int(cpu_raw.get("NumberOfCores") or 1)
    log_threads = psutil.cpu_count(logical=True) or int(cpu_raw.get("NumberOfLogicalProcessors") or phys_cores)
    topo = derive_cpu_topology(phys_cores, log_threads)

    # Deduplicate L1/L2/L3 cache blocks from Win32_CacheMemory
    caches_raw = _ensure_list(raw.get("caches"))
    l1_kb = sum(int(c.get("InstalledSize") or 0) for c in caches_raw if c.get("Level") == 3)
    l2_kb = int(cpu_raw.get("L2CacheSize") or sum(int(c.get("InstalledSize") or 0) for c in caches_raw if c.get("Level") == 4))
    l3_kb = int(cpu_raw.get("L3CacheSize") or 0)
    if l3_kb == 0:
        l3_vals = [int(c.get("InstalledSize") or 0) for c in caches_raw if c.get("Level") == 5]
        l3_kb = max(l3_vals) if l3_vals else 0

    freq = psutil.cpu_freq()
    max_mhz = int(cpu_raw.get("MaxClockSpeed") or (freq.max if freq and freq.max else 0))
    upgrade_code = int(cpu_raw.get("UpgradeMethod") or 0)
    socket_code = str(cpu_raw.get("SocketDesignation") or "Integrated").strip()
    socket_desc = CPU_SOCKETS.get(upgrade_code) or socket_code

    cpu_caption = str(cpu_raw.get("Caption") or platform.machine()).strip()
    cpu_vendor = str(cpu_raw.get("Manufacturer") or "").strip() or "CPU Vendor"
    microarch = decode_cpu_microarchitecture(cpu_caption, cpu_vendor)

    vtx_fw = cpu_raw.get("VirtualizationFirmwareEnabled")
    hv_present = bool(cs.get("HypervisorPresent"))
    virtualization_enabled: Optional[bool] = (
        True if (vtx_fw is True or hv_present) else (False if vtx_fw is False else None)
    )
    ext_clock = cpu_raw.get("ExtClock")
    raw_volt = cpu_raw.get("CurrentVoltage")
    core_volt = round((int(raw_volt) & 0x7F) / 10.0, 2) if raw_volt and int(raw_volt) > 0 else None

    cpu_spec = {
        "name": str(cpu_raw.get("Name") or platform.processor() or "Host Processor").strip(),
        "vendor": cpu_vendor,
        "caption": cpu_caption,
        "microarchitecture": microarch["architecture"],
        "siliconStepping": microarch["steppingTag"],
        "processorId": str(cpu_raw.get("ProcessorId") or "").strip() or None,
        "socket": socket_code,
        "socketPackage": socket_desc,
        "physicalCores": phys_cores,
        "logicalThreads": log_threads,
        "topologyMode": topo["mode"],
        "performanceCores": topo["performanceCores"],
        "efficientCores": topo["efficientCores"],
        "maxClockMHz": max_mhz,
        "extClockMHz": int(ext_clock) if ext_clock else None,
        "coreVoltageV": core_volt,
        "l1CacheKB": l1_kb,
        "l2CacheKB": l2_kb,
        "l3CacheKB": l3_kb,
        "addressWidth": int(cpu_raw.get("AddressWidth") or 64),
        "dataWidth": int(cpu_raw.get("DataWidth") or 64),
        "virtualizationEnabled": virtualization_enabled,
        "hypervisorPresent": hv_present,
        "instructionSets": _detect_cpu_instruction_sets(),
    }

    # --- Memory (RAM) & Physical DIMM Slots ---
    total_slots = int(mem_arr.get("MemoryDevices") or len(dimms_raw) or 0)
    max_cap_kb = int(mem_arr.get("MaxCapacity") or 0)
    dimm_modules: List[Dict[str, Any]] = []
    installed_bytes = 0
    for idx, d in enumerate(dimms_raw):
        cap = int(d.get("Capacity") or 0)
        installed_bytes += cap
        part_num = str(d.get("PartNumber") or "").strip()
        vendor_info = decode_ram_vendor(d.get("Manufacturer"), part_num)
        mem_type_code = int(d.get("SMBIOSMemoryType") or 0)
        ff_code = int(d.get("FormFactor") or 0)
        data_w = int(d.get("DataWidth") or 64)
        total_w = int(d.get("TotalWidth") or 64)
        volt_mv = int(d.get("ConfiguredVoltage") or 0)
        rank_attr = int(d.get("Attributes") or 0) & 0x0F
        rank_label = (
            "1R (Single Rank)"
            if rank_attr == 1
            else ("2R (Dual Rank)" if rank_attr == 2 else (f"{rank_attr}R" if rank_attr > 0 else None))
        )
        slot_label = str(d.get("DeviceLocator") or f"DIMM {idx + 1}").strip()

        dimm_modules.append(
            {
                "slotIndex": idx + 1,
                "slotName": f"Memory Slot {idx + 1} ({slot_label})",
                "deviceLocator": slot_label,
                "manufacturer": vendor_info["name"],
                "manufacturerCode": vendor_info["code"],
                "partNumber": part_num or "N/A",
                "serialNumber": str(d.get("SerialNumber") or "").strip() or None,
                "capacityBytes": cap,
                "capacityGB": round(cap / (1024**3), 2),
                "ddrType": SMBIOS_MEMORY_TYPES.get(mem_type_code, "DDR RAM"),
                "smbiosCode": f"SMBIOS:{mem_type_code}" if mem_type_code else None,
                "formFactor": MEMORY_FORM_FACTORS.get(ff_code, "DIMM"),
                "formFactorCode": f"FF:{ff_code}" if ff_code else None,
                "ratedSpeedMTs": int(d.get("Speed") or 0),
                "configuredSpeedMTs": int(d.get("ConfiguredClockSpeed") or d.get("Speed") or 0),
                "voltageV": round(volt_mv / 1000.0, 2) if volt_mv > 0 else None,
                "dataWidthBits": data_w,
                "totalWidthBits": total_w,
                "eccStatus": "ECC Supported" if total_w > data_w else "Non-ECC",
                "rank": rank_label,
            }
        )

    if not dimm_modules:
        installed_bytes = int(cs.get("TotalPhysicalMemory") or vm.total)

    usable_bytes = vm.total
    reserved_bytes = max(0, installed_bytes - usable_bytes)
    populated_count = len(dimm_modules)
    channel_mode = (
        f"Dual-Channel ({populated_count} of {total_slots or populated_count} Slots)"
        if populated_count >= 2
        else (f"Single-Channel (1 of {total_slots or 1} Slots)" if populated_count == 1 else "Detected via OS")
    )

    memory_spec = {
        "installedBytes": installed_bytes or usable_bytes,
        "usableBytes": usable_bytes,
        "reservedBytes": reserved_bytes,
        "totalSlots": max(total_slots, populated_count),
        "populatedSlots": populated_count,
        "maxCapacityGB": round(max_cap_kb / (1024 * 1024), 0) if max_cap_kb else None,
        "channelMode": channel_mode,
        "ddrType": dimm_modules[0]["ddrType"] if dimm_modules else "System RAM",
        "formFactor": dimm_modules[0]["formFactor"] if dimm_modules else "Memory",
        "configuredSpeedMTs": dimm_modules[0]["configuredSpeedMTs"] if dimm_modules else None,
        "modules": dimm_modules,
    }

    # --- Graphics (Multi-GPU) & Physical Displays ---
    reg_vram_by_name = {
        str(r.get("DriverDesc") or "").strip().lower(): r.get("HardwareInformation.qwMemorySize")
        for r in gpu_reg_list
        if r.get("DriverDesc")
    }
    nvidia_live = probe_nvidia_smi()
    gpus_spec: List[Dict[str, Any]] = []
    displays_spec: List[Dict[str, Any]] = []

    phys_w_cm = mon_basic.get("MaxHorizontalImageSize")
    phys_h_cm = mon_basic.get("MaxVerticalImageSize")

    for g in gpus_raw:
        g_name = str(g.get("Name") or "Display Adapter").strip()
        pci = decode_pci_ids(g.get("PNPDeviceID"))
        qw_vram = reg_vram_by_name.get(g_name.lower())
        wmi_ram = g.get("AdapterRAM")
        raw_vram = int(qw_vram) if isinstance(qw_vram, (int, float)) and qw_vram > 0 else (int(wmi_ram) if wmi_ram else 0)
        is_integrated = any(tok in g_name.lower() for tok in ("iris", "uhd", "hd graphics", "radeon graphics", "vega"))
        is_virtual = any(tok in g_name.lower() for tok in ("spacedesk", "virtual", "remote", "parsec", "hyper-v"))
        vram_mode = (
            "Virtual Display Adapter"
            if is_virtual
            else ("Unified / Shared System Memory" if (is_integrated and not qw_vram) else "Dedicated VRAM")
        )
        adapter_role = "Virtual" if is_virtual else ("Integrated" if is_integrated else "Discrete")

        gpus_spec.append(
            {
                "name": g_name,
                "role": adapter_role,
                "vendor": pci["vendorName"] or str(g.get("AdapterCompatibility") or "Graphics Vendor").strip(),
                "vendorCode": pci["vendorCode"],
                "deviceCode": pci["deviceCode"],
                "videoProcessor": str(g.get("VideoProcessor") or g_name).strip(),
                "dacType": str(g.get("AdapterDACType") or "Internal").strip(),
                "vramBytes": raw_vram,
                "vramMode": vram_mode,
                "driverVersion": str(g.get("DriverVersion") or "Unknown").strip(),
                "driverDate": parse_wmi_date(g.get("DriverDate")),
                "infFilename": str(g.get("InfFilename") or "").strip() or None,
                "hasNvidiaSmi": bool(nvidia_live and "nvidia" in g_name.lower()),
            }
        )

    # Display Panel Geometry combining Win32_VideoController active output + WinForms Screen + WMI cm
    active_gpu_res = next(
        (g for g in gpus_raw if g.get("CurrentHorizontalResolution") and g.get("CurrentVerticalResolution")),
        None,
    )
    edid_vendors: Dict[str, str] = {
        "LGD": "LG Display",
        "AUO": "AU Optronics",
        "BOE": "BOE Technology",
        "CMN": "Innolux (Chi Mei)",
        "SDC": "Samsung Display",
        "SAM": "Samsung",
        "SHP": "Sharp",
        "DEL": "Dell",
        "LEN": "Lenovo",
        "IVM": "Iiyama",
        "ACR": "Acer",
    }

    def _edid_ascii(arr: Any) -> str:
        if not isinstance(arr, list):
            return ""
        return "".join(chr(b) for b in arr if isinstance(b, int) and 32 <= b <= 126).strip()

    decoded_monitors: List[Dict[str, Any]] = []
    for mid in mon_ids:
        mfg_code = _edid_ascii(mid.get("ManufacturerName"))
        prod_code = _edid_ascii(mid.get("ProductCodeID"))
        friendly = _edid_ascii(mid.get("UserFriendlyName"))
        model_str = friendly or (f"{mfg_code}{prod_code}" if (mfg_code or prod_code) else "")
        decoded_monitors.append(
            {
                "panelManufacturer": edid_vendors.get(mfg_code, mfg_code) if mfg_code else None,
                "panelModel": model_str or None,
                "manufactureYear": int(mid["YearOfManufacture"]) if mid.get("YearOfManufacture") else None,
            }
        )

    if screens_raw:
        for idx, scr in enumerate(screens_raw):
            log_w = scr.get("Width")
            log_h = scr.get("Height")
            nat_w = active_gpu_res.get("CurrentHorizontalResolution") if (active_gpu_res and scr.get("Primary")) else log_w
            nat_h = active_gpu_res.get("CurrentVerticalResolution") if (active_gpu_res and scr.get("Primary")) else log_h
            hz = active_gpu_res.get("CurrentRefreshRate") if (active_gpu_res and scr.get("Primary")) else None
            bpp = active_gpu_res.get("CurrentBitsPerPixel") if (active_gpu_res and scr.get("Primary")) else 32
            geom = compute_display_geometry(nat_w, nat_h, log_w, log_h, phys_w_cm if idx == 0 else None, phys_h_cm if idx == 0 else None)
            edid_meta = decoded_monitors[idx] if idx < len(decoded_monitors) else (decoded_monitors[0] if idx == 0 and decoded_monitors else {})
            displays_spec.append(
                {
                    "name": f"Display {idx + 1}" + (" (Built-in / Primary)" if scr.get("Primary") else ""),
                    "deviceName": str(scr.get("DeviceName") or f"DISPLAY{idx + 1}"),
                    "primary": bool(scr.get("Primary")),
                    "nativeWidth": nat_w,
                    "nativeHeight": nat_h,
                    "logicalWidth": log_w,
                    "logicalHeight": log_h,
                    "refreshRateHz": hz,
                    "bitsPerPixel": bpp,
                    **edid_meta,
                    **geom,
                }
            )
    elif active_gpu_res:
        nat_w = active_gpu_res.get("CurrentHorizontalResolution")
        nat_h = active_gpu_res.get("CurrentVerticalResolution")
        geom = compute_display_geometry(nat_w, nat_h, nat_w, nat_h, phys_w_cm, phys_h_cm)
        edid_meta = decoded_monitors[0] if decoded_monitors else {}
        displays_spec.append(
            {
                "name": "Primary Display",
                "deviceName": "DISPLAY1",
                "primary": True,
                "nativeWidth": nat_w,
                "nativeHeight": nat_h,
                "logicalWidth": nat_w,
                "logicalHeight": nat_h,
                "refreshRateHz": active_gpu_res.get("CurrentRefreshRate"),
                "bitsPerPixel": active_gpu_res.get("CurrentBitsPerPixel") or 32,
                **edid_meta,
                **geom,
            }
        )

    # --- Physical Storage Drives ---
    disk_style_by_name = {
        str(dm.get("FriendlyName") or "").strip().lower(): dm for dm in disks_meta if dm.get("FriendlyName")
    }
    physical_disks: List[Dict[str, Any]] = []
    for pd in phys_disks_raw:
        fname = str(pd.get("FriendlyName") or "Physical Drive").strip()
        extra = disk_style_by_name.get(fname.lower(), {})
        bus_raw = pd.get("BusType")
        media_raw = pd.get("MediaType")
        health_raw = pd.get("HealthStatus")
        op_raw = _ensure_list(pd.get("OperationalStatus"))
        part_raw = extra.get("PartitionStyle")

        bus_label = STORAGE_BUS_TYPES.get(bus_raw, str(bus_raw or "Storage"))
        media_label = STORAGE_MEDIA_TYPES.get(media_raw, str(media_raw or "Disk"))
        health_label = STORAGE_HEALTH_STATES.get(health_raw, str(health_raw or "Healthy"))
        op_code = op_raw[0] if op_raw else 2
        op_label = STORAGE_OP_STATUS.get(op_code, str(op_code or "OK"))
        part_label = PARTITION_STYLES.get(part_raw, str(part_raw or "GPT"))

        l_sec = int(pd.get("LogicalSectorSize") or extra.get("LogicalSectorSize") or 512)
        p_sec = int(pd.get("PhysicalSectorSize") or extra.get("PhysicalSectorSize") or 4096)
        physical_disks.append(
            {
                "model": fname,
                "mediaType": media_label,
                "busType": bus_label,
                "busCode": f"BUS:{bus_raw}" if bus_raw is not None else "",
                "healthStatus": health_label,
                "operationalStatus": op_label,
                "sizeBytes": int(pd.get("Size") or 0),
                "firmwareVersion": str(pd.get("FirmwareVersion") or "").strip() or None,
                "serialNumber": str(pd.get("SerialNumber") or "").strip() or None,
                "partitionStyle": part_label,
                "logicalSectorSize": l_sec,
                "physicalSectorSize": p_sec,
                "sectorAlignment": format_sector_alignment(l_sec, p_sec),
            }
        )

    # --- Battery Static Specs ---
    battery_spec: Optional[Dict[str, Any]] = None
    bat_ps = psutil.sensors_battery()
    if battery_raw or bat_ps is not None:
        chem_code = int(battery_raw.get("Chemistry") or 2) if battery_raw else 2
        full_mwh = int(bat_full["FullChargedCapacity"]) if bat_full.get("FullChargedCapacity") else None
        design_mwh = int(port_bat_raw["DesignCapacity"]) if port_bat_raw.get("DesignCapacity") else None
        design_mv = battery_raw.get("DesignVoltage") if battery_raw else None
        health_pct = round(min(100.0, (full_mwh / design_mwh) * 100.0), 1) if (full_mwh and design_mwh and design_mwh > 0) else None
        wear_pct = round(max(0.0, 100.0 - health_pct), 1) if health_pct is not None else None
        battery_spec = {
            "name": str(battery_raw.get("Name") or port_bat_raw.get("Name") or "System Battery").strip() if (battery_raw or port_bat_raw) else "System Battery",
            "status": str(battery_raw.get("Status") or "OK") if battery_raw else "OK",
            "chemistry": BATTERY_CHEMISTRY_MAP.get(chem_code, "Rechargeable Pack"),
            "fullChargeCapacityMWh": full_mwh,
            "fullChargeCapacityWh": round(full_mwh / 1000.0, 2) if full_mwh else None,
            "designCapacityMWh": design_mwh,
            "designCapacityWh": round(design_mwh / 1000.0, 2) if design_mwh else None,
            "healthPercent": health_pct,
            "wearPercent": wear_pct,
            "manufactureDate": parse_wmi_date(port_bat_raw.get("ManufactureDate")),
            "location": str(port_bat_raw.get("Location") or "").strip() or None,
            "cycleCount": int(bat_cycle.get("CycleCount")) if bat_cycle.get("CycleCount") is not None else None,
            "designVoltageV": round(int(design_mv) / 1000.0, 2) if design_mv else None,
        }

    # --- Peripherals (Audio, USB, Cameras, Filtered Bluetooth) & Runtimes ---
    audio_devices = [
        {
            "name": str(a.get("Name") or "").strip(),
            "manufacturer": str(a.get("Manufacturer") or "Audio").strip(),
            "status": str(a.get("Status") or "OK"),
        }
        for a in sound_raw
        if a.get("Name")
    ]
    usb_controllers = [
        {
            "name": str(u.get("Name") or "").strip(),
            "manufacturer": str(u.get("Manufacturer") or "Controller").strip(),
            "vendor": decode_pci_ids(u.get("PNPDeviceID"))["vendorName"],
        }
        for u in usb_raw
        if u.get("Name")
    ]
    cleaned_pnp = filter_clean_pnp_devices(pnp_raw)

    net_profile_list: List[Dict[str, Any]] = []
    for np in net_profiles:
        cat_code = int(np.get("NetworkCategory") or 0)
        ipv4_code = int(np.get("IPv4Connectivity") or 0)
        net_profile_list.append(
            {
                "name": str(np.get("Name") or "Network").strip(),
                "interfaceAlias": str(np.get("InterfaceAlias") or "").strip(),
                "category": NET_CATEGORY_MAP.get(cat_code, "Public Network"),
                "connectivity": IPV4_CONNECTIVITY_MAP.get(ipv4_code, "Connected"),
            }
        )

    startup_raw = _ensure_list(raw.get("startup"))
    keyboards_raw = _ensure_list(raw.get("keyboards"))
    pointing_raw = _ensure_list(raw.get("pointing"))

    keyboards = [
        {"name": str(k.get("Name") or k.get("Description") or "Keyboard").strip(), "manufacturer": "HID", "status": str(k.get("Status") or "OK")}
        for k in keyboards_raw
        if k.get("Name") or k.get("Description")
    ]
    pointing_devices = [
        {"name": str(p.get("Name") or "Pointing Device").strip(), "manufacturer": str(p.get("Manufacturer") or "HID").strip(), "status": str(p.get("Status") or "OK")}
        for p in pointing_raw
        if p.get("Name")
    ]
    approved_flags = _read_startup_approved_flags()
    startup_apps: List[Dict[str, Any]] = []
    for s in startup_raw:
        if not s.get("Name"):
            continue
        st_name = str(s.get("Name") or "Startup Entry").strip()
        st_cmd = str(s.get("Command") or "").strip()
        st_loc = str(s.get("Location") or "").strip()
        gate = _lookup_startup_approved(approved_flags, st_name, st_loc, st_cmd)
        exe, args = _split_command_and_args(st_cmd, startup_hint_name=st_name, location=st_loc)
        pe = _read_pe_metadata(exe)
        startup_apps.append(
            {
                "name": st_name,
                "command": st_cmd,
                "location": st_loc,
                "locationType": _decode_startup_location(st_loc),
                "scopeCategory": _startup_scope_category(st_loc),
                "user": str(s.get("User") or "").strip() or None,
                "enabled": gate["enabled"],
                "disabledAt": gate["disabledAt"],
                "executable": exe,
                "arguments": args,
                "fileExists": pe.get("exists", False),
                "fileSizeBytes": pe.get("sizeBytes"),
                "publisher": pe.get("publisher"),
                "description": pe.get("description"),
                "version": pe.get("version"),
            }
        )
    startup_apps.sort(key=lambda x: (not x["enabled"], x["scopeCategory"], x["name"].lower()))

    task_state_map = {0: "Unknown", 1: "Disabled", 2: "Queued", 3: "Ready", 4: "Running"}
    trig_label_map = {
        "MSFT_TaskLogonTrigger": "Logon",
        "MSFT_TaskBootTrigger": "Boot",
        "MSFT_TaskDailyTrigger": "Daily",
        "MSFT_TaskWeeklyTrigger": "Weekly",
        "MSFT_TaskMonthlyTrigger": "Monthly",
        "MSFT_TaskTimeTrigger": "Scheduled",
        "MSFT_TaskIdleTrigger": "On Idle",
        "MSFT_TaskEventTrigger": "Event",
        "MSFT_TaskRegistrationTrigger": "Registration",
        "MSFT_TaskSessionStateChangeTrigger": "Session Change",
    }
    scheduled_tasks: List[Dict[str, Any]] = []
    for t in _ensure_list(raw.get("schedTasks")):
        t_name = str(t.get("TaskName") or "").strip()
        if not t_name:
            continue
        t_path = str(t.get("TaskPath") or "\\").strip()
        raw_state = t.get("State")
        if isinstance(raw_state, int):
            state_str = task_state_map.get(raw_state, "Ready")
        else:
            state_str = str(raw_state or "Ready").strip().title()
        raw_trigs = [x.strip() for x in str(t.get("Trig") or "").split(",") if x.strip()]
        decoded_trigs: List[str] = []
        for tr in raw_trigs:
            lbl = trig_label_map.get(tr, tr.replace("MSFT_Task", "").replace("Trigger", ""))
            if lbl and lbl not in decoded_trigs:
                decoded_trigs.append(lbl)
        t_cmd = str(t.get("Exec") or "").strip() or None
        is_vendor = not t_path.lower().startswith("\\microsoft\\windows\\")
        scheduled_tasks.append(
            {
                "name": t_name,
                "taskPath": t_path,
                "state": state_str,
                "enabled": state_str.lower() != "disabled",
                "author": str(t.get("Author") or "").strip() or None,
                "description": str(t.get("Description") or "").strip() or None,
                "triggers": decoded_trigs or ["On Demand"],
                "command": t_cmd,
                "category": "Vendor / User Task" if is_vendor else "Windows Scheduled",
                "isVendorTask": is_vendor,
            }
        )
    scheduled_tasks.sort(key=lambda t: (not t["isVendorTask"], not t["enabled"], t["state"] != "Running", t["name"].lower()))

    system_drivers: List[Dict[str, Any]] = []
    for drv in _ensure_list(raw.get("sysDrivers")):
        d_name = str(drv.get("Name") or "").strip()
        if not d_name:
            continue
        d_display = str(drv.get("DisplayName") or d_name).strip()
        d_path = str(drv.get("PathName") or "").strip() or None
        low_p = (d_path or "").lower()
        low_d = d_display.lower()
        is_third_party = bool(
            "driverstore\\filerepository" in low_p
            or ("microsoft" not in low_d and "windows" not in low_d and "ntfs" not in d_name.lower() and "\\system32\\drivers\\" in low_p and not d_name.lower().startswith("ms"))
        )
        system_drivers.append(
            {
                "name": d_name,
                "displayName": d_display,
                "state": str(drv.get("State") or "Unknown").strip().title(),
                "startMode": str(drv.get("StartMode") or "Manual").strip().title(),
                "serviceType": str(drv.get("ServiceType") or "Kernel Driver").strip(),
                "pathName": d_path,
                "isThirdParty": is_third_party,
            }
        )
    drv_stage_prio = {"Boot": 0, "System": 1, "Auto": 2, "Manual": 3, "Disabled": 4}
    system_drivers.sort(key=lambda d: (d["state"] != "Running", drv_stage_prio.get(d["startMode"], 9), d["displayName"].lower()))

    # --- Deep Hardware: PCIe Silicon, Expansion Slots, Board Headers, GPT Partitions & Physical Radios ---
    pcie_priority = {"Display": 0, "SCSIAdapter": 1, "Net": 2, "USB": 3, "HDC": 4, "System": 5}
    pcie_devices: List[Dict[str, Any]] = []
    for item in _ensure_list(raw.get("chipset")):
        name = str(item.get("Name") or "").strip()
        pnp_id = str(item.get("PNPDeviceID") or "").strip()
        if not name or not pnp_id:
            continue
        decoded = decode_pci_ids(pnp_id)
        pnp_class = str(item.get("PNPClass") or "System").strip()
        pcie_devices.append(
            {
                "name": name,
                "vendor": decoded["vendorName"] or str(item.get("Manufacturer") or "PCIe Silicon").strip(),
                "vendorCode": decoded["vendorCode"],
                "deviceCode": decoded["deviceCode"],
                "pnpClass": pnp_class,
                "status": str(item.get("Status") or "OK").strip(),
                "pnpId": pnp_id,
            }
        )
    pcie_devices.sort(key=lambda d: (pcie_priority.get(d["pnpClass"], 9), 0 if "gna" in d["name"].lower() else 1, d["name"].lower()))

    slot_width_map = {5: "x1 Lane", 8: "x1", 9: "x2", 10: "x4 / M.2", 11: "x8", 12: "x16"}
    expansion_slots: List[Dict[str, Any]] = []
    for slot in _ensure_list(raw.get("sysSlots")):
        usage_code = int(slot.get("CurrentUsage") or 0)
        width_code = int(slot.get("MaxDataWidth") or 0)
        expansion_slots.append(
            {
                "name": str(slot.get("SlotDesignation") or "PCIe Slot").strip(),
                "inUse": usage_code == 4,
                "statusLabel": "In Use" if usage_code == 4 else ("Available" if usage_code == 3 else "Detected"),
                "widthLabel": slot_width_map.get(width_code, "PCIe"),
            }
        )

    port_type_map = {13: "Keyboard", 14: "Mouse", 16: "USB", 31: "Ethernet / RJ45", 28: "Audio", 33: "Thunderbolt"}
    board_connectors: List[Dict[str, Any]] = []
    for conn in _ensure_list(raw.get("boardPorts")):
        ext_ref = str(conn.get("ExternalReferenceDesignator") or "").strip()
        int_ref = str(conn.get("InternalReferenceDesignator") or "").strip()
        if (not ext_ref or ext_ref.lower() == "none") and (not int_ref or int_ref.lower() == "none"):
            continue
        p_code = int(conn.get("PortType") or 0)
        board_connectors.append(
            {
                "externalName": "" if ext_ref.lower() == "none" else ext_ref,
                "internalName": "" if int_ref.lower() == "none" else int_ref,
                "kind": port_type_map.get(p_code, "Board Header" if not ext_ref or ext_ref.lower() == "none" else "External Port"),
            }
        )

    disk_partitions: List[Dict[str, Any]] = []
    for part in _ensure_list(raw.get("partitions")):
        dl = str(part.get("DriveLetter") or "").strip()
        is_boot = bool(part.get("IsBoot"))
        is_sys = bool(part.get("IsSystem"))
        raw_ptype = str(part.get("Type") or "").strip()
        ptype_clean = (
            "EFI System"
            if is_sys
            else ("Windows Boot" if is_boot else (raw_ptype if raw_ptype and raw_ptype.lower() != "partition" else "GPT Volume"))
        )
        disk_partitions.append(
            {
                "diskNumber": int(part.get("DiskNumber") or 0),
                "partitionNumber": int(part.get("PartitionNumber") or 0),
                "driveLetter": f"{dl}:\\" if dl and dl != "\x00" else None,
                "type": ptype_clean,
                "sizeBytes": int(part.get("Size") or 0),
                "isBoot": is_boot,
                "isSystem": is_sys,
            }
        )

    physical_net_hw: List[Dict[str, Any]] = []
    for nic in _ensure_list(raw.get("physNet")):
        name = str(nic.get("Name") or "").strip()
        if not name:
            continue
        raw_spd = nic.get("Speed")
        spd_mbps: Optional[float] = None
        if isinstance(raw_spd, (int, float)) and 0 < raw_spd < 1_000_000_000_000:
            spd_mbps = round(float(raw_spd) / 1_000_000.0, 1)
        physical_net_hw.append(
            {
                "name": name,
                "manufacturer": str(nic.get("Manufacturer") or "Network Silicon").strip(),
                "macAddress": str(nic.get("MACAddress") or "").strip() or None,
                "speedMbps": spd_mbps,
                "connected": int(nic.get("NetConnectionStatus") or 0) == 2,
                "pnpId": str(nic.get("PNPDeviceID") or "").strip(),
            }
        )

    usb_vid_vendors: Dict[str, str] = {
        "0BDA": "Realtek Semiconductor",
        "8086": "Intel Corporation",
        "04CA": "Lite-On Technology",
        "046D": "Logitech",
        "045E": "Microsoft",
        "05AC": "Apple",
        "0C45": "Microdia / Sonix",
        "13D3": "IMC Networks",
        "27C6": "Goodix Biometrics",
        "06CB": "Synaptics",
    }
    usb_devices: List[Dict[str, Any]] = []
    seen_usb_keys: set[str] = set()
    for ud in usb_devs_raw:
        u_name = str(ud.get("Name") or "").strip()
        u_id = str(ud.get("PNPDeviceID") or "").strip()
        if not u_name or not u_id:
            continue
        vid_m = re.search(r"VID_([0-9A-F]{4})", u_id, re.I)
        pid_m = re.search(r"PID_([0-9A-F]{4})", u_id, re.I)
        vid = vid_m.group(1).upper() if vid_m else ""
        pid = pid_m.group(1).upper() if pid_m else ""
        dedup_k = f"{u_name.lower()}|{vid}|{pid}"
        if dedup_k in seen_usb_keys:
            continue
        seen_usb_keys.add(dedup_k)
        usb_devices.append(
            {
                "name": u_name,
                "manufacturer": str(ud.get("Manufacturer") or "USB Device").strip(),
                "class": str(ud.get("PNPClass") or "USB").strip(),
                "status": str(ud.get("Status") or "OK").strip(),
                "vendor": usb_vid_vendors.get(vid),
                "code": f"VID_{vid}&PID_{pid}" if vid and pid else None,
            }
        )

    dns_servers: List[Dict[str, Any]] = []
    for dn in _ensure_list(raw.get("netDns")):
        addrs = [str(a).strip() for a in _ensure_list(dn.get("ServerAddresses")) if str(a).strip()]
        alias = str(dn.get("InterfaceAlias") or "").strip()
        if addrs and alias:
            dns_servers.append({"interfaceAlias": alias, "servers": addrs})

    return {
        "scannedAtIso": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "host": host_spec,
        "motherboard": motherboard_spec,
        "cpu": cpu_spec,
        "memory": memory_spec,
        "graphics": gpus_spec,
        "displays": displays_spec,
        "physicalDisks": physical_disks,
        "battery": battery_spec,
        "networkProfiles": net_profile_list,
        "peripherals": {
            "audio": audio_devices,
            "usbControllers": usb_controllers,
            "usbDevices": usb_devices,
            "cameras": cleaned_pnp["cameras"],
            "bluetooth": cleaned_pnp["bluetooth"],
            "biometrics": cleaned_pnp["biometrics"],
            "keyboards": keyboards,
            "pointingDevices": pointing_devices,
        },
        "pcieDevices": pcie_devices,
        "expansionSlots": expansion_slots,
        "boardConnectors": board_connectors,
        "diskPartitions": disk_partitions,
        "physicalNetworkHw": physical_net_hw,
        "dnsServers": dns_servers,
        "networkGateways": [
            {
                "interfaceAlias": str(nc.get("InterfaceAlias") or "").strip(),
                "description": str(nc.get("InterfaceDescription") or "").strip(),
                "ipv4Gateway": str(nc.get("IPv4Gateway") or "").strip() or None,
                "dnsServers": [s.strip() for s in str(nc.get("DNS") or "").split(",") if s.strip()],
            }
            for nc in _ensure_list(raw.get("netCfg"))
            if nc.get("InterfaceAlias") and (nc.get("IPv4Gateway") or nc.get("DNS"))
        ],
        "systemEvents": [
            {
                "id": int(ev.get("Id") or 0),
                "level": str(ev.get("LevelDisplayName") or "Warning").strip(),
                "provider": str(ev.get("ProviderName") or "Windows System").strip(),
                "timestamp": parse_wmi_datetime_iso(ev.get("TimeCreated")) or "",
                "message": re.sub(r"\s+", " ", str(ev.get("Message") or "")).strip()[:280],
            }
            for ev in _ensure_list(raw.get("sysEvents"))
            if ev.get("ProviderName") or ev.get("Message")
        ],
        "sensorCapabilities": {
            "thermalAvailable": bool(_ensure_list(raw.get("therm"))),
            "nvmeSmartAvailable": bool(_ensure_list(raw.get("smart"))),
            "batteryWearAvailable": bool(battery_spec and battery_spec.get("designCapacityWh")),
            "elevationRequiredForSmartThermal": not bool(_ensure_list(raw.get("smart"))) or not bool(_ensure_list(raw.get("therm"))),
        },
        "startupApps": startup_apps,
        "services": collect_windows_services(),
        "scheduledTasks": scheduled_tasks,
        "systemDrivers": system_drivers,
        "environment": collect_environment_and_path(),
        "runtimes": detect_developer_runtimes(),
    }


def _evaluate_health_posture(
    cpu_pct: float,
    ram_pct: float,
    disk_mbps: float,
    wifi_signal: Optional[int],
    power_plugged: Optional[bool],
    battery_pct: Optional[float],
) -> Dict[str, Any]:
    reasons: List[str] = []
    severity = "optimal"
    label = "Optimal & Balanced"

    if cpu_pct >= 88.0:
        severity = "critical"
        label = "CPU Compute Saturation"
        reasons.append(f"Processor load elevated at {cpu_pct:.0f}%")
    elif cpu_pct >= 72.0:
        severity = "warn"
        label = "Elevated CPU Load"
        reasons.append(f"CPU actively busy ({cpu_pct:.0f}%)")

    if ram_pct >= 88.0:
        severity = "critical"
        label = "High Memory Pressure"
        reasons.append(f"System RAM at {ram_pct:.0f}%")
    elif ram_pct >= 78.0:
        if severity == "optimal":
            severity = "warn"
            label = "Moderate Memory Usage"
        reasons.append(f"RAM utilization {ram_pct:.0f}%")

    if disk_mbps >= 200.0:
        if severity == "optimal":
            severity = "warn"
            label = "Heavy Disk I/O Burst"
        reasons.append(f"Disk throughput {disk_mbps:.1f} MB/s")

    if wifi_signal is not None and wifi_signal < 45:
        if severity == "optimal":
            severity = "warn"
            label = "Weak Wi-Fi Signal"
        reasons.append(f"Wi-Fi signal at {wifi_signal}%")

    if power_plugged is False and battery_pct is not None and battery_pct <= 20:
        severity = "critical" if battery_pct <= 10 else "warn"
        label = "Low Battery Power"
        reasons.append(f"On battery ({battery_pct:.0f}%)")

    if not reasons:
        reasons.append("CPU, memory headroom, storage I/O, and link stability nominal")

    return {"label": label, "severity": severity, "reasons": reasons}


class _PDH_FMT_VALUE_UNION(ctypes.Union):
    _fields_ = [
        ("longValue", wintypes.LONG),
        ("doubleValue", ctypes.c_double),
        ("largeValue", ctypes.c_longlong),
        ("AnsiStringValue", ctypes.c_char_p),
        ("WideStringValue", ctypes.c_wchar_p),
    ]


class _PDH_FMT_COUNTERVALUE(ctypes.Structure):
    _fields_ = [
        ("CStatus", wintypes.DWORD),
        ("value", _PDH_FMT_VALUE_UNION),
    ]


class _WindowsCpuPerfReader:
    """Lightweight persistent Windows PDH reader for live Turbo CPU % Processor Performance."""

    _PDH_FMT_DOUBLE = 0x00000200

    def __init__(self) -> None:
        self._lock = threading.Lock()
        self._initialized = False
        self._available = False
        self._pdh: Any = None
        self._query: Optional[wintypes.HANDLE] = None
        self._counter: Optional[wintypes.HANDLE] = None

    def _init_locked(self) -> None:
        self._initialized = True
        if platform.system() != "Windows":
            return
        try:
            pdh = ctypes.windll.pdh
            pdh.PdhOpenQueryW.argtypes = [wintypes.LPCWSTR, ctypes.c_void_p, ctypes.POINTER(wintypes.HANDLE)]
            pdh.PdhOpenQueryW.restype = ctypes.c_uint32
            pdh.PdhAddEnglishCounterW.argtypes = [
                wintypes.HANDLE,
                wintypes.LPCWSTR,
                ctypes.c_void_p,
                ctypes.POINTER(wintypes.HANDLE),
            ]
            pdh.PdhAddEnglishCounterW.restype = ctypes.c_uint32
            pdh.PdhCollectQueryData.argtypes = [wintypes.HANDLE]
            pdh.PdhCollectQueryData.restype = ctypes.c_uint32
            pdh.PdhGetFormattedCounterValue.argtypes = [
                wintypes.HANDLE,
                wintypes.DWORD,
                ctypes.POINTER(wintypes.DWORD),
                ctypes.POINTER(_PDH_FMT_COUNTERVALUE),
            ]
            pdh.PdhGetFormattedCounterValue.restype = ctypes.c_uint32

            h_query = wintypes.HANDLE()
            if pdh.PdhOpenQueryW(None, None, ctypes.byref(h_query)) != 0:
                return
            h_counter = wintypes.HANDLE()
            if pdh.PdhAddEnglishCounterW(
                h_query,
                r"\Processor Information(_Total)\% Processor Performance",
                None,
                ctypes.byref(h_counter),
            ) != 0:
                return
            pdh.PdhCollectQueryData(h_query)
            time.sleep(0.015)
            self._pdh = pdh
            self._query = h_query
            self._counter = h_counter
            self._available = True
        except Exception:
            self._available = False

    def read_clock_mhz(self, base_mhz: float) -> Optional[int]:
        if base_mhz <= 0:
            return None
        with self._lock:
            if not self._initialized:
                self._init_locked()
            if not self._available or self._pdh is None or self._query is None or self._counter is None:
                return None
            try:
                if self._pdh.PdhCollectQueryData(self._query) != 0:
                    return None
                val = _PDH_FMT_COUNTERVALUE()
                if self._pdh.PdhGetFormattedCounterValue(self._counter, self._PDH_FMT_DOUBLE, None, ctypes.byref(val)) != 0:
                    return None
                if val.CStatus not in (0, 1):
                    return None
                perf_pct = float(val.value.doubleValue)
                if 5.0 <= perf_pct <= 500.0:
                    return int(round(base_mhz * (perf_pct / 100.0)))
            except Exception:
                return None
        return None


_cpu_perf_reader = _WindowsCpuPerfReader()


def collect_fast_telemetry(prev_sample: Optional[Dict[str, Any]] = None) -> Tuple[Dict[str, Any], Dict[str, Any]]:
    """
    Collects core live telemetry in ~32ms:
    CPU per-core %, freq MHz, times split, stats, RAM, storage partitions & IO rates, network IO rates, battery.
    Returns (public_payload, internal_state_for_next_delta).
    """
    now = time.perf_counter()
    now_iso = datetime.datetime.now(datetime.timezone.utc).isoformat()

    curr_per_cpu = psutil.cpu_times(percpu=True)
    prev_per_cpu = prev_sample.get("per_cpu_times") if prev_sample else None
    per_core: List[float] = []
    raw_user = 0.0
    raw_sys = 0.0
    if prev_per_cpu and len(prev_per_cpu) == len(curr_per_cpu):
        for t1, t2 in zip(prev_per_cpu, curr_per_cpu):
            tot_d = 0.0
            for fld in getattr(t2, "_fields", ()):
                if fld in ("guest", "guest_nice"):
                    continue
                tot_d += max(0.0, float(getattr(t2, fld, 0.0)) - float(getattr(t1, fld, 0.0)))
            idle_d = max(0.0, float(getattr(t2, "idle", 0.0)) - float(getattr(t1, "idle", 0.0))) + max(
                0.0, float(getattr(t2, "iowait", 0.0)) - float(getattr(t1, "iowait", 0.0))
            )
            busy_d = max(0.0, tot_d - idle_d)
            raw_user += max(0.0, float(getattr(t2, "user", 0.0)) - float(getattr(t1, "user", 0.0)))
            raw_sys += max(0.0, float(getattr(t2, "system", 0.0)) - float(getattr(t1, "system", 0.0)))
            per_core.append(round(min(100.0, (busy_d / tot_d) * 100.0), 1) if tot_d > 0.0 else 0.0)
    else:
        per_core = [0.0 for _ in curr_per_cpu]

    cpu_total = round(sum(per_core) / len(per_core), 1) if per_core else 0.0
    freq = psutil.cpu_freq()
    base_mhz = float(freq.max or freq.current or 0.0) if freq else 0.0
    pdh_clock_mhz = _cpu_perf_reader.read_clock_mhz(base_mhz)
    live_clock_mhz = pdh_clock_mhz if pdh_clock_mhz else (int(round(freq.current)) if freq and freq.current else 0)
    stats = psutil.cpu_stats()

    vm = psutil.virtual_memory()
    dio = psutil.disk_io_counters()
    nio = psutil.net_io_counters()
    bat = psutil.sensors_battery()

    dt = (now - prev_sample["perfTs"]) if prev_sample and (now - prev_sample["perfTs"]) > 0.05 else 0.0

    disk_read_mbps = 0.0
    disk_write_mbps = 0.0
    disk_read_iops = 0.0
    disk_write_iops = 0.0
    net_rx_kbps = 0.0
    net_tx_kbps = 0.0
    ctx_per_sec = 0.0
    intr_per_sec = 0.0

    if dt > 0 and prev_sample:
        if dio and prev_sample.get("dio"):
            pdio = prev_sample["dio"]
            disk_read_mbps = max(0.0, (dio.read_bytes - pdio.read_bytes) / (1024 * 1024) / dt)
            disk_write_mbps = max(0.0, (dio.write_bytes - pdio.write_bytes) / (1024 * 1024) / dt)
            disk_read_iops = max(0.0, (dio.read_count - pdio.read_count) / dt)
            disk_write_iops = max(0.0, (dio.write_count - pdio.write_count) / dt)
        if nio and prev_sample.get("nio"):
            pnio = prev_sample["nio"]
            net_rx_kbps = max(0.0, (nio.bytes_recv - pnio.bytes_recv) / 1024.0 / dt)
            net_tx_kbps = max(0.0, (nio.bytes_sent - pnio.bytes_sent) / 1024.0 / dt)
        if stats and prev_sample.get("stats"):
            pstats = prev_sample["stats"]
            ctx_per_sec = max(0.0, (stats.ctx_switches - pstats.ctx_switches) / dt)
            intr_per_sec = max(0.0, (stats.interrupts - pstats.interrupts) / dt)

    # Logical Disk Volumes
    volumes: List[Dict[str, Any]] = []
    for part in psutil.disk_partitions(all=False):
        try:
            usage = psutil.disk_usage(part.mountpoint)
            volumes.append(
                {
                    "device": part.device,
                    "mountpoint": part.mountpoint,
                    "fstype": part.fstype or "Unknown",
                    "totalBytes": usage.total,
                    "usedBytes": usage.used,
                    "freeBytes": usage.free,
                    "usedPercent": round(usage.percent, 1),
                }
            )
        except Exception:
            continue

    battery_live: Optional[Dict[str, Any]] = None
    if bat is not None:
        secs_left = bat.secsleft if isinstance(bat.secsleft, (int, float)) and bat.secsleft > 0 else None
        status_label = "AC Power Plugged In" if bat.power_plugged else "Discharging (On Battery)"
        if bat.power_plugged and bat.percent < 99.5:
            status_label = "Charging (AC Connected)"
        battery_live = {
            "percent": round(float(bat.percent), 1),
            "powerPlugged": bool(bat.power_plugged),
            "secsLeft": int(secs_left) if secs_left else None,
            "statusLabel": status_label,
        }

    uptime_seconds = max(0, int(time.time() - psutil.boot_time()))
    raw_active = raw_user + raw_sys
    if raw_active > 0.0:
        user_pct = round(min(cpu_total, cpu_total * (raw_user / raw_active)), 1)
        sys_pct = round(max(0.0, cpu_total - user_pct), 1)
    else:
        user_pct = 0.0
        sys_pct = round(cpu_total, 1) if cpu_total > 0.0 else 0.0
    idle_pct = round(max(0.0, 100.0 - user_pct - sys_pct), 1)

    payload = {
        "timestampIso": now_iso,
        "uptimeSeconds": uptime_seconds,
        "cpu": {
            "totalPercent": cpu_total,
            "perCorePercent": per_core,
            "currentClockMHz": live_clock_mhz,
            "userPercent": user_pct,
            "systemPercent": sys_pct,
            "idlePercent": idle_pct,
            "contextSwitchesPerSec": int(round(ctx_per_sec)),
            "interruptsPerSec": int(round(intr_per_sec)),
        },
        "memory": {
            "totalBytes": vm.total,
            "usedBytes": vm.used,
            "availableBytes": vm.available,
            "freeBytes": getattr(vm, "free", vm.available),
            "percent": round(float(vm.percent), 1),
        },
        "disk": {
            "readMBps": round(disk_read_mbps, 2),
            "writeMBps": round(disk_write_mbps, 2),
            "readIops": round(disk_read_iops, 1),
            "writeIops": round(disk_write_iops, 1),
            "totalReadBytes": dio.read_bytes if dio else 0,
            "totalWriteBytes": dio.write_bytes if dio else 0,
            "volumes": volumes,
        },
        "network": {
            "rxKBps": round(net_rx_kbps, 2),
            "txKBps": round(net_tx_kbps, 2),
            "totalRecvBytes": nio.bytes_recv if nio else 0,
            "totalSentBytes": nio.bytes_sent if nio else 0,
            "dropsIn": nio.dropin if nio else 0,
            "dropsOut": nio.dropout if nio else 0,
            "errorsIn": nio.errin if nio else 0,
            "errorsOut": nio.errout if nio else 0,
        },
        "battery": battery_live,
    }

    next_state = {
        "perfTs": now,
        "per_cpu_times": curr_per_cpu,
        "dio": dio,
        "nio": nio,
        "stats": stats,
    }
    return payload, next_state


def prime_process_cpu_times(proc_cache: Dict[Any, Any]) -> None:
    """Seeds initial cumulative CPU times & I/O bytes per PID so the first slow snapshot reports real deltas."""
    now_mono = time.monotonic()
    io_cache: Dict[int, Tuple[int, int]] = proc_cache.setdefault("_io", {})
    for p in psutil.process_iter(["pid", "cpu_times", "io_counters"]):
        try:
            pid = int(p.info["pid"])
            if pid == 0:
                continue
            ct = p.info.get("cpu_times")
            if ct is not None:
                proc_cache[pid] = float(getattr(ct, "user", 0.0)) + float(getattr(ct, "system", 0.0))
            io = p.info.get("io_counters")
            if io is not None:
                io_cache[pid] = (int(getattr(io, "read_bytes", 0)), int(getattr(io, "write_bytes", 0)))
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue
    proc_cache["_prev_ts"] = now_mono


def collect_slow_telemetry(
    include_gpu_perf: bool = True,
    proc_cache: Optional[Dict[Any, Any]] = None,
) -> Dict[str, Any]:
    """
    Collects heavier live OS telemetry on a relaxed 5s background schedule:
    - Pagefile / Swap memory
    - Network Adapter IPv4/IPv6/MAC/Speed/MTU list
    - Live Wi-Fi radio & signal metrics
    - GPU utilization & memory (NVIDIA nvidia-smi or WDDM PerfMon)
    - Top processes (fast pass across PIDs, oneshot details on top 35 only) & listening ports
    """
    # 1. Swap / Pagefile
    sw = psutil.swap_memory()
    swap_info = {
        "totalBytes": sw.total,
        "usedBytes": sw.used,
        "freeBytes": sw.free,
        "percent": round(float(sw.percent), 1),
    }

    cache_map: Dict[Any, Any] = proc_cache if proc_cache is not None else {}
    nic_io_cache: Dict[str, Tuple[float, int, int]] = cache_map.setdefault("_nic_io", {})
    now_nic_mono = time.monotonic()

    # 2. Network Adapters + Per-NIC Live RX/TX Speeds
    if_stats = psutil.net_if_stats()
    if_addrs = psutil.net_if_addrs()
    nic_io = psutil.net_io_counters(pernic=True)
    adapters: List[Dict[str, Any]] = []
    for nic_name, stats_obj in if_stats.items():
        addrs = if_addrs.get(nic_name, [])
        ipv4 = next((a.address for a in addrs if a.family == socket.AF_INET), None)
        ipv6 = next((a.address.split("%")[0] for a in addrs if a.family == socket.AF_INET6), None)
        af_link = getattr(psutil, "AF_LINK", -1)
        mac = next((a.address for a in addrs if a.family == af_link), None)
        io_obj = nic_io.get(nic_name)
        b_recv = io_obj.bytes_recv if io_obj else 0
        b_sent = io_obj.bytes_sent if io_obj else 0
        rx_kbps = 0.0
        tx_kbps = 0.0
        prev_nic = nic_io_cache.get(nic_name)
        if prev_nic is not None:
            ndt = max(0.0, now_nic_mono - prev_nic[0])
            if ndt > 0.1:
                rx_kbps = round(max(0.0, b_recv - prev_nic[1]) / (ndt * 1024.0), 1)
                tx_kbps = round(max(0.0, b_sent - prev_nic[2]) / (ndt * 1024.0), 1)
        nic_io_cache[nic_name] = (now_nic_mono, b_recv, b_sent)
        adapters.append(
            {
                "name": nic_name,
                "isUp": bool(stats_obj.isup),
                "speedMbps": int(stats_obj.speed or 0),
                "mtu": int(stats_obj.mtu or 0),
                "ipv4": ipv4,
                "ipv6": ipv6,
                "mac": mac,
                "bytesRecv": b_recv,
                "bytesSent": b_sent,
                "rxKBps": rx_kbps,
                "txKBps": tx_kbps,
            }
        )
    adapters.sort(
        key=lambda x: (
            any(tok in x["name"].lower() for tok in ("loopback", "vethernet", "wsl", "virtual", "pseudo")),
            not x["isUp"],
            x["ipv4"] is None,
            x["name"].lower(),
        )
    )

    # 3 & 4. Live Wi-Fi & GPU Subprocess Probes (throttled to <= once per 20s to avoid PowerShell/WMI CPU spikes)
    now_probe_mono = time.monotonic()
    last_hw_probe_ts = float(cache_map.get("_hw_probe_ts") or 0.0)
    cached_hw_probe = cache_map.get("_hw_probe_data")

    if cached_hw_probe is not None and (now_probe_mono - last_hw_probe_ts) < 20.0:
        wifi_interfaces = cached_hw_probe["wifiInterfaces"]
        connected_wifi = cached_hw_probe["connectedWifi"]
        gpu_live = dict(cached_hw_probe["gpuLive"])
    else:
        wifi_interfaces = probe_wifi_interfaces_windows()
        connected_wifi = next((w for w in wifi_interfaces if str(w.get("state", "")).lower() == "connected"), None)

        gpu_live = {
            "utilizationPercent": None,
            "dedicatedUsedBytes": None,
            "sharedUsedBytes": None,
            "engines": None,
            "nvidiaSensors": None,
        }
        nvidia_gpus = probe_nvidia_smi()
        if nvidia_gpus:
            primary_nv = nvidia_gpus[0]
            gpu_live["utilizationPercent"] = primary_nv.get("utilizationPercent")
            if primary_nv.get("vramUsedMB") is not None:
                gpu_live["dedicatedUsedBytes"] = int(primary_nv["vramUsedMB"] * 1024 * 1024)
            gpu_live["nvidiaSensors"] = nvidia_gpus
        elif include_gpu_perf:
            wddm = probe_windows_gpu_perf()
            if wddm:
                gpu_live["utilizationPercent"] = wddm.get("engineTotal")
                gpu_live["engines"] = wddm.get("engines")
                gpu_live["dedicatedUsedBytes"] = wddm.get("dedicatedUsed")
                gpu_live["sharedUsedBytes"] = wddm.get("sharedUsed")

        cache_map["_hw_probe_ts"] = now_probe_mono
        cache_map["_hw_probe_data"] = {
            "wifiInterfaces": wifi_interfaces,
            "connectedWifi": connected_wifi,
            "gpuLive": gpu_live,
        }

    # 5. Active Socket States, Listening Ports & Live Peer Connections -> PID Correlation
    socket_counts = {"established": 0, "listening": 0, "timeWait": 0, "closeWait": 0, "total": 0}
    ports_map: Dict[Tuple[str, int, str], Dict[str, Any]] = {}
    pid_to_ports: Dict[int, List[int]] = {}
    raw_connections: List[Dict[str, Any]] = []
    try:
        conns = psutil.net_connections(kind="inet")
        socket_counts["total"] = len(conns)
        for c in conns:
            st = str(c.status or "")
            if st == psutil.CONN_ESTABLISHED:
                socket_counts["established"] += 1
            elif st == psutil.CONN_LISTEN:
                socket_counts["listening"] += 1
            elif st == psutil.CONN_TIME_WAIT:
                socket_counts["timeWait"] += 1
            elif st == getattr(psutil, "CONN_CLOSE_WAIT", "CLOSE_WAIT"):
                socket_counts["closeWait"] += 1

            proto = "TCP" if c.type == socket.SOCK_STREAM else "UDP"
            l_ip = c.laddr.ip if c.laddr else ""
            l_port = int(c.laddr.port) if c.laddr and c.laddr.port else 0
            r_ip = c.raddr.ip if c.raddr else ""
            r_port = int(c.raddr.port) if c.raddr and c.raddr.port else 0
            pid = c.pid

            is_listen = st == psutil.CONN_LISTEN or (c.type == socket.SOCK_DGRAM and bool(c.laddr) and not r_ip)
            if is_listen and l_port:
                if pid:
                    pid_to_ports.setdefault(pid, [])
                    if l_port not in pid_to_ports[pid]:
                        pid_to_ports[pid].append(l_port)
                pkey = (proto, l_port, l_ip)
                if pkey not in ports_map:
                    is_portal = l_port in SOUL_PORTAL_PORTS or l_port in WORKSPACE_APP_PORTS
                    ports_map[pkey] = {
                        "port": l_port,
                        "protocol": proto,
                        "address": l_ip,
                        "family": "IPv6" if ":" in l_ip else "IPv4",
                        "exposure": _classify_ip_scope(l_ip),
                        "pid": pid,
                        "processName": None,
                        "exePath": None,
                        "memoryMB": None,
                        "serviceLabel": COMMON_PORT_SERVICES.get(l_port, "Local Service"),
                        "isDevPortal": l_port in SOUL_PORTAL_PORTS,
                        "isWorkspaceApp": is_portal,
                    }
            elif c.laddr and (r_ip or st not in (psutil.CONN_LISTEN, "")):
                raw_connections.append(
                    {
                        "protocol": proto,
                        "localAddress": l_ip,
                        "localPort": l_port,
                        "remoteAddress": r_ip or "*",
                        "remotePort": r_port,
                        "remoteScope": _classify_ip_scope(r_ip) if r_ip else "Local",
                        "remoteService": COMMON_PORT_SERVICES.get(r_port) if r_port else None,
                        "status": st or ("UDP" if proto == "UDP" else "ACTIVE"),
                        "pid": pid,
                        "processName": None,
                        "exePath": None,
                    }
                )
    except Exception:
        pass

    # 6. ALL Running Processes (fast single-pass + CPU/Disk I/O deltas + cached metadata)
    total_cores = psutil.cpu_count(logical=True) or 1
    static_meta_cache: Dict[int, Tuple[float, Optional[str], Optional[str], Optional[str]]] = cache_map.setdefault("_meta", {})
    io_cache: Dict[int, Tuple[int, int]] = cache_map.setdefault("_io", {})
    now_mono = time.monotonic()
    prev_ts = cache_map.get("_prev_ts")
    dt = (now_mono - float(prev_ts)) if isinstance(prev_ts, (int, float)) and now_mono > float(prev_ts) else 0.0

    kernel_virtual_descriptions: Dict[str, str] = {
        "memcompression": "Windows Kernel Compressed Memory Store",
        "registry": "Windows Kernel Registry Hive Store",
        "system": "NT Kernel & System Thread Pool",
        "vmmem": "Windows Hyper-V / WSL2 Virtual Machine Memory",
        "vmmemwsl": "WSL2 Virtual Machine Memory Process",
        "secure system": "Virtualization-Based Security Kernel",
        "system idle process": "CPU Idle Scheduler Loops",
    }

    live_pids: set[int] = set()
    all_procs: List[Dict[str, Any]] = []
    pid_info_lookup: Dict[int, Dict[str, Any]] = {}
    raw_proc_handles: List[Tuple[int, float, Any]] = []
    total_threads = 0

    for p in psutil.process_iter(["pid", "ppid", "name", "memory_info", "cpu_times", "io_counters", "num_threads", "status", "create_time"]):
        try:
            info = p.info
            pid = int(info["pid"])
            if pid == 0:
                continue
            live_pids.add(pid)
            pname = str(info.get("name") or f"pid-{pid}")
            ppid = int(info.get("ppid") or 0) or None
            threads = int(info.get("num_threads") or 1)
            total_threads += threads
            status_str = str(info.get("status") or "running").title()
            ctime = float(info.get("create_time") or 0.0)

            cpu_times = info.get("cpu_times")
            curr_sec: Optional[float] = (
                float(getattr(cpu_times, "user", 0.0)) + float(getattr(cpu_times, "system", 0.0))
                if cpu_times is not None
                else None
            )
            prev_sec = cache_map.get(pid)
            if curr_sec is not None and isinstance(prev_sec, (int, float)) and dt > 0.05:
                delta_sec = max(0.0, curr_sec - float(prev_sec))
                cpu_norm = round(min(100.0, (delta_sec / (dt * total_cores)) * 100.0), 1)
            else:
                cpu_norm = 0.0

            if curr_sec is not None:
                cache_map[pid] = curr_sec

            io_obj = info.get("io_counters")
            r_bytes = int(getattr(io_obj, "read_bytes", 0)) if io_obj is not None else 0
            w_bytes = int(getattr(io_obj, "write_bytes", 0)) if io_obj is not None else 0
            io_read_bps = 0.0
            io_write_bps = 0.0
            prev_io = io_cache.get(pid)
            if io_obj is not None and prev_io is not None and dt > 0.05:
                io_read_bps = round(max(0.0, r_bytes - prev_io[0]) / dt, 1)
                io_write_bps = round(max(0.0, w_bytes - prev_io[1]) / dt, 1)
            if io_obj is not None:
                io_cache[pid] = (r_bytes, w_bytes)

            cached_meta = static_meta_cache.get(pid)
            if cached_meta is not None and abs(cached_meta[0] - ctime) < 0.01:
                exe_path, username, cmdline = cached_meta[1], cached_meta[2], cached_meta[3]
            else:
                exe_path = kernel_virtual_descriptions.get(pname.lower())
                username, cmdline = None, None
                raw_proc_handles.append((pid, ctime, p))

            mem_info = info.get("memory_info")
            rss_bytes = int(mem_info.rss) if mem_info else 0
            mem_mb = round(rss_bytes / (1024 * 1024), 1)
            start_iso: Optional[str] = None
            if ctime > 1_000_000_000:
                try:
                    start_iso = datetime.datetime.fromtimestamp(ctime, tz=datetime.timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
                except Exception:
                    pass

            proc_dict = {
                "pid": pid,
                "ppid": ppid,
                "parentName": None,
                "name": pname,
                "cpuPercent": cpu_norm,
                "memoryBytes": rss_bytes,
                "memoryMB": mem_mb,
                "ioReadBps": io_read_bps,
                "ioWriteBps": io_write_bps,
                "ioReadBytes": r_bytes,
                "ioWriteBytes": w_bytes,
                "threads": threads,
                "status": status_str,
                "username": username,
                "exePath": exe_path,
                "cmdline": cmdline,
                "startedAt": start_iso,
                "ports": sorted(pid_to_ports.get(pid, [])),
            }
            all_procs.append(proc_dict)
            pid_info_lookup[pid] = proc_dict
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            continue

    cache_map["_prev_ts"] = now_mono
    for stale_pid in list(cache_map.keys()):
        if isinstance(stale_pid, int) and stale_pid not in live_pids:
            cache_map.pop(stale_pid, None)
    for stale_meta_pid in list(static_meta_cache.keys()):
        if stale_meta_pid not in live_pids:
            static_meta_cache.pop(stale_meta_pid, None)
    for stale_io_pid in list(io_cache.keys()):
        if stale_io_pid not in live_pids:
            io_cache.pop(stale_io_pid, None)

    # Resolve exe/username/cmdline lazily ONLY for top 45 active consumers & listening-port owners
    top_priority_pids: set[int] = set(pid_to_ports.keys())
    for item in sorted(all_procs, key=lambda x: (x["cpuPercent"], x["memoryBytes"]), reverse=True)[:30]:
        top_priority_pids.add(int(item["pid"]))
    for item in sorted(all_procs, key=lambda x: x["memoryBytes"], reverse=True)[:25]:
        top_priority_pids.add(int(item["pid"]))

    for pid, ctime, p_obj in raw_proc_handles:
        if pid not in top_priority_pids:
            continue
        p_dict = pid_info_lookup.get(pid)
        if not p_dict:
            continue
        exe_path, username, cmdline = p_dict.get("exePath"), None, None
        try:
            with p_obj.oneshot():
                try:
                    exe_path = p_obj.exe() or exe_path
                except Exception:
                    pass
                try:
                    username = p_obj.username() or None
                except Exception:
                    pass
                try:
                    raw_cmd = p_obj.cmdline()
                    if raw_cmd:
                        cmdline = _redact_cmdline(raw_cmd)
                except Exception:
                    pass
        except (psutil.NoSuchProcess, psutil.AccessDenied, psutil.ZombieProcess):
            pass
        p_dict["exePath"] = exe_path
        p_dict["username"] = username
        p_dict["cmdline"] = cmdline
        static_meta_cache[pid] = (ctime, exe_path, username, cmdline)

    for p_item in all_procs:
        ppid_val = p_item.get("ppid")
        if ppid_val and ppid_val in pid_info_lookup:
            p_item["parentName"] = pid_info_lookup[ppid_val]["name"]

    # Deduplicate/correlate active listening ports (keeping distinct IPv4/IPv6/protocol/port binds) & signatures
    active_ports: List[Dict[str, Any]] = []
    for p_entry in sorted(ports_map.values(), key=lambda item: (not item["isDevPortal"], not item["isWorkspaceApp"], item["port"], item["protocol"])):
        pid = p_entry.get("pid")
        p_meta = pid_info_lookup.get(pid) if pid else None
        if p_meta:
            p_entry["processName"] = p_meta["name"]
            p_entry["exePath"] = p_meta["exePath"]
            p_entry["memoryMB"] = p_meta["memoryMB"]
        p_entry["serviceLabel"] = _infer_port_service_label(p_entry["port"], p_entry.get("processName"))
        active_ports.append(p_entry)

    # Correlate process names to active connections (prioritize ESTABLISHED & live non-TIME_WAIT sockets first)
    conn_prio = {"ESTABLISHED": 0, "CLOSE_WAIT": 1, "SYN_SENT": 1, "SYN_RECV": 1, "FIN_WAIT1": 2, "FIN_WAIT2": 2, "TIME_WAIT": 4}
    raw_connections.sort(key=lambda c: (conn_prio.get(c["status"], 3), c["remoteScope"] == "Loopback", c["localPort"]))
    active_connections: List[Dict[str, Any]] = []
    for c_entry in raw_connections[:250]:
        pid = c_entry.get("pid")
        p_meta = pid_info_lookup.get(pid) if pid else None
        if p_meta:
            c_entry["processName"] = p_meta["name"]
            c_entry["exePath"] = p_meta["exePath"]
        active_connections.append(c_entry)

    all_procs_sorted = sorted(all_procs, key=lambda x: (x["cpuPercent"], x["memoryBytes"]), reverse=True)
    top_by_ram = sorted(all_procs, key=lambda x: x["memoryBytes"], reverse=True)
    top_by_io = sorted(all_procs, key=lambda x: (x["ioReadBps"] + x["ioWriteBps"], x["ioReadBytes"] + x["ioWriteBytes"]), reverse=True)

    return {
        "swap": swap_info,
        "networkAdapters": adapters,
        "wifiInterfaces": wifi_interfaces,
        "connectedWifi": connected_wifi,
        "gpuLive": gpu_live,
        "socketCounts": socket_counts,
        "activePorts": active_ports,
        "activeConnections": active_connections,
        "processes": all_procs_sorted,
        "topCpu": all_procs_sorted[:3],
        "topMemory": top_by_ram[:3],
        "topDiskIo": top_by_io[:3],
        "totalProcessesCount": len(all_procs),
        "totalThreadsCount": total_threads,
    }
