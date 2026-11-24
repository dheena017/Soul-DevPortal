# Environment Template: `globalpulse-ai`

### 7.7 Project 7: `globalpulse-ai` (React 19 + Vite 8 + FastAPI + SQLite)
*Path: `Soul-DevPortal-Projects/globalpulse-ai/.env.example`*

```bash
# ==============================================================================
# globalpulse-ai Environment Configuration
# Ports: Client :5179 | Server :8003 | Database: SQLite (aiosqlite)
# ==============================================================================
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8003"
CLIENT_PORT="5179"

# Database Persistence (Canonical Standard Name)
DATABASE_PATH="server/data/globalpulse.db"

# Artificial Intelligence & News Ingestion
GEMINI_API_KEY=""
NEWS_API_KEY=""
GNEWS_API_KEY=""
WORLD_NEWS_API_KEY=""

# Synthesis Engine Scheduler
SUMMARY_CRON_INTERVAL="*/30 * * * *"
ENABLE_AUTO_SYNTHESIS="true"

# Runner & Supervisor Flags
BACKEND_RELOAD="true"
LOG_LEVEL="info"
```

---
