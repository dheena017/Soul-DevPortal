"""Pure hardware code decoder tables and pure formatting/decoding helpers."""

from __future__ import annotations

import datetime
import math
import platform
import re
from typing import Any, Dict, List, Optional

JEDEC_RAM_VENDORS: Dict[str, str] = {
    "802C": "Micron Technology",
    "01BA": "Crucial / Micron",
    "859B": "Crucial Technology",
    "80AD": "SK Hynix",
    "AD00": "SK Hynix",
    "80CE": "Samsung Electronics",
    "CE00": "Samsung Electronics",
    "0198": "Kingston Technology",
    "9801": "Kingston Technology",
    "029E": "Corsair",
    "04CD": "G.Skill",
    "8630": "ADATA Technology",
    "04CB": "ADATA Technology",
    "017A": "Apacer Technology",
    "04EF": "TeamGroup",
    "830B": "Nanya Technology",
    "8551": "Qimonda / Elpida",
    "85F7": "Ramaxel / Patriot",
    "8A91": "Lexar / Longsys",
    "02FE": "Elpida Memory",
}

PART_PREFIX_VENDORS = (
    ("CB", "Crucial (Micron)"),
    ("CT", "Crucial"),
    ("MTA", "Micron Technology"),
    ("4ATF", "Micron Technology"),
    ("8ATF", "Micron Technology"),
    ("M471", "Samsung"),
    ("M378", "Samsung"),
    ("M425", "Samsung"),
    ("HMA", "SK Hynix"),
    ("HMCG", "SK Hynix"),
    ("HMAA", "SK Hynix"),
    ("KF", "Kingston FURY"),
    ("KVR", "Kingston ValueRAM"),
    ("CMK", "Corsair Vengeance"),
    ("F4-", "G.Skill"),
    ("F5-", "G.Skill"),
)

SMBIOS_MEMORY_TYPES: Dict[int, str] = {
    20: "DDR",
    21: "DDR2",
    22: "DDR2 FB-DIMM",
    24: "DDR3",
    26: "DDR4",
    27: "eDRAM",
    28: "LPDDR",
    29: "LPDDR2",
    30: "LPDDR3",
    31: "LPDDR4",
    34: "DDR5",
    35: "LPDDR5",
    36: "LPDDR5X",
}

MEMORY_FORM_FACTORS: Dict[int, str] = {
    0: "Embedded / Unknown",
    2: "Proprietary / Soldered",
    3: "SIMM",
    8: "DIMM (Desktop)",
    9: "TSOP",
    11: "RIMM",
    12: "SO-DIMM (Laptop)",
    13: "Micro-DIMM",
    15: "FB-DIMM",
    16: "Die / Onboard Soldered",
}

PCI_VENDORS: Dict[str, str] = {
    "8086": "Intel Corporation",
    "10DE": "NVIDIA Corporation",
    "1002": "AMD (ATI Radeon)",
    "1022": "AMD (Advanced Micro Devices)",
    "10EC": "Realtek Semiconductor",
    "1344": "Micron Technology",
    "C0A9": "Crucial / Micron",
    "144D": "Samsung Electronics",
    "15B7": "Western Digital / SanDisk",
    "1B4B": "Marvell Technology",
    "1987": "Phison Electronics",
    "1179": "Toshiba",
    "1E0F": "Kioxia Corporation",
    "14E4": "Broadcom",
    "168C": "Qualcomm Atheros",
    "17CB": "Qualcomm",
    "1414": "Microsoft",
}

CPU_SOCKETS: Dict[int, str] = {
    1: "Other",
    3: "Daughter Board",
    33: "Socket AM3",
    36: "Socket LGA1155",
    41: "Socket LGA2011",
    45: "Socket LGA1150",
    49: "Socket AM4",
    50: "Socket LGA1151",
    59: "Socket AM4",
    60: "Socket LGA1200 / LGA1700",
    61: "Socket LGA4677",
    62: "Socket AM5",
    65: "FCBGA / Embedded BGA",
}

CHASSIS_TYPES: Dict[int, str] = {
    3: "Desktop",
    4: "Low Profile Desktop",
    6: "Mini Tower",
    7: "Tower Workstation",
    8: "Portable",
    9: "Laptop",
    10: "Notebook / Laptop",
    11: "Handheld",
    13: "All-in-One",
    14: "Sub-Notebook",
    23: "Rack Mount Server",
    30: "Tablet",
    31: "Convertible 2-in-1",
    32: "Detachable",
}

