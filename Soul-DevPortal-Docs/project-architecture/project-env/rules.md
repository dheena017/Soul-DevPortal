# Project Environment Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: All environment variables, secret management, and configuration across the monorepo

---

## The 8 Inviolable Environment & Security Rules

### 1. Absolute Zero-Secret-in-Git Policy
- **Rule**: Actual `.env`, `.env.local`, `.env.production`, and secret files must **never** be committed to version control.
- **Enforcement**: Verify `.gitignore` contains `.env*` with exception for `.env.example`.

### 2. Mandatory `.env.example` Baseline
- **Rule**: Every project root must provide a `.env.example` documenting every single environment variable required by both client and server.
- **Constraint**: Placeholder values must be safe dummies (e.g. `your_gemini_api_key_here`, `secret_jwt_placeholder`).

### 3. Strict Prefix Scoping Matrix
- **Rule**: Variable names must follow the domain prefix conventions:
  - `VITE_`: Frontend client variables exposed to the browser.
  - `SERVER_`: Backend host, port, worker, and runtime options.
  - `DB_`: SQLite pathing and database options.
  - `AI_`: GenAI API keys (e.g. `AI_GEMINI_API_KEY`).
  - `AUTH_`: JWT secrets, session keys, and OAuth credentials.
- **Prohibition**: Never expose non-`VITE_` backend keys to frontend builds.

### 4. Fail-Fast Startup Validation
- **Rule**: Backends must validate environment variables on boot (via Pydantic `BaseSettings`). If a required variable is missing or invalid, the process must terminate immediately with exit code `1` and a descriptive error message.

### 5. Sensitive Data Masking in Logs
- **Rule**: Passwords, API tokens, bearer keys, and database secrets must **never** appear in plain text in terminal output or log files.
- **Standard**: Mask secrets using `@workspace/logger` or the standard obfuscation pattern: show first 3 and last 4 characters (`sk-...xxxx`).

### 6. Zero Hardcoded Credentials in Source Code
- **Rule**: API keys, database paths, and secrets must never be hardcoded into `.py`, `.ts`, or `.tsx` files. Always read from environment variables.

### 7. Universal Default Fallbacks for Local Dev
- **Rule**: Non-secret configurations (e.g. `PORT=8000`, `LOG_LEVEL=INFO`, `SQLITE_DB_PATH=server/data/app.db`) must supply safe defaults in code so that applications can start out-of-the-box for local testing.

### 8. Project Template Parity
- **Rule**: Whenever an application introduces a new environment dependency, its corresponding template in `project-architecture/project-env/templates/<app>.env.md` must be updated immediately.
