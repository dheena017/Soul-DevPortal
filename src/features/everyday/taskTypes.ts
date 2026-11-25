export type TaskPriority = 'high' | 'medium' | 'low';
export type TaskStatus = 'todo' | 'doing' | 'done';
export type TaskRepeat = 'none' | 'daily' | 'weekly' | 'monthly';
export type TaskEnergy = 'low' | 'normal' | 'deep';
export type TaskFilter =
  | 'all'
  | 'starred'
  | 'today'
  | 'overdue'
  | 'doing'
  | 'upcoming'
  | 'high'
  | 'quick'
  | 'recurring'
  | 'completed'
  | 'archived';
export type TaskLayout = 'list' | 'board' | 'matrix' | 'timeline';
export type TaskSort = 'smart' | 'due' | 'priority' | 'shortest' | 'longest' | 'newest' | 'title';
export type TaskGroupBy = 'none' | 'category' | 'priority' | 'due';

export interface TaskSubItem {
  id: string;
  text: string;
  done: boolean;
}

export interface HumanTask {
  id: string;
  title: string;
  done: boolean;
  status?: TaskStatus;
  priority: TaskPriority;
  category: string;
  dueDate: string; // YYYY-MM-DD or ''
  dueTime?: string; // HH:MM or ''
  repeat?: TaskRepeat;
  starred?: boolean;
  estimateMin?: number;
  spentMin?: number;
  energy?: TaskEnergy;
  tags?: string[];
  projectId?: string;
  blockedById?: string;
  archived?: boolean;
  completedAt?: string;
  notes: string;
  subtasks: TaskSubItem[];
  createdAt: string;
}

export interface TaskTemplate {
  id: string;
  name: string;
  icon: string;
  title: string;
  priority: TaskPriority;
  category: string;
  repeat: TaskRepeat;
  estimateMin: number;
  energy: TaskEnergy;
  tags: string[];
  notes: string;
  subtasks: string[];
  isCustom?: boolean;
}

export interface TaskPreferences {
  dailyCapacityMin: number;
  customCategories: string[];
  customTemplates: TaskTemplate[];
}

export const DEFAULT_CATEGORIES = ['Personal', 'Work', 'Health', 'Learning', 'Home', 'Errands'];

export const DEFAULT_TASK_PREFS: TaskPreferences = {
  dailyCapacityMin: 240,
  customCategories: [],
  customTemplates: [],
};

export const TASK_PREFS_STORAGE_KEY = 'soul-tasks-prefs-v1';

export const STARTER_TASK_TEMPLATES: TaskTemplate[] = [
  {
    id: 'tpl-morning',
    name: 'Morning Focus Routine',
    icon: '☀️',
    title: 'Morning planning & top 3 daily priorities',
    priority: 'high',
    category: 'Personal',
    repeat: 'daily',
    estimateMin: 20,
    energy: 'normal',
    tags: ['Routine', 'Focus'],
    notes: 'Set clear intention before opening notifications.',
    subtasks: [
      'Drink a glass of water & stretch 5m',
      'Review calendar & overdue items',
      'Star the top 3 priorities for today',
    ],
  },
  {
    id: 'tpl-deep-work',
    name: 'Deep Work Sprint (50m)',
    icon: '🔥',
    title: 'Deep focus build block — single task only',
    priority: 'high',
    category: 'Work',
    repeat: 'none',
    estimateMin: 50,
    energy: 'deep',
    tags: ['DeepWork'],
    notes: 'Silence distractions and ship one meaningful milestone.',
    subtasks: [
      'Define exact deliverable for this 50m block',
      'Close unrelated tabs & mute notifications',
      'Run verification & capture next step note',
    ],
  },
  {
    id: 'tpl-weekly-review',
    name: 'Weekly Reset & Review',
    icon: '🧹',
    title: 'Weekly workspace, tasks & notes reset',
    priority: 'medium',
    category: 'Personal',
    repeat: 'weekly',
    estimateMin: 30,
    energy: 'normal',
    tags: ['Review'],
    notes: 'Archive completed items and schedule next week.',
    subtasks: [
      'Clear inbox & triage unscheduled tasks',
      'Archive finished tasks from this week',
      'Pick top 3 goals for next week',
    ],
  },
  {
    id: 'tpl-errands',
    name: 'Quick Errands & Supplies',
    icon: '🛒',
    title: 'Groceries, bills & household errands run',
    priority: 'medium',
    category: 'Errands',
    repeat: 'none',
    estimateMin: 35,
    energy: 'low',
    tags: ['Errand'],
    notes: 'Batch quick offline chores into one trip.',
    subtasks: [
      'Check pantry & essentials list',
      'Verify pending bills or renewals',
      'Pick up supplies & store receipts',
    ],
  },
  {
    id: 'tpl-ship-release',
    name: 'App Release Checklist',
    icon: '🚀',
    title: 'Pre-release audit, build & endpoint check',
    priority: 'high',
    category: 'Work',
    repeat: 'none',
    estimateMin: 45,
    energy: 'deep',
    tags: ['Release', 'QA'],
    notes: 'Standard Three-Pillar verification before shipping.',
    subtasks: [
      'Run tsc --noEmit & vite build',
      'Verify FastAPI endpoints & SQLite WAL mode',
      'Test UI responsiveness & dark theme contrast',
    ],
  },
];

