# Core Security Philosophy & The 5 Golden Rules

Environment variables decouple configuration from application source code, enabling applications to run across different environments (local development, testing, staging, and production) without code modifications.

```
                      SOUL MONOREPO CONFIGURATION ARCHITECTURE
 ┌────────────────────────────────────────────────────────────────────────────────────────┐
 │                                                                                        │
 │   DEVELOPMENT ENVIRONMENT (.env)                                                       │
 │   ├── Never committed to Git (.gitignore)                                              │
 │   ├── Grounded by a strictly documented .env.example                                   │
 │   └── Validated on startup via Pydantic (Python) or Zod (TypeScript)                   │
 │                                                                                        │
 └────────────────────────────┬─────────────────────────────┬─────────────────────────────┘
                              │                             │
                              ▼                             ▼
 ┌────────────────────────────────────────┐     ┌────────────────────────────────────────┐
 │      PUBLIC CLIENT RUNTIME (Vite)      │     │      PRIVATE SERVER RUNTIME (FastAPI)  │
 │  ├── Prefixed: VITE_* or NEXT_PUBLIC_* │     │  ├── Unprefixed sensitive credentials  │
 │  ├── Inlined into static bundle at build│    │  ├── Read dynamically from process.env │
 │  └── NEVER contain secrets or private  │     │  └── Masked automatically in logs via  │
 │      keys                              │     │      @workspace/logger                 │
 └────────────────────────────────────────┘     └────────────────────────────────────────┘
```

### The 5 Golden Rules of Environment Configuration

1. **Zero Secrets in Source Control**:
   - The file `.env` (and any variant like `.env.local`, `.env.production`) must **NEVER** be committed to Git.
   - Every project's `.gitignore` must explicitly ignore `.env*` while preserving `!.env.example`.
2. **Mandatory Canonical `.env.example`**:
   - Every project root must maintain an up-to-date, self-documenting `.env.example`.
   - Every variable consumed by the application must appear in `.env.example` with a helpful description, its required status, and safe development dummy/placeholder values.
3. **Strict Client vs. Server Scoping**:
   - Variables intended for the client bundle must be explicitly prefixed (`VITE_` for Vite SPAs, `NEXT_PUBLIC_` for Next.js).
   - Secret keys (`JWT_SECRET`, `GEMINI_API_KEY`, `DATABASE_URL`, client secrets) must **NEVER** carry a client prefix. Client prefixing bakes secrets into publicly accessible JavaScript bundles.
4. **Fail-Fast & Typed Validation**:
   - Applications must validate critical environment variables on startup.
   - Missing required keys in production must trigger an immediate fatal startup error with a clear message, rather than failing later during user runtime requests.
5. **Automatic Secret Masking in Logs**:
   - Sensitive values (bearer tokens, API keys, private passwords) must be sanitized and masked before printing to console or log aggregators, using `@workspace/logger`.

---
