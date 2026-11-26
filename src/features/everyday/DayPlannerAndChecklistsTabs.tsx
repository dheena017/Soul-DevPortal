import React, { useMemo, useState } from 'react';
import { HeroArtworkBackdrop, MiniRadialRing } from '../../components/PortalVisuals';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { copyTextSafe } from '../../utils/clipboard';
import { useScrollEdgeFade } from '../../utils/useScrollEdgeFade';
import { getLocalDateIso } from './everydayTabsRegistry';

export type ScheduleCategory = 'Deep Work' | 'Meetings' | 'Study' | 'Health' | 'Meals' | 'Rest';

export interface TimeBlockItem {
  id: string;
  startHour: number; // 6..22
  durationHrs: number; // 1..4
  title: string;
  category: ScheduleCategory;
  done: boolean;
}

export interface WeeklyRoutineCell {
  focusTheme: string;
  mealPlan: string;
  movement: string;
}

export interface ScheduleWorkspaceState {
  blocksByDate: Record<string, TimeBlockItem[]>;
  weeklyRoutine: Record<string, WeeklyRoutineCell>;
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

const CATEGORY_STYLES: Record<ScheduleCategory, string> = {
  'Deep Work': 'bg-sky-500/15 border-sky-400/35 text-sky-200',
  Meetings: 'bg-purple-500/15 border-purple-400/35 text-purple-200',
  Study: 'bg-indigo-500/15 border-indigo-400/35 text-indigo-200',
  Health: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-200',
  Meals: 'bg-amber-500/15 border-amber-400/35 text-amber-200',
  Rest: 'bg-[#16171e]/90 border-white/[0.12] text-zinc-300',
};

const DEFAULT_SCHEDULE_STATE: ScheduleWorkspaceState = {
  blocksByDate: {},
  weeklyRoutine: {
    Mon: { focusTheme: 'Core Engineering Sprint', mealPlan: 'Oats · Bowl · Stir-fry', movement: 'Walk 30m' },
    Tue: { focusTheme: 'Architecture & Reviews', mealPlan: 'Eggs · Wrap · Curry', movement: 'Strength Training' },
    Wed: { focusTheme: 'Deep Build Block', mealPlan: 'Smoothie · Salad · Soup', movement: 'Mobility 20m' },
    Thu: { focusTheme: 'Feature Shipping & QA', mealPlan: 'Toast · Rice Bowl · Grill', movement: 'Cardio Run' },
    Fri: { focusTheme: 'Cleanup & Demo Prep', mealPlan: 'Parfait · Pasta · Tacos', movement: 'Walk 30m' },
    Sat: { focusTheme: 'Personal Projects & Home', mealPlan: 'Pancakes · Homemade · Rest', movement: 'Outdoor Hike' },
    Sun: { focusTheme: 'Weekly Reset & Reading', mealPlan: 'Brunch · Meal Prep', movement: 'Yoga & Rest' },
  },
};

function formatHourLabel(hour: number): string {
  const normHour = ((hour % 24) + 24) % 24;
  const suffix = normHour >= 12 ? 'PM' : 'AM';
  const h12 = normHour % 12 === 0 ? 12 : normHour % 12;
  return `${String(h12).padStart(2, '0')}:00 ${suffix}`;
}

export const SchedulePlannerTab: React.FC = () => {
  const [state, setState] = useSyncedWorkspaceState<ScheduleWorkspaceState>(
    'schedule',
    DEFAULT_SCHEDULE_STATE
  );
  const [selectedDate, setSelectedDate] = useState<string>(() => getLocalDateIso(0));
  const [startHour, setStartHour] = useState<number>(9);
  const [durationHrs, setDurationHrs] = useState<number>(1);
  const [title, setTitle] = useState<string>('');
  const [category, setCategory] = useState<ScheduleCategory>('Deep Work');
  const [copiedSchedule, setCopiedSchedule] = useState<boolean>(false);

  const dayBlocks = useMemo(() => {
    const raw = state.blocksByDate?.[selectedDate] || [];
    return [...raw].sort((a, b) => a.startHour - b.startHour);
  }, [state.blocksByDate, selectedDate]);

  const todayWeekday = useMemo(
    () => (['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as const)[new Date().getDay()],
    []
  );
  const blocksScroll = useScrollEdgeFade([dayBlocks.length, selectedDate]);
  const weeklyScroll = useScrollEdgeFade([state.weeklyRoutine]);

  const setDayBlocks = (updater: (prev: TimeBlockItem[]) => TimeBlockItem[]) => {
    setState((prev) => ({
      ...prev,
      blocksByDate: {
        ...(prev.blocksByDate || {}),
        [selectedDate]: updater(prev.blocksByDate?.[selectedDate] || []),
      },
    }));
  };

  const addBlock = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    setDayBlocks((prev) => [
      ...prev,
      {
        id: `blk-${Date.now()}`,
        startHour,
        durationHrs,
        title: clean,
        category,
        done: false,
      },
    ]);
    setTitle('');
    setStartHour((h) => (h < 22 ? h + 1 : 9));
  };

  const applyPresetDay = (preset: 'workday' | 'study' | 'weekend') => {
    const presets: Record<'workday' | 'study' | 'weekend', TimeBlockItem[]> = {
      workday: [
        { id: 'p-1', startHour: 7, durationHrs: 1, title: 'Morning Hydration & Movement', category: 'Health', done: false },
        { id: 'p-2', startHour: 9, durationHrs: 3, title: 'Deep Work Block — Priority Build', category: 'Deep Work', done: false },
        { id: 'p-3', startHour: 13, durationHrs: 1, title: 'Lunch & Walk Reset', category: 'Meals', done: false },
        { id: 'p-4', startHour: 14, durationHrs: 2, title: 'Reviews, Messages & Collaborations', category: 'Meetings', done: false },
        { id: 'p-5', startHour: 17, durationHrs: 1, title: 'Evening Learning & Wrap-up', category: 'Study', done: false },
      ],
      study: [
        { id: 's-1', startHour: 8, durationHrs: 2, title: 'Active Recall & Deep Reading', category: 'Study', done: false },
        { id: 's-2', startHour: 11, durationHrs: 2, title: 'Hands-on Practice Session', category: 'Deep Work', done: false },
        { id: 's-3', startHour: 16, durationHrs: 1, title: 'Outdoor Walk / Workout', category: 'Health', done: false },
        { id: 's-4', startHour: 19, durationHrs: 2, title: 'Review Notes & Flashcards', category: 'Study', done: false },
      ],
      weekend: [
        { id: 'w-1', startHour: 9, durationHrs: 1, title: 'Unhurried Breakfast & Coffee', category: 'Meals', done: false },
        { id: 'w-2', startHour: 11, durationHrs: 2, title: 'Creative Hobby / Side Project', category: 'Deep Work', done: false },
        { id: 'w-3', startHour: 17, durationHrs: 2, title: 'Friends, Outdoors or Reset Walk', category: 'Rest', done: false },
      ],
    };
    setDayBlocks(() => presets[preset]);
  };

  const copyMarkdownAgenda = () => {
    const lines = [
      `## Schedule for ${selectedDate}`,
      ...dayBlocks.map(
        (b) =>
          `- [${b.done ? 'x' : ' '}] **${formatHourLabel(b.startHour)} (${b.durationHrs}h)** — ${b.title} *(${b.category})*`
      ),
    ].join('\n');
    void copyTextSafe(lines).then((ok) => {
      if (ok) {
        setCopiedSchedule(true);
        window.setTimeout(() => setCopiedSchedule(false), 1800);
      }
    });
  };

  const updateWeeklyCell = (day: string, patch: Partial<WeeklyRoutineCell>) => {
    setState((prev) => ({
      ...prev,
      weeklyRoutine: {
        ...(prev.weeklyRoutine || DEFAULT_SCHEDULE_STATE.weeklyRoutine),
        [day]: {
          ...(prev.weeklyRoutine?.[day] || { focusTheme: '', mealPlan: '', movement: '' }),
          ...patch,
        },
      },
    }));
  };

  const completedBlocks = dayBlocks.filter((b) => b.done).length;
  const totalPlannedHours = dayBlocks.reduce((acc, b) => acc + b.durationHrs, 0);
  const blockPct = dayBlocks.length > 0 ? Math.round((completedBlocks / dayBlocks.length) * 100) : 0;

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
        {/* Daily Time-Block Agenda */}
        <section className="xl:col-span-7 rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col xl:h-[640px]">
          <div className="relative overflow-hidden px-5 pt-4 pb-3.5 border-b border-white/[0.07] shrink-0 flex flex-wrap items-center justify-between gap-3">
            <HeroArtworkBackdrop src="/visuals/pillar-scripts-terminal.jpg" alt="" opacityClass="opacity-70 sm:opacity-85" />
            <div className="relative z-10 min-w-0">
              <h2 className="text-base font-bold text-white">Daily Time-Block Planner</h2>
              <p className="text-xs text-zinc-400">
                Assign dedicated hours for deep work, health, meals &amp; rest.
              </p>
            </div>
            <div className="relative z-10 flex flex-wrap items-center gap-2.5">
              <MiniRadialRing percent={blockPct} color="#38bdf8" size={40} />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                aria-label="Schedule date"
                className="h-8 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
              />
              <button
                type="button"
                onClick={copyMarkdownAgenda}
                disabled={dayBlocks.length === 0}
                className="neu-btn h-8 px-3 rounded-lg bg-[#16171e] border border-white/[0.1] disabled:opacity-40 text-xs font-mono text-sky-300 cursor-pointer"
              >
                {copiedSchedule ? '✓ Copied .md' : 'Copy .md'}
              </button>
            </div>
          </div>

          <div className="flex-1 min-h-0 flex flex-col gap-3.5 p-5">
            {/* Preset Fill Row */}
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] shrink-0">
              <span className="font-mono text-zinc-500 mr-1">Day Templates:</span>
              <button
                type="button"
                onClick={() => applyPresetDay('workday')}
                className="neu-btn px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-sky-400/40 text-zinc-200 cursor-pointer"
              >
                ⚡ Focused Workday
              </button>
              <button
                type="button"
                onClick={() => applyPresetDay('study')}
                className="neu-btn px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-indigo-400/40 text-zinc-200 cursor-pointer"
              >
                📖 Deep Study
              </button>
              <button
                type="button"
                onClick={() => applyPresetDay('weekend')}
                className="neu-btn px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-emerald-400/40 text-zinc-200 cursor-pointer"
              >
                🌿 Weekend Recharge
              </button>
            </div>

            <form onSubmit={addBlock} className="grid grid-cols-1 sm:grid-cols-[105px_75px_125px_1fr_auto] gap-2 shrink-0">
              <select
                value={startHour}
                onChange={(e) => setStartHour(Number(e.target.value))}
                aria-label="Block start hour"
                className="neu-inset h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
              >
                {Array.from({ length: 17 }, (_, idx) => idx + 6).map((hr) => (
                  <option key={hr} value={hr}>{formatHourLabel(hr)}</option>
                ))}
              </select>
              <select
                value={durationHrs}
                onChange={(e) => setDurationHrs(Number(e.target.value))}
                aria-label="Block duration"
                className="neu-inset h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-200"
              >
                {[1, 2, 3, 4].map((d) => (
                  <option key={d} value={d}>{d}h</option>
                ))}
              </select>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
                aria-label="Block category"
                className="neu-inset h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
              >
                {Object.keys(CATEGORY_STYLES).map((cat) => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Time block activity..."
                aria-label="Time block title"
                className="neu-inset h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
              />
              <button
                type="submit"
                className="neu-btn h-9 px-4 rounded-xl bg-white text-zinc-950 text-xs font-extrabold cursor-pointer"
              >
                + Block
              </button>
            </form>

            {dayBlocks.length === 0 ? (
              <div className="neu-inset flex-1 min-h-[180px] p-8 rounded-xl bg-[#08090c] border border-dashed border-white/[0.08] flex flex-col items-center justify-center gap-2 text-center text-xs text-zinc-400">
                <span className="text-zinc-300 font-semibold">No time blocks scheduled for {selectedDate}</span>
                <span className="text-[11px] text-zinc-500 max-w-sm">
                  Add a custom block above or load a day template like Focused Workday or Deep Study.
                </span>
              </div>
            ) : (
              <div
                ref={blocksScroll.ref}
                onScroll={blocksScroll.onScroll}
                className={`flex-1 min-h-[180px] flex flex-col gap-2 overflow-y-auto overflow-x-hidden custom-scrollbar pt-2 border-t border-white/[0.06] pr-1.5 ${blocksScroll.fadeClass}`}
              >
                {dayBlocks.map((b) => (
                  <div
                    key={b.id}
                    className={`p-3 rounded-xl border flex items-center justify-between gap-3 shrink-0 transition-opacity ${
                      b.done ? 'bg-[#0b0c10] border-white/[0.05] opacity-60' : CATEGORY_STYLES[b.category]
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <button
                        type="button"
                        onClick={() =>
                          setDayBlocks((prev) =>
                            prev.map((x) => (x.id === b.id ? { ...x, done: !x.done } : x))
                          )
                        }
                        className={`w-6 h-6 rounded-lg border flex items-center justify-center text-xs shrink-0 cursor-pointer ${
                          b.done
                            ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                            : 'bg-[#08090c]/60 border-white/20 text-transparent hover:text-zinc-300'
                        }`}
                      >
                        ✓
                      </button>
                      <div className="flex flex-col min-w-0">
                        <span className={`text-xs font-bold ${b.done ? 'line-through text-zinc-400' : 'text-white'}`}>
                          {b.title}
                        </span>
                        <span className="text-[11px] font-mono opacity-80">
                          {formatHourLabel(b.startHour)} – {formatHourLabel(b.startHour + b.durationHrs)} · {b.category}
                        </span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setDayBlocks((prev) => prev.filter((x) => x.id !== b.id))}
                      className="text-zinc-400 hover:text-rose-300 text-xs px-1 cursor-pointer shrink-0"
                      aria-label={`Remove ${b.title}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
            <span>{dayBlocks.length} blocks · {totalPlannedHours}h planned</span>
            <span className={completedBlocks > 0 ? 'text-sky-300' : 'text-zinc-600'}>
              {completedBlocks}/{dayBlocks.length} completed
            </span>
          </div>
        </section>

        {/* Weekly Blueprint (Meals, Theme, Movement) */}
        <section className="xl:col-span-5 rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col xl:h-[640px]">
          <div className="relative overflow-hidden px-5 pt-4 pb-3.5 border-b border-white/[0.07] shrink-0 flex items-start justify-between gap-2">
            <HeroArtworkBackdrop src="/visuals/checklists-workspace.jpg" alt="" opacityClass="opacity-70 sm:opacity-85" />
            <div className="relative z-10 min-w-0">
              <h2 className="text-base font-bold text-white">Weekly Routine &amp; Meal Matrix</h2>
              <p className="text-xs text-zinc-400">
                Edit daily focus themes, meal ideas, and workouts across Monday–Sunday.
              </p>
            </div>
            <span className="relative z-10 shrink-0 px-2.5 py-1 rounded-md neu-inset bg-[#080b12]/90 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
              Today: {todayWeekday}
            </span>
          </div>

          <div
            ref={weeklyScroll.ref}
            onScroll={weeklyScroll.onScroll}
            className={`flex-1 min-h-[280px] max-h-[540px] xl:max-h-none overflow-y-auto overflow-x-hidden custom-scrollbar px-4 py-3 flex flex-col gap-2 ${weeklyScroll.fadeClass}`}
          >
            {WEEKDAYS.map((day) => {
              const cell = state.weeklyRoutine?.[day] || {
                focusTheme: '',
                mealPlan: '',
                movement: '',
              };
              const isToday = day === todayWeekday;
              return (
                <div
                  key={day}
                  className={`p-2.5 rounded-xl border flex flex-col gap-1.5 shrink-0 transition-colors ${
                    isToday
                      ? 'bg-[#0c1018] border-sky-400/35'
                      : 'bg-[#08090c] border-white/[0.07]'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[11px] font-mono font-bold border ${
                          isToday
                            ? 'bg-sky-500/25 border-sky-400/45 text-sky-200'
                            : 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                        }`}
                      >
                        {day}
                      </span>
                      {isToday && (
                        <span className="text-[9px] font-mono uppercase tracking-wider text-sky-400 font-bold">
                          Today
                        </span>
                      )}
                    </div>
                    <input
                      type="text"
                      value={cell.movement}
                      onChange={(e) => updateWeeklyCell(day, { movement: e.target.value })}
                      placeholder="Movement / Exercise..."
                      aria-label={`${day} movement`}
                      className="h-7 px-2 rounded-lg bg-[#16171e] border border-white/[0.06] text-[11px] text-emerald-300 w-36 focus:outline-none focus:border-emerald-400/40"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                    <input
                      type="text"
                      value={cell.focusTheme}
                      onChange={(e) => updateWeeklyCell(day, { focusTheme: e.target.value })}
                      placeholder="Focus theme..."
                      aria-label={`${day} focus theme`}
                      className="h-7 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-sky-400/40"
                    />
                    <input
                      type="text"
                      value={cell.mealPlan}
                      onChange={(e) => updateWeeklyCell(day, { mealPlan: e.target.value })}
                      placeholder="Meals / groceries..."
                      aria-label={`${day} meal plan`}
                      className="h-7 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.06] text-xs text-amber-200 focus:outline-none focus:border-amber-400/40"
                    />
                  </div>
                </div>
              );
            })}
          </div>

          <div className="px-5 py-2.5 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10px] font-mono text-zinc-500 shrink-0">
            <span>Mon – Sun · 7 days</span>
            <span className="text-zinc-600">Synced live</span>
          </div>
        </section>
      </div>
    </div>
  );
};

// ── Reusable Checklists + Books/Watchlist Queue Tab ──

export interface ChecklistItem {
  id: string;
  text: string;
  checked: boolean;
}

export interface ChecklistGroup {
  id: string;
  title: string;
  icon: string;
  items: ChecklistItem[];
}

export interface MediaQueueEntry {
  id: string;
  title: string;
  kind: 'Book' | 'Movie' | 'Course' | 'Podcast';
  status: 'Queued' | 'In Progress' | 'Finished';
  notes: string;
}

export interface ChecklistsWorkspaceState {
  lists: ChecklistGroup[];
  mediaQueue: MediaQueueEntry[];
}

const DEFAULT_CHECKLISTS_STATE: ChecklistsWorkspaceState = {
  lists: [
    {
      id: 'chk-groceries',
      title: 'Weekly Groceries',
      icon: '🛒',
      items: [
        { id: 'g-1', text: 'Fresh Vegetables & Greens', checked: false },
        { id: 'g-2', text: 'Eggs, Milk / Yogurt & Oats', checked: true },
        { id: 'g-3', text: 'Fruits & Roasted Nuts', checked: false },
      ],
    },
    {
      id: 'chk-travel',
      title: 'Travel Packing Kit',
      icon: '✈️',
      items: [
        { id: 't-1', text: 'Phone Charger & Power Bank', checked: true },
        { id: 't-2', text: 'Passport / ID & Boarding Wallet', checked: false },
        { id: 't-3', text: 'Refillable Water Bottle & Jacket', checked: false },
      ],
    },
  ],
  mediaQueue: [
    { id: 'm-1', title: 'Designing Data-Intensive Applications', kind: 'Book', status: 'In Progress', notes: 'Ch 7 Transactions' },
    { id: 'm-2', title: 'Systems Performance & Profiling', kind: 'Course', status: 'Queued', notes: '' },
  ],
};

const MEDIA_KIND_STYLES: Record<MediaQueueEntry['kind'], { icon: string; badge: string }> = {
  Book: { icon: '📘', badge: 'bg-purple-500/15 border-purple-400/35 text-purple-300' },
  Course: { icon: '🎓', badge: 'bg-sky-500/15 border-sky-400/35 text-sky-300' },
  Movie: { icon: '🎬', badge: 'bg-amber-500/15 border-amber-400/35 text-amber-300' },
  Podcast: { icon: '🎙️', badge: 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300' },
};

export const ChecklistsAndReadingTab: React.FC = () => {
  const [state, setState] = useSyncedWorkspaceState<ChecklistsWorkspaceState>(
    'checklists',
    DEFAULT_CHECKLISTS_STATE
  );
  const lists = state.lists || DEFAULT_CHECKLISTS_STATE.lists;
  const mediaQueue = state.mediaQueue || DEFAULT_CHECKLISTS_STATE.mediaQueue;

  const [activeListId, setActiveListId] = useState<string>(() => {
    try {
      const saved = window.sessionStorage.getItem('soul-checklists-active-list');
      if (saved && lists.some((l) => l.id === saved)) return saved;
    } catch {
      // ignore storage errors
    }
    return lists[0]?.id || '';
  });
  const [newListName, setNewListName] = useState('');
  const [newListIcon, setNewListIcon] = useState('📋');
  const [newItemText, setNewItemText] = useState('');
  const [copiedChecklist, setCopiedChecklist] = useState(false);

  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaKind, setMediaKind] = useState<MediaQueueEntry['kind']>('Book');
  const [mediaNote, setMediaNote] = useState('');
  const [mediaFilter, setMediaFilter] = useState<'All' | MediaQueueEntry['status']>('All');
  const [mediaKindFilter, setMediaKindFilter] = useState<'All' | MediaQueueEntry['kind']>('All');

  const selectedList = lists.find((l) => l.id === activeListId) || lists[0] || null;
  const checklistScroll = useScrollEdgeFade([selectedList?.id, selectedList?.items.length]);

  const visibleMedia = useMemo(
    () =>
      mediaQueue.filter((m) => {
        if (mediaFilter !== 'All' && m.status !== mediaFilter) return false;
        if (mediaKindFilter !== 'All' && m.kind !== mediaKindFilter) return false;
        return true;
      }),
    [mediaQueue, mediaFilter, mediaKindFilter]
  );
  const mediaScroll = useScrollEdgeFade([visibleMedia.length, mediaFilter, mediaKindFilter]);

  const listStats = useMemo(() => {
    const items = selectedList?.items || [];
    const done = items.filter((i) => i.checked).length;
    const total = items.length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    return { done, total, pct };
  }, [selectedList]);

  const mediaStats = useMemo(() => {
    const finished = mediaQueue.filter((m) => m.status === 'Finished').length;
    const inProgress = mediaQueue.filter((m) => m.status === 'In Progress').length;
    const queued = mediaQueue.filter((m) => m.status === 'Queued').length;
    const total = mediaQueue.length;
    const finishedPct = total > 0 ? Math.round((finished / total) * 100) : 0;
    const inProgressPct = total > 0 ? Math.round((inProgress / total) * 100) : 0;
    return { finished, inProgress, queued, total, finishedPct, inProgressPct };
  }, [mediaQueue]);

  const updateLists = (updater: (prev: ChecklistGroup[]) => ChecklistGroup[]) => {
    setState((prev) => ({
      ...prev,
      lists: updater(prev.lists || DEFAULT_CHECKLISTS_STATE.lists),
    }));
  };

  const selectList = (id: string) => {
    setActiveListId(id);
    try {
      window.sessionStorage.setItem('soul-checklists-active-list', id);
    } catch {
      // ignore storage errors
    }
  };

  const addChecklistGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const id = `chk-${Date.now()}`;
    updateLists((prev) => [{ id, title: newListName.trim(), icon: newListIcon || '📋', items: [] }, ...prev]);
    selectList(id);
    setNewListName('');
  };

  const addItemToList = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedList || !newItemText.trim()) return;
    updateLists((prev) =>
      prev.map((l) =>
        l.id === selectedList.id
          ? {
              ...l,
              items: [{ id: `ci-${Date.now()}`, text: newItemText.trim(), checked: false }, ...l.items],
            }
          : l
      )
    );
    setNewItemText('');
  };

  const toggleItem = (listId: string, itemId: string) => {
    updateLists((prev) =>
      prev.map((l) =>
        l.id === listId
          ? {
              ...l,
              items: l.items.map((it) => (it.id === itemId ? { ...it, checked: !it.checked } : it)),
            }
          : l
      )
    );
  };

  const clearChecked = (listId: string) => {
    updateLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, items: l.items.filter((it) => !it.checked) } : l
      )
    );
  };

  const uncheckAll = (listId: string) => {
    updateLists((prev) =>
      prev.map((l) =>
        l.id === listId ? { ...l, items: l.items.map((it) => ({ ...it, checked: false })) } : l
      )
    );
  };

  const copyActiveChecklist = () => {
    if (!selectedList) return;
    const lines = [
      `## ${selectedList.icon} ${selectedList.title}`,
      ...selectedList.items.map((it) => `- [${it.checked ? 'x' : ' '}] ${it.text}`),
    ].join('\n');
    void copyTextSafe(lines).then((ok) => {
      if (ok) {
        setCopiedChecklist(true);
        window.setTimeout(() => setCopiedChecklist(false), 1600);
      }
    });
  };

  const addPresetTemplate = (preset: ChecklistGroup) => {
    const id = `chk-${Date.now()}`;
    updateLists((prev) => [{ ...preset, id }, ...prev]);
    selectList(id);
  };

  const addMedia = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaTitle.trim()) return;
    setState((prev) => ({
      ...prev,
      mediaQueue: [
        {
          id: `med-${Date.now()}`,
          title: mediaTitle.trim(),
          kind: mediaKind,
          status: 'Queued',
          notes: mediaNote.trim(),
        },
        ...(prev.mediaQueue || []),
      ],
    }));
    setMediaTitle('');
    setMediaNote('');
  };

