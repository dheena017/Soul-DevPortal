import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { HeroArtworkBackdrop, MiniRadialRing } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { BudgetExpensesTab, type ExpensesWorkspaceState } from './BudgetExpensesTab';
import {
  BookmarksSecurityTab,
  CalculatorsUnitsTab,
  WorldClockTab,
} from './CalculatorsClockVaultTabs';
import { DailyOverviewTab } from './DailyOverviewTab';
import {
  ChecklistsAndReadingTab,
  type ChecklistsWorkspaceState,
  SchedulePlannerTab,
  type ScheduleWorkspaceState,
} from './DayPlannerAndChecklistsTabs';
import {
  FocusBreathingTab,
  GoalsCountdownTab,
  HabitsMoodTab,
  LIVE_POMODORO_STORAGE_KEY,
  LIVE_STOPWATCH_STORAGE_KEY,
  type LivePomodoroState,
  type LiveStopwatchState,
  type PersonalGoal,
} from './FocusHabitsGoalsTabs';
import NotesJournalTab, { type HumanNote } from './NotesJournalTab';
import TasksPlannerTab from './TasksPlannerTab';
import type { HumanTask } from './taskTypes';
import { HealthWellnessTab, MoneyFinanceLabTab } from './WellnessAndFinanceTabs';
import {
  DEFAULT_HABITS_STATE,
  EVERYDAY_TAB_GROUPS,
  EVERYDAY_TABS,
  EverydayTabGroupId,
  EverydayTabId,
  FocusState,
  getLocalDateIso,
  HabitsState,
} from './everydayTabsRegistry';

export interface EverydayUtilitiesPageProps {
  initialTab?: EverydayTabId;
  onSelectTab?: (tab: EverydayTabId) => void;
  onNavigate: (viewId: string) => void;
}

