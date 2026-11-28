export type PortalHubTab =
  | 'github'
  | 'leetcode'
  | 'gcloud'
  | 'ai'
  | 'devops'
  | 'docsref'
  | 'design'
  | 'apidb'
  | 'security'
  | 'containers'
  | 'learning'
  | 'media3d'
  | 'cli'
  | 'monitoring'
  | 'pkgmgrs';

export const GITHUB_REPO_URL = 'https://github.com/dheena017/Soul-DevPortal';
export const PACKAGES_REPO_URL = 'https://github.com/dheena017/Soul-DevPortal-Packages';

export interface PortalResourceItem {
  id: string;
  title: string;
  badge: string;
  description: string;
  url: string;
  command?: string;
  commandLabel?: string;
}

export const GITHUB_RESOURCES: PortalResourceItem[] = [
  {
    id: 'gh-portal-repo',
    title: 'dheena017/Soul-DevPortal',
    badge: 'Monorepo',
    description: 'Main Developer Portal UI (React 19 + Vite 8), FastAPI backend (:8008), Electron desktop app, and docs.',
    url: GITHUB_REPO_URL,
    command: `git clone ${GITHUB_REPO_URL}.git`,
    commandLabel: 'Clone Portal',
  },
  {
    id: 'gh-packages-repo',
    title: 'dheena017/Soul-DevPortal-Packages',
    badge: '78 Packages',
    description: 'Standalone polyglot package repository with Preview/run_<pkg>.py interactive & demo runners.',
    url: PACKAGES_REPO_URL,
    command: `git clone ${PACKAGES_REPO_URL}.git`,
    commandLabel: 'Clone Packages',
  },
  {
    id: 'gh-packages-registry',
    title: 'GitHub Packages (npm)',
    badge: 'Registry',
    description: 'Private @dheena017/* npm packages published from Soul-DevPortal-Packages for cross-project installs.',
    url: 'https://github.com/dheena017?tab=packages',
    command: 'npm install @dheena017/media-qc --registry=https://npm.pkg.github.com',
    commandLabel: 'Install Sample',
  },
  {
    id: 'gh-actions',
    title: 'GitHub Actions Workflows',
    badge: 'CI / CD',
    description: 'Automated workflows for publishing GitHub Packages (publish-packages.yml) and desktop releases.',
    url: `${GITHUB_REPO_URL}/actions`,
    command: 'npm run pkg:publish:dry',
    commandLabel: 'Dry-Run Publish',
  },
  {
    id: 'gh-releases',
    title: 'Releases & Desktop Builds',
    badge: 'Artifacts',
    description: 'Versioned tags, changelog notes, and Electron Windows installer artifacts.',
    url: `${GITHUB_REPO_URL}/releases`,
  },
  {
    id: 'gh-profile',
    title: 'GitHub Profile & Repositories',
    badge: 'Account',
    description: 'All public and private repositories, stars, and project boards under dheena017.',
    url: 'https://github.com/dheena017?tab=repositories',
  },
];

export const LEETCODE_RESOURCES: PortalResourceItem[] = [
  {
    id: 'lc-problemset',
    title: 'LeetCode Problemset',
    badge: 'Practice',
    description: 'Algorithm & data structure problems filtered by topic, difficulty, and company tags.',
    url: 'https://leetcode.com/problemset/',
  },
  {
    id: 'lc-study-plan',
    title: 'LeetCode 75 & Top Interview 150',
    badge: 'Study Plan',
    description: 'Curated tracks covering arrays, sliding window, two pointers, trees, graphs, and DP.',
    url: 'https://leetcode.com/studyplan/',
  },
  {
    id: 'lc-contests',
    title: 'Weekly & Biweekly Contests',
    badge: 'Contests',
    description: 'Timed competitive programming rounds and rating history tracking.',
    url: 'https://leetcode.com/contest/',
  },
  {
    id: 'lc-neetcode',
    title: 'NeetCode 150 Roadmap',
    badge: 'Roadmap',
    description: 'Visual dependency tree of core DSA patterns with video walkthroughs and Python/TS solutions.',
    url: 'https://neetcode.io/roadmap',
  },
  {
    id: 'lc-sql50',
    title: 'SQL 50 Study Plan',
    badge: 'SQL',
    description: 'Joins, window functions, CTEs, and query optimization exercises for backend interviews.',
    url: 'https://leetcode.com/studyplan/top-sql-50/',
  },
  {
    id: 'lc-bigocheat',
    title: 'Big-O Complexity Cheat Sheet',
    badge: 'Reference',
    description: 'Time and space complexity reference for sorting, trees, heaps, hash tables, and graphs.',
    url: 'https://www.bigocheatsheet.com/',
  },
];

