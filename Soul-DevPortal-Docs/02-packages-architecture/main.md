# Shared Packages Architecture — Master Technical Blueprint & Guide

> **Scope**: Monorepo Shared Libraries (`@workspace/*`) & Cross-Runtime Polyglot Tooling  
> **Applies to**: `@workspace/config`, `@workspace/logger`, `@workspace/runner`, and all future shared packages  
> **Status**: `AUTHORITATIVE ARCHITECTURE BLUEPRINT`

---

## Architecture Topology Overview

The Soul Monorepo centralizes all reusable functionality into `Soul-DevPortal-Packages/`. These packages are consumed polyglot across both TypeScript (via NPM workspaces) and Python (via pip editable packages):

```mermaid
graph TD
    subgraph Root["Soul Monorepo Root"]
        Packages["Soul-DevPortal-Packages/"]
        Projects["Soul-DevPortal-Projects/ (9 Micro-Apps)"]
        DevPortal["DevPortal Hub (:5181 / :8008)"]
    end

    subgraph CorePackages["Shared Core Packages"]
        Config["@workspace/config<br/>• Central Ports Matrix<br/>• Tailwind v4 Presets<br/>• TSConfig Bases"]
        Logger["@workspace/logger<br/>• 5-Column ANSI Output<br/>• PII & Secret Masking<br/>• Client Console Bridge<br/>• Vite HMR Banner"]
        Runner["@workspace/runner<br/>• Dual-Stack Supervisor<br/>• Windows Job Objects<br/>• Active Socket Prober<br/>• Interactive Hotkeys"]
    end

    Packages --> Config & Logger & Runner
    Config & Logger & Runner --> Projects
    Config & Logger & Runner --> DevPortal
```

---

## 1. Deep Dive: The Three Core Workspace Packages

### 1.1 `@workspace/config` (Centralized Configuration & Presets)

#### Core Purpose
`@workspace/config` serves as the authoritative single source of truth for:
- Workspace port allocations and network topology.
- Standardized TypeScript compiler configurations (`tsconfig.json`).
- Tailwind CSS v4 design tokens and color scales.
- Code style rules (`prettier`, `eslint`, `pyproject.toml`).

#### Module Architecture & Exports
```text
Soul-DevPortal-Packages/config/
├── package.json                   # NPM manifest with subpath exports
├── pyproject.toml                 # PEP 621 Python manifest
├── setup.py                       # Legacy setuptools build compatibility
├── README.md                      # Package documentation
├── index.js                       # JavaScript/TypeScript design tokens & Tailwind preset
├── internal/                      # Tier 1: Core engines (ports, tokens, env)
│   ├── ports_integrity.py        # Port matrix verification and JSON sync
│   └── token_definitions.ts       # Shared theme variables
├── external/                      # Tier 2: Public facade, run_ports.py & presets/
│   ├── run_ports.py               # Active TCP port conflict auditor CLI
│   └── presets/                   # Presets for tsconfig, tailwind, prettier, eslint
│       ├── tsconfig/react.json    # React 19 + Vite tsconfig preset
│       ├── tsconfig/node.json     # Node.js backend tsconfig preset
│       └── tailwind/preset.js     # Shared design system theme preset
└── tests/                         # Tier 3: Verification suite
    ├── test_ports_integrity.py    # Automated port matrix test
    ├── test_internal.py           # Unit tests for internal logic
    └── test_external.py           # Unit tests for public CLI runners
```

#### Consumption Patterns

**A. TypeScript Configuration (`client/tsconfig.json`)**:
```json
{
  "extends": "@workspace/config/tsconfig/react.json",
  "include": ["src"]
}
```

**B. Tailwind CSS v4 Integration (`client/src/index.css`)**:
```css
@import "tailwindcss";

@theme {
  --color-brand-primary: #3b82f6;
  --color-surface-obsidian: #09090c;
  --font-mono: 'JetBrains Mono', monospace;
}
```

**C. Port Conflict Scanner CLI**:
```bash
# Scan all monorepo ports for collisions or zombie processes
python Soul-DevPortal-Packages/config/external/run_ports.py

# Automatically terminate rogue processes holding workspace ports
python Soul-DevPortal-Packages/config/external/run_ports.py --kill-conflicts
```

---

### 1.2 `@workspace/logger` (5-Column Telemetry & PII Masking)

