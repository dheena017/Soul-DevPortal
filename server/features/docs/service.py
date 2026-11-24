"""
Docs Domain Service.
Hierarchical navigation across the 4 main categories, topics, and granular tabs.
"""

from __future__ import annotations

from pathlib import Path
from typing import Any, Dict, List, Optional

from shared.paths import DOCS_ROOT
from shared.extractors.docs_crawler import crawl_docs_hierarchy
from shared.extractors.markdown_parser import parse_markdown_to_blocks


class DocService:
    def __init__(self, docs_root: Path = DOCS_ROOT):
        self.docs_root = docs_root

    def get_navigation(self) -> List[Dict[str, Any]]:
        """Returns the 4 main navigation categories, their topics, and available tabs."""
        return crawl_docs_hierarchy(self.docs_root)

    def get_all_docs(self) -> List[Dict[str, Any]]:
        """Recursively flattens all discovered markdown files across all 4 categories."""
        hierarchy = self.get_navigation()
        flattened: List[Dict[str, Any]] = []

        for cat in hierarchy:
            cat_id = cat["id"]
            cat_title = cat["title"]

            for topic in cat.get("topics", []):
                topic_id = topic["id"]
                topic_title = topic["title"]
                for tab in topic.get("tabs", []):
                    flattened.append({
                        "id": f"{cat_id}::{topic_id}::{tab['id']}",
                        "category": cat_id,
                        "categoryTitle": cat_title,
                        "topic": topic_id,
                        "topicTitle": topic_title,
                        "tab": tab["id"],
                        "title": tab["title"],
                        "description": tab["description"],
                        "relativePath": tab["relativePath"],
                        "headings": tab.get("headings", []),
                    })

            for rtab in cat.get("rootTabs", []):
                flattened.append({
                    "id": f"{cat_id}::{rtab['id']}",
                    "category": cat_id,
                    "categoryTitle": cat_title,
                    "topic": None,
                    "topicTitle": None,
                    "tab": rtab["id"],
                    "title": rtab["title"],
                    "description": rtab["description"],
                    "relativePath": rtab["relativePath"],
                    "headings": rtab.get("headings", []),
                })

        return flattened

    def get_tab_content(self, category: str, topic: str, tab: str) -> Dict[str, Any]:
        """Slices and serves structured GFM AST blocks for a subfolder topic tab."""
        # Clean potential extension
        tab_name = tab.replace(".md", "")
        file_path = self.docs_root / category / topic / f"{tab_name}.md"

        if not file_path.is_file():
            return {"error": f"Doc file not found: {file_path.relative_to(self.docs_root.parent)}"}

        content = file_path.read_text(encoding="utf-8")
        blocks = parse_markdown_to_blocks(content)
        headings = [b for b in blocks if b["type"] in ("h1", "h2", "h3")]
        code_snippets = [b for b in blocks if b["type"] == "code"]
        tables = [b for b in blocks if b["type"] == "table"]
        callouts = [b for b in blocks if b["type"] == "callout"]

        title = headings[0]["text"] if headings else tab_name.replace("-", " ").title()

        return {
            "category": category,
            "topic": topic,
            "tab": tab_name,
            "title": title,
            "relativePath": f"{category}/{topic}/{tab_name}.md",
            "blocks": blocks,
            "headings": headings,
            "snippets": code_snippets,
            "tables": tables,
            "highlights": callouts,
        }

    def get_file_content(self, category: str, doc_name: str) -> Dict[str, Any]:
        """Slices and serves structured GFM AST blocks for a root category document."""
        doc_clean = doc_name.replace(".md", "")
        file_path = self.docs_root / category / f"{doc_clean}.md"

        if not file_path.is_file():
            return {"error": f"Doc file not found: {category}/{doc_clean}.md"}

        content = file_path.read_text(encoding="utf-8")
        blocks = parse_markdown_to_blocks(content)
        headings = [b for b in blocks if b["type"] in ("h1", "h2", "h3")]
        code_snippets = [b for b in blocks if b["type"] == "code"]
        tables = [b for b in blocks if b["type"] == "table"]
        callouts = [b for b in blocks if b["type"] == "callout"]

        title = headings[0]["text"] if headings else doc_clean.replace("-", " ").title()

        return {
            "category": category,
            "topic": None,
            "tab": doc_clean,
            "title": title,
            "relativePath": f"{category}/{doc_clean}.md",
            "blocks": blocks,
            "headings": headings,
            "snippets": code_snippets,
            "tables": tables,
            "highlights": callouts,
        }
