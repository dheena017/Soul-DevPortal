"""
Idempotent scaffolder for all 75 Soul Workspace packages in Soul-DevPortal-Packages/.
Follows Soul-DevPortal-Docs/02-packages-architecture/golden-rules.md (2-Tier + Tier 3 tests + Triple-Manifest Parity).
"""

from __future__ import annotations

import argparse
import json
from dataclasses import dataclass, field
from pathlib import Path
from typing import List, Optional

ROOT = Path(__file__).resolve().parent.parent
PACKAGES_ROOT = ROOT / "Soul-DevPortal-Packages"


@dataclass(frozen=True)
class PackageSpec:
    name: str
    domain: str
    layer: str
    title: str
    description: str
    frontend: List[str] = field(default_factory=list)
    backend_core: List[str] = field(default_factory=list)
    backend_engine: List[str] = field(default_factory=list)
    local_models: List[str] = field(default_factory=list)
    cloud_apis: List[str] = field(default_factory=list)
    uses_core: List[str] = field(default_factory=lambda: ["core"])
    needs_coop_coep: bool = False


PACKAGE_CATALOG: List[PackageSpec] = [
    # ── Layer 0 & Layer 1: Core Foundation & AI Orchestration (4) ─────────────
    PackageSpec(
        name="core",
        domain="0. Core Foundation",
        layer="Layer 0",
        title="Shared Core Foundation",
        description="React 19, Vite 8, Tailwind 4, TanStack Query, Zustand, FastAPI, Uvicorn & SQLite WAL foundation.",
        frontend=["react", "vite", "tailwindcss", "@tailwindcss/vite", "@tanstack/react-query", "zustand", "react-router", "lucide-react", "openapi-fetch"],
        backend_core=["fastapi[standard]", "uvicorn[standard]", "sqlalchemy[asyncio]", "aiosqlite", "alembic", "pydantic-settings", "httpx"],
        backend_engine=["huey"],
        uses_core=[],
        needs_coop_coep=True,
    ),
    PackageSpec(
        name="ai-agents",
        domain="0. Core AI Orchestration",
        layer="Layer 1",
        title="LLM & AI Agents",
        description="Structured LLM agents, SSE streaming, scriptwriting, shot lists, and prompt enhancement.",
        frontend=["@ai-sdk/react"],
        backend_core=["fastapi", "pydantic", "httpx"],
        backend_engine=["pydantic-ai", "google-genai", "openai", "anthropic"],
        cloud_apis=["OpenAI", "Anthropic", "Google Gemini"],
        uses_core=["core"],
    ),
    PackageSpec(
        name="ai-router",
        domain="0. Core AI Orchestration",
        layer="Layer 1",
        title="Multi-Model AI Router",
        description="Unified FastAPI router dispatching between Cloud APIs and local GPU inference.",
        frontend=["@tanstack/react-query"],
        backend_core=["fastapi", "pydantic", "httpx"],
        backend_engine=["litellm", "fal-client", "replicate"],
        cloud_apis=["LiteLLM", "fal.ai", "Replicate"],
        uses_core=["core"],
    ),
    PackageSpec(
        name="ai-local",
        domain="0. Core AI Orchestration",
        layer="Layer 1",
        title="Local AI Inference",
        description="Open-weight model runner for local CUDA/ONNX GPUs and browser WebGPU/WASM.",
        frontend=["@huggingface/transformers"],
        backend_core=["fastapi", "pydantic"],
        backend_engine=["diffusers", "transformers", "torch", "onnxruntime-gpu"],
        local_models=["WebGPU/WASM", "PyTorch", "ONNX Runtime GPU"],
        uses_core=["core"],
    ),

    # ── Domain 1: Video & Film (9) ───────────────────────────────────────────
    PackageSpec("movie-maker", "1. Video & Film", "Layer 2", "Movie Creating", "Programmatic movie & scene composition.", ["remotion", "@remotion/player"], ["fastapi", "pydantic"], ["movis", "moviepy", "manim"]),
    PackageSpec("video-editor", "1. Video & Film", "Layer 2", "Video Editing", "Timeline video editing with FFmpeg WASM & PyAV.", ["@ffmpeg/ffmpeg", "@ffmpeg/util", "@xzdarcy/react-timeline-editor"], ["fastapi", "pydantic"], ["av"], needs_coop_coep=True),
    PackageSpec("motion-2d", "1. Video & Film", "Layer 2", "2D Motion Graphics", "2D motion graphics, Lottie, Rive, and UI animation.", ["motion", "gsap", "lottie-react", "@rive-app/react-canvas"], ["fastapi", "pydantic"], ["rlottie-python", "cairosvg", "movis"]),
    PackageSpec("vfx-engine", "1. Video & Film", "Layer 2", "VFX & Compositing", "WebGL compositing, chromakey, and MediaPipe tracking.", ["pixi.js", "@pixi/react"], ["fastapi", "pydantic"], ["opencv-python-headless", "mediapipe"]),
    PackageSpec("color-luts", "1. Video & Film", "Layer 2", "Color Grading & LUTs", "Three.js LUT shader passes, 3D LUTs, and tone mapping.", ["three"], ["fastapi", "pydantic"], ["colour-science", "pillow-lut"]),
    PackageSpec("subtitles", "1. Video & Film", "Layer 2", "Subtitles & Transcription", "Word-level ASR, VTT/SRT captions, and transcription.", ["@remotion/captions"], ["fastapi", "pydantic"], ["faster-whisper", "whisperx", "pysubs2"], ["faster-whisper", "whisperx", "Qwen3-ASR", "NVIDIA Nemotron 3.5 ASR"], ["ai-router"], ["core", "ai-local"]),
    PackageSpec("screen-recorder", "1. Video & Film", "Layer 2", "Screen & Webcam Recording", "Browser MediaRecorder capture and WebM-to-MP4 remuxing.", ["react-media-recorder"], ["fastapi", "pydantic"], []),
    PackageSpec("gif-clipper", "1. Video & Film", "Layer 2", "GIF & Short-Form Clipping", "Palette-optimized GIF, sticker, and short clip exporter.", ["@ffmpeg/ffmpeg", "gif.js"], ["fastapi", "pydantic"], ["imageio", "pillow"], needs_coop_coep=True),
    PackageSpec("video-transcoder", "1. Video & Film", "Layer 2", "Video Transcoding & Compression", "Hardware-accelerated NVENC/VAAPI/VideoToolbox & HLS transcoding.", ["@ffmpeg/ffmpeg"], ["fastapi", "pydantic"], ["python-ffmpeg-video-streaming"], needs_coop_coep=True),

    # ── Domain 2: Image & Design (6) ─────────────────────────────────────────
    PackageSpec("image-maker", "2. Image & Design", "Layer 2", "Image Creating", "Canvas/SVG composition and local FLUX.1/SDXL/ComfyUI generation.", ["konva", "react-konva", "fabric", "satori", "html-to-image"], ["fastapi", "pydantic"], ["pillow", "pycairo", "diffusers", "torch"], ["FLUX.1", "SDXL", "ComfyUI Headless"], ["ai-router"], ["core", "ai-local"]),
    PackageSpec("image-editor", "2. Image & Design", "Layer 2", "Image Editing", "Crop, filters, and high-speed pyvips/OpenCV image transforms.", ["react-easy-crop", "filerobot-image-editor"], ["fastapi", "pydantic"], ["pyvips", "wand", "scikit-image", "opencv-python-headless"]),
    PackageSpec("vector-draw", "2. Image & Design", "Layer 2", "Vector Graphics & Illustration", "Interactive vector paths, SVG generation, and raster-to-SVG tracing.", ["paper", "fabric", "svg.js"], ["fastapi", "pydantic"], ["pycairo", "cairosvg", "svgwrite", "vtracer"]),
    PackageSpec("bg-remover", "2. Image & Design", "Layer 2", "Background Removal & Inpainting", "WASM/local background removal and mask-based object inpainting.", ["@imgly/background-removal", "react-konva"], ["fastapi", "pydantic"], ["rembg", "iopaint", "segment-anything", "diffusers"], ["rembg", "bria-rmbg", "iopaint", "SAM"], uses_core=["core", "ai-local"]),
    PackageSpec("image-upscaler", "2. Image & Design", "Layer 2", "Image Upscaling & Restoration", "4x super-resolution, face restoration, and denoising.", ["upscaler", "@upscalerjs/default-model"], ["fastapi", "pydantic"], ["realesrgan", "spandrel", "pyvips"], ["Real-ESRGAN", "Spandrel", "CodeFormer"], uses_core=["core", "ai-local"]),
    PackageSpec("whiteboard", "2. Image & Design", "Layer 2", "Whiteboarding & Node Graphs", "Infinite canvas whiteboarding, diagrams, and SQLite JSON graphs.", ["tldraw", "@excalidraw/excalidraw", "@xyflow/react"], ["fastapi", "pydantic", "aiosqlite"], ["mermaid-py", "graphviz"]),

    # ── Domain 3: Audio & Music (6) ──────────────────────────────────────────
    PackageSpec("audio-maker", "3. Audio & Music", "Layer 2", "Audio Creating (TTS & Music)", "Web Audio synthesis, neural TTS voice cloning, and AI music/SFX.", ["tone"], ["fastapi", "pydantic"], ["kokoro", "chatterbox-tts", "edge-tts", "audiocraft"], ["Kokoro 82M", "Fish Audio Drama 3", "Breeze TTS 2", "ACE-Step 1.5", "Meta MusicGen Large"], uses_core=["core", "ai-local"]),
    PackageSpec("audio-editor", "3. Audio & Music", "Layer 2", "Audio Editing", "Waveform editing, Pedalboard DSP effects, and SoundFile I/O.", ["wavesurfer.js", "@wavesurfer/react", "tone"], ["fastapi", "pydantic"], ["pedalboard", "soundfile"]),
    PackageSpec("audio-cleanup", "3. Audio & Music", "Layer 2", "Audio Cleanup & Noise Reduction", "RNNoise WASM suppression and DeepFilterNet vocal cleanup.", ["@sapphi-red/web-noise-suppressor"], ["fastapi", "pydantic"], ["deepfilternet", "noisereduce", "pedalboard"], ["DeepFilterNet"], uses_core=["core", "ai-local"]),
    PackageSpec("stem-splitter", "3. Audio & Music", "Layer 2", "Stem Separation", "Multi-track mute/solo player and Demucs/UVR stem isolation.", ["wavesurfer.js"], ["fastapi", "pydantic"], ["demucs", "audio-separator"], ["Demucs", "UVR / MDX-Net"], uses_core=["core", "ai-local"]),
    PackageSpec("podcast-studio", "3. Audio & Music", "Layer 2", "Podcast & Voice Recording", "Browser voice capture and LUFS loudness mastering.", [], ["fastapi", "pydantic"], ["pyloudnorm", "pedalboard"]),
    PackageSpec("audio-analyzer", "3. Audio & Music", "Layer 2", "Audio Analysis", "Meyda spectral features, Librosa/Essentia/Aubio beat & pitch analysis.", ["wavesurfer.js", "meyda"], ["fastapi", "pydantic"], ["librosa", "essentia", "aubio", "scipy"]),

    # ── Domain 4: 3D & Spatial (3) ───────────────────────────────────────────
    PackageSpec("scene-3d", "4. 3D & Spatial", "Layer 2", "3D Scene Creating & Modeling", "React Three Fiber scenes, Blender Python, Trimesh, and CadQuery.", ["three", "@react-three/fiber", "@react-three/drei"], ["fastapi", "pydantic"], ["bpy", "trimesh", "cadquery"]),
    PackageSpec("render-3d", "4. 3D & Spatial", "Layer 2", "3D Rendering & Animation", "Post-processing, Theatre.js timelines, and headless Cycles/EEVEE.", ["@react-three/fiber", "@react-three/postprocessing", "theatre.js"], ["fastapi", "pydantic"], ["bpy", "pyrender"]),
    PackageSpec("viewer-3d", "4. 3D & Spatial", "Layer 2", "3D Asset Viewing & Conversion", "GLTF/GLB viewer and Trimesh/Assimp/pygltflib mesh conversion.", ["@google/model-viewer", "@react-three/drei"], ["fastapi", "pydantic"], ["trimesh", "pyassimp", "pygltflib"]),

    # ── Domain 5: Publishing, Live & Management (4) ──────────────────────────
    PackageSpec("pdf-decks", "5. Publishing, Live & Management", "Layer 2", "PDF, Storyboards & Pitch Decks", "React-PDF, PDF.js, WeasyPrint, python-pptx, and PyMuPDF.", ["@react-pdf/renderer", "pdfjs-dist"], ["fastapi", "pydantic"], ["weasyprint", "python-pptx", "pymupdf"]),
    PackageSpec("live-stream", "5. Publishing, Live & Management", "Layer 2", "Live Streaming & WebRTC", "LiveKit WebRTC rooms, HLS/DASH playback, and RTMP/HLS push.", ["@livekit/components-react", "hls.js", "dashjs"], ["fastapi", "pydantic"], ["livekit-api", "aiortc"]),
    PackageSpec("dam-search", "5. Publishing, Live & Management", "Layer 2", "DAM & AI Search (RAG)", "Virtual asset grid with sqlite-vec, OpenCLIP, and sentence-transformers.", ["@tanstack/react-table", "@tanstack/react-virtual"], ["fastapi", "pydantic", "aiosqlite"], ["sqlite-vec", "open-clip-torch", "sentence-transformers"], ["OpenCLIP", "SentenceTransformers"], uses_core=["core", "ai-local"]),
    PackageSpec("media-info", "5. Publishing, Live & Management", "Layer 2", "Media Metadata & Inspection", "MediaInfo.js, EXIF, FFprobe, and pymediainfo inspection.", ["mediainfo.js", "exifr"], ["fastapi", "pydantic"], ["pymediainfo", "pillow", "exifread"]),

    # ── Domain 6: Generative AI & Avatars (7) ────────────────────────────────
    PackageSpec("ai-video", "6. Generative AI & Avatars", "Layer 2", "Text & Image-to-Video", "Local (LTX-2.5, Wan 2.2, HunyuanVideo, CogVideoX) & Cloud (Veo 3.1, Seedance, Kling, Runway).", ["@tanstack/react-query"], ["fastapi", "pydantic", "httpx"], ["diffusers", "torch", "google-genai", "fal-client"], ["LTX-2.5", "Wan 2.2", "HunyuanVideo 1.5", "CogVideoX-1.5"], ["Veo 3.1", "Seedance 2.5", "Wan 3.0", "Kling 4.0", "Runway Gen-4.5"], ["core", "ai-router", "ai-local"]),
    PackageSpec("ai-avatars", "6. Generative AI & Avatars", "Layer 2", "AI Avatars & Lip-Sync", "3D/VRM talking avatars with MuseTalk, LatentSync, SadTalker, HeyGen & Synthesia.", ["@pixiv/three-vrm"], ["fastapi", "pydantic", "httpx"], ["torch"], ["MuseTalk", "LatentSync", "SadTalker", "Wav2Lip"], ["HeyGen API", "Synthesia"], ["core", "ai-router", "ai-local"]),
    PackageSpec("ai-dubbing", "6. Generative AI & Avatars", "Layer 2", "AI Dubbing & Voice Translation", "ASR + translation + voice-cloned dubbing track synchronization.", ["wavesurfer.js"], ["fastapi", "pydantic"], ["faster-whisper", "argostranslate", "chatterbox-tts"], ["faster-whisper", "Qwen3-ASR", "Kokoro 82M", "XTTS"], ["ai-router"], ["core", "ai-local"]),
    PackageSpec("text-video-edit", "6. Generative AI & Avatars", "Layer 2", "Text-Based Video Editing", "Word-linked Tiptap transcript editor driving FFmpeg EDL cuts.", ["@tiptap/react"], ["fastapi", "pydantic"], ["whisperx"], ["WhisperX"], uses_core=["core", "ai-local"]),
    PackageSpec("ai-inpaint", "6. Generative AI & Avatars", "Layer 2", "AI Motion Brush & Inpainting", "Konva mask/motion brush with SAM2, ProPainter, Kling 4.0 & MiniMax H3.", ["react-konva"], ["fastapi", "pydantic"], ["sam2", "propainter", "diffusers"], ["SAM 2", "ProPainter"], ["Kling 4.0", "MiniMax H3"], ["core", "ai-router", "ai-local"]),
    PackageSpec("ai-rigging", "6. Generative AI & Avatars", "Layer 2", "Character Creator & Auto-Rigging", "VRM/Rive character rigging with UniRig, MediaPipe & Blender Python.", ["@pixiv/three-vrm", "@rive-app/react-canvas"], ["fastapi", "pydantic"], ["bpy", "mediapipe"], ["UniRig", "MediaPipe"], uses_core=["core", "ai-local"]),
    PackageSpec("ai-3d", "6. Generative AI & Avatars", "Layer 2", "Text & Image-to-3D", "Generate .glb 3D meshes via TripoSR, Hunyuan3D, Trellis & Meshy.", ["@react-three/fiber", "@react-three/drei"], ["fastapi", "pydantic"], ["trimesh", "fal-client"], ["TripoSR", "Hunyuan3D", "Trellis"], ["Meshy", "fal.ai"], ["core", "ai-router", "ai-local"]),

    # ── Domain 7: Brand, Marketing & E-Commerce (6) ──────────────────────────
    PackageSpec("brand-kits", "7. Brand, Marketing & E-Commerce", "Layer 2", "Brand Kits & Governance", "Tailwind 4 @theme variables, Zustand store, fonttools & SQLite brand_kits.", ["zustand"], ["fastapi", "pydantic", "aiosqlite"], ["fonttools"]),
    PackageSpec("batch-render", "7. Brand, Marketing & E-Commerce", "Layer 2", "Template & Batch Rendering", "CSV-driven Remotion batch rendering on Huey SQLite queue.", ["remotion", "@remotion/player", "papaparse"], ["fastapi", "pydantic"], ["pandas", "polars", "huey"]),
    PackageSpec("mockups-tryon", "7. Brand, Marketing & E-Commerce", "Layer 2", "Product Mockups & Virtual Try-On", "R3F Decal mockups, OpenCV homography warp, and IDM-VTON.", ["@react-three/fiber", "react-konva"], ["fastapi", "pydantic"], ["opencv-python-headless", "diffusers"], ["IDM-VTON"], uses_core=["core", "ai-local"]),
    PackageSpec("auto-reframe", "7. Brand, Marketing & E-Commerce", "Layer 2", "Multi-Aspect Auto-Reframe", "Safe-zone overlay with YOLO/MediaPipe subject tracking (16:9 -> 9:16).", ["react-konva"], ["fastapi", "pydantic"], ["ultralytics", "mediapipe"], ["YOLO", "MediaPipe"], uses_core=["core", "ai-local"]),
    PackageSpec("watermark-qr", "7. Brand, Marketing & E-Commerce", "Layer 2", "Watermarking & QR Code Studio", "QR/SVG generation, invisible watermarks, and FFmpeg overlays.", ["qrcode.react", "react-konva"], ["fastapi", "pydantic"], ["segno", "invisible-watermark"]),
    PackageSpec("stock-media", "7. Brand, Marketing & E-Commerce", "Layer 2", "Stock Media & Content Hub", "Infinite-scroll Pexels, Unsplash, Pixabay & Freesound proxy with SQLite cache.", ["@tanstack/react-query"], ["fastapi", "pydantic", "httpx", "aiosqlite"], []),

    # ── Domain 8: Spatial, Interactive & Data Media (5) ──────────────────────
    PackageSpec("splats-3d", "8. Spatial, Interactive & Data Media", "Layer 2", "3D Gaussian Splatting", "Gaussian splat viewer and Nerfstudio/gsplat/PyCOLMAP reconstruction.", ["@react-three/drei", "@mkkellogg/gaussian-splats-3d", "gsplat"], ["fastapi", "pydantic"], ["nerfstudio", "gsplat", "pycolmap"], ["Nerfstudio", "gsplat"], uses_core=["core", "ai-local"]),
    PackageSpec("spatial-xr", "8. Spatial, Interactive & Data Media", "Layer 2", "AR / VR & Spatial Video", "React Three XR, equirectangular v360 projection, and USDZ export.", ["@react-three/xr", "three"], ["fastapi", "pydantic"], ["usd-core"]),
    PackageSpec("branch-video", "8. Spatial, Interactive & Data Media", "Layer 2", "Interactive Branching Video", "React Flow branch builder, HTML5 video overlay, and SQLite analytics.", ["@xyflow/react"], ["fastapi", "pydantic", "aiosqlite"], []),
    PackageSpec("data-charts", "8. Spatial, Interactive & Data Media", "Layer 2", "Animated Data Visualization", "D3, Recharts, Remotion frame charts, Manim, Plotly & Matplotlib.", ["d3", "recharts", "remotion"], ["fastapi", "pydantic"], ["manim", "plotly", "kaleido", "matplotlib"]),
    PackageSpec("code-video", "8. Spatial, Interactive & Data Media", "Layer 2", "Code-to-Video & Explainers", "Shiki Magic Move, Remotion, Manim, Pygments & Playwright capture.", ["shiki", "shiki-magic-move", "remotion"], ["fastapi", "pydantic"], ["manim", "pygments", "playwright"]),

    # ── Domain 9: Studio Workflow, Collaboration & Delivery (8) ──────────────
    PackageSpec("scriptwriter", "9. Studio Workflow & Delivery", "Layer 2", "Scriptwriting & Shot Lists", "Fountain screenplay editor, DnD shot lists, and AI storyboards.", ["@tiptap/react", "@dnd-kit/core"], ["fastapi", "pydantic", "aiosqlite"], ["pydantic-ai", "google-genai"], uses_core=["core", "ai-agents"]),
    PackageSpec("frame-review", "9. Studio Workflow & Delivery", "Layer 2", "Frame-Accurate Review", "On-frame Konva annotations synced via FastAPI WebSockets & SQLite WAL.", ["react-konva"], ["fastapi", "pydantic", "aiosqlite"], []),
    PackageSpec("version-history", "9. Studio Workflow & Delivery", "Layer 2", "Project Version Control", "Zundo/Immer undo-redo and JSON-Patch timeline revisions in SQLite WAL.", ["zundo", "immer"], ["fastapi", "pydantic", "aiosqlite"], ["jsonpatch"]),
    PackageSpec("node-pipelines", "9. Studio Workflow & Delivery", "Layer 2", "Cross-Modality Node Pipelines", "Visual React Flow DAG editor with NetworkX topological runner.", ["@xyflow/react"], ["fastapi", "pydantic"], ["networkx", "huey"], uses_core=["core", "ai-router"]),
    PackageSpec("media-proxy", "9. Studio Workflow & Delivery", "Layer 2", "Proxy Generation & Caching", "IndexedDB client cache, HLS.js, and ultrafast 720p/540p FFmpeg proxies.", ["idb-keyval", "hls.js"], ["fastapi", "pydantic"], ["aiofiles"]),
    PackageSpec("render-queue", "9. Studio Workflow & Delivery", "Layer 2", "Distributed Render Queue", "SSE-monitored Huey/tinyjobs render queue backed by SQLite WAL.", ["@tanstack/react-query"], ["fastapi", "pydantic", "aiosqlite"], ["huey", "tinyjobs"]),
    PackageSpec("c2pa-sign", "9. Studio Workflow & Delivery", "Layer 2", "Content Credentials & C2PA", "Client & Rust-backed C2PA provenance signing and verification.", ["@contentauth/c2pa-web"], ["fastapi", "pydantic"], ["c2pa-python"]),
    PackageSpec("social-publish", "9. Studio Workflow & Delivery", "Layer 2", "Social Publishing & Scheduler", "Calendar scheduler backed by APScheduler SQLite job store.", ["react-day-picker", "zod"], ["fastapi", "pydantic", "httpx"], ["apscheduler", "google-api-python-client"]),

    # ── Domain 10: Design Systems, UI Prototyping & Web Export (5) ───────────
    PackageSpec("ui-tokens", "10. Design Systems & UI", "Layer 2", "Design Tokens & Theming", "Tailwind 4 @theme token manager and CSS variable compiler.", ["zustand"], ["fastapi", "pydantic", "aiosqlite"], []),
    PackageSpec("ui-prototype", "10. Design Systems & UI", "Layer 2", "Interactive Prototyping", "Motion, DnD-Kit, XState, and resizable panel prototyping.", ["motion", "@dnd-kit/core", "xstate", "react-resizable-panels"], ["fastapi", "pydantic", "aiosqlite"], []),
    PackageSpec("ui-studio", "10. Design Systems & UI", "Layer 2", "UI Component Studio", "Radix primitives, CVA, tailwind-merge, and live prop registry.", ["@radix-ui/react-dialog", "class-variance-authority", "tailwind-merge"], ["fastapi", "pydantic"], []),
    PackageSpec("ui-export", "10. Design Systems & UI", "Layer 2", "Design-to-Code Export", "Design JSON to React 19 + Tailwind 4 JSX code generator.", [], ["fastapi", "pydantic"], ["pydantic-ai", "google-genai"], uses_core=["core", "ai-agents"]),
    PackageSpec("a11y-audit", "10. Design Systems & UI", "Layer 2", "A11y & Contrast Auditing", "WCAG contrast & axe-core accessibility auditing with Playwright.", ["axe-core"], ["fastapi", "pydantic", "aiosqlite"], ["playwright"]),

    # ── Domain 11: Game Dev, Physics & Procedural Worlds (4) ─────────────────
    PackageSpec("game-2d", "11. Game Dev & Physics", "Layer 2", "2D Game Engine", "PixiJS/Phaser 2D canvas, tilemaps, and sprite-atlas packer.", ["pixi.js", "phaser"], ["fastapi", "pydantic"], ["pillow"]),
    PackageSpec("physics-3d", "11. Game Dev & Physics", "Layer 2", "3D Physics Simulation", "Rapier/Cannon-es browser physics and PyBullet/Trimesh collision baking.", ["@react-three/rapier", "cannon-es", "three"], ["fastapi", "pydantic"], ["pybullet", "trimesh"]),
    PackageSpec("shader-graph", "11. Game Dev & Physics", "Layer 2", "Procedural Textures & Shaders", "GLSL/WGSL node shader graph and PBR texture map generator.", ["three", "@xyflow/react"], ["fastapi", "pydantic"], ["numpy", "pillow"]),
    PackageSpec("npc-ai", "11. Game Dev & Physics", "Layer 2", "NPC Dialogue & Behavior", "React Flow dialogue trees with LLM memory in SQLite WAL.", ["@xyflow/react"], ["fastapi", "pydantic", "aiosqlite"], ["pydantic-ai", "google-genai"], uses_core=["core", "ai-agents"]),

    # ── Domain 12: Security, Auth, Billing & Usage Metering (4) ──────────────
    PackageSpec("auth-rbac", "12. Security & Metering", "Layer 2", "Auth, RBAC & Sessions", "Zod/Router guards with FastAPI JWT/Argon2 RBAC in SQLite WAL.", ["zod", "react-router"], ["fastapi", "pydantic", "aiosqlite"], ["pyjwt", "argon2-cffi"]),
    PackageSpec("ai-credits", "12. Security & Metering", "Layer 2", "AI Credits & Usage Metering", "Token/GPU-second usage ledger and quota dashboard in SQLite WAL.", ["recharts"], ["fastapi", "pydantic", "aiosqlite"], [], uses_core=["core", "ai-router"]),
    PackageSpec("media-drm", "12. Security & Metering", "Layer 2", "Media DRM & Encryption", "WebCrypto + HLS AES-128 segment encryption and signed URLs.", ["hls.js"], ["fastapi", "pydantic"], ["cryptography"]),
    PackageSpec("audit-logs", "12. Security & Metering", "Layer 2", "Audit & Compliance Logs", "Immutable SQLite WAL audit log viewer with PII masking.", ["@tanstack/react-table"], ["fastapi", "pydantic", "aiosqlite"], []),

    # ── Domain 13: Testing, Telemetry, Eval & Benchmarking (4) ───────────────
    PackageSpec("ai-evals", "13. Testing, Evals & Telemetry", "Layer 2", "AI Evals & Benchmarks", "Model latency, cost, and quality benchmark matrix.", ["recharts"], ["fastapi", "pydantic", "aiosqlite"], ["pydantic-ai"], uses_core=["core", "ai-agents", "ai-router"]),
    PackageSpec("media-qc", "13. Testing, Evals & Telemetry", "Layer 2", "Media Quality Metrics", "SSIM, PSNR, VMAF, and LUFS automated media quality checks.", [], ["fastapi", "pydantic"], ["opencv-python-headless", "scikit-image"]),
    PackageSpec("dataset-studio", "13. Testing, Evals & Telemetry", "Layer 2", "Synthetic Dataset Studio", "Dataset curation grid with Faker/LLM generation & JSONL/Parquet export.", ["@tanstack/react-table"], ["fastapi", "pydantic"], ["datasets", "faker", "pillow", "pydantic-ai"], uses_core=["core", "ai-agents"]),
    PackageSpec("telemetry", "13. Testing, Evals & Telemetry", "Layer 2", "Studio Telemetry & Health", "Web Vitals, ErrorBoundary, psutil CPU/GPU VRAM & SSE health.", [], ["fastapi", "pydantic"], ["psutil"]),
]