#### Core Purpose
`@workspace/logger` provides enterprise-grade structured observability across all client and server runtimes:
- Deterministic 5-column ANSI terminal logging.
- Automatic regular-expression masking of secrets, tokens, and passwords.
- Browser console logging bridge with colored tags and expandable JSON payloads.
- Vite plugin for injecting development server startup banners and HMR telemetry.
- FastAPI / Starlette request logging middleware with execution latency measurement.

#### Module Architecture & Exports
```text
Soul-DevPortal-Packages/logger/
├── package.json
├── pyproject.toml
├── setup.py
├── README.md
├── tsconfig.json
├── client/                        # TypeScript browser logger & Vite HMR bridge
│   ├── index.ts                   # Public browser consoleLogger export
│   ├── vite-plugin.ts             # Workspace dev server banner Vite plugin
│   └── types.ts                   # LogLevel and LoggerOptions interfaces
├── internal/                      # Tier 1: Core ANSI formatters, sanitizer, box renderer
│   ├── sanitizer.py               # Automated PII & secret regex masking engine
│   ├── formatter.py               # 5-column ANSI layout generator
│   └── box_renderer.py            # Unicode CLI banner frame renderer
├── external/                      # Tier 2: Public server_logger, middleware, banners
│   ├── __init__.py                # Root facade exporting get_logger, server_logger
│   ├── middleware.py              # FastAPI / Starlette logging middleware
│   └── server_logger.py           # Universal server-side logging class
└── tests/                         # Tier 3: Unit tests
    ├── test_internal.py           # Tests sanitizer and formatters
    └── test_external.py           # Tests middleware and facade re-exports
```

#### Consumption Patterns

**A. Browser & React Applications (`client/src/App.tsx`)**:
```typescript
import { consoleLogger } from '@workspace/logger';

// Colored structured logging in browser console
consoleLogger.info('AUTH', 'User session established', { userId: 'usr_9281' });
consoleLogger.action('CART', 'Item added to checkout', { itemsCount: 3 });
consoleLogger.error('API', 'Payment gateway timeout', new Error('Gateway Timeout 504'));
```

**B. Vite HMR Dev Server Banner (`client/vite.config.ts`)**:
```typescript
import { defineConfig } from 'vite';
import { workspaceLoggerPlugin } from '@workspace/logger/vite-plugin';

export default defineConfig({
  plugins: [
    workspaceLoggerPlugin({
      serviceName: 'APEXMIND STUDIO AI',
      version: '1.0.0',
      port: 5173,
    }),
  ],
});
```

**C. Python FastAPI Backend (`server/main.py`)**:
```python
from fastapi import FastAPI
from logger.external import get_logger
from logger.external.middleware import init_app_logger

app = FastAPI(title="ApexMind Studio AI")
init_app_logger(app, title="APEXMIND STUDIO", port=8000)

logger = get_logger("API")

@app.get("/api/v1/sessions")
async def get_sessions():
    logger.info("Retrieved active user sessions", extra={"count": 14})
    return {"sessions": []}
```

---

### 1.3 `@workspace/runner` (Process Supervision & Healthcheck Probing)

