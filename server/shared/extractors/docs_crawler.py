"""
Docs Hierarchical Crawler.
Crawls the 4 main categories in Soul-DevPortal-Docs/, extracts topics, tabs, and GFM markdown blocks.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List

from shared.extractors.markdown_parser import extract_markdown_meta


CATEGORY_TITLES = {
    "01-project-architecture": "Project Architecture",
    "02-packages-architecture": "Packages Architecture",
    "03-networking-and-ports": "Networking & Ports",
    "04-cheatsheets": "Cheatsheets",
}


def crawl_docs_hierarchy(docs_root: Path) -> List[Dict[str, Any]]:
    """Crawls Soul-DevPortal-Docs/ returning 4 main navigation categories, topics, and tabs."""
    categories: List[Dict[str, Any]] = []
    if not docs_root.is_dir():
        return categories

    for cat_dir in sorted(docs_root.iterdir()):
        if not cat_dir.is_dir() or cat_dir.name.startswith("."):
            continue

        cat_id = cat_dir.name
        cat_title = CATEGORY_TITLES.get(cat_id, cat_id.split("-", 1)[-1].replace("-", " ").title())

        topics: List[Dict[str, Any]] = []
        root_tabs: List[Dict[str, Any]] = []

        for item in sorted(cat_dir.iterdir()):
            if item.is_dir() and not item.name.startswith("."):
                topic_id = item.name
                topic_title = topic_id.replace("-", " ").title()
                tabs: List[Dict[str, Any]] = []

                for md_file in sorted(item.glob("*.md")):
                    tab_id = md_file.stem
                    tab_title = "Specification" if tab_id == "main" else "Rules & Invariants" if tab_id == "rules" else tab_id.replace("-", " ").title()
                    try:
                        content = md_file.read_text(encoding="utf-8")
                        title, desc, headings = extract_markdown_meta(content, tab_title)
                    except Exception:
                        title, desc, headings = tab_title, "", []

                    tabs.append({
                        "id": tab_id,
                        "label": tab_title,
                        "title": title,
                        "description": desc,
                        "filename": md_file.name,
                        "relativePath": f"{cat_id}/{topic_id}/{md_file.name}",
                        "headings": headings,
                    })

                topics.append({
                    "id": topic_id,
                    "title": topic_title,
                    "tabs": tabs,
                })

            elif item.is_file() and item.suffix == ".md":
                tab_id = item.stem
                tab_title = tab_id.replace("-", " ").title()
                try:
                    content = item.read_text(encoding="utf-8")
                    title, desc, headings = extract_markdown_meta(content, tab_title)
                except Exception:
                    title, desc, headings = tab_title, "", []

                root_tabs.append({
                    "id": tab_id,
                    "label": tab_title,
                    "title": title,
                    "description": desc,
                    "filename": item.name,
                    "relativePath": f"{cat_id}/{item.name}",
                    "headings": headings,
                })

        categories.append({
            "id": cat_id,
            "title": cat_title,
            "topics": topics,
            "rootTabs": root_tabs,
        })

    return categories
