# Networking & Ports Philosophy & The 5 Golden Rules

The Soul Monorepo operates a distributed constellation of micro-applications running simultaneously. To eliminate port conflicts, cross-service collisions, and socket leakages, networking is strictly partitioned and deterministically governed.

```
                    DETERMINISTIC PORT ALLOCATION MAP
 ┌────────────────────────────────────────┬────────────────────────────────────┐
 │      CLIENT PORT BLOCK (5173–5181)     │    SERVER PORT BLOCK (8000–8008)   │
 ├────────────────────────────────────────┼────────────────────────────────────┤
 │ 5173: apexmind-ai                      │ 8000: apexmind-ai (FastAPI)        │
 │ 5174: outpass-system                   │ 8001: outpass-system (FastAPI)     │
 │ 5175: free-api-hub                     │ 8002: free-api-hub (FastAPI)       │
 │ 5176: sonikoma                         │ 8006: sonikoma (FastAPI)           │
 │ 5177: spatial-dimensions               │ 8007: spatial-dimensions (FastAPI) │
 │ 5178: college-management-system        │ 8003: college-management-system    │
 │ 5179: globalpulse-ai                   │ 8004: globalpulse-ai (FastAPI)     │
 │ 5180: postcraft-ai                     │ 8005: postcraft-ai (Express)       │
 └────────────────────────────────────────┴────────────────────────────────────┘
```

---

## The 5 Golden Rules of Networking & Ports

### 1. Deterministic Port Block Partitioning
- Client applications are strictly confined to the port range **`5173` through `5181`**.
- Server backend processes are strictly confined to the port range **`8000` through `8008`**.
- No application may bind to arbitrary, random, or undocumented ports outside its assigned block.

### 2. Immutable Project Port Mapping
- Every project has an assigned, immutable client and server port pair declared in `04-networking-and-ports/port-allocation-matrix.md` and `metadata.json`.
- Developers must never alter project ports on a local whim. If port reconfiguration is required, it must be officially updated in the central matrix and `.env.example` templates.

### 3. Standard Reverse Proxy Contract (`/api`)
- Frontends must communicate with backends exclusively through Vite's built-in reverse proxy routing.
- The client requests `/api/...`, and Vite forwards the traffic internally to `http://127.0.0.1:<SERVER_PORT>`. This avoids browser CORS restrictions and matches production ingress topologies.

### 4. Zero Orphan Sockets & Automated Port Cleanup
- Processes must cleanly release TCP sockets upon receiving `SIGINT` or `SIGTERM`.
- The monorepo supervisor (`@workspace/runner`) automatically runs port verification and terminates orphaned zombie processes before starting services. Applications must support fast graceful shutdowns.

### 5. Safe Local Host Binding (`127.0.0.1`)
- In local development, all servers and dev proxies must bind explicitly to loopback `127.0.0.1` or `localhost`.
- Never bind dev servers to `0.0.0.0` (all network interfaces) unless running in an isolated container or explicit mobile test environment, preventing accidental network exposure on local Wi-Fi networks.
