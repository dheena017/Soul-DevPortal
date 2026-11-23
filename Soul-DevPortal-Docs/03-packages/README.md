# Shared Packages Architecture & Development

All shared functionality across the monorepo is housed in `Soul-DevPortal-Packages/` and consumed via npm workspaces and pip editable links.

## Documents in this Section
1. [The 5 Golden Rules of Shared Packages](golden-rules.md) — Strict 2-tier facades, snake_case internals, and verification.
2. [Strict 2-Tier Architecture](two-tier-architecture.md) — Separation of public API facades from internal implementations.
3. [Workspace Logger](workspace-logger.md) — Universal structured JSON logging with sensitive data masking.
4. [Workspace Runner](workspace-runner.md) — Subprocess management, health check polling, and process lifecycle supervision.
5. [Workspace Config](workspace-config.md) — Shared Tailwind CSS presets, design tokens, and shared TypeScript configurations.
6. [Package Authoring Guide](package-authoring-guide.md) — Complete walkthrough for authoring, registering, and exporting new packages.
7. [Package Verification](package-verification.md) — Test suites and triple-manifest verification standards.