  return (
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5 items-stretch">
      {/* Left: Shopping, Packing & Reusable Checklists */}
      <section className="neu-card xl:col-span-7 rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        {/* Hero Artwork Header Banner */}
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#0c0f15] shrink-0">
          <HeroArtworkBackdrop
            src="/visuals/checklists-workspace.jpg"
            alt="Shopping, Packing & Checklists Visual"
            opacityClass="opacity-75 sm:opacity-90"
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <div>
                <h2 className="text-base font-extrabold text-white">Shopping, Packing &amp; Checklists</h2>
                <p className="text-xs text-zinc-300/90">
                  Manage reusable grocery, travel packing &amp; home reset templates.
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() =>
                    addPresetTemplate({
                      id: 'tmp',
                      title: 'Sunday Reset Audit',
                      icon: '🧹',
                      items: [
                        { id: 'r1', text: 'Clear desk & wash water bottle', checked: false },
                        { id: 'r2', text: 'Review next week tasks & meals', checked: false },
                        { id: 'r3', text: 'Back up important files', checked: false },
                      ],
                    })
                  }
                  className="px-2.5 py-1 rounded-lg bg-[#11151d]/90 border border-white/[0.1] hover:border-emerald-400/45 text-zinc-200 cursor-pointer transition-colors"
                >
                  + Sunday Reset Kit
                </button>
                <button
                  type="button"
                  onClick={() =>
                    addPresetTemplate({
                      id: 'tmp',
                      title: 'Day Trip Bag',
                      icon: '🎒',
                      items: [
                        { id: 'd1', text: 'USB-C Cable & Power Bank', checked: false },
                        { id: 'd2', text: 'Sunglasses, Wallet & Keys', checked: false },
                        { id: 'd3', text: 'Hydration Bottle & Snacks', checked: false },
                      ],
                    })
                  }
                  className="neu-btn px-2.5 py-1 rounded-lg bg-[#11151d]/90 border border-white/[0.1] hover:border-sky-400/45 text-zinc-200 cursor-pointer transition-colors"
                >
                  + Day Trip Bag
                </button>
              </div>
            </div>

