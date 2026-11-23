"""
Unit tests for project registry and fuzzy discovery.
"""
import sys
from pathlib import Path

runner_root = Path(__file__).resolve().parent.parent
if str(runner_root) not in sys.path:
    sys.path.insert(0, str(runner_root))

from internal.registry import PROJECT_REGISTRY, resolve_project_name


def test_project_registry_entries():
    assert "apexmind-ai" in PROJECT_REGISTRY
    assert "outpass-system" in PROJECT_REGISTRY
    assert "free-api-hub" in PROJECT_REGISTRY
    assert len(PROJECT_REGISTRY) >= 8


def test_resolve_project_name_exact():
    name = resolve_project_name("apexmind-ai", PROJECT_REGISTRY)
    assert name == "apexmind-ai"


def test_resolve_project_name_case_insensitive():
    name = resolve_project_name("APEXMIND-AI", PROJECT_REGISTRY)
    assert name == "apexmind-ai"


def test_resolve_project_name_alias():
    name = resolve_project_name("apexmind", PROJECT_REGISTRY)
    assert name == "apexmind-ai"


if __name__ == "__main__":
    test_project_registry_entries()
    test_resolve_project_name_exact()
    test_resolve_project_name_case_insensitive()
    test_resolve_project_name_alias()
    print("✓ All registry tests passed!")