BATTERY_STATUS_MAP: Dict[int, str] = {
    1: "Discharging (On Battery)",
    2: "AC Power Plugged In",
    3: "Fully Charged",
    4: "Battery Low",
    5: "Battery Critical",
    6: "Charging",
    7: "Charging (High)",
    8: "Charging (Low)",
    9: "Charging (Critical)",
    11: "Partially Charged",
}

BATTERY_CHEMISTRY_MAP: Dict[int, str] = {
    1: "Other",
    2: "Rechargeable Pack",
    3: "Lead Acid",
    4: "Nickel Cadmium (NiCd)",
    5: "Nickel Metal Hydride (NiMH)",
    6: "Lithium-Ion (Li-Ion)",
    7: "Zinc Air",
    8: "Lithium Polymer (Li-Po)",
}

NET_CATEGORY_MAP: Dict[int, str] = {
    0: "Public Network",
    1: "Private Network",
    2: "Domain Authenticated",
}

IPV4_CONNECTIVITY_MAP: Dict[int, str] = {
    0: "Disconnected",
    1: "No Traffic",
    2: "Subnet Only",
    3: "Local Network Only",
    4: "Internet Connected",
}

EDID_VENDORS: Dict[str, str] = {
    "DEL": "Dell",
    "LGD": "LG Display",
    "AUO": "AU Optronics",
    "BOE": "BOE Display",
    "SAM": "Samsung",
    "SHP": "Sharp",
    "CMN": "Innolux",
    "CSO": "China Star",
    "ACR": "Acer",
    "AUS": "ASUS",
    "ACI": "ASUS",
    "HPN": "HP",
    "LEN": "Lenovo",
    "GSM": "LG Electronics",
}

STORAGE_BUS_TYPES: Dict[Any, str] = {
    1: "SCSI",
    3: "ATA",
    7: "USB",
    8: "RAID",
    11: "SATA",
    17: "NVMe PCIe",
    "NVMe": "NVMe PCIe",
    "SATA": "SATA",
    "USB": "USB",
    "SCSI": "SCSI",
}

STORAGE_MEDIA_TYPES: Dict[Any, str] = {
    0: "Unspecified",
    3: "HDD (Hard Disk)",
    4: "SSD (Solid State)",
    5: "SCM (Storage Class)",
    "SSD": "SSD (Solid State)",
    "HDD": "HDD (Hard Disk)",
    "SCM": "SCM (Storage Class)",
}

STORAGE_HEALTH_STATES: Dict[Any, str] = {
    0: "Healthy",
    1: "Warning",
    2: "Unhealthy",
    5: "Unknown",
    "Healthy": "Healthy",
    "Warning": "Warning",
    "Unhealthy": "Unhealthy",
}

STORAGE_OP_STATUS: Dict[Any, str] = {
    1: "Other",
    2: "OK",
    3: "Degraded",
    4: "Stressed",
    "OK": "OK",
}

PARTITION_STYLES: Dict[Any, str] = {
    0: "RAW",
    1: "MBR",
    2: "GPT",
    "GPT": "GPT",
    "MBR": "MBR",
    "RAW": "RAW",
}

COMMON_PORT_SERVICES: Dict[int, str] = {
    22: "SSH",
    53: "DNS",
    80: "HTTP",
    123: "NTP Time Sync",
    135: "Windows RPC",
    137: "NetBIOS Name",
    138: "NetBIOS Datagram",
    139: "NetBIOS Session",
    443: "HTTPS",
    445: "SMB File Share",
    1900: "SSDP / UPnP",
    2177: "qWAVE Media QoS",
    2869: "UPnP Device Host",
    3000: "Node / React Dev",
    3306: "MySQL",
    5000: "Local API",
    5040: "Connected Devices",
    5050: "Device Sync / UDP",
    5173: "Vite Dev Client",
    5174: "Vite Dev Client",
    5175: "Vite Dev Client",
    5176: "Sonikoma AI Client",
    5177: "Outpass Client",
    5178: "Free API Hub Client",
    5179: "Spatial Client",
    5180: "College Portal Client",
    5181: "Soul-DevPortal Client",
    5353: "mDNS / Bonjour",
    5355: "LLMNR Discovery",
    5432: "PostgreSQL",
    5433: "PostgreSQL",
    6379: "Redis",
    6880: "Proxy Control",
    7680: "Delivery Optimization",
    8000: "Python FastAPI",
    8005: "ApexMind AI API",
    8006: "Sonikoma AI API",
    8007: "Outpass API",
    8008: "Soul-DevPortal API",
    8080: "HTTP Proxy / Server",
    8881: "Local HTTP / Service",
    8884: "Windows Local Listener",
    11434: "Ollama LLM",
    27017: "MongoDB",
}

