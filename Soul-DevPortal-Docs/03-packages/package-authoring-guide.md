# Authoring a New Shared Package

## Step-by-Step Creation Guide
Follow these step-by-step instructions to create a new shared package (e.g., `auth`):

### 1. Name the Package

Use kebab-case for the directory and NPM scope, and kebab-case for Python distribution:

* Directory: `Soul-DevPortal-Packages/auth`
* NPM Scope: `@workspace/auth`
* Python Distribution: `workspace-auth`

### 2. Scaffold the 2-Tier Directories

```powershell
New-Item -ItemType Directory -Force Soul-DevPortal-Packages/auth/internal
New-Item -ItemType Directory -Force Soul-DevPortal-Packages/auth/external
New-Item -ItemType Directory -Force Soul-DevPortal-Packages/auth/tests
```

### 3. Add Internal Implementation

Create `Soul-DevPortal-Packages/auth/internal/session.py`:

```python
"""Internal session verification engine."""
def verify_session_token(token: str) -> bool:
    return len(token) > 16
```

Create `Soul-DevPortal-Packages/auth/internal/__init__.py`:

```python
from .session import verify_session_token
__all__ = ["verify_session_token"]
```

### 4. Add Public External Facade

Create `Soul-DevPortal-Packages/auth/external/__init__.py`:

```python
"""Public Auth Facade (@workspace/auth)."""
import sys
from pathlib import Path

_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) not in sys.path:
    sys.path.insert(0, str(_pkg_root))

from internal.session import verify_session_token
__version__ = "1.0.0"
__all__ = ["verify_session_token", "__version__"]
```

### 5. Add Manifests (`package.json`, `pyproject.toml`, `setup.py`)

Add `package.json`:

```json
{
  "name": "@workspace/auth",
  "version": "1.0.0",
  "type": "module",
  "license": "MIT",
  "files": ["internal", "external", "README.md"],
  "scripts": {
    "test": "python tests/test_internal.py && python tests/test_external.py"
  }
}
```

Add `pyproject.toml`:

```toml
[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "workspace-auth"
version = "1.0.0"
requires-python = ">=3.11"

[tool.setuptools.packages.find]
where = ["."]
include = ["internal*", "external*"]

[tool.setuptools.package-data]
"*" = ["py.typed", "*.pyi"]
```

Add `setup.py`:

```python
from setuptools import setup, find_packages
setup(name="workspace-auth", version="1.0.0", packages=find_packages())
```

### 6. Register and Verify

```powershell
npm install
pip install -e Soul-DevPortal-Packages/auth
python Soul-DevPortal-Packages/auth/tests/test_external.py
```

---
