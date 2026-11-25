import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import {
  DEFAULT_HABITS_STATE,
  EverydayTabId,
  FocusState,
  getLocalDateIso,
  HabitsState,
} from './everydayTabsRegistry';

export interface PersonalGoal {
  id: string;
  title: string;
  current: number;
  target: number;
  unit: string;
}

const DEFAULT_GOALS: PersonalGoal[] = [
  { id: 'g-read', title: 'Books Read This Year', current: 3, target: 12, unit: 'books' },
  { id: 'g-km', title: 'Walk / Run Distance', current: 28, target: 100, unit: 'km' },
];

function pad2(n: number): string {
  return String(Math.floor(Math.max(0, n))).padStart(2, '0');
}

function playGentleChime(): void {
  try {
    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    [523.25, 659.25, 783.99].forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      const start = ctx.currentTime + idx * 0.14;
      gain.gain.setValueAtTime(0.001, start);
      gain.gain.exponentialRampToValueAtTime(0.08, start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.55);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.6);
    });
  } catch {
    // ignore audio restrictions
  }
}

export const GuidedBreathingCard: React.FC = () => {
  const [active, setActive] = useState<boolean>(false);
  const [pattern, setPattern] = useState<'box' | '478'>('box');
  const [tick, setTick] = useState<number>(0);

  useEffect(() => {
    if (!active) return;
    const id = window.setInterval(() => setTick((t) => t + 1), 1000);
    return () => window.clearInterval(id);
  }, [active]);

  const phaseInfo = useMemo(() => {
    const cycle = pattern === 'box' ? [4, 4, 4, 4] : [4, 7, 8, 0];
    const total = cycle[0] + cycle[1] + cycle[2] + cycle[3];
    const pos = tick % total;
    if (pos < cycle[0]) {
      return {
        label: 'Breathe In',
        secLeft: cycle[0] - pos,
        scale: 'scale-105 border-emerald-400/60 text-emerald-300',
      };
    }
    if (pos < cycle[0] + cycle[1]) {
      return {
        label: 'Hold',
        secLeft: cycle[0] + cycle[1] - pos,
        scale: 'scale-105 border-sky-400/60 text-sky-300',
      };
    }
    if (pos < cycle[0] + cycle[1] + cycle[2]) {
      return {
        label: 'Breathe Out',
        secLeft: cycle[0] + cycle[1] + cycle[2] - pos,
        scale: 'scale-95 border-violet-400/50 text-violet-300',
      };
    }
    return {
      label: 'Pause',
      secLeft: total - pos,
      scale: 'scale-95 border-white/25 text-zinc-300',
    };
  }, [pattern, tick]);

  return (
    <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col justify-between items-center gap-4">
      <div className="w-full flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">Guided Calm Breathing</h2>
          <p className="text-xs text-zinc-400">Reset focus &amp; lower stress.</p>
        </div>
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <button
            type="button"
            onClick={() => {
              setPattern('box');
              setTick(0);
            }}
            className={`px-2 py-1 rounded-lg border cursor-pointer ${
              pattern === 'box'
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                : 'bg-[#171820] border-white/[0.08] text-zinc-400'
            }`}
          >
            Box 4-4-4-4
          </button>
          <button
            type="button"
            onClick={() => {
              setPattern('478');
              setTick(0);
            }}
            className={`px-2 py-1 rounded-lg border cursor-pointer ${
              pattern === '478'
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                : 'bg-[#171820] border-white/[0.08] text-zinc-400'
            }`}
          >
            4-7-8
          </button>
        </div>
      </div>

      <div
        className={`w-36 h-36 rounded-full border-2 bg-[#141722] flex flex-col items-center justify-center transition-transform duration-700 ${
          active ? phaseInfo.scale : 'border-white/15 text-zinc-300'
        }`}
      >
        <span className="text-sm font-bold">{active ? phaseInfo.label : 'Ready'}</span>
        <span className="text-2xl font-mono font-extrabold tabular-nums">
          {active ? `${phaseInfo.secLeft}s` : '—'}
        </span>
      </div>

      <button
        type="button"
        onClick={() => {
          setTick(0);
          setActive((a) => !a);
        }}
        className="w-full py-2 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold cursor-pointer"
      >
        {active ? 'Stop Session' : 'Start 1-Min Breather'}
      </button>
    </section>
  );
};