export default function EverydayUtilitiesPage({
  initialTab = 'overview',
  onSelectTab,
  onNavigate,
}: EverydayUtilitiesPageProps) {
  const [activeTab, setActiveTab] = useState<EverydayTabId>(initialTab);
  const [activeGroup, setActiveGroup] = useState<'all' | EverydayTabGroupId>('all');
  const [tabSearch, setTabSearch] = useState<string>('');
  const EVERYDAY_LAST_TAB_KEY = 'soul-everyday-last-tab-v1';

  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const [liveClockTick, setLiveClockTick] = useState<number>(() => Date.now());
  const readLiveTimers = useCallback(() => {
    let pomoStr = '';
    let swStr = '';
    try {
      const pRaw = window.localStorage.getItem(LIVE_POMODORO_STORAGE_KEY);
      if (pRaw) {
        const p = JSON.parse(pRaw) as Partial<LivePomodoroState>;
        if (p.running && p.targetEndMs && p.targetEndMs > Date.now()) {
          const sec = Math.max(0, Math.ceil((p.targetEndMs - Date.now()) / 1000));
          const mm = String(Math.floor(sec / 60)).padStart(2, '0');
          const ss = String(sec % 60).padStart(2, '0');
          pomoStr = `${mm}:${ss}`;
        }
      }
      const sRaw = window.localStorage.getItem(LIVE_STOPWATCH_STORAGE_KEY);
      if (sRaw) {
        const sw = JSON.parse(sRaw) as Partial<LiveStopwatchState>;
        if (sw.running && sw.startedAtMs) {
          const ms = (sw.accumulatedMs || 0) + Math.max(0, Date.now() - sw.startedAtMs);
          const mm = String(Math.floor(ms / 60000)).padStart(2, '0');
          const ss = String(Math.floor((ms % 60000) / 1000)).padStart(2, '0');
          swStr = `${mm}:${ss}`;
        }
      }
    } catch {
      // ignore storage errors
    }
    return { pomoStr, swStr };
  }, []);

  const liveTimers = useMemo(
    () => readLiveTimers(),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [readLiveTimers, liveClockTick]
  );

  useEffect(() => {
    const refresh = () => setLiveClockTick(Date.now());
    window.addEventListener('soul-everyday-timer-sync', refresh);
    const id = window.setInterval(refresh, 1000);
    return () => {
      window.removeEventListener('soul-everyday-timer-sync', refresh);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    setActiveTab(initialTab);
    try {
      window.sessionStorage.setItem(EVERYDAY_LAST_TAB_KEY, initialTab);
    } catch {
      // ignore storage errors
    }
    const meta = EVERYDAY_TABS.find((t) => t.id === initialTab);
    if (meta && activeGroup !== 'all' && meta.group !== activeGroup) {
      setActiveGroup('all');
    }
    if (tabSearch.trim()) {
      setTabSearch('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialTab]);

  const selectTab = useCallback(
    (tab: EverydayTabId) => {
      setActiveTab(tab);
      try {
        window.sessionStorage.setItem(EVERYDAY_LAST_TAB_KEY, tab);
      } catch {
        // ignore storage errors
      }
      if (onSelectTab) {
        onSelectTab(tab);
      }
    },
    [onSelectTab]
  );

  // Keyboard Alt+[ and Alt+] to cycle smoothly across Everyday Utility tabs
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = document.activeElement?.tagName || '';
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) return;
      if (e.altKey && (e.key === '[' || e.key === ']')) {
        e.preventDefault();
        const idx = EVERYDAY_TABS.findIndex((t) => t.id === activeTab);
        if (idx < 0) return;
        const nextIdx =
          e.key === ']'
            ? (idx + 1) % EVERYDAY_TABS.length
            : (idx - 1 + EVERYDAY_TABS.length) % EVERYDAY_TABS.length;
        selectTab(EVERYDAY_TABS[nextIdx].id);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [activeTab, selectTab]);

  const today = getLocalDateIso(0);
  const monthPrefix = today.slice(0, 7);
  const [tasks] = useSyncedWorkspaceState<HumanTask[]>('tasks', []);
  const [notes] = useSyncedWorkspaceState<HumanNote[]>('notes', []);
  const [habitsState] = useSyncedWorkspaceState<HabitsState>('habits', DEFAULT_HABITS_STATE);
  const [focusStats] = useSyncedWorkspaceState<FocusState>('focus', {
    sessionsToday: 0,
    minutesToday: 0,
    lastDate: today,
  });
  const [goals] = useSyncedWorkspaceState<PersonalGoal[]>('goals', []);
  const [expenses] = useSyncedWorkspaceState<ExpensesWorkspaceState>('expenses', {
    currency: '₹',
    monthlyBudget: 15000,
    entries: [],
  });
  const [schedule] = useSyncedWorkspaceState<ScheduleWorkspaceState>('schedule', {
    blocksByDate: {},
    weeklyRoutine: {},
  });
  const [checklists] = useSyncedWorkspaceState<ChecklistsWorkspaceState>('checklists', {
    lists: [],
    mediaQueue: [],
  });

  const nonArchivedTasks = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter((t) => !t.archived) : []),
    [tasks]
  );
  const openTaskCount = useMemo(
    () => nonArchivedTasks.filter((t) => !t.done).length,
    [nonArchivedTasks]
  );
  const taskCompletionPct = useMemo(() => {
    if (nonArchivedTasks.length === 0) return 0;
    const doneCount = nonArchivedTasks.length - openTaskCount;
    return Math.round((doneCount / nonArchivedTasks.length) * 100);
  }, [nonArchivedTasks.length, openTaskCount]);

  const activeNoteCount = useMemo(
    () => (Array.isArray(notes) ? notes.filter((n) => !n.trashed).length : 0),
    [notes]
  );

  const habitsDoneToday = useMemo(
    () => habitsState.habits.filter((h) => h.completedDates.includes(today)).length,
    [habitsState.habits, today]
  );
  const habitsPct = useMemo(() => {
    if (habitsState.habits.length === 0) return 0;
    return Math.round((habitsDoneToday / habitsState.habits.length) * 100);
  }, [habitsDoneToday, habitsState.habits.length]);

  const focusMinToday = focusStats.lastDate === today ? focusStats.minutesToday : 0;
  const focusGoalPct = useMemo(
    () => Math.min(100, Math.round((focusMinToday / 120) * 100)),
    [focusMinToday]
  );

  const openScheduleBlocksToday = useMemo(
    () => (schedule.blocksByDate?.[today] || []).filter((b) => !b.done).length,
    [schedule.blocksByDate, today]
  );

  const checklistStats = useMemo(() => {
    const lists = checklists.lists || [];
    let total = 0;
    let checked = 0;
    for (const l of lists) {
      total += l.items.length;
      checked += l.items.filter((i) => i.checked).length;
    }
    return { unchecked: total - checked, total, pct: total > 0 ? Math.round((checked / total) * 100) : 0 };
  }, [checklists.lists]);

  const spentThisMonth = useMemo(
    () =>
      (expenses.entries || [])
        .filter((e) => e.date?.startsWith(monthPrefix))
        .reduce((acc, e) => acc + (Number(e.amount) || 0), 0),
    [expenses.entries, monthPrefix]
  );

  const budgetUsedPct = useMemo(() => {
    const cap = Math.max(1, expenses.monthlyBudget || 15000);
    return Math.min(100, Math.round((spentThisMonth / cap) * 100));
  }, [spentThisMonth, expenses.monthlyBudget]);

  const badgeByTab: Partial<Record<EverydayTabId, string>> = useMemo(
    () => ({
      tasks: openTaskCount > 0 ? String(openTaskCount) : undefined,
      notes: activeNoteCount > 0 ? String(activeNoteCount) : undefined,
      schedule: openScheduleBlocksToday > 0 ? String(openScheduleBlocksToday) : undefined,
      habits: `${habitsDoneToday}/${habitsState.habits.length}`,
      focus: focusMinToday > 0 ? `${focusMinToday}m` : undefined,
      goals: goals.length > 0 ? String(goals.length) : undefined,
      budget: expenses.entries.length > 0 ? String(expenses.entries.length) : undefined,
      checklists: checklistStats.unchecked > 0 ? String(checklistStats.unchecked) : undefined,
    }),
    [
      openTaskCount,
      activeNoteCount,
      openScheduleBlocksToday,
      habitsDoneToday,
      habitsState.habits.length,
      focusMinToday,
      goals.length,
      expenses.entries.length,
      checklistStats.unchecked,
    ]
  );

  const visibleTabs = useMemo(() => {
    const q = tabSearch.trim().toLowerCase();
    return EVERYDAY_TABS.filter((t) => {
      if (activeGroup !== 'all' && t.group !== activeGroup) return false;
      if (!q) return true;
      return (
        t.label.toLowerCase().includes(q) ||
        t.subtitle.toLowerCase().includes(q) ||
        t.keywords.some((k) => k.includes(q))
      );
    });
  }, [activeGroup, tabSearch]);

  const updateScrollArrows = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollArrows();
    const el = tabsRef.current;
    if (!el) return;
    const raf = window.requestAnimationFrame(() => {
      const selectedBtn = el.querySelector<HTMLButtonElement>('[aria-selected="true"]');
      if (selectedBtn) {
        selectedBtn.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
      }
      updateScrollArrows();
    });
    const ro = new ResizeObserver(updateScrollArrows);
    ro.observe(el);
    window.addEventListener('resize', updateScrollArrows);
    return () => {
      window.cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', updateScrollArrows);
    };
  }, [updateScrollArrows, visibleTabs.length, activeTab]);

  const scrollTabs = (dir: -1 | 1) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 280, behavior: 'smooth' });
  };

  const handleTabClick = (tabId: EverydayTabId, e: React.MouseEvent<HTMLButtonElement>) => {
    selectTab(tabId);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  };

  const tabClass = (isActive: boolean) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
      isActive
        ? 'text-white font-bold border border-white/20'
        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
    }`;

  return (
    <div className="w-full py-1 flex flex-col gap-5 pb-10 fade-in-up">
      {/* ══════════════════════════════════════════════════════════════════════
          UNIFIED SINGLE HERO HEADER CARD (Matched to SystemHeaderCard layout)
      ══════════════════════════════════════════════════════════════════════ */}
      <header className="relative overflow-hidden w-full p-4 sm:p-5 md:p-6 rounded-2xl neu-card system-card flex flex-col gap-4 sm:gap-5">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="Everyday Utilities Backdrop" opacityClass="opacity-80 sm:opacity-95" />
        <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
          {/* Row 1: Identity + Compact Controls */}
          <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5 min-w-0">
              <div className="w-11 h-11 rounded-xl soul-emblem-box flex items-center justify-center text-emerald-300 text-lg shrink-0 portal-emblem-hover">
                🧰
              </div>
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                    Everyday Utilities
                  </h1>
                  <span className="neu-tile px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#181820] border border-white/[0.1] text-zinc-300">
                    {EVERYDAY_TABS.length} Tools
                  </span>
                  <span className="neu-tile inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold bg-emerald-500/15 border-emerald-500/35 text-emerald-300">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                    <span>SQLite WAL Synced</span>
                  </span>
                </div>

                <p className="text-xs text-zinc-400 truncate">
                  Tasks, Notes, Day Schedule, Focus Audio, Habits, Health, Budget, Finance Lab, Converters, Clock &amp; Checklists
                </p>
              </div>
            </div>

            {/* Right Controls: Group Selector + Tab Filter + Overview Reset */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <div className="inline-flex items-center rounded-lg neu-tray bg-[#16161c] border border-white/[0.08] p-0.5" title="Filter tab category">
                <button
                  type="button"
                  onClick={() => setActiveGroup('all')}
                  className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                    activeGroup === 'all'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  All
                </button>
                {EVERYDAY_TAB_GROUPS.map((grp) => (
                  <button
                    key={grp.id}
                    type="button"
                    onClick={() => setActiveGroup(activeGroup === grp.id ? 'all' : grp.id)}
                    className={`hidden sm:inline-flex px-2 py-1 rounded-md text-[11px] font-medium transition-colors cursor-pointer ${
                      activeGroup === grp.id
                        ? 'bg-purple-500/20 text-purple-200 border border-purple-400/35 font-bold'
                        : 'text-zinc-400 hover:text-white border border-transparent'
                    }`}
                  >
                    {grp.label.split(',')[0].split('&')[0].trim()}
                  </button>
                ))}
              </div>

              <div className="relative flex items-center">
                <input
                  type="text"
                  value={tabSearch}
                  onChange={(e) => setTabSearch(e.target.value)}
                  placeholder="Find tool..."
                  aria-label="Filter Everyday Utilities tabs"
                  className="neu-inset h-8 w-28 sm:w-36 px-2.5 rounded-lg bg-[#16161c] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
                />
                {tabSearch && (
                  <button
                    type="button"
                    onClick={() => setTabSearch('')}
                    className="absolute right-2 text-[10px] text-zinc-400 hover:text-white cursor-pointer"
                    aria-label="Clear tool filter"
                  >
                    ✕
                  </button>
                )}
              </div>

              {(liveTimers.pomoStr || liveTimers.swStr) && activeTab !== 'focus' && (
                <button
                  type="button"
                  onClick={() => selectTab('focus')}
                  title="Jump to active Focus Timer / Stopwatch"
                  className="neu-btn inline-flex items-center gap-1.5 h-8 px-2.5 rounded-lg bg-amber-500/15 border border-amber-400/40 text-[11px] font-mono font-bold text-amber-200 hover:bg-amber-500/25 cursor-pointer"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>
                    {liveTimers.pomoStr ? `Focus ${liveTimers.pomoStr}` : ''}
                    {liveTimers.pomoStr && liveTimers.swStr ? ' · ' : ''}
                    {liveTimers.swStr ? `SW ${liveTimers.swStr}` : ''}
                  </span>
                </button>
              )}

              {activeTab !== 'overview' && (
                <button
                  type="button"
                  onClick={() => selectTab('overview')}
                  className="neu-btn inline-flex items-center gap-1.5 h-8 px-3 rounded-lg bg-[#16161c] border border-white/[0.1] text-xs font-semibold text-zinc-200 hover:text-white hover:border-white/[0.22] transition-all cursor-pointer"
                >
                  <span>🧭</span>
                  <span>Overview</span>
                </button>
              )}
            </div>
          </div>

          {/* Row 2: 4-Metric Live Ring Summary Bar (Matched to CPU / Memory / Volumes / Battery) */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 portal-grid-stagger">
            <button
              type="button"
              onClick={() => selectTab('tasks')}
              className="flex items-center justify-between p-2.5 rounded-xl neu-inset bg-[#0e0e13]/90 border border-white/[0.07] hover:border-sky-400/35 text-left cursor-pointer portal-card-hover"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">TASKS PLANNER</span>
                <strong className="text-sm font-mono font-bold text-sky-300 tabular-nums truncate">
                  {openTaskCount} Open · {taskCompletionPct}%
                </strong>
              </div>
              <MiniRadialRing percent={taskCompletionPct} color="#38bdf8" size={26} />
            </button>

            <button
              type="button"
              onClick={() => selectTab('notes')}
              className="flex items-center justify-between p-2.5 rounded-xl neu-inset bg-[#0e0e13]/90 border border-white/[0.07] hover:border-purple-400/35 text-left cursor-pointer portal-card-hover"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">NOTES &amp; LISTS</span>
                <strong className="text-sm font-mono font-bold text-purple-300 tabular-nums truncate">
                  {activeNoteCount} Notes · {checklistStats.pct}%
                </strong>
              </div>
              <MiniRadialRing percent={checklistStats.pct || Math.min(100, activeNoteCount * 10)} color="#c084fc" size={26} />
            </button>

            <button
              type="button"
              onClick={() => selectTab('habits')}
              className="flex items-center justify-between p-2.5 rounded-xl neu-inset bg-[#0e0e13]/90 border border-white/[0.07] hover:border-emerald-400/35 text-left cursor-pointer portal-card-hover"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">HABITS TODAY</span>
                <strong className="text-sm font-mono font-bold text-emerald-300 tabular-nums truncate">
                  {habitsDoneToday}/{habitsState.habits.length} ({habitsPct}%)
                </strong>
              </div>
              <MiniRadialRing percent={habitsPct} color="#34d399" size={26} />
            </button>

            <button
              type="button"
              onClick={() => selectTab(focusMinToday > 0 ? 'focus' : 'budget')}
              className="flex items-center justify-between p-2.5 rounded-xl neu-inset bg-[#0e0e13]/90 border border-white/[0.07] hover:border-amber-400/35 text-left cursor-pointer portal-card-hover"
            >
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">FOCUS &amp; BUDGET</span>
                <strong className="text-sm font-mono font-bold text-amber-300 tabular-nums truncate">
                  {focusMinToday}m · {expenses.currency}{spentThisMonth.toLocaleString()}
                </strong>
              </div>
              <MiniRadialRing
                percent={focusMinToday > 0 ? focusGoalPct : budgetUsedPct}
                color="#fbbf24"
                size={26}
              />
            </button>
          </div>

          {/* Row 3: Integrated Single-Row Icon + Pill Strip with Left / Right Scroll Arrows */}
          <div className="pt-3.5 border-t border-white/[0.06] flex items-center gap-2">
            {(canScrollLeft || canScrollRight) && (
              <button
                type="button"
                onClick={() => scrollTabs(-1)}
                disabled={!canScrollLeft}
                aria-label="Scroll tabs left"
                title="Scroll tabs left"
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                  canScrollLeft
                    ? 'neu-btn bg-[#16161c] border-white/[0.14] text-zinc-200 hover:text-white hover:border-sky-400/50 hover:bg-sky-500/15 cursor-pointer'
                    : 'neu-inset bg-[#111115] border-white/[0.05] text-zinc-600 opacity-45 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
            )}

            <div
              ref={tabsRef}
              role="tablist"
              aria-label="Everyday Utilities sections"
              onScroll={updateScrollArrows}
              className="neu-tray relative flex-1 min-w-0 flex items-center gap-1.5 p-1 rounded-xl border border-white/[0.06] overflow-x-auto system-tabs-scroller"
            >
              {visibleTabs.length === 0 ? (
                <span className="text-xs text-zinc-400 px-2 py-1">
                  No tabs match &ldquo;{tabSearch}&rdquo;
                </span>
              ) : (
                visibleTabs.map((tab) => {
                  const isActive = activeTab === tab.id;
                  const badge = badgeByTab[tab.id];
                  return (
                    <button
                      key={tab.id}
                      type="button"
                      role="tab"
                      aria-selected={isActive}
                      title={tab.subtitle}
                      onClick={(e) => handleTabClick(tab.id, e)}
                      className={tabClass(isActive)}
                    >
                      <span aria-hidden="true">{tab.icon}</span>
                      <span>{tab.shortLabel}</span>
                      {badge && (
                        <span
                          className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${
                            tab.accentBadge
                          }`}
                        >
                          {badge}
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {(canScrollLeft || canScrollRight) && (
              <button
                type="button"
                onClick={() => scrollTabs(1)}
                disabled={!canScrollRight}
                aria-label="Scroll tabs right"
                title="Scroll tabs right"
                className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
                  canScrollRight
                    ? 'neu-btn bg-[#16161c] border-white/[0.14] text-zinc-200 hover:text-white hover:border-sky-400/50 hover:bg-sky-500/15 cursor-pointer'
                    : 'neu-inset bg-[#111115] border-white/[0.05] text-zinc-600 opacity-45 cursor-not-allowed'
                }`}
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Straight Into Full-Width Active Tool Content (Matched to SystemView) */}
      <div key={activeTab} className="tab-content-animate w-full min-w-0">
        {activeTab === 'overview' && <DailyOverviewTab onSelectTab={selectTab} />}
        {activeTab === 'tasks' && <TasksPlannerTab embedded onNavigate={onNavigate} />}
        {activeTab === 'notes' && <NotesJournalTab embedded onNavigate={onNavigate} />}
        {activeTab === 'schedule' && <SchedulePlannerTab />}
        {activeTab === 'focus' && <FocusBreathingTab onSelectTab={selectTab} />}
        {activeTab === 'habits' && <HabitsMoodTab />}
        {activeTab === 'goals' && <GoalsCountdownTab />}
        {activeTab === 'health' && <HealthWellnessTab />}
        {activeTab === 'budget' && <BudgetExpensesTab />}
        {activeTab === 'finance' && <MoneyFinanceLabTab />}
        {activeTab === 'calculators' && <CalculatorsUnitsTab />}
        {activeTab === 'worldtime' && <WorldClockTab />}
        {activeTab === 'vault' && <BookmarksSecurityTab />}
        {activeTab === 'checklists' && <ChecklistsAndReadingTab />}
      </div>
    </div>
  );
}
