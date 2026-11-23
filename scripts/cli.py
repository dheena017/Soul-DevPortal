#!/usr/bin/env python3
"""
Soul Workspace - Interactive Terminal Developer CLI
Usage:
    python scripts/cli.py
    npm run cli
"""

from __future__ import annotations

import json
import os
import subprocess
import sys
from pathlib import Path

_ROOT = Path(__file__).resolve().parent.parent

# ANSI Colors
CLR_RESET = "\033[0m"
CLR_BOLD = "\033[1m"
CLR_DIM = "\033[2m"
CLR_RED = "\033[91m"
CLR_GREEN = "\033[92m"
CLR_YELLOW = "\033[93m"
CLR_CYAN = "\033[96m"
CLR_WHITE = "\033[97m"

PROJECTS = [
    ("apexmind-ai", "ApexMind Studio AI", 5173, 8000),
    ("outpass-system", "Outpass Management System", 5174, 8001),
    ("free-api-hub", "Free API Hub", 5175, 8002),
    ("sonikoma", "Sonikoma AI Studio", 5176, 8006),
    ("spatial-dimensions", "Spatial Dimensions", 5177, 8007),
    ("college-management-system", "College Management System", 5178, 8005),
    ("globalpulse-ai", "GlobalPulse AI", 5179, 8003),
    ("postcraft-ai", "PostCraft AI Studio", 5180, 8004),
]


def clear_screen():
    os.system("cls" if sys.platform == "win32" else "clear")


def print_banner():
    print(f"{CLR_CYAN}{CLR_BOLD}")
    print("╔════════════════════════════════════════════════════════════════════════════╗")
    print("║               SOUL WORKSPACE — DEVELOPER PORTAL TERMINAL CLI               ║")
    print("║          Unified process supervisor, port prober & package manager         ║")
    print("╚════════════════════════════════════════════════════════════════════════════╝")
    print(f"{CLR_RESET}")


def run_cmd(cmd_list):
    try:
        subprocess.run(cmd_list, cwd=_ROOT)
    except KeyboardInterrupt:
        print(f"\n{CLR_YELLOW}Cancelled by user.{CLR_RESET}")


def select_project():
    print(f"\n{CLR_BOLD}Select a Project to Launch:{CLR_RESET}\n")
    for i, (pid, title, fe, be) in enumerate(PROJECTS, 1):
        print(f"  {CLR_CYAN}[{i}]{CLR_RESET} {title:<28} {CLR_DIM}(FE :{fe} / BE :{be}){CLR_RESET}")
    print(f"  {CLR_DIM}[0] Back to main menu{CLR_RESET}")

    choice = input(f"\n{CLR_BOLD}Enter choice [1-{len(PROJECTS)}]: {CLR_RESET}").strip()
    if choice == "0" or not choice:
        return
    try:
        idx = int(choice) - 1
        if 0 <= idx < len(PROJECTS):
            pid, title, fe, be = PROJECTS[idx]
            print(f"\n{CLR_BOLD}Launch mode for {title}:{CLR_RESET}")
            print(f"  {CLR_GREEN}[1]{CLR_RESET} Fullstack (Frontend :{fe} + Backend :{be})")
            print(f"  {CLR_CYAN}[2]{CLR_RESET} Client Only (Frontend :{fe})")
            print(f"  {CLR_YELLOW}[3]{CLR_RESET} Server Only (Backend :{be})")
            mode = input(f"\n{CLR_BOLD}Enter mode [1-3, default=1]: {CLR_RESET}").strip() or "1"

            if mode == "2":
                run_cmd([sys.executable, "Soul-DevPortal-Packages/runner/external/run_all.py", "--project", pid, "--client-only", "--kill-port"])
            elif mode == "3":
                run_cmd([sys.executable, "Soul-DevPortal-Packages/runner/external/run_all.py", "--project", pid, "--server-only", "--kill-port"])
            else:
                run_cmd([sys.executable, "Soul-DevPortal-Packages/runner/external/run_all.py", "--project", pid, "--kill-port"])
    except ValueError:
        pass


