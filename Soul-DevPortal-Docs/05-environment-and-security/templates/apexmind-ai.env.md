# Environment Template: `apexmind-ai`

### 7.1 Project 1: `apexmind-ai` (React 19 + Vite 8 + FastAPI + SQLite)
*Path: `Soul-DevPortal-Projects/apexmind-ai/.env.example`*

```bash
# ==============================================================================
# apexmind-ai Environment Configuration
# Ports: Client :5173 | Server :8000 | Database: SQLite WAL
# ==============================================================================
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8000"
CLIENT_PORT="5173"

# Authentication & Session Security (SERVER-ONLY)
JWT_SECRET_KEY="replace-with-a-64-character-random-hex-string"
JWT_EXPIRY_MINUTES="1440"

# Persistent Database Storage (Canonical Standard Name)
DATABASE_PATH="server/data/apexmind.db"

# Artificial Intelligence (Gemini 2.5 Flash)
GEMINI_API_KEY=""
DEFAULT_SCRIPT_MODEL="gemini-2.5-flash"
DEFAULT_TTS_MODEL="gemini-2.5-flash"
GCP_PROJECT_ID=""
GOOGLE_APPLICATION_CREDENTIALS=""

# OAuth & Social Integrations
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_SEARCH_API_KEY=""
GOOGLE_CSE_ID=""
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""
FACEBOOK_REDIRECT_URI="http://localhost:5173/social-accounts"
FACEBOOK_AUTH_REDIRECT_URI="http://localhost:5173/login"
INSTAGRAM_APP_ID=""
INSTAGRAM_APP_SECRET=""
INSTAGRAM_REDIRECT_URI="http://localhost:5173/social-accounts"
INSTAGRAM_AUTH_REDIRECT_URI="http://localhost:5173/login"

# Stock Media Providers
PEXELS_API_KEY=""
PIXABAY_API_KEY=""
UNSPLASH_ACCESS_KEY=""
JAMENDO_CLIENT_ID="56d30c95"

# Runner & Supervisor Flags
BACKEND_RELOAD="true"
LOG_LEVEL="info"
AUTO_INSTALL_DEPS="false"
OPEN_BROWSER="false"
```

---