export const GCLOUD_RESOURCES: PortalResourceItem[] = [
  {
    id: 'gcp-console',
    title: 'Google Cloud Console',
    badge: 'Console',
    description: 'Manage GCP projects, IAM permissions, billing, quotas, and active cloud resources.',
    url: 'https://console.cloud.google.com/',
    command: 'gcloud config list',
    commandLabel: 'Check Config',
  },
  {
    id: 'gcp-cloud-run',
    title: 'Cloud Run Services',
    badge: 'Compute',
    description: 'Serverless containers for FastAPI backends, workers, and preview deployments.',
    url: 'https://console.cloud.google.com/run',
    command: 'gcloud run services list',
    commandLabel: 'List Services',
  },
  {
    id: 'gcp-bigquery',
    title: 'BigQuery Studio',
    badge: 'Analytics',
    description: 'SQL analytics, dataset exploration, ML models, and telemetry querying.',
    url: 'https://console.cloud.google.com/bigquery',
    command: 'bq ls',
    commandLabel: 'List Datasets',
  },
  {
    id: 'gcp-gcs',
    title: 'Cloud Storage (GCS)',
    badge: 'Storage',
    description: 'Buckets for media assets, render outputs, backups, and dataset artifacts.',
    url: 'https://console.cloud.google.com/storage/browser',
    command: 'gcloud storage buckets list',
    commandLabel: 'List Buckets',
  },
  {
    id: 'gcp-vertex',
    title: 'Vertex AI Studio',
    badge: 'AI / ML',
    description: 'Enterprise Gemini endpoints, model garden, evaluations, and batch predictions.',
    url: 'https://console.cloud.google.com/vertex-ai',
  },
  {
    id: 'gcp-iam',
    title: 'IAM, APIs & Credentials',
    badge: 'Security',
    description: 'Service accounts, OAuth clients, API keys, and ADC credential management.',
    url: 'https://console.cloud.google.com/apis/credentials',
    command: 'gcloud auth application-default login',
    commandLabel: 'ADC Login',
  },
];

export const AI_CONSOLE_RESOURCES: PortalResourceItem[] = [
  {
    id: 'ai-google-studio',
    title: 'Google AI Studio',
    badge: 'Gemini API',
    description: 'Test Gemini 2.5/3.x prompts, generate API keys, and inspect structured JSON outputs.',
    url: 'https://aistudio.google.com/',
  },
  {
    id: 'ai-openai',
    title: 'OpenAI Platform',
    badge: 'API Console',
    description: 'API usage, batch jobs, evals, and model rate limits for @workspace/ai-agents.',
    url: 'https://platform.openai.com/',
  },
  {
    id: 'ai-anthropic',
    title: 'Anthropic Console',
    badge: 'Claude API',
    description: 'Prompt workbench, API keys, and token metering for Claude models.',
    url: 'https://console.anthropic.com/',
  },
  {
    id: 'ai-huggingface',
    title: 'Hugging Face Hub',
    badge: 'Open Weights',
    description: 'Open-weight models, datasets, and WebGPU/ONNX weights for @workspace/ai-local.',
    url: 'https://huggingface.co/models',
  },
  {
    id: 'ai-fal',
    title: 'fal.ai Dashboard',
    badge: 'Video / Image',
    description: 'Serverless inference endpoints for Veo, Kling, FLUX, and Wan routed via @workspace/ai-router.',
    url: 'https://fal.ai/dashboard',
  },
  {
    id: 'ai-ollama',
    title: 'Ollama Model Library',
    badge: 'Local LLM',
    description: 'Local LLM catalog and quantization tags for offline studio development.',
    url: 'https://ollama.com/library',
    command: 'ollama list',
    commandLabel: 'List Local',
  },
];

