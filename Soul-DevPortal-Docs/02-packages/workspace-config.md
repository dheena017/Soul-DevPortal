# `@workspace/config` Guide

## Overview & Capabilities
(`workspace-config`)

**Purpose:** Centralized polyglot configuration presets, design tokens, and canonical network port topology.

* **TypeScript (`tsconfig.json`)**:

  ```json
  {
    "extends": "@workspace/config/tsconfig/react.json",
    "include": ["src"]
  }
  ```

* **Tailwind CSS (`tailwind.config.js`)**:

  ```javascript
  import preset from '@workspace/config/tailwind/preset';

  export default {
    presets: [preset],
    content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  };
  ```

* **Port Audit & Conflict Scanner**:

  ```bash
  python Soul-DevPortal-Packages/config/external/run_ports.py
  python Soul-DevPortal-Packages/config/external/run_ports.py --kill-conflicts
  ```

---
