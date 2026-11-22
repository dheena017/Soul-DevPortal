"""
FastAPI router for monorepo architecture and design guides.
"""

from __future__ import annotations

from fastapi import APIRouter
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/guides", tags=["Guides"])


@router.get("")
def get_monorepo_guides():
    """Returns structured markdown blocks for packages guide, port allocation guide, and tech stack."""
    service = WorkspaceService.get_instance()
    data = service.get_data()
    return {
        "packagesDesignGuide": data.get("guideBlocks", []),
        "projectsPortGuide": data.get("portGuideBlocks", []),
        "techStackGuide": data.get("techStackBlocks", []),
    }
