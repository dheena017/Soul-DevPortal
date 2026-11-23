"""
Workspace Service Manager.
Maintains in-memory live workspace cache, triggers AST scans,
and probes live socket port statuses for consumer projects.
"""

from __future__ import annotations

import ast
import json
import re
import socket
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, List, Optional

from core.paths import (
    SERVER_DIR,
    BACKEND_DIR,
    COMPLIANCE_CHEATSHEET_GUIDE,
    PACKAGES_DESIGN_GUIDE,
    PACKAGES_ROOT,
    PROJECTS_PORT_GUIDE,
    PROJECTS_ROOT,
    PROJECTS_RULES_GUIDE,
    PROJECTS_SOURCE_FILE,
    TECH_STACK_GUIDE,
    WORKSPACE_ROOT,
)
from core.telemetry import compute_workspace_telemetry
from extractors import (
    inspect_cli_tool,
    inspect_config_presets,
    parse_markdown_to_blocks,
    parse_python_symbols,
    parse_typescript_symbols,
    read_package_manifests,
)

IGNORE_DIRS = {
    "node_modules",
    "__pycache__",
    ".git",
    ".venv",
    ".pytest_cache",
    "dist",
    ".turbo",
    ".DS_Store",
}

TEXT_EXTENSIONS = {
    ".ts", ".tsx", ".js", ".jsx", ".json", ".py", ".toml", ".ini",
    ".md", ".css", ".html", ".txt", ".yaml", ".yml",
}


PROJECT_FALLBACK_DESCRIPTIONS: Dict[str, str] = {
    "apexmind-ai": "Automated motivational quote video generation, AI scriptwriting, voiceover synthesis with Gemini, and seamless YouTube publishing.",
    "sonikoma": "AI anime character voiceover synthesis, multi-track timeline editor, and video generation studio powered by Gemini AI.",
    "outpass-system": "Digital hostel student permission, warden gate pass authorization, and leave approval tracking system.",
    "free-api-hub": "Curated open developer APIs catalog, mock data endpoints, and interactive REST playground.",
    "spatial-dimensions": "Interactive 3D web spatial canvas with motion dimensions and reactive sound engine.",
    "college-management-system": "Campus hostel management, student attendance, room allocation directory, and billing workflows.",
    "globalpulse-ai": "Real-time international news aggregator and breaking alerts synthesizer powered by Gemini AI.",
    "postcraft-ai": "Multi-platform social media post generation, smart publishing scheduler, and AI marketing assistant.",
}

PROJECT_TAGS_MAP: Dict[str, List[str]] = {
    "apexmind-ai": ["React 19", "FastAPI", "Gemini AI", "YouTube API"],
    "sonikoma": ["React 19", "FastAPI", "Voice AI", "Supabase"],
    "outpass-system": ["React 18", "Python", "SQLAlchemy", "PWA"],
    "free-api-hub": ["React 18", "FastAPI", "REST APIs", "Docker"],
    "spatial-dimensions": ["React 19", "Motion", "Vite 6", "3D Web"],
    "college-management-system": ["React 19", "Node.js", "SQLite", "Tailwind v4"],
    "globalpulse-ai": ["Next.js 14", "React 18", "Gemini AI", "aiosqlite"],
    "postcraft-ai": ["Next.js 14", "App Router", "GenAI", "Tailwind"],
}


