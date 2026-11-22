"""
FastAPI router for CLI tools and argument specs.
"""

from __future__ import annotations

from fastapi import APIRouter
from core.workspace_service import WorkspaceService

router = APIRouter(prefix="/cli-tools", tags=["CLI Tools"])


@router.get("")
def list_cli_tools():
    """Lists all executable CLI tools found in package bin/ directories with their arguments."""
    service = WorkspaceService.get_instance()
    data = service.get_data()

    tools = []
    for pkg in data.get("packages", []):
        for cli in pkg.get("cliTools", []):
            tools.append({
                "packageId": pkg["id"],
                **cli,
            })
    return {
        "count": len(tools),
        "tools": tools,
    }
