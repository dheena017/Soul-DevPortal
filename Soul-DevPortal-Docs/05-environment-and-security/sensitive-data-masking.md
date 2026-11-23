# Sensitive Data Masking Standard

Log outputs must never leak credentials into build logs or terminal recordings. The `@workspace/logger` package automatically intercepts and masks the following tokens:

```python
# Automatic Masking Rules in @workspace/logger:
PATTERNS_TO_SANITIZE = [
    (r"Bearer\s+[A-Za-z0-9_\-\.]{20,}", "Bearer [MASKED]"),
    (r"AIzaSy[A-Za-z0-9_\-]{33}", "AIzaSy[MASKED]"),
    (r"sk-[A-Za-z0-9]{32,}", "sk-[MASKED]"),
    (r"password=([^\s&]+)", "password=[MASKED]"),
    (r"client_secret=([^\s&]+)", "client_secret=[MASKED]"),
]
```

### Logging Best Practice:
```python
# GOOD: Contextual logging with structured fields
logger.info("AUTH", "User authenticated successfully", user_id=user.id)

# BAD: Logging raw tokens or authorization headers
logger.info("AUTH", f"Received token: {auth_header}")  # NEVER DO THIS
```

---
