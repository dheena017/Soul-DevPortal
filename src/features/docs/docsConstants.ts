export interface GuideMeta {
  id: string;
  slug: string;
  title: string;
  breadcrumb: string;
  description: string;
  icon: string;
  filename: string;
  category: 'rules' | 'design' | 'ports' | 'techstack' | 'cheatsheet';
  badge: string;
  version: string;
  sectionsCount: number;
  readTime: string;
  targetAudience: string;
  topics: string[];
  keyHighlights: string[];
  complianceStatus: string;
  updatedAt?: string;
  relativeTime?: string;
  commitHash?: string;
}

export const DOCUMENTATION_GUIDES_REGISTRY: GuideMeta[] = [
  {
    id: 'rules',
    slug: 'projects-rules',
    title: 'Projects Rules & Standards',
    breadcrumb: 'Soul Workspace / Projects Rules',
    description: 'The authoritative golden rulebook governing all 9 workspace applications: directory structure, strict port allocations, shared packages integration, FastAPI routing, SQLite schemas, and environment variable security.',
    icon: '📜',
    filename: '01-project-architecture/golden-rules.md',
    category: 'rules',
    badge: 'OFFICIAL SPEC v1.0',
    version: '1.0.0',
    sectionsCount: 10,
    readTime: '8 min read',
    targetAudience: 'All Workspace Developers & Leads',
    topics: [
      'Strict Port Matrix :5173-:5181',
      'metadata.json Schema',
      '/api/ Backend Prefix',
      'hostel.db SQLite Standards',
      'Zero Drift Conformance',
      'Shared Packages Consumption',
    ],
    keyHighlights: [
      'Strict port assignment with zero collisions (:5173-:5181 for Client, :8000-:8008 for Server)',
      'Mandatory shared packages adoption: @workspace/logger, @workspace/config, @workspace/runner',
      'Standardized folder layout: client/, server/, metadata.json, README.md, and .env.example',
    ],
    complianceStatus: '100% Monorepo Compliant (9/9 Apps)',
    relativeTime: '3h',
    updatedAt: '2026-11-24T11:37:07+05:30',
    commitHash: '43a2bc4',
  },
  {
    id: 'cheatsheet',
    slug: 'compliance-cheatsheet',
    title: 'Monorepo Compliance Cheatsheet',
    breadcrumb: 'Soul Workspace / Compliance Cheatsheet',
    description: 'Quick-reference operational checklists, top 10 rules, directory anatomy, strict port matrix (:5173-:5181 / :8000-:8008), SQLite WAL pragmas, and supervisor CLI commands.',
    icon: '📋',
    filename: '04-cheatsheets/main.md',
    category: 'cheatsheet',
    badge: 'QUICK REFERENCE',
    version: '1.0.0',
    sectionsCount: 8,
    readTime: '4 min read',
    targetAudience: 'All Developers, Architects & DevOps',
    topics: [
      'Top 10 Monorepo Rules',
      'Client: :5173 - :5181',
      'Server: :8000 - :8008',
      'client/ & server/ Anatomy',
      'SQLite WAL Mode & Pragmas',
      'npm run dev:* CLI Commands',
    ],
    keyHighlights: [
      'Top 10 mandatory rules and compliance standards across all 8 micro-apps',
      'Canonical client/ and server/ directory architecture with feature slices',
      'Standardized supervisor commands with automatic port cleanup',
    ],
    complianceStatus: '100% Monorepo Compliant',
    relativeTime: '21h',
    updatedAt: '2026-11-23T17:42:16+05:30',
    commitHash: '7e68c48',
  },
  {
    id: 'design',
    slug: 'packages-design',
    title: 'Shared Packages Design Guide',
    breadcrumb: 'Soul Workspace / Packages Design',
    description: 'Comprehensive architectural blueprint for designing, structuring, publishing, and consuming shared libraries (@workspace/logger, @workspace/runner, @workspace/config) across TypeScript and Python runtimes.',
    icon: '📘',
    filename: '02-packages-architecture/main.md',
    category: 'design',
    badge: 'PACKAGE BLUEPRINT',
    version: '2.1.0',
    sectionsCount: 8,
    readTime: '6 min read',
    targetAudience: 'Core Library Contributors & Maintainers',
    topics: [
      'TypeScript / ESM Standards',
      'Python Module Exports',
      'Subpath Exports Registry',
      'Zero-Config Integration',
      'DevTools Banner Formats',
      'Semantic Versioning',
    ],
    keyHighlights: [
      'Dual-runtime support: ESM & CommonJS for Node.js, pyproject.toml modules for Python',
      'Structured 5-column dev banners and universal terminal logger styling',
      'Shared Tailwind tokens and design variables distribution without bundling bottlenecks',
    ],
    complianceStatus: 'Production Ready (3 Core Packages)',
    relativeTime: '21h',
    updatedAt: '2026-11-23T17:42:16+05:30',
    commitHash: '7e68c48',
  },
  {
    id: 'ports',
    slug: 'port-architecture',
    title: 'Port & Network Topology Guide',
    breadcrumb: 'Soul Workspace / Port Topology',
    description: 'Complete network architecture and port allocation guide: Vite dev servers (:5173-:5181), FastAPI backends (:8000-:8008), reverse proxy rules, and socket healthcheck probing.',
    icon: '🌐',
    filename: '03-networking-and-ports/main.md',
    category: 'ports',
    badge: 'RUNTIME TOPOLOGY',
    version: '1.4.0',
    sectionsCount: 6,
    readTime: '5 min read',
    targetAudience: 'Full-Stack Developers & DevOps',
    topics: [
      'Vite Ports 5173-5181',
      'FastAPI Ports 8000-8008',
      'Reverse Proxy Rules',
      'CORS Whitelist Matrix',
      'Socket Prober Architecture',
      'Process Concurrency',
    ],
    keyHighlights: [
      'Dedicated static port assignments ensuring concurrent execution of multiple apps',
      'Automated socket ping and HTTP readiness verification via live DevTools prober',
      'Standardized proxy routing: /api/ -> localhost:800x with zero CORS issues in local development',
    ],
    complianceStatus: 'Fully Orchestrated',
    relativeTime: '1d',
    updatedAt: '2026-11-23T10:15:00+05:30',
    commitHash: '7e68c48',
  },
  {
    id: 'techstack',
    slug: 'tech-stack',
    title: 'Tech Stack & Ecosystem Standards',
    breadcrumb: 'Soul Workspace / Tech Stack',
    description: 'Certified dependencies matrix, framework alignments, polyglot runtime baselines (Node.js 20+, Python 3.11+), unified Tailwind CSS v4 design tokens, and shared ESLint / TypeScript configs.',
    icon: '⚙️',
    filename: '01-project-architecture/main.md',
    category: 'techstack',
    badge: 'ECOSYSTEM MATRIX',
    version: '1.2.0',
    sectionsCount: 7,
    readTime: '5 min read',
    targetAudience: 'Tech Leads, Architects & Tooling Team',
    topics: [
      'React 19 & Vite 8',
      'Tailwind CSS v4 Tokens',
      'Python 3.11 & FastAPI',
      'better-sqlite3 & SQLite',
      'Monorepo Tooling Baseline',
    ],
    keyHighlights: [
      'Unified frontend baselines with React 19, Vite 8+, and Tailwind CSS v4 styling',
      'Embedded database standards using SQLite, better-sqlite3, and SQLAlchemy ORM',
      'Monorepo script orchestration via @workspace/runner CLI with unified exit codes',
    ],
    complianceStatus: 'Active Standard',
    relativeTime: '1d',
    updatedAt: '2026-11-23T10:15:00+05:30',
    commitHash: '7e68c48',
  },
];