export const DEVOPS_RESOURCES: PortalResourceItem[] = [
  {
    id: 'dev-vercel',
    title: 'Vercel Dashboard',
    badge: 'Frontend Host',
    description: 'Preview deployments, edge logs, and environment variables for Vite/React apps.',
    url: 'https://vercel.com/dashboard',
  },
  {
    id: 'dev-netlify',
    title: 'Netlify App',
    badge: 'Hosting & Edge',
    description: 'Static & serverless deployments, Netlify Functions, and form/database integrations.',
    url: 'https://app.netlify.com/',
  },
  {
    id: 'dev-cloudflare',
    title: 'Cloudflare Dashboard',
    badge: 'DNS & Workers',
    description: 'DNS, R2 object storage, Workers, and Zero Trust tunnels.',
    url: 'https://dash.cloudflare.com/',
  },
  {
    id: 'dev-npm',
    title: 'npm Registry',
    badge: 'JS Packages',
    description: 'Public npm package search, version history, and security advisories.',
    url: 'https://www.npmjs.com/',
  },
  {
    id: 'dev-pypi',
    title: 'PyPI Registry',
    badge: 'Python Packages',
    description: 'Python wheel distributions, FastAPI/Pydantic release notes, and classifiers.',
    url: 'https://pypi.org/',
  },
  {
    id: 'dev-local-swagger',
    title: 'Local Portal Swagger (:8008)',
    badge: 'OpenAPI',
    description: 'Interactive FastAPI OpenAPI docs for the local Soul DevPortal backend.',
    url: 'http://127.0.0.1:8008/docs',
    command: 'npm run dev',
    commandLabel: 'Start Portal',
  },
];

export const DOCS_REF_RESOURCES: PortalResourceItem[] = [
  {
    id: 'doc-mdn',
    title: 'MDN Web Docs',
    badge: 'Web APIs',
    description: 'Authoritative reference for HTML, CSS, DOM, Fetch, WebSockets, and WebAssembly.',
    url: 'https://developer.mozilla.org/',
  },
  {
    id: 'doc-react',
    title: 'React 19 Documentation',
    badge: 'Frontend',
    description: 'Hooks, Server/Client patterns, concurrent rendering, and strict TypeScript types.',
    url: 'https://react.dev/reference/react',
  },
  {
    id: 'doc-tailwind',
    title: 'Tailwind CSS v4 Docs',
    badge: 'Styling',
    description: '@theme tokens, utility classes, responsive breakpoints, and dark mode styling.',
    url: 'https://tailwindcss.com/docs',
  },
  {
    id: 'doc-ts',
    title: 'TypeScript Handbook',
    badge: 'Types',
    description: 'Generics, utility types, narrowing, and tsconfig compiler options.',
    url: 'https://www.typescriptlang.org/docs/handbook/intro.html',
  },
  {
    id: 'doc-fastapi',
    title: 'FastAPI Documentation',
    badge: 'Backend',
    description: 'APIRouter, Pydantic v2 validation, dependency injection, and SSE/WebSocket endpoints.',
    url: 'https://fastapi.tiangolo.com/',
  },
  {
    id: 'doc-python',
    title: 'Python 3 Standard Library',
    badge: 'Python',
    description: 'sqlite3, asyncio, pathlib, subprocess, typing, and argparse reference.',
    url: 'https://docs.python.org/3/library/index.html',
  },
];

