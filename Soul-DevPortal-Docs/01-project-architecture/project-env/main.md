# Project Environment Architecture — Technical Specification & Guide

> **Domain**: Environment Variables Hygiene, Secret Security & Validation Schemas  
> **Applies to**: Full Monorepo Workspace, Microservices & Shared Libraries

---

## 1. Environment Architecture & Scoping

The Soul Monorepo enforces a strict boundary between public frontend variables and private backend secrets.

```
                           ENVIRONMENT VARIABLE SCOPE
 ┌─────────────────────────────────────────────────────────────────────────────┐
 │                               .env File                                     │
 ├─────────────────────────────────────────────┬───────────────────────────────┤
 │  Client-Exposed Variables (Vite Bundled)    │  Server-Only Private Secrets  │
 │  (Visible in Browser Sources!)              │  (Restricted to Python Runtime│
 │                                             │                               │
 │  VITE_APP_TITLE="ApexMind AI"               │  SERVER_PORT=8000             │
 │  VITE_API_BASE_URL="/api"                   │  AI_GEMINI_API_KEY="AIzaSy..."│
 │  VITE_ENABLE_ANALYTICS="false"              │  AUTH_JWT_SECRET="c8f1b2..."  │
 │                                             │  DB_BUSY_TIMEOUT=5000         │
 └─────────────────────────────────────────────┴───────────────────────────────┘
```

---

## 2. Universal `.env.example` Baseline

Every micro-application root provides this baseline:

```bash
# ==============================================================================
# SOUL MONOREPO — APPLICATION ENVIRONMENT BASELINE
# ==============================================================================

# Server Configuration
SERVER_HOST=127.0.0.1
SERVER_PORT=8000
SERVER_ENV=development
SERVER_LOG_LEVEL=INFO

# Client Configuration (Exposed to Browser via Vite)
VITE_APP_TITLE=Soul Application
VITE_API_BASE_URL=/api

# Database Configuration (SQLite WAL Engine)
DB_PATH=server/data/app.db
DB_TIMEOUT=5000

# Artificial Intelligence (If Applicable)
AI_GEMINI_API_KEY=your_gemini_api_key_here
AI_MODEL_NAME=gemini-2.5-flash

# Authentication & Security
AUTH_SECRET_KEY=your_development_secret_key_change_in_production
AUTH_TOKEN_EXPIRY_MINUTES=1440
```

---

## 3. Server-Side Pydantic `BaseSettings` Validation

In FastAPI services, environment variables are loaded and validated strictly via `pydantic-settings`:

```python
# server/shared/config.py
from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import Field
from typing import Optional
from pathlib import Path

class AppSettings(BaseSettings):
    server_host: str = Field(default="127.0.0.1", alias="SERVER_HOST")
    server_port: int = Field(default=8000, alias="SERVER_PORT")
    server_env: str = Field(default="development", alias="SERVER_ENV")
    
    db_path: str = Field(default="server/data/app.db", alias="DB_PATH")
    db_timeout: int = Field(default=5000, alias="DB_TIMEOUT")
    
    ai_gemini_api_key: Optional[str] = Field(default=None, alias="AI_GEMINI_API_KEY")
    
    model_config = SettingsConfigDict(
        env_file=str(Path(__file__).resolve().parent.parent.parent / ".env"),
        env_file_encoding="utf-8",
        extra="ignore"
    )

settings = AppSettings()
```

---

## 4. Sensitive Data Masking Protocol

When logging requests, errors, or configuration objects, all sensitive attributes must be obfuscated.

### Masking Implementation

```python
import re

SENSITIVE_PATTERNS = [
    re.compile(r'(?i)(api[_-]?key|secret|password|token|bearer)\s*[:=]\s*["\']?([^"\'\s]+)["\']?')
]

def mask_sensitive_string(raw: str) -> str:
    """Mask secret values, preserving only first 3 and last 4 characters."""
    def replacer(match):
        key = match.group(1)
        val = match.group(2)
        if len(val) <= 8:
            masked = "***"
        else:
            masked = f"{val[:3]}...{val[-4:]}"
        return f'{key}="{masked}"'
    
    result = raw
    for pattern in SENSITIVE_PATTERNS:
        result = pattern.sub(replacer, result)
    return result
```

---

## 5. Master Micro-Application Configuration Matrix

Rather than maintaining fragmented template files, all project-specific environment requirements are consolidated into this master reference matrix:

| Project Name | Required Environment Variables | Default / Fallback Values | Description |
|---|---|---|---|
| **apexmind-ai** | `AI_GEMINI_API_KEY`<br>`AI_MODEL_NAME`<br>`TTS_ENGINE` | `AI_MODEL_NAME=gemini-2.5-flash`<br>`TTS_ENGINE=edge-tts` | Audio speech generation and Google Gemini API keys |
| **outpass-system** | `AUTH_JWT_SECRET`<br>`AUTH_EXPIRE_MINUTES` | `AUTH_EXPIRE_MINUTES=1440` | Student outpass approval token signing secret |
| **free-api-hub** | `MAX_MOCK_ROUTES`<br>`MOCK_DELAY_MS` | `MAX_MOCK_ROUTES=500`<br>`MOCK_DELAY_MS=0` | Dynamic API prototyping and mock latency throttling |
| **sonikoma** | `AI_GEMINI_API_KEY`<br>`VIDEO_TEMP_DIR` | `VIDEO_TEMP_DIR=server/data/media` | Video synthesis and script generation models |
| **spatial-dimensions** | `SCENE_ASSETS_PATH`<br>`EXPORT_FORMAT` | `SCENE_ASSETS_PATH=server/data/scenes`<br>`EXPORT_FORMAT=gltf` | 3D coordinate mapping and asset storage cache |
| **college-management** | `SESSION_SECRET`<br>`ATTENDANCE_WINDOW_MINS` | `ATTENDANCE_WINDOW_MINS=60` | Campus faculty and student portal session security |
| **globalpulse-ai** | `AI_GEMINI_API_KEY`<br>`NEWS_REFRESH_INTERVAL` | `NEWS_REFRESH_INTERVAL=300` | Automated news crawler and LLM summarization pipeline |
| **postcraft-ai** | `AI_GEMINI_API_KEY`<br>`MAX_TOKENS_PER_POST` | `MAX_TOKENS_PER_POST=1024` | Social media multi-platform copy generation engine |
| **devportal** | `SERVER_PORT`<br>`WORKSPACE_MONITOR_MS` | `SERVER_PORT=8008`<br>`WORKSPACE_MONITOR_MS=2000` | Monorepo process manager and port auditing telemetry |