def _py_mod_name(pkg_name: str) -> str:
    return pkg_name.replace("-", "_")


def _write_if_missing(path: Path, content: str, force: bool = False) -> bool:
    if path.exists() and not force:
        return False
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")
    return True


def scaffold_package(spec: PackageSpec, force: bool = False) -> int:
    pkg_dir = PACKAGES_ROOT / spec.name
    py_name = f"workspace-{spec.name}"
    py_mod = _py_mod_name(spec.name)
    created = 0

    # 1. package.json
    pkg_json = {
        "name": f"@workspace/{spec.name}",
        "version": "1.0.0",
        "private": True,
        "description": spec.description,
        "main": "./external/client/index.ts",
        "types": "./external/client/index.ts",
        "type": "module",
        "exports": {
            ".": {
                "types": "./external/client/index.ts",
                "import": "./external/client/index.ts",
                "default": "./external/client/index.ts",
            },
            "./client": {
                "types": "./external/client/index.ts",
                "import": "./external/client/index.ts",
                "default": "./external/client/index.ts",
            },
            "./types": {
                "types": "./external/client/types.ts",
                "import": "./external/client/types.ts",
                "default": "./external/client/types.ts",
            },
        },
        "files": ["external", "internal", "Preview", "README.md"],
        "scripts": {
            "test": "python tests/test_internal.py && python tests/test_external.py",
            "typecheck": "tsc --noEmit",
        },
        "keywords": ["workspace", spec.name, spec.domain.lower()],
        "license": "MIT",
    }
    if _write_if_missing(pkg_dir / "package.json", json.dumps(pkg_json, indent=2) + "\n", force):
        created += 1

    # 2. pyproject.toml
    core_deps = ",\n    ".join(f'"{d}"' for d in spec.backend_core)
    engine_deps = ",\n    ".join(f'"{d}"' for d in spec.backend_engine)
    optional_block = (
        f'\n[project.optional-dependencies]\nengine = [\n    {engine_deps},\n]\n'
        if spec.backend_engine
        else ""
    )
    pyproject = f"""[build-system]
requires = ["setuptools>=61.0", "wheel"]
build-backend = "setuptools.build_meta"

[project]
name = "{py_name}"
version = "1.0.0"
description = "{spec.description}"
readme = "README.md"
license = {{ text = "MIT" }}
requires-python = ">=3.11"
dependencies = [
    {core_deps},
]
{optional_block}
[tool.setuptools.packages.find]
where = ["."]
include = ["internal*", "external*"]
"""
    if _write_if_missing(pkg_dir / "pyproject.toml", pyproject, force):
        created += 1

    # 3. setup.py
    install_req = ", ".join(f'"{d}"' for d in spec.backend_core)
    setup_py = f"""from setuptools import setup, find_packages

setup(
    name="{py_name}",
    version="1.0.0",
    description="{spec.description}",
    packages=find_packages(include=["internal*", "external*"]),
    include_package_data=True,
    install_requires=[{install_req}],
)
"""
    if _write_if_missing(pkg_dir / "setup.py", setup_py, force):
        created += 1

    # 4. tsconfig.json
    tsconfig = {
        "compilerOptions": {
            "target": "ES2022",
            "module": "ESNext",
            "moduleResolution": "bundler",
            "jsx": "react-jsx",
            "skipLibCheck": True,
            "strict": False,
            "noEmit": True,
        },
        "include": ["external/client", "internal"],
    }
    if _write_if_missing(pkg_dir / "tsconfig.json", json.dumps(tsconfig, indent=2) + "\n", force):
        created += 1

    # 5. README.md
    fe_list = ", ".join(f"`{x}`" for x in spec.frontend) or "React 19 + Vite 8 + Tailwind 4"
    be_list = ", ".join(f"`{x}`" for x in (spec.backend_core + spec.backend_engine))
    readme = f"""# `@workspace/{spec.name}` ({spec.title})

> **Domain**: {spec.domain} · **Layer**: {spec.layer} · **Python**: `{py_name}`

{spec.description}

## Stack
- **Frontend (React 19 + Vite 8 + Tailwind 4)**: {fe_list}
- **Backend (FastAPI + SQLite WAL)**: {be_list}
{f"- **Local / Open-Weight Models**: {', '.join(spec.local_models)}" if spec.local_models else ""}
{f"- **Cloud APIs**: {', '.join(spec.cloud_apis)}" if spec.cloud_apis else ""}

## Quick Start

```ts
import {{ getPackageMeta }} from '@workspace/{spec.name}';
```

```python
from external import router, get_capabilities
```
"""
    if _write_if_missing(pkg_dir / "README.md", readme, force):
        created += 1

    # 6. Preview/preview.json
    preview = {
        "title": f"@workspace/{spec.name} — {spec.title}",
        "subtitle": spec.description,
        "domain": spec.domain,
        "layer": spec.layer,
        "runtime": "React 19 + FastAPI + SQLite WAL",
        "frontendStack": spec.frontend,
        "backendStack": spec.backend_core + spec.backend_engine,
        "localModels": spec.local_models,
        "cloudApis": spec.cloud_apis,
        "usesCore": spec.uses_core,
        "requiresCoopCoep": spec.needs_coop_coep,
        "features": [
            f"2-Tier encapsulated architecture (internal/ + external/)",
            f"FastAPI APIRouter mounted at /api/{spec.name}",
            f"Typed React 19 facade via @workspace/{spec.name}",
        ],
        "commands": [
            f"import {{ getPackageMeta }} from '@workspace/{spec.name}';",
            f"from {py_mod}.external import router, get_capabilities",
        ],
    }
    if _write_if_missing(pkg_dir / "Preview" / "preview.json", json.dumps(preview, indent=2) + "\n", force):
        created += 1

    # 7. internal/
    _write_if_missing(pkg_dir / "internal" / "__init__.py", '"""Internal private implementation."""\n', force)

    models_py = f'''"""Pydantic schemas for {spec.name}."""

from typing import Dict, List
from pydantic import BaseModel


class CapabilityReport(BaseModel):
    package: str = "{spec.name}"
    domain: str = "{spec.domain}"
    available_engines: Dict[str, bool]
    local_models: List[str] = {json.dumps(spec.local_models)}
    cloud_apis: List[str] = {json.dumps(spec.cloud_apis)}
'''
    if _write_if_missing(pkg_dir / "internal" / "models.py", models_py, force):
        created += 1

    probe_modules = [
        m.split("[")[0].replace("-", "_")
        for m in (spec.backend_core + spec.backend_engine)
    ]
    engine_py = f'''"""Core internal engine for {spec.name}."""

import importlib.util
from typing import Dict
from .models import CapabilityReport

_PROBE_MODULES = {json.dumps(probe_modules)}


def probe_engines() -> Dict[str, bool]:
    """Check which optional/core Python engines are installed in the active environment."""
    return {{mod: importlib.util.find_spec(mod) is not None for mod in _PROBE_MODULES}}


def build_capability_report() -> CapabilityReport:
    return CapabilityReport(available_engines=probe_engines())
'''
    if _write_if_missing(pkg_dir / "internal" / "engine.py", engine_py, force):
        created += 1

    core_ts = f"""export interface PackageMeta {{
  name: string;
  domain: string;
  layer: string;
  requiresCoopCoep: boolean;
}}

export const PACKAGE_META: PackageMeta = {{
  name: '@workspace/{spec.name}',
  domain: '{spec.domain}',
  layer: '{spec.layer}',
  requiresCoopCoep: {str(spec.needs_coop_coep).lower()},
}};
"""
    if _write_if_missing(pkg_dir / "internal" / "core.ts", core_ts, force):
        created += 1

    # 8. external/
    routes_py = f'''"""FastAPI public router for @workspace/{spec.name}."""

from fastapi import APIRouter
from internal.engine import build_capability_report
from internal.models import CapabilityReport

router = APIRouter(prefix="/api/{spec.name}", tags=["{spec.name}"])


@router.get("/health", response_model=CapabilityReport)
async def health_check() -> CapabilityReport:
    """Report package readiness and installed optional engines."""
    return build_capability_report()
'''
    if _write_if_missing(pkg_dir / "external" / "routes.py", routes_py, force):
        created += 1

    ext_init = f'''"""Public facade for workspace-{spec.name}."""

import sys
from pathlib import Path

_pkg_root = Path(__file__).resolve().parent.parent
if str(_pkg_root) in sys.path:
    sys.path.remove(str(_pkg_root))
sys.path.insert(0, str(_pkg_root))

from internal.engine import build_capability_report as get_capabilities  # noqa: E402
from internal.models import CapabilityReport  # noqa: E402
from external.routes import router  # noqa: E402

__all__ = ["CapabilityReport", "get_capabilities", "router"]
'''
    if _write_if_missing(pkg_dir / "external" / "__init__.py", ext_init, force):
        created += 1

    types_ts = f"""export type {{ PackageMeta }} from '../../internal/core';

export interface CapabilityResponse {{
  package: string;
  domain: string;
  available_engines: Record<string, boolean>;
  local_models: string[];
  cloud_apis: string[];
}}
"""
    if _write_if_missing(pkg_dir / "external" / "client" / "types.ts", types_ts, force):
        created += 1

    index_ts = f"""import {{ PACKAGE_META, type PackageMeta }} from '../../internal/core';
export type {{ CapabilityResponse, PackageMeta }} from './types';

export function getPackageMeta(): PackageMeta {{
  return PACKAGE_META;
}}
"""
    if _write_if_missing(pkg_dir / "external" / "client" / "index.ts", index_ts, force):
        created += 1

    # 9. tests/
    test_int = f'''"""Isolated internal unit tests for {spec.name}."""

import sys
from pathlib import Path

PKG_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PKG_ROOT))

from internal.engine import build_capability_report, probe_engines


def test_probe_engines_returns_dict() -> None:
    engines = probe_engines()
    assert isinstance(engines, dict)


def test_capability_report() -> None:
    report = build_capability_report()
    assert report.package == "{spec.name}"
    assert report.domain == "{spec.domain}"


if __name__ == "__main__":
    test_probe_engines_returns_dict()
    test_capability_report()
    print("OK internal: {spec.name}")
'''
    if _write_if_missing(pkg_dir / "tests" / "test_internal.py", test_int, force):
        created += 1

    test_ext = f'''"""Isolated public facade tests for {spec.name}."""

import sys
from pathlib import Path

PKG_ROOT = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(PKG_ROOT))

from external import CapabilityReport, get_capabilities, router


def test_facade_exports() -> None:
    report = get_capabilities()
    assert isinstance(report, CapabilityReport)
    assert router.prefix == "/api/{spec.name}"


if __name__ == "__main__":
    test_facade_exports()
    print("OK external: {spec.name}")
'''
    if _write_if_missing(pkg_dir / "tests" / "test_external.py", test_ext, force):
        created += 1

    return created


def main() -> None:
    parser = argparse.ArgumentParser(description="Scaffold all 75 Soul Workspace packages.")
    parser.add_argument("--force", action="store_true", help="Overwrite existing scaffold files.")
    args = parser.parse_args()

    total_files = 0
    for spec in PACKAGE_CATALOG:
        total_files += scaffold_package(spec, force=args.force)
    print(f"Scaffolded {len(PACKAGE_CATALOG)} packages ({total_files} files written).")


if __name__ == "__main__":
    main()