            <div className="neu-inset shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#090b10]/90 border border-emerald-400/25">
              <MiniRadialRing percent={listStats.pct} color="#34d399" size={40} />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold font-mono text-white tabular-nums">
                  {listStats.done}/{listStats.total} checked
                </span>
                <span className="text-[10px] font-mono text-emerald-300">
                  {listStats.pct}% · {lists.length} {lists.length === 1 ? 'list' : 'lists'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Organized List Switcher & Active List Controls */}
        <div className="px-4 sm:px-5 pt-3.5 pb-3.5 border-b border-white/[0.06] bg-[#111218] flex flex-col gap-3 shrink-0">
          {/* Row 1: Segmented List Tabs + Compact New List Form */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div className="neu-tray flex items-center gap-1 p-1 rounded-xl bg-[#090b10] border border-white/[0.07] overflow-x-auto scrollbar-none min-w-0" role="tablist" aria-label="Checklists">
              {lists.map((l) => {
                const done = l.items.filter((i) => i.checked).length;
                const active = selectedList?.id === l.id;
                return (
                  <button
                    key={l.id}
                    type="button"
                    role="tab"
                    aria-selected={active}
                    onClick={() => selectList(l.id)}
                    className={`shrink-0 px-2.5 py-1.5 rounded-lg text-xs border flex items-center gap-1.5 cursor-pointer transition-colors ${
                      active
                        ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                        : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <span>{l.icon}</span>
                    <span className="truncate max-w-[160px]">{l.title}</span>
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono tabular-nums ${
                        active ? 'bg-sky-400/20 text-sky-200' : 'bg-white/[0.06] text-zinc-400'
                      }`}
                    >
                      {done}/{l.items.length}
                    </span>
                  </button>
                );
              })}
            </div>

            <form onSubmit={addChecklistGroup} className="flex items-center gap-1.5 shrink-0">
              <select
                value={newListIcon}
                onChange={(e) => setNewListIcon(e.target.value)}
                aria-label="New list icon"
                className="neu-inset h-8 px-1.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs text-white focus:outline-none"
              >
                {['📋', '🛒', '✈️', '🎒', '🧹', '🏠', '💻', '🎁'].map((ic) => (
                  <option key={ic} value={ic}>{ic}</option>
                ))}
              </select>
              <input
                type="text"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                placeholder="Create new list..."
                aria-label="New checklist name"
                className="neu-inset h-8 w-36 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/45"
              />
              <button
                type="submit"
                disabled={!newListName.trim()}
                className="neu-btn h-8 px-3 rounded-lg bg-sky-500/20 border border-sky-400/45 hover:bg-sky-500/30 disabled:opacity-45 disabled:cursor-not-allowed text-sky-100 text-xs font-bold cursor-pointer whitespace-nowrap"
              >
                + List
              </button>
            </form>
          </div>

          {/* Row 2: Active List Progress Meter + Clean Action Bar + Add Item Input */}
          {selectedList && (
            <div className="neu-inset p-3 rounded-xl bg-[#0a0c11] border border-white/[0.07] flex flex-col gap-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2.5">
                <div className="flex items-center gap-2.5 flex-1 min-w-[180px]">
                  <span className="text-[11px] font-mono text-zinc-400 whitespace-nowrap">
                    Progress:{' '}
                    <strong className="text-emerald-300 tabular-nums">{listStats.pct}%</strong>
                  </span>
                  <div className="neu-inset flex-1 max-w-[220px] h-2 rounded-full bg-[#151822] overflow-hidden border border-white/[0.06]">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-sky-400 transition-all duration-300"
                      style={{ width: `${listStats.pct}%` }}
                    />
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 shrink-0">
                  <button
                    type="button"
                    onClick={copyActiveChecklist}
                    disabled={selectedList.items.length === 0}
                    className="neu-btn px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] text-[11px] font-mono text-sky-300 hover:border-sky-400/35 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {copiedChecklist ? '✓ Copied' : 'Copy .md'}
                  </button>
                  <button
                    type="button"
                    onClick={() => uncheckAll(selectedList.id)}
                    disabled={listStats.done === 0}
                    title="Reset all checkmarks to reuse this list"
                    className="neu-btn px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] text-[11px] text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    ↺ Uncheck All
                  </button>
                  <button
                    type="button"
                    onClick={() => clearChecked(selectedList.id)}
                    disabled={listStats.done === 0}
                    className="neu-btn px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] text-[11px] text-zinc-300 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                  >
                    Clear Checked ({listStats.done})
                  </button>
                  {lists.length > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        const nextRemaining = lists.filter((l) => l.id !== selectedList.id);
                        updateLists(() => nextRemaining);
                        if (nextRemaining[0]) selectList(nextRemaining[0].id);
                      }}
                      className="neu-btn px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 hover:bg-rose-500/25 text-[11px] text-rose-300 cursor-pointer"
                    >
                      Delete
                    </button>
                  )}
                </div>
              </div>

