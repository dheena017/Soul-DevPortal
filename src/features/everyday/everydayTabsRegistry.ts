export type EverydayTabId =
  | 'overview'
  | 'tasks'
  | 'notes'
  | 'schedule'
  | 'focus'
  | 'habits'
  | 'goals'
  | 'health'
  | 'budget'
  | 'finance'
  | 'calculators'
  | 'worldtime'
  | 'vault'
  | 'checklists'
  | 'textlab';

export type EverydayTabGroupId = 'command' | 'wellness' | 'finance' | 'timedev';

export interface EverydayTabMeta {
  id: EverydayTabId;
  group: EverydayTabGroupId;
  icon: string;
  label: string;
  shortLabel: string;
  subtitle: string;
  accentText: string;
  accentBadge: string;
  activeBorder: string;
  keywords: string[];
}

export const EVERYDAY_TAB_GROUPS: Array<{ id: EverydayTabGroupId; label: string }> = [
  { id: 'command', label: 'Daily Productivity' },
  { id: 'wellness', label: 'Focus, Habits & Health' },
  { id: 'finance', label: 'Budget, Finance & Math' },
  { id: 'timedev', label: 'Time, Lists & Dev Tools' },
];

export const EVERYDAY_TABS: EverydayTabMeta[] = [
  {
    id: 'overview',
    group: 'command',
    icon: '🧭',
    label: 'Daily Overview',
    shortLabel: 'Daily Overview',
    subtitle: 'Unified daily summary, quick task or note capture & tool shortcuts',
    accentText: 'text-sky-300',
    accentBadge: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    activeBorder: 'border-sky-400/45 bg-sky-500/10',
    keywords: ['today', 'home', 'summary', 'dashboard', 'quick', 'daily'],
  },
  {
    id: 'tasks',
    group: 'command',
    icon: '✅',
    label: 'Tasks & Planner',
    shortLabel: 'Tasks & Planner',
    subtitle: 'List, Kanban Board, Eisenhower Matrix, Timeline & Task Focus Timer',
    accentText: 'text-emerald-300',
    accentBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    activeBorder: 'border-emerald-400/45 bg-emerald-500/10',
    keywords: ['todo', 'kanban', 'board', 'matrix', 'planner', 'subtasks', 'checklist'],
  },
  {
    id: 'notes',
    group: 'command',
    icon: '📝',
    label: 'Notes & Journal',
    shortLabel: 'Notes & Journal',
    subtitle: 'Markdown notebooks, clickable checklists, tags & sticky cards',
    accentText: 'text-sky-300',
    accentBadge: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    activeBorder: 'border-sky-400/45 bg-sky-500/10',
    keywords: ['markdown', 'journal', 'writing', 'notebook', 'wiki', 'sticky'],
  },
  {
    id: 'schedule',
    group: 'command',
    icon: '📅',
    label: 'Day & Week Routine Planner',
    shortLabel: 'Day & Week',
    subtitle: 'Time-block hourly day schedule, meal matrix & weekly routines',
    accentText: 'text-indigo-300',
    accentBadge: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
    activeBorder: 'border-indigo-400/45 bg-indigo-500/10',
    keywords: ['schedule', 'timeblock', 'routine', 'meals', 'calendar', 'agenda', 'week'],
  },
  {
    id: 'focus',
    group: 'wellness',
    icon: '⏱️',
    label: 'Focus Timer, Soundscapes & Breathing',
    shortLabel: 'Focus & Audio',
    subtitle: 'Pomodoro focus timer, lap stopwatch, ambient soundscapes & calm breathing',
    accentText: 'text-amber-300',
    accentBadge: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    activeBorder: 'border-amber-400/45 bg-amber-500/10',
    keywords: ['pomodoro', 'timer', 'stopwatch', 'breathing', 'ambient', 'sound', 'noise', 'deep work'],
  },
  {
    id: 'habits',
    group: 'wellness',
    icon: '🌱',
    label: 'Habits, Mood & Hydration',
    shortLabel: 'Habits & Water',
    subtitle: '7-day habit streaks, daily mood reflection & water intake tracker',
    accentText: 'text-emerald-300',
    accentBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    activeBorder: 'border-emerald-400/45 bg-emerald-500/10',
    keywords: ['streak', 'mood', 'water', 'hydration', 'routine', 'journal'],
  },
  {
    id: 'goals',
    group: 'wellness',
    icon: '🎯',
    label: 'Goals & Countdowns',
    shortLabel: 'Goals & Dates',
    subtitle: 'Personal milestone trackers, saved event countdowns & age calculator',
    accentText: 'text-purple-300',
    accentBadge: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    activeBorder: 'border-purple-400/45 bg-purple-500/10',
    keywords: ['milestone', 'countdown', 'date', 'target', 'deadline', 'calendar'],
  },
  {
    id: 'health',
    group: 'wellness',
    icon: '🩺',
    label: 'Health, BMI, Calories & Sleep',
    shortLabel: 'Health & Sleep',
    subtitle: 'BMI healthy weight checker, daily calorie/macro planner & 90m sleep cycles',
    accentText: 'text-rose-300',
    accentBadge: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    activeBorder: 'border-rose-400/45 bg-rose-500/10',
    keywords: ['bmi', 'calories', 'macros', 'protein', 'sleep', 'health', 'fitness', 'bmr', 'tdee'],
  },
  {
    id: 'budget',
    group: 'finance',
    icon: '💰',
    label: 'Expenses & Budget',
    shortLabel: 'Expenses & Budget',
    subtitle: 'Monthly spending cap, category breakdown & CSV expense export',
    accentText: 'text-emerald-300',
    accentBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    activeBorder: 'border-emerald-400/45 bg-emerald-500/10',
    keywords: ['money', 'finance', 'spend', 'wallet', 'csv', 'receipts'],
  },
  {
    id: 'finance',
    group: 'finance',
    icon: '🏦',
    label: 'EMI Loan, SIP & 50/30/20 Lab',
    shortLabel: 'EMI & SIP Lab',
    subtitle: 'Loan EMI calculator, compound SIP wealth projector & 50/30/20 income rule',
    accentText: 'text-sky-300',
    accentBadge: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    activeBorder: 'border-sky-400/45 bg-sky-500/10',
    keywords: ['emi', 'loan', 'sip', 'compound', 'interest', 'salary', 'budget', 'invest'],
  },
  {
    id: 'calculators',
    group: 'finance',
    icon: '⚖️',
    label: 'Calculators & Unit Converters',
    shortLabel: 'Units & Tip',
    subtitle: 'Multi-unit converter, split bill & tip calculator & discount math',
    accentText: 'text-sky-300',
    accentBadge: 'bg-sky-500/15 border-sky-400/30 text-sky-300',
    activeBorder: 'border-sky-400/45 bg-sky-500/10',
    keywords: ['units', 'length', 'weight', 'temperature', 'tip', 'split', 'discount', 'percent'],
  },
  {
    id: 'worldtime',
    group: 'timedev',
    icon: '🌍',
    label: 'World Clock & Time Zones',
    shortLabel: 'World Clock',
    subtitle: '10 global cities, hour-shift meeting planner & copy schedule',
    accentText: 'text-indigo-300',
    accentBadge: 'bg-indigo-500/15 border-indigo-400/30 text-indigo-300',
    activeBorder: 'border-indigo-400/45 bg-indigo-500/10',
    keywords: ['timezone', 'utc', 'ist', 'clock', 'schedule', 'cities'],
  },
  {
    id: 'vault',
    group: 'timedev',
    icon: '🔖',
    label: 'Bookmarks, Passwords & Quick Pad',
    shortLabel: 'Bookmarks & Vault',
    subtitle: 'Quick links manager, password generator, decision picker & scratchpad',
    accentText: 'text-amber-300',
    accentBadge: 'bg-amber-500/15 border-amber-400/30 text-amber-300',
    activeBorder: 'border-amber-400/45 bg-amber-500/10',
    keywords: ['links', 'bookmarks', 'password', 'passphrase', 'decision', 'tally', 'scratchpad'],
  },
  {
    id: 'checklists',
    group: 'timedev',
    icon: '🛒',
    label: 'Shopping, Packing & Reading Queue',
    shortLabel: 'Checklists & Reading',
    subtitle: 'Reusable grocery/travel checklists & books, courses & movies queue',
    accentText: 'text-emerald-300',
    accentBadge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    activeBorder: 'border-emerald-400/45 bg-emerald-500/10',
    keywords: ['shopping', 'groceries', 'packing', 'travel', 'books', 'movies', 'reading', 'courses'],
  },
  {
    id: 'textlab',
    group: 'timedev',
    icon: '🧪',
    label: 'Text, Regex, Diff & Dev Lab',
    shortLabel: 'Text & Dev Lab',
    subtitle: 'Case converter, JSON formatter, Base64/URL, Epoch, UUID, Color, Regex & Diff',
    accentText: 'text-purple-300',
    accentBadge: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    activeBorder: 'border-purple-400/45 bg-purple-500/10',
    keywords: ['json', 'base64', 'url', 'uuid', 'timestamp', 'color', 'regex', 'diff', 'text'],
  },
];

