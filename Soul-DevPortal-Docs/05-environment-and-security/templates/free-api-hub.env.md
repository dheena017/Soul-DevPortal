# Environment Template: `free-api-hub`

### 7.3 Project 3: `free-api-hub` (React 19 + Vite 8 + FastAPI + SQLite)
*Path: `Soul-DevPortal-Projects/free-api-hub/.env.example`*

```bash
# ==============================================================================
# free-api-hub Environment Configuration
# Ports: Client :5175 | Server :8002 | Database: JSON Flat Store
# ==============================================================================
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8002"
CLIENT_PORT="5175"

# Persistent Storage (Canonical Database Path - Zero Duplicate)
DATABASE_PATH="server/data/free_api_store.json"
MOCK_DATA_SEED_PATH="server/data/seeds.json"

# API Hub Traffic Control & Public Docs
RATE_LIMIT_PER_MINUTE="120"
ENABLE_PUBLIC_SWAGGER="true"
CACHE_TTL_SECONDS="300"

# Runner & Supervisor Flags
BACKEND_RELOAD="true"
LOG_LEVEL="info"
```

---
