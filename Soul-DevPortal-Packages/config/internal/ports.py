"""
Soul Workspace - Canonical Port Registry, Network Topology & Process Probing.
Defines strict, non-conflicting port allocation across all micro-apps and DevPortal,
along with cross-platform socket probing and process conflict utilities.
"""

from __future__ import annotations

import re
import socket
import subprocess
import sys
import time
from typing import Any, Dict, List, Optional, Tuple

PORT_REGISTRY: Dict[str, Dict[str, Any]] = {
    "apexmind-ai": {
        "client": 5173,
        "server": 8000,
        "name": "ApexMind Studio AI",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (server/data/apexmind.db)",
        "ai": "Google Gemini 2.5 Flash",
    },
    "outpass-system": {
        "client": 5174,
        "server": 8001,
        "name": "Outpass Management System",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (database/outpass.db)",
        "ai": "N/A",
    },
    "free-api-hub": {
        "client": 5175,
        "server": 8002,
        "name": "Free API Hub",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (backend/data/free_api_hub.db)",
        "ai": "N/A",
    },
    "sonikoma": {
        "client": 5176,
        "server": 8006,
        "name": "Sonikoma AI Studio",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (backend/data/sonikoma.db)",
        "ai": "Gemini AI Video & Voice",
    },
    "spatial-dimensions": {
        "client": 5177,
        "server": 8007,
        "name": "Spatial Dimensions",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (server/data/spatial_dimensions.db)",
        "ai": "N/A",
    },
    "college-management-system": {
        "client": 5178,
        "server": 8005,
        "name": "College Management System",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (server/data/college_management.db)",
        "ai": "N/A",
    },
    "globalpulse-ai": {
        "client": 5179,
        "server": 8003,
        "name": "GlobalPulse AI",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (backend/data/globalpulse.db)",
        "ai": "Gemini AI News Synthesizer",
    },
    "postcraft-ai": {
        "client": 5180,
        "server": 8004,
        "name": "PostCraft AI",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (server/data/postcraft.db)",
        "ai": "Integrated GenAI",
    },
    "home-management": {
        "client": 5182,
        "server": 8009,
        "name": "Home Management System",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (server/data/paperless.db)",
        "ai": "Household & Inventory Engine",
    },
    "devportal": {
        "client": 5181,
        "server": 8008,
        "name": "Soul Developer Portal",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "server_stack": "Python FastAPI + Uvicorn",
        "db": "SQLite (backend/data/workspace.db)",
        "ai": "Gemini 2.5 Flash + AST Extractor",
    },
}

MONOREPO_PROJECTS: List[str] = list(PORT_REGISTRY.keys())


def get_project_ports(project_id: str) -> Tuple[int, Optional[int]]:
    """Returns (client_port, server_port) for a given project ID."""
    cfg = PORT_REGISTRY.get(project_id)
    if not cfg:
        raise ValueError(f"Unknown project ID: '{project_id}'. Known projects: {MONOREPO_PROJECTS}")
    return cfg["client"], cfg["server"]


def get_project_config(project_id: str) -> Dict[str, Any]:
    """Returns complete metadata and configuration for a project."""
    cfg = PORT_REGISTRY.get(project_id)
    if not cfg:
        raise ValueError(f"Unknown project ID: '{project_id}'. Known projects: {MONOREPO_PROJECTS}")
    return cfg.copy()


def get_all_ports() -> Dict[str, Dict[str, Any]]:
    """Returns the full port registry map."""
    return PORT_REGISTRY.copy()


def is_port_in_use(port: int, host: str = "127.0.0.1") -> bool:
    """Verifies if a specific TCP network port is actively bound."""
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
        s.settimeout(0.3)
        return s.connect_ex((host, port)) == 0


def get_process_name_by_pid(pid: int) -> Optional[str]:
    """Resolves human-readable executable name for a given PID."""
    try:
        if sys.platform == "win32":
            res = subprocess.run(
                ["tasklist", "/FI", f"PID eq {pid}", "/FO", "CSV", "/NH"],
                capture_output=True,
                text=True,
                check=False,
            )
            for line in res.stdout.strip().splitlines():
                parts = [p.strip('"') for p in line.split('","')]
                if len(parts) >= 2 and parts[1] == str(pid):
                    return parts[0]
        else:
            res = subprocess.run(
                ["ps", "-p", str(pid), "-o", "comm="],
                capture_output=True,
                text=True,
                check=False,
            )
            name = res.stdout.strip()
            if name:
                return name
    except Exception:
        pass
    return None


def find_process_on_port(port: int) -> Tuple[Optional[int], Optional[str]]:
    """Locates the PID and executable name bound to a specific TCP port."""
    try:
        if sys.platform == "win32":
            res = subprocess.run(
                ["netstat", "-ano", "-p", "tcp"],
                capture_output=True,
                text=True,
                check=False,
            )
            for line in res.stdout.splitlines():
                if f":{port} " in line and "LISTENING" in line:
                    parts = line.strip().split()
                    pid = int(parts[-1])
                    return pid, get_process_name_by_pid(pid)
        else:
            res = subprocess.run(
                ["lsof", "-i", f":{port}", "-sTCP:LISTEN", "-t"],
                capture_output=True,
                text=True,
                check=False,
            )
            pids = res.stdout.strip().split()
            if pids:
                pid = int(pids[0])
                return pid, get_process_name_by_pid(pid)
    except Exception:
        pass
    return None, None


def kill_process_on_port(port: int) -> bool:
    """Terminates any process currently holding a specified port."""
    pid, _ = find_process_on_port(port)
    if not pid:
        return False

    try:
        if sys.platform == "win32":
            subprocess.run(["taskkill", "/F", "/T", "/PID", str(pid)], capture_output=True, check=False)
        else:
            subprocess.run(["kill", "-9", str(pid)], capture_output=True, check=False)
        time.sleep(0.3)
        return not is_port_in_use(port)
    except Exception:
        return False


def find_next_free_port(start_port: int, max_scan: int = 100) -> int:
    """Scans incrementally from start_port to find the next available port."""
    for p in range(start_port, start_port + max_scan):
        if not is_port_in_use(p):
            return p
    return start_port + max_scan
