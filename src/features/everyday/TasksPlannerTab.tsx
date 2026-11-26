import React, { useEffect, useMemo, useRef, useState } from 'react';
import { HeroArtworkBackdrop } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { copyTextSafe } from '../../utils/clipboard';
import { getSharedAudioContext, playGentleChime } from '../../utils/focusAudio';
import { PROJECT_BRAND_MAP } from '../projects/projectsConstants';
import type { HumanNote } from './NotesJournalTab';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_TASK_PREFS,
  HumanTask,
  STARTER_TASK_TEMPLATES,
  TASK_PREFS_STORAGE_KEY,
  TaskEnergy,
  TaskFilter,
  TaskGroupBy,
  TaskLayout,
  TaskPreferences,
  TaskPriority,
  TaskRepeat,
  TaskSort,
  TaskStatus,
  TaskSubItem,
  TaskTemplate,
  addMonthsIso,
  buildStarterTasks,
  energyMeta,
  formatDueBadge,
  formatMinutes,
  getEisenhowerQuadrant,
  offsetDateIso,
  parseSmartTaskInput,
  priorityStyle,
  resolveStatus,
  todayIso,
} from './taskTypes';
import TaskEditorModal from './TaskEditorModal';
import { TaskInsightsPanel, TaskToolboxModal } from './TaskInsightsPanel';

export type {
  HumanTask,
  TaskEnergy,
  TaskFilter,
  TaskGroupBy,
  TaskLayout,
  TaskPriority,
  TaskRepeat,
  TaskSort,
  TaskStatus,
  TaskSubItem,
};

export interface TasksPlannerTabProps {
  onNavigate: (viewId: string) => void;
  embedded?: boolean;
}

function loadPrefs(): TaskPreferences {
  if (typeof window === 'undefined') return DEFAULT_TASK_PREFS;
  try {
    const raw = window.localStorage.getItem(TASK_PREFS_STORAGE_KEY);
    if (!raw) return DEFAULT_TASK_PREFS;
    const parsed = JSON.parse(raw) as Partial<TaskPreferences>;
    return {
      dailyCapacityMin: typeof parsed.dailyCapacityMin === 'number' ? parsed.dailyCapacityMin : 240,
      customCategories: Array.isArray(parsed.customCategories) ? parsed.customCategories : [],
      customTemplates: Array.isArray(parsed.customTemplates) ? parsed.customTemplates : [],
    };
  } catch {
    return DEFAULT_TASK_PREFS;
  }
}

const TaskSvg: React.FC<{ children: React.ReactNode; className?: string }> = ({
  children,
  className = 'w-3.5 h-3.5 shrink-0',
}) => (
  <svg
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    {children}
  </svg>
);

const TaskChevronDown: React.FC<{ className?: string }> = ({ className = 'w-3.5 h-3.5 text-zinc-400 shrink-0' }) => (
  <TaskSvg className={className}>
    <path d="m6 9 6 6 6-6" />
  </TaskSvg>
);

const TaskSelectBox: React.FC<{
  value: string | number;
  onChange: (value: string) => void;
  ariaLabel: string;
  prefix?: string;
  leading?: React.ReactNode;
  className?: string;
  selectClassName?: string;
  children: React.ReactNode;
}> = ({
  value,
  onChange,
  ariaLabel,
  prefix,
  leading,
  className = 'h-8 rounded-xl bg-[#09090c] border border-white/[0.09] hover:border-white/[0.2]',
  selectClassName = 'text-xs font-medium text-zinc-100',
  children,
}) => (
  <div className={`relative inline-flex items-center transition-colors ${className}`}>
    {leading && <span className="ml-2.5 pointer-events-none shrink-0 flex items-center">{leading}</span>}
    {prefix && (
      <span
        className={`text-[11px] font-mono text-zinc-400 pointer-events-none select-none ${
          leading ? 'pl-1.5' : 'pl-2.5'
        }`}
      >
        {prefix}
      </span>
    )}
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={ariaLabel}
      className={`appearance-none bg-transparent h-full ${
        prefix ? 'pl-1' : leading ? 'pl-1.5' : 'pl-3'
      } pr-7 focus:outline-none cursor-pointer ${selectClassName}`}
    >
      {children}
    </select>
    <TaskChevronDown className="w-3.5 h-3.5 text-zinc-400 absolute right-2 pointer-events-none" />
  </div>
);

function renderTaskLayoutIcon(id: TaskLayout, isActive: boolean) {
  const cls = `w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-300' : 'text-zinc-500'}`;
  switch (id) {
    case 'list':
      return (
        <TaskSvg className={cls}>
          <line x1="8" x2="21" y1="6" y2="6" />
          <line x1="8" x2="21" y1="12" y2="12" />
          <line x1="8" x2="21" y1="18" y2="18" />
          <line x1="3" x2="3.01" y1="6" y2="6" />
          <line x1="3" x2="3.01" y1="12" y2="12" />
          <line x1="3" x2="3.01" y1="18" y2="18" />
        </TaskSvg>
      );
    case 'board':
      return (
        <TaskSvg className={cls}>
          <rect width="18" height="18" x="3" y="3" rx="2" />
          <path d="M9 3v18" />
          <path d="M15 3v18" />
        </TaskSvg>
      );
    case 'matrix':
      return (
        <TaskSvg className={cls}>
          <rect width="7" height="7" x="3" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="3" rx="1.5" />
          <rect width="7" height="7" x="14" y="14" rx="1.5" />
          <rect width="7" height="7" x="3" y="14" rx="1.5" />
        </TaskSvg>
      );
    case 'timeline':
      return (
        <TaskSvg className={cls}>
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
        </TaskSvg>
      );
  }
}

function renderStarterTplIcon(tplId: string) {
  switch (tplId) {
    case 'tpl-morning':
      return (
        <TaskSvg className="w-3.5 h-3.5 text-amber-400">
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2" />
          <path d="M12 20v2" />
          <path d="m4.93 4.93 1.41 1.41" />
          <path d="m17.66 17.66 1.41 1.41" />
          <path d="M2 12h2" />
          <path d="M20 12h2" />
          <path d="m6.34 17.66-1.41 1.41" />
          <path d="m19.07 4.93-1.41 1.41" />
        </TaskSvg>
      );
    case 'tpl-deep-work':
      return (
        <TaskSvg className="w-3.5 h-3.5 text-rose-400">
          <path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" />
        </TaskSvg>
      );
    case 'tpl-weekly-review':
      return (
        <TaskSvg className="w-3.5 h-3.5 text-violet-400">
          <rect width="18" height="18" x="3" y="4" rx="2" />
          <path d="M16 2v4" />
          <path d="M8 2v4" />
          <path d="M3 10h18" />
          <path d="m9 16 2 2 4-4" />
        </TaskSvg>
      );
    case 'tpl-errands':
      return (
        <TaskSvg className="w-3.5 h-3.5 text-emerald-400">
          <circle cx="8" cy="21" r="1" />
          <circle cx="19" cy="21" r="1" />
          <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
        </TaskSvg>
      );
    case 'tpl-ship-release':
      return (
        <TaskSvg className="w-3.5 h-3.5 text-sky-400">
          <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
          <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        </TaskSvg>
      );
    default:
      return (
        <TaskSvg className="w-3.5 h-3.5 text-purple-400">
          <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
        </TaskSvg>
      );
  }
}