// ── 1. Focus Timer, Stopwatch & Guided Breathing Tab ──

export const FocusBreathingTab: React.FC<{ onSelectTab: (tab: EverydayTabId) => void }> = ({
  onSelectTab,
}) => {
  const today = getLocalDateIso(0);
  const [focusStats, setFocusStats] = useSyncedWorkspaceState<FocusState>('focus', {
    sessionsToday: 0,
    minutesToday: 0,
    lastDate: today,
  });

  const [presetMinutes, setPresetMinutes] = useState<number>(25);
  const [secondsLeft, setSecondsLeft] = useState<number>(25 * 60);
  const [timerRunning, setTimerRunning] = useState<boolean>(false);
  const [focusLabel, setFocusLabel] = useState<string>('Deep Focus Session');
  const [chimeEnabled, setChimeEnabled] = useState<boolean>(true);

  const [swMs, setSwMs] = useState<number>(0);
  const [swRunning, setSwRunning] = useState<boolean>(false);
  const [swLaps, setSwLaps] = useState<number[]>([]);

  useEffect(() => {
    if (!timerRunning) return;
    const id = window.setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          setTimerRunning(false);
          if (chimeEnabled) playGentleChime();
          const currentDate = getLocalDateIso(0);
          setFocusStats((f) => ({
            lastDate: currentDate,
            sessionsToday: f.lastDate === currentDate ? f.sessionsToday + 1 : 1,
            minutesToday: (f.lastDate === currentDate ? f.minutesToday : 0) + presetMinutes,
          }));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [timerRunning, chimeEnabled, presetMinutes, setFocusStats]);

  useEffect(() => {
    if (!swRunning) return;
    const id = window.setInterval(() => setSwMs((ms) => ms + 100), 100);
    return () => window.clearInterval(id);
  }, [swRunning]);

  const applyPreset = (mins: number) => {
    setTimerRunning(false);
    setPresetMinutes(mins);
    setSecondsLeft(mins * 60);
  };

  const todaySessions = focusStats.lastDate === today ? focusStats.sessionsToday : 0;
  const todayFocusMins = focusStats.lastDate === today ? focusStats.minutesToday : 0;
  const pct = Math.max(
    0,
    Math.min(100, Math.round(((presetMinutes * 60 - secondsLeft) / (presetMinutes * 60 || 1)) * 100))
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pomodoro Focus Timer */}
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div>
              <h2 className="text-base font-bold text-white">Pomodoro Focus Timer</h2>
              <p className="text-xs text-zinc-400">
                Today:{' '}
                <span className="font-mono text-amber-300 font-bold">
                  {todaySessions} sessions · {todayFocusMins}m
                </span>
              </p>
            </div>
            <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
              <input
                type="checkbox"
                checked={chimeEnabled}
                onChange={(e) => setChimeEnabled(e.target.checked)}
                className="accent-amber-400"
              />
              Chime
            </label>
          </div>

          <input
            type="text"
            value={focusLabel}
            onChange={(e) => setFocusLabel(e.target.value)}
            placeholder="Session intention (e.g., Reading, Deep Coding, Study)..."
            aria-label="Focus session label"
            className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-amber-400/50"
          />

          <div className="flex flex-col items-center justify-center py-5 rounded-2xl bg-[#08090c] border border-white/[0.08] gap-3">
            <div className="text-5xl font-extrabold font-mono tracking-wider text-white tabular-nums">
              {pad2(Math.floor(secondsLeft / 60))}:{pad2(secondsLeft % 60)}
            </div>
            <div className="w-4/5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-amber-400 to-emerald-400 transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  if (secondsLeft === 0) setSecondsLeft(presetMinutes * 60);
                  setTimerRunning((r) => !r);
                }}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                  timerRunning
                    ? 'bg-rose-500/20 border border-rose-400/40 text-rose-200'
                    : 'bg-white text-zinc-950 hover:bg-amber-100'
                }`}
              >
                {timerRunning ? '⏸ Pause' : '▶ Start Focus'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setTimerRunning(false);
                  setSecondsLeft(presetMinutes * 60);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              >
                ↺ Reset
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('tasks')}
                className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-200 cursor-pointer"
              >
                Tasks →
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              { mins: 5, label: '5m Break' },
              { mins: 15, label: '15m Short' },
              { mins: 25, label: '25m Pomodoro' },
              { mins: 45, label: '45m Deep' },
              { mins: 60, label: '60m Sprint' },
            ].map((p) => (
              <button
                key={p.mins}
                type="button"
                onClick={() => applyPreset(p.mins)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-mono border cursor-pointer ${
                  presetMinutes === p.mins
                    ? 'bg-amber-500/20 border-amber-400/45 text-amber-200 font-bold'
                    : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </section>

        {/* Precision Stopwatch */}
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Stopwatch &amp; Lap Recorder</h2>
            <p className="text-xs text-zinc-400">
              Measure workouts, sprints, or build timings with laps.
            </p>
          </div>

          <div className="flex flex-col items-center justify-center py-7 rounded-2xl bg-[#08090c] border border-white/[0.08] gap-3">
            <div className="text-5xl font-extrabold font-mono tracking-wider text-sky-300 tabular-nums">
              {pad2(Math.floor(swMs / 60000))}:{pad2(Math.floor((swMs % 60000) / 1000))}.
              {Math.floor((swMs % 1000) / 100)}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={() => setSwRunning((r) => !r)}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer ${
                  swRunning
                    ? 'bg-rose-500/20 border border-rose-400/40 text-rose-200'
                    : 'bg-sky-500/25 border border-sky-400/45 text-white'
                }`}
              >
                {swRunning ? '⏸ Pause' : '▶ Start'}
              </button>
              <button
                type="button"
                onClick={() => setSwLaps((prev) => [swMs, ...prev])}
                disabled={swMs === 0}
                className="px-3.5 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-200 disabled:opacity-40 cursor-pointer"
              >
                🏁 Lap
              </button>
              <button
                type="button"
                onClick={() => {
                  setSwRunning(false);
                  setSwMs(0);
                  setSwLaps([]);
                }}
                className="px-3.5 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-300 cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          {swLaps.length > 0 && (
            <div className="max-h-40 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
              {swLaps.map((lap, idx) => (
                <div
                  key={`${lap}-${idx}`}
                  className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.06] text-xs font-mono"
                >
                  <span className="text-zinc-400">Lap #{swLaps.length - idx}</span>
                  <span className="text-white font-bold">
                    {pad2(Math.floor(lap / 60000))}:{pad2(Math.floor((lap % 60000) / 1000))}.
                    {Math.floor((lap % 1000) / 100)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Guided Breathing side-by-side on Desktop */}
        <GuidedBreathingCard />
      </div>

      {/* Offline Web Audio Ambient Focus Soundscapes */}
      <AmbientFocusSoundscapeCard />
    </div>
  );
};

