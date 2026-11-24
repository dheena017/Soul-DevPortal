# `@workspace/logger` Guide

## Overview & Capabilities
(`workspace-logger`)

**Purpose:** 5-column ANSI server logging, browser console bridge, Starlette/FastAPI request middleware, and AI/database telemetry.

* **TypeScript / Browser**:

  ```typescript
  import { consoleLogger } from '@workspace/logger';

  consoleLogger.info('AUTH', 'User session restored');
  consoleLogger.action('STUDIO', 'Video generation started');
  ```

* **Vite HMR Terminal Bridge**:

  ```typescript
  import { workspaceLoggerPlugin } from '@workspace/logger/vite';

  export default {
    plugins: [workspaceLoggerPlugin()],
  };
  ```

* **Python Server Logging**:

  ```python
  from fastapi import FastAPI
  from external.middleware import init_app_logger

  app = FastAPI()
  init_app_logger(app, title="ORDER SERVICE", port=8005)
  ```

---
