import React, { useMemo, useState } from 'react';
import { HeroArtworkBackdrop, MiniRadialRing } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import type { HumanNote } from './NotesJournalTab';
import {
  buildStarterTasks,
  formatDueBadge,
  HumanTask,
  priorityStyle,
  todayIso,
} from './taskTypes';
import type { ExpensesWorkspaceState } from './BudgetExpensesTab';
import type { PersonalGoal } from './FocusHabitsGoalsTabs';
import {
  DEFAULT_HABITS_STATE,
  EVERYDAY_TAB_GROUPS,
  EVERYDAY_TABS,
  EverydayTabId,
  FocusState,
  getLocalDateIso,
  HabitsState,
} from './everydayTabsRegistry';

export interface DailyOverviewTabProps {
  onSelectTab: (tab: EverydayTabId) => void;
}

function getGreeting(): string {
  const hr = new Date().getHours();
  if (hr < 12) return 'Good morning';
  if (hr < 17) return 'Good afternoon';
  return 'Good evening';
}

export const DailyOverviewTab: React.FC<DailyOverviewTabProps> = ({ onSelectTab }) => {
  const today = todayIso();
  const localToday = getLocalDateIso(0);

  const [tasks, setTasks] = useSyncedWorkspaceState<HumanTask[]>('tasks', buildStarterTasks);
  const [notes, setNotes] = useSyncedWorkspaceState<HumanNote[]>('notes', []);
  const [habitsState, setHabitsState] = useSyncedWorkspaceState<HabitsState>(
    'habits',
    DEFAULT_HABITS_STATE
  );
  const [focusStats] = useSyncedWorkspaceState<FocusState>('focus', {
    sessionsToday: 0,
    minutesToday: 0,
    lastDate: localToday,
  });
  const [expensesState] = useSyncedWorkspaceState<ExpensesWorkspaceState>('expenses', {
    currency: '₹',
    monthlyBudget: 15000,
    entries: [],
  });
  const [goals] = useSyncedWorkspaceState<PersonalGoal[]>('goals', []);

  // Quick capture bar (switch between quick task & quick note)
  const [captureKind, setCaptureKind] = useState<'task' | 'note'>('task');
  const [captureText, setCaptureText] = useState<string>('');
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);

  const activeTasks = useMemo(
    () => tasks.filter((t) => !t.archived),
    [tasks]
  );

  const openTasks = useMemo(
    () => activeTasks.filter((t) => !t.done),
    [activeTasks]
  );

  const priorityTasks = useMemo(() => {
    const score = (t: HumanTask) => {
      let s = 0;
      if (t.dueDate && t.dueDate < today) s += 60;
      else if (t.dueDate === today) s += 40;
      if (t.starred) s += 25;
      if (t.priority === 'high') s += 20;
      else if (t.priority === 'medium') s += 10;
      return s;
    };
    return [...openTasks].sort((a, b) => score(b) - score(a)).slice(0, 6);
  }, [openTasks, today]);

  const activeNotes = useMemo(
    () => notes.filter((n) => !n.trashed),
    [notes]
  );

  const featuredNotes = useMemo(() => {
    return [...activeNotes]
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, 4);
  }, [activeNotes]);

  const habitsTodayDone = useMemo(
    () => habitsState.habits.filter((h) => h.completedDates.includes(localToday)).length,
    [habitsState.habits, localToday]
  );

  const focusSessionsToday = focusStats.lastDate === localToday ? focusStats.sessionsToday : 0;
  const focusMinutesToday = focusStats.lastDate === localToday ? focusStats.minutesToday : 0;

  const monthPrefix = localToday.slice(0, 7);
  const monthSpent = useMemo(
    () =>
      expensesState.entries
        .filter((e) => e.date.startsWith(monthPrefix))
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
    [expensesState.entries, monthPrefix]
  );
  const budgetLeft = Math.max(0, expensesState.monthlyBudget - monthSpent);

  const toggleTaskDone = (id: string) => {
    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              done: !t.done,
              status: !t.done ? 'done' : 'todo',
              completedAt: !t.done ? nowIso : undefined,
            }
          : t
      )
    );
  };

  const toggleHabitToday = (habitId: string) => {
    setHabitsState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const has = h.completedDates.includes(localToday);
        return {
          ...h,
          completedDates: has
            ? h.completedDates.filter((d) => d !== localToday)
            : [...h.completedDates, localToday],
        };
      }),
    }));
  };

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = captureText.trim();
    if (!clean) return;
    if (captureKind === 'task') {
      const created: HumanTask = {
        id: `task-quick-${Date.now()}`,
        title: clean,
        done: false,
        status: 'todo',
        priority: 'medium',
        category: 'Personal',
        dueDate: today,
        repeat: 'none',
        starred: false,
        notes: '',
        subtasks: [],
        createdAt: new Date().toISOString(),
      };
      setTasks((prev) => [created, ...prev]);
      setCaptureNotice(`Added task "${clean}" for Today`);
    } else {
      const now = new Date().toISOString();
      const createdNote: HumanNote = {
        id: `note-quick-${Date.now()}`,
        title: clean.length > 48 ? `${clean.slice(0, 48)}...` : clean,
        content: `# ${clean}\n\nCaptured on ${localToday}\n`,
        notebook: 'Quick Captures',
        tags: ['Quick'],
        pinned: false,
        accent: 'sky',
        updatedAt: now,
        createdAt: now,
      };
      setNotes((prev) => [createdNote, ...prev]);
      setCaptureNotice(`Saved note "${createdNote.title}"`);
    }
    setCaptureText('');
    window.setTimeout(() => setCaptureNotice(null), 2600);
  };

  const readableToday = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const taskCompletionPct =
    activeTasks.length > 0 ? Math.round(((activeTasks.length - openTasks.length) / activeTasks.length) * 100) : 0;
  const habitPct =
    habitsState.habits.length > 0 ? Math.round((habitsTodayDone / habitsState.habits.length) * 100) : 0;
  const focusGoalPct = Math.min(100, Math.round((focusMinutesToday / 90) * 100));
  const budgetLeftPct =
    expensesState.monthlyBudget > 0 ? Math.round((budgetLeft / expensesState.monthlyBudget) * 100) : 100;

  return (
    <div className="flex flex-col gap-5">
      {/* Greeting + Quick Capture Strip */}
      <section className="neu-card relative overflow-hidden rounded-2xl bg-[#111218] border border-white/[0.09] p-5 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="" opacityClass="opacity-75 sm:opacity-92" />
        <div className="relative z-10 flex flex-col gap-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300">
                {readableToday}
              </span>
              <h2 className="text-xl font-extrabold text-white mt-0.5">
                {getGreeting()} — Daily Overview &amp; Quick Capture
              </h2>
            </div>
            {captureNotice && (
              <span className="neu-tile px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                ✓ {captureNotice}
              </span>
            )}
          </div>

          <form onSubmit={handleQuickCapture} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <div className="neu-tray flex items-center p-0.5 rounded-xl bg-[#08090c] border border-white/[0.08] shrink-0" role="tablist" aria-label="Quick capture mode">
              <button
                type="button"
                role="tab"
                aria-selected={captureKind === 'task'}
                onClick={() => setCaptureKind('task')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  captureKind === 'task' ? 'bg-emerald-500/20 text-emerald-200 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                ✅ Quick Task
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={captureKind === 'note'}
                onClick={() => setCaptureKind('note')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer ${
                  captureKind === 'note' ? 'bg-sky-500/20 text-sky-200 font-bold' : 'text-zinc-400 hover:text-white'
                }`}
              >
                📝 Quick Note
              </button>
            </div>

            <input
              type="text"
              value={captureText}
              onChange={(e) => setCaptureText(e.target.value)}
              placeholder={
                captureKind === 'task'
                  ? 'Capture a task for today (e.g., Pay electric bill, Review PR)...'
                  : 'Jot down a quick note, thought, or snippet...'
              }
              aria-label="Quick capture input"
              className="neu-inset flex-1 h-10 px-3.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
            />
            <button
              type="submit"
              className="neu-btn h-10 px-5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold cursor-pointer shrink-0"
            >
              + Save {captureKind === 'task' ? 'Task' : 'Note'}
            </button>
          </form>
        </div>
      </section>

      {/* Live Daily KPI Summary */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <button
          type="button"
          onClick={() => onSelectTab('tasks')}
          className="neu-card neu-card-interactive text-left p-4 rounded-2xl bg-[#111218] border border-emerald-500/25 hover:border-emerald-400/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Open Tasks</div>
            <div className="text-2xl font-extrabold font-mono text-white tabular-nums mt-1">
              {openTasks.length}
            </div>
            <div className="text-[11px] text-emerald-300 mt-1">
              {openTasks.filter((t) => t.dueDate === today).length} due today →
            </div>
          </div>
          <MiniRadialRing percent={taskCompletionPct} color="#10b981" size={44} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('habits')}
          className="neu-card neu-card-interactive text-left p-4 rounded-2xl bg-[#111218] border border-sky-400/25 hover:border-sky-400/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Habits Today</div>
            <div className="text-2xl font-extrabold font-mono text-white tabular-nums mt-1">
              {habitsTodayDone}/{habitsState.habits.length}
            </div>
            <div className="text-[11px] text-sky-300 mt-1">
              Toggle daily streaks →
            </div>
          </div>
          <MiniRadialRing percent={habitPct} color="#38bdf8" size={44} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('focus')}
          className="neu-card neu-card-interactive text-left p-4 rounded-2xl bg-[#111218] border border-amber-400/25 hover:border-amber-400/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Focus Logged</div>
            <div className="text-2xl font-extrabold font-mono text-amber-300 tabular-nums mt-1">
              {focusMinutesToday}m
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              {focusSessionsToday} sessions today →
            </div>
          </div>
          <MiniRadialRing percent={focusGoalPct} color="#f59e0b" size={44} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('budget')}
          className="neu-card neu-card-interactive text-left p-4 rounded-2xl bg-[#111218] border border-purple-400/25 hover:border-purple-400/50 transition-colors cursor-pointer flex items-center justify-between gap-3"
        >
          <div className="min-w-0">
            <div className="text-[11px] font-mono uppercase tracking-wider text-zinc-400">Budget Left</div>
            <div className="text-2xl font-extrabold font-mono text-emerald-300 tabular-nums mt-1">
              {expensesState.currency}
              {budgetLeft.toLocaleString()}
            </div>
            <div className="text-[11px] text-zinc-400 mt-1">
              Spent {expensesState.currency}
              {monthSpent.toLocaleString()} this month →
            </div>
          </div>
          <MiniRadialRing percent={budgetLeftPct} color="#a855f7" size={44} />
        </button>
      </div>

      {/* Interactive Today's Priorities & Habit Quick Check */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5 items-stretch">
        {/* Tasks Glance */}
        <section className="neu-card rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col justify-between">
          <div className="relative overflow-hidden px-5 pt-4 pb-3.5 border-b border-white/[0.07] shrink-0 flex items-center justify-between gap-2">
            <HeroArtworkBackdrop src="/visuals/pillar-projects-topology.jpg" alt="" opacityClass="opacity-65 sm:opacity-80" />
            <div className="relative z-10 min-w-0">
              <h3 className="text-sm font-bold text-white">Priority Tasks Queue</h3>
              <p className="text-xs text-zinc-400">Click to check off or open full planner</p>
            </div>
            <button
              type="button"
              onClick={() => onSelectTab('tasks')}
              className="neu-btn relative z-10 px-3 py-1.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 hover:bg-emerald-500/25 text-xs font-bold text-emerald-200 cursor-pointer shrink-0"
            >
              Open Tasks →
            </button>
          </div>

          <div className="flex-1 p-5 flex flex-col gap-2">
            {priorityTasks.length === 0 ? (
              <div className="neu-inset flex-1 min-h-[140px] p-5 rounded-xl bg-[#08090c] border border-dashed border-white/[0.07] flex items-center justify-center text-xs text-zinc-400 text-center">
                All clear! No pending tasks in your queue.
              </div>
            ) : (
              priorityTasks.map((t) => {
                const due = formatDueBadge(t.dueDate, t.dueTime);
                const prio = priorityStyle(t.priority);
                return (
                  <div
                    key={t.id}
                    className="neu-tile flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl bg-[#16171e] border border-white/[0.07]"
                  >
                    <button
                      type="button"
                      onClick={() => toggleTaskDone(t.id)}
                      className="flex items-center gap-2.5 min-w-0 text-left cursor-pointer flex-1"
                    >
                      <span className="w-4 h-4 rounded border border-zinc-500 flex items-center justify-center text-[10px] text-transparent hover:border-emerald-400 shrink-0">
                        ✓
                      </span>
                      <span className="text-xs font-semibold text-zinc-100 truncate">
                        {t.starred ? '★ ' : ''}
                        {t.title}
                      </span>
                    </button>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono uppercase border ${prio}`}>
                        {t.priority}
                      </span>
                      {due && (
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${due.tone}`}>
                          {due.label}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
            <span>{openTasks.length} open · {openTasks.filter((t) => t.starred).length} starred</span>
            <span className="text-zinc-600">Top {priorityTasks.length} sorted by urgency</span>
          </div>
        </section>

        {/* Habits + Notes Preview */}
        <div className="flex flex-col gap-5">
          <section className="neu-card rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col justify-between flex-1">
            <div className="relative overflow-hidden px-5 pt-4 pb-3.5 border-b border-white/[0.07] shrink-0 flex items-center justify-between gap-2">
              <HeroArtworkBackdrop src="/visuals/checklists-workspace.jpg" alt="" opacityClass="opacity-65 sm:opacity-80" />
              <div className="relative z-10 min-w-0">
                <h3 className="text-sm font-bold text-white">Today’s Habit Check-In</h3>
                <p className="text-xs text-zinc-400">One-tap checkoff for {localToday}</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('habits')}
                className="neu-btn relative z-10 px-3 py-1.5 rounded-xl bg-sky-500/15 border border-sky-400/35 hover:bg-sky-500/25 text-xs font-bold text-sky-200 cursor-pointer shrink-0"
              >
                7-Day Grid →
              </button>
            </div>

            <div className="flex-1 p-5 flex flex-col justify-center">
              {habitsState.habits.length === 0 ? (
                <div className="neu-inset p-5 rounded-xl bg-[#08090c] border border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-center">
                  <span className="text-xs font-semibold text-zinc-300">No habits tracked yet</span>
                  <span className="text-[11px] text-zinc-500 max-w-xs">
                    Add daily routines in the 7-Day Grid to check off streaks directly from your morning overview.
                  </span>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {habitsState.habits.map((h) => {
                    const doneToday = h.completedDates.includes(localToday);
                    return (
                      <button
                        key={h.id}
                        type="button"
                        onClick={() => toggleHabitToday(h.id)}
                        className={`neu-tile flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors cursor-pointer ${
                          doneToday
                            ? 'bg-emerald-500/15 border-emerald-400/40 text-emerald-100'
                            : 'bg-[#16171e] border-white/[0.07] text-zinc-300 hover:border-white/[0.2]'
                        }`}
                      >
                        <span className="text-xs font-semibold truncate">
                          {h.emoji} {h.name}
                        </span>
                        <span className="text-xs font-mono shrink-0">{doneToday ? '✓' : '○'}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
              <span>{habitsTodayDone}/{habitsState.habits.length} completed today</span>
              <span className={habitPct === 100 && habitsState.habits.length > 0 ? 'text-emerald-300' : 'text-zinc-600'}>
                {habitPct}% consistency
              </span>
            </div>
          </section>

          <section className="neu-card rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col justify-between">
            <div className="relative overflow-hidden px-5 pt-4 pb-3.5 border-b border-white/[0.07] shrink-0 flex items-center justify-between gap-2">
              <HeroArtworkBackdrop src="/visuals/pillar-docs-blueprint.jpg" alt="" opacityClass="opacity-65 sm:opacity-80" />
              <div className="relative z-10 min-w-0">
                <h3 className="text-sm font-bold text-white">Pinned &amp; Recent Notes</h3>
                <p className="text-xs text-zinc-400">{activeNotes.length} active markdown notes</p>
              </div>
              <button
                type="button"
                onClick={() => onSelectTab('notes')}
                className="neu-btn relative z-10 px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.1] hover:border-sky-400/40 text-xs font-bold text-zinc-200 cursor-pointer shrink-0"
              >
                Open Notes →
              </button>
            </div>

            <div className="p-5">
              {featuredNotes.length === 0 ? (
                <div className="neu-inset p-4 rounded-xl bg-[#08090c] border border-dashed border-white/[0.07] text-xs text-zinc-500 text-center">
                  No notes yet. Create one via Quick Capture above!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {featuredNotes.map((n) => (
                    <button
                      key={n.id}
                      type="button"
                      onClick={() => onSelectTab('notes')}
                      className="neu-tile p-3 rounded-xl bg-[#16171e] border border-white/[0.07] hover:border-sky-400/40 text-left cursor-pointer"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold text-white truncate">
                          {n.pinned ? '📌 ' : ''}
                          {n.title}
                        </span>
                        <span className="text-[10px] font-mono text-zinc-500 shrink-0">
                          {n.notebook || 'Personal'}
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
              <span>{featuredNotes.filter((n) => n.pinned).length} pinned · {activeNotes.length} total</span>
              <span className="text-zinc-600">Markdown Synced</span>
            </div>
          </section>
        </div>
      </div>

      {/* Goals Progress Glance if goals exist */}
      {goals.length > 0 && (
        <section className="neu-card rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white">Active Personal Goals</h3>
            <button
              type="button"
              onClick={() => onSelectTab('goals')}
              className="text-xs font-bold text-purple-300 hover:text-purple-200 cursor-pointer"
            >
              Manage Goals &amp; Countdowns →
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {goals.slice(0, 3).map((g) => {
              const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
              return (
                <div key={g.id} className="neu-tile p-3 rounded-xl bg-[#16171e] border border-white/[0.07] flex flex-col gap-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white truncate">{g.title}</span>
                    <span className="font-mono text-sky-300 font-bold">{pct}%</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/50 overflow-hidden">
                    <div className="h-full bg-sky-400" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="text-[11px] font-mono text-zinc-400">
                    {g.current} / {g.target} {g.unit}
                  </span>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Full Tab Directory inside Everyday Utilities */}
      <section className="neu-card rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
        <div>
          <h3 className="text-base font-bold text-white">All Tools Inside Everyday Utilities</h3>
          <p className="text-xs text-zinc-400">
            Jump straight into any specialized utility tab from the side rail or below.
          </p>
        </div>

        <div className="flex flex-col gap-4">
          {EVERYDAY_TAB_GROUPS.map((group) => {
            const items = EVERYDAY_TABS.filter((t) => t.group === group.id && t.id !== 'overview');
            return (
              <div key={group.id} className="flex flex-col gap-2">
                <div className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  {group.label}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-2.5">
                  {items.map((tab) => (
                    <button
                      key={tab.id}
                      type="button"
                      onClick={() => onSelectTab(tab.id)}
                      className="neu-tile flex items-start gap-3 p-3.5 rounded-xl bg-[#16171e] border border-white/[0.08] hover:border-white/[0.22] hover:bg-[#181a24] text-left transition-colors cursor-pointer"
                    >
                      <span className="text-xl shrink-0 mt-0.5">{tab.icon}</span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-xs font-bold text-white">{tab.label}</span>
                        <span className="text-[11px] text-zinc-400 leading-snug">{tab.subtitle}</span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
};
