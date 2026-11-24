# Port & Socket Cleanup Protocol

## Rule 3.3: Port Cleanup Protocol
Before binding to a port, launch scripts must probe for stale zombie processes and cleanly terminate them:

```bash
# Handled automatically by monorepo runner:
npx @workspace/runner project <project-id> --kill-port
```

---
