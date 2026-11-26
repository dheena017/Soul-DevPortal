export type AvailabilityStatus = 'available' | 'focus' | 'building' | 'offline';

export interface DeveloperProfileData {
  displayName: string;
  handle: string;
  role: string;
  bio: string;
  location: string;
  timezone: string;
  email: string;
  githubUrl: string;
  websiteUrl: string;
  avatarEmoji: string;
  accentColor: string;
  status: AvailabilityStatus;
  skills: string[];
  pinnedNotes: string;
  defaultLandingView: string;
  showHostMetricsInHeader: boolean;
}

export const PROFILE_STORAGE_KEY = 'soul-devportal-profile-v1';

export const DEFAULT_DEVELOPER_PROFILE: DeveloperProfileData = {
  displayName: 'Dheena',
  handle: '@dheena017',
  role: 'Full-Stack & AI Systems Developer',
  bio: 'Building modular React 19 + FastAPI micro-apps, developer tooling, and local-first AI workflows inside the Soul Workspace monorepo.',
  location: 'India',
  timezone:
    typeof Intl !== 'undefined'
      ? Intl.DateTimeFormat().resolvedOptions().timeZone || 'Asia/Kolkata'
      : 'Asia/Kolkata',
  email: '',
  githubUrl: 'https://github.com/dheena017/Soul-DevPortal',
  websiteUrl: '',
  avatarEmoji: '⚡',
  accentColor: '#38bdf8',
  status: 'building',
  skills: [
    'React 19',
    'TypeScript',
    'Vite 8',
    'Tailwind CSS v4',
    'Python',
    'FastAPI',
    'SQLite',
    'Electron',
    'Gemini AI',
  ],
  pinnedNotes:
    'Keep port ranges isolated (:5173–:5182 client / :8000–:8009 server) and route all API calls through /api.',
  defaultLandingView: 'overview',
  showHostMetricsInHeader: true,
};

export const AVAILABILITY_OPTIONS: Array<{
  id: AvailabilityStatus;
  label: string;
  dotClass: string;
  pillClass: string;
}> = [
  {
    id: 'available',
    label: 'Available',
    dotClass: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.75)]',
    pillClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  {
    id: 'building',
    label: 'Building',
    dotClass: 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.75)]',
    pillClass: 'bg-sky-500/15 text-sky-300 border-sky-400/30',
  },
  {
    id: 'focus',
    label: 'Deep Focus',
    dotClass: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.75)]',
    pillClass: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  {
    id: 'offline',
    label: 'Offline',
    dotClass: 'bg-zinc-500',
    pillClass: 'bg-zinc-500/15 text-zinc-400 border-zinc-500/30',
  },
];

export const AVATAR_EMOJI_PRESETS = ['⚡', '🧠', '🚀', '🛠️', '🌌', '🔥', '💎', '🦊', '👾', '🎯'];

export const ACCENT_COLOR_PRESETS = [
  '#38bdf8',
  '#34d399',
  '#a855f7',
  '#f59e0b',
  '#ec4899',
  '#6366f1',
];

export function loadDeveloperProfile(): DeveloperProfileData {
  if (typeof window === 'undefined') return DEFAULT_DEVELOPER_PROFILE;
  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY);
    if (!raw) return DEFAULT_DEVELOPER_PROFILE;
    const parsed = JSON.parse(raw) as Partial<DeveloperProfileData>;
    return {
      ...DEFAULT_DEVELOPER_PROFILE,
      ...parsed,
      skills: Array.isArray(parsed.skills) ? parsed.skills : DEFAULT_DEVELOPER_PROFILE.skills,
    };
  } catch {
    return DEFAULT_DEVELOPER_PROFILE;
  }
}

export function saveDeveloperProfile(profile: DeveloperProfileData): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    window.dispatchEvent(new CustomEvent('soul-profile-updated', { detail: profile }));
  } catch {
    // ignore storage quota errors
  }
}

export function getInitials(name: string): string {
  const parts = (name || 'D')
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length === 0) return 'D';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
}
