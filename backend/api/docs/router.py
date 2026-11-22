"""
[Pillar 3: Docs API Router]
Exposes structured GFM markdown guides stored in Soul-DevPortal-Docs/.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/docs", tags=["Pillar 3: Docs"])

GUIDES_CATALOG = [
  {
    "id": "design",
    "title": "Shared Packages Design Guide",
    "filename": "PACKAGES_DESIGN_GUIDE.md",
    "description": "Repository standards for naming, structure, installation, exports, imports, and package maintenance.",
  },
  {
    "id": "ports",
    "title": "Port & Framework Architecture Guide",
    "filename": "PROJECTS_PORT_AND_FRAMEWORK_GUIDE.md",
    "description": "Monorepo port allocation matrix, frontend & backend architecture, database assignments, and AI engine integrations.",
  },
  {
    "id": "techstack",
    "title": "Tech Stack & Ecosystem Standards",
    "filename": "TECH_STACK.md",
    "description": "Standardized technologies: Vite, Next.js, FastAPI, TypeScript, SQLite, Tailwind CSS, and testing specifications.",
  },
]


@router.get("")
def list_guides():
    """Returns available documentation guides catalog and summary."""
    return GUIDES_CATALOG


@router.get("/{guide_id}")
def get_guide_content(guide_id: str):
    """Retrieves structured AST markdown blocks for a specific guide."""
    service = WorkspaceService.get_instance()
    data = service.get_data()

    meta = next((g for g in GUIDES_CATALOG if g["id"] == guide_id), None)
    if not meta:
        raise HTTPException(status_code=404, detail=f"Guide '{guide_id}' not found. Available: design, ports, techstack")

    if guide_id == "design":
        blocks = data.get("guideBlocks", [])
    elif guide_id == "ports":
        blocks = data.get("portGuideBlocks", [])
    elif guide_id == "techstack":
        blocks = data.get("techStackBlocks", [])
    else:
        blocks = []

    return {
        "guideId": guide_id,
        "meta": meta,
        "blocksCount": len(blocks),
        "blocks": blocks,
    }
