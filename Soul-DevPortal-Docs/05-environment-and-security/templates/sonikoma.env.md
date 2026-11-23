# Environment Template: `sonikoma`

### 7.4 Project 4: `sonikoma` (React 19 + Vite 8 + FastAPI + SQLite)
*Path: `Soul-DevPortal-Projects/sonikoma/.env.example`*

```bash
# ==============================================================================
# sonikoma Environment Configuration
# Ports: Client :5176 | Server :8006 | Database: SQLite / Supabase PostgreSQL
# ==============================================================================
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8006"
CLIENT_PORT="5176"

# Database Persistence (Canonical Standard Name)
DATABASE_PATH="server/data/sonikoma.db"

# Supabase Hybrid Backend (Optional Extension)
SUPABASE_URL=""
SUPABASE_ANON_KEY=""
SUPABASE_SERVICE_ROLE_KEY=""

# AI Generation Engines (Voice & Video)
GEMINI_API_KEY=""
ELEVENLABS_API_KEY=""
RUNWAY_API_KEY=""

# Security
JWT_SECRET_KEY="replace-with-a-64-character-random-hex-string"
JWT_EXPIRY_MINUTES="1440"

# Runner & Supervisor Flags
BACKEND_RELOAD="true"
LOG_LEVEL="info"
```

---
