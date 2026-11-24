# Environment Template: `college-management-system`

### 7.6 Project 6: `college-management-system` (React 19 + Vite 8 + FastAPI + SQLite)
*Path: `Soul-DevPortal-Projects/college-management-system/.env.example`*

```bash
# ==============================================================================
# college-management-system Environment Configuration
# Ports: Client :5178 | Server :8005 | Database: SQLite (better-sqlite3)
# ==============================================================================
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8005"
CLIENT_PORT="5178"

# Database Persistence (Canonical Standard Name)
DATABASE_PATH="server/data/college.db"

# Authentication & RBAC (Unified JWT_SECRET_KEY - Zero Duplicate)
JWT_SECRET_KEY="replace-with-a-64-character-random-hex-string"
JWT_EXPIRY_MINUTES="1440"
FACULTY_PORTAL_TOKEN="faculty-auth-token-2026"

# Runner & Supervisor Flags
LOG_LEVEL="info"
```

---