SOUL_PORTAL_PORTS = {5181, 8008}
WORKSPACE_APP_PORTS = {5173, 5174, 5175, 5176, 5177, 5178, 5179, 5180, 8000, 8001, 8002, 8003, 8004, 8005, 8006, 8007}

INTEL_MODEL_MAP: Dict[int, str] = {
    126: "Ice Lake (10th Gen)",
    140: "Tiger Lake-U (11th Gen)",
    141: "Tiger Lake-H (11th Gen)",
    142: "Kaby / Whiskey / Comet Lake",
    154: "Alder Lake (12th Gen)",
    158: "Coffee / Comet Lake",
    165: "Comet Lake (10th Gen)",
    167: "Rocket Lake (11th Gen)",
    170: "Meteor Lake (Core Ultra Series 1)",
    183: "Raptor Lake-S/HX (13th Gen)",
    186: "Raptor Lake-P/U (13th Gen)",
    189: "Lunar Lake (Core Ultra Series 2)",
    191: "Raptor Lake Refresh (14th Gen)",
    197: "Arrow Lake-H (Core Ultra Series 2)",
    198: "Arrow Lake-S (Core Ultra Series 2)",
}

AMD_FAMILY_MAP: Dict[int, str] = {
    23: "AMD Zen / Zen+ / Zen 2",
    25: "AMD Zen 3 / Zen 4",
    26: "AMD Zen 5",
}

_CMD_SECRET_RE = re.compile(
    r"(?i)(--?(?:token|password|passwd|secret|api[-_]?key|auth|bearer)\s*[=\s]\s*|Bearer\s+)([^\s\"']+|\"[^\"]*\")"
)


def _ensure_list(value: Any) -> List[Any]:
    if value is None:
        return []
    if isinstance(value, list):
        return value
    return [value]


def _redact_cmdline(args: List[str]) -> str:
    joined = " ".join(str(a) for a in args if a is not None).strip()
    if len(joined) > 600:
        joined = joined[:597] + "..."
    return _CMD_SECRET_RE.sub(r"\1REDACTED", joined)


def _infer_port_service_label(port: int, process_name: Optional[str]) -> str:
    known = COMMON_PORT_SERVICES.get(port)
    pname = (process_name or "").lower()
    if known and not (port in (6880, 8881) and pname):
        return known
    if "postgres" in pname:
        return "PostgreSQL DB"
    if "httpd" in pname or "apache" in pname:
        return "Apache HTTP"
    if "nginx" in pname:
        return "Nginx HTTP"
    if "ollama" in pname:
        return "Ollama LLM"
    if "onedrive" in pname:
        return "OneDrive Sync"
    if "hola" in pname:
        return "Hola Proxy / VPN"
    if "docker" in pname:
        return "Docker Engine"
    if "lsass" in pname:
        return "Windows LSA RPC"
    if "agentservice" in pname:
        return "HTTP Proxy / Server" if port == 8080 else "IDE Agent Service"
    if ("msedge" in pname or "chrome" in pname) and port == 5353:
        return "Browser mDNS"
    if "svchost" in pname and 49152 <= port <= 65535:
        return "Windows Dynamic RPC"
    if known:
        return known
    if 49152 <= port <= 65535:
        return "Ephemeral / Dynamic"
    return "Local Service"


def _classify_ip_scope(ip: str) -> str:
    clean = (ip or "").strip()
    if clean in ("127.0.0.1", "::1", "localhost"):
        return "Loopback"
    if clean in ("0.0.0.0", "::", "*"):
        return "All Interfaces"
    if clean.startswith(("10.", "192.168.", "172.16.", "172.17.", "172.18.", "172.19.", "172.2", "172.3", "fe80:")):
        return "LAN / Private"
    return "External Remote"


def parse_wmi_date(raw: Any) -> Optional[str]:
    """Converts WMI /Date(ms)/, MM/DD/YYYY, or YYYYMMDD timestamps into YYYY-MM-DD."""
    if not raw:
        return None
    text = str(raw).strip()
    epoch_match = re.search(r"/Date\((\d+)\)/", text)
    if epoch_match:
        try:
            ms = int(epoch_match.group(1))
            dt = datetime.datetime.fromtimestamp(ms / 1000.0, tz=datetime.timezone.utc)
            return dt.strftime("%Y-%m-%d")
        except Exception:
            return None
    slash_match = re.match(r"^(\d{2})/(\d{2})/(\d{4})$", text)
    if slash_match:
        return f"{slash_match.group(3)}-{slash_match.group(1)}-{slash_match.group(2)}"
    compact_match = re.match(r"^(\d{4})(\d{2})(\d{2})", text)
    if compact_match:
        return f"{compact_match.group(1)}-{compact_match.group(2)}-{compact_match.group(3)}"
    return text[:10] if len(text) >= 10 else text


