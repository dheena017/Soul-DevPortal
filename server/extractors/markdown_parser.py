"""
Markdown parser converting text into structured blocks for rich rendering.
"""

from __future__ import annotations

import re
from typing import Any, Dict, List


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

        # Fenced code (handling indented code blocks inside markdown lists)
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
        heading_match = re.match(r"^(#{1,4})\s+(.+)$", line)
        if heading_match:
            level = len(heading_match.group(1))
            raw_text = heading_match.group(2).strip()
            clean_text = re.sub(r"[*_`]", "", raw_text)
            heading_id = re.sub(r"\s+", "-", re.sub(r"[^\w\s-]", "", clean_text.lower()))
            blocks.append({
                "type": f"h{level}",
                "text": clean_text,
                "id": heading_id,
            })
            index += 1
            continue

        # Tables
        next_line = lines[index + 1] if index + 1 < len(lines) else ""
        table_delim_pattern = r"^\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?$"
        if re.match(r"^\|?.+\|.+\|?$", line) and re.match(table_delim_pattern, next_line):
            def parse_cells(v: str) -> List[str]:
                cells = v.strip().strip("|").split("|")
                return [c.strip() for c in cells]

            headers = parse_cells(line)
            rows: List[List[str]] = []
            index += 2
            while index < len(lines) and re.match(r"^\|?.*\|.*\|?$", lines[index]) and lines[index].strip():
                rows.append(parse_cells(lines[index]))
                index += 1
            blocks.append({
                "type": "table",
                "headers": headers,
                "rows": rows,
            })
            continue

        stripped = line.strip()
        if not stripped or re.match(r"^-{3,}$", stripped):
            index += 1
            continue

        # Quotes
        quote_match = re.match(r"^>\s*(.+)$", line)
        if quote_match:
            blocks.append({
                "type": "quote",
                "text": re.sub(r"\*\*(.+?)\*\*", r"\1", quote_match.group(1)),
            })
            index += 1
            continue

        # Bullet lists
        bullet_match = re.match(r"^\s*[-*]\s+(.+)$", line)
        if bullet_match:
            blocks.append({
                "type": "list",
                "text": bullet_match.group(1),
            })
            index += 1
            continue

        # Ordered lists
        ordered_match = re.match(r"^\s*(\d+)[.)]\s+(.+)$", line)
        if ordered_match:
            blocks.append({
                "type": "ordered",
                "number": int(ordered_match.group(1)),
                "text": ordered_match.group(2),
            })
            index += 1
            continue

        blocks.append({
            "type": "p",
            "text": stripped,
        })
        index += 1

    if in_code:
        blocks.append({
            "type": "code",
            "language": code_lang,
            "text": "\n".join(code_lines),
        })

    return blocks
