# Universal Standard `.env` Baseline

At its foundation, **every `.env` file across all 8 projects is simply the Universal Standard Env**. 

Developers do not need to memorize unique setups for each application: **90% of every project's environment configuration consists of the identical Standard Baseline**. Domain-specific keys (such as AI or OAuth) are merely optional plug-in extensions on top of this foundation:

```
                           2-LAYER ENVIRONMENT ARCHITECTURE
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                        │
 │   LAYER 1: UNIVERSAL STANDARD BASELINE (MANDATORY & IDENTICAL FOR ALL 8 PROJECTS)      │
 │   ├── NODE_ENV          (development | test | production)                              │
 │   ├── HOST              (127.0.0.1)                                                    │
 │   ├── SERVER_PORT       (8000 - 8008 assigned backend server port)                     │
 │   ├── CLIENT_PORT       (5173 - 5181 assigned frontend client port)                    │
 │   ├── DATABASE_PATH     (server/data/<project-slug>.db or DATABASE_URL for ORMs)       │
 │   └── JWT_SECRET_KEY    (64-character random cryptographic secret)                     │
 │                                                                                        │
 └───────────────────────────────────────────┬────────────────────────────────────────────┘
                                             │
                                             ▼
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │   LAYER 2: DOMAIN EXTENSIONS (OPTIONAL ADDONS ONLY WHEN NEEDED)                        │
 │   ├── AI & LLM Engine   (GEMINI_API_KEY, DEFAULT_SCRIPT_MODEL)                         │
 │   ├── OAuth2 & Social   (GOOGLE_CLIENT_ID, FACEBOOK_APP_ID, INSTAGRAM_APP_ID)          │
 │   ├── Stock & Media     (PEXELS_API_KEY, PIXABAY_API_KEY, JAMENDO_CLIENT_ID)           │
 │   └── Supervisor Flags  (BACKEND_RELOAD, LOG_LEVEL, AUTO_INSTALL_DEPS)                 │
 └────────────────────────────────────────────────────────────────────────────────────────┘
```

### The Universal Standard Baseline Template

When starting any project or creating a new workspace service, begin with this clean, minimal standard template:

```bash
# ==============================================================================
# UNIVERSAL STANDARD BASELINE
# ==============================================================================
# 1. Local Ports & Runtime
NODE_ENV="development"
HOST="127.0.0.1"
SERVER_PORT="8000"     # Backend API server port (cloud fallback: PORT)
CLIENT_PORT="5173"     # Frontend client dev server port

# 2. Database & Security
DATABASE_PATH="server/data/<project-slug>.db"
JWT_SECRET_KEY="replace-with-a-64-character-random-hex-string"

# 3. Remote Production Overrides (Optional - Auto-derived locally)
# In local development, the app automatically constructs:
#   - Frontend UI: http://localhost:5173
#   - Backend API: http://127.0.0.1:8000 (proxied via Vite /api)
# Set these ONLY when deploying to a public domain in production:
# APP_URL="https://your-app.com"
# VITE_API_URL="https://api.your-app.com"
```

> [!NOTE] Demystifying the Network & URL Variables  
> **Why were `APP_URL`, `BACKEND_URL`, and `VITE_API_URL` historically confusing?**  
> 1. `APP_URL` was just repeating `http://localhost:${CLIENT_PORT}`.  
> 2. `BACKEND_URL` was just repeating `http://127.0.0.1:${SERVER_PORT}`.  
> 3. `VITE_API_URL=""` was left blank because during local development, Vite proxies all requests starting with `/api` directly to the backend server port. Frontend code calls relative paths (`/api/users`), eliminating CORS headaches.  
> **The Proper Modern Standard**: The application code automatically derives `APP_URL` and `BACKEND_URL` from `SERVER_PORT` and `CLIENT_PORT`. Developers only specify the ports locally; full URLs are optional overrides reserved for production deployments.

---