export function todayIso(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function offsetDateIso(days: number, baseIso?: string): string {
  const d = baseIso ? new Date(`${baseIso}T12:00:00`) : new Date();
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function addMonthsIso(months: number, baseIso?: string): string {
  const d = baseIso ? new Date(`${baseIso}T12:00:00`) : new Date();
  d.setMonth(d.getMonth() + months);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function resolveStatus(task: HumanTask): TaskStatus {
  if (task.done) return 'done';
  if (task.status === 'doing') return 'doing';
  return 'todo';
}

export function formatDueBadge(dueDate: string, dueTime?: string): { label: string; tone: string } | null {
  if (!dueDate) return null;
  const today = todayIso();
  const tomorrow = offsetDateIso(1);
  const timeSuffix = dueTime ? ` · ${dueTime}` : '';
  if (dueDate < today) {
    return {
      label: `Overdue · ${dueDate}${timeSuffix}`,
      tone: 'bg-rose-500/15 border-rose-500/35 text-rose-300',
    };
  }
  if (dueDate === today) {
    return { label: `Today${timeSuffix}`, tone: 'bg-sky-500/15 border-sky-400/35 text-sky-300' };
  }
  if (dueDate === tomorrow) {
    return { label: `Tomorrow${timeSuffix}`, tone: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-300' };
  }
  return { label: `${dueDate}${timeSuffix}`, tone: 'bg-white/[0.05] border-white/[0.1] text-zinc-300' };
}

export function priorityStyle(priority: TaskPriority): string {
  if (priority === 'high') return 'bg-rose-500/15 border-rose-500/35 text-rose-300';
  if (priority === 'medium') return 'bg-amber-500/15 border-amber-500/35 text-amber-300';
  return 'bg-zinc-500/15 border-zinc-500/30 text-zinc-300';
}

export function energyMeta(energy?: TaskEnergy): { label: string; badge: string } {
  if (energy === 'deep') {
    return { label: '🔥 Deep', badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300' };
  }
  if (energy === 'low') {
    return { label: '🔋 Low Energy', badge: 'bg-emerald-500/12 border-emerald-500/25 text-emerald-300' };
  }
  return { label: '⚡ Normal', badge: 'bg-white/[0.04] border-white/[0.08] text-zinc-400' };
}

export function buildStarterTasks(): HumanTask[] {
  const now = new Date().toISOString();
  return [
    {
      id: 'starter-1',
      title: 'Review today’s priorities & top 3 goals',
      done: false,
      status: 'doing',
      priority: 'high',
      category: 'Personal',
      dueDate: todayIso(),
      dueTime: '09:30',
      repeat: 'daily',
      starred: true,
      estimateMin: 15,
      spentMin: 5,
      energy: 'normal',
      tags: ['Focus', 'Morning'],
      notes: 'Keep focus on what moves the needle most today.',
      subtasks: [
        { id: 'st-1', text: 'Pick top focus task for morning block', done: true },
        { id: 'st-2', text: 'Check calendar events & reminders', done: false },
      ],
      createdAt: now,
    },
    {
      id: 'starter-2',
      title: 'Take a 20-minute walk & stretch break',
      done: false,
      status: 'todo',
      priority: 'medium',
      category: 'Health',
      dueDate: todayIso(),
      repeat: 'daily',
      starred: false,
      estimateMin: 20,
      energy: 'low',
      tags: ['Wellness'],
      notes: '',
      subtasks: [],
      createdAt: now,
    },
    {
      id: 'starter-3',
      title: 'Organize notes and plan tomorrow evening',
      done: false,
      status: 'todo',
      priority: 'low',
      category: 'Home',
      dueDate: offsetDateIso(1),
      repeat: 'none',
      starred: false,
      estimateMin: 15,
      energy: 'low',
      tags: ['Planning'],
      notes: '',
      subtasks: [],
      createdAt: now,
    },
  ];
}

export interface ParsedSmartTokens {
  cleanTitle: string;
  priority?: TaskPriority;
  dueDate?: string;
  dueTime?: string;
  estimateMin?: number;
  category?: string;
  tags: string[];
  repeat?: TaskRepeat;
  energy?: TaskEnergy;
}

/**
 * Parses lightweight inline shortcuts from a quick-add task title:
 * - !high / !med / !low
 * - @today / @tomorrow / @nextweek / @YYYY-MM-DD / @14:30
 * - ~15m / ~1h / ~45m
 * - *daily / *weekly / *monthly
 * - ^deep / ^low / ^normal
 * - #TagOrCategory
 */
export function parseSmartTaskInput(
  raw: string,
  knownCategories: string[] = DEFAULT_CATEGORIES
): ParsedSmartTokens {
  let text = raw;
  const result: ParsedSmartTokens = { cleanTitle: raw.trim(), tags: [] };

  const priMatch = text.match(/(?:^|\s)!(high|medium|med|low)\b/i);
  if (priMatch) {
    const val = priMatch[1].toLowerCase();
    result.priority = val === 'med' ? 'medium' : (val as TaskPriority);
    text = text.replace(priMatch[0], ' ');
  }

  const repeatMatch = text.match(/(?:^|\s)\*(daily|weekly|monthly)\b/i);
  if (repeatMatch) {
    result.repeat = repeatMatch[1].toLowerCase() as TaskRepeat;
    text = text.replace(repeatMatch[0], ' ');
  }

  const energyMatch = text.match(/(?:^|\s)\^(deep|low|normal)\b/i);
  if (energyMatch) {
    result.energy = energyMatch[1].toLowerCase() as TaskEnergy;
    text = text.replace(energyMatch[0], ' ');
  }

  const estMatch = text.match(/(?:^|\s)~(\d+)\s*(m|min|h|hr)\b/i);
  if (estMatch) {
    const num = parseInt(estMatch[1], 10);
    const unit = estMatch[2].toLowerCase();
    if (num > 0) {
      result.estimateMin = unit.startsWith('h') ? num * 60 : num;
    }
    text = text.replace(estMatch[0], ' ');
  }

  const dateTokens = [...text.matchAll(/(?:^|\s)@(today|tomorrow|nextweek|\d{4}-\d{2}-\d{2}|\d{1,2}:\d{2})\b/gi)];
  for (const m of dateTokens) {
    const token = m[1].toLowerCase();
    if (token === 'today') result.dueDate = todayIso();
    else if (token === 'tomorrow') result.dueDate = offsetDateIso(1);
    else if (token === 'nextweek') result.dueDate = offsetDateIso(7);
    else if (/^\d{4}-\d{2}-\d{2}$/.test(token)) result.dueDate = token;
    else if (/^\d{1,2}:\d{2}$/.test(token)) {
      const [hh, mm] = token.split(':');
      result.dueTime = `${hh.padStart(2, '0')}:${mm}`;
    }
    text = text.replace(m[0], ' ');
  }

  const hashTokens = [...text.matchAll(/(?:^|\s)#([A-Za-z0-9_-]+)/g)];
  for (const m of hashTokens) {
    const tag = m[1];
    const matchedCategory = knownCategories.find((c) => c.toLowerCase() === tag.toLowerCase());
    if (matchedCategory && !result.category) {
      result.category = matchedCategory;
    } else if (!result.tags.includes(tag)) {
      result.tags.push(tag);
    }
    text = text.replace(m[0], ' ');
  }

  result.cleanTitle = text.replace(/\s+/g, ' ').trim();
  return result;
}

export function getEisenhowerQuadrant(task: HumanTask, today: string): 'do' | 'schedule' | 'quick' | 'later' {
  const isUrgent = Boolean(task.dueDate) && task.dueDate <= today;
  const isImportant = task.priority === 'high' || Boolean(task.starred);
  const isQuick = (task.estimateMin ?? 25) <= 15 && task.priority !== 'high';

  if (isImportant && (isUrgent || task.priority === 'high')) return 'do';
  if (isImportant || (task.priority === 'medium' && Boolean(task.dueDate) && task.dueDate > today)) return 'schedule';
  if (isQuick || isUrgent) return 'quick';
  return 'later';
}

export function formatMinutes(totalMins: number): string {
  if (!totalMins || totalMins <= 0) return '0m';
  const h = Math.floor(totalMins / 60);
  const m = totalMins % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}
