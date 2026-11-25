"""
Workspace Path Resolvers.
Resolves all monorepo paths dynamically without hardcoded absolute paths.
"""

from __future__ import annotations

import os
from pathlib import Path

# server/ directory
SERVER_DIR = Path(__file__).resolve().parent.parent

# Workspace root (supports SOUL_WORKSPACE_ROOT override in packaged desktop builds)
_env_workspace = os.environ.get("SOUL_WORKSPACE_ROOT")
WORKSPACE_ROOT = Path(_env_workspace).resolve() if _env_workspace else SERVER_DIR.parent

# Core monorepo directories
PROJECTS_ROOT = WORKSPACE_ROOT / "Soul-DevPortal-Projects"
PACKAGES_ROOT = WORKSPACE_ROOT / "Soul-DevPortal-Packages"
DOCS_ROOT = WORKSPACE_ROOT / "Soul-DevPortal-Docs"

# Server data & database
_env_data_dir = os.environ.get("SOUL_DATA_DIR")
DATA_DIR = Path(_env_data_dir).resolve() if _env_data_dir else SERVER_DIR / "data"
DATABASE_DIR = SERVER_DIR / "database"
DB_PATH = DATA_DIR / "workspace.db"
SCHEMA_PATH = DATABASE_DIR / "schema.sql"

# Root manifests
_env_package_json = os.environ.get("SOUL_PACKAGE_JSON")
ROOT_PACKAGE_JSON = Path(_env_package_json).resolve() if _env_package_json else WORKSPACE_ROOT / "package.json"
ROOT_PROJECTS_JSON = WORKSPACE_ROOT / "projects.json"
