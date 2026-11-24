"""
Server Configuration.
"""

from __future__ import annotations

import os

PORT = int(os.environ.get("PORT", "8008"))
HOST = os.environ.get("HOST", "127.0.0.1")
LOG_LEVEL = os.environ.get("LOG_LEVEL", "warning")
APP_VERSION = "2.0.0"
SERVICE_NAME = "Soul-DevPortal-API"
