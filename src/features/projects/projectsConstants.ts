export const DEFAULT_PROJECT_FRAMEWORK_OPTIONS = ['all', 'React 19', 'Vite 8', 'Tailwind v4', 'FastAPI'] as const;

export const MONOREPO_STANDARD_PORT_RANGES = {
  FRONTEND_START: 5173,
  FRONTEND_END: 5181,
  BACKEND_START: 8000,
  BACKEND_END: 8008,
} as const;

export const PROJECT_STATUS_REFRESH_INTERVAL_MS = 5000;

export const PROJECT_LOGOS: Record<string, string> = {
  'apexmind-ai': '/project-logos/apexmind-ai.png',
  'outpass-system': '/project-logos/outpass-system.svg',
  'free-api-hub': '/project-logos/free-api-hub.png',
  'sonikoma': '/project-logos/sonikoma.png',
  'spatial-dimensions': '/project-logos/spatial-dimensions.svg',
  'college-management-system': '/project-logos/college-management-system.svg',
  'globalpulse-ai': '/project-logos/globalpulse-ai.svg',
  'postcraft-ai': '/project-logos/postcraft-ai.svg',
  'home-management': '/project-logos/college-management-system.svg',
  'devportal': '/favicon.svg',
};

export interface ProjectBrandInfo {
  name: string;
  shortName: string;
  icon: string;
  themeColor: string;
  accentBg: string;
  tag: string;
  primaryCapability: string;
}

export const PROJECT_BRAND_MAP: Record<string, ProjectBrandInfo> = {
  'apexmind-ai': {
    name: 'ApexMind Studio AI',
    shortName: 'ApexMind',
    icon: '🧠',
    themeColor: '#a855f7',
    accentBg: 'rgba(168, 85, 247, 0.12)',
    tag: 'Quote Video AI',
    primaryCapability: 'Gemini 2.5 Flash + TTS Voice',
  },
  'outpass-system': {
    name: 'Outpass Management System',
    shortName: 'Outpass',
    icon: '🎫',
    themeColor: '#06b6d4',
    accentBg: 'rgba(6, 182, 212, 0.12)',
    tag: 'Hostel Gate Pass',
    primaryCapability: 'QR Pass Authorization & Tracking',
  },
  'free-api-hub': {
    name: 'Free API Hub',
    shortName: 'API Hub',
    icon: '🔌',
    themeColor: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    tag: 'Developer APIs',
    primaryCapability: '50+ Open REST APIs & Mock Server',
  },
  'sonikoma': {
    name: 'Sonikoma AI Studio',
    shortName: 'Sonikoma',
    icon: '🎙️',
    themeColor: '#ec4899',
    accentBg: 'rgba(236, 72, 153, 0.12)',
    tag: 'Anime Voice AI',
    primaryCapability: 'Gemini AI Video & Multitrack Dub',
  },
  'spatial-dimensions': {
    name: 'Spatial Dimensions',
    shortName: 'Spatial 3D',
    icon: '🌐',
    themeColor: '#14b8a6',
    accentBg: 'rgba(20, 184, 166, 0.12)',
    tag: '3D Web Canvas',
    primaryCapability: 'WebGL Shaders & Spatial Audio',
  },
  'college-management-system': {
    name: 'College Management System',
    shortName: 'College ERP',
    icon: '🎓',
    themeColor: '#f59e0b',
    accentBg: 'rgba(245, 158, 11, 0.12)',
    tag: 'Campus ERP',
    primaryCapability: 'Hostel Rooms, Mess & Biometrics',
  },
  'globalpulse-ai': {
    name: 'GlobalPulse AI',
    shortName: 'GlobalPulse',
    icon: '📡',
    themeColor: '#3b82f6',
    accentBg: 'rgba(59, 130, 246, 0.12)',
    tag: 'News Synthesizer',
    primaryCapability: 'Gemini Breaking News & TL;DR',
  },
  'postcraft-ai': {
    name: 'PostCraft AI',
    shortName: 'PostCraft',
    icon: '✍️',
    themeColor: '#f97316',
    accentBg: 'rgba(249, 115, 22, 0.12)',
    tag: 'Social Copy GenAI',
    primaryCapability: 'Integrated Multi-Platform GenAI',
  },
  'home-management': {
    name: 'Home Management System',
    shortName: 'HomeManager',
    icon: '🏡',
    themeColor: '#10b981',
    accentBg: 'rgba(16, 185, 129, 0.12)',
    tag: 'Household & Belongings ERP',
    primaryCapability: 'Home Inventory, Warranties, Groceries & Tasks',
  },
  'devportal': {
    name: 'Soul Developer Portal',
    shortName: 'DevPortal',
    icon: '🚀',
    themeColor: '#6366f1',
    accentBg: 'rgba(99, 102, 241, 0.12)',
    tag: 'Command Center',
    primaryCapability: 'FastAPI Runtime & AST Topology',
  },
};

/**
 * Formats harsh all-caps titles into human-friendly Title Case
 * while keeping abbreviations (AI, API, ERP, QR, etc.) intact.
 */
export function formatProjectTitle(id: string, fallbackTitle?: string): string {
  if (PROJECT_BRAND_MAP[id]?.name) {
    return PROJECT_BRAND_MAP[id].name;
  }
  if (!fallbackTitle) return id;

  const acronyms = new Set(['AI', 'API', 'ERP', 'QR', 'AST', 'TTS', 'REST', 'PWA', 'CMS', 'SQL', 'DB', 'UI', 'UX', 'FE', 'BE']);
  return fallbackTitle
    .toLowerCase()
    .split(' ')
    .map((word) => {
      const upper = word.toUpperCase();
      if (acronyms.has(upper)) return upper;
      return word.charAt(0).toUpperCase() + word.slice(1);
    })
    .join(' ');
}

