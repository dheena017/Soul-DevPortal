import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSharedTelemetry } from '../services/telemetryStore';
import { useSyncedWorkspaceState } from '../services/workspaceStateStore';
import { SystemLiveSnapshot } from '../types';
import {
  DEFAULT_HABITS_STATE,
  FocusState,
  HabitsState,
  getLocalDateIso,
  isEverydayRoute,
} from '../features/everyday/everydayTabsRegistry';
import type { ScheduleWorkspaceState } from '../features/everyday/DayPlannerAndChecklistsTabs';
import type { PersonalGoal } from '../features/everyday/FocusHabitsGoalsTabs';
import type { HumanNote } from '../features/everyday/NotesJournalTab';
import type { HumanTask } from '../features/everyday/taskTypes';
import { copyTextSafe } from '../utils/clipboard';
import { openChangelogPanel } from '../utils/openStandalonePanel';

export interface GlobalStatusBarProps {
  active: string;
  onNavigate: (viewId: string) => void;
  isBackendLive?: boolean;
  liveTelemetry?: SystemLiveSnapshot | null;
  canScrollTop: boolean;
  onScrollTop: () => void;
  projectsCount: number;
  onOpenShortcuts: () => void;
  onFocusSearch?: () => void;
  terminalDrawerOpen?: boolean;
  onToggleTerminalDrawer?: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const APP_SESSION_START = Date.now();
const COUNTDOWN_EVENTS_KEY = 'soul-everyday-countdowns-v1';

interface SavedEventCountdown {
  id: string;
  label: string;
  date: string;
}

function toLocalIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

function readCountdownEvents(): SavedEventCountdown[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(COUNTDOWN_EVENTS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

const StatusSvg: React.FC<{ children: React.ReactNode; className?: string }> = ({
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

function formatUptime(totalSec?: number): string {
  if (!totalSec || totalSec < 0) return '—';
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatSessionDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatRate(kbps?: number): string {
  if (kbps === undefined || kbps === null || Number.isNaN(kbps)) return '0 KB/s';
  if (kbps >= 1024) return `${(kbps / 1024).toFixed(1)} MB/s`;
  return `${Math.round(kbps)} KB/s`;
}

export const GlobalStatusBar: React.FC<GlobalStatusBarProps> = ({
  active,
  onNavigate,
  isBackendLive: propBackendLive,
  liveTelemetry: propLiveTelemetry,
  canScrollTop,
  onScrollTop,
  projectsCount,
  onOpenShortcuts,
  onFocusSearch,
  terminalDrawerOpen = false,
  onToggleTerminalDrawer,
}) => {
  const shared = useSharedTelemetry(propBackendLive === undefined);
  const isBackendLive = propBackendLive ?? shared.isBackendLive;
  const liveTelemetry = propLiveTelemetry !== undefined ? propLiveTelemetry : shared.liveTelemetry;
  const [now, setNow] = useState<Date>(() => new Date());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [use24Hour, setUse24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('soul-clock-format') === '24h';
    } catch {
      return false;
    }
  });
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [viewMonthOffset, setViewMonthOffset] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateIso(0));
  const [captureKind, setCaptureKind] = useState<'task' | 'note'>('task');
  const [captureText, setCaptureText] = useState<string>('');
  const [captureNotice, setCaptureNotice] = useState<string | null>(null);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);
  const [countdownEvents, setCountdownEvents] = useState<SavedEventCountdown[]>(() =>
    readCountdownEvents()
  );

  const [tasks, setTasks] = useSyncedWorkspaceState<HumanTask[]>('tasks', []);
  const [notes, setNotes] = useSyncedWorkspaceState<HumanNote[]>('notes', []);
  const [schedule] = useSyncedWorkspaceState<ScheduleWorkspaceState>('schedule', {
    blocksByDate: {},
    weeklyRoutine: {},
  });
  const [habitsState] = useSyncedWorkspaceState<HabitsState>('habits', DEFAULT_HABITS_STATE);
  const [focusStats] = useSyncedWorkspaceState<FocusState>('focus', {
    sessionsToday: 0,
    minutesToday: 0,
    lastDate: getLocalDateIso(0),
  });
  const [goals] = useSyncedWorkspaceState<PersonalGoal[]>('goals', []);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isDesktopRuntime = typeof window !== 'undefined' && Boolean(window.soulDesktop?.isDesktop);

  useEffect(() => {
    if (calendarOpen) {
      setCountdownEvents(readCountdownEvents());
    }
  }, [calendarOpen]);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCalendarOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setCalendarOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [calendarOpen]);

  const toggle24Hour = () => {
    setUse24Hour((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('soul-clock-format', next ? '24h' : '12h');
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString('en-US', {
        hour12: !use24Hour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now, use24Hour]
  );

  const formattedUtcTime = useMemo(
    () =>
      now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: !use24Hour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now, use24Hour]
  );

  const shortDate = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [now]
  );

  const fullDate = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [now]
  );

  const timeZoneInfo = useMemo(() => {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
      const offsetMin = -now.getTimezoneOffset();
      const sign = offsetMin >= 0 ? '+' : '-';
      const absMin = Math.abs(offsetMin);
      const hrs = String(Math.floor(absMin / 60)).padStart(2, '0');
      const mins = String(absMin % 60).padStart(2, '0');
      return { name: resolved, utcOffset: `UTC${sign}${hrs}:${mins}` };
    } catch {
      return { name: 'Local', utcOffset: 'UTC' };
    }
  }, [now.getTimezoneOffset()]);

