import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSyncedWorkspaceState } from '../../services/workspaceStateStore';
import { copyTextSafe } from '../../utils/clipboard';
import {
  AmbientSoundMode,
  getSharedAudioContext,
  playGentleChime,
  setAmbientSoundscapeVolume,
  startAmbientSoundscape,
  stopAmbientSoundscape,
} from '../../utils/focusAudio';
import {
  DEFAULT_HABITS_STATE,
  EverydayTabId,
  FocusState,
  getLocalDateIso,
  HabitsState,
} from './everydayTabsRegistry';
import type { HumanTask } from './taskTypes';

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

export const LIVE_POMODORO_STORAGE_KEY = 'soul-everyday-live-pomodoro-v1';
export const LIVE_STOPWATCH_STORAGE_KEY = 'soul-everyday-live-stopwatch-v1';
const FOCUS_SESSION_LOG_KEY = 'soul-everyday-focus-log-v1';
const AMBIENT_PREFS_KEY = 'soul-everyday-ambient-prefs-v1';

export type PomodoroMode = 'focus' | 'shortBreak' | 'longBreak';

export interface LivePomodoroState {
  mode: PomodoroMode;
  totalSec: number;
  remainingSec: number;
  running: boolean;
  targetEndMs: number | null;
  label: string;
  linkedTaskId: string;
  chimeEnabled: boolean;
  autoStopSound: boolean;
}

export interface StopwatchLap {
  id: string;
  index: number;
  splitMs: number;
  totalMs: number;
}

export interface LiveStopwatchState {
  running: boolean;
  startedAtMs: number | null;
  accumulatedMs: number;
  laps: StopwatchLap[];
}

interface FocusLogEntry {
  id: string;
  date: string;
  timeLabel: string;
  minutes: number;
  label: string;
  mode: PomodoroMode;
}

function pad2(n: number): string {
  return String(Math.floor(Math.max(0, n))).padStart(2, '0');
}

function formatStopwatch(ms: number): string {
  const safe = Math.max(0, ms);
  const mins = Math.floor(safe / 60000);
  const secs = Math.floor((safe % 60000) / 1000);
  const tenths = Math.floor((safe % 1000) / 100);
  return `${pad2(mins)}:${pad2(secs)}.${tenths}`;
}