#### Core Purpose
`@workspace/runner` provides atomic process management, port conflict resolution, and active readiness verification across all 9 micro-applications:
- **Kernel-Level Sandboxing**: Windows Job Objects (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE`) and POSIX process groups (`os.setsid`) to guarantee 100% atomic child process cleanup on exit.
- **Sub-Second Active Socket Probing**: Non-blocking TCP socket connect before reporting service status.
- **Interactive Terminal Hotkeys**:
  - `[r]`: Restart backend server.
  - `[f]`: Restart frontend client.
  - `[p]`: Display live process CPU & memory telemetry.
  - `[c]`: Clear terminal console.
  - `[q]`: Cleanly exit all child processes and release ports.

#### Module Architecture & Exports
```text
Soul-DevPortal-Packages/runner/
├── package.json
├── pyproject.toml
├── setup.py
├── README.md
├── internal/                      # Tier 1: Supervisor, controller, sandboxing, ports
│   ├── supervisor.py              # Master multi-process coordinator
│   ├── job_objects.py             # Windows Job Object kernel sandboxing
│   ├── socket_prober.py           # Non-blocking TCP readiness prober
│   └── hotkeys.py                 # Interactive terminal hotkey listener
├── external/                      # Tier 2: Public CLI runners
│   ├── run_dev.py                 # Fullstack dev runner with port-kill
│   ├── run_client.py              # Standalone frontend client launcher
│   ├── run_server.py              # Standalone backend server launcher
│   └── run_ports.py               # Port scanner CLI
└── tests/                         # Tier 3: Unit tests
    ├── test_registry.py           # Projects registry validator
    └── test_supervisor.py         # Supervisor lifecycle tests
```

#### Consumption Patterns

**A. Fullstack Development with Automatic Port Cleanup**:
```bash
# Launch both client and server concurrently with automatic port conflict resolution
python Soul-DevPortal-Packages/runner/external/run_dev.py --project apexmind-ai --kill-port --open

# Or via monorepo npm scripts:
npm run dev:apexmind
```

**B. Launching All 9 Applications Concurrently**:
```bash
# Boots the full monorepo stack with managed supervisor
npx @workspace/runner all
```

---

## 2. Standardized Packages Layout & Directory Architecture

Every shared library in `Soul-DevPortal-Packages/` strictly implements the 3-Tier standard:

```text
Soul-DevPortal-Packages/<package-name>/
├── package.json                   # NPM manifest with subpath exports
├── pyproject.toml                 # Modern PEP 517/621 build specification
├── setup.py                       # Legacy setuptools build compatibility
├── README.md                      # Architectural overview & usage guide
├── internal/                      # Tier 1: Private Engine (Consumers must NOT import)
│   ├── __init__.py                # Package initialization
│   ├── core.py                    # Core algorithms and business logic (snake_case)
│   └── formatters.py              # Data formatting helpers
├── external/                      # Tier 2: Public External Facade
│   ├── __init__.py                # Explicit __all__ facade exports
│   └── cli.py                     # Executable command-line runner
└── tests/                         # Tier 3: Isolated Verification Suite
    ├── test_internal.py           # Unit tests targeting internal core
    └── test_external.py           # Integration tests targeting public facade
```

---

## 3. Step-by-Step Package Authoring Playbook

Follow this 6-step runbook when creating a new shared library in `Soul-DevPortal-Packages/`:

### Step 1: Package Naming Conventions
* **NPM / TypeScript Scope**: `@workspace/<name>` (lowercase kebab-case).
* **Python / PyPI Scope**: `workspace-<name>` (module name: `workspace_<name>`).

### Step 2: Scaffold 3-Tier Directories
```bash
mkdir -p Soul-DevPortal-Packages/<name>/internal
mkdir -p Soul-DevPortal-Packages/<name>/external
mkdir -p Soul-DevPortal-Packages/<name>/tests
touch Soul-DevPortal-Packages/<name>/internal/__init__.py
touch Soul-DevPortal-Packages/<name>/external/__init__.py
```

### Step 3: Implement Private Core (`internal/`)
```python
# Soul-DevPortal-Packages/<name>/internal/engine.py
def calculate_metric(data: list[float]) -> float:
    if not data:
        return 0.0
    return sum(data) / len(data)
```

### Step 4: Expose Public Facade (`external/__init__.py`)
```python
# Soul-DevPortal-Packages/<name>/external/__init__.py
from internal.engine import calculate_metric

__all__ = ["calculate_metric"]
```

### Step 5: Author Synchronized Manifests

**A. `package.json`**:
```json
{
  "name": "@workspace/<name>",
  "version": "1.0.0",
  "private": true,
  "type": "module",
  "exports": {
    ".": "./index.js"
  }
}
```

**B. `pyproject.toml`**:
```toml
[build-system]
requires = ["setuptools>=61.0"]
build-backend = "setuptools.build_meta"

[project]
name = "workspace-<name>"
version = "1.0.0"
description = "Shared package in Soul monorepo"
authors = [{ name = "Soul Team" }]

[tool.setuptools.packages.find]
where = ["."]
include = ["internal*", "external*"]
```

**C. `setup.py`**:
```python
from setuptools import setup, find_packages
setup(name="workspace-<name>", version="1.0.0", packages=find_packages())
```

### Step 6: Verify Isolated Test Suite
```bash
python Soul-DevPortal-Packages/<name>/tests/test_internal.py
python Soul-DevPortal-Packages/<name>/tests/test_external.py
```

### Step 7: Add Live Runtime Preview (`Package Preview` Tab)
Register a live preview section for the new package folder in `src/features/packages/detail/PackagePreviousTab.tsx` so developers can inspect how the package renders and behaves in real workspace projects directly inside the **Package Preview** tab of `PackageDetailView`.

---

## 4. DevPortal Package Inspector Tabs

Every package in `Soul-DevPortal-Packages/` is rendered in `PackageDetailView` with 5 canonical tabs:

| Tab | Component | Purpose |
| :--- | :--- | :--- |
| **Documentation** | `PackageDocsTab.tsx` | Parsed `README.md` guides and architecture notes |
| **API & Exports** | `PackageApiTab.tsx` | TypeScript & Python exported symbols and signatures |
| **Code Generator** | `PackagePlaygroundTab.tsx` | Copy-ready import snippets and usage boilerplate |
| **Manifest & Metadata** | `PackageManifestTab.tsx` | `package.json`, `pyproject.toml`, scripts, and dependencies |
| **Package Preview (`LIVE`)** | `PackagePreviousTab.tsx` | Live interactive runtime preview showing how the package looks in actual projects |

---

## 5. Automated Verification Suite & Manifest Parity

To ensure zero drift across all shared packages, execute the complete verification suite:

```powershell
python Soul-DevPortal-Packages/config/tests/test_ports_integrity.py; `
python Soul-DevPortal-Packages/config/tests/test_internal.py; `
python Soul-DevPortal-Packages/config/tests/test_external.py; `
python Soul-DevPortal-Packages/runner/tests/test_registry.py; `
python Soul-DevPortal-Packages/runner/tests/test_supervisor.py; `
python Soul-DevPortal-Packages/logger/tests/test_internal.py; `
python Soul-DevPortal-Packages/logger/tests/test_external.py; `
npx tsc --noEmit -p Soul-DevPortal-Packages/logger/tsconfig.json; `
python scripts/test_all_packages.py
```

---

## 6. Complete 75-Package Studio & AI Ecosystem Map

In addition to the three workspace infrastructure packages (`config`, `logger`, `runner`), `Soul-DevPortal-Packages/` provides **75 modular studio & AI packages** tailored strictly to **React 19 + Vite 8 + Tailwind 4** (Frontend) and **FastAPI + Uvicorn + SQLite WAL** (Backend):

### Layer 0 & Layer 1 — Core Foundation & AI Orchestration (4 Packages)

| Folder | NPM Scope | Frontend (React 19 + Vite 8) | Backend (FastAPI + SQLite WAL) | Purpose |
| :--- | :--- | :--- | :--- | :--- |
| `core/` | `@workspace/core` | `react` (19), `vite` (8), `tailwindcss` (4), `@tanstack/react-query`, `zustand`, `react-router`, `lucide-react`, `openapi-fetch` | `fastapi[standard]`, `uvicorn[standard]`, `sqlalchemy[asyncio]`, `aiosqlite` (WAL), `alembic`, `pydantic-settings`, `httpx`, `ffmpeg` | Base app shell, SQLite WAL engine, Vite 8 FFmpeg/WASM preset |
| `ai-agents/` | `@workspace/ai-agents` | `@ai-sdk/react`, `EventSource` (SSE) | `pydantic-ai`, `google-genai`, `openai`, `anthropic` | Scriptwriting, shot lists, prompt enhancement, structured JSON |
| `ai-router/` | `@workspace/ai-router` | `@tanstack/react-query` | `litellm`, `fal-client`, `replicate` | Unified routing between Cloud APIs & local GPUs |
| `ai-local/` | `@workspace/ai-local` | `@huggingface/transformers` (WebGPU/WASM) | `diffusers`, `transformers`, `torch`, `onnxruntime-gpu` | Local GPU & browser WebGPU inference for open-weight models |

### Layer 2 — 13 Studio Domains (71 Category Packages)

- **1. Video & Film (9)**: `movie-maker`, `video-editor`, `motion-2d`, `vfx-engine`, `color-luts`, `subtitles` (`faster-whisper`, `whisperx`, `Qwen3-ASR`, `NVIDIA Nemotron 3.5 ASR`), `screen-recorder`, `gif-clipper`, `video-transcoder`.
- **2. Image & Design (6)**: `image-maker` (`FLUX.1`, `SDXL`, `comfyui`), `image-editor` (`pyvips`, `wand`), `vector-draw`, `bg-remover` (`rembg`, `bria-rmbg`, `iopaint`, `segment-anything`), `image-upscaler` (`realesrgan`, `spandrel`, `codeformer`), `whiteboard` (`tldraw`, `excalidraw`, `@xyflow/react`).
- **3. Audio & Music (6)**: `audio-maker` (`Kokoro 82M`, `Fish Audio Drama 3`, `Breeze TTS 2`, `chatterbox-tts`, `ACE-Step 1.5`, `Meta MusicGen Large`, `audiocraft`), `audio-editor` (`wavesurfer.js`, `pedalboard`), `audio-cleanup` (`deepfilternet`, RNNoise WASM), `stem-splitter` (`demucs`, `audio-separator`), `podcast-studio` (`pyloudnorm`, `ffmpeg`), `audio-analyzer` (`meyda`, `librosa`, `essentia`).
- **4. 3D & Spatial (3)**: `scene-3d` (`three`, `@react-three/fiber`, `bpy`, `trimesh`, `cadquery`), `render-3d` (`theatre.js`, `bpy` Cycles/EEVEE, `pyrender`), `viewer-3d` (`@google/model-viewer`, `pyassimp`, `pygltflib`).
- **5. Publishing, Live & Management (4)**: `pdf-decks` (`@react-pdf/renderer`, `weasyprint`, `python-pptx`, `pymupdf`), `live-stream` (`@livekit/components-react`, `hls.js`, `aiortc`), `dam-search` (`@tanstack/react-virtual`, `sqlite-vec`, `open-clip-torch`, `sentence-transformers`), `media-info` (`mediainfo.js`, `exifr`, `ffprobe`).
- **6. Generative AI & Avatars (7)**: `ai-video` (Local: `LTX-2.5`, `Wan 2.2`, `HunyuanVideo 1.5`, `CogVideoX-1.5`; Cloud: `Veo 3.1`, `Seedance 2.5`, `Wan 3.0`, `Kling 4.0`, `Runway Gen-4.5`), `ai-avatars` (`MuseTalk`, `LatentSync`, `SadTalker`, `Wav2Lip`, `HeyGen API`, `Synthesia`), `ai-dubbing`, `text-video-edit` (`@tiptap/react` + `whisperx`), `ai-inpaint` (`sam2`, `propainter`, `Kling 4.0`, `MiniMax H3`), `ai-rigging` (`@pixiv/three-vrm`, `unirig`, `mediapipe`, `bpy`), `ai-3d` (`triposr`, `hunyuan3d`, `trellis`, `meshy`).
- **7. Brand, Marketing & E-Commerce (6)**: `brand-kits` (Tailwind 4 `@theme` + `fonttools`), `batch-render` (`remotion`, `huey`), `mockups-tryon` (`Decal`, `IDM-VTON`), `auto-reframe` (`ultralytics` YOLO, `mediapipe`), `watermark-qr` (`qrcode.react`, `segno`), `stock-media` (`httpx` + SQLite cache).
- **8. Spatial, Interactive & Data Media (5)**: `splats-3d` (`<Splat/>`, `nerfstudio`, `gsplat`, `pycolmap`), `spatial-xr` (`@react-three/xr`, `usd-core`), `branch-video`, `data-charts` (`d3`, `recharts`, `manim`, `plotly`), `code-video` (`shiki-magic-move`, `manim`, `playwright`).
- **9. Studio Workflow, Collaboration & Delivery (8)**: `scriptwriter`, `frame-review` (WebSocket + `frame_comments`), `version-history` (`zundo`, `immer`, `jsonpatch`), `node-pipelines` (`@xyflow/react`, `networkx`), `media-proxy` (`idb-keyval`, `hls.js`, `ffmpeg`), `render-queue` (`huey` `SqliteHuey` / `tinyjobs`), `c2pa-sign` (`@contentauth/c2pa-web`, `c2pa-python`), `social-publish` (`apscheduler`).
- **10. Design Systems, UI Prototyping & Web Export (5)**: `ui-tokens`, `ui-prototype`, `ui-studio`, `ui-export`, `a11y-audit`.
- **11. Game Dev, Physics & Procedural Worlds (4)**: `game-2d`, `physics-3d`, `shader-graph`, `npc-ai`.
- **12. Security, Auth, Billing & Usage Metering (4)**: `auth-rbac`, `ai-credits`, `media-drm`, `audit-logs`.
- **13. Testing, Telemetry, Eval & Benchmarking (4)**: `ai-evals`, `media-qc`, `dataset-studio`, `telemetry`.

### Critical Stack Configuration Notes
1. **Vite 8 + FFmpeg.wasm**: `vite.config.js` excludes `@ffmpeg/ffmpeg` and `@ffmpeg/util` from `optimizeDeps` and supports `Cross-Origin-Opener-Policy: same-origin` + `Cross-Origin-Embedder-Policy: require-corp` when `VITE_ENABLE_SHARED_ARRAY_BUFFER=true`.
2. **SQLite WAL + Background Jobs**: Use `huey` (`SqliteHuey`) or `tinyjobs` for render queues, batch jobs, and scheduled social posts directly on SQLite WAL without Redis or RabbitMQ.
```
