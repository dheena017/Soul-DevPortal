"""
Workspace Path Resolvers.
Resolves all monorepo paths dynamically without hardcoded absolute paths.
"""

from __future__ import annotations

from pathlib import Path

# server/ directory
SERVER_DIR = Path(__file__).resolve().parent.parent

# Workspace root
WORKSPACE_ROOT = SERVER_DIR.parent

# Core monorepo directories
PROJECTS_ROOT = WORKSPACE_ROOT / "Soul-DevPortal-Projects"
PACKAGES_ROOT = WORKSPACE_ROOT / "Soul-DevPortal-Packages"
DOCS_ROOT = WORKSPACE_ROOT / "Soul-DevPortal-Docs"

# Server data & database
DATA_DIR = SERVER_DIR / "data"
DATABASE_DIR = SERVER_DIR / "database"
DB_PATH = DATA_DIR / "workspace.db"
SCHEMA_PATH = DATABASE_DIR / "schema.sql"

# Root manifests
ROOT_PACKAGE_JSON = WORKSPACE_ROOT / "package.json"
ROOT_PROJECTS_JSON = WORKSPACE_ROOT / "projects.json"
