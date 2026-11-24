# Project Specification: `free-api-hub`

### 3. `free-api-hub`

- **Description**: Developer platform cataloging verified public APIs with built-in live endpoint testing and SSRF security sandbox.
- **Client**: Port `5175` | Vite, React 18, Lucide React
- **Server**: Port `8002` | Python, FastAPI, Uvicorn, JSON storage
- **Proxy**: `/api` requests proxied to `http://127.0.0.1:8002`
- **Run Command**:

  ```bash
  npm run dev:free-api-hub
  # Or inside project:
  npm run dev
  ```

- **Git Remote**: `https://github.com/dheena017/free-api-hub.git`

---