def parse_wmi_datetime_iso(raw: Any) -> Optional[str]:
    """Converts WMI /Date(ms)/ into compact UTC timestamp YYYY-MM-DD HH:MM UTC."""
    if not raw:
        return None
    text = str(raw).strip()
    epoch_match = re.search(r"/Date\((\d+)\)/", text)
    if epoch_match:
        try:
            ms = int(epoch_match.group(1))
            dt = datetime.datetime.fromtimestamp(ms / 1000.0, tz=datetime.timezone.utc)
            return dt.strftime("%Y-%m-%d %H:%M UTC")
        except Exception:
            return None
    return text[:19]


def decode_ram_vendor(raw_mfg: Any, part_number: str = "") -> Dict[str, str]:
    raw_str = str(raw_mfg or "").strip().upper()
    prefix_hex = raw_str[:4]
    part_clean = str(part_number or "").strip().upper()

    for part_pfx, brand in PART_PREFIX_VENDORS:
        if part_clean.startswith(part_pfx):
            code = f"JEDEC:{prefix_hex}" if prefix_hex else part_pfx
            return {"name": brand, "code": code}

    if prefix_hex in JEDEC_RAM_VENDORS:
        return {"name": JEDEC_RAM_VENDORS[prefix_hex], "code": f"JEDEC:{prefix_hex}"}

    if raw_str and not re.fullmatch(r"[0-9A-F]{4,}", raw_str):
        return {"name": str(raw_mfg).strip(), "code": str(raw_mfg).strip()}

    return {
        "name": f"Vendor {prefix_hex}" if prefix_hex else "Unknown Vendor",
        "code": f"JEDEC:{prefix_hex}" if prefix_hex else "N/A",
    }


def decode_pci_ids(pnp_id: Any) -> Dict[str, Optional[str]]:
    text = str(pnp_id or "")
    ven_m = re.search(r"VEN_([0-9A-F]{4})", text, re.IGNORECASE)
    dev_m = re.search(r"DEV_([0-9A-F]{4})", text, re.IGNORECASE)
    ven_hex = ven_m.group(1).upper() if ven_m else None
    dev_hex = dev_m.group(1).upper() if dev_m else None
    vendor_name = PCI_VENDORS.get(ven_hex) if ven_hex else None
    return {
        "vendorName": vendor_name,
        "vendorCode": f"VEN_{ven_hex}" if ven_hex else None,
        "deviceCode": f"DEV_{dev_hex}" if dev_hex else None,
    }


def derive_cpu_topology(physical_cores: int, logical_threads: int) -> Dict[str, Any]:
    """Mathematically derives Intel hybrid P+E core counts vs SMT/non-SMT cleanly."""
    if physical_cores <= 0 or logical_threads <= 0:
        return {"mode": "Standard", "performanceCores": physical_cores, "efficientCores": 0}
    if logical_threads == physical_cores * 2:
        return {
            "mode": "Symmetric SMT / Hyper-Threading",
            "performanceCores": physical_cores,
            "efficientCores": 0,
        }
    if physical_cores < logical_threads < physical_cores * 2:
        p_cores = logical_threads - physical_cores
        e_cores = physical_cores - p_cores
        return {
            "mode": f"Hybrid Asymmetric ({p_cores}P + {e_cores}E)",
            "performanceCores": p_cores,
            "efficientCores": e_cores,
        }
    return {
        "mode": "Uniform Non-SMT",
        "performanceCores": physical_cores,
        "efficientCores": 0,
    }


def decode_cpu_microarchitecture(caption: str, vendor: str = "") -> Dict[str, Optional[str]]:
    """Parses x86/ARM Family/Model/Stepping strings into human-readable silicon generation."""
    fam_m = re.search(r"Family\s+(\d+)", caption, re.IGNORECASE)
    mod_m = re.search(r"Model\s+(\d+)", caption, re.IGNORECASE)
    step_m = re.search(r"Stepping\s+(\d+)", caption, re.IGNORECASE)
    if not fam_m or not mod_m:
        return {"architecture": platform.machine() or "Host Silicon", "steppingTag": caption or None}

    fam = int(fam_m.group(1))
    mod = int(mod_m.group(1))
    step = int(step_m.group(1)) if step_m else None
    is_amd = "amd" in vendor.lower() or "authenticamd" in vendor.lower() or "amd" in caption.lower()

    if is_amd:
        arch = AMD_FAMILY_MAP.get(fam, f"AMD Family {fam}")
    elif fam == 6:
        arch = INTEL_MODEL_MAP.get(mod, f"Intel Family 6 Model 0x{mod:02X}")
    else:
        arch = f"Family {fam} Model 0x{mod:02X}"

    tag = f"Fam {fam} · Mod 0x{mod:02X} ({mod})" + (f" · Step {step}" if step is not None else "")
    return {"architecture": arch, "steppingTag": tag}


