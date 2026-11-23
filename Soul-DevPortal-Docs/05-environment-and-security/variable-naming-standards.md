# Variable Scoping & Naming Standards

### 3.1 Prefixing Matrix

| Framework / Layer | Required Prefix | Exposure | Examples |
| :--- | :--- | :--- | :--- |
| **Vite Client** | `VITE_` | Public (bundled into JS) | `VITE_API_URL`, `VITE_APP_TITLE` |
| **Next.js Client** | `NEXT_PUBLIC_` | Public (bundled into JS) | `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_APP_URL` |
| **Python FastAPI** | None (standard uppercase) | Private (server-only) | `GEMINI_API_KEY`, `JWT_SECRET_KEY` |
| **Node.js Express** | None (standard uppercase) | Private (server-only) | `PORT`, `DATABASE_URL`, `SESSION_SECRET` |
| **Shared Runner** | Standard uppercase | Private (CLI toolchain) | `AUTO_INSTALL_DEPS`, `LOG_LEVEL` |

> [!WARNING] Security Breach Hazard: `VITE_` and `NEXT_PUBLIC_`  
> Any variable starting with `VITE_` or `NEXT_PUBLIC_` is extracted at build time by the bundler and embedded verbatim into static HTML/JS assets delivered to the user's browser. Anyone inspecting browser DevTools can read it. Never prefix private API keys or database connection strings with these prefixes.

---

## 4. Mandatory Categories & Standard Key Names

Every project's `.env.example` must organize its variables into the following standardized categories:

### Category 1: Network & Server Lifecycle

Defines where services bind and how processes identify their execution context.

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `NODE_ENV` | `string` | `"development"` | Runtime environment: `"development"`, `"test"`, or `"production"` |
| `HOST` | `string` | `"127.0.0.1"` | Host IP address the backend server binds to (must be `127.0.0.1` locally) |
| `SERVER_PORT` | `number` | *Project assigned* | Backend API server port (assigned range `8000`–`8008`; cloud fallback: `PORT`) |
| `CLIENT_PORT` | `number` | *Project assigned* | Frontend client web port (assigned range `5173`–`5181`; legacy alias: `FRONTEND_PORT`) |

### Category 2: Application URLs & Remote Overrides (Optional / Auto-Derived)

In local development, all application URLs are derived automatically from `HOST`, `SERVER_PORT`, and `CLIENT_PORT` (and requests are proxied via `/api`), so these variables are **not** needed in local `.env` files. They are reserved as optional production overrides for cloud hosting environments (Render, Cloudflare, Netlify, Vercel).

| Key | Type | Local Default | Production Role |
| :--- | :--- | :--- | :--- |
| `APP_URL` | `string` | Auto-derived (`http://localhost:<client-port>`) | Set in production to the public frontend domain for CORS origins |
| `BACKEND_URL` | `string` | Auto-derived (`http://127.0.0.1:<server-port>`) | Set in production to the public backend domain for webhooks & OAuth |
| `VITE_API_URL` | `string` | Empty (`""`, uses `/api` proxy) | Set in production only if frontend is hosted on a separate static CDN |
| `NEXT_PUBLIC_API_URL` | `string` | Empty (`""`, uses rewrite proxy) | Set in production for separate Next.js client deployments |

### Category 3: Authentication, Cryptography & Sessions

Protects user sessions, tokens, and verification hashes.

| Key | Type | Default / Requirement | Description |
| :--- | :--- | :--- | :--- |
| `JWT_SECRET_KEY` | `string` | 64+ char random hex | Secret key used to sign and verify HMAC-SHA256 JWT tokens |
| `JWT_EXPIRY_MINUTES` | `number` | `1440` (24h) | Token lifespan before requiring re-authentication |
| `SESSION_SECRET` | `string` | 64+ char random hex | Express/FastAPI session cookie signing secret |

### Category 4: Database & Storage Persistence

Configures embedded database files and persistent asset directories.

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `DATABASE_URL` | `string` | `"sqlite:///server/data/<name>.db"` | Full database connection string |
| `APEXMIND_DB_PATH` | `string` | `"server/data/apexmind.db"` | Project-specific SQLite storage path override |
| `DATA_DIR` | `string` | `"server/data"` | Directory path for local audio, video, cache, and database assets |

### Category 5: AI Models & GenAI Providers

Coordinates generative AI models and inference engines.

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `GEMINI_API_KEY` | `string` | Required for AI | Google Gemini API key from Google AI Studio |
| `DEFAULT_SCRIPT_MODEL` | `string` | `"gemini-2.5-flash"` | Default Gemini model used for text generation |
| `DEFAULT_TTS_MODEL` | `string` | `"gemini-2.5-flash"` | Default Gemini model used for voiceover / speech synthesis |
| `GCP_PROJECT_ID` | `string` | Optional | Google Cloud project ID for Cloud Quotas & Live API discovery |
| `GOOGLE_APPLICATION_CREDENTIALS` | `string` | Optional | Absolute path to Google Cloud service account JSON |

### Category 6: OAuth 2.0 & Social Media Integrations

Manages OAuth authentication flows and platform publishing.

| Key | Type | Description |
| :--- | :--- | :--- |
| `GOOGLE_CLIENT_ID` | `string` | Google OAuth 2.0 Client ID for Google Sign-In & YouTube API |
| `GOOGLE_CLIENT_SECRET` | `string` | Private Google OAuth client secret (server-only) |
| `GOOGLE_SEARCH_API_KEY` | `string` | Google Custom Search Engine (CSE) API key |
| `GOOGLE_CSE_ID` | `string` | Google Programmable Search Engine ID |
| `FACEBOOK_APP_ID` | `string` | Meta/Facebook Developer App ID |
| `FACEBOOK_APP_SECRET` | `string` | Meta/Facebook App Secret (server-only) |
| `FACEBOOK_REDIRECT_URI` | `string` | OAuth callback redirect URL for Facebook login |
| `INSTAGRAM_APP_ID` | `string` | Instagram Graph API App ID |
| `INSTAGRAM_APP_SECRET` | `string` | Instagram Graph API App Secret (server-only) |
| `INSTAGRAM_REDIRECT_URI`| `string` | OAuth callback redirect URL for Instagram login |

### Category 7: External APIs & Stock Media

Configures third-party stock video, photography, and music providers.

| Key | Type | Description |
| :--- | :--- | :--- |
| `PEXELS_API_KEY` | `string` | Pexels REST API key for curated video stock footage |
| `PIXABAY_API_KEY` | `string` | Pixabay API key for CC0 stock images and video clips |
| `UNSPLASH_ACCESS_KEY` | `string` | Unsplash Developer Access Key for high-res photography |
| `JAMENDO_CLIENT_ID` | `string` | Jamendo API Client ID for royalty-free background music |

### Category 8: Monorepo Runner & Automation Flags

Used by `@workspace/runner` and Python supervisor scripts during development.

| Key | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `BACKEND_RELOAD` | `boolean` | `"true"` | Enables Uvicorn/Express auto-reloading upon file changes |
| `LOG_LEVEL` | `string` | `"info"` | Log output verbosity (`debug`, `info`, `warning`, `error`) |
| `AUTO_INSTALL_DEPS` | `boolean` | `"false"` | Auto-installs missing Python/Node dependencies on startup |
| `OPEN_BROWSER` | `boolean` | `"false"` | Automatically launches default browser when dev server starts |

---