export const PROJECT_DESCRIPTIONS: Record<string, string> = {
  'apexmind-ai': 'Automated motivational quote video generation, AI scriptwriting, voiceover synthesis with Gemini, and seamless YouTube publishing.',
  'sonikoma': 'AI anime character voiceover synthesis, multi-track timeline editor, and video generation studio powered by Gemini AI.',
  'outpass-system': 'Digital hostel student permission, warden gate pass authorization, and leave approval tracking system.',
  'free-api-hub': 'Curated open developer APIs catalog, mock data endpoints, and interactive REST playground.',
  'spatial-dimensions': 'Interactive 3D web spatial canvas with motion dimensions and reactive sound engine.',
  'college-management-system': 'Campus hostel management, student attendance, room allocation directory, and billing workflows.',
  'globalpulse-ai': 'Real-time international news aggregator and breaking alerts synthesizer powered by Gemini AI.',
  'postcraft-ai': 'Multi-platform social media post generation, smart publishing scheduler, and AI marketing assistant.',
  'home-management': 'Unified household document vault, warranty lifecycle tracker, spatial room inventory, maintenance logs, and utility telemetry OS.',
};

export const PROJECT_TAGS: Record<string, string[]> = {
  'apexmind-ai': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'Gemini AI'],
  'sonikoma': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'Voice AI'],
  'outpass-system': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'SQLite'],
  'free-api-hub': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'REST APIs'],
  'spatial-dimensions': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', '3D Web'],
  'college-management-system': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'SQLite'],
  'globalpulse-ai': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'Gemini AI'],
  'postcraft-ai': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'GenAI'],
  'home-management': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'SQLite'],
};

export const PROJECT_FEATURES_MAP: Record<string, string[]> = {
  'apexmind-ai': [
    'Automated motivational quote script generation powered by Google Gemini AI',
    'High-fidelity voiceover synthesis via Gemini Text-to-Speech audio engine',
    'Media asset catalog with background music and cinematic video clips',
    'Direct YouTube channel OAuth connection and automated video upload pipeline',
    'Quote memory persistence and deduplication datastore in SQLite',
    'Real-time WebSocket notification hub for video rendering progress',
  ],
  'sonikoma': [
    'Universal comic & webtoon automated chapter scraper across major portals',
    'Dual-core OpenCV contour clustering + YOLOv8 neural panel segmentation',
    'Speech bubble detection, OCR extraction, and character dialogue assignment',
    'Multilingual character voice dubbing with Edge-TTS, ElevenLabs, and Gemini Audio',
    'Professional multi-track timeline video editor with Remotion, Fabric.js, and Three.js',
    'Automated 9:16 vertical Shorts and 16:9 cinematic video export presets',
  ],
  'outpass-system': [
    'Student digital gate pass and leave request submission portal with mobile PWA',
    'Warden administrative review, parent SMS verification, and approval workflow',
    'Dynamic QR-code generation for security guard exit and entry validation',
    'Real-time student status tracking (In Campus / On Leave / Overdue Alert)',
    'Full SQLite relational persistence with SQLAlchemy 2.0 ORM models',
    'Automated audit logs capturing all gate entries and warden decisions',
  ],
  'free-api-hub': [
    'Curated catalog of 50+ open developer APIs organized by category',
    'Interactive in-browser REST API testing playground with live response inspector',
    'Embedded mock data server for rapid local frontend prototyping',
    'Zero-configuration endpoints with CORS pre-configured for browser calls',
    'Docker containerization support for local team deployment',
  ],
  'spatial-dimensions': [
    'Interactive 3D WebGL spatial canvas with physics-based animations',
    'Fluid camera orbit, pan, and perspective depth navigation',
    'Custom procedural shaders with dynamic lighting reflections',
    'Reactive audio engine synchronized with canvas interactions',
    'JSONL inquiries datastore for client communication captures',
  ],
  'college-management-system': [
    'Campus hostel block and room allocation directory with capacity counters',
    'Student check-in, digital attendance verification, and biometric registry',
    'Mess meal schedule management and automated monthly billing statements',
    'Role-based dashboard for Wardens, Caretakers, and Department Administrators',
    'Ultra-fast embedded SQLite persistence powered by better-sqlite3',
  ],
  'globalpulse-ai': [
    'Real-time international news wire aggregator across 12 topic categories',
    'Gemini AI news synthesis, multi-source fact cross-referencing, and TL;DR summaries',
    'Breaking news alert notifications and sentiment trend scoring',
    'Persistent offline cache powered by Python aiosqlite',
    'Modern React 19 + Vite 8 + Tailwind CSS v4 layout with client routing',
  ],
  'postcraft-ai': [
    'AI marketing copy generator optimized for Twitter/X, LinkedIn, and Instagram',
    'Multi-platform character limit validation and hashtag recommendations',
    'Smart publishing calendar with scheduled queue management',
    'Visual post preview card mimicking actual social platform layouts',
    'Unified React 19 + Vite 8 + Tailwind CSS v4 architecture with dedicated API server',
  ],
  'home-management': [
    'Automated document indexing, metadata extraction, and ASN assignment',
    'Warranty lifecycle countdowns, expiration alerts, and 1-click insurance claim packets',
    'Spatial room & floor valuation tracking with garage fleet service history',
    'Preventive maintenance scheduling, vendor directory, and emergency utility shutoff coordinates',
    'High-performance SQLite WAL persistence across 40+ household API endpoints',
  ],
};
