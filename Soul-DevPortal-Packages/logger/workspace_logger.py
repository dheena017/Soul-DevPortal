"""
Compatibility facade exposing `workspace_logger` for consumer micro-apps.
Re-exports the public logging API from `external`.
"""

from __future__ import annotations

from external import *  # noqa: F401, F403
from external import print_backend_banner as print_startup_banner  # noqa: F401