export const DESIGN_UI_RESOURCES: PortalResourceItem[] = [
  {
    id: 'des-figma',
    title: 'Figma Workspace',
    badge: 'Design',
    description: 'UI mockups, design systems, component variants, and design-to-code handoff.',
    url: 'https://www.figma.com/',
  },
  {
    id: 'des-lucide',
    title: 'Lucide Icons',
    badge: 'Icons',
    description: 'Crisp SVG icon set used across React 19 UI components.',
    url: 'https://lucide.dev/icons/',
  },
  {
    id: 'des-excalidraw',
    title: 'Excalidraw',
    badge: 'Diagrams',
    description: 'Hand-drawn architecture diagrams, system flows, and quick wireframes.',
    url: 'https://excalidraw.com/',
  },
  {
    id: 'des-contrast',
    title: 'WebAIM Contrast Checker',
    badge: 'A11y',
    description: 'Verify WCAG AA/AAA foreground-background contrast ratios alongside @workspace/a11y-audit.',
    url: 'https://webaim.org/resources/contrastchecker/',
    command: 'python a11y-audit/Preview/run_a11y_audit.py --demo',
    commandLabel: 'Run A11y',
  },
  {
    id: 'des-svgomg',
    title: 'SVGOMG Optimizer',
    badge: 'SVG',
    description: 'Clean and minify SVG assets and logos before bundling.',
    url: 'https://jakearchibald.github.io/svgomg/',
  },
  {
    id: 'des-coolors',
    title: 'Coolors Palette Studio',
    badge: 'Colors',
    description: 'Generate and export harmonious color palettes for Tailwind @theme tokens.',
    url: 'https://coolors.co/',
  },
];

export const API_DB_RESOURCES: PortalResourceItem[] = [
  {
    id: 'api-hoppscotch',
    title: 'Hoppscotch API Client',
    badge: 'REST / SSE',
    description: 'Lightweight browser client for testing REST, GraphQL, WebSocket, and SSE streams.',
    url: 'https://hoppscotch.io/',
  },
  {
    id: 'api-postman',
    title: 'Postman Web',
    badge: 'Collections',
    description: 'API collections, environment variables, and automated endpoint test suites.',
    url: 'https://web.postman.co/',
  },
  {
    id: 'api-regex101',
    title: 'Regex101 Tester',
    badge: 'Regex',
    description: 'Interactive Python & JavaScript regular expression debugger and explainer.',
    url: 'https://regex101.com/',
  },
  {
    id: 'api-jwt',
    title: 'JWT.io Debugger',
    badge: 'Auth',
    description: 'Decode, inspect, and verify JSON Web Tokens for @workspace/auth-rbac.',
    url: 'https://jwt.io/',
  },
  {
    id: 'api-sqlite',
    title: 'SQLite WAL Docs',
    badge: 'Database',
    description: 'Write-Ahead Logging, concurrency, and pragma tuning for workspace SQLite databases.',
    url: 'https://www.sqlite.org/wal.html',
    command: 'npm run scripts:wal',
    commandLabel: 'Audit WAL',
  },
  {
    id: 'api-json',
    title: 'JSON Crack Visualizer',
    badge: 'JSON',
    description: 'Visualize complex JSON schemas, manifests, and API payloads as interactive graphs.',
    url: 'https://jsoncrack.com/editor',
  },
];

