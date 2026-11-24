"""
Server runtime initialization.
Exports app instance for Uvicorn.
"""

from __future__ import annotations

import sys
from pathlib import Path

# Add server root to sys.path
SERVER_ROOT = Path(__file__).resolve().parent.parent
if str(SERVER_ROOT) not in sys.path:
    sys.path.insert(0, str(SERVER_ROOT))

from app.factory import create_app

app = create_app()
