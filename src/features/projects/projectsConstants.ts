export const DEFAULT_PROJECT_FRAMEWORK_OPTIONS = ['all', 'React 19', 'React 18', 'Next.js'] as const;

export const MONOREPO_STANDARD_PORT_RANGES = {
  FRONTEND_START: 5173,
  FRONTEND_END: 5181,
  BACKEND_START: 8000,
  BACKEND_END: 8008,
} as const;

export const PROJECT_STATUS_REFRESH_INTERVAL_MS = 5000;

export const PROJECT_DESCRIPTIONS: Record<string, string> = {
  'apexmind-ai': 'Automated motivational quote video generation, AI scriptwriting, voiceover synthesis with Gemini, and seamless YouTube publishing.',
  'sonikoma': 'AI anime character voiceover synthesis, multi-track timeline editor, and video generation studio powered by Gemini AI.',
  'outpass-system': 'Digital hostel student permission, warden gate pass authorization, and leave approval tracking system.',
  'free-api-hub': 'Curated open developer APIs catalog, mock data endpoints, and interactive REST playground.',
  'spatial-dimensions': 'Interactive 3D web spatial canvas with motion dimensions and reactive sound engine.',
  'college-management-system': 'Campus hostel management, student attendance, room allocation directory, and billing workflows.',
  'globalpulse-ai': 'Real-time international news aggregator and breaking alerts synthesizer powered by Gemini AI.',
  'postcraft-ai': 'Multi-platform social media post generation, smart publishing scheduler, and AI marketing assistant.',
};

export const PROJECT_TAGS: Record<string, string[]> = {
  'apexmind-ai': ['React 19', 'FastAPI', 'Gemini AI', 'YouTube API'],
  'sonikoma': ['React 19', 'FastAPI', 'Voice AI', 'Supabase'],
  'outpass-system': ['React 18', 'Python', 'SQLAlchemy', 'PWA'],
  'free-api-hub': ['React 18', 'FastAPI', 'REST APIs', 'Docker'],
  'spatial-dimensions': ['React 19', 'Motion', 'Vite 6', '3D Web'],
  'college-management-system': ['React 19', 'Node.js', 'SQLite', 'Tailwind v4'],
  'globalpulse-ai': ['Next.js 14', 'React 18', 'Gemini AI', 'aiosqlite'],
  'postcraft-ai': ['Next.js 14', 'App Router', 'GenAI', 'Tailwind'],
};
