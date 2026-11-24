export interface GuideMeta {
  id: string;
  slug: string;
  title: string;
  breadcrumb: string;
  description: string;
  icon: string;
  filename: string;
  folder: string;
  mainFile: string;
  rulesFile: string;
  category: 'rules' | 'design' | 'ports' | 'cheatsheet' | 'architecture' | 'packages' | 'techstack';
  badge: string;
  version: string;
  sectionsCount: number;
  readTime: string;
  targetAudience: string;
  topics: string[];
  keyHighlights: string[];
  complianceStatus: string;
  aliases?: string[];
  updatedAt?: string;
  relativeTime?: string;
  commitHash?: string;
}

export interface SubModuleDoc {
  id: string;
  title: string;
  shortTitle: string;
  icon: string;
  tag: string;
  description: string;
  isTopic?: boolean;
  relativePath?: string;
  mainRelativePath?: string;
  rulesRelativePath?: string;
  topicDir?: string;
}

/**
 * Authoritative 4-domain documentation guides registry.
 * Exactly maps 1-to-1 to the 4 canonical documentation folders in Soul-DevPortal-Docs:
 *   1. 01-project-architecture -> Project Architecture (main.md & golden-rules.md)
 *   2. 02-packages-architecture -> Packages Architecture (main.md & golden-rules.md)
 *   3. 03-networking-and-ports  -> Port Architecture & Networking (main.md & golden-rules.md)
 *   4. 04-cheatsheets           -> Compliance Cheatsheet & Runbooks (main.md & golden-rules.md)
 */
