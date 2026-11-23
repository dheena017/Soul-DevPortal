# Backend API & Routing Standards

1. **Prefix All API Routes with `/api/`**: Never expose root endpoints like `/users`; always use `/api/users`.
2. **Mandatory Healthcheck Endpoint**: Every backend must serve a JSON health status at `GET /api/health`:

```json
{
  "status": "healthy",
  "app": "apexmind-ai",
  "timestamp": "2026-11-21T15:00:00Z",
  "uptime": 1420
}
```

3. **Vite Proxy Configuration**: The frontend must forward `/api` requests to the local backend port:

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8000',
        changeOrigin: true,
      },
    },
  },
});
```

---
