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
  { slug: 'apexmind-ai', name: 'ApexMind AI', frontendPort: 5173, backendPort: 8000, database: 'SQLite (apexmind.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
  { slug: 'outpass-system', name: 'Outpass System', frontendPort: 5174, backendPort: 8001, database: 'SQLite (outpass.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
  { slug: 'free-api-hub', name: 'Free API Hub', frontendPort: 5175, backendPort: 8002, database: 'SQLite (free_api_hub.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
  { slug: 'sonikoma', name: 'Sonikoma', frontendPort: 5176, backendPort: 8006, database: 'SQLite (sonikoma.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
  { slug: 'spatial-dimensions', name: 'Spatial Dimensions', frontendPort: 5177, backendPort: 8007, database: 'SQLite (spatial_dimensions.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
  { slug: 'college-management-system', name: 'College Management System', frontendPort: 5178, backendPort: 8005, database: 'SQLite (college_management.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
  { slug: 'globalpulse-ai', name: 'GlobalPulse AI', frontendPort: 5179, backendPort: 8003, database: 'SQLite (globalpulse.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
  { slug: 'postcraft-ai', name: 'PostCraft AI', frontendPort: 5180, backendPort: 8004, database: 'SQLite (postcraft.db)', framework: 'React 19 + Vite 8 + Tailwind v4 / FastAPI' },
];
