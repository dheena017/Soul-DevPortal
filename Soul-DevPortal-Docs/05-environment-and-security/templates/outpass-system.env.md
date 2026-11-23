# Environment Template: `outpass-system`

### 7.2 Project 2: `outpass-system` (React 19 + Vite 8 + FastAPI + SQLite)
*Path: `Soul-DevPortal-Projects/outpass-system/.env.example`*

```bash
# ==============================================================================
# outpass-system Environment Configuration
# Ports: Client :5174 | Server :8001 | Database: SQLite + SQLAlchemy
# ==============================================================================
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8001"
CLIENT_PORT="5174"

# Database Persistence (Canonical SQLAlchemy URI - Zero Duplicate)
DATABASE_URL="sqlite:///server/data/outpass.db"

# Security & Wardens Gatekeeper Secrets
JWT_SECRET_KEY="replace-with-a-64-character-random-hex-string"
JWT_EXPIRY_MINUTES="1440"
ADMIN_MASTER_KEY="warden-admin-secret-key-2026"
GATE_SCANNER_KEY="gate-security-scanner-token-2026"

# SMS Notification Gateway (Fast2SMS / Twilio)
SMS_PROVIDER_API_KEY=""
SMS_SENDER_ID="OUTPSS"

# SMTP Email Dispatcher (Parent & Warden Alerts)
SMTP_HOST="smtp.gmail.com"
SMTP_PORT="587"
SMTP_USER=""
SMTP_PASSWORD=""
SMTP_FROM_EMAIL="outpass-system@institution.edu"

# Runner & Supervisor Flags
BACKEND_RELOAD="true"
LOG_LEVEL="info"
```

---
