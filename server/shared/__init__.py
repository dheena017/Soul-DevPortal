from shared.paths import (
    SERVER_DIR,
    WORKSPACE_ROOT,
    PROJECTS_ROOT,
    PACKAGES_ROOT,
    DOCS_ROOT,
    DATA_DIR,
    DB_PATH,
    SCHEMA_PATH,
    ROOT_PACKAGE_JSON,
    ROOT_PROJECTS_JSON,
)
from shared.config import PORT, HOST, LOG_LEVEL, APP_VERSION, SERVICE_NAME
from shared.telemetry import compute_workspace_telemetry

__all__ = [
    "SERVER_DIR",
    "WORKSPACE_ROOT",
    "PROJECTS_ROOT",
    "PACKAGES_ROOT",
    "DOCS_ROOT",
    "DATA_DIR",
    "DB_PATH",
    "SCHEMA_PATH",
    "ROOT_PACKAGE_JSON",
    "ROOT_PROJECTS_JSON",
    "PORT",
    "HOST",
    "LOG_LEVEL",
    "APP_VERSION",
    "SERVICE_NAME",
    "compute_workspace_telemetry",
]
