"""
Workspace Tools API Router for personal Tasks, Notes, Habits, Focus, Bookmarks, and Scratchpad state.
"""

from __future__ import annotations

from typing import Any

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel

from features.workspace_tools.service import WorkspaceToolsService

router = APIRouter(prefix="/workspace-tools", tags=["Workspace Productivity Tools"])


class WorkspaceStatePayload(BaseModel):
    data: Any


@router.get("/summary")
def get_workspace_tools_summary():
    """Returns item counts across saved human productivity namespaces."""
    return WorkspaceToolsService.get_summary()


@router.get("/state/{namespace}")
def get_workspace_tools_state(namespace: str):
    """Loads persisted JSON state for tasks, notes, habits, bookmarks, scratchpad, or focus."""
    try:
        return WorkspaceToolsService.get_state(namespace)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


@router.put("/state/{namespace}")
def save_workspace_tools_state(namespace: str, body: WorkspaceStatePayload):
    """Persists JSON state for a personal productivity namespace into SQLite WAL."""
    try:
        return WorkspaceToolsService.save_state(namespace, body.data)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
