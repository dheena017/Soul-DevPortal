# Project Features Architecture — Rules & Constraints

> **Status**: `MANDATORY INVARIANT`  
> **Applies To**: Feature-Sliced Design (FSD) implementation across Client and Server

---

## The 8 Inviolable Feature-Slice Rules

### 1. Strict Feature Domain Co-location
- **Rule**: All UI components, custom hooks, API calls, state stores, and TypeScript types specific to a single business capability must be grouped together under:
  `client/src/features/<feature-name>/` (Frontend)
  `server/features/<feature-name>/` (Backend)
- **Prohibition**: Creating horizontal catch-all directories (e.g. `src/hooks/useChat.ts`, `src/components/ChatCard.tsx`) is strictly forbidden.

### 2. The Public Facade Barrier (`index.ts`)
- **Rule**: Every client feature slice must expose a single `index.ts` entry point that exports only its approved public interface.
- **Rule**: Outside modules (such as `src/app/`) may **only** import from `@/features/<feature-name>` (or `@/features/<feature-name>/index`), never from internal private files (e.g. `@/features/<feature-name>/components/PrivateItem`).

### 3. Absolute Prohibition of Lateral Dependencies
- **Rule**: Feature A may never directly import private files or state from Feature B.
- **Remediation**: If logic or UI must be shared between two features, extract the common capability to `src/shared/` or pass data through the application shell / URL query parameters.

### 4. Single-Responsibility Subdirectories
- **Rule**: Each client feature folder must adhere to standard subdirectories:
  - `api/`: API fetchers and mutations.
  - `components/`: UI components belonging to the feature.
  - `hooks/`: Custom React 19 hooks.
  - `types.ts`: TypeScript interfaces and schemas.
  - `index.ts`: The public export barrier.

### 5. Server Router-Service Separation
- **Rule**: Server features (`server/features/<feature-name>/`) must strictly separate routing from business logic:
  - `router.py`: Declares HTTP routes, status codes, and input validation.
  - `service.py`: Executes business algorithms, external API calls, and domain rules.
  - `schemas.py`: Pydantic input and output models.
- **Prohibition**: Writing database queries or external API logic directly inside route handlers in `router.py` is forbidden.

### 6. Local State Containment
- **Rule**: State required only by a feature must remain local to that feature slice (via React `useState`, `useReducer`, or feature-scoped context).
- **Constraint**: Global state is reserved strictly for cross-cutting session, authentication, and theme primitives.

### 7. Feature Documentation Parity
- **Rule**: Every feature directory must include a `README.md` documenting its capabilities, required API endpoints, and exported components.

### 8. Self-Contained Mocking & Testing
- **Rule**: Any mock data, test fixtures, or unit tests for a feature must live directly within that feature's directory (e.g. `features/<feature>/__tests__/`).
