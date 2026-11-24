# Project Schema Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: `metadata.json`, Pydantic models, Zod schemas, and TypeScript interfaces

---

## The 8 Inviolable Schema Rules

### 1. Authoritative `metadata.json` Parity
- **Rule**: Every project root in `Soul-DevPortal-Projects/<app>/` must contain a schema-compliant `metadata.json`.
- **Constraint**: The project `title`, `ports`, `techStack`, `commands`, and `apiEndpoints` in `metadata.json` must exactly match the implementation in `vite.config.ts`, `main.py`, and `projects.json`.

### 2. Strict Pydantic v2 Contract on Server
- **Rule**: Every FastAPI endpoint accepting an HTTP request payload or returning response data must declare a Pydantic v2 `BaseModel`.
- **Prohibition**: Generic dictionaries (`dict[str, Any]`), raw strings, or untyped tuples are strictly forbidden as route inputs or outputs.

### 3. Zod Schema Mirroring on Client
- **Rule**: Client-side forms, user inputs, and external API integrations must be validated using Zod schemas that mirror backend Pydantic models.
- **Rule**: Infer TypeScript types directly from Zod using `z.infer<typeof Schema>` to eliminate dual-definition drift.

### 4. Zero Implicit `any` Policy
- **Rule**: TypeScript files must be compiled under strict mode (`"strict": true` in `tsconfig.json`).
- **Prohibition**: Use of `any` is prohibited. If a type is dynamically structured, use `unknown` combined with type narrowing / Zod parsing.

### 5. Standardized Date & Time Representation
- **Rule**: All timestamps in schemas and database columns must use ISO-8601 UTC strings (`YYYY-MM-DDTHH:MM:SS.sssZ`).
- **Constraint**: In Pydantic, use `Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())`.

### 6. Unique Identifier Conventions
- **Rule**: Primary key IDs across schemas must use prefixed entity strings (e.g. `usr_12345`, `sess_67890`, `msg_abcde`) or standard UUIDv4 strings.

### 7. Non-Empty String Constraints
- **Rule**: String fields representing required entity attributes (e.g. `title`, `name`, `email`) must enforce `min_length=1` and `strip_whitespace=True` in Pydantic.

### 8. Schema Deprecation Protocol
- **Rule**: When changing schema fields, preserve backward compatibility. Mark deprecated fields with `deprecated: bool = True` or Pydantic `Field(..., deprecated=True)` before removal in a subsequent minor version.