export const EVERYDAY_TAB_ID_SET = new Set<string>(EVERYDAY_TABS.map((t) => t.id));

export const EVERYDAY_ROUTE_ALIASES = new Set<string>([
  'everyday',
  'everyday-utilities',
  'utilities',
  'tasks',
  'notes',
  'schedule',
  'planner',
  'routine',
  'tools',
  'focus',
  'habits',
  'goals',
  'health',
  'bmi',
  'sleep',
  'budget',
  'expenses',
  'finance',
  'emi',
  'sip',
  'loan',
  'calculators',
  'converters',
  'worldtime',
  'vault',
  'bookmarks',
  'checklists',
  'shopping',
  'packing',
  'reading',
  'textlab',
  'devlab',
]);

export function isEverydayRoute(routeId: string): boolean {
  const clean = (routeId || '').trim().toLowerCase();
  if (!clean) return false;
  if (clean.startsWith('everyday/')) return true;
  return EVERYDAY_ROUTE_ALIASES.has(clean);
}

export function resolveEverydayRouteToTab(routeId: string): EverydayTabId {
  const clean = (routeId || '').trim().toLowerCase();
  if (clean.startsWith('everyday/')) {
    const sub = clean.slice('everyday/'.length);
    if (EVERYDAY_TAB_ID_SET.has(sub)) return sub as EverydayTabId;
  }
  switch (clean) {
    case 'tasks':
      return 'tasks';
    case 'notes':
      return 'notes';
    case 'schedule':
    case 'planner':
    case 'routine':
      return 'schedule';
    case 'tools':
    case 'focus':
      return 'focus';
    case 'habits':
      return 'habits';
    case 'goals':
      return 'goals';
    case 'health':
    case 'bmi':
    case 'sleep':
      return 'health';
    case 'budget':
    case 'expenses':
      return 'budget';
    case 'finance':
    case 'emi':
    case 'sip':
    case 'loan':
      return 'finance';
    case 'calculators':
    case 'converters':
      return 'calculators';
    case 'worldtime':
      return 'worldtime';
    case 'vault':
    case 'bookmarks':
    case 'utilities':
      return 'vault';
    case 'checklists':
    case 'shopping':
    case 'packing':
    case 'reading':
      return 'checklists';
    case 'textlab':
    case 'devlab':
      return 'textlab';
    default:
      return 'overview';
  }
}