def inspect_consumer_project(pid: str, spec: Dict[str, Any], projects_root: Path) -> Dict[str, Any]:
    """Inspects consumer project directory to construct rich AST and metadata."""
    proj_dir = projects_root / pid
    metadata: Dict[str, Any] = {}
    meta_path = proj_dir / "metadata.json"
    if meta_path.exists():
        try:
            metadata = json.loads(meta_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    pkg: Dict[str, Any] = {}
    pkg_path = proj_dir / "package.json"
    if pkg_path.exists():
        try:
            pkg = json.loads(pkg_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    env_keys: List[str] = []
    env_file = proj_dir / ".env.example"
    if not env_file.exists():
        env_file = proj_dir / ".env"
    if env_file.exists():
        try:
            for line in env_file.read_text(encoding="utf-8").splitlines():
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    key = line.split("=", 1)[0].strip()
                    if key and key not in env_keys:
                        env_keys.append(key)
        except Exception:
            pass

    if not env_keys and metadata.get("configuration"):
        env_keys = metadata.get("configuration", [])

    readme_blocks: List[Any] = []
    readme_path = proj_dir / "README.md"
    if readme_path.exists():
        try:
            readme_blocks = parse_markdown_to_blocks(readme_path.read_text(encoding="utf-8"))
        except Exception:
            pass

    tables: List[str] = []
    try:
        table_re = re.compile(r"CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?[\"`]?([a-zA-Z0-9_]+)", re.IGNORECASE)
        for sql_file in proj_dir.rglob("*.sql"):
            if any(ignored in sql_file.parts for ignored in IGNORE_DIRS):
                continue
            content = sql_file.read_text(encoding="utf-8", errors="ignore")
            for match in table_re.finditer(content):
                tbl = match.group(1)
                if tbl not in tables:
                    tables.append(tbl)
    except Exception:
        pass
    if not tables:
        tables = ["users", "sessions", "activity_logs", "settings"]

    file_tree: List[str] = []
    try:
        for p in proj_dir.rglob("*"):
            if any(part in IGNORE_DIRS or part.startswith(".") for part in p.relative_to(proj_dir).parts):
                continue
            rel = str(p.relative_to(proj_dir)).replace("\\", "/")
            if rel.count("/") < 3:
                file_tree.append(rel)
    except Exception:
        pass

    description = metadata.get("description") or PROJECT_FALLBACK_DESCRIPTIONS.get(
        pid, f"{spec.get('title', pid)} micro-application."
    )
    tags = PROJECT_TAGS_MAP.get(pid, [])
    if not tags:
        tags = [t.strip() for t in spec.get("framework", "Fullstack").split("+") if t.strip()]

    PROJECT_LOGOS = {
        "apexmind-ai": "/project-logos/apexmind-ai.png",
        "outpass-system": "/project-logos/outpass-system.svg",
        "free-api-hub": "/project-logos/free-api-hub.png",
        "sonikoma": "/project-logos/sonikoma.png",
        "spatial-dimensions": "/project-logos/spatial-dimensions.svg",
        "college-management-system": "/project-logos/college-management-system.svg",
        "globalpulse-ai": "/project-logos/globalpulse-ai.svg",
        "postcraft-ai": "/project-logos/postcraft-ai.svg",
        "devportal": "/favicon.svg",
    }

    return {
        "id": pid,
        "title": spec.get("title", pid),
        "logo": PROJECT_LOGOS.get(pid, "/favicon.svg"),
        "frontendPort": spec.get("frontend_port"),
        "backendPort": spec.get("backend_port"),
        "frontendActive": is_port_active(spec.get("frontend_port")),
        "backendActive": is_port_active(spec.get("backend_port")),
        "frontendCmd": " ".join(spec["frontend_cmd"]) if isinstance(spec.get("frontend_cmd"), list) else spec.get("frontend_cmd", ""),
        "backendCmd": " ".join(spec["backend_cmd"]) if isinstance(spec.get("backend_cmd"), list) else spec.get("backend_cmd"),
        "framework": spec.get("framework", "Web Application"),
        "dbInfo": spec.get("db_info", "Local Storage"),
        "aiEngine": spec.get("ai_engine", "N/A"),
        "description": description,
        "version": pkg.get("version", "1.0.0"),
        "features": metadata.get("features", [
            "Autonomous fullstack service in Soul Monorepo",
            f"Strict port allocation (FE :{spec.get('frontend_port')} / BE :{spec.get('backend_port')})",
            "Zero drift shared library architecture",
        ]),
        "apiEndpoints": metadata.get("apiEndpoints", [
            "GET /api/health",
            "GET /api/status",
        ]),
        "localServices": metadata.get("localServices", {
            "client": f"http://localhost:{spec.get('frontend_port')}",
            "server": f"http://localhost:{spec.get('backend_port')}" if spec.get("backend_port") else None,
        }),
        "configuration": metadata.get("configuration", env_keys),
        "scripts": pkg.get("scripts", {}),
        "dependencies": pkg.get("dependencies", {}),
        "devDependencies": pkg.get("devDependencies", {}),
        "envKeys": env_keys,
        "tables": tables,
        "readmeBlocks": readme_blocks,
        "fileTree": file_tree,
        "tags": tags,
    }


def is_port_active(port: Optional[int], host: str = "127.0.0.1") -> bool:
    """Checks whether a TCP port is actively listening (live socket probe)."""
    if not port or port <= 0:
        return False
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.settimeout(0.15)
            return sock.connect_ex((host, port)) == 0
    except Exception:
        return False


def extract_python_exports(pdir: Path, py_module: Optional[str]) -> List[str]:
    """Extracts public python exports from __init__.py or AST symbols."""
    if not py_module:
        return []
    init_file = pdir / py_module / "__init__.py"
    if not init_file.exists():
        return []
    try:
        content = init_file.read_text(encoding="utf-8")
        tree = ast.parse(content)
        for node in tree.body:
            if isinstance(node, ast.Assign):
                for target in node.targets:
                    if isinstance(target, ast.Name) and target.id == "__all__":
                        if isinstance(node.value, (ast.List, ast.Tuple)):
                            return [elt.value for elt in node.value.elts if isinstance(elt, ast.Constant)]
        exports = []
        for node in tree.body:
            if isinstance(node, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef)):
                if not node.name.startswith("_"):
                    exports.append(node.name)
            elif isinstance(node, ast.ImportFrom):
                for alias in node.names:
                    if not alias.name.startswith("_"):
                        exports.append(alias.asname or alias.name)
        return sorted(list(set(exports)))
    except Exception:
        return []


def extract_typescript_exports(pdir: Path) -> List[str]:
    """Extracts public exported TypeScript symbol names from src/."""
    src_dir = pdir / "src"
    if not src_dir.exists():
        return []
    names = set()
    for ts_file in src_dir.glob("*.ts*"):
        try:
            content = ts_file.read_text(encoding="utf-8")
            for match in re.finditer(r"export\s+(?:const|let|var|function|class|interface|type|enum)\s+([A-Za-z_$][\w$]*)", content):
                names.add(match.group(1))
            for match in re.finditer(r"export\s+\{([^}]+)\}", content):
                for item in match.group(1).split(","):
                    clean = item.strip().split(" as ")[0].split(" from ")[0].strip()
                    if clean:
                        names.add(clean)
        except Exception:
            pass
    return sorted(list(names))


class WorkspaceService:
    """Singleton service providing live workspace data and state."""

    _instance: Optional[WorkspaceService] = None

    def __init__(self):
        self._cache: Optional[Dict[str, Any]] = None
        self._last_scan: Optional[datetime] = None

    @classmethod
    def get_instance(cls) -> WorkspaceService:
        if cls._instance is None:
            cls._instance = WorkspaceService()
        return cls._instance

    def _scan_files(self, directory: Path) -> List[Dict[str, Any]]:
        import os
        files: List[Dict[str, Any]] = []
        for root, dirs, filenames in os.walk(directory):
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
            for filename in filenames:
                if filename.endswith(".pyc"):
                    continue
                full_path = Path(root) / filename
                try:
                    rel_path = full_path.relative_to(directory).as_posix()
                except ValueError:
                    rel_path = full_path.name
                stat = full_path.stat()
                ext = full_path.suffix.lower()
                content = ""
                if ext in TEXT_EXTENSIONS and stat.st_size < 500_000:
                    try:
                        content = full_path.read_text(encoding="utf-8")
                    except Exception:
                        content = ""
                files.append({
                    "name": filename,
                    "path": rel_path,
                    "ext": ext,
                    "size": stat.st_size,
                    "lineCount": content.count("\n") + 1 if content else 0,
                    "content": content,
                })
        return files

    def refresh(self) -> Dict[str, Any]:
        """Performs full AST inspection across all packages and projects."""
        package_dirs = [
            d for d in PACKAGES_ROOT.iterdir()
            if d.is_dir()
            and not d.name.startswith(".")
            and d.name != "Web"
            and ((d / "package.json").exists() or (d / "pyproject.toml").exists())
        ]

        packages_data: List[Dict[str, Any]] = []

        for pdir in sorted(package_dirs, key=lambda p: p.name):
            pkg_id = pdir.name
            npm_manifest, py_manifest = read_package_manifests(pdir)

            py_project = py_manifest.get("project", {})
            python_name = py_project.get("name")
            python_version = py_project.get("version")
            python_desc = py_project.get("description", "")
            python_deps = py_project.get("dependencies", [])

            py_module = next(
                (sub.name for sub in pdir.iterdir() if sub.is_dir() and (sub.name == "external" or sub.name.startswith("workspace_"))),
                None
            )

            readme_text = (pdir / "README.md").read_text(encoding="utf-8") if (pdir / "README.md").exists() else ""
            files = self._scan_files(pdir)

            # Symbols
            symbols: List[Dict[str, Any]] = []
            for f in files:
                file_path = pdir / f["path"]
                if f["ext"] == ".py" and f["content"]:
                    symbols.extend(parse_python_symbols(file_path, f["path"]))
                elif f["ext"] in (".ts", ".tsx") and f["content"]:
                    symbols.extend(parse_typescript_symbols(f["content"], f["path"]))

            # Python & TypeScript public export names
            py_exports = extract_python_exports(pdir, py_module)
            ts_exports = extract_typescript_exports(pdir)

            # CLI tools
            cli_tools: List[Dict[str, Any]] = []
            bin_dir = pdir / "bin" if (pdir / "bin").is_dir() else (pdir / "external")
            if bin_dir.exists() and bin_dir.is_dir():
                glob_pat = "run_*.py" if bin_dir.name == "external" else "*.py"
                for bf in sorted(bin_dir.glob(glob_pat)):
                    cli_info = inspect_cli_tool(bf, f"{pkg_id}/{bin_dir.name}/{bf.name}")
                    if cli_info:
                        cli_tools.append(cli_info)

            config_presets = inspect_config_presets(pdir) if pkg_id == "config" else None

            ecosystems = []
            if (pdir / "package.json").exists():
                ecosystems.append("npm")
            if (pdir / "pyproject.toml").exists():
                ecosystems.append("python")

            exports_map = npm_manifest.get("exports", {})
            exports_keys = list(exports_map.keys()) if isinstance(exports_map, dict) else ["."]

            packages_data.append({
                "id": pkg_id,
                "name": npm_manifest.get("name", pkg_id),
                "displayName": npm_manifest.get("displayName") or npm_manifest.get("name") or pkg_id,
                "version": npm_manifest.get("version") or python_version or "1.0.0",
                "description": npm_manifest.get("description") or python_desc or "",
                "license": npm_manifest.get("license", "MIT"),
                "ecosystems": ecosystems,
                "hasNpmManifest": (pdir / "package.json").exists(),
                "hasPythonManifest": (pdir / "pyproject.toml").exists(),
                "pythonName": python_name,
                "pythonModule": py_module,
                "pythonVersion": python_version,
                "pythonDependencies": python_deps,
                "scripts": npm_manifest.get("scripts", {}),
                "dependencies": npm_manifest.get("dependencies", {}),
                "devDependencies": npm_manifest.get("devDependencies", {}),
                "peerDependencies": npm_manifest.get("peerDependencies", {}),
                "exports": exports_keys,
                "pythonExports": py_exports,
                "typeScriptExports": ts_exports,
                "exportsMap": exports_map,
                "readmeBlocks": parse_markdown_to_blocks(readme_text),
                "files": files,
                "symbols": symbols,
                "cliTools": cli_tools,
                "configPresets": config_presets,
                "stats": {
                    "fileCount": len(files),
                    "linesOfCode": sum(f["lineCount"] for f in files),
                    "sizeBytes": sum(f["size"] for f in files),
                    "symbolsCount": len(symbols),
                },
            })

        # Consumer projects
        projects_raw: Dict[str, Any] = {}
        if PROJECTS_SOURCE_FILE.exists():
            try:
                projects_raw = json.loads(PROJECTS_SOURCE_FILE.read_text(encoding="utf-8"))
            except Exception:
                pass

        projects_list = [
            inspect_consumer_project(pid, spec, PROJECTS_ROOT)
            for pid, spec in projects_raw.items()
        ]

        # Root package.json workspaces and scripts
        root_pkg_path = WORKSPACE_ROOT / "package.json"
        root_workspaces = []
        root_scripts = {}
        if root_pkg_path.exists():
            try:
                root_pkg = json.loads(root_pkg_path.read_text(encoding="utf-8"))
                root_workspaces = root_pkg.get("workspaces", [])
                root_scripts = root_pkg.get("scripts", {})
            except Exception:
                pass

        guide_doc = PACKAGES_DESIGN_GUIDE.read_text(encoding="utf-8") if PACKAGES_DESIGN_GUIDE.exists() else ""
        port_doc = PROJECTS_PORT_GUIDE.read_text(encoding="utf-8") if PROJECTS_PORT_GUIDE.exists() else ""
        tech_doc = TECH_STACK_GUIDE.read_text(encoding="utf-8") if TECH_STACK_GUIDE.exists() else ""
        rules_doc = PROJECTS_RULES_GUIDE.read_text(encoding="utf-8") if PROJECTS_RULES_GUIDE.exists() else ""
        cheat_doc = COMPLIANCE_CHEATSHEET_GUIDE.read_text(encoding="utf-8") if COMPLIANCE_CHEATSHEET_GUIDE.exists() else ""

        stats = compute_workspace_telemetry(packages_data, projects_list)

        self._cache = {
            "meta": {
                "generator": "workspace-fastapi-service",
                "version": "2.0.0",
                "scannedAt": datetime.now(timezone.utc).isoformat(),
            },
            "packages": packages_data,
            "projects": projects_list,
            "rootWorkspaces": root_workspaces,
            "rootScripts": root_scripts,
            "guideBlocks": parse_markdown_to_blocks(guide_doc),
            "portGuideBlocks": parse_markdown_to_blocks(port_doc),
            "techStackBlocks": parse_markdown_to_blocks(tech_doc),
            "projectRulesBlocks": parse_markdown_to_blocks(rules_doc),
            "cheatsheetBlocks": parse_markdown_to_blocks(cheat_doc),
            "stats": stats,
        }
        self._last_scan = datetime.now(timezone.utc)

        # Persist extracted workspace data
        try:
            out_dir = SERVER_DIR / "exporters" / "data"
            out_dir.mkdir(parents=True, exist_ok=True)
            (out_dir / "workspace.json").write_text(json.dumps(self._cache, indent=2), encoding="utf-8")
        except Exception:
            pass

        return self._cache

    def get_data(self) -> Dict[str, Any]:
        """Gets current workspace data (performs initial scan if needed)."""
        if self._cache is None:
            return self.refresh()
        return self._cache

    def get_projects_live(self) -> List[Dict[str, Any]]:
        """Returns projects with real-time port activity status."""
        data = self.get_data()
        projects = []
        for p in data.get("projects", []):
            fe_port = p.get("frontendPort") or p.get("frontend_port")
            be_port = p.get("backendPort") or p.get("backend_port")
            fe_live = is_port_active(fe_port)
            be_live = is_port_active(be_port)
            projects.append({
                **p,
                "frontendPort": fe_port,
                "backendPort": be_port,
                "frontendActive": fe_live,
                "backendActive": be_live,
                "frontend": {
                    "port": fe_port,
                    "isLive": fe_live,
                    "url": f"http://localhost:{fe_port}" if fe_port else None,
                },
                "backend": {
                    "port": be_port,
                    "isLive": be_live,
                    "url": f"http://localhost:{be_port}" if be_port else None,
                },
            })
        return projects
