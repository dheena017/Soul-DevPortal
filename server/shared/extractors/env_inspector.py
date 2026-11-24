"""
Dual Environment Inspector.
Inspects both .env.example (template baseline) and .env (active local configuration with masked secrets).
"""

from __future__ import annotations

import re
from pathlib import Path
from typing import Any, Dict, List


def inspect_dual_environment(project_dir: Path) -> Dict[str, Any]:
    """Inspects both .env.example and .env across root, client, and server folders."""
    env_keys: List[str] = []
    template_variables: List[Dict[str, Any]] = []
    active_keys: set[str] = set()

    # 1. Parse .env.example (Template baseline)
    example_files = [
        project_dir / ".env.example",
        project_dir / "server" / ".env.example",
        project_dir / "client" / ".env.example",
        project_dir / "frontend" / ".env.example",
    ]

    for ef in example_files:
        if ef.is_file():
            try:
                content = ef.read_text(encoding="utf-8")
                for line in content.splitlines():
                    trimmed = line.strip()
                    if not trimmed or trimmed.startswith("#"):
                        continue
                    if "=" in trimmed:
                        key, val = trimmed.split("=", 1)
                        key = key.strip()
                        val = val.strip().strip("'\"")
                        if key and key not in env_keys:
                            env_keys.append(key)
                            is_secret = any(s in key.upper() for s in ("SECRET", "KEY", "TOKEN", "PASSWORD", "CREDENTIAL"))
                            template_variables.append({
                                "key": key,
                                "defaultValue": "••••••••" if is_secret else val,
                                "isSecret": is_secret,
                                "scope": "client" if key.startswith("VITE_") else "server",
                            })
            except Exception:
                pass

    # 2. Check active .env file (if present locally, securely masked)
    env_files = [
        project_dir / ".env",
        project_dir / "server" / ".env",
        project_dir / "client" / ".env",
    ]

    for enf in env_files:
        if enf.is_file():
            try:
                content = enf.read_text(encoding="utf-8")
                for line in content.splitlines():
                    trimmed = line.strip()
                    if trimmed and not trimmed.startswith("#") and "=" in trimmed:
                        key = trimmed.split("=", 1)[0].strip()
                        if key:
                            active_keys.add(key)
                            if key not in env_keys:
                                env_keys.append(key)
            except Exception:
                pass

    # Build active items with safe display values
    items = []
    for var in template_variables:
        key = var["key"]
        is_set = key in active_keys
        items.append({
            "key": key,
            "isSecret": var["isSecret"],
            "scope": var["scope"],
            "isSet": is_set,
            "displayValue": var["defaultValue"],
        })

    return {
        "envKeys": env_keys,
        "totalVariables": len(env_keys),
        "activeCount": len(active_keys),
        "variables": items,
        "sampleEnvFile": "\n".join(f"{v['key']}={v['defaultValue']}" for v in template_variables),
    }