export interface SubModuleDoc {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  tag: string;
  description: string;
  isTopic: boolean;
  topicDir?: string;
  relativePath?: string;
  mainRelativePath?: string;
  rulesRelativePath?: string;
}

export const DOCS_SUBMODULES_MAP: Record<string, SubModuleDoc[]> = {
  rules: [
    {
      id: 'main',
      title: 'Master Technical Blueprint',
      shortTitle: 'Master Blueprint',
      icon: '🏛️',
      tag: 'MASTER SPEC',
      description: 'Comprehensive architectural specification covering monorepo layout, frameworks, client, server, APIs, SQLite WAL, schemas, and security.',
      isTopic: false,
      relativePath: '01-project-architecture/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Golden Architectural Invariants',
      shortTitle: 'Golden Rules',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The 10 fundamental pillars and inviolable domain engineering rules governing all applications.',
      isTopic: false,
      relativePath: '01-project-architecture/golden-rules.md',
    },
    {
      id: 'all',
      title: 'Complete Architecture Suite',
      shortTitle: 'All Documents',
      icon: '📚',
      tag: 'FULL SPEC',
      description: 'Master architecture blueprint and golden invariants in continuous view.',
      isTopic: false,
    },
  ],
  design: [
    {
      id: 'main',
      title: 'Shared Packages Master Blueprint',
      shortTitle: 'Master Blueprint',
      icon: '📘',
      tag: 'BLUEPRINT',
      description: 'Core guides for @workspace/config, @workspace/logger, @workspace/runner, layout hierarchy, authoring walkthrough, and test suites.',
      isTopic: false,
      relativePath: '02-packages-architecture/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Package Golden Invariants & Standards',
      shortTitle: 'Golden Rules',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The 5 golden rules, 2-tier internal/external separation, snake_case internals, and manifest parity standards.',
      isTopic: false,
      relativePath: '02-packages-architecture/golden-rules.md',
    },
    {
      id: 'all',
      title: 'Complete Packages Specification',
      shortTitle: 'All Documents',
      icon: '📚',
      tag: 'FULL SPEC',
      description: 'Complete compilation of all package blueprints and standards.',
      isTopic: false,
    },
  ],
  ports: [
    {
      id: 'main',
      title: 'Port Allocation Matrix & Topology Blueprint',
      shortTitle: 'Port Matrix & Topology',
      icon: '🌐',
      tag: 'TOPOLOGY',
      description: 'Strict port assignments (:5173-:5181 / :8000-:8008), reverse proxying, and socket cleanup runbooks.',
      isTopic: false,
      relativePath: '03-networking-and-ports/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Networking Golden Rules',
      shortTitle: 'Golden Rules',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The golden rules for zero port collisions, process isolation, and loopback binding.',
      isTopic: false,
      relativePath: '03-networking-and-ports/golden-rules.md',
    },
    {
      id: 'all',
      title: 'Complete Network Specification',
      shortTitle: 'All Documents',
      icon: '📚',
      tag: 'FULL SPEC',
      description: 'Complete compiled network specifications.',
      isTopic: false,
    },
  ],
  techstack: [
    {
      id: 'main',
      title: 'Framework Technical Specification',
      shortTitle: 'Specification',
      icon: '⚙️',
      tag: 'TECH STACK',
      description: 'Comprehensive technical specification for React 19, Vite 8, Python 3.11+, and FastAPI.',
      isTopic: false,
      relativePath: '01-project-architecture/main.md',
    },
    {
      id: 'rules',
      title: 'Framework Rules & Invariants',
      shortTitle: 'Rules & Constraints',
      icon: '⚠️',
      tag: 'CONSTRAINTS',
      description: 'Mandatory constraints and non-negotiables for dependencies and tooling.',
      isTopic: false,
      relativePath: '01-project-architecture/golden-rules.md',
    },
    {
      id: 'all',
      title: 'Complete Tech Stack Standards',
      shortTitle: 'Both Docs',
      icon: '📚',
      tag: 'FULL SPEC',
      description: 'Complete specification and rules for the workspace tech stack.',
      isTopic: false,
    },
  ],
  cheatsheet: [
    {
      id: 'main',
      title: 'Developer Cheatsheets & Commands Blueprint',
      shortTitle: 'Cheatsheets & Commands',
      icon: '⚡',
      tag: 'RUNBOOKS',
      description: 'Master table of root scripts, single-template direct CLI commands, and pre-commit compliance checklists.',
      isTopic: false,
      relativePath: '04-cheatsheets/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Workflow Golden Rules',
      shortTitle: 'Golden Rules',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The 5 golden rules of developer commands, port safety, and pre-commit audit gates.',
      isTopic: false,
      relativePath: '04-cheatsheets/golden-rules.md',
    },
    {
      id: 'all',
      title: 'Complete Cheatsheets Suite',
      shortTitle: 'All Documents',
      icon: '📚',
      tag: 'FULL SPEC',
      description: 'Complete compilation of all cheatsheets and runbooks.',
      isTopic: false,
    },
  ],
};
