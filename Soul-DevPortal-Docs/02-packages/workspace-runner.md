# `@workspace/runner` Guide

## Overview & Capabilities
(`workspace-runner`)

**Purpose:** Micro-service discovery, dual-stack dependency auditing, active TCP healthchecking, and multi-process supervision with Windows Job Objects and Linux process groups.

* **Key Features**:
  * Cross-platform kernel sandboxing (`JOB_OBJECT_LIMIT_KILL_ON_JOB_CLOSE` on Windows; `os.setsid` on Linux).
  * Active TCP/HTTP healthcheck probing (detects backend readiness in sub-second intervals).
  * Interactive terminal hotkeys (`[r]` restart backend, `[f]` restart frontend, `[p]` process stats, `[c]` clear screen, `[q]` quit).
  * Cascading `.env` hierarchy parser (`.env` ➔ `.env.local`).

* **Execution**:

  ```bash
  # Fullstack dev runner with port conflict resolution
  python Soul-DevPortal-Packages/runner/external/run_dev.py --project apexmind-ai --kill-port --open

  # Standalone client or server runners
  python Soul-DevPortal-Packages/runner/external/run_client.py --project apexmind-ai --kill-port
  python Soul-DevPortal-Packages/runner/external/run_server.py --project apexmind-ai --kill-port
  ```

---