export const DOCUMENTATION_GUIDES_REGISTRY: GuideMeta[] = [
  {
    id: 'project-architecture',
    slug: 'project-architecture',
    title: 'Project Architecture',
    breadcrumb: 'Soul Workspace / Project Architecture',
    description: 'Master blueprint specification and golden architectural invariants for all workspace applications: layout hierarchy, framework invariants, API patterns, SQLite standards, and security boundaries.',
    icon: '🏛️',
    filename: '01-project-architecture/main.md',
    folder: '01-project-architecture',
    mainFile: '01-project-architecture/main.md',
    rulesFile: '01-project-architecture/golden-rules.md',
    category: 'rules',
    badge: 'SPEC & RULES',
    version: '1.0.0',
    sectionsCount: 10,
    readTime: '8 min read',
    targetAudience: 'All Workspace Developers & Leads',
    aliases: ['rules', 'projects-rules', 'techstack', 'tech-stack', '01-project-architecture'],
    topics: [
      'Unified Three-Pillar Standard',
      'Feature-Slice Architecture (FSD)',
      'Vite Reverse Proxying (/api)',
      'SQLite WAL Isolation (server/data/)',
      'metadata.json Manifest Parity',
      'Zero-Secret Governance',
    ],
    keyHighlights: [
      'Strict Three-Pillar Standard: React 19 + Vite 8 + Python 3.11+ FastAPI + SQLite WAL',
      'Strict Feature-Slice Co-Location with Public Facades (index.ts) and clean boundaries',
      'Zero CORS drift via Vite reverse proxying (/api -> localhost:800x) in dev and prod',
      'Dedicated SQLite persistence per service with mandatory WAL pragmas and foreign keys',
    ],
    complianceStatus: '100% Monorepo Compliant (9/9 Apps)',
    relativeTime: '3h',
    updatedAt: '2026-11-24T15:30:00+05:30',
    commitHash: '62135a1',
  },
  {
    id: 'packages-architecture',
    slug: 'packages-architecture',
    title: 'Packages Architecture',
    breadcrumb: 'Soul Workspace / Packages Architecture',
    description: 'Architectural specification, package authoring guidelines, and verification rules for shared libraries (@workspace/logger, @workspace/runner, @workspace/config).',
    icon: '📦',
    filename: '02-packages-architecture/main.md',
    folder: '02-packages-architecture',
    mainFile: '02-packages-architecture/main.md',
    rulesFile: '02-packages-architecture/golden-rules.md',
    category: 'design',
    badge: 'PACKAGE BLUEPRINT',
    version: '2.1.0',
    sectionsCount: 8,
    readTime: '6 min read',
    targetAudience: 'Core Library Contributors & Maintainers',
    aliases: ['design', 'packages-design', 'guide', '02-packages-architecture'],
    topics: [
      'Dual-Runtime Support (TS/Python)',
      'Subpath Exports Registry',
      'Zero-Config Integration',
      'Terminal Logger Styling',
      'CLI Runner Protocol',
    ],
    keyHighlights: [
      'Dual-runtime support: ESM & CommonJS for Node.js, pyproject.toml modules for Python',
      '2-tier internal/external separation with clean public facades and snake_case internals',
      'Shared logger, runner, and config libraries with zero cyclical dependencies',
    ],
    complianceStatus: 'Production Ready (3 Core Packages)',
    relativeTime: '21h',
    updatedAt: '2026-11-24T15:30:00+05:30',
    commitHash: '62135a1',
  },
  {
    id: 'networking-and-ports',
    slug: 'port-architecture',
    title: 'Port Architecture & Networking',
    breadcrumb: 'Soul Workspace / Port Architecture',
    description: 'Complete network topology, strict non-overlapping port allocation matrix (:5173-:5181 / :8000-:8008), reverse proxy architecture, and socket management runbooks.',
    icon: '🌐',
    filename: '03-networking-and-ports/main.md',
    folder: '03-networking-and-ports',
    mainFile: '03-networking-and-ports/main.md',
    rulesFile: '03-networking-and-ports/golden-rules.md',
    category: 'ports',
    badge: 'PORT MATRIX',
    version: '1.4.0',
    sectionsCount: 6,
    readTime: '5 min read',
    targetAudience: 'Full-Stack Developers & DevOps',
    aliases: ['ports', 'port-architecture', 'ports-guide', '03-networking-and-ports'],
    topics: [
      'Client Ports :5173-:5181',
      'Server Ports :8000-:8008',
      'Vite Reverse Proxy Rules',
      'Socket Prober Architecture',
      'Process Concurrency',
    ],
    keyHighlights: [
      'Dedicated static port assignments ensuring concurrent execution of all applications',
      'Standardized proxy routing: /api -> localhost:800x with zero CORS issues in development',
      'Kernel-level non-blocking socket probing and automated force-termination CLI',
    ],
    complianceStatus: 'Fully Orchestrated',
    relativeTime: '1d',
    updatedAt: '2026-11-24T15:30:00+05:30',
    commitHash: '62135a1',
  },
  {
    id: 'cheatsheets',
    slug: 'compliance-cheatsheet',
    title: 'Compliance Cheatsheet & Runbooks',
    breadcrumb: 'Soul Workspace / Compliance Cheatsheet',
    description: 'Quick-reference operational checklists, master scripts, single-template direct CLI commands, pre-commit audit gates, and SQLite WAL emergency runbooks.',
    icon: '⚡',
    filename: '04-cheatsheets/main.md',
    folder: '04-cheatsheets',
    mainFile: '04-cheatsheets/main.md',
    rulesFile: '04-cheatsheets/golden-rules.md',
    category: 'cheatsheet',
    badge: 'OPERATIONAL RUNBOOKS',
    version: '1.0.0',
    sectionsCount: 8,
    readTime: '4 min read',
    targetAudience: 'All Developers, Architects & DevOps',
    aliases: ['cheatsheet', 'compliance-cheatsheet', 'scripts', '04-cheatsheets'],
    topics: [
      'Master Root Scripts',
      'Direct CLI Project Launchers',
      'Pre-Commit Compliance Checklist',
      'SQLite WAL Emergency Commands',
      'Socket Conflict Termination',
    ],
    keyHighlights: [
      'Root workspace execution over fragmented sub-directory commands',
      'Strict pre-commit zero-drift compliance audit gate across all micro-apps',
      'Instant socket cleanup and process termination CLI runbooks',
    ],
    complianceStatus: '100% Monorepo Compliant',
    relativeTime: '1d',
    updatedAt: '2026-11-24T15:30:00+05:30',
    commitHash: '62135a1',
  },
];

/**
 * Safe helper to find GuideMeta by ID, slug, category, or legacy alias.
 */