def main():
    while True:
        clear_screen()
        print_banner()
        print(f"{CLR_BOLD}Primary Workflows:{CLR_RESET}")
        print(f"  {CLR_GREEN}[1]{CLR_RESET}  🚀 Start All Applications ({CLR_DIM}dev:all — 8 apps + Portal Hub{CLR_RESET})")
        print(f"  {CLR_GREEN}[2]{CLR_RESET}  💻 Start DevPortal Hub Only ({CLR_DIM}client :5181 + server :8008{CLR_RESET})")
        print(f"  {CLR_CYAN}[3]{CLR_RESET}  🎯 Start a Single Project ({CLR_DIM}select from 8 consumer apps{CLR_RESET})")
        print(f"  {CLR_YELLOW}[4]{CLR_RESET}  🎨 Start All Clients Only ({CLR_DIM}ports 5173 - 5181{CLR_RESET})")
        print(f"  {CLR_YELLOW}[5]{CLR_RESET}  ⚙️  Start All Servers Only ({CLR_DIM}ports 8000 - 8008{CLR_RESET})")

        print(f"\n{CLR_BOLD}Diagnostics & Management:{CLR_RESET}")
        print(f"  {CLR_CYAN}[6]{CLR_RESET}  🔌 View Port Matrix ({CLR_DIM}inspect 18 monorepo ports{CLR_RESET})")
        print(f"  {CLR_RED}[7]{CLR_RESET}  🧹 Kill All Monorepo Ports ({CLR_DIM}free all 18 ports{CLR_RESET})")
        print(f"  {CLR_CYAN}[8]{CLR_RESET}  🩺 Probe Health of Backend APIs ({CLR_DIM}/api/health check{CLR_RESET})")

        print(f"\n{CLR_BOLD}Packages & Maintenance:{CLR_RESET}")
        print(f"  {CLR_WHITE}[9]{CLR_RESET}  📦 Run Shared Package Tests ({CLR_DIM}logger, runner, config{CLR_RESET})")
        print(f"  {CLR_WHITE}[10]{CLR_RESET} 📊 Refresh AST Metadata ({CLR_DIM}python server/main.py --extract-only{CLR_RESET})")
        print(f"  {CLR_WHITE}[11]{CLR_RESET} 🔗 Re-link Python Packages ({CLR_DIM}pip install -e{CLR_RESET})")

        print(f"\n  {CLR_DIM}[0]  🚪 Exit{CLR_RESET}")

        choice = input(f"\n{CLR_BOLD}Select an action [0-11]: {CLR_RESET}").strip()
        if choice in ("0", "q", "exit"):
            print(f"\n{CLR_GREEN}Goodbye!{CLR_RESET}\n")
            sys.exit(0)
        elif choice == "1":
            run_cmd([sys.executable, "Soul-DevPortal-Packages/runner/external/run_all.py", "--kill-port"])
        elif choice == "2":
            run_cmd([sys.executable, "Soul-DevPortal-Packages/runner/external/run_dev.py", "--kill-port"])
        elif choice == "3":
            select_project()
        elif choice == "4":
            run_cmd([sys.executable, "Soul-DevPortal-Packages/runner/external/run_all.py", "--client-only", "--kill-port"])
        elif choice == "5":
            run_cmd([sys.executable, "Soul-DevPortal-Packages/runner/external/run_all.py", "--server-only", "--kill-port"])
        elif choice == "6":
            run_cmd([sys.executable, "Soul-DevPortal-Packages/config/external/run_ports.py"])
            input(f"\n{CLR_DIM}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "7":
            run_cmd([sys.executable, "Soul-DevPortal-Packages/config/external/run_ports.py", "--kill-conflicts"])
            input(f"\n{CLR_DIM}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "8":
            run_cmd([sys.executable, "Soul-DevPortal-Packages/config/external/run_ports.py"])
            input(f"\n{CLR_DIM}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "9":
            cmd = "python Soul-DevPortal-Packages/logger/tests/test_internal.py && python Soul-DevPortal-Packages/runner/tests/test_supervisor.py"
            subprocess.run(cmd, shell=True, cwd=_ROOT)
            input(f"\n{CLR_DIM}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "10":
            run_cmd([sys.executable, "server/main.py", "--extract-only"])
            input(f"\n{CLR_DIM}Press Enter to return to menu...{CLR_RESET}")
        elif choice == "11":
            cmd = "pip install -e Soul-DevPortal-Packages/logger && pip install -e Soul-DevPortal-Packages/runner && pip install -e Soul-DevPortal-Packages/config"
            subprocess.run(cmd, shell=True, cwd=_ROOT)
            input(f"\n{CLR_DIM}Press Enter to return to menu...{CLR_RESET}")


if __name__ == "__main__":
    main()
