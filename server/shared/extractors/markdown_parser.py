"""
Markdown parser converting text into structured blocks for rich rendering.
Extracts title from first # Header, summary, headings, code fences, and tables.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List, Tuple


def parse_markdown_to_blocks(markdown: str) -> List[Dict[str, Any]]:
    """Converts raw markdown into structured heading, code, table, and list blocks."""
    if not markdown:
        return []

    lines = markdown.replace("\ufeff", "").splitlines()
    blocks: List[Dict[str, Any]] = []
    in_code = False
    code_lang = ""
    code_lines: List[str] = []
    code_indent = 0

    index = 0
    while index < len(lines):
        line = lines[index]
        trimmed = line.strip()

        # Fenced code
        if trimmed.startswith("```"):
            if in_code:
                blocks.append({
                    "type": "code",
                    "language": code_lang,
                    "text": "\n".join(code_lines),
                })
                code_lines = []
                code_lang = ""
                in_code = False
                code_indent = 0
            else:
                in_code = True
                code_lang = trimmed[3:].strip()
                code_indent = len(line) - len(line.lstrip())
            index += 1
            continue

        if in_code:
            if code_indent > 0 and line.startswith(" " * code_indent):
                code_lines.append(line[code_indent:])
            else:
                code_lines.append(line)
            index += 1
            continue

        # Headings
        heading_match = re.match(r"^(#{1,6})\s+(.+)$", trimmed)
        if heading_match:
            level = len(heading_match.group(1))
            text = heading_match.group(2).strip()
            blocks.append({
                "type": f"h{level}",
                "level": level,
                "text": text,
            })
            index += 1
            continue

        # Callouts / Blockquotes
        if trimmed.startswith(">"):
            quote_text = trimmed.lstrip(">").strip()
            callout_type = "note"
            if "[!NOTE]" in quote_text:
                callout_type = "note"
                quote_text = quote_text.replace("[!NOTE]", "").strip()
            elif "[!TIP]" in quote_text:
                callout_type = "tip"
                quote_text = quote_text.replace("[!TIP]", "").strip()
            elif "[!IMPORTANT]" in quote_text:
                callout_type = "important"
                quote_text = quote_text.replace("[!IMPORTANT]", "").strip()
            elif "[!WARNING]" in quote_text:
                callout_type = "warning"
                quote_text = quote_text.replace("[!WARNING]", "").strip()
            elif "[!CAUTION]" in quote_text:
                callout_type = "caution"
                quote_text = quote_text.replace("[!CAUTION]", "").strip()

            blocks.append({
                "type": "callout",
                "calloutType": callout_type,
                "text": quote_text,
            })
            index += 1
            continue

        # Tables (e.g. | col1 | col2 |)
        if trimmed.startswith("|") and trimmed.endswith("|"):
            table_lines = [trimmed]
            index += 1
            while index < len(lines) and lines[index].strip().startswith("|") and lines[index].strip().endswith("|"):
                table_lines.append(lines[index].strip())
                index += 1

            if len(table_lines) >= 2:
                headers = [c.strip() for c in table_lines[0].strip("|").split("|")]
                rows = []
                for row_line in table_lines[2:]:
                    cols = [c.strip() for c in row_line.strip("|").split("|")]
                    rows.append(cols)
                blocks.append({
                    "type": "table",
                    "headers": headers,
                    "rows": rows,
                })
            continue

        # Paragraphs / Text
        if trimmed:
            blocks.append({
                "type": "p",
                "text": trimmed,
            })

        index += 1

    return blocks


def extract_markdown_meta(markdown: str, fallback_title: str) -> Tuple[str, str, List[Dict[str, Any]]]:
    """Extracts first H1 title, intro summary, and structured headings from markdown."""
    title = fallback_title
    description = ""
    headings = []

    lines = markdown.replace("\ufeff", "").splitlines()
    for line in lines:
        trimmed = line.strip()
        if not trimmed:
            continue
        if trimmed.startswith("# ") and title == fallback_title:
            title = trimmed[2:].strip()
        elif trimmed.startswith("## ") or trimmed.startswith("### "):
            level = 2 if trimmed.startswith("## ") else 3
            text = trimmed.lstrip("#").strip()
            headings.append({"level": level, "text": text})
        elif not description:
            if trimmed.startswith(">"):
                description = trimmed.lstrip(">").replace("[!NOTE]", "").replace("[!IMPORTANT]", "").strip()
            elif not trimmed.startswith("#") and not trimmed.startswith("```"):
                description = trimmed[:200]

    return title, description, headings
