import React, { useMemo, useState } from 'react';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
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
  Rest: 'bg-zinc-800/80 border-white/[0.12] text-zinc-300',
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
  const suffix = hour >= 12 ? 'PM' : 'AM';
  const h12 = hour % 12 === 0 ? 12 : hour % 12;
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
    navigator.clipboard?.writeText(lines);
    setCopiedSchedule(true);
    window.setTimeout(() => setCopiedSchedule(false), 1800);
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

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
        {/* Daily Time-Block Agenda */}
        <section className="xl:col-span-7 rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Daily Time-Block Planner</h2>
              <p className="text-xs text-zinc-400">
                Assign dedicated hours for deep work, health, meals &amp; rest.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
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
                className="h-8 px-3 rounded-lg bg-[#16171e] border border-white/[0.1] disabled:opacity-40 text-xs font-mono text-sky-300 cursor-pointer"
              >
                {copiedSchedule ? '✓ Copied .md' : 'Copy .md'}
              </button>
            </div>
          </div>

          {/* Preset Fill Row */}
          <div className="flex flex-wrap items-center gap-1.5 text-[11px]">
            <span className="font-mono text-zinc-500 mr-1">Day Templates:</span>
            <button
              type="button"
              onClick={() => applyPresetDay('workday')}
              className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-sky-400/40 text-zinc-200 cursor-pointer"
            >
              ⚡ Focused Workday
            </button>
            <button
              type="button"
              onClick={() => applyPresetDay('study')}
              className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-indigo-400/40 text-zinc-200 cursor-pointer"
            >
              📖 Deep Study
            </button>
            <button
              type="button"
              onClick={() => applyPresetDay('weekend')}
              className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-emerald-400/40 text-zinc-200 cursor-pointer"
            >
              🌿 Weekend Recharge
            </button>
          </div>

          <form onSubmit={addBlock} className="grid grid-cols-1 sm:grid-cols-[105px_75px_125px_1fr_auto] gap-2">
            <select
              value={startHour}
              onChange={(e) => setStartHour(Number(e.target.value))}
              aria-label="Block start hour"
              className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
            >
              {Array.from({ length: 17 }, (_, idx) => idx + 6).map((hr) => (
                <option key={hr} value={hr}>{formatHourLabel(hr)}</option>
              ))}
            </select>
            <select
              value={durationHrs}
              onChange={(e) => setDurationHrs(Number(e.target.value))}
              aria-label="Block duration"
              className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-zinc-200"
            >
              {[1, 2, 3, 4].map((d) => (
                <option key={d} value={d}>{d}h</option>
              ))}
            </select>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ScheduleCategory)}
              aria-label="Block category"
              className="h-9 px-2 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
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
              className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
            />
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-white text-zinc-950 text-xs font-extrabold cursor-pointer"
            >
              + Block
            </button>
          </form>

          {dayBlocks.length === 0 ? (
            <div className="p-8 rounded-xl bg-[#08090c] border border-white/[0.08] text-center text-xs text-zinc-400">
              No time blocks for {selectedDate} yet. Add a block above or load a template!
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {dayBlocks.map((b) => (
                <div
                  key={b.id}
                  className={`p-3 rounded-xl border flex items-center justify-between gap-3 transition-opacity ${
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
        </section>

        {/* Weekly Blueprint (Meals, Theme, Movement) */}
        <section className="xl:col-span-5 rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Weekly Routine &amp; Meal Matrix</h2>
            <p className="text-xs text-zinc-400">
              Edit daily focus themes, meal ideas, and workouts across Monday–Sunday.
            </p>
          </div>

          <div className="flex flex-col gap-2 max-h-[540px] overflow-y-auto pr-1 custom-scrollbar">
            {WEEKDAYS.map((day) => {
              const cell = state.weeklyRoutine?.[day] || {
                focusTheme: '',
                mealPlan: '',
                movement: '',
              };
              return (
                <div
                  key={day}
                  className="p-3 rounded-xl bg-[#08090c] border border-white/[0.07] flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[11px] font-mono font-bold text-sky-300">
                      {day}
                    </span>
                    <input
                      type="text"
                      value={cell.movement}
                      onChange={(e) => updateWeeklyCell(day, { movement: e.target.value })}
                      placeholder="Movement / Exercise..."
                      aria-label={`${day} movement`}
                      className="h-7 px-2 rounded-lg bg-[#16171e] border border-white/[0.06] text-[11px] text-emerald-300 w-36 focus:outline-none focus:border-emerald-400/40"
                    />
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      value={cell.focusTheme}
                      onChange={(e) => updateWeeklyCell(day, { focusTheme: e.target.value })}
                      placeholder="Focus theme..."
                      aria-label={`${day} focus theme`}
                      className="h-8 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.06] text-xs text-white focus:outline-none focus:border-sky-400/40"
                    />
                    <input
                      type="text"
                      value={cell.mealPlan}
                      onChange={(e) => updateWeeklyCell(day, { mealPlan: e.target.value })}
                      placeholder="Meals / groceries..."
                      aria-label={`${day} meal plan`}
                      className="h-8 px-2.5 rounded-lg bg-[#16171e] border border-white/[0.06] text-xs text-amber-200 focus:outline-none focus:border-amber-400/40"
                    />
                  </div>
                </div>
              );
            })}
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

export const ChecklistsAndReadingTab: React.FC = () => {
  const [state, setState] = useSyncedWorkspaceState<ChecklistsWorkspaceState>(
    'checklists',
    DEFAULT_CHECKLISTS_STATE
  );
  const lists = state.lists || DEFAULT_CHECKLISTS_STATE.lists;
  const mediaQueue = state.mediaQueue || DEFAULT_CHECKLISTS_STATE.mediaQueue;

  const [activeListId, setActiveListId] = useState<string>(() => lists[0]?.id || '');
  const [newListName, setNewListName] = useState('');
  const [newItemText, setNewItemText] = useState('');

  const [mediaTitle, setMediaTitle] = useState('');
  const [mediaKind, setMediaKind] = useState<MediaQueueEntry['kind']>('Book');
  const [mediaNote, setMediaNote] = useState('');

  const selectedList = lists.find((l) => l.id === activeListId) || lists[0] || null;

  const updateLists = (updater: (prev: ChecklistGroup[]) => ChecklistGroup[]) => {
    setState((prev) => ({
      ...prev,
      lists: updater(prev.lists || DEFAULT_CHECKLISTS_STATE.lists),
    }));
  };

  const addChecklistGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newListName.trim()) return;
    const id = `chk-${Date.now()}`;
    updateLists((prev) => [{ id, title: newListName.trim(), icon: '📋', items: [] }, ...prev]);
    setActiveListId(id);
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

  const addPresetTemplate = (preset: ChecklistGroup) => {
    const id = `chk-${Date.now()}`;
    updateLists((prev) => [{ ...preset, id }, ...prev]);
    setActiveListId(id);
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
    <div className="grid grid-cols-1 xl:grid-cols-12 gap-5">
      {/* Left: Shopping, Packing & Reusable Checklists */}
      <section className="xl:col-span-7 rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">Shopping, Packing &amp; Checklists</h2>
            <p className="text-xs text-zinc-400">Manage reusable grocery, travel packing &amp; home reset lists.</p>
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
              className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] hover:border-emerald-400/40 text-zinc-200 cursor-pointer"
            >
              + Sunday Reset Kit
            </button>
          </div>
        </div>

        {/* List Switcher + Add New List */}
        <div className="flex flex-wrap items-center gap-2">
          {lists.map((l) => {
            const done = l.items.filter((i) => i.checked).length;
            const active = selectedList?.id === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => setActiveListId(l.id)}
                className={`px-3 py-1.5 rounded-xl text-xs border flex items-center gap-1.5 cursor-pointer ${
                  active
                    ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                    : 'bg-[#16171e] border-white/[0.08] text-zinc-300 hover:text-white'
                }`}
              >
                <span>{l.icon}</span>
                <span>{l.title}</span>
                <span className="text-[10px] font-mono opacity-80">
                  {done}/{l.items.length}
                </span>
              </button>
            );
          })}
          <form onSubmit={addChecklistGroup} className="flex items-center gap-1.5 ml-auto">
            <input
              type="text"
              value={newListName}
              onChange={(e) => setNewListName(e.target.value)}
              placeholder="New list..."
              aria-label="New checklist name"
              className="h-8 w-32 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs text-white"
            />
            <button type="submit" className="h-8 px-3 rounded-lg bg-white text-zinc-950 text-xs font-bold cursor-pointer">
              + List
            </button>
          </form>
        </div>

        {selectedList && (
          <div className="p-4 rounded-xl bg-[#08090c] border border-white/[0.08] flex flex-col gap-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <strong className="text-sm text-white">
                {selectedList.icon} {selectedList.title}
              </strong>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => clearChecked(selectedList.id)}
                  className="px-2.5 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] text-[11px] text-zinc-300 hover:text-white cursor-pointer"
                >
                  Clear Checked
                </button>
                {lists.length > 1 && (
                  <button
                    type="button"
                    onClick={() => updateLists((prev) => prev.filter((l) => l.id !== selectedList.id))}
                    className="px-2.5 py-1 rounded-lg bg-rose-500/15 border border-rose-500/30 text-[11px] text-rose-300 cursor-pointer"
                  >
                    Delete List
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
                className="flex-1 h-9 px-3 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs text-white"
              />
              <button
                type="submit"
                className="h-9 px-4 rounded-xl bg-emerald-500 text-zinc-950 text-xs font-extrabold cursor-pointer"
              >
                + Add
              </button>
            </form>

            <div className="flex flex-col gap-1.5 max-h-72 overflow-y-auto pr-1 custom-scrollbar">
              {selectedList.items.map((it) => (
                <div
                  key={it.id}
                  className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl bg-[#16171e] border border-white/[0.06]"
                >
                  <button
                    type="button"
                    onClick={() => toggleItem(selectedList.id, it.id)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left cursor-pointer"
                  >
                    <span
                      className={`w-5 h-5 rounded border flex items-center justify-center text-[11px] shrink-0 ${
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
                    className="text-zinc-500 hover:text-rose-300 text-xs cursor-pointer"
                    aria-label={`Remove ${it.text}`}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Right: Books, Movies & Courses Queue */}
      <section className="xl:col-span-5 rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
        <div>
          <h2 className="text-base font-bold text-white">Reading, Courses &amp; Watchlist</h2>
          <p className="text-xs text-zinc-400">Keep books, documentaries, and tutorials organized in one place.</p>
        </div>

        <form onSubmit={addMedia} className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-2">
          <input
            type="text"
            value={mediaTitle}
            onChange={(e) => setMediaTitle(e.target.value)}
            placeholder="Book, course or film title..."
            aria-label="Media queue title"
            className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
          />
          <select
            value={mediaKind}
            onChange={(e) => setMediaKind(e.target.value as MediaQueueEntry['kind'])}
            aria-label="Media kind"
            className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200"
          >
            {(['Book', 'Course', 'Movie', 'Podcast'] as const).map((k) => (
              <option key={k} value={k}>{k}</option>
            ))}
          </select>
          <input
            type="text"
            value={mediaNote}
            onChange={(e) => setMediaNote(e.target.value)}
            placeholder="Optional page, author, or link note..."
            aria-label="Media note"
            className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
          />
          <button
            type="submit"
            className="h-9 px-3 rounded-xl bg-white text-zinc-950 text-xs font-extrabold cursor-pointer"
          >
            + Save
          </button>
        </form>

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1 custom-scrollbar">
          {mediaQueue.map((m) => (
            <div
              key={m.id}
              className="p-3 rounded-xl bg-[#08090c] border border-white/[0.07] flex items-start justify-between gap-2"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="px-1.5 py-0.5 rounded bg-purple-500/15 border border-purple-400/30 text-[10px] font-mono text-purple-300">
                    {m.kind}
                  </span>
                  <strong className="text-xs text-white truncate">{m.title}</strong>
                </div>
                {m.notes && <span className="text-[11px] text-zinc-400">{m.notes}</span>}
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  type="button"
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
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border cursor-pointer ${
                    m.status === 'Finished'
                      ? 'bg-emerald-500/15 border-emerald-400/35 text-emerald-300'
                      : m.status === 'In Progress'
                      ? 'bg-sky-500/15 border-sky-400/35 text-sky-300'
                      : 'bg-[#16171e] border-white/[0.1] text-zinc-400'
                  }`}
                >
                  {m.status}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setState((prev) => ({
                      ...prev,
                      mediaQueue: (prev.mediaQueue || []).filter((x) => x.id !== m.id),
                    }))
                  }
                  className="text-zinc-500 hover:text-rose-300 text-xs cursor-pointer"
                  aria-label={`Remove ${m.title}`}
                >
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
