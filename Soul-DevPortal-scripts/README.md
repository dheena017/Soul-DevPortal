# Soul-DevPortal-scripts

Useful, standalone automation scripts for managing the Soul-DevPortal monorepo, SQLite WAL databases, packages, ports, caches, and AI environment configuration.

## Scripts

| Script | Purpose | Example |
| :--- | :--- | :--- |
| `check_env_health.py` | Check Python, Node, npm, FFmpeg, Git, CUDA/Torch & disk health | `python Soul-DevPortal-scripts/check_env_health.py` |
| `clean_workspace_caches.py` | Clean `__pycache__`, `.pytest_cache`, `.vite`, and `dist` (`--dry-run` / `--apply`) | `python Soul-DevPortal-scripts/clean_workspace_caches.py --dry-run` |
| `audit_sqlite_wal.py` | Audit `.db`/`.sqlite` files for WAL mode (`--enable-wal` to convert) | `python Soul-DevPortal-scripts/audit_sqlite_wal.py` |
| `sync_packages_catalog.py` | Audit all packages in `Soul-DevPortal-Packages/` for manifest & test parity | `python Soul-DevPortal-scripts/sync_packages_catalog.py` |
| `git_workspace_status.py` | Git branch & status summary across root and `Soul-DevPortal-Projects/*` | `python Soul-DevPortal-scripts/git_workspace_status.py` |
| `gen_env_template.py` | Generate `.env.example` covering Core, AI providers, and GitHub Packages | `python Soul-DevPortal-scripts/gen_env_template.py` |
| `kill_port_conflicts.py` | Inspect or free reserved ports (`5173-5181`, `8000-8008`) | `python Soul-DevPortal-scripts/kill_port_conflicts.py` |
| `publish_github_packages.py` | Stage & publish all packages to GitHub Packages (`@dheena017/*`) | `python Soul-DevPortal-scripts/publish_github_packages.py --dry-run` |
