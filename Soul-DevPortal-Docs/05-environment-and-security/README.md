# Environment Variables & Security Standards

This section governs environment variable hygiene, scoping prefixes, encryption secrets, PII masking, and validation schemas.

## Documents in this Section
1. [The 5 Golden Rules](golden-rules.md) — Fundamental security principles and anti-patterns.
2. [Universal .env Baseline](universal-env-baseline.md) — The zero-duplicate baseline template for every project.
3. [Variable Naming Standards](variable-naming-standards.md) — Prefixing matrix (`VITE_`, `SERVER_`, `DB_`, `AI_`) and categorized keys.
4. [Sensitive Data Masking](sensitive-data-masking.md) — PII masking protocol with `@workspace/logger`.
5. [Environment Validation Patterns](env-validation-patterns.md) — Pydantic & Zod schema validation implementations.

## Per-Project `.env.example` Templates (`templates/`)
- [apexmind-ai.env.md](templates/apexmind-ai.env.md)
- [outpass-system.env.md](templates/outpass-system.env.md)
- [free-api-hub.env.md](templates/free-api-hub.env.md)
- [sonikoma.env.md](templates/sonikoma.env.md)
- [spatial-dimensions.env.md](templates/spatial-dimensions.env.md)
- [college-management-system.env.md](templates/college-management-system.env.md)
- [globalpulse-ai.env.md](templates/globalpulse-ai.env.md)
- [postcraft-ai.env.md](templates/postcraft-ai.env.md)
