"""Unit tests for the Computer & Performance Hardware Code Decoder Engine & live extractors."""

import sys
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent.parent
SERVER_DIR = Path(__file__).resolve().parent.parent
for p in (ROOT_DIR, SERVER_DIR):
    if str(p) not in sys.path:
        sys.path.insert(0, str(p))

from shared.extractors.system_inspector import (
    collect_fast_telemetry,
    collect_slow_telemetry,
    compute_display_geometry,
    decode_cpu_microarchitecture,
    decode_pci_ids,
    decode_ram_vendor,
    derive_cpu_topology,
    filter_clean_pnp_devices,
    format_sector_alignment,
    get_static_hardware_specs,
    parse_wmi_date,
)


def test_hardware_decoders():
    # Hybrid Intel 10C / 12T mathematical derivation
    hybrid = derive_cpu_topology(10, 12)
    assert hybrid["performanceCores"] == 2
    assert hybrid["efficientCores"] == 8
    assert "2P + 8E" in hybrid["mode"]

    smt = derive_cpu_topology(8, 16)
    assert "Symmetric SMT" in smt["mode"]

    # CPU microarchitecture decoding
    raptor = decode_cpu_microarchitecture("Intel64 Family 6 Model 186 Stepping 3", "GenuineIntel")
    assert "Raptor Lake" in raptor["architecture"]
    assert "0xBA" in raptor["steppingTag"]

    # JEDEC RAM vendor & part prefix decoding
    micron = decode_ram_vendor("802C0000802C", "4ATF1G64HZ-3G2F1")
    assert micron["name"] == "Micron Technology"
    assert micron["code"] == "JEDEC:802C"

    crucial = decode_ram_vendor("802C0000802C", "CB8GS3200.C8TT")
    assert "Crucial" in crucial["name"]

    # PCI vendor / device extraction
    pci = decode_pci_ids("PCI\\VEN_8086&DEV_A7A1&SUBSYS_0C2F1028&REV_04")
    assert pci["vendorName"] == "Intel Corporation"
    assert pci["vendorCode"] == "VEN_8086"
    assert pci["deviceCode"] == "DEV_A7A1"

    # Physical panel diagonal inches, PPI, aspect ratio, DPI scaling
    geom = compute_display_geometry(1920, 1080, 1536, 864, 34, 19)
    assert geom["aspectRatio"] == "16:9"
    assert geom["scalePercent"] == 125
    assert geom["diagonalInches"] == 15.3
    assert geom["ppi"] is not None and 140 <= geom["ppi"] <= 148

    # Sector geometry & WMI dates
    assert format_sector_alignment(512, 4096) == "4K Emulated (512e)"
    assert format_sector_alignment(4096, 4096) == "4K Native (4Kn)"
    assert parse_wmi_date("/Date(1784764800000)/") == "2026-07-23"
    assert parse_wmi_date("07/23/2026") == "2026-07-23"

    # Bluetooth noise filtering
    cleaned = filter_clean_pnp_devices(
        [
            {"Name": "Realtek Bluetooth Adapter", "PNPClass": "Bluetooth", "Manufacturer": "Realtek", "Status": "OK"},
            {"Name": "BT SPEAKER Avrcp Transport", "PNPClass": "Bluetooth", "Manufacturer": "Microsoft", "Status": "OK"},
            {"Name": "BT SPEAKER", "PNPClass": "Bluetooth", "Manufacturer": "Microsoft", "Status": "OK"},
            {"Name": "Integrated Webcam", "PNPClass": "Camera", "Manufacturer": "Microsoft", "Status": "OK"},
        ]
    )
    assert len(cleaned["bluetooth"]) == 2
    assert len(cleaned["cameras"]) == 1


def test_live_fast_telemetry_and_static_specs():
    payload1, state1 = collect_fast_telemetry(None)
    assert "cpu" in payload1 and len(payload1["cpu"]["perCorePercent"]) >= 1
    assert payload1["memory"]["totalBytes"] > 0
    assert payload1["disk"]["readMBps"] >= 0.0

    payload2, _ = collect_fast_telemetry(state1)
    assert "network" in payload2 and payload2["network"]["rxKBps"] >= 0.0

    slow = collect_slow_telemetry(include_gpu_perf=False)
    assert slow["totalProcessesCount"] >= 10
    assert len(slow["processes"]) == slow["totalProcessesCount"] or len(slow["processes"]) >= 10
    assert slow["totalThreadsCount"] >= slow["totalProcessesCount"]
    assert "activeConnections" in slow and "activePorts" in slow
    assert "topDiskIo" in slow and len(slow["topDiskIo"]) >= 1
    assert "ioReadBps" in slow["processes"][0] and "rxKBps" in slow["networkAdapters"][0]

    specs = get_static_hardware_specs()
    assert specs["host"]["hostname"]
    assert specs["cpu"]["physicalCores"] >= 1
    assert specs["memory"]["installedBytes"] > 0
    assert len(specs["graphics"]) >= 1
    assert "environment" in specs and len(specs["environment"]["pathEntries"]) >= 1
    assert "shellProfile" in specs["environment"]
    assert "registrySource" in specs["environment"]["pathEntries"][0]
    assert "services" in specs and "startupApps" in specs
    assert "scheduledTasks" in specs and "systemDrivers" in specs
    assert "networkGateways" in specs and "systemEvents" in specs and "sensorCapabilities" in specs
    if specs["startupApps"]:
        assert "enabled" in specs["startupApps"][0]
        assert "fileExists" in specs["startupApps"][0]
    if specs["services"]:
        assert "startModeLabel" in specs["services"][0]
        assert "dependencies" in specs["services"][0]


if __name__ == "__main__":
    test_hardware_decoders()
    test_live_fast_telemetry_and_static_specs()
    print("SUCCESS: ALL SYSTEM INSPECTOR DECODER & LIVE TELEMETRY TESTS PASSED")
