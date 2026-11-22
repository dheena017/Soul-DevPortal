"""
Canonical workspace paths resolver.
All data outputs are routed into backend/exporters/data/ with dedicated separated files.
"""

from __future__ import annotations

from pathlib import Path

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEVPORTAL_ROOT = BACKEND_DIR.parent
WEB_ROOT = DEVPORTAL_ROOT
PACKAGES_ROOT = DEVPORTAL_ROOT / "Soul-DevPortal-Packages"
PROJECTS_ROOT = DEVPORTAL_ROOT / "Soul-DevPortal-Projects"
DOCS_ROOT = DEVPORTAL_ROOT / "Soul-DevPortal-Docs"
WORKSPACE_ROOT = DEVPORTAL_ROOT

# Source Guides and Registry
PROJECTS_SOURCE_FILE = DEVPORTAL_ROOT / "projects.json"
PACKAGES_DESIGN_GUIDE = DOCS_ROOT / "PACKAGES_DESIGN_GUIDE.md"
PROJECTS_PORT_GUIDE = DOCS_ROOT / "PROJECTS_PORT_AND_FRAMEWORK_GUIDE.md"
TECH_STACK_GUIDE = DOCS_ROOT / "TECH_STACK.md"
