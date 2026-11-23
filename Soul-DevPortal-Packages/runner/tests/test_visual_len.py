"""
Unit tests for visual string length calculation with ANSI codes and Unicode/emojis.
"""
import sys
from pathlib import Path

# Ensure runner root is in path
runner_root = Path(__file__).resolve().parent.parent
if str(runner_root) not in sys.path:
    sys.path.insert(0, str(runner_root))

from internal.installer import _visual_len


def test_plain_ascii_length():
    assert _visual_len("Hello World") == 11
    assert _visual_len("") == 0
    assert _visual_len("12345") == 5


def test_ansi_color_stripping():
    # ANSI escape sequences should contribute 0 to visual length
    colored = "\033[31mHello\033[0m \033[32mWorld\033[0m"
    assert _visual_len(colored) == 11


def test_unicode_box_characters():
    box_line = "╭" + "─" * 10 + "╮"
    assert _visual_len(box_line) == 12


def test_emoji_presentation_width():
    # Emojis like ⚡, 📦, 🐍 take 2 visual columns
    assert _visual_len("⚡") == 2
    assert _visual_len("📦") == 2
    assert _visual_len("🐍") == 2
    assert _visual_len("🎉") == 2


if __name__ == "__main__":
    test_plain_ascii_length()
    test_ansi_color_stripping()
    test_unicode_box_characters()
    test_emoji_presentation_width()
    print("✓ All visual_len tests passed!")
