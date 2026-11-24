# Environment Template: `spatial-dimensions`

### 7.5 Project 5: `spatial-dimensions` (React 19 + Vite 8 + FastAPI + SQLite)
*Path: `Soul-DevPortal-Projects/spatial-dimensions/.env.example`*

```bash
# ==============================================================================
# spatial-dimensions Environment Configuration
# Ports: Client :5177 | Server :8007 | Database: JSONL Inquiries Store
# ==============================================================================
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8007"
CLIENT_PORT="5177"

# Persistent Storage (Canonical Database Path - Zero Duplicate)
DATABASE_PATH="server/data/inquiries.jsonl"
ASSETS_DIR="server/data/uploads"

# Security & Admin Gate
SESSION_SECRET="replace-with-a-64-character-random-hex-string"
ADMIN_PASSWORD_HASH=""

# Runner & Supervisor Flags
LOG_LEVEL="info"
```

---
