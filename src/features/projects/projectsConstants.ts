export const DEFAULT_PROJECT_FRAMEWORK_OPTIONS = ['all', 'React 19', 'Vite 8', 'Tailwind v4', 'FastAPI'] as const;

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
  'apexmind-ai': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'Gemini AI'],
  'sonikoma': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'Voice AI'],
  'outpass-system': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'SQLite'],
  'free-api-hub': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'REST APIs'],
  'spatial-dimensions': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', '3D Web'],
  'college-management-system': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'SQLite'],
  'globalpulse-ai': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'Gemini AI'],
  'postcraft-ai': ['React 19', 'FastAPI', 'Vite 8', 'Tailwind v4', 'GenAI'],
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
};
