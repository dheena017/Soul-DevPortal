# Project Specification: `outpass-system`

### 2. `outpass-system`

- **Description**: Digital campus student outpass, warden approval portal, and gate security scanner with QR verification.
- **Client**: Port `5174` | Vite, React 18, Tailwind CSS v3, Capacitor 8 (Android/iOS PWA)
- **Server**: Port `8001` | Python, FastAPI, SQLAlchemy, SQLite
- **Proxy**: `/api` requests proxied to `http://localhost:8001`
- **Run Command**:

  ```bash
  npm run dev:outpass
  # Or inside project:
  python run_dev.py
  ```

- **Git Remote**: `https://github.com/dheena017/outpass-system.git`

---