def compute_display_geometry(
    width_px: Optional[int],
    height_px: Optional[int],
    logical_w: Optional[int],
    logical_h: Optional[int],
    phys_w_cm: Optional[int],
    phys_h_cm: Optional[int],
) -> Dict[str, Any]:
    scale_pct: Optional[int] = None
    if width_px and logical_w and logical_w > 0:
        scale_pct = int(round((width_px / logical_w) * 100))

    aspect: Optional[str] = None
    if width_px and height_px and width_px > 0 and height_px > 0:
        g = math.gcd(width_px, height_px)
        aspect = f"{width_px // g}:{height_px // g}"

    diagonal_in: Optional[float] = None
    ppi: Optional[int] = None
    if phys_w_cm and phys_h_cm and phys_w_cm > 0 and phys_h_cm > 0:
        diag_cm = math.hypot(phys_w_cm, phys_h_cm)
        diagonal_in = round(diag_cm / 2.54, 1)
        if width_px and height_px and diagonal_in > 0:
            ppi = int(round(math.hypot(width_px, height_px) / diagonal_in))

    return {
        "aspectRatio": aspect,
        "scalePercent": scale_pct,
        "diagonalInches": diagonal_in,
        "ppi": ppi,
    }


def format_sector_alignment(logical_b: Optional[int], physical_b: Optional[int]) -> str:
    if not logical_b or not physical_b:
        return "Standard Sector Geometry"
    if logical_b == 512 and physical_b == 4096:
        return "4K Emulated (512e)"
    if logical_b == 4096 and physical_b == 4096:
        return "4K Native (4Kn)"
    if logical_b == 512 and physical_b == 512:
        return "512B Native"
    return f"{logical_b}B / {physical_b}B"


def filter_clean_pnp_devices(raw_items: List[Dict[str, Any]]) -> Dict[str, List[Dict[str, Any]]]:
    """Categorizes and deduplicates Cameras, Bluetooth, and Biometrics, stripping protocol noise."""
    noise_tokens = (
        "avrcp transport",
        "phonebook access",
        "object push service",
        "rfcomm protocol",
        "bluetooth enumerator",
        "bluetooth le enumerator",
        "device identification service",
        "headset audio gateway",
        "personal area network",
        "microsoft bluetooth",
    )
    cameras: List[Dict[str, Any]] = []
    bluetooth: List[Dict[str, Any]] = []
    biometrics: List[Dict[str, Any]] = []
    seen_bt: set[str] = set()

    for item in raw_items:
        name = str(item.get("Name") or "").strip()
        pnp_class = str(item.get("PNPClass") or "").strip()
        mfg = str(item.get("Manufacturer") or "").strip()
        status = str(item.get("Status") or "OK").strip()
        if not name:
            continue

        entry = {"name": name, "manufacturer": mfg or "Generic", "status": status, "class": pnp_class}
        if pnp_class.lower() in ("camera", "image"):
            cameras.append(entry)
        elif pnp_class.lower() == "biometric":
            biometrics.append(entry)
        elif pnp_class.lower() == "bluetooth":
            low = re.sub(r"\s+", " ", name.lower())
            if any(tok in low for tok in noise_tokens):
                continue
            if low not in seen_bt:
                seen_bt.add(low)
                bluetooth.append(entry)

    return {"cameras": cameras, "bluetooth": bluetooth, "biometrics": biometrics}


def _wifi_band_from_channel(channel: Optional[int], radio: str = "") -> str:
    if channel is None:
        if "be" in radio.lower():
            return "6 / 5 GHz"
        if "ac" in radio.lower():
            return "5 GHz"
        return "Wireless"
    if 1 <= channel <= 14:
        return "2.4 GHz"
    if 32 <= channel <= 177:
        return "5 GHz"
    return "6 GHz"


def _wifi_generation_label(radio: str) -> str:
    r = radio.strip()
    low = r.lower()
    if "802.11be" in low:
        return "Wi-Fi 7 (802.11be)"
    if "802.11ax" in low:
        return "Wi-Fi 6 (802.11ax)"
    if "802.11ac" in low:
        return "Wi-Fi 5 (802.11ac)"
    if "802.11n" in low:
        return "Wi-Fi 4 (802.11n)"
    return r or "802.11 Wireless"
