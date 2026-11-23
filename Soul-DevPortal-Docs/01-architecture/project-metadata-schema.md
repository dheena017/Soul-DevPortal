# Project Metadata Schema (`metadata.json`)

## Specification & Validation Schema
Each application root must contain a `metadata.json` adhering to this schema:

```json
{
  "name": "Human-Readable Application Title",
  "description": "Clear 1-2 sentence description of what the application does.",
  "features": [
    "Feature capability bullet 1",
    "Feature capability bullet 2"
  ],
  "techStack": {
    "frontend": ["React", "TypeScript", "Vite", "Tailwind CSS"],
    "backend": ["Python", "FastAPI", "Uvicorn"],
    "database": ["SQLite"],
    "ai": ["Google Gemini 2.5 Flash"]
  },
  "commands": {
    "development": "npm run dev",
    "frontend": "npm run frontend",
    "backend": "npm run backend",
    "build": "npm run build",
    "lint": "npm run lint"
  },
  "localServices": {
    "frontend": "http://localhost:5173",
    "backend": "http://localhost:8000",
    "apiDocs": "http://localhost:8000/api/docs",
    "healthCheck": "http://localhost:8000/api/health"
  },
  "apiEndpoints": [
    "GET /api/health",
    "POST /api/generate"
  ],
  "configuration": [
    "PORT",
    "FRONTEND_PORT",
    "BACKEND_URL",
    "GEMINI_API_KEY"
  ]
}
```

---