export const SECURITY_QA_RESOURCES: PortalResourceItem[] = [
  {
    id: 'sec-playwright',
    title: 'Playwright Test Docs',
    badge: 'E2E',
    description: 'End-to-end browser testing, trace viewer, and accessibility assertions.',
    url: 'https://playwright.dev/docs/intro',
  },
  {
    id: 'sec-pytest',
    title: 'Pytest Documentation',
    badge: 'Python QA',
    description: 'Fixtures, parametrization, and isolated unit testing across all 78 packages.',
    url: 'https://docs.pytest.org/',
    command: 'npm run pkg:test:all',
    commandLabel: 'Test All',
  },
  {
    id: 'sec-owasp',
    title: 'OWASP Cheat Sheet Series',
    badge: 'Security',
    description: 'Auth, input validation, XSS/CSRF prevention, and secrets management best practices.',
    url: 'https://cheatsheetseries.owasp.org/',
  },
  {
    id: 'sec-pagespeed',
    title: 'PageSpeed Insights',
    badge: 'Core Web Vitals',
    description: 'Measure LCP, CLS, INP, and bundle performance for production web apps.',
    url: 'https://pagespeed.web.dev/',
  },
  {
    id: 'sec-gh-advisories',
    title: 'GitHub Advisory Database',
    badge: 'CVE',
    description: 'Check npm and PyPI dependency vulnerabilities and security patches.',
    url: 'https://github.com/advisories',
    command: 'npm audit',
    commandLabel: 'NPM Audit',
  },
  {
    id: 'sec-health',
    title: 'Workspace Health & Ports',
    badge: 'Local QA',
    description: 'Run environment health checks and port conflict scans across the workspace.',
    url: 'http://127.0.0.1:8008/api/health',
    command: 'npm run scripts:health',
    commandLabel: 'Check Health',
  },
];

export const CONTAINERS_RESOURCES: PortalResourceItem[] = [
  {
    id: 'cnt-dockerhub',
    title: 'Docker Hub',
    badge: 'Images',
    description: 'Official Python, Node.js, Nginx, Postgres, and Redis base container images.',
    url: 'https://hub.docker.com/',
    command: 'docker ps -a',
    commandLabel: 'List Containers',
  },
  {
    id: 'cnt-docker-docs',
    title: 'Docker & Compose Docs',
    badge: 'Containers',
    description: 'Multi-stage Dockerfiles, BuildKit caching, volumes, and docker-compose.yml specs.',
    url: 'https://docs.docker.com/compose/',
    command: 'docker compose up -d',
    commandLabel: 'Compose Up',
  },
  {
    id: 'cnt-k8s',
    title: 'Kubernetes Documentation',
    badge: 'Orchestration',
    description: 'Pods, Deployments, Services, Ingress, and autoscaling manifests.',
    url: 'https://kubernetes.io/docs/home/',
    command: 'kubectl get pods -A',
    commandLabel: 'List Pods',
  },
  {
    id: 'cnt-gh-ghcr',
    title: 'GitHub Container Registry',
    badge: 'GHCR',
    description: 'Push and pull private Docker images under ghcr.io/dheena017.',
    url: 'https://github.com/dheena017?tab=packages',
  },
  {
    id: 'cnt-railway',
    title: 'Railway App',
    badge: 'PaaS',
    description: 'Instant container, Postgres, and background worker deployments.',
    url: 'https://railway.app/dashboard',
  },
  {
    id: 'cnt-render',
    title: 'Render Dashboard',
    badge: 'Cloud',
    description: 'Managed Python FastAPI web services, cron jobs, and static sites.',
    url: 'https://dashboard.render.com/',
  },
];

export const LEARNING_RESOURCES: PortalResourceItem[] = [
  {
    id: 'lrn-roadmap',
    title: 'developer-roadmap (roadmap.sh)',
    badge: 'Roadmaps',
    description: 'Interactive skill trees for Frontend, Backend, Full Stack, AI/ML, and DevOps.',
    url: 'https://roadmap.sh/',
  },
  {
    id: 'lrn-sysdesign',
    title: 'System Design Primer',
    badge: 'Architecture',
    description: 'Scalability, caching, load balancing, sharding, queues, and distributed patterns.',
    url: 'https://github.com/donnemartin/system-design-primer',
  },
  {
    id: 'lrn-patterns',
    title: 'Refactoring Guru',
    badge: 'Patterns',
    description: 'Clean visual guides to GoF design patterns and code refactoring techniques.',
    url: 'https://refactoring.guru/design-patterns',
  },
  {
    id: 'lrn-aoc',
    title: 'Advent of Code',
    badge: 'Puzzles',
    description: 'Daily algorithmic coding puzzles for sharpening Python and TypeScript speed.',
    url: 'https://adventofcode.com/',
  },
  {
    id: 'lrn-awesome',
    title: 'Awesome Lists Index',
    badge: 'Curated',
    description: 'Community-curated libraries, tools, and frameworks across every language.',
    url: 'https://github.com/sindresorhus/awesome',
  },
  {
    id: 'lrn-bytebytego',
    title: 'ByteByteGo System Design',
    badge: 'Visuals',
    description: 'High-level distributed systems diagrams, API gateways, and database internals.',
    url: 'https://bytebytego.com/',
  },
];

