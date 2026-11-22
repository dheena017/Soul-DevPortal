# Soul Monorepo — Project Rules & Architecture Standards

> **Workspace Global Specification**  
> Complete rulebook governing all 8 micro-applications in `Soul-DevPortal-Projects/`.

---

## Quick Navigation

* **Full Golden Rulebook**: [Soul-DevPortal-Docs/PROJECTS_RULES_AND_STANDARDS_GUIDE.md](file:///c:/Users/dheen/Soul-DevPortal/Soul-DevPortal-Docs/PROJECTS_RULES_AND_STANDARDS_GUIDE.md)
* **Compliance Cheatsheet**: [Soul-DevPortal-Docs/MONOREPO_COMPLIANCE_CHEATSHEET.md](file:///c:/Users/dheen/Soul-DevPortal/Soul-DevPortal-Docs/MONOREPO_COMPLIANCE_CHEATSHEET.md)
* **Port Matrix**: [Soul-DevPortal-Docs/PROJECTS_PORT_AND_FRAMEWORK_GUIDE.md](file:///c:/Users/dheen/Soul-DevPortal/Soul-DevPortal-Docs/PROJECTS_PORT_AND_FRAMEWORK_GUIDE.md)
* **Tech Stack**: [Soul-DevPortal-Docs/TECH_STACK.md](file:///c:/Users/dheen/Soul-DevPortal/Soul-DevPortal-Docs/TECH_STACK.md)
* **Packages Blueprint**: [Soul-DevPortal-Docs/PACKAGES_DESIGN_GUIDE.md](file:///c:/Users/dheen/Soul-DevPortal/Soul-DevPortal-Docs/PACKAGES_DESIGN_GUIDE.md)

---

## Core Monorepo Standards at a Glance

1. **Client & Server Separation**: Every project must have `client/` and `server/` root folders. Legacy `frontend/` or `backend/` names are strictly prohibited.
2. **Strict Port Allocation**:
   * **Client Services**: `5173` – `5181`
   * **Server APIs**: `8000` – `8008`
3. **Feature Slice Architecture**: Co-locate domain logic inside `features/<name>/` across both client and server.
4. **Database Persistence**: SQLite engines must enforce Write-Ahead Logging (`PRAGMA journal_mode = WAL;`) and maintain DDL schemas in `schema.sql`.
5. **Shared Packages Consumption**: All projects must consume `@workspace/logger`, `@workspace/config`, and `@workspace/runner`.
6. **Path Independence**: Resolve all filesystem paths dynamically relative to module files via `Path(__file__).resolve()`.
7. **Security**: Never commit secrets. Provide `.env.example` with descriptive placeholders.
8. **Automated Port Killing**: Runner scripts must probe and clean up stale processes before binding.