  const todayIsoStr = useMemo(() => toLocalIsoDate(now), [now]);

  const calendarMarkers = useMemo(() => {
    const taskDates = new Set<string>();
    const scheduleDates = new Set<string>();
    const noteDates = new Set<string>();
    const eventDates = new Set<string>();

    (Array.isArray(tasks) ? tasks : []).forEach((t) => {
      if (!t.archived && !t.done && t.dueDate) taskDates.add(t.dueDate);
    });
    Object.entries(schedule?.blocksByDate || {}).forEach(([iso, blocks]) => {
      if (Array.isArray(blocks) && blocks.length > 0) scheduleDates.add(iso);
    });
    (Array.isArray(notes) ? notes : []).forEach((n) => {
      if (!n.trashed && n.updatedAt) {
        const d = n.updatedAt.slice(0, 10);
        if (d) noteDates.add(d);
      }
    });
    countdownEvents.forEach((ev) => {
      if (ev.date) eventDates.add(ev.date);
    });
    return { taskDates, scheduleDates, noteDates, eventDates };
  }, [tasks, schedule, notes, countdownEvents]);

  const calendarGrid = useMemo(() => {
    const base = new Date(now.getFullYear(), now.getMonth() + viewMonthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstWeekday = base.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const title = base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const cells: Array<{
      day: number | null;
      iso: string;
      isToday: boolean;
      hasTask: boolean;
      hasSchedule: boolean;
      hasNote: boolean;
      hasEvent: boolean;
    }> = [];
    for (let i = 0; i < firstWeekday; i += 1) {
      cells.push({
        day: null,
        iso: '',
        isToday: false,
        hasTask: false,
        hasSchedule: false,
        hasNote: false,
        hasEvent: false,
      });
    }
    for (let d = 1; d <= daysInMonth; d += 1) {
      const iso = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const isToday = iso === todayIsoStr;
      cells.push({
        day: d,
        iso,
        isToday,
        hasTask: calendarMarkers.taskDates.has(iso),
        hasSchedule: calendarMarkers.scheduleDates.has(iso),
        hasNote: calendarMarkers.noteDates.has(iso),
        hasEvent: calendarMarkers.eventDates.has(iso),
      });
    }
    return { title, cells };
  }, [now, viewMonthOffset, todayIsoStr, calendarMarkers]);

  const workspaceSummary = useMemo(() => {
    const safeTasks = Array.isArray(tasks) ? tasks.filter((t) => !t.archived) : [];
    const openTasks = safeTasks.filter((t) => !t.done);
    const overdueCount = openTasks.filter((t) => Boolean(t.dueDate) && t.dueDate < todayIsoStr).length;
    const dayTasks = safeTasks.filter((t) => t.dueDate === selectedDate);
    const dayBlocks = [...(schedule?.blocksByDate?.[selectedDate] || [])].sort(
      (a, b) => a.startHour - b.startHour
    );
    const safeNotes = Array.isArray(notes) ? notes.filter((n) => !n.trashed) : [];
    const dayNotes = safeNotes.filter(
      (n) => (n.updatedAt || '').slice(0, 10) === selectedDate || (n.createdAt || '').slice(0, 10) === selectedDate
    );
    const dayEvents = countdownEvents.filter((ev) => ev.date === selectedDate);
    const todayBlocks = schedule?.blocksByDate?.[todayIsoStr] || [];
    const habitsTotal = habitsState?.habits?.length || 0;
    const habitsDone = (habitsState?.habits || []).filter((h) =>
      h.completedDates.includes(todayIsoStr)
    ).length;
    const focusMinToday = focusStats?.lastDate === todayIsoStr ? focusStats.minutesToday : 0;

    return {
      openTasksCount: openTasks.length,
      overdueCount,
      dayTasks,
      dayBlocks,
      dayNotes,
      dayEvents,
      activeNotesCount: safeNotes.length,
      todayBlocksCount: todayBlocks.length,
      habitsDone,
      habitsTotal,
      focusMinToday,
      goalsCount: Array.isArray(goals) ? goals.length : 0,
    };
  }, [tasks, notes, schedule, habitsState, focusStats, goals, countdownEvents, selectedDate, todayIsoStr]);

  const selectedDateLabel = useMemo(() => {
    const parsed = new Date(`${selectedDate}T12:00:00`);
    const readable = Number.isNaN(parsed.getTime())
      ? selectedDate
      : parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    return selectedDate === todayIsoStr ? `Today · ${readable}` : readable;
  }, [selectedDate, todayIsoStr]);

  const toggleDayTaskDone = (taskId: string) => {
    const nowIso = new Date().toISOString();
    setTasks((prev) =>
      (Array.isArray(prev) ? prev : []).map((t) =>
        t.id === taskId
          ? { ...t, done: !t.done, status: !t.done ? 'done' : 'todo', completedAt: !t.done ? nowIso : undefined }
          : t
      )
    );
  };

  const handleQuickCapture = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = captureText.trim();
    if (!clean) return;
    const nowIso = new Date().toISOString();
    if (captureKind === 'task') {
      const nextTask: HumanTask = {
        id: `task-bar-${Date.now()}`,
        title: clean,
        done: false,
        status: 'todo',
        priority: 'medium',
        category: 'Personal',
        dueDate: selectedDate,
        repeat: 'none',
        starred: false,
        estimateMin: 20,
        notes: '',
        subtasks: [],
        createdAt: nowIso,
      };
      setTasks((prev) => [nextTask, ...(Array.isArray(prev) ? prev : [])]);
      setCaptureNotice(`Added task for ${selectedDate === todayIsoStr ? 'Today' : selectedDate}`);
    } else {
      const nextNote: HumanNote = {
        id: `note-bar-${Date.now()}`,
        title: clean.length > 48 ? `${clean.slice(0, 48)}...` : clean,
        content: `# ${clean}\n\nCaptured on ${selectedDate}\n`,
        notebook: 'Quick Captures',
        tags: ['Quick'],
        pinned: false,
        accent: 'sky',
        updatedAt: nowIso,
        createdAt: nowIso,
      };
      setNotes((prev) => [nextNote, ...(Array.isArray(prev) ? prev : [])]);
      setCaptureNotice('Saved quick note');
    }
    setCaptureText('');
    window.setTimeout(() => setCaptureNotice(null), 2200);
  };

