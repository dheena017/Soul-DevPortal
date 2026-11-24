"""
Docs Domain API Router.
Granular navigation across 4 categories, subfolder topics, and markdown tabs.
"""

from __future__ import annotations

from fastapi import APIRouter, HTTPException
from features.docs.service import DocService

router = APIRouter(prefix="/docs", tags=["Pillar 3: Docs"])
service = DocService()


@router.get("/navigation")
def get_docs_navigation():
    """Serves the 4 main top-level categories, their subfolder topics, and available tabs."""
    return service.get_navigation()


@router.get("/list-all")
def get_docs_list_all():
    """Recursively auto-discovers every markdown file across all 4 categories."""
    return service.get_all_docs()


@router.get("")
def get_docs_alias():
    """Alias for list-all."""
    return service.get_all_docs()


@router.get("/details/{category}/{topic}/{tab}")
def get_doc_tab_content(category: str, topic: str, tab: str):
    """Serves structured GFM AST blocks for a subfolder topic tab."""
    data = service.get_tab_content(category, topic, tab)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@router.get("/details/{category}/{doc_name}")
def get_doc_root_content(category: str, doc_name: str):
    """Serves structured GFM AST blocks for a root category document."""
    data = service.get_file_content(category, doc_name)
    if "error" in data:
        raise HTTPException(status_code=404, detail=data["error"])
    return data


@router.get("/{doc_id}")
def get_doc_by_id_compat(doc_id: str):
    """Compatibility resolver allowing frontend to query by slug or legacy ID."""
    doc_id_clean = doc_id.lower().strip()

    guide_mappings = {
        "rules": ("01-project-architecture", "golden-rules"),
        "projects-rules": ("01-project-architecture", "golden-rules"),
        "design": ("02-packages-architecture", "package-authoring-guide"),
        "packages-design": ("02-packages-architecture", "package-authoring-guide"),
        "ports": ("03-networking-and-ports", "port-allocation-matrix"),
        "port-architecture": ("03-networking-and-ports", "port-allocation-matrix"),
        "techstack": ("01-project-architecture", "project-framework", "main"),
        "tech-stack": ("01-project-architecture", "project-framework", "main"),
        "cheatsheet": ("04-cheatsheets", "compliance-checklist"),
        "compliance-cheatsheet": ("04-cheatsheets", "compliance-checklist"),
    }

    if doc_id_clean in guide_mappings:
        target = guide_mappings[doc_id_clean]
        if len(target) == 3:
            return service.get_tab_content(target[0], target[1], target[2])
        return service.get_file_content(target[0], target[1])

    all_docs = service.get_all_docs()
    match = next(
        (
            d for d in all_docs
            if d.get("id") == doc_id
            or d.get("tab") == doc_id
            or d.get("topic") == doc_id
            or doc_id in d.get("relativePath", "")
        ),
        None,
    )
    if match:
        if match.get("topic"):
            return service.get_tab_content(match["category"], match["topic"], match["tab"])
        return service.get_file_content(match["category"], match["tab"])

    raise HTTPException(status_code=404, detail=f"Documentation guide '{doc_id}' not found")
