"""
Soul Workspace - Canonical Port Registry & Network Topology.
Defines strict, non-conflicting port allocation across all 8 micro-apps and the DevPortal.
"""

from __future__ import annotations

from typing import Dict, Any, Optional, Tuple

PORT_REGISTRY: Dict[str, Dict[str, Any]] = {
    "apexmind-ai": {
        "client": 5173,
        "server": 8000,
        "name": "ApexMind Studio AI",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "db": "SQLite (server/data/apexmind.db)",
        "ai": "Google Gemini 2.5 Flash",
    },
    "outpass-system": {
        "client": 5174,
        "server": 8001,
        "name": "Outpass Management System",
        "framework": "React 18 + Vite + Tailwind CSS",
        "db": "SQLite + SQLAlchemy",
        "ai": "N/A",
    },
    "free-api-hub": {
        "client": 5175,
        "server": 8002,
        "name": "Free API Hub",
        "framework": "React 18 + Vite + Tailwind CSS",
        "db": "JSON Flat Store",
        "ai": "N/A",
    },
    "sonikoma": {
        "client": 5176,
        "server": 8006,
        "name": "Sonikoma AI Studio",
        "framework": "React 19 + Vite 8 + Tailwind CSS v4",
        "db": "SQLite / Supabase PostgreSQL",
        "ai": "Gemini AI Video & Voice",
    },
    "spatial-dimensions": {
        "client": 5177,
        "server": 8007,
        "name": "Spatial Dimensions",
        "framework": "React 19 + Vite 6 + Motion",
        "db": "JSONL Inquiries Store",
        "ai": "N/A",
    },
    "college-management-system": {
        "client": 5178,
        "server": 8005,
        "name": "College Management System",
        "framework": "React 19 + Vite 6 + Tailwind CSS v4",
        "db": "SQLite (better-sqlite3)",
        "ai": "N/A",
    },
    "globalpulse-ai": {
        "client": 5179,
        "server": 8003,
        "name": "GlobalPulse AI",
        "framework": "Next.js 14 + React 18",
        "db": "SQLite / aiosqlite",
        "ai": "Gemini AI News Synthesizer",
    },
    "postcraft-ai": {
        "client": 5180,
        "server": None,
        "name": "PostCraft AI",
        "framework": "Next.js 14 Fullstack App Router",
        "db": "SQLite Database",
        "ai": "Integrated GenAI",
    },
    "devportal": {
        "client": 5181,
        "server": 8008,
        "name": "Soul Developer Portal",
        "framework": "React 19 + Vite 7 + Tailwind CSS v4",
        "db": "workspace.json & AST Store",
        "ai": "Gemini 2.5 Flash + AST Extractor",
    },
}

MONOREPO_PROJECTS = list(PORT_REGISTRY.keys())


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