  const navigateFromPopover = (routeId: string) => {
    setCalendarOpen(false);
    onNavigate(routeId);
  };

  const handleCopy = async (text: string, label: string) => {
    const ok = await copyTextSafe(text);
    if (ok) {
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(null), 1600);
    }
  };

  const postureTone =
    liveTelemetry?.healthPosture?.severity === 'critical'
      ? 'text-rose-300 border-rose-500/35 bg-rose-500/12'
      : liveTelemetry?.healthPosture?.severity === 'warn'
      ? 'text-amber-300 border-amber-500/35 bg-amber-500/12'
      : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';

  const netRx = liveTelemetry?.network?.rxKBps;
  const netTx = liveTelemetry?.network?.txKBps;
  const wifiSsid = liveTelemetry?.connectedWifi?.ssid;
  const battery = liveTelemetry?.battery;

  return (
    <>
      {/* Floating Clock, Connected Calendar & Quick Utilities Popover */}
      {calendarOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Date, Time and Quick Utilities"
          className="fixed bottom-11 right-3 sm:right-5 z-50 w-[340px] sm:w-[376px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-4.5rem)] overflow-y-auto custom-scrollbar rounded-2xl neu-modal bg-[#101118] border border-white/[0.14] portal-page-enter"
        >
          <div className="relative p-3.5 sm:p-4 flex flex-col gap-3 text-xs portal-header-sheen">
            {/* 1. Clock Hero + Time Controls */}
            <div className="flex items-start justify-between gap-2">
              <div className="flex flex-col min-w-0">
                <div className="text-2xl font-extrabold font-mono tracking-tight text-white tabular-nums">
                  {formattedTime}
                </div>
                <div className="text-[11px] text-zinc-300 font-medium truncate">{fullDate}</div>
                <div className="text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                  {timeZoneInfo.name} · {timeZoneInfo.utcOffset} · UTC {formattedUtcTime}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
                  onClick={toggle24Hour}
                  className="neu-btn h-7 px-2 rounded-lg bg-[#181a24] border border-white/[0.1] hover:border-sky-400/45 text-[10px] font-mono font-bold text-sky-300 cursor-pointer transition-colors"
                  title="Switch between 24-hour and 12-hour clock"
                >
                  {use24Hour ? '24H' : '12H'}
                </button>
                <button
                  type="button"
                  onClick={() => navigateFromPopover('everyday/worldtime')}
                  className="neu-btn inline-flex items-center gap-1 h-7 px-2 rounded-lg bg-[#181a24] border border-white/[0.1] hover:border-indigo-400/45 text-[10px] font-mono font-semibold text-indigo-300 hover:text-white cursor-pointer transition-colors"
                  title="Open World Clock & Time Zones"
                >
                  <StatusSvg className="w-3 h-3">
                    <circle cx="12" cy="12" r="10" />
                    <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
                    <path d="M2 12h20" />
                  </StatusSvg>
                  <span>World</span>
                </button>
              </div>
            </div>

            {/* 2. Copy Timestamp Quick Row */}
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleCopy(`${fullDate} ${formattedTime}`, 'local')}
                className="neu-btn inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg bg-[#161822] border border-white/[0.08] hover:border-white/[0.2] text-[11px] font-mono text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <StatusSvg className="w-3 h-3 text-sky-300">
                  <rect width="14" height="14" x="8" y="8" rx="2" />
                  <path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2" />
                </StatusSvg>
                <span>{copiedLabel === 'local' ? 'Copied ✓' : 'Local'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(now.toISOString(), 'iso')}
                className="neu-btn inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg bg-[#161822] border border-white/[0.08] hover:border-white/[0.2] text-[11px] font-mono text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <StatusSvg className="w-3 h-3 text-emerald-300">
                  <polyline points="16 18 22 12 16 6" />
                  <polyline points="8 6 2 12 8 18" />
                </StatusSvg>
                <span>{copiedLabel === 'iso' ? 'Copied ✓' : 'ISO-8601'}</span>
              </button>
              <button
                type="button"
                onClick={() => handleCopy(String(Math.floor(now.getTime() / 1000)), 'unix')}
                className="neu-btn inline-flex items-center justify-center gap-1.5 h-8 px-2 rounded-lg bg-[#161822] border border-white/[0.08] hover:border-white/[0.2] text-[11px] font-mono text-zinc-200 hover:text-white transition-colors cursor-pointer whitespace-nowrap"
              >
                <StatusSvg className="w-3 h-3 text-purple-300">
                  <circle cx="12" cy="12" r="10" />
                  <polyline points="12 6 12 12 16 14" />
                </StatusSvg>
                <span>{copiedLabel === 'unix' ? 'Copied ✓' : 'Unix'}</span>
              </button>
            </div>

            {/* 3. Connected Interactive Monthly Calendar + Selected Day Agenda */}
            <div className="rounded-xl neu-inset bg-[#0a0b10] border border-white/[0.08] p-2.5 flex flex-col gap-2">
              <div className="flex items-center justify-between gap-1">
                <button
                  type="button"
                  onClick={() => setViewMonthOffset((m) => m - 1)}
                  className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Previous month"
                >
                  <StatusSvg className="w-3.5 h-3.5">
                    <path d="m15 18-6-6 6-6" />
                  </StatusSvg>
                </button>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      setViewMonthOffset(0);
                      setSelectedDate(todayIsoStr);
                    }}
                    className="text-xs font-bold text-zinc-100 hover:text-sky-300 cursor-pointer transition-colors"
                    title="Jump to current month and today"
                  >
                    {calendarGrid.title}
                  </button>
                  {(viewMonthOffset !== 0 || selectedDate !== todayIsoStr) && (
                    <button
                      type="button"
                      onClick={() => {
                        setViewMonthOffset(0);
                        setSelectedDate(todayIsoStr);
                      }}
                      className="px-1.5 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-[9.5px] font-mono font-bold text-sky-300 hover:bg-sky-500/25 cursor-pointer"
                    >
                      Today
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  onClick={() => setViewMonthOffset((m) => m + 1)}
                  className="w-7 h-7 rounded-lg hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer transition-colors"
                  aria-label="Next month"
                >
                  <StatusSvg className="w-3.5 h-3.5">
                    <path d="m9 18 6-6-6-6" />
                  </StatusSvg>
                </button>
              </div>

              <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-mono">
                {WEEKDAYS.map((d) => (
                  <div key={d} className="py-0.5 font-bold text-zinc-500">
                    {d}
                  </div>
                ))}
                {calendarGrid.cells.map((cell, idx) => {
                  if (cell.day === null) {
                    return <div key={`empty-${idx}`} className="h-7" />;
                  }
                  const isSelected = cell.iso === selectedDate;
                  const hasAnyMarker = cell.hasTask || cell.hasSchedule || cell.hasNote || cell.hasEvent;
                  return (
                    <button
                      key={cell.iso}
                      type="button"
                      onClick={() => setSelectedDate(cell.iso)}
                      className={`relative h-7 rounded-lg flex flex-col items-center justify-center tabular-nums cursor-pointer transition-colors ${
                        cell.isToday && isSelected
                          ? 'bg-sky-500/30 border border-sky-400/65 text-white font-extrabold'
                          : isSelected
                          ? 'bg-white/[0.12] border border-sky-400/50 text-white font-bold'
                          : cell.isToday
                          ? 'bg-sky-500/15 border border-sky-400/35 text-sky-200 font-bold hover:bg-sky-500/25'
                          : 'border border-transparent text-zinc-300 hover:bg-white/[0.06] hover:text-white'
                      }`}
                      title={`Select ${cell.iso}`}
                    >
                      <span className="leading-none text-[11px]">{cell.day}</span>
                      {hasAnyMarker && (
                        <span className="flex items-center gap-0.5 mt-0.5">
                          {cell.hasTask && <span className="w-1 h-1 rounded-full bg-sky-400" />}
                          {cell.hasSchedule && <span className="w-1 h-1 rounded-full bg-indigo-400" />}
                          {cell.hasNote && <span className="w-1 h-1 rounded-full bg-emerald-400" />}
                          {cell.hasEvent && <span className="w-1 h-1 rounded-full bg-purple-400" />}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>

              {/* Selected Date Connected Agenda */}
              <div className="pt-2 border-t border-white/[0.07] flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-1.5">
                  <span className="text-[10.5px] font-mono font-bold text-zinc-200 truncate">
                    {selectedDateLabel}
                  </span>
                  <div className="flex items-center gap-1 shrink-0 font-mono text-[9.5px]">
                    <button
                      type="button"
                      onClick={() => navigateFromPopover('everyday/tasks')}
                      className="px-1.5 py-0.5 rounded bg-sky-500/12 border border-sky-400/25 text-sky-300 hover:bg-sky-500/20 cursor-pointer"
                    >
                      {workspaceSummary.dayTasks.length} tasks
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateFromPopover('everyday/schedule')}
                      className="px-1.5 py-0.5 rounded bg-indigo-500/12 border border-indigo-400/25 text-indigo-300 hover:bg-indigo-500/20 cursor-pointer"
                    >
                      {workspaceSummary.dayBlocks.length} blocks
                    </button>
                    <button
                      type="button"
                      onClick={() => navigateFromPopover('everyday/notes')}
                      className="px-1.5 py-0.5 rounded bg-emerald-500/12 border border-emerald-400/25 text-emerald-300 hover:bg-emerald-500/20 cursor-pointer"
                    >
                      {workspaceSummary.dayNotes.length} notes
                    </button>
                  </div>
                </div>

                {(workspaceSummary.dayTasks.length > 0 ||
                  workspaceSummary.dayBlocks.length > 0 ||
                  workspaceSummary.dayEvents.length > 0) ? (
                  <div className="flex flex-col gap-1 max-h-24 overflow-y-auto custom-scrollbar pr-0.5">
                    {workspaceSummary.dayEvents.slice(0, 1).map((ev) => (
                      <button
                        key={ev.id}
                        type="button"
                        onClick={() => navigateFromPopover('everyday/goals')}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-purple-500/10 border border-purple-400/25 text-left text-[10.5px] text-purple-200 hover:bg-purple-500/20 cursor-pointer"
                      >
                        <span className="truncate font-medium">Event: {ev.label}</span>
                        <span className="text-[9.5px] font-mono text-purple-300 shrink-0">Goals →</span>
                      </button>
                    ))}
                    {workspaceSummary.dayTasks.slice(0, 2).map((t) => (
                      <div
                        key={t.id}
                        className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-[#12141c] border border-white/[0.06] text-[10.5px]"
                      >
                        <button
                          type="button"
                          onClick={() => toggleDayTaskDone(t.id)}
                          className="flex items-center gap-1.5 min-w-0 flex-1 text-left cursor-pointer"
                          title="Toggle task completion"
                        >
                          <span
                            className={`w-3.5 h-3.5 rounded border flex items-center justify-center text-[9px] shrink-0 ${
                              t.done
                                ? 'bg-emerald-400 border-emerald-400 text-zinc-950 font-bold'
                                : 'border-white/25 bg-[#090a0f]'
                            }`}
                          >
                            {t.done ? '✓' : ''}
                          </span>
                          <span className={`truncate ${t.done ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                            {t.title}
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => navigateFromPopover('everyday/tasks')}
                          className="text-[9.5px] font-mono text-sky-300 hover:text-sky-200 shrink-0 cursor-pointer"
                        >
                          Open
                        </button>
                      </div>
                    ))}
                    {workspaceSummary.dayBlocks.slice(0, 1).map((blk) => (
                      <button
                        key={blk.id}
                        type="button"
                        onClick={() => navigateFromPopover('everyday/schedule')}
                        className="w-full flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-indigo-500/10 border border-indigo-400/25 text-left text-[10.5px] text-indigo-200 hover:bg-indigo-500/20 cursor-pointer"
                      >
                        <span className="truncate">
                          {String(blk.startHour).padStart(2, '0')}:00 · {blk.title}
                        </span>
                        <span className="text-[9.5px] font-mono text-indigo-300 shrink-0">{blk.durationHrs}h</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="text-[10.5px] text-zinc-500 font-mono">
                    No tasks or blocks on this date — quick add below.
                  </div>
                )}
              </div>
            </div>

            {/* 4. Connected Quick Capture (adds directly to Tasks or Notes for selected date) */}
            <form onSubmit={handleQuickCapture} className="flex flex-col gap-1.5">
              <div className="flex items-center gap-1.5">
                <div className="inline-flex items-center h-8 p-0.5 rounded-lg bg-[#090a0f] border border-white/[0.08] shrink-0">
                  <button
                    type="button"
                    onClick={() => setCaptureKind('task')}
                    className={`h-full px-2 rounded-md text-[10px] font-mono cursor-pointer transition-colors ${
                      captureKind === 'task'
                        ? 'bg-emerald-500/20 text-emerald-200 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Task
                  </button>
                  <button
                    type="button"
                    onClick={() => setCaptureKind('note')}
                    className={`h-full px-2 rounded-md text-[10px] font-mono cursor-pointer transition-colors ${
                      captureKind === 'note'
                        ? 'bg-sky-500/20 text-sky-200 font-bold'
                        : 'text-zinc-400 hover:text-white'
                    }`}
                  >
                    Note
                  </button>
                </div>
                <input
                  type="text"
                  value={captureText}
                  onChange={(e) => setCaptureText(e.target.value)}
                  placeholder={
                    captureKind === 'task'
                      ? `Add task for ${selectedDate === todayIsoStr ? 'today' : selectedDate.slice(5)}...`
                      : 'Quick note to Notes & Journal...'
                  }
                  aria-label="Quick capture from status bar"
                  className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-[#090a0f] border border-white/[0.1] text-[11px] text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
                />
                <button
                  type="submit"
                  className="neu-btn h-8 px-2.5 rounded-lg bg-white text-zinc-950 hover:bg-sky-100 text-[11px] font-extrabold cursor-pointer shrink-0"
                >
                  Add
                </button>
              </div>
              {captureNotice && (
                <div className="text-[10px] font-mono text-emerald-300 font-semibold">
                  ✓ {captureNotice}
                </div>
              )}
            </form>

            {/* 5. Connected Workspace Hubs Strip */}
            <div className="grid grid-cols-3 gap-1.5">
              {(
                [
                  {
                    route: 'everyday/tasks',
                    label: 'Tasks',
                    value: `${workspaceSummary.openTasksCount} open${
                      workspaceSummary.overdueCount > 0 ? ` · ${workspaceSummary.overdueCount}!` : ''
                    }`,
                    tone: 'hover:border-emerald-400/40',
                    valueCls: workspaceSummary.overdueCount > 0 ? 'text-amber-300' : 'text-emerald-300',
                  },
                  {
                    route: 'everyday/notes',
                    label: 'Notes',
                    value: `${workspaceSummary.activeNotesCount} active`,
                    tone: 'hover:border-sky-400/40',
                    valueCls: 'text-sky-300',
                  },
                  {
                    route: 'everyday/schedule',
                    label: 'Routine',
                    value: `${workspaceSummary.todayBlocksCount} today`,
                    tone: 'hover:border-indigo-400/40',
                    valueCls: 'text-indigo-300',
                  },
                  {
                    route: 'everyday/habits',
                    label: 'Habits',
                    value: `${workspaceSummary.habitsDone}/${workspaceSummary.habitsTotal} done`,
                    tone: 'hover:border-emerald-400/40',
                    valueCls: 'text-emerald-300',
                  },
                  {
                    route: 'everyday/focus',
                    label: 'Focus',
                    value: `${workspaceSummary.focusMinToday}m today`,
                    tone: 'hover:border-amber-400/40',
                    valueCls: 'text-amber-300',
                  },
                  {
                    route: 'everyday/goals',
                    label: 'Goals',
                    value: `${workspaceSummary.goalsCount} active`,
                    tone: 'hover:border-purple-400/40',
                    valueCls: 'text-purple-300',
                  },
                ] as const
              ).map((hub) => (
                <button
                  key={hub.route}
                  type="button"
                  onClick={() => navigateFromPopover(hub.route)}
                  className={`neu-tile neu-btn p-2 rounded-xl bg-[#151721] border border-white/[0.08] ${hub.tone} text-left cursor-pointer transition-colors`}
                >
                  <div className="text-[10px] font-mono text-zinc-400">{hub.label}</div>
                  <div className={`text-[11px] font-mono font-bold tabular-nums truncate ${hub.valueCls}`}>
                    {hub.value}
                  </div>
                </button>
              ))}
            </div>

            {/* 6. Session & System Footer */}
            <div className="flex items-center justify-between text-[10.5px] font-mono text-zinc-400 pt-2 border-t border-white/[0.08]">
              <span className="inline-flex items-center gap-1.5">
                <span className={`w-1.5 h-1.5 rounded-full ${isBackendLive ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                <span>Session {formatSessionDuration(now.getTime() - APP_SESSION_START)}</span>
              </span>
              <div className="flex items-center gap-2.5">
                {onFocusSearch && (
                  <button
                    type="button"
                    onClick={() => {
                      setCalendarOpen(false);
                      onFocusSearch();
                    }}
                    className="text-sky-300 hover:text-sky-200 cursor-pointer"
                  >
                    Search
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => navigateFromPopover('everyday')}
                  className="text-zinc-300 hover:text-white cursor-pointer"
                >
                  Tools
                </button>
                <button
                  type="button"
                  onClick={() => navigateFromPopover('computer')}
                  className="text-emerald-300 hover:text-emerald-200 cursor-pointer"
                >
                  System
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <footer
        role="contentinfo"
        aria-label="Global workspace status, system vitals, date and time"
        className="relative z-30 shrink-0 w-full h-10 bg-[#0a0b0f]/[0.98] border-t border-white/[0.08] select-none"
      >
        <div className="w-full max-w-[1800px] mx-auto h-full px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-2 text-[11px] font-mono">
          {/* Left: Runtime Version, Health Posture & Unified Quick-Nav Capsule */}
          <div className="flex items-center gap-1.5 min-w-0">
            <button
              type="button"
              onClick={onOpenShortcuts}
              className="neu-btn inline-flex items-center gap-1.5 h-6 px-2 rounded-md bg-[#13151d] hover:bg-[#191c27] border border-white/[0.09] text-zinc-200 transition-colors cursor-pointer shrink-0"
              title="Soul DevPortal v0.0.1 · Click for Desktop App & Keyboard Shortcuts"
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isBackendLive ? 'bg-emerald-400 status-pulse' : 'bg-amber-400 animate-pulse'
                }`}
              />
              <span className="font-semibold text-zinc-100">v0.0.1</span>
              <span className="hidden sm:inline text-zinc-400">
                {isDesktopRuntime ? '· Desktop' : '· Web'}
              </span>
            </button>

            {!isOnline && (
              <span className="inline-flex items-center h-6 px-2 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-300 font-semibold shrink-0">
                Offline
              </span>
            )}

            {liveTelemetry?.healthPosture && (
              <button
                type="button"
                onClick={() => onNavigate('computer')}
                className={`hidden md:inline-flex items-center gap-1.5 h-6 px-2.5 rounded-md border transition-colors cursor-pointer truncate max-w-[175px] ${postureTone}`}
                title={`System Health: ${liveTelemetry.healthPosture.label} · Click to inspect Computer Monitor`}
              >
                <span className="truncate font-semibold">{liveTelemetry.healthPosture.label}</span>
              </button>
            )}

            <span className="hidden sm:block h-3.5 w-px bg-white/[0.1] mx-0.5 shrink-0" aria-hidden="true" />

            <div className="hidden sm:inline-flex items-center gap-0.5 h-6 p-0.5 rounded-md neu-tray bg-[#12131a] border border-white/[0.08] shrink-0">
              <button
                type="button"
                onClick={() => onNavigate('everyday')}
                className={`inline-flex items-center gap-1 h-5 px-2 rounded transition-colors cursor-pointer whitespace-nowrap ${
                  isEverydayRoute(active)
                    ? 'bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 font-bold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
                title="Open Everyday Utilities — Tasks, Notes, Focus, Habits, Budget & Checklists (Ctrl+7)"
              >
                <span>Everyday Utilities</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('projects')}
                className={`hidden xl:inline-flex items-center gap-1 h-5 px-2 rounded transition-colors cursor-pointer whitespace-nowrap ${
                  active === 'projects' || active.startsWith('projects/')
                    ? 'bg-purple-500/20 border border-purple-400/35 text-purple-200 font-bold'
                    : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent'
                }`}
                title="View Workspace Applications"
              >
                <span>Apps</span>
                <span className="px-1 rounded bg-white/[0.08] text-[10px] font-bold text-zinc-200 tabular-nums">
                  {projectsCount}
                </span>
              </button>

              <button
                type="button"
                onClick={() => openChangelogPanel()}
                className="inline-flex items-center gap-1 h-5 px-2 rounded text-sky-300 hover:text-white hover:bg-sky-500/15 border border-transparent hover:border-sky-400/30 transition-colors cursor-pointer whitespace-nowrap"
                title="Open Workspace Changelog in New Tab / Desktop Panel"
              >
                <span>Changelog</span>
                <span className="text-[10px] opacity-80" aria-hidden="true">↗</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (onToggleTerminalDrawer && active !== 'terminal') {
                    onToggleTerminalDrawer();
                  } else {
                    onNavigate('terminal');
                  }
                }}
                className={`inline-flex items-center gap-1 h-5 px-2 rounded transition-colors cursor-pointer whitespace-nowrap ${
                  active === 'terminal' || terminalDrawerOpen
                    ? 'bg-emerald-500/20 border border-emerald-500/35 text-emerald-200 font-bold'
                    : 'text-emerald-300 hover:text-white hover:bg-emerald-500/15 border border-transparent hover:border-emerald-500/30'
                }`}
                title="Toggle Bottom Workspace Terminal (Ctrl+`)"
                aria-label="Toggle Bottom Workspace Terminal"
              >
                <span className="font-mono text-[10px] font-bold">&gt;_</span>
                <span>Terminal</span>
              </button>
            </div>
          </div>

          {/* Center: Unified Hardware Uptime, Power/Battery & Network Telemetry Strip */}
          {liveTelemetry && (
            <div className="hidden lg:inline-flex items-center h-6 px-2.5 gap-2 rounded-md neu-tray bg-[#12131a] border border-white/[0.08] text-zinc-300 min-w-0">
              <button
                type="button"
                onClick={() => onNavigate('computer')}
                className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer tabular-nums shrink-0"
                title="System Uptime since last reboot"
              >
                <span className="text-sky-400">⏱</span>
                <span>Up {formatUptime(liveTelemetry.uptimeSeconds)}</span>
              </button>

              {battery && (
                <>
                  <span className="h-3 w-px bg-white/[0.1] shrink-0" aria-hidden="true" />
                  <button
                    type="button"
                    onClick={() => onNavigate('computer')}
                    className="inline-flex items-center gap-1 hover:text-white transition-colors cursor-pointer tabular-nums shrink-0"
                    title={`Power: ${battery.statusLabel}`}
                  >
                    <span className={battery.powerPlugged ? 'text-emerald-400' : 'text-amber-300'}>
                      {battery.powerPlugged ? '⚡' : '🔋'}
                    </span>
                    <span>
                      {Math.round(battery.percent)}%{battery.powerPlugged ? ' AC' : ''}
                    </span>
                  </button>
                </>
              )}

              <span className="h-3 w-px bg-white/[0.1] shrink-0" aria-hidden="true" />

              <button
                type="button"
                onClick={() => onNavigate('computer')}
                className="inline-flex items-center gap-1.5 hover:text-white transition-colors cursor-pointer tabular-nums min-w-0"
                title={wifiSsid ? `Connected Wi-Fi: ${wifiSsid}` : 'Live Network Throughput'}
              >
                <span className="text-emerald-400 shrink-0">↓ {formatRate(netRx)}</span>
                <span className="text-sky-400 shrink-0">↑ {formatRate(netTx)}</span>
                {wifiSsid && (
                  <span className="hidden 2xl:inline text-zinc-400 truncate max-w-[130px] pl-1 border-l border-white/[0.1]">
                    {wifiSsid}
                  </span>
                )}
              </button>
            </div>
          )}

          {/* Right: Scroll Top Pill, Mobile Vitals & Interactive Date/Time Clock */}
          <div className="flex items-center gap-1.5 shrink-0">
            {canScrollTop && (
              <button
                type="button"
                onClick={onScrollTop}
                className="inline-flex items-center gap-1 h-6 px-2 rounded-md bg-sky-500/15 border border-sky-400/35 text-sky-200 hover:bg-sky-500/25 transition-colors cursor-pointer"
                title="Scroll back to top"
              >
                <span>↑ Top</span>
              </button>
            )}

            {liveTelemetry && (
              <button
                type="button"
                onClick={() => onNavigate('computer')}
                className="inline-flex md:hidden items-center gap-1.5 h-6 px-2 rounded-md bg-[#13151d] border border-white/[0.09] text-zinc-300 tabular-nums cursor-pointer"
              >
                <span>CPU {Math.round(liveTelemetry.cpu.totalPercent)}%</span>
                <span>·</span>
                <span>RAM {Math.round(liveTelemetry.memory.percent)}%</span>
              </button>
            )}

            <button
              ref={triggerRef}
              type="button"
              onClick={() => {
                setViewMonthOffset(0);
                setSelectedDate(todayIsoStr);
                setCalendarOpen((prev) => !prev);
              }}
              aria-expanded={calendarOpen}
              aria-label="Current date and time — click for calendar and timezone tools"
              title={`${fullDate} · ${timeZoneInfo.name} (${timeZoneInfo.utcOffset}) · Click for calendar & copy tools`}
              className={`neu-btn inline-flex items-center gap-2 h-6 px-2.5 rounded-md border tabular-nums transition-all cursor-pointer ${
                calendarOpen
                  ? 'bg-sky-500/20 border-sky-400/50 text-white'
                  : 'bg-[#13151d] border-white/[0.1] hover:border-sky-400/40 text-zinc-100 hover:text-white'
              }`}
            >
              <span className="hidden sm:inline text-zinc-300 font-medium">{shortDate}</span>
              <span className="hidden sm:inline text-zinc-600">·</span>
              <strong className="font-bold tracking-tight text-sky-200">{formattedTime}</strong>
              <span className="hidden md:inline text-[10px] text-zinc-400">{timeZoneInfo.utcOffset}</span>
            </button>
          </div>
        </div>
      </footer>
    </>
  );
};

export default GlobalStatusBar;
