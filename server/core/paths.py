"""
Canonical workspace paths resolver.
All data outputs are routed into server/exporters/data/ with dedicated separated files.
"""

from __future__ import annotations

from pathlib import Path

SERVER_DIR = Path(__file__).resolve().parent.parent
BACKEND_DIR = SERVER_DIR  # Alias for backward compatibility
DEVPORTAL_ROOT = SERVER_DIR.parent
WEB_ROOT = DEVPORTAL_ROOT
PACKAGES_ROOT = DEVPORTAL_ROOT / "Soul-DevPortal-Packages"
PROJECTS_ROOT = DEVPORTAL_ROOT / "Soul-DevPortal-Projects"
DOCS_ROOT = DEVPORTAL_ROOT / "Soul-DevPortal-Docs"
WORKSPACE_ROOT = DEVPORTAL_ROOT

def _resolve_doc_path(relative_path: str, fallback_path: str) -> Path:
    p = DOCS_ROOT / relative_path
    if p.exists():
        return p
    return DOCS_ROOT / fallback_path


# Source Guides and Registry
PROJECTS_SOURCE_FILE = DEVPORTAL_ROOT / "projects.json"
PACKAGES_DESIGN_GUIDE = _resolve_doc_path("03-packages/package-authoring-guide.md", "PACKAGES_DESIGN_GUIDE.md")
PROJECTS_PORT_GUIDE = _resolve_doc_path("04-networking-and-ports/port-allocation-matrix.md", "PROJECTS_PORT_AND_FRAMEWORK_GUIDE.md")
TECH_STACK_GUIDE = _resolve_doc_path("02-tech-stack/programming-languages.md", "TECH_STACK.md")
PROJECTS_RULES_GUIDE = _resolve_doc_path("01-architecture/project-layout-rules.md", "PROJECTS_RULES_AND_STANDARDS_GUIDE.md")
COMPLIANCE_CHEATSHEET_GUIDE = _resolve_doc_path("06-cheatsheets/compliance-checklist.md", "MONOREPO_COMPLIANCE_CHEATSHEET.md")