export const MEDIA_3D_RESOURCES: PortalResourceItem[] = [
  {
    id: 'm3d-threejs',
    title: 'Three.js Documentation',
    badge: '3D WebGL',
    description: 'Scenes, cameras, PBR materials, shaders, and GLTF loaders for @workspace/scene-3d.',
    url: 'https://threejs.org/docs/',
  },
  {
    id: 'm3d-r3f',
    title: 'React Three Fiber',
    badge: 'React 3D',
    description: 'Declarative React 19 renderer for Three.js used across 3D studio packages.',
    url: 'https://r3f.docs.pmnd.rs/',
  },
  {
    id: 'm3d-ffmpeg',
    title: 'FFmpeg Filters & CLI Docs',
    badge: 'Video / Audio',
    description: 'filter_complex graphs, codecs, LUFS normalization, and transcoding reference.',
    url: 'https://ffmpeg.org/ffmpeg-filters.html',
    command: 'python video-editor/Preview/run_video_editor.py --demo',
    commandLabel: 'Demo Video',
  },
  {
    id: 'm3d-blender',
    title: 'Blender Python API (bpy)',
    badge: '3D Render',
    description: 'Headless Cycles/EEVEE rendering, rigging, and mesh automation reference.',
    url: 'https://docs.blender.org/api/current/',
  },
  {
    id: 'm3d-hf-spaces',
    title: 'Hugging Face Spaces',
    badge: 'Demos',
    description: 'Live interactive AI video, audio, TTS, and 3D model demos.',
    url: 'https://huggingface.co/spaces',
  },
  {
    id: 'm3d-webgpu',
    title: 'WebGPU Fundamentals',
    badge: 'GPU Compute',
    description: 'Browser GPU compute shaders and local inference pipelines for @workspace/ai-local.',
    url: 'https://webgpufundamentals.org/',
  },
];

export const CLI_TOOLS_RESOURCES: PortalResourceItem[] = [
  {
    id: 'cli-git',
    title: 'Git Reference & Cheat Sheet',
    badge: 'Git CLI',
    description: 'Branching, rebasing, cherry-pick, worktrees, and bisect command reference.',
    url: 'https://git-scm.com/docs',
    command: 'git status -s',
    commandLabel: 'Git Status',
  },
  {
    id: 'cli-powershell',
    title: 'PowerShell 7 Docs',
    badge: 'Windows Shell',
    description: 'Pipeline scripting, Invoke-RestMethod, and modern cross-platform shell cmdlets.',
    url: 'https://learn.microsoft.com/en-us/powershell/',
  },
  {
    id: 'cli-terminal',
    title: 'Windows Terminal & Profiles',
    badge: 'Terminal',
    description: 'GPU-accelerated tabs, panes, ANSI VT100 colors, and custom keybindings.',
    url: 'https://learn.microsoft.com/en-us/windows/terminal/',
  },
  {
    id: 'cli-ripgrep',
    title: 'ripgrep (rg) User Guide',
    badge: 'Search',
    description: 'Blazingly fast regex code search respecting .gitignore across large monorepos.',
    url: 'https://github.com/BurntSushi/ripgrep/blob/master/GUIDE.md',
  },
  {
    id: 'cli-jq',
    title: 'jq JSON Processor',
    badge: 'JSON CLI',
    description: 'Filter, slice, map, and transform --json outputs from Preview runners.',
    url: 'https://jqlang.github.io/jq/manual/',
  },
  {
    id: 'cli-workspace',
    title: 'Soul Workspace CLI',
    badge: 'Local CLI',
    description: 'Interactive workspace CLI and port conflict scanner.',
    url: 'http://127.0.0.1:8008/api/soul-dev-portal/commands',
    command: 'npm run scripts:ports',
    commandLabel: 'Scan Ports',
  },
];

