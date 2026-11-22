export interface LanguageFilter {
  id: string;
  label: string;
  badge: string;
}

export const EXPLORE_LANGUAGE_FILTERS: LanguageFilter[] = [
  { id: 'all', label: 'All Languages', badge: 'ALL' },
  { id: 'typescript', label: 'TypeScript', badge: 'TS' },
  { id: 'python', label: 'Python', badge: 'PY' },
];

export const EXPLORE_SYMBOL_KINDS = ['all', 'function', 'class', 'interface', 'method', 'type'] as const;

export interface MonorepoPortEntry {
  slug: string;
  name: string;
  frontendPort: number;
  backendPort: number;
  database: string;
  framework: string;
}

export const MONOREPO_PROJECT_PORTS: MonorepoPortEntry[] = [
  { slug: 'apexmind-ai', name: 'ApexMind AI', frontendPort: 5174, backendPort: 8001, database: 'PostgreSQL / Prisma', framework: 'Vite React + Express' },
  { slug: 'college-management-system', name: 'College Management System', frontendPort: 5175, backendPort: 8002, database: 'MySQL / Prisma', framework: 'Vite React + Express' },
  { slug: 'free-api-hub', name: 'Free API Hub', frontendPort: 5176, backendPort: 8003, database: 'MongoDB', framework: 'Next.js + Express' },
  { slug: 'globalpulse-ai', name: 'GlobalPulse AI', frontendPort: 5177, backendPort: 8004, database: 'SQLite / DuckDB', framework: 'Vite React + FastAPI' },
  { slug: 'outpass-system', name: 'Outpass System', frontendPort: 5178, backendPort: 8005, database: 'PostgreSQL', framework: 'Next.js App Router' },
  { slug: 'postcraft-ai', name: 'PostCraft AI', frontendPort: 5179, backendPort: 8006, database: 'SQLite', framework: 'Vite React + FastAPI' },
  { slug: 'sonikoma', name: 'Sonikoma', frontendPort: 5180, backendPort: 8007, database: 'Local File / JSON', framework: 'Vite React' },
  { slug: 'spatial-dimensions', name: 'Spatial Dimensions', frontendPort: 5181, backendPort: 8000, database: 'PostGIS / SQLite', framework: 'Vite React + Three.js' },
];