export function getEverydayTabMeta(tabId: EverydayTabId): EverydayTabMeta {
  return EVERYDAY_TABS.find((t) => t.id === tabId) || EVERYDAY_TABS[0];
}

export interface HabitItem {
  id: string;
  emoji: string;
  name: string;
  completedDates: string[];
}

export interface HabitsState {
  habits: HabitItem[];
  moodByDate: Record<string, { mood: string; reflection: string }>;
}

export interface FocusState {
  sessionsToday: number;
  minutesToday: number;
  lastDate: string;
}

export interface BookmarkItem {
  id: string;
  title: string;
  url: string;
  category: string;
}

export function getLocalDateIso(offsetDays = 0): string {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export const DEFAULT_HABITS_STATE: HabitsState = {
  habits: [
    { id: 'hab-water', emoji: '💧', name: 'Drink 2L Water', completedDates: [] },
    { id: 'hab-move', emoji: '🏃', name: 'Move or Stretch 20m', completedDates: [] },
    { id: 'hab-read', emoji: '📖', name: 'Read 15 Minutes', completedDates: [] },
    { id: 'hab-plan', emoji: '📝', name: 'Plan Tomorrow', completedDates: [] },
  ],
  moodByDate: {},
};

export const DEFAULT_BOOKMARKS: BookmarkItem[] = [
  { id: 'bm-1', title: 'Google Calendar', url: 'https://calendar.google.com', category: 'Daily' },
  { id: 'bm-2', title: 'Wikipedia', url: 'https://en.wikipedia.org', category: 'Learning' },
  { id: 'bm-3', title: 'GitHub', url: 'https://github.com', category: 'Work' },
];