function loadLivePomodoro(): LivePomodoroState {
  const fallback: LivePomodoroState = {
    mode: 'focus',
    totalSec: 25 * 60,
    remainingSec: 25 * 60,
    running: false,
    targetEndMs: null,
    label: 'Deep Focus Session',
    linkedTaskId: '',
    chimeEnabled: true,
    autoStopSound: false,
  };
  try {
    const raw = window.localStorage.getItem(LIVE_POMODORO_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LivePomodoroState>;
    const mode: PomodoroMode =
      parsed.mode === 'shortBreak' || parsed.mode === 'longBreak' ? parsed.mode : 'focus';
    const totalSec = typeof parsed.totalSec === 'number' && parsed.totalSec >= 60 ? parsed.totalSec : 1500;
    const targetEndMs = typeof parsed.targetEndMs === 'number' ? parsed.targetEndMs : null;
    const running = Boolean(parsed.running && targetEndMs && targetEndMs > Date.now());
    const remainingSec = running && targetEndMs
      ? Math.max(1, Math.ceil((targetEndMs - Date.now()) / 1000))
      : typeof parsed.remainingSec === 'number' && parsed.remainingSec >= 0
      ? parsed.remainingSec
      : totalSec;
    return {
      mode,
      totalSec,
      remainingSec,
      running,
      targetEndMs: running ? targetEndMs : null,
      label: typeof parsed.label === 'string' ? parsed.label : 'Deep Focus Session',
      linkedTaskId: typeof parsed.linkedTaskId === 'string' ? parsed.linkedTaskId : '',
      chimeEnabled: parsed.chimeEnabled !== false,
      autoStopSound: Boolean(parsed.autoStopSound),
    };
  } catch {
    return fallback;
  }
}

function loadLiveStopwatch(): LiveStopwatchState {
  const fallback: LiveStopwatchState = {
    running: false,
    startedAtMs: null,
    accumulatedMs: 0,
    laps: [],
  };
  try {
    const raw = window.localStorage.getItem(LIVE_STOPWATCH_STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<LiveStopwatchState>;
    const running = Boolean(parsed.running && typeof parsed.startedAtMs === 'number');
    return {
      running,
      startedAtMs: running && typeof parsed.startedAtMs === 'number' ? parsed.startedAtMs : null,
      accumulatedMs: typeof parsed.accumulatedMs === 'number' ? Math.max(0, parsed.accumulatedMs) : 0,
      laps: Array.isArray(parsed.laps) ? parsed.laps : [],
    };
  } catch {
    return fallback;
  }
}

function dispatchTimerSync(): void {
  window.dispatchEvent(new Event('soul-everyday-timer-sync'));
}

// ── Guided Calm Breathing Card ──

type BreathPatternId = 'box' | '478' | 'coherent' | 'calm426';

interface BreathPatternMeta {
  id: BreathPatternId;
  shortLabel: string;
  spec: string;
  durations: [number, number, number, number]; // Inhale, Hold1, Exhale, Hold2
}

const BREATH_PATTERNS: BreathPatternMeta[] = [
  { id: 'box', shortLabel: 'Box 4-4-4-4', spec: 'Inhale 4s · Hold 4s · Exhale 4s · Hold 4s', durations: [4, 4, 4, 4] },
  { id: '478', shortLabel: '4-7-8', spec: 'Inhale 4s · Hold 7s · Exhale 8s', durations: [4, 7, 8, 0] },
  { id: 'coherent', shortLabel: 'Coherent 5-5', spec: 'Inhale 5s · Exhale 5s', durations: [5, 0, 5, 0] },
  { id: 'calm426', shortLabel: '4-2-6', spec: 'Inhale 4s · Hold 2s · Exhale 6s', durations: [4, 2, 6, 0] },
];

export const GuidedBreathingCard: React.FC = () => {
  const [active, setActive] = useState<boolean>(false);
  const [patternId, setPatternId] = useState<BreathPatternId>('box');
  const [sessionMin, setSessionMin] = useState<number>(1); // 0 = continuous
  const [phaseCueSound, setPhaseCueSound] = useState<boolean>(false);
  const [elapsedMs, setElapsedMs] = useState<number>(0);
  const [completedMsg, setCompletedMsg] = useState<string | null>(null);

  const startedAtRef = useRef<number | null>(null);
  const lastPhaseIndexRef = useRef<number>(-1);
  const finishedOnceRef = useRef<boolean>(false);

  const patternMeta = useMemo(
    () => BREATH_PATTERNS.find((p) => p.id === patternId) || BREATH_PATTERNS[0],
    [patternId]
  );

  const targetSessionMs = sessionMin > 0 ? sessionMin * 60 * 1000 : 0;

  useEffect(() => {
    if (!active) {
      startedAtRef.current = null;
      lastPhaseIndexRef.current = -1;
      return;
    }
    finishedOnceRef.current = false;
    startedAtRef.current = Date.now() - elapsedMs;
    const id = window.setInterval(() => {
      if (!startedAtRef.current) return;
      setElapsedMs(Date.now() - startedAtRef.current);
    }, 100);
    return () => window.clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Auto-stop accurately when timed breather reaches target duration (e.g., 1-Min Breather stops at 60s)
  useEffect(() => {
    if (!active || targetSessionMs <= 0) return;
    if (elapsedMs >= targetSessionMs && !finishedOnceRef.current) {
      finishedOnceRef.current = true;
      setActive(false);
      setElapsedMs(0);
      playGentleChime('break');
      setCompletedMsg(`${sessionMin}-min calmer breathing complete`);
      window.setTimeout(() => setCompletedMsg(null), 4000);
    }
  }, [active, elapsedMs, targetSessionMs, sessionMin]);

  const phaseInfo = useMemo(() => {
    const [inS, h1S, outS, h2S] = patternMeta.durations;
    const cycleSec = inS + h1S + outS + h2S;
    const elapsedSec = elapsedMs / 1000;
    const pos = elapsedSec % cycleSec;
    const cycleCount = Math.floor(elapsedSec / cycleSec) + 1;

    if (pos < inS) {
      const progress = pos / inS;
      return {
        phaseIdx: 0,
        label: 'Breathe In',
        secLeft: Math.max(1, Math.ceil(inS - pos)),
        progress,
        scaleNum: 0.88 + progress * 0.24,
        ringColor: '#34d399',
        textClass: 'text-emerald-300',
        cycleCount,
      };
    }
    if (pos < inS + h1S) {
      const phasePos = pos - inS;
      const progress = h1S > 0 ? phasePos / h1S : 1;
      return {
        phaseIdx: 1,
        label: 'Hold',
        secLeft: Math.max(1, Math.ceil(inS + h1S - pos)),
        progress,
        scaleNum: 1.12,
        ringColor: '#38bdf8',
        textClass: 'text-sky-300',
        cycleCount,
      };
    }
    if (pos < inS + h1S + outS) {
      const phasePos = pos - (inS + h1S);
      const progress = outS > 0 ? phasePos / outS : 1;
      return {
        phaseIdx: 2,
        label: 'Breathe Out',
        secLeft: Math.max(1, Math.ceil(inS + h1S + outS - pos)),
        progress,
        scaleNum: 1.12 - progress * 0.24,
        ringColor: '#a78bfa',
        textClass: 'text-violet-300',
        cycleCount,
      };
    }
    const phasePos = pos - (inS + h1S + outS);
    const progress = h2S > 0 ? phasePos / h2S : 1;
    return {
      phaseIdx: 3,
      label: 'Hold Empty',
      secLeft: Math.max(1, Math.ceil(cycleSec - pos)),
      progress,
      scaleNum: 0.88,
      ringColor: '#94a3b8',
      textClass: 'text-zinc-300',
      cycleCount,
    };
  }, [elapsedMs, patternMeta]);

  useEffect(() => {
    if (!active || !phaseCueSound) return;
    if (lastPhaseIndexRef.current !== -1 && lastPhaseIndexRef.current !== phaseInfo.phaseIdx) {
      playGentleChime('tick');
    }
    lastPhaseIndexRef.current = phaseInfo.phaseIdx;
  }, [active, phaseCueSound, phaseInfo.phaseIdx]);

  const remainingSessionSec =
    targetSessionMs > 0 ? Math.max(0, Math.ceil((targetSessionMs - elapsedMs) / 1000)) : 0;

  const ringRadius = 60;
  const ringCirc = 2 * Math.PI * ringRadius;
  const ringDashOffset = active ? ringCirc * (1 - phaseInfo.progress) : ringCirc;

  return (
    <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col justify-between items-center gap-3.5">
      <div className="w-full flex flex-wrap items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-white">Guided Calm Breathing</h2>
          <p className="text-xs text-zinc-400">Reset focus &amp; lower stress.</p>
        </div>

        <label className="inline-flex items-center gap-1.5 text-[11px] text-zinc-400 cursor-pointer">
          <input
            type="checkbox"
            checked={phaseCueSound}
            onChange={(e) => {
              getSharedAudioContext();
              setPhaseCueSound(e.target.checked);
            }}
            className="accent-sky-400"
          />
          Phase cue
        </label>
      </div>

      {/* Pattern selector pills */}
      <div className="w-full flex flex-wrap items-center justify-between gap-1.5 text-[11px] font-mono">
        <div className="flex flex-wrap items-center gap-1">
          {BREATH_PATTERNS.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => {
                setPatternId(p.id);
                setElapsedMs(0);
                if (active) startedAtRef.current = Date.now();
              }}
              className={`px-2 py-1 rounded-lg border cursor-pointer transition-colors ${
                patternId === p.id
                  ? 'bg-sky-500/20 border-sky-400/45 text-sky-200 font-bold'
                  : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              {p.shortLabel}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {[1, 2, 3, 5, 0].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => {
                setSessionMin(m);
                if (active) {
                  setElapsedMs(0);
                  startedAtRef.current = Date.now();
                }
              }}
              title={m === 0 ? 'Continuous loop until stopped' : `Stop automatically after ${m} min`}
              className={`px-1.5 py-0.5 rounded border text-[10px] cursor-pointer ${
                sessionMin === m
                  ? 'bg-emerald-500/20 border-emerald-400/40 text-emerald-200 font-bold'
                  : 'bg-[#16171e] border-white/[0.08] text-zinc-400 hover:text-white'
              }`}
            >
              {m === 0 ? '∞' : `${m}m`}
            </button>
          ))}
        </div>
      </div>

      {/* Smooth SVG Breathing Visualizer */}
      <div className="relative flex items-center justify-center my-1 w-40 h-40">
        <div
          className="relative w-36 h-36 rounded-full bg-[#0d1018] border border-white/[0.09] flex flex-col items-center justify-center transition-transform duration-150 ease-linear shadow-inner"
          style={{
            transform: `scale(${active ? phaseInfo.scaleNum.toFixed(3) : 1})`,
          }}
        >
          <svg
            className="absolute inset-0 w-full h-full -rotate-90 pointer-events-none"
            viewBox="0 0 136 136"
            aria-hidden="true"
          >
            <circle
              cx="68"
              cy="68"
              r={ringRadius}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="4"
            />
            <circle
              cx="68"
              cy="68"
              r={ringRadius}
              fill="none"
              stroke={active ? phaseInfo.ringColor : '#475569'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={ringCirc}
              strokeDashoffset={ringDashOffset}
            />
          </svg>

          <span className={`text-xs font-bold ${active ? phaseInfo.textClass : 'text-zinc-300'}`}>
            {active ? phaseInfo.label : 'Ready'}
          </span>
          <span className="text-2xl font-mono font-extrabold text-white tabular-nums mt-0.5">
            {active ? `${phaseInfo.secLeft}s` : '—'}
          </span>
          <span className="text-[10px] font-mono text-zinc-400 tabular-nums mt-0.5">
            {active
              ? sessionMin > 0
                ? `${pad2(Math.floor(remainingSessionSec / 60))}:${pad2(remainingSessionSec % 60)} left`
                : `Cycle #${phaseInfo.cycleCount}`
              : patternMeta.shortLabel}
          </span>
        </div>
      </div>

      <div className="text-[11px] font-mono text-zinc-400 text-center min-h-[16px]">
        {completedMsg ? (
          <span className="text-emerald-300 font-semibold">✓ {completedMsg}</span>
        ) : (
          <span>{patternMeta.spec}</span>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          getSharedAudioContext();
          setCompletedMsg(null);
          if (active) {
            setActive(false);
            setElapsedMs(0);
          } else {
            setElapsedMs(0);
            setActive(true);
          }
        }}
        className={`w-full py-2.5 rounded-xl text-xs font-extrabold border transition-colors cursor-pointer ${
          active
            ? 'bg-rose-500/20 border-rose-400/45 text-rose-100 hover:bg-rose-500/30'
            : 'bg-sky-500/20 border-sky-400/45 text-sky-100 hover:bg-sky-500/30'
        }`}
      >
        {active
          ? '⏹ Stop Breathing Session'
          : sessionMin === 0
          ? '▶ Start Guided Breathing'
          : `▶ Start ${sessionMin}-Min Breather`}
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
  const [tasks, setTasks] = useSyncedWorkspaceState<HumanTask[]>('tasks', []);

  const [pomo, setPomo] = useState<LivePomodoroState>(loadLivePomodoro);
  const [secondsLeft, setSecondsLeft] = useState<number>(() => {
    const init = loadLivePomodoro();
    return init.running && init.targetEndMs
      ? Math.max(0, Math.ceil((init.targetEndMs - Date.now()) / 1000))
      : init.remainingSec;
  });
  const [customMinInput, setCustomMinInput] = useState<string>('25');
  const [completionBanner, setCompletionBanner] = useState<string | null>(null);
  const completedStampRef = useRef<number | null>(null);

  const [sessionLog, setSessionLog] = useState<FocusLogEntry[]>(() => {
    try {
      const raw = window.localStorage.getItem(FOCUS_SESSION_LOG_KEY);
      const list = raw ? (JSON.parse(raw) as FocusLogEntry[]) : [];
      return Array.isArray(list) ? list.filter((x) => x.date === getLocalDateIso(0)) : [];
    } catch {
      return [];
    }
  });

  const [sw, setSw] = useState<LiveStopwatchState>(loadLiveStopwatch);
  const [swDisplayMs, setSwDisplayMs] = useState<number>(() => {
    const init = loadLiveStopwatch();
    return init.running && init.startedAtMs
      ? init.accumulatedMs + Math.max(0, Date.now() - init.startedAtMs)
      : init.accumulatedMs;
  });
  const [copiedLaps, setCopiedLaps] = useState<boolean>(false);

  // Persist live Pomodoro state + broadcast sync event
  useEffect(() => {
    try {
      window.localStorage.setItem(LIVE_POMODORO_STORAGE_KEY, JSON.stringify(pomo));
    } catch {
      // ignore quota errors
    }
    dispatchTimerSync();
  }, [pomo]);

  // Persist live Stopwatch state + broadcast sync event
  useEffect(() => {
    try {
      window.localStorage.setItem(LIVE_STOPWATCH_STORAGE_KEY, JSON.stringify(sw));
    } catch {
      // ignore quota errors
    }
    dispatchTimerSync();
  }, [sw]);

  // Drift-free Pomodoro countdown using wall-clock targetEndMs
  useEffect(() => {
    if (!pomo.running || !pomo.targetEndMs) {
      setSecondsLeft(pomo.remainingSec);
      return;
    }
    const tick = () => {
      const rem = Math.max(0, Math.ceil((pomo.targetEndMs! - Date.now()) / 1000));
      setSecondsLeft(rem);
    };
    tick();
    const id = window.setInterval(tick, 250);
    return () => window.clearInterval(id);
  }, [pomo.running, pomo.targetEndMs, pomo.remainingSec]);

  // Idempotent Pomodoro completion handler (StrictMode-safe: never runs inside a setState callback)
  useEffect(() => {
    if (!pomo.running || !pomo.targetEndMs || secondsLeft > 0) return;
    if (completedStampRef.current === pomo.targetEndMs) return;
    completedStampRef.current = pomo.targetEndMs;

    const doneMins = Math.max(1, Math.round(pomo.totalSec / 60));
    if (pomo.chimeEnabled) {
      playGentleChime(pomo.mode === 'focus' ? 'complete' : 'break');
    }
    if (pomo.autoStopSound) {
      stopAmbientSoundscape();
      window.dispatchEvent(new CustomEvent('soul-everyday-ambient-stop'));
    }

    const currentDate = getLocalDateIso(0);
    if (pomo.mode === 'focus') {
      setFocusStats((f) => ({
        lastDate: currentDate,
        sessionsToday: f.lastDate === currentDate ? f.sessionsToday + 1 : 1,
        minutesToday: (f.lastDate === currentDate ? f.minutesToday : 0) + doneMins,
      }));
      if (pomo.linkedTaskId) {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === pomo.linkedTaskId ? { ...t, spentMin: (t.spentMin || 0) + doneMins } : t
          )
        );
      }
    }

    const timeLabel = new Date().toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const entry: FocusLogEntry = {
      id: `fl-${Date.now()}`,
      date: currentDate,
      timeLabel,
      minutes: doneMins,
      label: pomo.label.trim() || (pomo.mode === 'focus' ? 'Focus Session' : 'Break'),
      mode: pomo.mode,
    };
    setSessionLog((prev) => {
      const next = [entry, ...prev.filter((x) => x.date === currentDate)].slice(0, 12);
      try {
        window.localStorage.setItem(FOCUS_SESSION_LOG_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });

    setCompletionBanner(
      pomo.mode === 'focus'
        ? `✓ ${doneMins}m Focus complete! Ready for a quick break.`
        : `✓ ${doneMins}m Break finished — back to focus!`
    );
    setPomo((prev) => ({
      ...prev,
      running: false,
      targetEndMs: null,
      remainingSec: prev.totalSec,
    }));
  }, [pomo, secondsLeft, setFocusStats, setTasks]);

  // Drift-free Stopwatch ticker using wall-clock delta
  useEffect(() => {
    if (!sw.running || !sw.startedAtMs) {
      setSwDisplayMs(sw.accumulatedMs);
      return;
    }
    const tick = () => {
      setSwDisplayMs(sw.accumulatedMs + Math.max(0, Date.now() - sw.startedAtMs!));
    };
    tick();
    const id = window.setInterval(tick, 50);
    return () => window.clearInterval(id);
  }, [sw.running, sw.startedAtMs, sw.accumulatedMs]);

  const applyModeOrPreset = (mode: PomodoroMode, mins: number, labelHint?: string) => {
    const clampedMins = Math.max(1, Math.min(180, Math.round(mins)));
    const sec = clampedMins * 60;
    setCompletionBanner(null);
    setCustomMinInput(String(clampedMins));
    setPomo((prev) => ({
      ...prev,
      mode,
      totalSec: sec,
      remainingSec: sec,
      running: false,
      targetEndMs: null,
      label: labelHint ?? prev.label,
    }));
  };

  const togglePomodoro = () => {
    getSharedAudioContext();
    setCompletionBanner(null);
    setPomo((prev) => {
      if (prev.running && prev.targetEndMs) {
        const rem = Math.max(1, Math.ceil((prev.targetEndMs - Date.now()) / 1000));
        return { ...prev, running: false, targetEndMs: null, remainingSec: rem };
      }
      const startFrom = prev.remainingSec > 0 ? prev.remainingSec : prev.totalSec;
      return {
        ...prev,
        running: true,
        remainingSec: startFrom,
        targetEndMs: Date.now() + startFrom * 1000,
      };
    });
  };

  const resetPomodoro = () => {
    setCompletionBanner(null);
    setPomo((prev) => ({
      ...prev,
      running: false,
      targetEndMs: null,
      remainingSec: prev.totalSec,
    }));
  };

  const adjustPomodoroMinutes = (deltaMins: number) => {
    const deltaSec = deltaMins * 60;
    setPomo((prev) => {
      if (prev.running && prev.targetEndMs) {
        const curRem = Math.max(1, Math.ceil((prev.targetEndMs - Date.now()) / 1000));
        const nextRem = Math.max(60, Math.min(180 * 60, curRem + deltaSec));
        return {
          ...prev,
          totalSec: Math.max(prev.totalSec, nextRem),
          remainingSec: nextRem,
          targetEndMs: Date.now() + nextRem * 1000,
        };
      }
      const nextRem = Math.max(60, Math.min(180 * 60, prev.remainingSec + deltaSec));
      return { ...prev, totalSec: nextRem, remainingSec: nextRem };
    });
  };

  const toggleStopwatch = () => {
    setSw((prev) => {
      if (prev.running && prev.startedAtMs) {
        const elapsed = prev.accumulatedMs + Math.max(0, Date.now() - prev.startedAtMs);
        return { ...prev, running: false, startedAtMs: null, accumulatedMs: elapsed };
      }
      return { ...prev, running: true, startedAtMs: Date.now() };
    });
  };

  const recordStopwatchLap = () => {
    if (!sw.running || !sw.startedAtMs) return;
    const totalMs = sw.accumulatedMs + Math.max(0, Date.now() - sw.startedAtMs);
    setSw((prev) => {
      const prevTotal = prev.laps.length > 0 ? prev.laps[0].totalMs : 0;
      const splitMs = Math.max(0, totalMs - prevTotal);
      const lap: StopwatchLap = {
        id: `lap-${Date.now()}-${prev.laps.length + 1}`,
        index: prev.laps.length + 1,
        splitMs,
        totalMs,
      };
      return { ...prev, laps: [lap, ...prev.laps] };
    });
  };

  const openTasks = useMemo(
    () => (Array.isArray(tasks) ? tasks.filter((t) => !t.archived && !t.done) : []),
    [tasks]
  );

  const linkedTask = useMemo(
    () => openTasks.find((t) => t.id === pomo.linkedTaskId) || null,
    [openTasks, pomo.linkedTaskId]
  );

  const lapExtremes = useMemo(() => {
    if (sw.laps.length < 2) return { fastestId: '', slowestId: '' };
    let fast = sw.laps[0];
    let slow = sw.laps[0];
    sw.laps.forEach((l) => {
      if (l.splitMs < fast.splitMs) fast = l;
      if (l.splitMs > slow.splitMs) slow = l;
    });
    return { fastestId: fast.id, slowestId: slow.id };
  }, [sw.laps]);

  const todaySessions = focusStats.lastDate === today ? focusStats.sessionsToday : 0;
  const todayFocusMins = focusStats.lastDate === today ? focusStats.minutesToday : 0;
  const pct = Math.max(
    0,
    Math.min(100, Math.round(((pomo.totalSec - secondsLeft) / (pomo.totalSec || 1)) * 100))
  );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Pomodoro Focus Timer */}
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3.5">
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => playGentleChime('complete')}
                title="Test completion chime"
                className="px-2 py-1 rounded-lg bg-[#16171e] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
              >
                🔔 Test
              </button>
              <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={pomo.chimeEnabled}
                  onChange={(e) => setPomo((p) => ({ ...p, chimeEnabled: e.target.checked }))}
                  className="accent-amber-400"
                />
                Chime
              </label>
            </div>
          </div>

          {/* Phase Selector: Focus / Short Break / Long Break */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#08090c] border border-white/[0.08] text-[11px] font-mono">
            {(
              [
                { id: 'focus', label: 'Focus (25m)', mins: 25, hint: 'Deep Focus Session' },
                { id: 'shortBreak', label: 'Break (5m)', mins: 5, hint: 'Short Recharge Break' },
                { id: 'longBreak', label: 'Long (15m)', mins: 15, hint: 'Long Recovery Break' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => applyModeOrPreset(m.id, m.mins, m.hint)}
                className={`py-1.5 rounded-lg transition-colors cursor-pointer ${
                  pomo.mode === m.id
                    ? m.id === 'focus'
                      ? 'bg-amber-500/20 text-amber-200 font-bold'
                      : 'bg-emerald-500/20 text-emerald-200 font-bold'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          {/* Session label + Linked Task */}
          <div className="flex flex-col gap-2">
            <input
              type="text"
              value={pomo.label}
              onChange={(e) => setPomo((p) => ({ ...p, label: e.target.value }))}
              placeholder="Session intention (e.g., Reading, Deep Coding, Study)..."
              aria-label="Focus session label"
              className="h-9 px-3 rounded-xl bg-[#08090c] border border-white/[0.1] text-xs text-white focus:outline-none focus:border-amber-400/50"
            />
            <div className="flex items-center gap-1.5">
              <select
                value={pomo.linkedTaskId}
                onChange={(e) => {
                  const id = e.target.value;
                  const picked = openTasks.find((t) => t.id === id);
                  setPomo((p) => ({
                    ...p,
                    linkedTaskId: id,
                    label: picked ? picked.title : p.label,
                  }));
                }}
                aria-label="Link task to focus timer"
                className="flex-1 min-w-0 h-8 px-2.5 rounded-lg bg-[#08090c] border border-white/[0.09] text-[11px] text-zinc-200"
              >
                <option value="">Link an open task (optional)...</option>
                {openTasks.slice(0, 25).map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.title} ({t.spentMin || 0}m)
                  </option>
                ))}
              </select>
              {linkedTask && (
                <button
                  type="button"
                  onClick={() => {
                    setTasks((prev) =>
                      prev.map((t) =>
                        t.id === linkedTask.id ? { ...t, done: true, status: 'done' } : t
                      )
                    );
                    setPomo((p) => ({ ...p, linkedTaskId: '' }));
                  }}
                  title="Mark linked task complete"
                  className="h-8 px-2.5 rounded-lg bg-emerald-500/20 border border-emerald-400/40 text-[11px] font-bold text-emerald-200 hover:bg-emerald-500/30 cursor-pointer shrink-0"
                >
                  ✓ Done
                </button>
              )}
            </div>
          </div>

          <div className="flex flex-col items-center justify-center py-4 rounded-2xl bg-[#08090c] border border-white/[0.08] gap-2.5">
            <div className="text-5xl font-extrabold font-mono tracking-wider text-white tabular-nums">
              {pad2(Math.floor(secondsLeft / 60))}:{pad2(secondsLeft % 60)}
            </div>
            <div className="w-4/5 h-2 rounded-full bg-white/[0.06] overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ${
                  pomo.mode === 'focus'
                    ? 'bg-gradient-to-r from-amber-400 to-emerald-400'
                    : 'bg-gradient-to-r from-sky-400 to-emerald-400'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>

            {completionBanner && (
              <div className="px-3 py-1 rounded-lg bg-emerald-500/15 border border-emerald-400/35 text-[11px] font-mono text-emerald-200">
                {completionBanner}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={togglePomodoro}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border ${
                  pomo.running
                    ? 'bg-rose-500/20 border-rose-400/45 text-rose-100 hover:bg-rose-500/30'
                    : 'bg-amber-400/90 border-amber-300 text-zinc-950 hover:bg-amber-300'
                }`}
              >
                {pomo.running ? '⏸ Pause' : secondsLeft < pomo.totalSec ? '▶ Resume' : '▶ Start Focus'}
              </button>
              <button
                type="button"
                onClick={resetPomodoro}
                className="px-3 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-300 hover:text-white cursor-pointer"
              >
                ↺ Reset
              </button>
              <button
                type="button"
                onClick={() => adjustPomodoroMinutes(1)}
                title="Add 1 minute"
                className="px-2.5 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-mono text-sky-300 hover:text-white cursor-pointer"
              >
                +1m
              </button>
              <button
                type="button"
                onClick={() => onSelectTab('tasks')}
                className="px-3 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25 cursor-pointer"
              >
                Tasks →
              </button>
            </div>
          </div>

          {/* Presets + Custom Minutes */}
          <div className="flex flex-wrap items-center justify-between gap-1.5">
            <div className="flex flex-wrap gap-1.5">
              {[
                { mins: 5, label: '5m', mode: 'shortBreak' as PomodoroMode },
                { mins: 15, label: '15m', mode: 'focus' as PomodoroMode },
                { mins: 25, label: '25m', mode: 'focus' as PomodoroMode },
                { mins: 45, label: '45m', mode: 'focus' as PomodoroMode },
                { mins: 60, label: '60m', mode: 'focus' as PomodoroMode },
              ].map((p) => (
                <button
                  key={p.mins}
                  type="button"
                  onClick={() => applyModeOrPreset(p.mode, p.mins)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer ${
                    pomo.totalSec === p.mins * 60
                      ? 'bg-amber-500/20 border-amber-400/45 text-amber-200 font-bold'
                      : 'bg-[#16171e] border-white/[0.08] text-zinc-300 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const val = parseInt(customMinInput, 10);
                if (val > 0) applyModeOrPreset('focus', val);
              }}
              className="flex items-center gap-1"
            >
              <input
                type="number"
                min={1}
                max={180}
                value={customMinInput}
                onChange={(e) => setCustomMinInput(e.target.value)}
                aria-label="Custom focus minutes"
                className="w-12 h-7 px-1.5 rounded-lg bg-[#08090c] border border-white/[0.1] text-[11px] font-mono text-white text-center"
              />
              <button
                type="submit"
                className="h-7 px-2 rounded-lg bg-[#16171e] border border-white/[0.1] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
              >
                Set m
              </button>
            </form>
          </div>

          {sessionLog.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06] flex flex-col gap-1 max-h-24 overflow-y-auto custom-scrollbar">
              {sessionLog.slice(0, 4).map((s) => (
                <div key={s.id} className="flex items-center justify-between text-[11px] font-mono text-zinc-400">
                  <span className="truncate">
                    ✓ {s.label} ({s.minutes}m)
                  </span>
                  <span className="shrink-0 text-zinc-500">{s.timeLabel}</span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Precision Stopwatch & Split Laps */}
        <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col justify-between gap-4">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-base font-bold text-white">Stopwatch &amp; Lap Recorder</h2>
              <p className="text-xs text-zinc-400">
                Drift-free precision timer with split deltas &amp; tab persistence.
              </p>
            </div>
            {sw.laps.length > 0 && (
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => {
                    const text = [...sw.laps]
                      .reverse()
                      .map((l) => `Lap #${l.index}\tSplit +${formatStopwatch(l.splitMs)}\tTotal ${formatStopwatch(l.totalMs)}`)
                      .join('\n');
                    void copyTextSafe(text).then((ok) => {
                      if (ok) {
                        setCopiedLaps(true);
                        window.setTimeout(() => setCopiedLaps(false), 1600);
                      }
                    });
                  }}
                  className="px-2 py-1 rounded-lg bg-[#16171e] border border-white/[0.09] text-[11px] font-mono text-sky-300 cursor-pointer"
                >
                  {copiedLaps ? '✓ Copied' : 'Copy Laps'}
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-col items-center justify-center py-6 rounded-2xl bg-[#08090c] border border-white/[0.08] gap-3">
            <div className="text-5xl font-extrabold font-mono tracking-wider text-sky-300 tabular-nums">
              {formatStopwatch(swDisplayMs)}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2">
              <button
                type="button"
                onClick={toggleStopwatch}
                className={`px-4 py-2 rounded-xl text-xs font-extrabold cursor-pointer border ${
                  sw.running
                    ? 'bg-rose-500/20 border-rose-400/45 text-rose-100 hover:bg-rose-500/30'
                    : 'bg-sky-500/25 border-sky-400/45 text-white hover:bg-sky-500/35'
                }`}
              >
                {sw.running ? '⏸ Pause' : swDisplayMs > 0 ? '▶ Resume' : '▶ Start'}
              </button>
              <button
                type="button"
                onClick={recordStopwatchLap}
                disabled={!sw.running}
                title={sw.running ? 'Record lap split' : 'Start stopwatch to record a lap'}
                className="px-3.5 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-200 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white cursor-pointer"
              >
                🏁 Lap
              </button>
              <button
                type="button"
                onClick={() => setSw({ running: false, startedAtMs: null, accumulatedMs: 0, laps: [] })}
                disabled={!sw.running && swDisplayMs === 0 && sw.laps.length === 0}
                className="px-3.5 py-2 rounded-xl bg-[#16171e] border border-white/[0.1] text-xs font-semibold text-zinc-300 disabled:opacity-40 disabled:cursor-not-allowed hover:text-white cursor-pointer"
              >
                Reset
              </button>
            </div>
          </div>

          <div className="flex-1 flex flex-col gap-1.5 min-h-[92px]">
            {sw.laps.length === 0 ? (
              <div className="flex-1 flex items-center justify-center rounded-xl bg-[#0b0c11] border border-white/[0.05] text-[11px] font-mono text-zinc-500 p-4 text-center">
                Press Start, then click Lap to capture split intervals.
              </div>
            ) : (
              <div className="max-h-44 overflow-y-auto flex flex-col gap-1.5 pr-1 custom-scrollbar">
                {sw.laps.map((lap) => {
                  const isFastest = lap.id === lapExtremes.fastestId;
                  const isSlowest = lap.id === lapExtremes.slowestId;
                  return (
                    <div
                      key={lap.id}
                      className="grid grid-cols-[auto_1fr_auto] items-center gap-3 px-3 py-1.5 rounded-xl bg-[#16171e] border border-white/[0.06] text-xs font-mono"
                    >
                      <span className="text-zinc-400">Lap #{lap.index}</span>
                      <span
                        className={`text-right ${
                          isFastest
                            ? 'text-emerald-300 font-bold'
                            : isSlowest
                            ? 'text-amber-300'
                            : 'text-sky-300'
                        }`}
                      >
                        +{formatStopwatch(lap.splitMs)}
                        {isFastest ? ' ★' : ''}
                      </span>
                      <span className="text-white font-bold tabular-nums">{formatStopwatch(lap.totalMs)}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* Guided Breathing side-by-side on Desktop */}
        <GuidedBreathingCard />
      </div>

      {/* Offline Web Audio Ambient Focus Soundscapes */}
      <AmbientFocusSoundscapeCard
        autoStopWithTimer={pomo.autoStopSound}
        onToggleAutoStop={(next) => setPomo((p) => ({ ...p, autoStopSound: next }))}
      />
    </div>
  );
};

const AmbientFocusSoundscapeCard: React.FC<{
  autoStopWithTimer: boolean;
  onToggleAutoStop: (next: boolean) => void;
}> = ({ autoStopWithTimer, onToggleAutoStop }) => {
  const [soundMode, setSoundMode] = useState<AmbientSoundMode>(() => {
    try {
      const raw = window.localStorage.getItem(AMBIENT_PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { mode?: AmbientSoundMode };
        if (p.mode) return p.mode;
      }
    } catch {
      // ignore
    }
    return 'off';
  });
  const [volume, setVolume] = useState<number>(() => {
    try {
      const raw = window.localStorage.getItem(AMBIENT_PREFS_KEY);
      if (raw) {
        const p = JSON.parse(raw) as { volume?: number };
        if (typeof p.volume === 'number') return p.volume;
      }
    } catch {
      // ignore
    }
    return 0.35;
  });
  const [audioStatus, setAudioStatus] = useState<'idle' | 'playing' | 'suspended' | 'unsupported'>('idle');

  useEffect(() => {
    try {
      window.localStorage.setItem(AMBIENT_PREFS_KEY, JSON.stringify({ mode: soundMode, volume }));
    } catch {
      // ignore
    }
  }, [soundMode, volume]);

  // Listen if focus timer auto-stop asks ambient sound to stop
  useEffect(() => {
    const onAutoStop = () => {
      stopAmbientSoundscape();
      setSoundMode('off');
      setAudioStatus('idle');
    };
    window.addEventListener('soul-everyday-ambient-stop', onAutoStop);
    return () => window.removeEventListener('soul-everyday-ambient-stop', onAutoStop);
  }, []);

  const handleSelectMode = async (mode: AmbientSoundMode) => {
    setSoundMode(mode);
    if (mode === 'off') {
      stopAmbientSoundscape();
      setAudioStatus('idle');
      return;
    }
    const status = await startAmbientSoundscape(mode, volume);
    setAudioStatus(status === 'off' ? 'idle' : status);
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    setAmbientSoundscapeVolume(nextVol);
  };

  return (
    <section className="rounded-2xl bg-[#111218] border border-white/[0.08] p-5 flex flex-col gap-3.5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex flex-col gap-0.5">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-base font-bold text-white">Offline Ambient Focus Soundscapes</h2>
            {audioStatus === 'playing' && soundMode !== 'off' && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-400/35 text-[10px] font-mono font-bold text-emerald-300">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Playing Audio</span>
              </span>
            )}
            {audioStatus === 'suspended' && soundMode !== 'off' && (
              <button
                type="button"
                onClick={() => void handleSelectMode(soundMode)}
                className="px-2.5 py-0.5 rounded-full bg-amber-500/20 border border-amber-400/45 text-[10px] font-mono font-bold text-amber-200 cursor-pointer"
              >
                Click to Unlock Audio Output
              </button>
            )}
          </div>
          <p className="text-xs text-zinc-400">
            Synthesized locally via Web Audio API — keeps playing while you switch tabs.
          </p>
        </div>

        <label className="inline-flex items-center gap-1.5 text-xs text-zinc-300 cursor-pointer shrink-0">
          <input
            type="checkbox"
            checked={autoStopWithTimer}
            onChange={(e) => onToggleAutoStop(e.target.checked)}
            className="accent-emerald-400"
          />
          Auto-stop when timer finishes
        </label>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {(
          [
            { id: 'off', label: '🔇 Off' },
            { id: 'rain', label: '🌧️ Gentle Rain' },
            { id: 'brown', label: '🌊 Deep Brown Noise' },
            { id: 'pink', label: '🌫️ Warm Pink Noise' },
            { id: 'gamma40', label: '🧠 40Hz Binaural (🎧)' },
            { id: 'alpha10', label: '✨ 10Hz Alpha Calm (🎧)' },
          ] as const
        ).map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => void handleSelectMode(m.id)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border cursor-pointer transition-colors ${
              soundMode === m.id
                ? m.id === 'off'
                  ? 'bg-zinc-800 border-white/25 text-white font-bold'
                  : 'bg-emerald-500/20 border-emerald-400/45 text-emerald-200 font-bold'
                : 'bg-[#16171e] border-white/[0.08] text-zinc-300 hover:text-white'
            }`}
          >
            {m.label}
          </button>
        ))}

        <label className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#08090c] border border-white/[0.08] text-xs font-mono text-zinc-300 ml-auto">
          <span>Vol {Math.round(volume * 100)}%</span>
          <input
            type="range"
            min={0.05}
            max={1}
            step={0.05}
            value={volume}
            onChange={(e) => handleVolumeChange(Number(e.target.value))}
            aria-label="Ambient sound volume"
            className="w-24 accent-emerald-400 cursor-pointer"
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
      const daysInPrevMonth = new Date(now.getFullYear(), now.getMonth(), 0).getDate();
      d += daysInPrevMonth;
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
