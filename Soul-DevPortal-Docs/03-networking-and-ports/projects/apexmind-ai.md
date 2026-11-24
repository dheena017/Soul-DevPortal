# Project Specification: `apexmind-ai`

### 1. `apexmind-ai`

- **Description**: AI Creative Studio for automated video creation, scriptwriting, voiceover synthesis, and YouTube publishing.
- **Client**: Port `5173` | Vite 8, React 19, Tailwind CSS v4, Motion
- **Server**: Port `8000` | Python 3.11, FastAPI, Uvicorn
- **Proxy**: `/api` requests proxied to `http://127.0.0.1:8000`
- **Run Command**:

  ```bash
  npm run dev:apexmind
  # Or inside project:
  python script/frontend.py --with-backend
  ```

- **Git Remote**: `https://github.com/dheena017/apexmind-ai.git`

---