type SoundMode = 'off' | 'brown' | 'rain' | 'gamma40';

const AmbientFocusSoundscapeCard: React.FC = () => {
  const [soundMode, setSoundMode] = useState<SoundMode>('off');
  const [volume, setVolume] = useState<number>(0.25);
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (gainRef.current) {
      gainRef.current.gain.value = volume;
    }
  }, [volume]);

  useEffect(() => {
    if (ctxRef.current) {
      void ctxRef.current.close().catch(() => {});
      ctxRef.current = null;
      gainRef.current = null;
    }
    if (soundMode === 'off') return;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return;

    const ctx = new AudioCtx();
    ctxRef.current = ctx;
    const masterGain = ctx.createGain();
    masterGain.gain.value = volume;
    masterGain.connect(ctx.destination);
    gainRef.current = masterGain;

    if (soundMode === 'gamma40') {
      const merger = ctx.createChannelMerger(2);
      const oscLeft = ctx.createOscillator();
      const oscRight = ctx.createOscillator();
      oscLeft.type = 'sine';
      oscRight.type = 'sine';
      oscLeft.frequency.value = 200;
      oscRight.frequency.value = 240;
      oscLeft.connect(merger, 0, 0);
      oscRight.connect(merger, 0, 1);
      merger.connect(masterGain);
      oscLeft.start();
      oscRight.start();
    } else {
      const sampleRate = ctx.sampleRate;
      const length = sampleRate * 2;
      const buffer = ctx.createBuffer(1, length, sampleRate);
      const data = buffer.getChannelData(0);
      let lastOut = 0;
      for (let i = 0; i < length; i += 1) {
        const white = Math.random() * 2 - 1;
        if (soundMode === 'brown') {
          data[i] = (lastOut + 0.02 * white) / 1.02;
          lastOut = data[i];
          data[i] *= 2.8;
        } else {
          data[i] = white * 0.45;
        }
      }
      const src = ctx.createBufferSource();
      src.buffer = buffer;
      src.loop = true;

      const filter = ctx.createBiquadFilter();
      filter.type = soundMode === 'rain' ? 'bandpass' : 'lowpass';
      filter.frequency.value = soundMode === 'rain' ? 900 : 320;
      filter.Q.value = soundMode === 'rain' ? 0.6 : 0.7;

      src.connect(filter);
      filter.connect(masterGain);
      src.start();
    }

    return () => {
      void ctx.close().catch(() => {});
      ctxRef.current = null;
      gainRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [soundMode]);

  return (
    <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex flex-col gap-0.5">
        <h2 className="text-base font-bold text-white">Offline Ambient Focus Soundscapes</h2>
        <p className="text-xs text-zinc-400">
          Synthesized locally via Web Audio API — zero downloads or external audio streams needed.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'off', label: '🔇 Off' },
            { id: 'rain', label: '🌧️ Gentle Rain' },
            { id: 'brown', label: '🌊 Deep Brown Noise' },
            { id: 'gamma40', label: '🧠 40Hz Binaural Focus' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => setSoundMode(m.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
              soundMode === m.id
                ? 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200 font-bold'
                : 'bg-[#16171e] border-white/[0.08] text-zinc-300 hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}

        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#08090c] border border-white/[0.08] text-xs font-mono text-zinc-300">
          <span>Vol</span>
          <input
            type="range"
            min={0.05}
            max={0.6}
            step={0.05}
            value={volume}
            onChange={(e) => setVolume(Number(e.target.value))}
            aria-label="Ambient sound volume"
            className="w-20 accent-emerald-400 cursor-pointer"
          />
        </label>
      </div>
    </section>
  );
};

// ── 2. Habits, Mood & Hydration Tab ──

const HYDRATION_STORAGE_KEY = 'soul-everyday-hydration-v1';

export const HabitsMoodTab: React.FC = () => {
  const today = getLocalDateIso(0);
  const [habitsState, setHabitsState] = useSyncedWorkspaceState<HabitsState>(
    'habits',
    DEFAULT_HABITS_STATE
  );
  const [newHabitName, setNewHabitName] = useState<string>('');
  const [newHabitEmoji, setNewHabitEmoji] = useState<string>('✨');

  const [glassesByDate, setGlassesByDate] = useState<Record<string, number>>(() => {
    try {
      const raw = window.localStorage.getItem(HYDRATION_STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const glassesToday = glassesByDate[today] || 0;

  const setGlasses = (count: number) => {
    const safe = Math.max(0, Math.min(20, count));
    setGlassesByDate((prev) => {
      const next = { ...prev, [today]: safe };
      try {
        window.localStorage.setItem(HYDRATION_STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore quota errors
      }
      return next;
    });
  };

  const last7Days = useMemo(
    () =>
      [-6, -5, -4, -3, -2, -1, 0].map((offset) => {
        const iso = getLocalDateIso(offset);
        const dt = new Date(`${iso}T12:00:00`);
        return {
          iso,
          dayLabel: dt.toLocaleDateString(undefined, { weekday: 'short' }),
          dateNum: iso.slice(8, 10),
        };
      }),
    []
  );

  const weeklyCompletionPct = useMemo(() => {
    const totalSlots = habitsState.habits.length * 7;
    if (totalSlots === 0) return 0;
    const completedSlots = habitsState.habits.reduce(
      (sum, h) => sum + last7Days.filter((d) => h.completedDates.includes(d.iso)).length,
      0
    );
    return Math.round((completedSlots / totalSlots) * 100);
  }, [habitsState.habits, last7Days]);

  const toggleHabitDay = (habitId: string, dateIso: string) => {
    setHabitsState((prev) => ({
      ...prev,
      habits: prev.habits.map((h) => {
        if (h.id !== habitId) return h;
        const exists = h.completedDates.includes(dateIso);
        return {
          ...h,
          completedDates: exists
            ? h.completedDates.filter((d) => d !== dateIso)
            : [...h.completedDates, dateIso],
        };
      }),
    }));
  };

  const addHabit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newHabitName.trim();
    if (!clean) return;
    setHabitsState((prev) => ({
      ...prev,
      habits: [
        ...prev.habits,
        { id: `hab-${Date.now()}`, emoji: newHabitEmoji || '✨', name: clean, completedDates: [] },
      ],
    }));
    setNewHabitName('');
  };

  const deleteHabit = (id: string) => {
    setHabitsState((prev) => ({
      ...prev,
      habits: prev.habits.filter((h) => h.id !== id),
    }));
  };

  const todayMood = habitsState.moodByDate[today] || { mood: '🙂 Calm', reflection: '' };
  const setTodayMood = (patch: Partial<{ mood: string; reflection: string }>) => {
    setHabitsState((prev) => ({
      ...prev,
      moodByDate: {
        ...prev.moodByDate,
        [today]: { ...todayMood, ...patch },
      },
    }));
  };

  return (
    <div className="flex flex-col gap-5">
      {/* 7-Day Habit Grid */}
      <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-white">7-Day Daily Habit Streak Tracker</h2>
            <p className="text-xs text-zinc-400">Build consistent routines across the past 7 days.</p>
          </div>
          <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-mono font-bold text-emerald-300">
            Weekly Consistency: {weeklyCompletionPct}%
          </span>
        </div>

        <form onSubmit={addHabit} className="flex flex-wrap gap-2">
          <select
            value={newHabitEmoji}
            onChange={(e) => setNewHabitEmoji(e.target.value)}
            aria-label="Habit icon"
            className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-sm text-white"
          >
            {['✨', '💧', '🏃', '📖', '🧘', '🥗', '💤', '🧹', '💻', '🎸'].map((ic) => (
              <option key={ic} value={ic}>{ic}</option>
            ))}
          </select>
          <input
            type="text"
            value={newHabitName}
            onChange={(e) => setNewHabitName(e.target.value)}
            placeholder="Add new daily habit (e.g., 10k steps, Evening walk)..."
            aria-label="New habit name"
            className="flex-1 min-w-[200px] h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
          />
          <button
            type="submit"
            className="h-9 px-4 rounded-xl bg-white text-zinc-950 text-xs font-extrabold cursor-pointer"
          >
            + Add Habit
          </button>
        </form>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/[0.08] text-[11px] font-mono text-zinc-400">
                <th className="py-2 pr-3">Habit</th>
                {last7Days.map((d) => (
                  <th key={d.iso} className="py-2 px-1.5 text-center">
                    <div>{d.dayLabel}</div>
                    <div className={`text-[10px] ${d.iso === today ? 'text-sky-300 font-bold' : 'text-zinc-500'}`}>
                      {d.dateNum}
                    </div>
                  </th>
                ))}
                <th className="py-2 pl-2 text-right">Streak</th>
                <th className="py-2 pl-2" />
              </tr>
            </thead>
            <tbody>
              {habitsState.habits.map((h) => {
                const count7 = last7Days.filter((d) => h.completedDates.includes(d.iso)).length;
                return (
                  <tr key={h.id} className="border-b border-white/[0.05] hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-3 text-xs font-semibold text-white">
                      {h.emoji} {h.name}
                    </td>
                    {last7Days.map((d) => {
                      const done = h.completedDates.includes(d.iso);
                      return (
                        <td key={d.iso} className="py-2.5 px-1.5 text-center">
                          <button
                            type="button"
                            onClick={() => toggleHabitDay(h.id, d.iso)}
                            aria-label={`Toggle ${h.name} for ${d.iso}`}
                            className={`w-7 h-7 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              done
                                ? 'bg-emerald-500/25 border-emerald-400/50 text-emerald-200'
                                : 'bg-[#08090c] border-white/[0.08] text-zinc-600 hover:border-white/[0.22]'
                            }`}
                          >
                            {done ? '✓' : '·'}
                          </button>
                        </td>
                      );
                    })}
                    <td className="py-2.5 pl-2 text-right text-xs font-mono text-emerald-300 font-bold">
                      {count7}/7
                    </td>
                    <td className="py-2.5 pl-2 text-right">
                      <button
                        type="button"
                        onClick={() => deleteHabit(h.id)}
                        className="text-zinc-500 hover:text-rose-300 text-xs cursor-pointer"
                        aria-label={`Delete ${h.name}`}
                      >
                        ✕
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3">
          <div>
            <h2 className="text-base font-bold text-white">Daily Mood &amp; Reflection Check-In</h2>
            <p className="text-xs text-zinc-400">How are you feeling today ({today})?</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {['🤩 Energized', '🙂 Calm', '🎯 Focused', '😴 Tired', '😰 Stressed', '🙏 Grateful'].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setTodayMood({ mood: m })}
                className={`px-3 py-1.5 rounded-xl text-xs border cursor-pointer ${
                  todayMood.mood === m
                    ? 'bg-sky-500/20 border-sky-400/45 text-white font-bold'
                    : 'bg-[#16171e] border-white/[0.08] text-zinc-300 hover:text-white'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
          <textarea
            rows={3}
            value={todayMood.reflection}
            onChange={(e) => setTodayMood({ reflection: e.target.value })}
            placeholder="One gratitude note, highlight, or thought for today..."
            aria-label="Daily reflection"
            className="w-full p-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-zinc-200 focus:outline-none focus:border-sky-400/50 resize-y"
          />
        </section>

        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3 justify-between">
          <div>
            <div className="flex items-center justify-between gap-2">
              <h2 className="text-base font-bold text-white">Daily Hydration Tracker</h2>
              <span className="text-xs font-mono text-sky-300 font-bold">
                {glassesToday * 250} ml / 2000 ml ({glassesToday}/8 glasses)
              </span>
            </div>
            <p className="text-xs text-zinc-400">Tap glasses or use quick buttons to log water intake today.</p>
          </div>

          <div className="grid grid-cols-4 sm:grid-cols-8 gap-2 py-2">
            {Array.from({ length: 8 }, (_, idx) => {
              const filled = idx < glassesToday;
              return (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setGlasses(filled && idx === glassesToday - 1 ? idx : idx + 1)}
                  className={`h-12 rounded-xl border flex flex-col items-center justify-center text-sm cursor-pointer transition-colors ${
                    filled
                      ? 'bg-sky-500/20 border-sky-400/45 text-sky-200'
                      : 'bg-[#16171e] border-white/[0.08] text-zinc-600 hover:border-sky-400/30'
                  }`}
                >
                  <span>💧</span>
                  <span className="text-[10px] font-mono">{idx + 1}</span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setGlasses(glassesToday + 1)}
              className="px-3.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-xs font-bold text-sky-200 cursor-pointer"
            >
              +1 Glass (250ml)
            </button>
            <button
              type="button"
              onClick={() => setGlasses(Math.max(0, glassesToday - 1))}
              className="px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.08] text-xs font-mono text-zinc-300 cursor-pointer"
            >
              -1
            </button>
            <button
              type="button"
              onClick={() => setGlasses(0)}
              className="px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.08] text-xs text-zinc-400 hover:text-white cursor-pointer"
            >
              Reset Today
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};

// ── 3. Personal Goals & Event Countdowns Tab ──

export const PersonalGoalsCard: React.FC = () => {
  const [goals, setGoals] = useSyncedWorkspaceState<PersonalGoal[]>('goals', DEFAULT_GOALS);
  const [title, setTitle] = useState<string>('');
  const [target, setTarget] = useState<string>('10');
  const [unit, setUnit] = useState<string>('steps');

  const handleAddGoal = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = title.trim();
    const tgt = Math.max(1, parseFloat(target) || 1);
    if (!clean) return;
    setGoals((prev) => [
      { id: `goal-${Date.now()}`, title: clean, current: 0, target: tgt, unit: unit.trim() || 'pts' },
      ...prev,
    ]);
    setTitle('');
  };

  return (
    <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
      <div>
        <h2 className="text-base font-bold text-white">Personal Goals &amp; Milestones</h2>
        <p className="text-xs text-zinc-400">Track measurable life targets like books, savings, fitness, or projects.</p>
      </div>

      <form onSubmit={handleAddGoal} className="grid grid-cols-1 sm:grid-cols-[1.5fr_80px_90px_auto] gap-2">
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="New goal (e.g., Save emergency fund, Learn Spanish)..."
          aria-label="Goal title"
          className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
        />
        <input
          type="number"
          min={1}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          aria-label="Goal target"
          className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
        />
        <input
          type="text"
          value={unit}
          onChange={(e) => setUnit(e.target.value)}
          placeholder="unit"
          aria-label="Goal unit"
          className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
        />
        <button
          type="submit"
          className="h-9 px-4 rounded-xl bg-white text-zinc-950 text-xs font-bold cursor-pointer"
        >
          + Goal
        </button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {goals.map((g) => {
          const pct = Math.min(100, Math.round((g.current / Math.max(1, g.target)) * 100));
          return (
            <div key={g.id} className="p-3.5 rounded-xl bg-[#16171e] border border-white/[0.07] flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs font-bold text-white truncate">{g.title}</span>
                <button
                  type="button"
                  onClick={() => setGoals((prev) => prev.filter((item) => item.id !== g.id))}
                  className="text-zinc-500 hover:text-rose-300 text-xs cursor-pointer"
                  aria-label={`Remove ${g.title}`}
                >
                  ✕
                </button>
              </div>
              <div className="flex items-center justify-between text-xs font-mono gap-2">
                <span className="text-sky-300 font-bold tabular-nums">
                  {g.current} / {g.target} {g.unit} ({pct}%)
                </span>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() =>
                      setGoals((prev) =>
                        prev.map((x) => (x.id === g.id ? { ...x, current: Math.max(0, x.current - 1) } : x))
                      )
                    }
                    className="w-6 h-6 rounded bg-[#0c0d12] border border-white/[0.1] text-white cursor-pointer"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGoals((prev) =>
                        prev.map((x) => (x.id === g.id ? { ...x, current: x.current + 1 } : x))
                      )
                    }
                    className="w-6 h-6 rounded bg-emerald-500/20 border border-emerald-400/35 text-emerald-200 font-bold cursor-pointer"
                  >
                    +1
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGoals((prev) =>
                        prev.map((x) => (x.id === g.id ? { ...x, current: x.current + 5 } : x))
                      )
                    }
                    className="px-1.5 h-6 rounded bg-sky-500/15 border border-sky-400/30 text-[10px] text-sky-200 font-bold cursor-pointer"
                  >
                    +5
                  </button>
                </div>
              </div>
              <div className="w-full h-1.5 rounded-full bg-black/50 overflow-hidden">
                <div className="h-full bg-emerald-400 transition-all" style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
};

export const DateCountdownCalculatorCard: React.FC = () => {
  const [targetDate, setTargetDate] = useState<string>('2027-01-01');
  const [birthDate, setBirthDate] = useState<string>('2000-01-01');

  const diffInfo = useMemo(() => {
    const now = new Date();
    const startToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const target = new Date(`${targetDate}T00:00:00`).getTime();
    const days = Number.isNaN(target) ? 0 : Math.round((target - startToday) / 86400000);

    const b = new Date(`${birthDate}T00:00:00`);
    let years = now.getFullYear() - b.getFullYear();
    let months = now.getMonth() - b.getMonth();
    let d = now.getDate() - b.getDate();
    if (d < 0) {
      months -= 1;
      d += 30;
    }
    if (months < 0) {
      years -= 1;
      months += 12;
    }
    return {
      days,
      ageValid: !Number.isNaN(b.getTime()) && years >= 0,
      ageText: `${years}y ${months}m ${d}d`,
    };
  }, [targetDate, birthDate]);

  return (
    <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
      <h2 className="text-base font-bold text-white">Countdown &amp; Exact Age Calculator</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="p-3.5 rounded-xl bg-[#16171e] border border-white/[0.07] flex flex-col gap-2">
          <label className="text-xs text-zinc-400 flex flex-col gap-1">
            Event / Deadline Date
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
            />
          </label>
          <div className="text-sm font-mono font-extrabold text-sky-300">
            {diffInfo.days === 0
              ? 'Today!'
              : diffInfo.days > 0
              ? `${diffInfo.days} days remaining`
              : `${Math.abs(diffInfo.days)} days ago`}
          </div>
        </div>

        <div className="p-3.5 rounded-xl bg-[#16171e] border border-white/[0.07] flex flex-col gap-2">
          <label className="text-xs text-zinc-400 flex flex-col gap-1">
            Start / Birth Date
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="h-9 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
            />
          </label>
          <div className="text-sm font-mono font-extrabold text-emerald-300">
            {diffInfo.ageValid ? diffInfo.ageText : 'Pick a valid past date'}
          </div>
        </div>
      </div>
    </section>
  );
};

const COUNTDOWN_EVENTS_KEY = 'soul-everyday-countdowns-v1';

interface SavedEventCountdown {
  id: string;
  label: string;
  date: string;
}

export const GoalsCountdownTab: React.FC = () => {
  const [events, setEvents] = useState<SavedEventCountdown[]>(() => {
    try {
      const raw = window.localStorage.getItem(COUNTDOWN_EVENTS_KEY);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    const nextMonth = getLocalDateIso(30);
    return [{ id: 'ev-1', label: 'Monthly Milestone Review', date: nextMonth }];
  });

  const [evLabel, setEvLabel] = useState<string>('');
  const [evDate, setEvDate] = useState<string>(() => getLocalDateIso(14));

  const persistEvents = (next: SavedEventCountdown[]) => {
    setEvents(next);
    try {
      window.localStorage.setItem(COUNTDOWN_EVENTS_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  };

  const addEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!evLabel.trim() || !evDate) return;
    persistEvents([{ id: `ev-${Date.now()}`, label: evLabel.trim(), date: evDate }, ...events]);
    setEvLabel('');
  };

  const todayMs = new Date(`${getLocalDateIso(0)}T00:00:00`).getTime();

  return (
    <div className="flex flex-col gap-5">
      <PersonalGoalsCard />

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <DateCountdownCalculatorCard />

        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-4">
          <div>
            <h2 className="text-base font-bold text-white">Saved Event Countdowns</h2>
            <p className="text-xs text-zinc-400">Pin important launches, birthdays, exams, or holidays.</p>
          </div>

          <form onSubmit={addEvent} className="grid grid-cols-1 sm:grid-cols-[1fr_140px_auto] gap-2">
            <input
              type="text"
              value={evLabel}
              onChange={(e) => setEvLabel(e.target.value)}
              placeholder="Event title (e.g., Product Launch)..."
              aria-label="Event countdown label"
              className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white"
            />
            <input
              type="date"
              value={evDate}
              onChange={(e) => setEvDate(e.target.value)}
              aria-label="Event countdown date"
              className="h-9 px-2.5 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs font-mono text-white"
            />
            <button
              type="submit"
              className="h-9 px-4 rounded-xl bg-white text-zinc-950 text-xs font-extrabold cursor-pointer"
            >
              + Pin
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {events.map((ev) => {
              const diffDays = Math.round((new Date(`${ev.date}T00:00:00`).getTime() - todayMs) / 86400000);
              const badge =
                diffDays === 0
                  ? 'Today!'
                  : diffDays > 0
                  ? `D-${diffDays} days`
                  : `${Math.abs(diffDays)}d ago`;
              return (
                <div key={ev.id} className="p-3 rounded-xl bg-[#16171e] border border-white/[0.07] flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{ev.label}</div>
                    <div className="text-[11px] font-mono text-zinc-400">{ev.date}</div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-lg text-[10px] font-mono font-bold border ${
                        diffDays >= 0
                          ? 'bg-purple-500/15 border-purple-400/35 text-purple-200'
                          : 'bg-zinc-800 border-white/[0.08] text-zinc-400'
                      }`}
                    >
                      {badge}
                    </span>
                    <button
                      type="button"
                      onClick={() => persistEvents(events.filter((x) => x.id !== ev.id))}
                      className="text-zinc-500 hover:text-rose-300 text-xs cursor-pointer"
                      aria-label={`Remove ${ev.label}`}
                    >
                      ✕
                    </button>
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
