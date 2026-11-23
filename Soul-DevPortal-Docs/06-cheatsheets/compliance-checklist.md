# Compliance Checklist & Standards Matrix

## Master Standards Matrix
| # | Standard | Category | Severity | Canonical Rule |
| :---: | :--- | :---: | :---: | :--- |
| **01** | **Package Scoping** | Packages | `MANDATORY` | npm packages use `@workspace/<name>`; Python modules use `workspace_<name>`. |
| **02** | **Dual Manifests** | Packages | `MANDATORY` | Shared libraries maintain synchronized `package.json` and `pyproject.toml`. |
| **03** | **Port Allocations** | Networking | `MANDATORY` | Client: `5173`–`5181`; Server: `8000`–`8008`. Zero overlapping ports allowed. |
| **04** | **Data Masking** | Security | `CRITICAL` | `@workspace/logger` must sanitize API keys, Bearer tokens, and passwords. |
| **05** | **Directory Naming** | Architecture | `MANDATORY` | Every project must use `client/` and `server/`. No legacy `frontend/` or `backend/`. |
| **06** | **Feature Slices** | Architecture | `STANDARD` | Co-locate domain logic inside `features/<name>/` slices across Client and Server. |
| **07** | **Database Pragmas** | Persistence | `STANDARD` | SQLite engines must enable WAL mode, enforce foreign keys, and keep DDL in `schema.sql`. |
| **08** | **Static Web Assets** | Assets | `STANDARD` | Place uncompiled web assets in `client/public/`. Reference via root `/` URLs; never JS import. |
| **09** | **Path Independence** | Reliability | `CRITICAL` | Always resolve filesystem paths dynamically via `Path(__file__).resolve()`. |
| **10** | **Runner Automation** | Tooling | `STANDARD` | Run and manage micro-apps through root `npm run dev:*` scripts with automated port-kill. |

---

## Developer Compliance Checklist
Before committing any code or submitting a PR, verify compliance:

- [ ] **`.gitignore` Verified**: Run `git status` to ensure `.env` is ignored and not tracked.
- [ ] **`.env.example` Updated**: Any newly introduced `os.environ.get("NEW_KEY")` or `import.meta.env.VITE_NEW_KEY` is documented in `.env.example`.
- [ ] **Prefix Verified**: Client variables use `VITE_` or `NEXT_PUBLIC_`; backend secrets do **NOT** use public prefixes.
- [ ] **Safe Fallbacks Configured**: Server starts gracefully in development even if non-critical external API keys (Pexels, Pixabay, YouTube) are unset.
- [ ] **No Hardcoded Secrets**: Scanned code for hardcoded tokens, API keys, or private passwords.
- [ ] **Port Standards Respected**: Backend binds to assigned port (`8000`–`8008`) and client binds to assigned port (`5173`–`5181`).
- [ ] **`metadata.json` Updated**: Required environment variables are registered in the project manifest's `configuration` array.
