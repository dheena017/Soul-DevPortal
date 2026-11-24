# Direct CLI Commands & Single-Template Reference

## Unified Single-Template Command Standard
All micro-applications implement the identical canonical lifecycle script names in their root `package.json` and follow a single, standardized direct CLI template.

### A. Canonical NPM Lifecycle Template

```bash
npm run dev           # Dual Supervisor: Starts both Client + Server with auto port-killing
npm run dev:client    # Client Dev: Launches Vite 8 dev server on assigned port
npm run dev:server    # Server Dev: Launches FastAPI/Uvicorn on assigned port
npm run build         # Production Build: Compiles client assets via Vite into dist/
npm run preview       # Preview Build: Serves production dist/ bundle locally
npm run typecheck     # Type Safety: Validates TypeScript compilation with zero emitted files
npm run test          # Verification: Executes project unit, offline, and endpoint tests
npm run clean         # Cleanup: Removes dist/ and temporary cache artifacts
```

### B. Single-Template Direct CLI Specification

- **Client Direct Template**: `npx vite <client-path> --port <PORT>`
- **Server Direct Template**: `python -m uvicorn <module>:app --port <PORT> --reload`
- **Build Direct Template**: `npx vite build <client-path>`
- **Typecheck Direct Template**: `npx tsc --noEmit`
- **Test / Verification Template**: `npm run test` or `pytest`

### C. Master Command Execution Table

| Project | Client Direct CLI Command | Server Direct CLI Command | Build Command | Typecheck Command | Test / Verification Command | Preview Command |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`apexmind-ai`** | `npx vite client --port 5173` | `python -m uvicorn server.app.factory:create_app --factory --port 8000 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`outpass-system`** | `npx vite frontend --port 5174` | `python -m uvicorn backend.main:app --port 8001 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`free-api-hub`** | `npx vite frontend --port 5175` | `python -m uvicorn backend.main:app --port 8002 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`sonikoma`** | `npx vite frontend --port 5176` | `python -m uvicorn backend.main:app --port 8006 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`spatial-dimensions`** | `npx vite . --port 5177` | `python -m uvicorn backend.main:app --port 8007 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`college-management`** | `npx vite . --port 5178` | `python -m uvicorn backend.main:app --port 8005 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`globalpulse-ai`** | `npx vite frontend --port 5179` | `python -m uvicorn backend.main:app --port 8003 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`postcraft-ai`** | `npx vite . --port 5180` | `python -m uvicorn backend.main:app --port 8004 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`devportal`** (Hub) | `npx vite . --port 5181` | `python backend/main.py --port 8008` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |

## Master Direct CLI Command Reference
| Project | Client Direct CLI Command | Server Direct CLI Command | Build Command | Typecheck Command | Test Command | Preview Command |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **`apexmind-ai`** | `npx vite client --port 5173` | `python -m uvicorn server.app.factory:create_app --factory --port 8000 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`outpass-system`** | `npx vite frontend --port 5174` | `python -m uvicorn backend.main:app --port 8001 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`free-api-hub`** | `npx vite frontend --port 5175` | `python -m uvicorn backend.main:app --port 8002 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`sonikoma`** | `npx vite frontend --port 5176` | `python -m uvicorn backend.main:app --port 8006 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`spatial-dimensions`** | `npx vite . --port 5177` | `python -m uvicorn backend.main:app --port 8007 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`college-management`** | `npx vite . --port 5178` | `python -m uvicorn backend.main:app --port 8005 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`globalpulse-ai`** | `npx vite frontend --port 5179` | `python -m uvicorn backend.main:app --port 8003 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`postcraft-ai`** | `npx vite . --port 5180` | `python -m uvicorn backend.main:app --port 8004 --reload` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
| **`devportal`** (Hub) | `npx vite . --port 5181` | `python backend/main.py --port 8008` | `npm run build` | `npm run typecheck` | `npm run test` | `npm run preview` |