export const MONITORING_RESOURCES: PortalResourceItem[] = [
  {
    id: 'mon-otel',
    title: 'OpenTelemetry Docs',
    badge: 'Tracing',
    description: 'Distributed traces, metrics, and structured logs for Python and TypeScript.',
    url: 'https://opentelemetry.io/docs/',
  },
  {
    id: 'mon-grafana',
    title: 'Grafana Dashboards',
    badge: 'Metrics',
    description: 'Time-series visualization, alerting rules, and Loki log exploration.',
    url: 'https://grafana.com/docs/',
  },
  {
    id: 'mon-prometheus',
    title: 'Prometheus Monitoring',
    badge: 'TSDB',
    description: 'PromQL queries, exporters, and service health scraping.',
    url: 'https://prometheus.io/docs/introduction/overview/',
  },
  {
    id: 'mon-sentry',
    title: 'Sentry Error Tracking',
    badge: 'Errors',
    description: 'React 19 error boundaries, FastAPI tracebacks, and release regressions.',
    url: 'https://sentry.io/',
  },
  {
    id: 'mon-local-sse',
    title: 'Portal Telemetry SSE (:8008)',
    badge: 'Live Stream',
    description: 'Real-time CPU, memory, disk, and GPU telemetry stream from the local backend.',
    url: 'http://127.0.0.1:8008/api/system/overview?window_sec=300',
    command: 'python telemetry/Preview/run_telemetry.py --demo',
    commandLabel: 'Demo Telemetry',
  },
  {
    id: 'mon-logger',
    title: '@workspace/logger Runner',
    badge: '5-Col Logs',
    description: 'Test 5-column ANSI, JSON, AI, and DB telemetry logs locally.',
    url: 'https://github.com/dheena017/Soul-DevPortal-Packages/tree/main/logger',
    command: 'python logger/Preview/run_logger.py --demo',
    commandLabel: 'Demo Logger',
  },
];

export const PKG_MANAGERS_RESOURCES: PortalResourceItem[] = [
  {
    id: 'pm-uv',
    title: 'uv (Fast Python Package Manager)',
    badge: 'Python',
    description: 'Ultra-fast pip replacement, virtualenvs, and PEP 621 project management.',
    url: 'https://docs.astral.sh/uv/',
  },
  {
    id: 'pm-ruff',
    title: 'Ruff Linter & Formatter',
    badge: 'Lint / Format',
    description: 'Rust-powered Python linter and formatter for internal/, external/, and Preview/.',
    url: 'https://docs.astral.sh/ruff/',
  },
  {
    id: 'pm-pnpm',
    title: 'pnpm Workspaces',
    badge: 'Monorepo',
    description: 'Content-addressable disk store and fast workspace dependency linking.',
    url: 'https://pnpm.io/workspaces',
  },
  {
    id: 'pm-vite',
    title: 'Vite 8 Documentation',
    badge: 'Bundler',
    description: 'HMR dev server, Rollup/Rolldown builds, and COOP/COEP header config.',
    url: 'https://vite.dev/guide/',
    command: 'npm run build',
    commandLabel: 'Build Portal',
  },
  {
    id: 'pm-electron',
    title: 'Electron Documentation',
    badge: 'Desktop',
    description: 'Desktop shell, IPC preload bridges, and Windows .exe packaging.',
    url: 'https://www.electronjs.org/docs/latest/',
  },
  {
    id: 'pm-install',
    title: 'Workspace Editable Install',
    badge: 'Local Setup',
    description: 'Install Node workspaces and editable Python packages (logger, runner, config).',
    url: 'https://github.com/dheena017/Soul-DevPortal-Packages',
    command: 'npm run install:packages',
    commandLabel: 'Install All',
  },
];
