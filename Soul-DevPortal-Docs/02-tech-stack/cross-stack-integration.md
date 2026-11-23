# Cross-Stack Integration & Communication

The monorepo connects Python and TypeScript through decoupled, standard protocols:

```mermaid
sequenceDiagram
    autonumber
    participant Browser as 🌐 React Client (TypeScript)
    participant Vite as ⚡ Vite Dev Server (Node.js)
    participant API as 🐍 FastAPI Server (Python)
    participant Supervisor as 🚀 workspace_runner (Python)

    Supervisor->>Vite: Spawn client dev server
    Supervisor->>API: Spawn uvicorn server
    Browser->>API: Asynchronous HTTP REST Requests (JSON)
    API-->>Browser: Typed JSON Response payloads
    Browser->>API: Real-time duplex communication (WebSockets)
    Browser->>Vite: Client console logs (Vite Plugin middleware)
    Vite->>Supervisor: Forwarded telemetry events
```

1. **HTTP REST**: Clients consume typed JSON endpoints served by FastAPI.
2. **WebSockets**: Bi-directional real-time data streaming for live AI models and notifications.
3. **Dev Server Telemetry**: Client-side logs are captured via `@workspace/logger`'s Vite plugin and displayed cleanly in the terminal alongside server logs.

---
