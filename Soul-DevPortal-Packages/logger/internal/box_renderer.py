"""
Unicode Box Border and Dashboard Card Rendering Engine (@workspace/logger/internal).
Draws responsive 80-column double-line Unicode boxes with column alignment and ASCII fallback.
"""
from __future__ import annotations

import shutil
from typing import Any

from .colors import Colors, strip_ansi


def render_box(
    *args: Any,
    border_color: str = Colors.BRIGHT_CYAN,
    width: int | None = None,
    title: str | None = None,
    **kwargs: Any,
) -> str:
    """
    Renders a double-line Unicode box with exact column padding and ASCII fallback.
    Accepts:
      1) render_box(title, [(label, value, color), ...])
      2) render_box([lines], border_color=..., title=...)
    """
    box_title = title or ""
    box_lines: list[Any] = []

    if len(args) == 1:
        if isinstance(args[0], list):
            box_lines = args[0]
        elif isinstance(args[0], str):
            box_title = args[0]
    elif len(args) >= 2:
        if isinstance(args[0], str) and isinstance(args[1], list):
            box_title = args[0]
            box_lines = args[1]
        elif isinstance(args[0], list) and isinstance(args[1], str):
            box_lines = args[0]
            box_title = args[1]

    if width is None:
        term_width = shutil.get_terminal_size((80, 24)).columns
        width = max(70, min(80, term_width - 2))

    try:
        b_tl, b_tr, b_bl, b_br, b_ml, b_mr, b_h, b_v = "╔", "╗", "╚", "╝", "╠", "╣", "═", "║"
        top = f"{border_color}{b_tl}{b_h * width}{b_tr}{Colors.RESET}"
        mid = f"{border_color}{b_ml}{b_h * width}{b_mr}{Colors.RESET}"
        bot = f"{border_color}{b_bl}{b_h * width}{b_br}{Colors.RESET}"
        v_bar = f"{border_color}{b_v}{Colors.RESET}"

        clean_title = strip_ansi(box_title)
        title_pad = width - len(clean_title) - 3
        title_line = f"{v_bar}   {Colors.BRIGHT_WHITE}{Colors.BOLD}{box_title}{Colors.RESET}{' ' * max(0, title_pad)}{v_bar}"

        content_lines: list[str] = []
        for item in box_lines:
            if isinstance(item, tuple) and len(item) == 3:
                label, val, color = item
                prefix = f"   {label:<14}: "
                raw_len = len(prefix) + len(str(val))
                pad = width - raw_len
                line = f"{v_bar}{Colors.GRAY}{prefix}{Colors.RESET}{color}{val}{Colors.RESET}{' ' * max(0, pad)}{v_bar}"
                content_lines.append(line)
            else:
                line_str = str(item)
                raw_len = len(strip_ansi(line_str))
                pad = width - raw_len - 3
                line = f"{v_bar}   {line_str}{' ' * max(0, pad)}{v_bar}"
                content_lines.append(line)

        header_section = [top, title_line, mid] if box_title else [top]
        return "\n" + "\n".join(header_section + content_lines + [bot]) + "\n"

    except Exception:
        # Fallback to standard clean ASCII border
        ascii_top = f"+{'-' * width}+"
        out = [f"\n{ascii_top}"]
        if box_title:
            out.append(f"|   {box_title}{' ' * max(0, width - len(box_title) - 4)}|")
            out.append(f"+{'-' * width}+")
        for item in box_lines:
            if isinstance(item, tuple) and len(item) == 3:
                label, val, _ = item
                line_str = f"|   {label:<14}: {val}"
            else:
                line_str = f"|   {item}"
            out.append(f"{line_str}{' ' * max(0, width - len(strip_ansi(line_str)) + 1)}|")
        out.append(f"{ascii_top}\n")
        return "\n".join(out)


def safe_write_box(text: str) -> None:
    """Safely writes box text to sys.stdout, falling back to ASCII if console encoding lacks Unicode."""
    import sys
    try:
        sys.stdout.write(text)
        sys.stdout.flush()
    except (UnicodeEncodeError, UnicodeError):
        # Transliterate box drawing characters to clean ASCII
        ascii_text = (
            text.replace("╔", "+")
            .replace("╗", "+")
            .replace("╚", "+")
            .replace("╝", "+")
            .replace("╠", "+")
            .replace("╣", "+")
            .replace("═", "-")
            .replace("║", "|")
            .replace("╭", "+")
            .replace("╮", "+")
            .replace("╯", "+")
            .replace("╰", "+")
            .replace("─", "-")
            .replace("│", "|")
            .replace("├", "+")
            .replace("┤", "+")
            .replace("⚡", "*")
            .replace("🌐", "*")
            .replace("🚀", "*")
            .replace("⌨", "*")
            .replace("➔", "->")
            .replace("·", "-")
        )
        try:
            sys.stdout.write(ascii_text)
            sys.stdout.flush()
        except Exception:
            # Last-resort binary buffer write with utf-8 or replace
            if hasattr(sys.stdout, "buffer"):
                sys.stdout.buffer.write(text.encode("utf-8", errors="replace"))
                sys.stdout.buffer.flush()


__all__ = [
    "render_box",
    "safe_write_box",
]
