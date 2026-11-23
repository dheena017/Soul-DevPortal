# Project Specification: `globalpulse-ai`

### 7. `globalpulse-ai`

- **Description**: Real-time world news intelligence platform aggregating 25+ trusted wire feeds with AI bias analysis and audio summaries.
- **Client**: Port `5179` | Vite 8, React 19, Tailwind CSS v4
- **Server**: Port `8003` | Python 3.11, FastAPI, Uvicorn, aiosqlite
- **Inter-service**: Direct HTTP client to `http://localhost:8003/api/v1`
- **Run Command**:

  ```bash
  npm run dev:globalpulse
  # Or inside project:
  npm run dev
  ```

- **Git Remote**: `https://github.com/dheena017/globalpulse-ai.git`

---
