"""
Preset inspector for config package (Tailwind, ESLint, Prettier, Ruff, Pytest).
"""

from __future__ import annotations

import json
import re
from pathlib import Path
from typing import Any, Dict, Optional


def inspect_config_presets(config_dir: Path) -> Optional[Dict[str, Any]]:
    """Reads tokens and configuration files from packages/config."""
    if not config_dir.exists():
        return None

    # Tailwind Tokens
    tokens_data = None
    tokens_file = config_dir / "tailwind" / "tokens.js"
    if tokens_file.exists():
        try:
            js_code = tokens_file.read_text(encoding="utf-8")
            token_match = re.search(r"export\s+const\s+tokens\s*=\s*(\{[\s\S]*?\n\});", js_code)
            if token_match:
                tokens_data = {"raw": token_match.group(1)}
        except Exception:
            pass

    # Prettier
    prettier_data = None
    prettier_file = config_dir / "prettier" / "index.json"
    if prettier_file.exists():
        try:
            prettier_data = json.loads(prettier_file.read_text(encoding="utf-8"))
        except Exception:
            pass

    # TSConfigs
    tsconfigs: Dict[str, Any] = {}
    tsconfig_dir = config_dir / "tsconfig"
    if tsconfig_dir.exists():
        for tsf in tsconfig_dir.glob("*.json"):
            try:
                tsconfigs[tsf.stem] = json.loads(tsf.read_text(encoding="utf-8"))
            except Exception:
                pass

    # Python Ruff & Pytest
    ruff_text = (config_dir / "python" / "ruff.toml").read_text(encoding="utf-8") if (config_dir / "python" / "ruff.toml").exists() else ""
    pytest_text = (config_dir / "python" / "pytest.ini").read_text(encoding="utf-8") if (config_dir / "python" / "pytest.ini").exists() else ""

    return {
        "tokens": tokens_data,
        "prettier": prettier_data,
        "tsconfigs": tsconfigs,
        "ruff": ruff_text,
        "pytest": pytest_text,
    }
