export const PACKAGE_ECOSYSTEM_TAGS = {
  NPM: 'NPM',
  PYTHON: 'PY',
  TYPESCRIPT: 'TS',
  CONFIG: 'CFG',
} as const;

export const PACKAGE_SORT_OPTIONS = [
  { id: 'name-asc', label: 'Name (A-Z)' },
  { id: 'name-desc', label: 'Name (Z-A)' },
  { id: 'exports-desc', label: 'Most Exports' },
] as const;

export const PACKAGE_DEFAULT_TAB = 'docs';

export interface PackageMetaInfo {
  icon: string;
  theme: 'violet' | 'emerald' | 'blue';
  role: string;
  tags: string[];
  scope: string;
}

export const PACKAGE_METADATA_MAP: Record<string, PackageMetaInfo> = {
  logger: {
    icon: '🪵',
    theme: 'violet',
    role: 'Universal 5-Column Logging & DevTools Bridge',
    tags: ['DevTools Bridge', '5-Column Format', 'Terminal Banners', 'HTTP Middleware', 'Python + TS'],
    scope: 'Dual Runtime (Node.js + Python)',
  },
  runner: {
    icon: '⚡',
    theme: 'emerald',
    role: 'Process Supervision & Port Conflict Resolver',
    tags: ['CLI Runner', 'Port Conflict Guard', 'Process Supervisor', 'Dev Server Orchestrator'],
    scope: 'Universal Monorepo CLI',
  },
  config: {
    icon: '⚙️',
    theme: 'blue',
    role: 'Centralized Design Tokens & Tooling Presets',
    tags: ['Tailwind Tokens', 'ESLint Presets', 'TypeScript Config', 'Prettier Presets'],
    scope: 'Workspace Standard Presets',
  },
};
