# Monorepo Scripts & Command Matrix

### Root Workspace Commands

| Command | Action | Scope / Runtime |
| :--- | :--- | :--- |
| `npm run dev` | Starts the DevPortal interactive UI | DevPortal Frontend (:5181) |
| `npm run dev:portal:server` | Starts the DevPortal FastAPI metadata extraction server | DevPortal Backend (:8008) |
| `npm run dev:all` | Concurrently boots all 8 applications (clients + servers) | Workspace Supervisor |
| `npm run dev:client` | Starts all client dev servers concurrently | Client Ecosystem (:5173-:5181) |
| `npm run dev:server` | Starts all backend API servers concurrently | Server Ecosystem (:8000-:8008) |
| `npm run build` | Builds the DevPortal production bundle | Production Bundler (Vite) |
| `npm run extract` | Runs schema extraction & AST parsing across all 8 apps | Metadata Engine |
| `npm run typecheck` | Validates TypeScript types across portal & packages | Static Analysis |

### Direct Project Launchers (Root Shortcuts)

| Command | Target Application | Client Port | Server Port |
| :--- | :--- | :---: | :---: |
| `npm run dev:apexmind` | ApexMind Studio AI | `:5173` | `:8000` |
| `npm run dev:outpass` | Outpass Management System | `:5174` | `:8001` |
| `npm run dev:free-api` | Free API Hub | `:5175` | `:8002` |
| `npm run dev:sonikoma` | Sonikoma AI Studio | `:5176` | `:8006` |
| `npm run dev:spatial` | Spatial Dimensions 3D | `:5177` | `:8007` |
| `npm run dev:college` | College Management System | `:5178` | `:8005` |
| `npm run dev:globalpulse` | GlobalPulse AI | `:5179` | `:8003` |
| `npm run dev:postcraft` | PostCraft AI | `:5180` | `:8004` |

### Unified Child Project Standard (Every `package.json`)

Every micro-application implements the exact same canonical lifecycle commands:

| Command | Purpose | Target Port / Environment |
| :--- | :--- | :--- |
| `npm run dev` | Runs dual-stack supervisor (client + server concurrently) | Dual-Stack Supervisor (`--kill-port`) |
| `npm run dev:client` | Starts client development server on designated port | Assigned Port (:5173-:5181) |
| `npm run dev:server` | Starts API development server on designated port | Assigned Port (:8000-:8008) |
| `npm run build` | Compiles client assets for production | Production Bundler (Vite 8) |
| `npm run preview` | Previews production dist/ build locally | Vite Preview (:5173-:5181) |
| `npm run typecheck` | Runs strict static type check verification | TypeScript (`tsc --noEmit`) |
| `npm run test` | Executes unit, endpoint, and offline verification | Test Suite (`pytest` / `node --test`) |
| `npm run clean` | Removes build artifacts (`dist/`, cache, temporary files) | Filesystem Cleanup |

---
