"""Generate or print a clean .env.example template for Core, AI Providers, and GitHub Packages."""

from __future__ import annotations

import argparse
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

TEMPLATE = """# Soul-DevPortal Environment Template
# Copy to .env and fill in values as needed.

# Vite 8 SharedArrayBuffer (FFmpeg.wasm multi-threaded)
VITE_ENABLE_SHARED_ARRAY_BUFFER=false

# AI Orchestration & Cloud Providers
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
GEMINI_API_KEY=
FAL_KEY=
REPLICATE_API_TOKEN=
HEYGEN_API_KEY=

# GitHub Packages Publishing (@dheena017/*)
NODE_AUTH_TOKEN=
"""


def main() -> int:
    parser = argparse.ArgumentParser(description="Generate .env.example template.")
    parser.add_argument("--write", action="store_true", help="Write .env.example at repo root.")
    args = parser.parse_args()

    if args.write:
        target = ROOT / ".env.example"
        target.write_text(TEMPLATE, encoding="utf-8")
        print(f"Wrote {target}")
    else:
        print(TEMPLATE)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
