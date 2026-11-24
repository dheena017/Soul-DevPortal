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

## 5. Per-Project Environment Templates

Complete `.env.example` specifications for all micro-apps are archived and accessible in the [`templates/`](templates/) folder:
- [ApexMind AI Template](templates/apexmind-ai.env.md)
- [Outpass System Template](templates/outpass-system.env.md)
- [Free API Hub Template](templates/free-api-hub.env.md)
- [Sonikoma AI Studio Template](templates/sonikoma.env.md)
- [Spatial Dimensions Template](templates/spatial-dimensions.env.md)
- [College Management System Template](templates/college-management-system.env.md)
- [GlobalPulse AI Template](templates/globalpulse-ai.env.md)
- [PostCraft AI Template](templates/postcraft-ai.env.md)
