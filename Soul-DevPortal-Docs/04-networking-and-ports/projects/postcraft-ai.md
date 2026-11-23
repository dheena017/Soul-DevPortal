# Project Specification: `postcraft-ai`

### 8. `postcraft-ai`

- **Description**: AI social media post designer, carousel generator, and marketing copywriter with live preview and auto-restarting runner.
- **Client**: Port `5180` | Vite 8, React 19, Tailwind CSS v4
- **Server**: Port `8004` | Node.js Server, TypeScript, tsx, SQLite
- **Inter-service**: Vite proxy from `/api` to `http://127.0.0.1:8004`
- **Run Command**:

  ```bash
  npm run dev:postcraft
  # Or inside project:
  npm run dev
  ```

- **Git Remote**: `https://github.com/dheena017/postcraft-ai.git`

---
