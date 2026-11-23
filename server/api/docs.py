"""
[Pillar 3: Docs API Router]
Exposes structured GFM markdown guides stored in Soul-DevPortal-Docs/.
Also provides legacy /api/guides endpoint for backward compatibility.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from core.workspace_service import WorkspaceService

router = APIRouter(tags=["Pillar 3: Docs"])

GUIDES_CATALOG = [
    {
        "id": "rules",
        "slug": "projects-rules",
        "title": "Projects Rules & Standards",
        "filename": "PROJECTS_RULES_AND_STANDARDS_GUIDE.md",
        "description": "Authoritative golden rulebook governing all 8 workspace applications: directory structure, strict ports, shared packages, and FastAPI routing.",
        "badge": "OFFICIAL SPEC v1.0",
        "category": "rules",
        "icon": "📜",
    },
    {
        "id": "cheatsheet",
        "slug": "compliance-cheatsheet",
        "title": "Monorepo Compliance Cheatsheet",
        "filename": "MONOREPO_COMPLIANCE_CHEATSHEET.md",
        "description": "Quick-reference operational checklists, top 10 rules, directory anatomy, strict port matrix, and supervisor CLI commands.",
        "badge": "QUICK REFERENCE",
        "category": "cheatsheet",
        "icon": "📋",
    },
    {
        "id": "design",
        "slug": "packages-design",
        "title": "Shared Packages Design Guide",
        "filename": "PACKAGES_DESIGN_GUIDE.md",
        "description": "Repository standards for naming, structure, installation, exports, imports, and package maintenance.",
        "badge": "PACKAGE BLUEPRINT",
        "category": "design",
        "icon": "📘",
    },
    {
        "id": "ports",
        "slug": "port-architecture",
        "title": "Port & Framework Architecture Guide",
        "filename": "PROJECTS_PORT_AND_FRAMEWORK_GUIDE.md",
        "description": "Monorepo port allocation matrix, frontend & backend architecture, database assignments, and AI engine integrations.",
        "badge": "PORT TOPOLOGY",
        "category": "ports",
        "icon": "🔌",
    },
    {
        "id": "techstack",
        "slug": "tech-stack",
        "title": "Tech Stack & Ecosystem Standards",
        "filename": "TECH_STACK.md",
        "description": "Standardized technologies: Vite, Next.js, FastAPI, TypeScript, SQLite, Tailwind CSS, and testing specifications.",
        "badge": "ECOSYSTEM STANDARDS",
        "category": "techstack",
        "icon": "⚡",
    },
]


@router.get("/docs")
def list_guides():
    """Returns available documentation guides catalog and summary."""
    return GUIDES_CATALOG


@router.get("/docs/{guide_id}")
def get_guide_content(guide_id: str):
    """Retrieves structured AST markdown blocks for a specific guide."""
    service = WorkspaceService.get_instance()
    data = service.get_data()

    meta = next(
        (g for g in GUIDES_CATALOG if g["id"] == guide_id or g.get("slug") == guide_id or g.get("category") == guide_id),
        None,
    )
    if not meta:
        raise HTTPException(
            status_code=404,
            detail=f"Guide '{guide_id}' not found. Available: {', '.join(g['id'] for g in GUIDES_CATALOG)}",
        )

    canonical_id = meta["id"]
    if canonical_id == "rules":
        blocks = data.get("projectRulesBlocks", [])
    elif canonical_id == "cheatsheet":
        blocks = data.get("cheatsheetBlocks", [])
    elif canonical_id == "design":
        blocks = data.get("guideBlocks", [])
    elif canonical_id == "ports":
        blocks = data.get("portGuideBlocks", [])
    elif canonical_id == "techstack":
        blocks = data.get("techStackBlocks", [])
    else:
        blocks = []

    return {
        "id": meta["id"],
        "slug": meta.get("slug", meta["id"]),
        "title": meta["title"],
        "filename": meta["filename"],
        "description": meta["description"],
        "badge": meta.get("badge"),
        "category": meta.get("category"),
        "icon": meta.get("icon"),
        "blocks": blocks,
    }


@router.get("/guides")
def get_monorepo_guides():
    """Backward-compatible endpoint returning legacy guide blocks structure."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    return {
        "packagesDesignGuide": data.get("guideBlocks", []),
        "projectsPortGuide": data.get("portGuideBlocks", []),
        "techStackGuide": data.get("techStackBlocks", []),
    }
