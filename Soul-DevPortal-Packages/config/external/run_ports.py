#!/usr/bin/env python3
"""
Monorepo Network Port Topology & Conflict Scanner (@workspace/config/external).
Audits all registered micro-app ports, detects live collisions, and terminates rogue processes.

Usage:
  python external/run_ports.py [--project <name>] [--kill-conflicts] [--json]
"""

from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

# Ensure config package root is in sys.path
_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from internal.ports import (
    PORT_REGISTRY,
    find_process_on_port,
    is_port_in_use,
    kill_process_on_port,
)

# Colors
C_RESET = "\033[0m"
C_BOLD = "\033[1m"
C_DIM = "\033[2m"
C_CYAN = "\033[36m"
C_GREEN = "\033[32m"
C_YELLOW = "\033[33m"
C_RED = "\033[31m"
C_GRAY = "\033[90m"

_ANSI_STRIP = re.compile(r"\033\[[0-9;]*m")


def _visual_len(text: str) -> int:
    """Calculates visible text length excluding ANSI terminal escape codes."""
    return len(_ANSI_STRIP.sub("", text))


def _pad_cell(text: str, width: int) -> str:
    """Pads a string containing ANSI escape codes to a uniform visual column width."""
    vlen = _visual_len(text)
    pad = max(0, width - vlen)
    return text + (" " * pad)


def audit_ports(
    target_project: str | None = None,
    kill_conflicts: bool = False,
    output_json: bool = False,
) -> bool:
    """Audits port allocations across registered projects."""
    projects_to_check = (
        {target_project: PORT_REGISTRY[target_project]}
        if target_project and target_project in PORT_REGISTRY
        else PORT_REGISTRY
    )

    results = []
    has_conflicts = False

    for proj_id, info in projects_to_check.items():
        c_port = info.get("client")
        s_port = info.get("server")

        c_busy = is_port_in_use(c_port) if c_port else False
        s_busy = is_port_in_use(s_port) if s_port else False

        c_pid, c_pname = find_process_on_port(c_port) if c_busy and c_port else (None, None)
        s_pid, s_pname = find_process_on_port(s_port) if s_busy and s_port else (None, None)

        if c_busy or s_busy:
            has_conflicts = True

        if kill_conflicts:
            if c_busy and c_port:
                kill_process_on_port(c_port)
                c_busy = is_port_in_use(c_port)
            if s_busy and s_port:
                kill_process_on_port(s_port)
                s_busy = is_port_in_use(s_port)

        results.append({
            "project": proj_id,
            "name": info.get("name", proj_id),
            "client_port": c_port,
            "client_busy": c_busy,
            "client_pid": c_pid,
            "client_pname": c_pname,
            "server_port": s_port,
            "server_busy": s_busy,
            "server_pid": s_pid,
            "server_pname": s_pname,
        })

    if output_json:
        print(json.dumps(results, indent=2))
        return not has_conflicts

    # Render ANSI Box Table with exact visual alignment
    col1_w = 26
    col2_w = 28
    col3_w = 28

    top_border = f"╭{'─' * (col1_w + 2)}┬{'─' * (col2_w + 2)}┬{'─' * (col3_w + 2)}╮"
    mid_border = f"├{'─' * (col1_w + 2)}┼{'─' * (col2_w + 2)}┼{'─' * (col3_w + 2)}┤"
    bot_border = f"╰{'─' * (col1_w + 2)}┴{'─' * (col2_w + 2)}┴{'─' * (col3_w + 2)}╯"

    print(f"\n{C_BOLD}{C_CYAN}── MONOREPO NETWORK PORT AUDIT ─────────────────────────────────────────────────────────────{C_RESET}")
    print(f"{C_CYAN}{top_border}{C_RESET}")
    print(
        f"{C_CYAN}│{C_RESET} {_pad_cell(f'{C_BOLD}PROJECT{C_RESET}', col1_w)} "
        f"{C_CYAN}│{C_RESET} {_pad_cell(f'{C_BOLD}CLIENT PORT{C_RESET}', col2_w)} "
        f"{C_CYAN}│{C_RESET} {_pad_cell(f'{C_BOLD}SERVER PORT{C_RESET}', col3_w)} {C_CYAN}│{C_RESET}"
    )
    print(f"{C_CYAN}{mid_border}{C_RESET}")

    for r in results:
        p_name = r["project"][:col1_w]

        # Client status
        if r["client_port"]:
            if r["client_busy"]:
                pid_info = f" PID:{r['client_pid']}" if r["client_pid"] else ""
                c_stat = f"{r['client_port']} {C_RED}[BUSY{pid_info}]{C_RESET}"
            else:
                c_stat = f"{r['client_port']} {C_GREEN}[FREE]{C_RESET}"
        else:
            c_stat = f"{C_GRAY}N/A{C_RESET}"

        # Server status
        if r["server_port"]:
            if r["server_busy"]:
                pid_info = f" PID:{r['server_pid']}" if r["server_pid"] else ""
                s_stat = f"{r['server_port']} {C_RED}[BUSY{pid_info}]{C_RESET}"
            else:
                s_stat = f"{r['server_port']} {C_GREEN}[FREE]{C_RESET}"
        else:
            s_stat = f"{C_GRAY}N/A{C_RESET}"

        print(
            f"{C_CYAN}│{C_RESET} {_pad_cell(p_name, col1_w)} "
            f"{C_CYAN}│{C_RESET} {_pad_cell(c_stat, col2_w)} "
            f"{C_CYAN}│{C_RESET} {_pad_cell(s_stat, col3_w)} {C_CYAN}│{C_RESET}"
        )

    print(f"{C_CYAN}{bot_border}{C_RESET}")
    print(f"{C_DIM}Run with --kill-conflicts to free any locked ports automatically.{C_RESET}\n")
    return not has_conflicts


def main() -> None:
    parser = argparse.ArgumentParser(description="Monorepo Network Port Topology & Conflict Scanner")
    parser.add_argument("--project", "-p", help="Target micro-app to check")
    parser.add_argument("--kill-conflicts", action="store_true", help="Terminate processes holding assigned ports")
    parser.add_argument("--json", action="store_true", help="Output machine-readable JSON")
    args = parser.parse_args()

    audit_ports(target_project=args.project, kill_conflicts=args.kill_conflicts, output_json=args.json)


if __name__ == "__main__":
    main()