              <form onSubmit={addItemToList} className="flex gap-2">
                <input
                  type="text"
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder={`Add item to ${selectedList.title}...`}
                  aria-label="New checklist item"
                  className="neu-inset flex-1 h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-400/45"
                />
                <button
                  type="submit"
                  disabled={!newItemText.trim()}
                  className="neu-btn h-9 px-4 rounded-xl bg-emerald-500/20 border border-emerald-400/45 hover:bg-emerald-500/30 disabled:opacity-45 disabled:cursor-not-allowed text-emerald-100 text-xs font-extrabold cursor-pointer shrink-0"
                >
                  + Add Item
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Checklist Items Body */}
        <div className="flex-1 min-h-0 px-4 sm:px-5 py-3.5 bg-[#0b0c11]/60 flex flex-col">
          {!selectedList || selectedList.items.length === 0 ? (
            <div className="neu-inset flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-zinc-500 rounded-xl bg-[#08090c] border border-dashed border-white/[0.08]">
              <span>No items in {selectedList?.title || 'this list'} yet.</span>
              <span className="text-[11px] text-zinc-600 mt-1">Add your first item above.</span>
            </div>
          ) : (
            <div
              ref={checklistScroll.ref}
              onScroll={checklistScroll.onScroll}
              className={`flex flex-col gap-1.5 max-h-72 overflow-y-auto overflow-x-hidden pr-1.5 custom-scrollbar ${checklistScroll.fadeClass}`}
            >
              {selectedList.items.map((it) => (
                <div
                  key={it.id}
                  className={`neu-tile flex items-center justify-between gap-2 px-3 py-2 rounded-xl border transition-colors ${
                    it.checked
                      ? 'bg-emerald-500/[0.06] border-emerald-500/20'
                      : 'bg-[#12141c] border-white/[0.06] hover:border-white/[0.14]'
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(selectedList.id, it.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span
                      className={`neu-btn w-5 h-5 rounded border flex items-center justify-center text-[11px] shrink-0 transition-colors ${
                        it.checked
                          ? 'bg-emerald-500/25 border-emerald-400 text-emerald-200'
                          : 'bg-[#08090c] border-white/20 text-transparent'
                      }`}
                    >
                      ✓
                    </span>
                    <span className={`text-xs truncate ${it.checked ? 'line-through text-zinc-500' : 'text-zinc-200'}`}>
                      {it.text}
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      updateLists((prev) =>
                        prev.map((l) =>
                          l.id === selectedList.id
                            ? { ...l, items: l.items.filter((x) => x.id !== it.id) }
                            : l
                        )
                      )
                    }
                    className="text-zinc-500 hover:text-rose-300 text-xs px-1 cursor-pointer shrink-0"
                    aria-label={`Remove ${it.text}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>
            {listStats.total} {listStats.total === 1 ? 'item' : 'items'} · {listStats.pct}% completed
          </span>
          <span className="text-zinc-600">Synced live</span>
        </div>
      </section>

      {/* Right: Books, Movies & Courses Queue */}
      <section className="neu-card xl:col-span-5 rounded-2xl bg-[#111218] border border-white/[0.08] overflow-hidden flex flex-col">
        {/* Hero Artwork Header Banner */}
        <div className="relative overflow-hidden p-4 sm:p-5 border-b border-white/[0.07] bg-[#100e17] shrink-0">
          <HeroArtworkBackdrop
            src="/visuals/reading-queue.jpg"
            alt="Reading, Courses & Watchlist Visual"
            opacityClass="opacity-75 sm:opacity-90"
          />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-2 min-w-0">
              <div>
                <h2 className="text-base font-extrabold text-white">Reading, Courses &amp; Watchlist</h2>
                <p className="text-xs text-zinc-300/90">
                  Keep books, documentaries, courses &amp; podcasts organized.
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] font-mono">
                <span className="text-emerald-300">● {mediaStats.finished} Finished</span>
                <span className="text-sky-300">● {mediaStats.inProgress} Active</span>
                <span className="text-zinc-400">● {mediaStats.queued} Queued</span>
              </div>
            </div>

            <div className="neu-tile shrink-0 flex items-center gap-3 px-3.5 py-2.5 rounded-xl bg-[#090910]/90 border border-purple-400/25">
              <MiniRadialRing percent={mediaStats.finishedPct} color="#c084fc" size={40} />
              <div className="flex flex-col">
                <span className="text-xs font-extrabold font-mono text-white tabular-nums">
                  {mediaStats.total} tracked
                </span>
                <span className="text-[10px] font-mono text-purple-300">
                  {mediaStats.finishedPct}% finished
                </span>
              </div>
            </div>
          </div>

          {/* Spectrum Completion Strip */}
          {mediaStats.total > 0 && (
            <div className="neu-inset relative z-10 mt-3 w-full h-1.5 rounded-full bg-black/50 overflow-hidden flex">
              {mediaStats.finished > 0 && (
                <div className="h-full bg-emerald-400" style={{ width: `${mediaStats.finishedPct}%` }} />
              )}
              {mediaStats.inProgress > 0 && (
                <div className="h-full bg-sky-400" style={{ width: `${mediaStats.inProgressPct}%` }} />
              )}
              <div className="flex-1 h-full bg-zinc-700/60" />
            </div>
          )}
        </div>

        {/* Add Form & Status Filters */}
        <div className="px-4 sm:px-5 pt-3.5 pb-3.5 border-b border-white/[0.06] bg-[#111218] flex flex-col gap-3 shrink-0">
          {/* Row 1: Segmented Status Filter Bar + Kind Filter */}
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="neu-tray flex items-center gap-1 p-1 rounded-xl bg-[#090b10] border border-white/[0.07] overflow-x-auto scrollbar-none text-[11px] font-mono" role="tablist" aria-label="Media queue filter">
              {(
                [
                  { key: 'All', count: mediaStats.total },
                  { key: 'In Progress', count: mediaStats.inProgress },
                  { key: 'Queued', count: mediaStats.queued },
                  { key: 'Finished', count: mediaStats.finished },
                ] as const
              ).map(({ key: status, count }) => (
                <button
                  key={status}
                  type="button"
                  role="tab"
                  aria-selected={mediaFilter === status}
                  onClick={() => setMediaFilter(status)}
                  className={`shrink-0 px-2.5 py-1 rounded-lg border cursor-pointer transition-colors inline-flex items-center gap-1.5 ${
                    mediaFilter === status
                      ? 'bg-purple-500/20 border-purple-400/45 text-white font-bold'
                      : 'bg-transparent border-transparent text-zinc-400 hover:text-white hover:bg-white/[0.04]'
                  }`}
                >
                  <span>{status}</span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[10px] tabular-nums ${
                      mediaFilter === status ? 'bg-purple-400/25 text-purple-200' : 'bg-white/[0.06] text-zinc-400'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            <select
              value={mediaKindFilter}
              onChange={(e) => setMediaKindFilter(e.target.value as 'All' | MediaQueueEntry['kind'])}
              aria-label="Filter media queue by type"
              className="h-8 px-2.5 rounded-lg bg-[#090b10] border border-white/[0.08] text-[11px] font-mono text-zinc-300 focus:outline-none focus:border-purple-400/45 shrink-0"
            >
              <option value="All">All Types</option>
              <option value="Book">📘 Books</option>
              <option value="Course">🎓 Courses</option>
              <option value="Movie">🎬 Movies</option>
              <option value="Podcast">🎙️ Podcasts</option>
            </select>
          </div>

          {/* Row 2: Structured Add Entry Box */}
          <form
            onSubmit={addMedia}
            className="neu-inset p-3 rounded-xl bg-[#0a0c11] border border-white/[0.07] flex flex-col gap-2.5"
          >
            <div className="flex flex-wrap items-center gap-1.5">
              {(['Book', 'Course', 'Movie', 'Podcast'] as const).map((k) => {
                const km = MEDIA_KIND_STYLES[k];
                const selected = mediaKind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => setMediaKind(k)}
                    className={`neu-btn px-2.5 py-1 rounded-lg text-[11px] font-mono border inline-flex items-center gap-1.5 cursor-pointer transition-colors ${
                      selected
                        ? `${km.badge} font-bold`
                        : 'bg-[#12141c] border-white/[0.07] text-zinc-400 hover:text-white'
                    }`}
                  >
                    <span>{km.icon}</span>
                    <span>{k}</span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-[1.25fr_1fr_auto] gap-2">
              <input
                type="text"
                value={mediaTitle}
                onChange={(e) => setMediaTitle(e.target.value)}
                placeholder={`${mediaKind} title...`}
                aria-label="Media queue title"
                className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400/45 min-w-0"
              />
              <input
                type="text"
                value={mediaNote}
                onChange={(e) => setMediaNote(e.target.value)}
                placeholder="Page, chapter or author..."
                aria-label="Media note"
                className="neu-inset h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-purple-400/45 min-w-0"
              />
              <button
                type="submit"
                disabled={!mediaTitle.trim()}
                className="neu-btn h-9 px-4 rounded-xl bg-purple-500/20 border border-purple-400/45 hover:bg-purple-500/30 disabled:opacity-45 disabled:cursor-not-allowed text-purple-100 text-xs font-extrabold cursor-pointer whitespace-nowrap"
              >
                + Save
              </button>
            </div>
          </form>
        </div>

        {/* Media Queue Cards */}
        <div className="flex-1 min-h-0 px-4 sm:px-5 py-3.5 bg-[#0b0c11]/60 flex flex-col">
          {visibleMedia.length === 0 ? (
            <div className="neu-inset flex-1 flex flex-col items-center justify-center py-10 text-center text-xs text-zinc-500 rounded-xl bg-[#08090c] border border-dashed border-white/[0.08]">
              <span>No entries matching &ldquo;{mediaFilter}&rdquo;.</span>
            </div>
          ) : (
            <div
              ref={mediaScroll.ref}
              onScroll={mediaScroll.onScroll}
              className={`flex flex-col gap-2 max-h-72 overflow-y-auto overflow-x-hidden pr-1.5 custom-scrollbar ${mediaScroll.fadeClass}`}
            >
              {visibleMedia.map((m) => {
                const kindMeta = MEDIA_KIND_STYLES[m.kind] || MEDIA_KIND_STYLES.Book;
                return (
                  <div
                    key={m.id}
                    className="neu-tile p-3 rounded-xl bg-[#12141c] border border-white/[0.07] hover:border-white/[0.15] flex items-start justify-between gap-2.5 transition-colors"
                  >
                    <div className="flex flex-col gap-1 min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`neu-tile px-1.5 py-0.5 rounded text-[10px] font-mono border inline-flex items-center gap-1 ${kindMeta.badge}`}>
                          <span>{kindMeta.icon}</span>
                          <span>{m.kind}</span>
                        </span>
                        <strong className="text-xs text-white truncate">{m.title}</strong>
                      </div>
                      {m.notes && <span className="text-[11px] text-zinc-400 truncate">{m.notes}</span>}
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        title="Click to cycle status"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            mediaQueue: (prev.mediaQueue || []).map((x) => {
                              if (x.id !== m.id) return x;
                              const nextStatus: MediaQueueEntry['status'] =
                                x.status === 'Queued'
                                  ? 'In Progress'
                                  : x.status === 'In Progress'
                                  ? 'Finished'
                                  : 'Queued';
                              return { ...x, status: nextStatus };
                            }),
                          }))
                        }
                        className={`neu-btn px-2 py-0.5 rounded-lg text-[10px] font-mono border cursor-pointer transition-colors ${
                          m.status === 'Finished'
                            ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                            : m.status === 'In Progress'
                            ? 'bg-sky-500/15 border-sky-400/35 text-sky-300'
                            : 'bg-[#16171e] border-white/[0.1] text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        {m.status} ↻
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setState((prev) => ({
                            ...prev,
                            mediaQueue: (prev.mediaQueue || []).filter((x) => x.id !== m.id),
                          }))
                        }
                        className="text-zinc-500 hover:text-rose-300 text-xs px-1 cursor-pointer"
                        aria-label={`Remove ${m.title}`}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-5 py-2 border-t border-white/[0.06] bg-[#0c0d12]/80 flex items-center justify-between text-[10.5px] font-mono text-zinc-500 shrink-0">
          <span>
            {visibleMedia.length} of {mediaStats.total} {mediaStats.total === 1 ? 'entry' : 'entries'}
          </span>
          <span className="text-zinc-600">Click status to cycle</span>
        </div>
      </section>
    </div>
  );
};