export default function TasksPlannerTab({ onNavigate, embedded = false }: TasksPlannerTabProps) {
  const [tasks, setTasks, sync] = useSyncedWorkspaceState<HumanTask[]>('tasks', buildStarterTasks);
  const [, setNotes] = useSyncedWorkspaceState<HumanNote[]>('notes', []);
  const [prefs, setPrefs] = useState<TaskPreferences>(loadPrefs);

  const [layout, setLayout] = useState<TaskLayout>('list');
  const [filter, setFilter] = useState<TaskFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('All');
  const [energyFilter, setEnergyFilter] = useState<'all' | TaskEnergy>('all');
  const [tagFilter, setTagFilter] = useState<string>('All');
  const [sortBy, setSortBy] = useState<TaskSort>('smart');
  const [groupBy, setGroupBy] = useState<TaskGroupBy>('none');
  const [search, setSearch] = useState<string>('');

  // Quick-add composer state
  const [newTitle, setNewTitle] = useState<string>('');
  const [newPriority, setNewPriority] = useState<TaskPriority>('medium');
  const [newCategory, setNewCategory] = useState<string>('Personal');
  const [newDueDate, setNewDueDate] = useState<string>(() => todayIso());
  const [newDueTime, setNewDueTime] = useState<string>('');
  const [newRepeat, setNewRepeat] = useState<TaskRepeat>('none');
  const [newEstimate, setNewEstimate] = useState<number>(25);
  const [newEnergy, setNewEnergy] = useState<TaskEnergy>('normal');
  const [newProjectId, setNewProjectId] = useState<string>('');
  const [newNotes, setNewNotes] = useState<string>('');
  const [showAdvancedAdd, setShowAdvancedAdd] = useState<boolean>(false);
  const [addWarning, setAddWarning] = useState<boolean>(false);

  // Panels, selection & modals
  const [showInsights, setShowInsights] = useState<boolean>(false);
  const [toolboxOpen, setToolboxOpen] = useState<boolean>(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [inlineEditingId, setInlineEditingId] = useState<string | null>(null);
  const [inlineEditingText, setInlineEditingText] = useState<string>('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [subtaskDrafts, setSubtaskDrafts] = useState<Record<string, string>>({});
  const [boardDrafts, setBoardDrafts] = useState<Record<'todo' | 'doing', string>>({ todo: '', doing: '' });
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);
  const [dragOverCol, setDragOverCol] = useState<TaskStatus | null>(null);

  // Multi-select bulk mode
  const [selectMode, setSelectMode] = useState<boolean>(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Live Active Task Focus Timer
  const [focusTaskId, setFocusTaskId] = useState<string | null>(null);
  const [focusTotalSec, setFocusTotalSec] = useState<number>(1500);
  const [focusSecLeft, setFocusSecLeft] = useState<number>(1500);
  const [focusRunning, setFocusRunning] = useState<boolean>(false);
  const [focusElapsedSec, setFocusElapsedSec] = useState<number>(0);
  const focusEndMsRef = useRef<number | null>(null);
  const focusCompletedStampRef = useRef<number | null>(null);

  // Undo & Toast state
  const [undoSnap, setUndoSnap] = useState<{ label: string; prevTasks: HumanTask[] } | null>(null);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const titleInputRef = useRef<HTMLInputElement | null>(null);
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  const today = todayIso();

  useEffect(() => {
    try {
      window.localStorage.setItem(TASK_PREFS_STORAGE_KEY, JSON.stringify(prefs));
    } catch {
      // ignore storage quota errors
    }
  }, [prefs]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    window.setTimeout(() => {
      setToastMsg((cur) => (cur === msg ? null : cur));
    }, 2800);
  };

  const commitWithUndo = (label: string, updater: (prev: HumanTask[]) => HumanTask[]) => {
    setTasks((prev) => {
      setUndoSnap({ label, prevTasks: prev });
      return updater(prev);
    });
  };

  // Keyboard shortcuts: 'n' focuses New Task, '/' focuses Filter Search
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const activeTag = document.activeElement?.tagName || '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(activeTag)) return;
      if (editingTaskId || toolboxOpen) return;
      if (e.key.toLowerCase() === 'n' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        titleInputRef.current?.focus();
      } else if (e.key === '/' && !e.ctrlKey && !e.metaKey) {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [editingTaskId, toolboxOpen]);

  // Live Active Task Focus Timer Tick (StrictMode-safe & drift-free)
  useEffect(() => {
    if (!focusRunning || !focusTaskId) {
      focusEndMsRef.current = null;
      return;
    }
    const endMs = Date.now() + Math.max(1, focusSecLeft) * 1000;
    focusEndMsRef.current = endMs;
    const id = window.setInterval(() => {
      const rem = Math.max(0, Math.ceil((endMs - Date.now()) / 1000));
      setFocusSecLeft(rem);
      setFocusElapsedSec(Math.max(0, focusTotalSec - rem));
    }, 250);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [focusRunning, focusTaskId, focusTotalSec]);

  // Complete task focus sprint cleanly outside state updaters
  useEffect(() => {
    if (!focusRunning || !focusTaskId || focusSecLeft > 0) return;
    const stamp = focusEndMsRef.current ?? Date.now();
    if (focusCompletedStampRef.current === stamp) return;
    focusCompletedStampRef.current = stamp;

    setFocusRunning(false);
    playGentleChime('complete');
    const loggedMins = Math.max(1, Math.round(focusTotalSec / 60));
    setTasks((cur) =>
      cur.map((t) => (t.id === focusTaskId ? { ...t, spentMin: (t.spentMin || 0) + loggedMins } : t))
    );
    showToast(`Focus sprint finished (+${loggedMins}m logged)!`);
  }, [focusRunning, focusTaskId, focusSecLeft, focusTotalSec, setTasks]);

  const categories = useMemo(
    () => Array.from(new Set([...DEFAULT_CATEGORIES, ...prefs.customCategories])),
    [prefs.customCategories]
  );

  const allTags = useMemo(() => {
    const set = new Set<string>();
    tasks.forEach((t) => (t.tags || []).forEach((tag) => set.add(tag)));
    return Array.from(set).sort();
  }, [tasks]);

  const smartPreview = useMemo(
    () => parseSmartTaskInput(newTitle, categories),
    [newTitle, categories]
  );

  const taskMap = useMemo(() => new Map(tasks.map((t) => [t.id, t])), [tasks]);

  const stats = useMemo(() => {
    const nonArchived = tasks.filter((t) => !t.archived);
    const total = nonArchived.length;
    const completed = nonArchived.filter((t) => t.done).length;
    const pending = total - completed;
    const dueToday = nonArchived.filter((t) => !t.done && t.dueDate === today).length;
    const overdue = nonArchived.filter((t) => !t.done && Boolean(t.dueDate) && t.dueDate < today).length;
    const doingCount = nonArchived.filter((t) => !t.done && resolveStatus(t) === 'doing').length;
    const upcomingCount = nonArchived.filter((t) => !t.done && Boolean(t.dueDate) && t.dueDate > today).length;
    const starredOpen = nonArchived.filter((t) => !t.done && Boolean(t.starred)).length;
    const highOpen = nonArchived.filter((t) => !t.done && t.priority === 'high').length;
    const quickCount = nonArchived.filter((t) => !t.done && (t.estimateMin ?? 25) <= 15).length;
    const recurringCount = nonArchived.filter((t) => !t.done && t.repeat && t.repeat !== 'none').length;
    const archivedCount = tasks.filter((t) => Boolean(t.archived)).length;
    const focusMinsLeft = nonArchived.filter((t) => !t.done).reduce((acc, t) => acc + (t.estimateMin || 0), 0);
    const dueTodayMins = nonArchived
      .filter((t) => !t.done && t.dueDate === today)
      .reduce((acc, t) => acc + (t.estimateMin || 20), 0);
    const pct = total > 0 ? Math.round((completed / total) * 100) : 0;
    return {
      total,
      completed,
      pending,
      dueToday,
      overdue,
      doingCount,
      upcomingCount,
      starredOpen,
      highOpen,
      quickCount,
      recurringCount,
      archivedCount,
      focusMinsLeft,
      dueTodayMins,
      pct,
    };
  }, [tasks, today]);

  const visibleTasks = useMemo(() => {
    const needle = search.trim().toLowerCase();
    const list = tasks.filter((task) => {
      if (filter === 'archived') {
        if (!task.archived) return false;
      } else {
        if (task.archived) return false;
        if (filter === 'starred' && (task.done || !task.starred)) return false;
        if (filter === 'today' && (task.done || task.dueDate !== today)) return false;
        if (filter === 'overdue' && (task.done || !task.dueDate || task.dueDate >= today)) return false;
        if (filter === 'doing' && (task.done || resolveStatus(task) !== 'doing')) return false;
        if (filter === 'upcoming' && (task.done || !task.dueDate || task.dueDate <= today)) return false;
        if (filter === 'high' && (task.done || task.priority !== 'high')) return false;
        if (filter === 'quick' && (task.done || (task.estimateMin ?? 25) > 15)) return false;
        if (filter === 'recurring' && (task.done || !task.repeat || task.repeat === 'none')) return false;
        if (filter === 'completed' && !task.done) return false;
      }

      if (categoryFilter !== 'All' && task.category !== categoryFilter) return false;
      if (energyFilter !== 'all' && (task.energy || 'normal') !== energyFilter) return false;
      if (tagFilter !== 'All' && !(task.tags || []).includes(tagFilter)) return false;

      if (needle) {
        const hay = [
          task.title,
          task.category,
          task.notes,
          task.projectId || '',
          ...(task.tags || []),
          ...task.subtasks.map((s) => s.text),
        ]
          .join(' ')
          .toLowerCase();
        if (!hay.includes(needle)) return false;
      }
      return true;
    });

    const pRank: Record<TaskPriority, number> = { high: 0, medium: 1, low: 2 };
    list.sort((a, b) => {
      if (sortBy === 'title') return a.title.localeCompare(b.title);
      if (sortBy === 'newest') return b.createdAt.localeCompare(a.createdAt);
      if (sortBy === 'shortest') return (a.estimateMin ?? 25) - (b.estimateMin ?? 25);
      if (sortBy === 'longest') return (b.estimateMin ?? 25) - (a.estimateMin ?? 25);
      if (sortBy === 'due') {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return (a.dueDate || '9999-12-31').localeCompare(b.dueDate || '9999-12-31');
      }
      if (sortBy === 'priority') {
        if (a.done !== b.done) return a.done ? 1 : -1;
        return pRank[a.priority] - pRank[b.priority];
      }
      // smart rank
      if (a.done !== b.done) return a.done ? 1 : -1;
      if (Boolean(a.starred) !== Boolean(b.starred)) return a.starred ? -1 : 1;
      if (pRank[a.priority] !== pRank[b.priority]) return pRank[a.priority] - pRank[b.priority];
      if (a.dueDate && b.dueDate && a.dueDate !== b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      return b.createdAt.localeCompare(a.createdAt);
    });

    return list;
  }, [tasks, filter, categoryFilter, energyFilter, tagFilter, search, sortBy, today]);

  const handleAddTask = (e: React.FormEvent) => {
    e.preventDefault();
    const parsed = parseSmartTaskInput(newTitle, categories);
    const title = parsed.cleanTitle || newTitle.trim();
    if (!title) {
      setAddWarning(true);
      titleInputRef.current?.focus();
      return;
    }
    setAddWarning(false);
    const finalPriority = parsed.priority || newPriority;
    const next: HumanTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title,
      done: false,
      status: 'todo',
      priority: finalPriority,
      category: parsed.category || newCategory,
      dueDate: parsed.dueDate !== undefined ? parsed.dueDate : newDueDate,
      dueTime: parsed.dueTime || newDueTime || undefined,
      repeat: parsed.repeat || newRepeat,
      starred: finalPriority === 'high',
      estimateMin: parsed.estimateMin || newEstimate,
      energy: parsed.energy || newEnergy,
      tags: parsed.tags,
      projectId: newProjectId || undefined,
      notes: newNotes.trim(),
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [next, ...prev]);
    if (filter !== 'all') setFilter('all');
    if (categoryFilter !== 'All' && categoryFilter !== next.category) setCategoryFilter('All');
    if (search.trim()) setSearch('');
    setNewTitle('');
    setNewNotes('');
  };

  const handleBoardQuickAdd = (status: 'todo' | 'doing') => {
    const raw = (boardDrafts[status] || '').trim();
    if (!raw) return;
    const parsed = parseSmartTaskInput(raw, categories);
    const next: HumanTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: parsed.cleanTitle || raw,
      done: false,
      status,
      priority: parsed.priority || 'medium',
      category: parsed.category || 'Personal',
      dueDate: parsed.dueDate ?? today,
      dueTime: parsed.dueTime,
      repeat: parsed.repeat || 'none',
      starred: parsed.priority === 'high',
      estimateMin: parsed.estimateMin ?? 25,
      energy: parsed.energy || 'normal',
      tags: parsed.tags,
      notes: '',
      subtasks: [],
      createdAt: new Date().toISOString(),
    };
    setTasks((prev) => [next, ...prev]);
    setBoardDrafts((d) => ({ ...d, [status]: '' }));
  };

  const toggleTask = (id: string) => {
    const nowIso = new Date().toISOString();
    setTasks((prev) => {
      const nextList: HumanTask[] = [];
      for (const t of prev) {
        if (t.id !== id) {
          nextList.push(t);
          continue;
        }
        const becomingDone = !t.done;
        nextList.push({
          ...t,
          done: becomingDone,
          status: becomingDone ? 'done' : 'todo',
          completedAt: becomingDone ? nowIso : undefined,
        });
        if (becomingDone && (t.repeat === 'daily' || t.repeat === 'weekly' || t.repeat === 'monthly')) {
          const nextDue =
            t.repeat === 'monthly'
              ? addMonthsIso(1, t.dueDate || today)
              : offsetDateIso(t.repeat === 'daily' ? 1 : 7, t.dueDate || today);
          nextList.unshift({
            ...t,
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            done: false,
            status: 'todo',
            dueDate: nextDue,
            completedAt: undefined,
            subtasks: t.subtasks.map((s) => ({ ...s, done: false })),
            createdAt: nowIso,
          });
        }
      }
      return nextList;
    });
    if (focusTaskId === id) {
      setFocusRunning(false);
    }
  };

  const setTaskStatus = (id: string, status: TaskStatus) => {
    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? { ...t, status, done: status === 'done', completedAt: status === 'done' ? nowIso : undefined }
          : t
      )
    );
  };

  const snoozeTask = (id: string, days = 1) => {
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const base = t.dueDate && t.dueDate >= today ? t.dueDate : today;
        return { ...t, dueDate: offsetDateIso(days, base) };
      })
    );
    showToast(`Snoozed +${days}d`);
  };

  const toggleStar = (id: string) => {
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, starred: !t.starred } : t)));
  };

  const deleteTask = (id: string) => {
    const target = taskMap.get(id);
    commitWithUndo(`Deleted "${target?.title.slice(0, 24) || 'task'}"`, (prev) =>
      prev.filter((t) => t.id !== id)
    );
    if (expandedId === id) setExpandedId(null);
    if (focusTaskId === id) {
      setFocusTaskId(null);
      setFocusRunning(false);
    }
  };

  const saveEditTitle = (id: string) => {
    const clean = inlineEditingText.trim();
    if (clean) {
      setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, title: clean } : t)));
    }
    setInlineEditingId(null);
    setInlineEditingText('');
  };

  const cyclePriority = (id: string) => {
    const order: TaskPriority[] = ['high', 'medium', 'low'];
    setTasks((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const idx = (order.indexOf(t.priority) + 1) % order.length;
        return { ...t, priority: order[idx] };
      })
    );
  };

  const addSubtask = (taskId: string) => {
    const text = (subtaskDrafts[taskId] || '').trim();
    if (!text) return;
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: [
                ...t.subtasks,
                { id: `sub-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`, text, done: false },
              ],
            }
          : t
      )
    );
    setSubtaskDrafts((d) => ({ ...d, [taskId]: '' }));
  };

  const toggleSubtask = (taskId: string, subId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId
          ? {
              ...t,
              subtasks: t.subtasks.map((s) => (s.id === subId ? { ...s, done: !s.done } : s)),
            }
          : t
      )
    );
  };

  const removeSubtask = (taskId: string, subId: string) => {
    setTasks((prev) =>
      prev.map((t) =>
        t.id === taskId ? { ...t, subtasks: t.subtasks.filter((s) => s.id !== subId) } : t
      )
    );
  };

  const startFocusOnTask = (task: HumanTask) => {
    getSharedAudioContext();
    const mins = Math.max(5, task.estimateMin || 25);
    setFocusTaskId(task.id);
    setFocusTotalSec(mins * 60);
    setFocusSecLeft(mins * 60);
    setFocusElapsedSec(0);
    setFocusRunning(true);
    if (!task.done && resolveStatus(task) !== 'doing') {
      setTaskStatus(task.id, 'doing');
    }
  };

  const stopFocusTimer = (logElapsed: boolean) => {
    if (logElapsed && focusTaskId && focusElapsedSec >= 60) {
      const mins = Math.floor(focusElapsedSec / 60);
      setTasks((prev) =>
        prev.map((t) => (t.id === focusTaskId ? { ...t, spentMin: (t.spentMin || 0) + mins } : t))
      );
      showToast(`Logged +${mins}m on focused task`);
    }
    setFocusRunning(false);
    setFocusTaskId(null);
    setFocusElapsedSec(0);
  };

  const handleApplyTemplate = (tpl: TaskTemplate) => {
    const now = new Date().toISOString();
    const created: HumanTask = {
      id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      title: tpl.title,
      done: false,
      status: 'todo',
      priority: tpl.priority,
      category: tpl.category,
      dueDate: today,
      repeat: tpl.repeat,
      starred: tpl.priority === 'high',
      estimateMin: tpl.estimateMin,
      energy: tpl.energy,
      tags: [...tpl.tags],
      notes: tpl.notes,
      subtasks: tpl.subtasks.map((text, idx) => ({
        id: `sub-${Date.now()}-${idx}`,
        text,
        done: false,
      })),
      createdAt: now,
    };
    setTasks((prev) => [created, ...prev]);
    setFilter('all');
    showToast(`Launched template: ${tpl.name}`);
  };

  const handleSaveAsTemplate = (task: HumanTask) => {
    const custom: TaskTemplate = {
      id: `ctpl-${Date.now()}`,
      name: task.title.slice(0, 28),
      icon: '⭐',
      title: task.title,
      priority: task.priority,
      category: task.category,
      repeat: task.repeat || 'none',
      estimateMin: task.estimateMin || 25,
      energy: task.energy || 'normal',
      tags: [...(task.tags || [])],
      notes: task.notes,
      subtasks: task.subtasks.map((s) => s.text),
      isCustom: true,
    };
    setPrefs((p) => ({ ...p, customTemplates: [custom, ...p.customTemplates] }));
    showToast('Saved as reusable template ✓');
  };

  const handleSendTaskToNotes = (task: HumanTask) => {
    const nowIso = new Date().toISOString();
    const mdLines = [
      `# ${task.title}`,
      '',
      `- **Category:** ${task.category}`,
      `- **Priority:** ${task.priority}`,
      task.dueDate ? `- **Due:** ${task.dueDate}${task.dueTime ? ` ${task.dueTime}` : ''}` : '',
      task.notes ? `\n## Details\n${task.notes}` : '',
      task.subtasks.length > 0
        ? `\n## Checklist\n${task.subtasks.map((s) => `- [${s.done ? 'x' : ' '}] ${s.text}`).join('\n')}`
        : '',
    ]
      .filter(Boolean)
      .join('\n');

    const note: HumanNote = {
      id: `note-task-${Date.now()}`,
      title: `Task: ${task.title}`,
      content: mdLines,
      notebook: task.category,
      tags: Array.from(new Set(['Task', ...(task.tags || [])])),
      pinned: false,
      accent: task.priority === 'high' ? 'rose' : 'emerald',
      updatedAt: nowIso,
    };
    setNotes((prev) => [note, ...prev]);
    showToast('Created note in Notes & Journal ✓');
  };

  // Exports
  const downloadBlob = (content: string, mime: string, filename: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const buildMarkdownExport = () =>
    [
      `# Soul DevPortal Tasks (${today})`,
      '',
      ...tasks.map(
        (t) =>
          `- [${t.done ? 'x' : ' '}] ${t.title} (${t.priority}, ${t.category}${
            t.dueDate ? `, due ${t.dueDate}` : ''
          })`
      ),
    ].join('\n');

  const buildCsvExport = () => {
    const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
    return [
      ['Title', 'Status', 'Priority', 'Category', 'DueDate', 'DueTime', 'EstimateMin', 'SpentMin', 'Repeat', 'Tags'].join(','),
      ...tasks.map((t) =>
        [
          esc(t.title),
          esc(resolveStatus(t)),
          esc(t.priority),
          esc(t.category),
          esc(t.dueDate || ''),
          esc(t.dueTime || ''),
          String(t.estimateMin ?? ''),
          String(t.spentMin ?? 0),
          esc(t.repeat || 'none'),
          esc((t.tags || []).join(';')),
        ].join(',')
      ),
    ].join('\n');
  };

  const handleExportMarkdown = () => {
    downloadBlob(buildMarkdownExport(), 'text/markdown;charset=utf-8', `tasks-${today}.md`);
  };

  const handleExportCsv = () => {
    downloadBlob(buildCsvExport(), 'text/csv;charset=utf-8', `tasks-${today}.csv`);
  };

  const handleExportJson = () => {
    downloadBlob(JSON.stringify(tasks, null, 2), 'application/json;charset=utf-8', `tasks-backup-${today}.json`);
  };

  const handleCopyExport = (format: 'md' | 'csv' | 'json') => {
    const payload =
      format === 'md'
        ? buildMarkdownExport()
        : format === 'csv'
        ? buildCsvExport()
        : JSON.stringify(tasks, null, 2);
    void copyTextSafe(payload).then((ok) => {
      showToast(ok ? `Copied ${format.toUpperCase()} export to clipboard ✓` : 'Clipboard unavailable');
    });
  };

  // Bulk Actions
  const toggleSelectId = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const runBulkAction = (action: 'done' | 'today' | 'tomorrow' | 'high' | 'archive' | 'delete') => {
    if (selectedIds.length === 0) return;
    const selectedSet = new Set(selectedIds);
    const nowIso = new Date().toISOString();
    if (action === 'delete') {
      commitWithUndo(`Deleted ${selectedIds.length} tasks`, (prev) => prev.filter((t) => !selectedSet.has(t.id)));
    } else if (action === 'done') {
      commitWithUndo(`Completed ${selectedIds.length} tasks`, (prev) =>
        prev.map((t) => (selectedSet.has(t.id) ? { ...t, done: true, status: 'done', completedAt: nowIso } : t))
      );
    } else if (action === 'today') {
      commitWithUndo(`Moved ${selectedIds.length} tasks to Today`, (prev) =>
        prev.map((t) => (selectedSet.has(t.id) ? { ...t, dueDate: today } : t))
      );
    } else if (action === 'tomorrow') {
      const tmr = offsetDateIso(1);
      commitWithUndo(`Moved ${selectedIds.length} tasks to Tomorrow`, (prev) =>
        prev.map((t) => (selectedSet.has(t.id) ? { ...t, dueDate: tmr } : t))
      );
    } else if (action === 'high') {
      commitWithUndo(`Set ${selectedIds.length} tasks to High`, (prev) =>
        prev.map((t) => (selectedSet.has(t.id) ? { ...t, priority: 'high', starred: true } : t))
      );
    } else if (action === 'archive') {
      commitWithUndo(`Archived ${selectedIds.length} tasks`, (prev) =>
        prev.map((t) => (selectedSet.has(t.id) ? { ...t, archived: true } : t))
      );
    }
    setSelectedIds([]);
    setSelectMode(false);
  };

  // Grouped view data (List View)
  const groupedList = useMemo(() => {
    if (groupBy === 'none') return [{ key: 'all', label: '', items: visibleTasks }];
    const buckets = new Map<string, HumanTask[]>();
    visibleTasks.forEach((task) => {
      let key = task.category;
      if (groupBy === 'priority') key = task.priority.toUpperCase();
      else if (groupBy === 'due') {
        if (!task.dueDate) key = 'No Due Date';
        else if (task.dueDate < today) key = 'Overdue';
        else if (task.dueDate === today) key = 'Today';
        else if (task.dueDate === offsetDateIso(1)) key = 'Tomorrow';
        else key = 'Upcoming';
      }
      const list = buckets.get(key) || [];
      list.push(task);
      buckets.set(key, list);
    });
    return Array.from(buckets.entries()).map(([key, items]) => ({ key, label: key, items }));
  }, [visibleTasks, groupBy, today]);

  // Timeline buckets
  const timelineBuckets = useMemo(() => {
    const tmr = offsetDateIso(1);
    const weekEnd = offsetDateIso(7);
    const activeVisible = visibleTasks.filter((t) => !t.done);
    return [
      { id: 'overdue', title: '⚠️ Overdue', tone: 'border-rose-500/35', items: activeVisible.filter((t) => t.dueDate && t.dueDate < today) },
      { id: 'today', title: '☀️ Today', tone: 'border-sky-400/35', items: activeVisible.filter((t) => t.dueDate === today) },
      { id: 'tomorrow', title: '🌅 Tomorrow', tone: 'border-emerald-500/30', items: activeVisible.filter((t) => t.dueDate === tmr) },
      { id: 'week', title: '📆 Next 7 Days', tone: 'border-purple-500/30', items: activeVisible.filter((t) => t.dueDate > tmr && t.dueDate <= weekEnd) },
      { id: 'later', title: '🗓️ Later', tone: 'border-white/[0.1]', items: activeVisible.filter((t) => t.dueDate > weekEnd) },
      { id: 'unscheduled', title: '📥 Unscheduled Backlog', tone: 'border-white/[0.08]', items: activeVisible.filter((t) => !t.dueDate) },
    ];
  }, [visibleTasks, today]);

  const focusedTask = focusTaskId ? taskMap.get(focusTaskId) || null : null;
  const editingTask = editingTaskId ? taskMap.get(editingTaskId) || null : null;

  const renderTaskCard = (task: HumanTask, compactBoard = false) => {
    const due = formatDueBadge(task.dueDate, task.dueTime);
    const status = resolveStatus(task);
    const isExpanded = expandedId === task.id;
    const subDone = task.subtasks.filter((s) => s.done).length;
    const subPct = task.subtasks.length > 0 ? Math.round((subDone / task.subtasks.length) * 100) : 0;
    const blocker = task.blockedById ? taskMap.get(task.blockedById) : undefined;
    const isBlocked = Boolean(blocker && !blocker.done);
    const projectBrand = task.projectId ? PROJECT_BRAND_MAP[task.projectId] : undefined;
    const energy = energyMeta(task.energy);
    const isSelected = selectedIds.includes(task.id);
    const isFocusing = focusTaskId === task.id;

    return (
      <div
        key={task.id}
        draggable={layout === 'board'}
        onDragStart={() => setDraggedTaskId(task.id)}
        onDragEnd={() => {
          setDraggedTaskId(null);
          setDragOverCol(null);
        }}
        className={`rounded-2xl border p-4 transition-colors ${
          isFocusing
            ? 'bg-[#131622] border-emerald-400/45 shadow-lg'
            : isSelected
            ? 'bg-[#131622] border-sky-400/50'
            : task.done
            ? 'bg-[#0e0f13]/80 border-white/[0.05] opacity-75'
            : status === 'doing'
            ? 'bg-[#131622] border-sky-400/30'
            : 'bg-[#121319] border-white/[0.09] hover:border-white/[0.18]'
        } ${layout === 'board' ? 'cursor-grab active:cursor-grabbing' : ''}`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0 flex-1">
            {selectMode && (
              <input
                type="checkbox"
                checked={isSelected}
                onChange={() => toggleSelectId(task.id)}
                aria-label={`Select ${task.title}`}
                className="mt-1 w-4 h-4 accent-sky-400 cursor-pointer shrink-0"
              />
            )}

            <button
              type="button"
              onClick={() => toggleTask(task.id)}
              aria-label={task.done ? `Mark ${task.title} incomplete` : `Complete ${task.title}`}
              className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center shrink-0 cursor-pointer transition-colors ${
                task.done
                  ? 'bg-emerald-400 border-emerald-400 text-zinc-950 font-extrabold'
                  : 'bg-[#090a0e] border-white/25 hover:border-sky-400'
              }`}
            >
              {task.done && <span className="text-xs">✓</span>}
            </button>

            <div className="flex flex-col gap-1 min-w-0 flex-1">
              {inlineEditingId === task.id ? (
                <input
                  type="text"
                  value={inlineEditingText}
                  onChange={(e) => setInlineEditingText(e.target.value)}
                  onBlur={() => saveEditTitle(task.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') saveEditTitle(task.id);
                    if (e.key === 'Escape') setInlineEditingId(null);
                  }}
                  autoFocus
                  className="w-full px-2.5 py-1 rounded-lg bg-[#08090c] border border-sky-400/50 text-sm text-white focus:outline-none"
                />
              ) : (
                <div className="flex items-start gap-1.5 min-w-0">
                  <button
                    type="button"
                    onClick={() => toggleStar(task.id)}
                    aria-label={task.starred ? 'Unstar task' : 'Star as top focus'}
                    className={`mt-0.5 text-sm cursor-pointer shrink-0 ${
                      task.starred ? 'text-amber-300' : 'text-zinc-600 hover:text-zinc-300'
                    }`}
                    title="Star as Today’s Focus"
                  >
                    {task.starred ? '★' : '☆'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setInlineEditingId(task.id);
                      setInlineEditingText(task.title);
                    }}
                    className={`text-left text-sm font-semibold break-words cursor-pointer ${
                      task.done ? 'line-through text-zinc-500' : 'text-zinc-100 hover:text-white'
                    }`}
                    title="Click to rename inline"
                  >
                    {task.title}
                  </button>
                </div>
              )}

              {task.notes && <p className="text-xs text-zinc-400 leading-relaxed pl-5">{task.notes}</p>}

              {isBlocked && blocker && (
                <div className="ml-5 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/12 border border-amber-400/30 text-[10px] font-mono text-amber-300 self-start">
                  <span>⏳ Blocked by: {blocker.title.slice(0, 36)}</span>
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-1 pl-5">
                <button
                  type="button"
                  onClick={() => cyclePriority(task.id)}
                  title="Click to cycle priority"
                  className={`px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase border cursor-pointer ${priorityStyle(task.priority)}`}
                >
                  {task.priority}
                </button>
                <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                  {task.category}
                </span>
                {task.energy && task.energy !== 'normal' && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${energy.badge}`}>
                    {energy.label}
                  </span>
                )}
                {(task.estimateMin || task.spentMin) && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-white/[0.04] border border-white/[0.08] text-zinc-300">
                    ~{task.estimateMin || 25}m{task.spentMin ? ` · ${task.spentMin}m done` : ''}
                  </span>
                )}
                {task.repeat && task.repeat !== 'none' && (
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-purple-500/15 border border-purple-400/30 text-purple-300">
                    🔁 {task.repeat}
                  </span>
                )}
                {due && !task.done && (
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border ${due.tone}`}>{due.label}</span>
                )}
                {projectBrand && task.projectId && (
                  <button
                    type="button"
                    onClick={() => onNavigate(`projects/${task.projectId}`)}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-emerald-500/12 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                    title={`Open ${projectBrand.name}`}
                  >
                    {projectBrand.icon} {projectBrand.shortName} ↗
                  </button>
                )}
                {(task.tags || []).map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setTagFilter((cur) => (cur === tag ? 'All' : tag))}
                    className="px-2 py-0.5 rounded-md text-[10px] font-mono bg-sky-500/10 border border-sky-400/25 text-sky-300 hover:bg-sky-500/20 cursor-pointer"
                  >
                    #{tag}
                  </button>
                ))}
                {task.subtasks.length > 0 && (
                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[10px] font-mono bg-sky-500/12 border border-sky-400/25 text-sky-300">
                    <span>
                      Steps {subDone}/{task.subtasks.length}
                    </span>
                    <span className="w-8 h-1 rounded-full bg-black/50 overflow-hidden">
                      <span className="block h-full bg-sky-300" style={{ width: `${subPct}%` }} />
                    </span>
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className={`flex flex-wrap items-center gap-1.5 shrink-0 ${compactBoard ? 'pt-1' : 'self-end sm:self-center'}`}>
            {!task.done && (
              <>
                <button
                  type="button"
                  onClick={() => (isFocusing ? stopFocusTimer(true) : startFocusOnTask(task))}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono cursor-pointer ${
                    isFocusing
                      ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200 font-bold'
                      : 'bg-[#181922] border-white/[0.08] text-emerald-300 hover:border-emerald-400/40'
                  }`}
                  title={isFocusing ? 'Stop focus timer' : 'Start live focus timer for this task'}
                >
                  {isFocusing ? '■ Stop' : '▶ Focus'}
                </button>
                <button
                  type="button"
                  onClick={() => setTaskStatus(task.id, status === 'doing' ? 'todo' : 'doing')}
                  className={`px-2 py-1.5 rounded-lg border text-[11px] font-mono cursor-pointer ${
                    status === 'doing'
                      ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 font-bold'
                      : 'bg-[#181922] border-white/[0.08] text-zinc-400 hover:text-white'
                  }`}
                  title="Mark as In Progress"
                >
                  {status === 'doing' ? 'Doing ●' : 'Start'}
                </button>
                <button
                  type="button"
                  onClick={() => snoozeTask(task.id, 1)}
                  className="px-2 py-1.5 rounded-lg bg-[#181922] border border-white/[0.08] hover:border-amber-400/35 text-[11px] font-mono text-zinc-300 hover:text-amber-200 cursor-pointer"
                  title="Snooze due date by +1 day"
                >
                  +1d
                </button>
              </>
            )}
            <button
              type="button"
              onClick={() => setExpandedId(isExpanded ? null : task.id)}
              className="px-2.5 py-1.5 rounded-lg bg-[#181922] border border-white/[0.08] hover:border-white/[0.2] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
            >
              {isExpanded ? 'Hide' : `Steps (${task.subtasks.length})`}
            </button>
            <button
              type="button"
              onClick={() => setEditingTaskId(task.id)}
              className="px-2.5 py-1.5 rounded-lg bg-[#181922] border border-white/[0.08] hover:border-sky-400/40 text-[11px] font-mono text-zinc-200 hover:text-white cursor-pointer"
              title="Open full task editor"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={() => deleteTask(task.id)}
              aria-label={`Delete ${task.title}`}
              className="px-2 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/25 hover:bg-rose-500/20 text-[11px] font-mono text-rose-300 cursor-pointer"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Expandable Subtasks Checklist */}
        {isExpanded && (
          <div className="mt-3 pt-3 border-t border-white/[0.07] pl-8 flex flex-col gap-2">
            {task.subtasks.map((sub) => (
              <div key={sub.id} className="flex items-center justify-between gap-2 text-xs">
                <button
                  type="button"
                  onClick={() => toggleSubtask(task.id, sub.id)}
                  className="flex items-center gap-2 text-left text-zinc-200 hover:text-white cursor-pointer min-w-0"
                >
                  <span
                    className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 text-[10px] ${
                      sub.done ? 'bg-sky-400 border-sky-400 text-zinc-950 font-bold' : 'border-white/25'
                    }`}
                  >
                    {sub.done ? '✓' : ''}
                  </span>
                  <span className={sub.done ? 'line-through text-zinc-500' : ''}>{sub.text}</span>
                </button>
                <button
                  type="button"
                  onClick={() => removeSubtask(task.id, sub.id)}
                  className="text-zinc-500 hover:text-rose-300 text-xs px-1.5 cursor-pointer"
                  aria-label="Remove step"
                >
                  ✕
                </button>
              </div>
            ))}

            <div className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={subtaskDrafts[task.id] || ''}
                onChange={(e) => setSubtaskDrafts((d) => ({ ...d, [task.id]: e.target.value }))}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addSubtask(task.id);
                  }
                }}
                placeholder="Add sub-step and press Enter..."
                className="flex-1 h-8 px-3 rounded-lg bg-[#08090c] border border-white/[0.08] text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-sky-400/50"
              />
              <button
                type="button"
                onClick={() => addSubtask(task.id)}
                className="h-8 px-3 rounded-lg bg-sky-500/15 border border-sky-400/30 text-xs font-semibold text-sky-200 hover:bg-sky-500/25 cursor-pointer"
              >
                Add
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <article className="w-full flex flex-col gap-5 pb-12">
      {/* Header Banner */}
      <header
        className={
          embedded
            ? 'relative overflow-hidden w-full bg-[#111218] border border-white/[0.08] rounded-2xl p-4 sm:p-5 shadow-lg'
            : 'relative overflow-hidden w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl portal-header-sheen'
        }
      >
        {!embedded && (
          <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="" opacityClass="opacity-30 sm:opacity-45" />
        )}
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-start gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-[#161722] border border-white/[0.09] flex items-center justify-center text-emerald-300 shrink-0 shadow-sm">
                <TaskSvg className="w-5 h-5">
                  <path d="m9 11 3 3L22 4" />
                  <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
                </TaskSvg>
              </div>
              <div className="flex flex-col gap-0.5 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-300">
                    Personal Action Planner
                  </span>
                  <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                    {sync.saving ? 'Saving...' : 'Synced SQLite WAL'}
                  </span>
                  {stats.overdue > 0 && (
                    <button
                      type="button"
                      onClick={() => setFilter('overdue')}
                      className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-rose-500/15 border border-rose-500/35 text-rose-300 hover:bg-rose-500/25 cursor-pointer tabular-nums"
                    >
                      {stats.overdue} Overdue
                    </button>
                  )}
                </div>
                {embedded ? (
                  <h2 className="text-lg sm:text-xl font-extrabold tracking-tight text-white">Tasks &amp; Planner</h2>
                ) : (
                  <>
                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                      Tasks &amp; Planner
                    </h1>
                    <p className="text-xs sm:text-sm text-zinc-400 max-w-2xl mt-0.5">
                      Plan with List, Drag-and-Drop Board, Eisenhower 2×2 Matrix, or Timeline — complete with live Focus Timer, smart syntax capture, templates, and dependencies.
                    </p>
                  </>
                )}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div
                className="inline-flex items-center h-9 p-1 rounded-xl bg-[#09090c] border border-white/[0.08] gap-0.5"
                role="group"
                aria-label="Task layout views"
              >
                {(
                  [
                    { id: 'list', label: 'List' },
                    { id: 'board', label: 'Board' },
                    { id: 'matrix', label: 'Matrix' },
                    { id: 'timeline', label: 'Timeline' },
                  ] as const
                ).map((v) => (
                  <button
                    key={v.id}
                    type="button"
                    aria-pressed={layout === v.id}
                    onClick={() => setLayout(v.id)}
                    className={`inline-flex items-center gap-1.5 h-7 px-2.5 rounded-lg text-xs transition-all cursor-pointer whitespace-nowrap ${
                      layout === v.id
                        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                        : 'text-zinc-400 hover:text-white hover:bg-white/[0.05] border border-transparent font-medium'
                    }`}
                  >
                    {renderTaskLayoutIcon(v.id, layout === v.id)}
                    <span>{v.label}</span>
                  </button>
                ))}
              </div>

              <button
                type="button"
                onClick={() => setShowInsights((v) => !v)}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  showInsights
                    ? 'bg-sky-500/20 border-sky-400/45 text-sky-200 font-bold'
                    : 'bg-[#161821] border-white/[0.1] hover:border-sky-400/40 text-zinc-200 hover:text-white'
                }`}
              >
                <TaskSvg className="w-3.5 h-3.5 text-sky-300">
                  <path d="M3 3v18h18" />
                  <path d="M18 17V9" />
                  <path d="M13 17V5" />
                  <path d="M8 17v-3" />
                </TaskSvg>
                <span>Insights</span>
              </button>
              <button
                type="button"
                onClick={() => setToolboxOpen((v) => !v)}
                className={`inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                  toolboxOpen
                    ? 'bg-purple-500/25 border-purple-400/50 text-white font-bold'
                    : 'bg-purple-500/15 border-purple-500/35 hover:bg-purple-500/25 text-purple-200'
                }`}
              >
                <TaskSvg className="w-3.5 h-3.5 text-purple-300">
                  <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
                </TaskSvg>
                <span>Templates &amp; Data</span>
              </button>
              {!embedded && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('notes')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-[#161821] border border-white/[0.1] hover:border-sky-400/40 text-xs font-semibold text-zinc-200 cursor-pointer whitespace-nowrap"
                  >
                    <TaskSvg className="w-3.5 h-3.5 text-sky-300">
                      <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20" />
                    </TaskSvg>
                    <span>Notes</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('tools')}
                    className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 text-xs font-semibold text-emerald-200 cursor-pointer whitespace-nowrap"
                  >
                    <TaskSvg className="w-3.5 h-3.5 text-emerald-300">
                      <circle cx="12" cy="12" r="10" />
                      <polyline points="12 6 12 12 16 14" />
                    </TaskSvg>
                    <span>Toolkit</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* KPI Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 pt-3.5 border-t border-white/[0.07]">
            <div className="p-3 rounded-xl bg-[#0b0c10]/90 border border-white/[0.08] flex flex-col justify-between gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Active Tasks</span>
              <span className="text-xl font-extrabold font-mono text-white tabular-nums">{stats.pending}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0b0c10]/90 border border-white/[0.08] flex flex-col justify-between gap-1">
              <span className="inline-flex items-center gap-1 text-[11px] font-mono text-zinc-400">
                <TaskSvg className="w-3 h-3 text-amber-300 fill-amber-300">
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                </TaskSvg>
                <span>Focus Starred</span>
              </span>
              <span className="text-xl font-extrabold font-mono text-amber-300 tabular-nums">{stats.starredOpen}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0b0c10]/90 border border-white/[0.08] flex flex-col justify-between gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Due Today</span>
              <span className="text-xl font-extrabold font-mono text-sky-300 tabular-nums">{stats.dueToday}</span>
            </div>
            <div className="p-3 rounded-xl bg-[#0b0c10]/90 border border-white/[0.08] flex flex-col justify-between gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Overdue</span>
              <span className={`text-xl font-extrabold font-mono tabular-nums ${stats.overdue > 0 ? 'text-rose-300' : 'text-zinc-300'}`}>
                {stats.overdue}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0b0c10]/90 border border-white/[0.08] flex flex-col justify-between gap-1">
              <span className="text-[11px] font-mono text-zinc-400">Est. Queue Left</span>
              <span className="text-xl font-extrabold font-mono text-purple-300 tabular-nums">
                {formatMinutes(stats.focusMinsLeft)}
              </span>
            </div>
            <div className="p-3 rounded-xl bg-[#0b0c10]/90 border border-white/[0.08] flex flex-col justify-between gap-1.5">
              <div className="flex items-center justify-between text-[11px] font-mono">
                <span className="text-zinc-400">Completion</span>
                <span className="text-zinc-400 tabular-nums">
                  {stats.completed}/{stats.total}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <span className="text-xl font-extrabold font-mono text-emerald-400 tabular-nums leading-none">{stats.pct}%</span>
                <div className="flex-1 h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                  <div className="h-full bg-emerald-400 transition-all duration-200" style={{ width: `${stats.pct}%` }} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Collapsible Productivity Insights Panel */}
      {showInsights && (
        <TaskInsightsPanel
          tasks={tasks}
          dailyCapacityMin={prefs.dailyCapacityMin}
          onChangeDailyCapacity={(mins) => setPrefs((p) => ({ ...p, dailyCapacityMin: mins }))}
          onRescheduleOverdueToToday={() => {
            commitWithUndo('Rescheduled overdue tasks to Today', (prev) =>
              prev.map((t) => (!t.done && !t.archived && t.dueDate && t.dueDate < today ? { ...t, dueDate: today } : t))
            );
          }}
          onArchiveCompleted={() => {
            commitWithUndo('Archived completed tasks', (prev) =>
              prev.map((t) => (t.done && !t.archived ? { ...t, archived: true } : t))
            );
          }}
        />
      )}

      {/* Collapsible Power Toolbox Drawer (Inline — Templates, Brain Dump, Categories & Data Tools) */}
      <TaskToolboxModal
        open={toolboxOpen}
        tasks={tasks}
        customTemplates={prefs.customTemplates}
        customCategories={prefs.customCategories}
        categories={categories}
        onClose={() => setToolboxOpen(false)}
        onApplyTemplate={handleApplyTemplate}
        onDeleteCustomTemplate={(id) =>
          setPrefs((p) => ({ ...p, customTemplates: p.customTemplates.filter((t) => t.id !== id) }))
        }
        onBulkBrainDump={(newItems) => {
          setTasks((prev) => [...newItems, ...prev]);
          setFilter('all');
          showToast(`Imported ${newItems.length} tasks ✓`);
        }}
        onAddCategory={(cat) => {
          if (!categories.includes(cat)) {
            setPrefs((p) => ({ ...p, customCategories: [...p.customCategories, cat] }));
          }
        }}
        onRemoveCustomCategory={(cat) => {
          setPrefs((p) => ({ ...p, customCategories: p.customCategories.filter((c) => c !== cat) }));
        }}
        onImportJson={(imported, mode) => {
          if (mode === 'replace') {
            commitWithUndo('Replaced tasks via import', () => imported);
          } else {
            setTasks((prev) => {
              const existingIds = new Set(prev.map((t) => t.id));
              const fresh = imported.filter((t) => !existingIds.has(t.id));
              return [...fresh, ...prev];
            });
          }
        }}
        onExportCsv={handleExportCsv}
        onExportJson={handleExportJson}
        onExportMarkdown={handleExportMarkdown}
        onCopyFormat={handleCopyExport}
      />

      {/* Live Active Task Focus Timer Banner */}
      {focusedTask && (
        <section
          className="w-full rounded-2xl bg-[#131622] border border-emerald-400/40 p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl"
          aria-label="Active task focus timer"
        >
          <div className="flex flex-col gap-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-300">
              <span className={`w-2 h-2 rounded-full ${focusRunning ? 'bg-emerald-400 status-pulse' : 'bg-amber-400'}`} />
              <span>{focusRunning ? 'FOCUS TIMER ACTIVE' : 'FOCUS TIMER PAUSED'}</span>
            </div>
            <strong className="text-sm sm:text-base font-extrabold text-white truncate">{focusedTask.title}</strong>
            <div className="w-full max-w-md h-1.5 rounded-full bg-[#08090c] overflow-hidden mt-1">
              <div
                className="h-full bg-emerald-400 transition-all duration-300"
                style={{
                  width: `${
                    focusTotalSec > 0 ? Math.min(100, Math.round(((focusTotalSec - focusSecLeft) / focusTotalSec) * 100)) : 0
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <span className="px-3 py-1.5 rounded-xl bg-[#08090c] border border-white/[0.12] font-mono text-lg font-extrabold text-sky-300 tabular-nums">
              {String(Math.floor(focusSecLeft / 60)).padStart(2, '0')}:
              {String(focusSecLeft % 60).padStart(2, '0')}
            </span>
            <button
              type="button"
              onClick={() => setFocusRunning((r) => !r)}
              className="px-3.5 py-2 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold cursor-pointer"
            >
              {focusRunning ? 'Pause' : 'Resume'}
            </button>
            <button
              type="button"
              onClick={() => {
                setFocusSecLeft((s) => s + 300);
                setFocusTotalSec((s) => s + 300);
              }}
              className="px-3 py-2 rounded-xl bg-[#181922] border border-white/[0.1] text-xs font-mono text-zinc-200 cursor-pointer"
            >
              +5m
            </button>
            <button
              type="button"
              onClick={() => {
                stopFocusTimer(true);
                toggleTask(focusedTask.id);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/45 text-xs font-bold text-emerald-200 cursor-pointer"
            >
              Complete Task ✓
            </button>
            <button
              type="button"
              onClick={() => stopFocusTimer(true)}
              className="px-3 py-2 rounded-xl bg-[#181922] border border-white/[0.1] text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Exit
            </button>
          </div>
        </section>
      )}

      {/* Smart Quick Add Task Form */}
      <form
        onSubmit={handleAddTask}
        className="w-full rounded-2xl bg-[#111218] border border-white/[0.08] p-4 sm:p-5 flex flex-col gap-3 shadow-lg"
      >
        <div className="flex flex-col lg:flex-row gap-2.5">
          <div className="relative flex-1 flex items-center">
            <input
              ref={titleInputRef}
              type="text"
              value={newTitle}
              onChange={(e) => {
                setNewTitle(e.target.value);
                if (addWarning && e.target.value.trim()) setAddWarning(false);
              }}
              placeholder={
                addWarning
                  ? 'Please type a task title here first...'
                  : 'Add task (Press N · supports !high, @tomorrow, ~30m, *daily, ^deep, #Tag)...'
              }
              aria-label="New task title"
              className={`w-full h-10 pl-3.5 pr-9 rounded-xl bg-[#08090c] border focus:outline-none text-sm text-white placeholder-zinc-500 ${
                addWarning ? 'border-amber-400/70' : 'border-white/[0.1] focus:border-sky-400/50'
              }`}
            />
            <kbd className="hidden sm:inline-block absolute right-2.5 px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.08] text-[10px] font-mono text-zinc-400 pointer-events-none">
              N
            </kbd>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <TaskSelectBox
              value={newPriority}
              onChange={(val) => setNewPriority(val as TaskPriority)}
              ariaLabel="Task priority"
              className="h-10 rounded-xl bg-[#08090c] border border-white/[0.1] hover:border-white/[0.2]"
              selectClassName="text-xs font-mono text-zinc-100"
              leading={
                <span
                  className={`w-2 h-2 rounded-full ${
                    newPriority === 'high'
                      ? 'bg-rose-400'
                      : newPriority === 'medium'
                      ? 'bg-amber-400'
                      : 'bg-zinc-400'
                  }`}
                />
              }
            >
              <option value="high" className="bg-[#111218] text-zinc-100">High</option>
              <option value="medium" className="bg-[#111218] text-zinc-100">Medium</option>
              <option value="low" className="bg-[#111218] text-zinc-100">Low</option>
            </TaskSelectBox>

            <TaskSelectBox
              value={newCategory}
              onChange={(val) => setNewCategory(val)}
              ariaLabel="Task category"
              className="h-10 rounded-xl bg-[#08090c] border border-white/[0.1] hover:border-white/[0.2]"
              selectClassName="text-xs font-mono text-zinc-100"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat} className="bg-[#111218] text-zinc-100">
                  {cat}
                </option>
              ))}
            </TaskSelectBox>

            <TaskSelectBox
              value={newRepeat}
              onChange={(val) => setNewRepeat(val as TaskRepeat)}
              ariaLabel="Repeat cadence"
              className="h-10 rounded-xl bg-[#08090c] border border-white/[0.1] hover:border-white/[0.2]"
              selectClassName="text-xs font-mono text-zinc-100"
              leading={
                <TaskSvg className="w-3.5 h-3.5 text-zinc-400">
                  <path d="m17 2 4 4-4 4" />
                  <path d="M3 11v-1a4 4 0 0 1 4-4h14" />
                  <path d="m7 22-4-4 4-4" />
                  <path d="M21 13v1a4 4 0 0 1-4 4H3" />
                </TaskSvg>
              }
            >
              <option value="none" className="bg-[#111218] text-zinc-100">Once</option>
              <option value="daily" className="bg-[#111218] text-zinc-100">Daily</option>
              <option value="weekly" className="bg-[#111218] text-zinc-100">Weekly</option>
              <option value="monthly" className="bg-[#111218] text-zinc-100">Monthly</option>
            </TaskSelectBox>

            <TaskSelectBox
              value={newEstimate}
              onChange={(val) => setNewEstimate(Number(val))}
              ariaLabel="Estimated duration"
              className="h-10 rounded-xl bg-[#08090c] border border-white/[0.1] hover:border-white/[0.2]"
              selectClassName="text-xs font-mono text-zinc-100"
              leading={
                <TaskSvg className="w-3.5 h-3.5 text-zinc-400">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </TaskSvg>
              }
            >
              <option value={10} className="bg-[#111218] text-zinc-100">10m</option>
              <option value={15} className="bg-[#111218] text-zinc-100">15m</option>
              <option value={25} className="bg-[#111218] text-zinc-100">25m</option>
              <option value={45} className="bg-[#111218] text-zinc-100">45m</option>
              <option value={60} className="bg-[#111218] text-zinc-100">1h</option>
              <option value={120} className="bg-[#111218] text-zinc-100">2h</option>
            </TaskSelectBox>

            <input
              type="date"
              value={newDueDate}
              onChange={(e) => setNewDueDate(e.target.value)}
              aria-label="Due date"
              className="h-10 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] hover:border-white/[0.2] text-xs font-mono text-zinc-200 focus:outline-none focus:border-sky-400/50"
            />

            <button
              type="submit"
              className="inline-flex items-center gap-1.5 h-10 px-4 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 font-extrabold text-xs transition-colors shadow-sm cursor-pointer shrink-0 whitespace-nowrap"
            >
              <TaskSvg className="w-3.5 h-3.5 stroke-[2.5]">
                <path d="M5 12h14" />
                <path d="M12 5v14" />
              </TaskSvg>
              <span>Add Task</span>
            </button>
          </div>
        </div>

        {/* Live Smart Token Preview */}
        {(smartPreview.priority ||
          smartPreview.dueDate ||
          smartPreview.dueTime ||
          smartPreview.estimateMin ||
          smartPreview.category ||
          smartPreview.repeat ||
          smartPreview.energy ||
          smartPreview.tags.length > 0) && (
          <div className="flex flex-wrap items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#090a0e] border border-sky-400/25 text-[11px] font-mono">
            <span className="text-sky-300 font-bold">Smart Parsed:</span>
            {smartPreview.priority && <span className="text-rose-300">!{smartPreview.priority}</span>}
            {smartPreview.dueDate && <span className="text-emerald-300">@{smartPreview.dueDate}</span>}
            {smartPreview.dueTime && <span className="text-emerald-300">@{smartPreview.dueTime}</span>}
            {smartPreview.estimateMin && <span className="text-amber-300">~{smartPreview.estimateMin}m</span>}
            {smartPreview.repeat && <span className="text-purple-300">*{smartPreview.repeat}</span>}
            {smartPreview.energy && <span className="text-sky-200">^{smartPreview.energy}</span>}
            {smartPreview.category && <span className="text-zinc-200">#{smartPreview.category}</span>}
            {smartPreview.tags.map((t) => (
              <span key={t} className="text-sky-300">
                #{t}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <input
            type="text"
            value={newNotes}
            onChange={(e) => setNewNotes(e.target.value)}
            placeholder="Optional details or reminder note..."
            aria-label="Optional task note"
            className="flex-1 h-9 px-3.5 rounded-xl bg-[#08090c] border border-white/[0.08] focus:border-white/[0.2] focus:outline-none text-xs text-zinc-300 placeholder-zinc-600"
          />
          <div className="flex flex-wrap items-center gap-1.5 text-[11px] font-mono shrink-0">
            <div className="inline-flex items-center h-9 p-0.5 rounded-xl bg-[#09090c] border border-white/[0.08] gap-0.5">
              {[
                { label: 'Today', val: todayIso() },
                { label: 'Tomorrow', val: offsetDateIso(1) },
                { label: '+7d', val: offsetDateIso(7) },
                { label: 'No Date', val: '' },
              ].map((p) => (
                <button
                  key={p.label}
                  type="button"
                  onClick={() => setNewDueDate(p.val)}
                  className={`h-full px-2.5 rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
                    newDueDate === p.val
                      ? 'bg-sky-500/20 border-sky-400/40 text-sky-200 font-bold'
                      : 'border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.05]'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setShowAdvancedAdd((v) => !v)}
              className={`h-9 px-3 rounded-xl border transition-colors cursor-pointer whitespace-nowrap ${
                showAdvancedAdd
                  ? 'bg-zinc-800 border-white/20 text-white font-bold'
                  : 'bg-[#161821] border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2]'
              }`}
            >
              {showAdvancedAdd ? 'Less −' : 'More +'}
            </button>
          </div>
        </div>

        {showAdvancedAdd && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-3 border-t border-white/[0.07] text-xs font-mono">
            <label className="flex items-center gap-2">
              <span className="text-zinc-400 shrink-0">Time:</span>
              <input
                type="time"
                value={newDueTime}
                onChange={(e) => setNewDueTime(e.target.value)}
                className="flex-1 h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-zinc-200 focus:outline-none"
              />
            </label>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 shrink-0">Energy:</span>
              <TaskSelectBox
                value={newEnergy}
                onChange={(val) => setNewEnergy(val as TaskEnergy)}
                ariaLabel="Task energy"
                className="flex-1 h-9 rounded-xl bg-[#08090c] border border-white/[0.1] hover:border-white/[0.2]"
                selectClassName="w-full text-xs font-mono text-zinc-200"
              >
                <option value="deep" className="bg-[#111218] text-zinc-100">Deep Focus</option>
                <option value="normal" className="bg-[#111218] text-zinc-100">Normal</option>
                <option value="low" className="bg-[#111218] text-zinc-100">Low Energy</option>
              </TaskSelectBox>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-zinc-400 shrink-0">Project:</span>
              <TaskSelectBox
                value={newProjectId}
                onChange={(val) => setNewProjectId(val)}
                ariaLabel="Linked project"
                className="flex-1 h-9 rounded-xl bg-[#08090c] border border-white/[0.1] hover:border-white/[0.2]"
                selectClassName="w-full text-xs font-mono text-zinc-200"
              >
                <option value="" className="bg-[#111218] text-zinc-100">None</option>
                {Object.entries(PROJECT_BRAND_MAP).map(([id, brand]) => (
                  <option key={id} value={id} className="bg-[#111218] text-zinc-100">
                    {brand.shortName}
                  </option>
                ))}
              </TaskSelectBox>
            </div>
          </div>
        )}

        {/* One-Click Starter Template Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-3 border-t border-white/[0.07]">
          <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-zinc-400 mr-1">
            Templates:
          </span>
          {[...prefs.customTemplates, ...STARTER_TASK_TEMPLATES].slice(0, 5).map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={() => handleApplyTemplate(tpl)}
              className="inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-[#161821] border border-white/[0.08] hover:border-white/[0.22] hover:bg-[#1c1f2b] text-xs font-medium text-zinc-200 hover:text-white cursor-pointer transition-all whitespace-nowrap"
            >
              {renderStarterTplIcon(tpl.id)}
              <span>{tpl.name}</span>
            </button>
          ))}
        </div>
      </form>

      {/* Unified Filter, Search, Sort & Bulk Toolbar */}
      <div className="rounded-2xl bg-[#111218] border border-white/[0.08] p-3.5 sm:px-4 sm:py-3 flex flex-col gap-3 shadow-sm">
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Task views">
          {(
            [
              { id: 'all', label: 'All', count: stats.total },
              { id: 'starred', label: 'Focus', count: stats.starredOpen, star: true },
              { id: 'today', label: 'Today', count: stats.dueToday },
              { id: 'overdue', label: 'Overdue', count: stats.overdue, warn: stats.overdue > 0 },
              { id: 'doing', label: 'Doing', count: stats.doingCount },
              { id: 'upcoming', label: 'Upcoming', count: stats.upcomingCount },
              { id: 'high', label: 'High', count: stats.highOpen },
              { id: 'quick', label: 'Quick ≤15m', count: stats.quickCount },
              { id: 'recurring', label: 'Repeating', count: stats.recurringCount },
              { id: 'completed', label: 'Completed', count: stats.completed },
              ...(stats.archivedCount > 0
                ? [{ id: 'archived' as const, label: 'Archived', count: stats.archivedCount }]
                : []),
            ] as Array<{
              id: TaskFilter;
              label: string;
              count: number;
              star?: boolean;
              warn?: boolean;
            }>
          ).map((tab) => {
            const isActive = filter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                aria-pressed={isActive}
                onClick={() => setFilter(tab.id)}
                className={`inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg text-xs border transition-all cursor-pointer whitespace-nowrap ${
                  isActive
                    ? tab.warn
                      ? 'bg-rose-500/20 border-rose-400/45 text-rose-100 font-bold shadow-sm'
                      : 'bg-sky-500/15 border-sky-400/45 text-white font-bold shadow-sm'
                    : 'bg-[#161821] border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] font-medium'
                }`}
              >
                {tab.star && (
                  <TaskSvg className={isActive ? 'w-3.5 h-3.5 text-amber-300 fill-amber-300' : 'w-3.5 h-3.5 text-amber-400/80'}>
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </TaskSvg>
                )}
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono leading-none tabular-nums ${
                    isActive
                      ? tab.warn
                        ? 'bg-rose-400/25 text-rose-100'
                        : 'bg-sky-400/20 text-sky-200'
                      : tab.warn
                      ? 'bg-rose-500/15 text-rose-300'
                      : tab.count > 0
                      ? 'bg-white/[0.06] text-zinc-300'
                      : 'bg-white/[0.03] text-zinc-500'
                  }`}
                >
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-2.5 pt-3 border-t border-white/[0.07]">
          <div className="flex flex-wrap items-center gap-2">
            <TaskSelectBox
              value={categoryFilter}
              onChange={(val) => setCategoryFilter(val)}
              ariaLabel="Filter by category"
              prefix="Category:"
              selectClassName="text-xs font-semibold text-zinc-100"
            >
              <option value="All" className="bg-[#111218] text-zinc-100">All</option>
              {categories.map((c) => (
                <option key={c} value={c} className="bg-[#111218] text-zinc-100">
                  {c}
                </option>
              ))}
            </TaskSelectBox>

            <TaskSelectBox
              value={energyFilter}
              onChange={(val) => setEnergyFilter(val as 'all' | TaskEnergy)}
              ariaLabel="Filter by energy"
              prefix="Energy:"
              selectClassName="text-xs font-semibold text-zinc-100"
            >
              <option value="all" className="bg-[#111218] text-zinc-100">All</option>
              <option value="deep" className="bg-[#111218] text-zinc-100">Deep Focus</option>
              <option value="normal" className="bg-[#111218] text-zinc-100">Normal</option>
              <option value="low" className="bg-[#111218] text-zinc-100">Low Energy</option>
            </TaskSelectBox>

            {allTags.length > 0 && (
              <TaskSelectBox
                value={tagFilter}
                onChange={(val) => setTagFilter(val)}
                ariaLabel="Filter by tag"
                prefix="Tag:"
                selectClassName="text-xs font-semibold text-zinc-100"
              >
                <option value="All" className="bg-[#111218] text-zinc-100">All</option>
                {allTags.map((t) => (
                  <option key={t} value={t} className="bg-[#111218] text-zinc-100">
                    #{t}
                  </option>
                ))}
              </TaskSelectBox>
            )}

            <TaskSelectBox
              value={sortBy}
              onChange={(val) => setSortBy(val as TaskSort)}
              ariaLabel="Sort tasks"
              prefix="Sort:"
              selectClassName="text-xs font-semibold text-zinc-100"
              leading={
                <TaskSvg className="w-3.5 h-3.5 text-zinc-400">
                  <path d="m3 16 4 4 4-4" />
                  <path d="M7 20V4" />
                  <path d="m21 8-4-4-4 4" />
                  <path d="M17 4v16" />
                </TaskSvg>
              }
            >
              <option value="smart" className="bg-[#111218] text-zinc-100">Smart Rank</option>
              <option value="due" className="bg-[#111218] text-zinc-100">Due Date</option>
              <option value="priority" className="bg-[#111218] text-zinc-100">Priority</option>
              <option value="shortest" className="bg-[#111218] text-zinc-100">Shortest</option>
              <option value="longest" className="bg-[#111218] text-zinc-100">Longest</option>
              <option value="newest" className="bg-[#111218] text-zinc-100">Newest</option>
              <option value="title" className="bg-[#111218] text-zinc-100">A–Z</option>
            </TaskSelectBox>

            {layout === 'list' && (
              <TaskSelectBox
                value={groupBy}
                onChange={(val) => setGroupBy(val as TaskGroupBy)}
                ariaLabel="Group tasks"
                prefix="Group:"
                selectClassName="text-xs font-semibold text-zinc-100"
              >
                <option value="none" className="bg-[#111218] text-zinc-100">Flat</option>
                <option value="category" className="bg-[#111218] text-zinc-100">Category</option>
                <option value="priority" className="bg-[#111218] text-zinc-100">Priority</option>
                <option value="due" className="bg-[#111218] text-zinc-100">Schedule</option>
              </TaskSelectBox>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="relative flex items-center">
              <TaskSvg className="w-3.5 h-3.5 text-zinc-500 absolute left-2.5 pointer-events-none">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </TaskSvg>
              <input
                ref={searchInputRef}
                type="search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Filter tasks..."
                aria-label="Filter tasks"
                className="h-8 w-44 sm:w-52 pl-8 pr-7 rounded-xl bg-[#09090c] border border-white/[0.09] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-sky-400/45"
              />
              {!search && (
                <kbd className="absolute right-2 px-1.5 py-0.5 rounded bg-[#16171e] border border-white/[0.08] text-[10px] font-mono text-zinc-400 pointer-events-none">
                  /
                </kbd>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setSelectMode((m) => !m);
                setSelectedIds([]);
              }}
              className={`inline-flex items-center gap-1.5 h-8 px-3 rounded-xl border text-xs font-semibold transition-all cursor-pointer whitespace-nowrap ${
                selectMode
                  ? 'bg-sky-500/20 border-sky-400/45 text-sky-200 font-bold'
                  : 'bg-[#161821] border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2]'
              }`}
            >
              <TaskSvg className={selectMode ? 'w-3.5 h-3.5 text-sky-300' : 'w-3.5 h-3.5 text-zinc-400'}>
                <path d="m9 11 3 3L22 4" />
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
              </TaskSvg>
              <span>Select</span>
            </button>

            {stats.completed > 0 && (
              <button
                type="button"
                onClick={() =>
                  commitWithUndo(`Cleared ${stats.completed} completed tasks`, (prev) =>
                    prev.filter((t) => !t.done || t.archived)
                  )
                }
                className="inline-flex items-center gap-1.5 h-8 px-3 rounded-xl bg-rose-500/10 border border-rose-500/30 hover:bg-rose-500/20 text-xs font-semibold text-rose-300 transition-colors cursor-pointer whitespace-nowrap"
              >
                Clear Done ({stats.completed})
              </button>
            )}
          </div>
        </div>

        {/* Multi-Select Bulk Action Bar */}
        {selectMode && (
          <div className="p-3 rounded-xl bg-[#131622] border border-sky-400/35 flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 font-mono">
              <strong className="text-sky-200">{selectedIds.length} Selected</strong>
              <button
                type="button"
                onClick={() => setSelectedIds(visibleTasks.map((t) => t.id))}
                className="px-2 py-1 rounded bg-[#181922] border border-white/[0.1] text-zinc-200 cursor-pointer"
              >
                Select All ({visibleTasks.length})
              </button>
              {selectedIds.length > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedIds([])}
                  className="px-2 py-1 rounded bg-[#181922] border border-white/[0.1] text-zinc-400 cursor-pointer"
                >
                  None
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              <button type="button" disabled={selectedIds.length === 0} onClick={() => runBulkAction('done')} className="px-2.5 py-1 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-semibold disabled:opacity-40 cursor-pointer">
                ✓ Complete
              </button>
              <button type="button" disabled={selectedIds.length === 0} onClick={() => runBulkAction('today')} className="px-2.5 py-1 rounded-lg bg-sky-500/15 border border-sky-400/30 text-sky-200 font-semibold disabled:opacity-40 cursor-pointer">
                → Today
              </button>
              <button type="button" disabled={selectedIds.length === 0} onClick={() => runBulkAction('tomorrow')} className="px-2.5 py-1 rounded-lg bg-[#181922] border border-white/[0.1] text-zinc-200 disabled:opacity-40 cursor-pointer">
                → Tomorrow
              </button>
              <button type="button" disabled={selectedIds.length === 0} onClick={() => runBulkAction('high')} className="px-2.5 py-1 rounded-lg bg-amber-500/15 border border-amber-400/30 text-amber-200 disabled:opacity-40 cursor-pointer">
                ★ High
              </button>
              <button type="button" disabled={selectedIds.length === 0} onClick={() => runBulkAction('archive')} className="px-2.5 py-1 rounded-lg bg-[#181922] border border-white/[0.1] text-zinc-300 disabled:opacity-40 cursor-pointer">
                Archive
              </button>
              <button type="button" disabled={selectedIds.length === 0} onClick={() => runBulkAction('delete')} className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-rose-300 disabled:opacity-40 cursor-pointer">
                Delete
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Main Content Area across 4 Views */}
      {tasks.length === 0 ? (
        <div className="rounded-2xl bg-[#111218] border border-white/[0.08] p-10 text-center flex flex-col items-center gap-3">
          <span className="text-3xl">✨</span>
          <h2 className="text-base font-bold text-white">No tasks yet — add your first one above!</h2>
          <p className="text-xs text-zinc-400">
            Load starter tasks or open Templates &amp; Brain Dump to populate your planner quickly.
          </p>
          <button
            type="button"
            onClick={() => setTasks(buildStarterTasks())}
            className="px-4 py-2 rounded-xl bg-[#181922] border border-white/[0.12] hover:border-sky-400/40 text-xs font-semibold text-zinc-200 cursor-pointer"
          >
            Load Sample Tasks
          </button>
        </div>
      ) : layout === 'board' ? (
        /* ── VIEW 2: DRAG & DROP KANBAN BOARD ── */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
          {(
            [
              { status: 'todo', title: '📋 To Do', accent: 'border-white/[0.1]', allowQuick: true },
              { status: 'doing', title: '⚡ In Progress', accent: 'border-sky-400/30', allowQuick: true },
              { status: 'done', title: '✅ Completed', accent: 'border-emerald-500/30', allowQuick: false },
            ] as const
          ).map((col) => {
            const colItems = visibleTasks.filter((t) => resolveStatus(t) === col.status);
            const isOver = dragOverCol === col.status;
            return (
              <section
                key={col.status}
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOverCol(col.status);
                }}
                onDragLeave={() => setDragOverCol((cur) => (cur === col.status ? null : cur))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (draggedTaskId) {
                    setTaskStatus(draggedTaskId, col.status);
                  }
                  setDraggedTaskId(null);
                  setDragOverCol(null);
                }}
                className={`rounded-2xl bg-[#101116] border p-4 flex flex-col gap-3 min-h-[280px] transition-colors ${
                  isOver ? 'border-sky-400/70 bg-[#131622]' : col.accent
                }`}
              >
                <div className="flex items-center justify-between text-xs font-bold text-white pb-2 border-b border-white/[0.06]">
                  <span>{col.title}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] font-mono text-[11px] text-zinc-300">
                    {colItems.length}
                  </span>
                </div>
                {colItems.length === 0 ? (
                  <div className="py-10 text-center text-xs text-zinc-500">
                    Drop tasks here or add below
                  </div>
                ) : (
                  <div className="flex flex-col gap-2.5">{colItems.map((t) => renderTaskCard(t, true))}</div>
                )}

                {col.allowQuick && (
                  <div className="pt-2 border-t border-white/[0.06] flex gap-1.5 mt-auto">
                    <input
                      type="text"
                      value={boardDrafts[col.status as 'todo' | 'doing']}
                      onChange={(e) =>
                        setBoardDrafts((d) => ({ ...d, [col.status]: e.target.value }))
                      }
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          handleBoardQuickAdd(col.status as 'todo' | 'doing');
                        }
                      }}
                      placeholder={`+ Add to ${col.status === 'todo' ? 'To Do' : 'Doing'}...`}
                      className="flex-1 h-8 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.08] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
                    />
                    <button
                      type="button"
                      onClick={() => handleBoardQuickAdd(col.status as 'todo' | 'doing')}
                      className="h-8 px-2.5 rounded-lg bg-[#181922] border border-white/[0.1] text-xs font-bold text-zinc-200 cursor-pointer"
                    >
                      +
                    </button>
                  </div>
                )}
              </section>
            );
          })}
        </div>
      ) : layout === 'matrix' ? (
        /* ── VIEW 3: EISENHOWER 2x2 PRIORITY MATRIX ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {(
            [
              {
                id: 'do',
                title: '🔥 Q1 · Do First (Urgent & Important)',
                sub: 'High priority or due today / overdue',
                border: 'border-rose-500/35',
                pill: 'text-rose-300',
              },
              {
                id: 'schedule',
                title: '📅 Q2 · Schedule (Important, Not Urgent)',
                sub: 'Upcoming strategic & medium/high goals',
                border: 'border-sky-400/35',
                pill: 'text-sky-300',
              },
              {
                id: 'quick',
                title: '⚡ Q3 · Quick Wins (≤ 15m / Due Today)',
                sub: 'Fast errands & rapid completions',
                border: 'border-amber-400/35',
                pill: 'text-amber-300',
              },
              {
                id: 'later',
                title: '🌱 Q4 · Later / Backlog',
                sub: 'Low urgency someday tasks',
                border: 'border-white/[0.1]',
                pill: 'text-zinc-300',
              },
            ] as const
          ).map((q) => {
            const qItems = visibleTasks.filter((t) => !t.done && getEisenhowerQuadrant(t, today) === q.id);
            return (
              <section
                key={q.id}
                className={`rounded-2xl bg-[#101116] border ${q.border} p-4 flex flex-col gap-3 min-h-[240px]`}
              >
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-white/[0.06]">
                  <div>
                    <h2 className={`text-sm font-extrabold ${q.pill}`}>{q.title}</h2>
                    <p className="text-[11px] text-zinc-400">{q.sub}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] font-mono text-[11px] text-zinc-200">
                    {qItems.length}
                  </span>
                </div>
                {qItems.length === 0 ? (
                  <div className="py-8 text-center text-xs text-zinc-500">No active tasks in this quadrant</div>
                ) : (
                  <div className="flex flex-col gap-2.5">{qItems.map((t) => renderTaskCard(t, true))}</div>
                )}
              </section>
            );
          })}
        </div>
      ) : layout === 'timeline' ? (
        /* ── VIEW 4: TIMELINE SCHEDULE PLANNER ── */
        <div className="flex flex-col gap-4">
          {timelineBuckets.map((bucket) => (
            <section
              key={bucket.id}
              className={`rounded-2xl bg-[#101116] border ${bucket.tone} p-4 flex flex-col gap-3`}
            >
              <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
                <div className="flex items-center gap-2">
                  <h2 className="text-sm font-extrabold text-white">{bucket.title}</h2>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.06] font-mono text-[11px] text-zinc-300">
                    {bucket.items.length}
                  </span>
                </div>
                {bucket.id === 'overdue' && bucket.items.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      commitWithUndo('Moved overdue tasks to Today', (prev) =>
                        prev.map((t) => (!t.done && t.dueDate && t.dueDate < today ? { ...t, dueDate: today } : t))
                      )
                    }
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/35 text-[11px] font-bold text-rose-200 cursor-pointer"
                  >
                    Move All → Today
                  </button>
                )}
              </div>
              {bucket.items.length === 0 ? (
                <p className="text-xs text-zinc-500 py-2">Nothing scheduled here.</p>
              ) : (
                <div className="flex flex-col gap-2.5">{bucket.items.map((t) => renderTaskCard(t, false))}</div>
              )}
            </section>
          ))}
        </div>
      ) : visibleTasks.length === 0 ? (
        <div className="rounded-2xl bg-[#111218] border border-white/[0.08] p-10 text-center flex flex-col items-center gap-2">
          <span className="text-3xl">🔍</span>
          <h2 className="text-base font-bold text-white">No tasks match this filter</h2>
          <button
            type="button"
            onClick={() => {
              setFilter('all');
              setCategoryFilter('All');
              setEnergyFilter('all');
              setTagFilter('All');
              setSearch('');
            }}
            className="mt-1 px-4 py-1.5 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
          >
            Show All Tasks
          </button>
        </div>
      ) : (
        /* ── VIEW 1: GROUPED OR FLAT LIST ── */
        <div className="flex flex-col gap-4">
          {groupedList.map((group) => (
            <div key={group.key} className="flex flex-col gap-2.5">
              {group.label && (
                <div className="flex items-center justify-between px-2 pt-1 text-xs font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <span>{group.label}</span>
                  <span>{group.items.length}</span>
                </div>
              )}
              {group.items.map((t) => renderTaskCard(t, false))}
            </div>
          ))}
        </div>
      )}

      {/* Full Task Edit Inspector Modal */}
      <TaskEditorModal
        task={editingTask}
        allTasks={tasks}
        categories={categories}
        onSave={(updated) => {
          setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
          showToast('Updated task ✓');
        }}
        onDuplicate={(task) => {
          const copy: HumanTask = {
            ...task,
            id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            title: `${task.title} (Copy)`,
            done: false,
            status: 'todo',
            completedAt: undefined,
            createdAt: new Date().toISOString(),
          };
          setTasks((prev) => [copy, ...prev]);
          showToast('Duplicated task ✓');
        }}
        onSaveTemplate={handleSaveAsTemplate}
        onSendToNotes={handleSendTaskToNotes}
        onDelete={deleteTask}
        onClose={() => setEditingTaskId(null)}
      />

      {/* Non-blocking Undo & Status Toast */}
      {(undoSnap || toastMsg) && (
        <div className="fixed bottom-12 right-4 z-40 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-[#16171e] border border-white/[0.15] shadow-2xl text-xs font-mono text-zinc-100 portal-page-enter">
          <span>{toastMsg || undoSnap?.label}</span>
          {undoSnap && (
            <button
              type="button"
              onClick={() => {
                setTasks(undoSnap.prevTasks);
                setUndoSnap(null);
                showToast('Restored previous tasks ✓');
              }}
              className="px-2.5 py-1 rounded-lg bg-sky-500/20 border border-sky-400/40 text-sky-200 font-bold hover:bg-sky-500/30 cursor-pointer"
            >
              Undo
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              setUndoSnap(null);
              setToastMsg(null);
            }}
            aria-label="Dismiss notification"
            className="text-zinc-400 hover:text-white cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}
    </article>
  );
}
