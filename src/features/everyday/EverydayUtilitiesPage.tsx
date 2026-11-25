import React, { useEffect, useMemo, useState } from 'react';
import { HeroArtworkBackdrop } from '../../components/PortalVisuals';
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
  type PersonalGoal,
} from './FocusHabitsGoalsTabs';
import NotesJournalTab, { type HumanNote } from './NotesJournalTab';
import TasksPlannerTab from './TasksPlannerTab';
import type { HumanTask } from './taskTypes';
import { TextAndDevLabTab } from './TextAndDevLabTab';
import { HealthWellnessTab, MoneyFinanceLabTab } from './WellnessAndFinanceTabs';
import {
  DEFAULT_HABITS_STATE,
  EVERYDAY_TAB_GROUPS,
  EVERYDAY_TABS,
  EverydayTabGroupId,
  EverydayTabId,
  FocusState,
  getEverydayTabMeta,
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

  useEffect(() => {
    setActiveTab(initialTab);
  }, [initialTab]);

  const selectTab = (tab: EverydayTabId) => {
    setActiveTab(tab);
    if (onSelectTab) {
      onSelectTab(tab);
    }
  };

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
  }, [activeTab]);

  const today = getLocalDateIso(0);
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

  const openTaskCount = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter((t) => !t.archived && !t.done).length : 0),
    [tasks]
  );
  const activeNoteCount = useMemo(
    () => (Array.isArray(notes) ? notes.filter((n) => !n.trashed).length : 0),
    [notes]
  );
  const habitsDoneToday = useMemo(
    () => habitsState.habits.filter((h) => h.completedDates.includes(today)).length,
    [habitsState.habits, today]
  );
  const focusMinToday = focusStats.lastDate === today ? focusStats.minutesToday : 0;
  const openScheduleBlocksToday = useMemo(
    () => (schedule.blocksByDate?.[today] || []).filter((b) => !b.done).length,
    [schedule.blocksByDate, today]
  );
  const uncheckedChecklistCount = useMemo(
    () =>
      (checklists.lists || []).reduce(
        (acc, list) => acc + list.items.filter((it) => !it.checked).length,
        0
      ),
    [checklists.lists]
  );

  const badgeByTab: Partial<Record<EverydayTabId, string>> = useMemo(
    () => ({
      tasks: openTaskCount > 0 ? String(openTaskCount) : undefined,
      notes: activeNoteCount > 0 ? String(activeNoteCount) : undefined,
      schedule: openScheduleBlocksToday > 0 ? String(openScheduleBlocksToday) : undefined,
      habits: `${habitsDoneToday}/${habitsState.habits.length}`,
      focus: focusMinToday > 0 ? `${focusMinToday}m` : undefined,
      goals: goals.length > 0 ? String(goals.length) : undefined,
      budget: expenses.entries.length > 0 ? String(expenses.entries.length) : undefined,
      checklists: uncheckedChecklistCount > 0 ? String(uncheckedChecklistCount) : undefined,
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
      uncheckedChecklistCount,
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

  const currentMeta = getEverydayTabMeta(activeTab);
  const currentIdx = EVERYDAY_TABS.findIndex((t) => t.id === activeTab);
  const prevTab = currentIdx > 0 ? EVERYDAY_TABS[currentIdx - 1] : null;
  const nextTab = currentIdx >= 0 && currentIdx < EVERYDAY_TABS.length - 1 ? EVERYDAY_TABS[currentIdx + 1] : null;

  return (
    <article className="w-full flex flex-col gap-5 pb-10">
      {/* Unified Full-Width Hero Banner */}
      <header className="w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-5 sm:p-6 shadow-2xl portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="" opacityClass="opacity-28 sm:opacity-42" />
        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-sky-300">
                Personal Productivity &amp; Daily Workspace
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                {EVERYDAY_TABS.length} Horizontal Tabs · Synced SQLite WAL
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
              Everyday Utilities
            </h1>
            <p className="text-xs sm:text-sm text-zinc-400 max-w-3xl">
              Full-width tabbed toolkit combining Daily Overview, Tasks, Notes, Time-Block Day
              Planner, Focus &amp; Breathing, Habits, Goals, Health BMI/Calorie/Sleep, Budget &amp;
              EMI/SIP Finance, Unit Converters, World Clock, Bookmarks &amp; Passwords, Checklists
              &amp; Reading Queue, and Text, Regex &amp; Diff Developer Tools.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 shrink-0">
            <div className="px-3.5 py-2 rounded-xl bg-[#09090c] border border-white/[0.08] flex items-center gap-3 text-xs font-mono">
              <span className="text-emerald-300 font-bold">{openTaskCount} Tasks</span>
              <span className="text-zinc-600">·</span>
              <span className="text-sky-300 font-bold">{activeNoteCount} Notes</span>
              <span className="text-zinc-600">·</span>
              <span className="text-amber-300 font-bold">{focusMinToday}m Focus</span>
            </div>
          </div>
        </div>
      </header>

      {/* Full-Width Horizontal Tabs Bar */}
      <section
        aria-label="Everyday Utilities Navigation Tabs"
        className="w-full rounded-2xl bg-[#111218] border border-white/[0.08] p-3.5 flex flex-col gap-3 shadow-xl"
      >
        <div className="flex flex-wrap items-center justify-between gap-2.5 pb-2.5 border-b border-white/[0.06]">
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              type="button"
              onClick={() => setActiveGroup('all')}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer transition-colors ${
                activeGroup === 'all'
                  ? 'bg-sky-500/20 border-sky-400/45 text-sky-200 font-bold'
                  : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              All Tools ({EVERYDAY_TABS.length})
            </button>
            {EVERYDAY_TAB_GROUPS.map((grp) => {
              const count = EVERYDAY_TABS.filter((t) => t.group === grp.id).length;
              const isGrp = activeGroup === grp.id;
              return (
                <button
                  key={grp.id}
                  type="button"
                  onClick={() => setActiveGroup(isGrp ? 'all' : grp.id)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border cursor-pointer transition-colors ${
                    isGrp
                      ? 'bg-zinc-800 border-white/25 text-white font-semibold'
                      : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
                  }`}
                >
                  {grp.label} ({count})
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="relative flex items-center">
              <input
                type="text"
                value={tabSearch}
                onChange={(e) => setTabSearch(e.target.value)}
                placeholder="Filter tabs..."
                aria-label="Filter Everyday Utilities tabs"
                className="h-8 w-36 sm:w-44 px-3 rounded-lg bg-[#08090c] border border-white/[0.09] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
              />
              {tabSearch && (
                <button
                  type="button"
                  onClick={() => setTabSearch('')}
                  className="absolute right-2 text-[11px] text-zinc-400 hover:text-white cursor-pointer"
                  aria-label="Clear tab search"
                >
                  ✕
                </button>
              )}
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                disabled={!prevTab}
                onClick={() => prevTab && selectTab(prevTab.id)}
                title={prevTab ? `Previous: ${prevTab.label} (Alt+[)` : 'At first tab'}
                className="h-8 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-white/[0.2] disabled:opacity-35 text-[11px] font-mono text-zinc-300 cursor-pointer"
              >
                ← Prev
              </button>
              <button
                type="button"
                disabled={!nextTab}
                onClick={() => nextTab && selectTab(nextTab.id)}
                title={nextTab ? `Next: ${nextTab.label} (Alt+])` : 'At last tab'}
                className="h-8 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-white/[0.2] disabled:opacity-35 text-[11px] font-mono text-zinc-300 cursor-pointer"
              >
                Next →
              </button>
            </div>
          </div>
        </div>

        <nav
          role="tablist"
          aria-label="Everyday Utilities Horizontal Tabs"
          className="flex flex-wrap items-center gap-1.5"
        >
          {visibleTabs.length === 0 ? (
            <span className="text-xs text-zinc-500 px-2 py-1">
              No tabs matched &ldquo;{tabSearch}&rdquo; — clear search to see all tools.
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
                  onClick={() => selectTab(tab.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs border transition-all cursor-pointer ${
                    isActive
                      ? `${tab.activeBorder} text-white font-extrabold shadow-sm`
                      : 'bg-[#16171e] border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] font-medium'
                  }`}
                >
                  <span aria-hidden="true">{tab.icon}</span>
                  <span>{tab.shortLabel}</span>
                  {badge && (
                    <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono border ${tab.accentBadge}`}>
                      {badge}
                    </span>
                  )}
                </button>
              );
            })
          )}
        </nav>
      </section>

      {/* Active Tab Context Banner */}
      <div className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-2 px-4 py-3 rounded-2xl bg-[#111218] border border-white/[0.08]">
        <div className="flex items-center gap-2.5 min-w-0">
          <span className="text-lg shrink-0">{currentMeta.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`text-sm font-extrabold ${currentMeta.accentText}`}>
                {currentMeta.label}
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/[0.05] text-zinc-400">
                {EVERYDAY_TAB_GROUPS.find((g) => g.id === currentMeta.group)?.label}
              </span>
            </div>
            <p className="text-xs text-zinc-400 truncate">{currentMeta.subtitle}</p>
          </div>
        </div>

        {activeTab !== 'overview' && (
          <button
            type="button"
            onClick={() => selectTab('overview')}
            className="px-3 py-1.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-200 text-xs font-extrabold cursor-pointer shrink-0"
          >
            🧭 Daily Overview
          </button>
        )}
      </div>

      {/* 100% Full-Width Active Tool Workspace */}
      <div className="w-full min-w-0">
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
        {activeTab === 'textlab' && <TextAndDevLabTab />}
      </div>
    </article>
  );
}
