"""
Live Process Statistics & Metrics Formatter for Workspace Runner (@workspace/runner).
Renders clean ANSI ASCII tables displaying active subprocess PIDs, port allocations,
memory consumption, and real-time uptime.
"""

from __future__ import annotations

import os
import subprocess
import sys
import time
from datetime import timedelta
from typing import Any


def _get_memory_usage_mb(pid: int) -> float | None:
    """Gets memory usage in megabytes (RSS) for a given PID."""
    if pid <= 0:
        return None

    if sys.platform == "win32":
        try:
            res = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
                capture_output=True,
                text=True,
                check=False,
            )
            line = res.stdout.strip().splitlines()[0] if res.stdout.strip() else ""
            if line:
                # Format: "name","pid","session","session#","mem K"
                parts = [p.strip('"') for p in line.split(",")]
                if len(parts) >= 5:
                    mem_str = parts[4].replace(" K", "").replace(",", "").replace(".", "").strip()
                    if mem_str.isdigit():
                        return round(int(mem_str) / 1024, 1)
        except Exception:
            pass
    else:
        try:
            res = subprocess.run(
                ["ps", "-o", "rss=", "-p", str(pid)],
                capture_output=True,
                text=True,
                check=False,
            )
            out = res.stdout.strip()
            if out.isdigit():
                return round(int(out) / 1024, 1)
        except Exception:
            pass

    return None


def format_process_stats_table(processes: list[dict[str, Any]]) -> str:
    """
    Renders an 80-column ASCII status table for monitored child processes.
    Each item in processes: {
        "name": str,
        "scope": str,
        "pid": int | None,
        "port": int | None,
        "status": str,
        "start_time": float,
    }
    """
    lines = [
        "\033[90m┌──────────────────────────────────────────────────────────────────────────────┐\033[0m",
        "\033[90m│\033[0m  \033[1m\033[36mWORKSPACE PROCESS SUPERVISOR — LIVE STATUS\033[0m                                \033[90m│\033[0m",
        "\033[90m├────────────┬──────────┬────────┬──────────────┬─────────────┬────────────────┤\033[0m",
        "\033[90m│\033[0m \033[1mSERVICE    \033[0m\033[90m│\033[0m \033[1mSCOPE    \033[0m\033[90m│\033[0m \033[1mPID   \033[0m\033[90m│\033[0m \033[1mPORT         \033[0m\033[90m│\033[0m \033[1mMEMORY      \033[0m\033[90m│\033[0m \033[1mUPTIME / STAT  \033[0m\033[90m│\033[0m",
        "\033[90m├────────────┼──────────┼────────┼──────────────┼─────────────┼────────────────┤\033[0m",
    ]

    now = time.time()

    for p in processes:
        name = p.get("name", "Service")[:10].ljust(10)
        scope = p.get("scope", "APP")[:8].ljust(8)
        pid_val = p.get("pid")
        pid_str = str(pid_val)[:6].ljust(6) if pid_val else "N/A   "
        port_val = p.get("port")
        port_str = f":{port_val}".ljust(12) if port_val else "N/A         "

        mem_mb = _get_memory_usage_mb(pid_val) if pid_val else None
        mem_str = f"{mem_mb:.1f} MB".ljust(11) if mem_mb is not None else "N/A        "

        start_time = p.get("start_time", now)
        elapsed_sec = int(max(0, now - start_time))
        uptime_str = str(timedelta(seconds=elapsed_sec))

        status = p.get("status", "RUNNING")
        if status == "RUNNING" or status == "HEALTHY":
            stat_color = "\033[32m●\033[0m"
        elif status == "RESTARTING":
            stat_color = "\033[33m⟳\033[0m"
        else:
            stat_color = "\033[31m■\033[0m"

        stat_cell = f"{stat_color} {uptime_str}".ljust(23)  # accounts for ANSI codes

        lines.append(
            f"\033[90m│\033[0m {name} \033[90m│\033[0m {scope} \033[90m│\033[0m {pid_str} \033[90m│\033[0m {port_str} \033[90m│\033[0m {mem_str} \033[90m│\033[0m {stat_cell}\033[90m│\033[0m"
        )

    lines.append("\033[90m└────────────┴──────────┴────────┴──────────────┴─────────────┴────────────────┘\033[0m")
    return "\n".join(lines)
