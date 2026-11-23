# Environment Validation Code Patterns

### 8.1 Python Backend Pattern (FastAPI / Pydantic Settings)

In Python servers (`server/shared/config.py`), resolve `.env` robustly relative to `server/` and validate using Pydantic:

```python
# server/shared/config.py
import os
from pathlib import Path
from dotenv import load_dotenv

# Robust multi-directory .env resolution
_SERVER_DIR = Path(__file__).resolve().parent.parent
_PROJ_ROOT = _SERVER_DIR.parent
_ENV_FILE = _PROJ_ROOT / ".env"

if _ENV_FILE.exists():
    load_dotenv(dotenv_path=_ENV_FILE)
else:
    load_dotenv()  # Fallback to current working directory


class Settings:
    # Networking
    PORT: int = int(os.environ.get("PORT", 8000))
    HOST: str = os.environ.get("HOST", "127.0.0.1")
    APP_URL: str = os.environ.get("APP_URL", "http://localhost:5173")
    ENV: str = os.environ.get("NODE_ENV", "development")

    # Security
    JWT_SECRET_KEY: str = os.environ.get("JWT_SECRET_KEY", "dev-secret-key-change-in-prod")

    # Storage
    DATA_DIR: Path = _SERVER_DIR / "data"
    DB_PATH: Path = DATA_DIR / "apexmind.db"

    # API Keys
    @property
    def GEMINI_API_KEY(self) -> str:
        return os.environ.get("GEMINI_API_KEY", "").strip()

    @property
    def has_gemini_key(self) -> bool:
        return bool(self.GEMINI_API_KEY)

    @property
    def is_production(self) -> bool:
        return self.ENV.lower() == "production"


settings = Settings()
```

### 8.2 Node.js / TypeScript Pattern (Vite / Express)

For Node services or client configs, load and type-check environment variables:

```typescript
// client/vite.config.ts
import { defineConfig, loadEnv } from 'vite';
import { resolve } from 'node:path';

const clientRoot = import.meta.dirname;
const projectRoot = resolve(clientRoot, '..');

export default defineConfig(({ mode }) => {
  // Load env file from project root
  const env = loadEnv(mode, projectRoot, '');

  const backendPort = env.PORT || '8000';
  const backendUrl = env.BACKEND_URL || `http://127.0.0.1:${backendPort}`;

  return {
    server: {
      port: Number(env.FRONTEND_PORT) || 5173,
      proxy: {
        '/api': {
          target: backendUrl,
          changeOrigin: true,
        },
      },
    },
  };
});
```

---
