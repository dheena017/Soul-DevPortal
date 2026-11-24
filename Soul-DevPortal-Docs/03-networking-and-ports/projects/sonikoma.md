# Project Specification: `sonikoma`

### 4. `sonikoma`

- **Description**: AI Webtoon & Comic translation, automated panel cropping, TTS dubbing, and video export engine.
- **Client**: Port `5176` | Vite, React 19, Tailwind CSS v4, Zustand
- **Server**: Port `8006` | Python, FastAPI, Gemini Vision API, Supabase / SQLite
- **Proxy**: `/api` requests proxied to `http://127.0.0.1:8006`
- **Run Command**:

  ```bash
  npm run dev:sonikoma
  # Or inside project:
  npm run dev:all
  ```

- **Git Remote**: `https://github.com/dheena017/Sonikoma.git`

---
