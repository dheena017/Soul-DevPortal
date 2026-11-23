"""
ANSI Color and Style Constants and Terminal Control Utilities.
Provides 16-color, 256-color, and bright palette codes with Windows VT processing.
"""
from __future__ import annotations

import os
import re
import sys

_ANSI_ESCAPE_PATTERN = re.compile(r"\033\[[0-9;]*[a-zA-Z]")


def enable_windows_ansi_mode() -> bool:
    """Enables virtual terminal processing on Windows console (ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004)."""
    if sys.platform != "win32":
        return True

    try:
        import ctypes
        from ctypes import wintypes
        kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)
        h_out = kernel32.GetStdHandle(-11)  # STD_OUTPUT_HANDLE
        if h_out == -1 or h_out is None:
            return False
        mode = wintypes.DWORD()
        if kernel32.GetConsoleMode(h_out, ctypes.byref(mode)):
            if kernel32.SetConsoleMode(h_out, mode.value | 0x0004):
                if hasattr(sys.stdout, "reconfigure"):
                    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
                return True
    except Exception:
        pass
    return False


# Automatically attempt Windows VT initialization on import
enable_windows_ansi_mode()


def strip_ansi(text: str) -> str:
    """Removes all ANSI escape sequences from text for clean length calculation."""
    return _ANSI_ESCAPE_PATTERN.sub("", text)


def supports_color() -> bool:
    """Determines if the current execution environment supports ANSI colors."""
    if os.environ.get("NO_COLOR") is not None:
        return False
    if os.environ.get("FORCE_COLOR", "").strip() not in ("", "0"):
        return True
    return hasattr(sys.stdout, "isatty") and sys.stdout.isatty()


class Colors:
    """ANSI color escape sequences for 5-column terminal logging."""
    RESET = "\033[0m"
    BOLD = "\033[1m"
    DIM = "\033[2m"
    UNDERLINE = "\033[4m"

    # Standard Foreground
    BLACK = "\033[30m"
    RED = "\033[31m"
    GREEN = "\033[32m"
    YELLOW = "\033[33m"
    BLUE = "\033[34m"
    MAGENTA = "\033[35m"
    CYAN = "\033[36m"
    WHITE = "\033[37m"
    GRAY = "\033[90m"

    # Bright Foreground
    BRIGHT_RED = "\033[91m"
    BRIGHT_GREEN = "\033[92m"
    BRIGHT_YELLOW = "\033[93m"
    BRIGHT_BLUE = "\033[94m"
    BRIGHT_MAGENTA = "\033[95m"
    BRIGHT_CYAN = "\033[96m"
    BRIGHT_WHITE = "\033[97m"

    # Background Badges
    BG_RED = "\033[41m\033[97m\033[1m"
    BG_GREEN = "\033[42m\033[30m\033[1m"
    BG_YELLOW = "\033[43m\033[30m\033[1m"
    BG_BLUE = "\033[44m\033[97m\033[1m"
    BG_MAGENTA = "\033[45m\033[97m\033[1m"
    BG_CYAN = "\033[46m\033[30m\033[1m"
    BG_GRAY = "\033[100m\033[97m\033[1m"


__all__ = [
    "Colors",
    "strip_ansi",
    "supports_color",
    "enable_windows_ansi_mode",
]