export function findGuideMeta(identifier: string): GuideMeta {
  if (!identifier) return DOCUMENTATION_GUIDES_REGISTRY[0];
  const clean = identifier.toLowerCase().trim().replace(/^docs?\//, '');

  return (
    DOCUMENTATION_GUIDES_REGISTRY.find(
      (g) =>
        g.id === clean ||
        g.slug === clean ||
        (g.aliases && g.aliases.includes(clean)) ||
        g.category === clean ||
        g.folder === clean
    ) || DOCUMENTATION_GUIDES_REGISTRY[0]
  );
}

/**
 * Canonical submodules map for documentation tabs.
 */
export const DOCS_SUBMODULES_MAP: Record<string, SubModuleDoc[]> = {
  'project-architecture': [
    {
      id: 'main',
      title: 'Master Technical Blueprint',
      shortTitle: 'Full Specification',
      icon: '🏛️',
      tag: 'MASTER SPEC',
      description: 'Comprehensive architectural specification covering monorepo layout, frameworks, client, server, APIs, SQLite WAL, schemas, and security.',
      isTopic: false,
      relativePath: '01-project-architecture/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Golden Architectural Invariants',
      shortTitle: 'Key Rules & Highlights',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The 10 fundamental pillars and inviolable domain engineering rules governing all applications.',
      isTopic: false,
      relativePath: '01-project-architecture/golden-rules.md',
    },
  ],
  'packages-architecture': [
    {
      id: 'main',
      title: 'Shared Packages Master Blueprint',
      shortTitle: 'Full Specification',
      icon: '📘',
      tag: 'BLUEPRINT',
      description: 'Core guides for @workspace/config, @workspace/logger, @workspace/runner, layout hierarchy, authoring walkthrough, and test suites.',
      isTopic: false,
      relativePath: '02-packages-architecture/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Package Golden Invariants & Standards',
      shortTitle: 'Key Rules & Highlights',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The 5 golden rules, 2-tier internal/external separation, snake_case internals, and manifest parity standards.',
      isTopic: false,
      relativePath: '02-packages-architecture/golden-rules.md',
    },
  ],
  'networking-and-ports': [
    {
      id: 'main',
      title: 'Port Allocation Matrix & Topology Blueprint',
      shortTitle: 'Full Specification',
      icon: '🌐',
      tag: 'TOPOLOGY',
      description: 'Strict port assignments (:5173-:5181 / :8000-:8008), reverse proxying, and socket cleanup runbooks.',
      isTopic: false,
      relativePath: '03-networking-and-ports/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Networking Golden Rules',
      shortTitle: 'Key Rules & Highlights',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The golden rules for zero port collisions, process isolation, and loopback binding.',
      isTopic: false,
      relativePath: '03-networking-and-ports/golden-rules.md',
    },
  ],
  cheatsheets: [
    {
      id: 'main',
      title: 'Developer Cheatsheets & Commands Blueprint',
      shortTitle: 'Full Specification',
      icon: '⚡',
      tag: 'RUNBOOKS',
      description: 'Master table of root scripts, single-template direct CLI commands, and pre-commit compliance checklists.',
      isTopic: false,
      relativePath: '04-cheatsheets/main.md',
    },
    {
      id: 'golden-rules',
      title: 'Workflow Golden Rules',
      shortTitle: 'Key Rules & Highlights',
      icon: '📜',
      tag: 'INVARIANTS',
      description: 'The 5 golden rules of developer commands, port safety, and pre-commit audit gates.',
      isTopic: false,
      relativePath: '04-cheatsheets/golden-rules.md',
    },
  ],
};

// Aliases for backward compatibility
DOCS_SUBMODULES_MAP.rules = DOCS_SUBMODULES_MAP['project-architecture'];
DOCS_SUBMODULES_MAP['projects-rules'] = DOCS_SUBMODULES_MAP['project-architecture'];
DOCS_SUBMODULES_MAP.techstack = DOCS_SUBMODULES_MAP['project-architecture'];
DOCS_SUBMODULES_MAP['tech-stack'] = DOCS_SUBMODULES_MAP['project-architecture'];
DOCS_SUBMODULES_MAP.design = DOCS_SUBMODULES_MAP['packages-architecture'];
DOCS_SUBMODULES_MAP['packages-design'] = DOCS_SUBMODULES_MAP['packages-architecture'];
DOCS_SUBMODULES_MAP.ports = DOCS_SUBMODULES_MAP['networking-and-ports'];
DOCS_SUBMODULES_MAP['port-architecture'] = DOCS_SUBMODULES_MAP['networking-and-ports'];
DOCS_SUBMODULES_MAP.cheatsheet = DOCS_SUBMODULES_MAP.cheatsheets;
DOCS_SUBMODULES_MAP['compliance-cheatsheet'] = DOCS_SUBMODULES_MAP.cheatsheets;
