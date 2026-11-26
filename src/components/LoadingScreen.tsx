import React, { useState, useEffect } from 'react';
import { SoulLogoIcon } from './SoulLogo';

export interface LoadingScreenProps {
  onComplete?: () => void;
  minDurationMs?: number;
  appName?: string;
}

interface BootStep {
  id: string;
  label: string;
  subLabel: string;
  icon: string;
  threshold: number;
}

const BOOT_STEPS: BootStep[] = [
  {
    id: 'engine',
    label: 'Starting Workspace Engine',
    subLabel: 'Initializing local portal services & navigation',
    icon: '⚡',
    threshold: 20,
  },
  {
    id: 'packages',
    label: 'Loading Shared Packages',
    subLabel: 'Indexing internal modules & utilities',
    icon: '📦',
    threshold: 45,
  },
  {
    id: 'projects',
    label: 'Discovering Workspace Apps',
    subLabel: 'Syncing project registry & health probes',
    icon: '🛰️',
    threshold: 75,
  },
  {
    id: 'docs',
    label: 'Loading Guides & Specs',
    subLabel: 'Preparing interactive portal views',
    icon: '📜',
    threshold: 95,
  },
  {
    id: 'ready',
    label: 'Workspace Portal Ready',
    subLabel: 'Launching Soul DevPortal',
    icon: '✨',
    threshold: 100,
  },
];

export const LoadingScreen: React.FC<LoadingScreenProps> = ({
  onComplete,
  minDurationMs = 750,
  appName = 'Soul DevPortal',
}) => {
  const [progress, setProgress] = useState<number>(12);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    const startTime = Date.now();
    const intervalMs = 25;
    const totalSteps = minDurationMs / intervalMs;
    let stepCount = 0;

    const timer = setInterval(() => {
      stepCount++;
      const elapsed = Date.now() - startTime;
      const linearPct = (elapsed / minDurationMs) * 100;
      // Smooth ease-out curve
      const easedProgress = Math.min(100, Math.round(100 * (1 - Math.pow(1 - linearPct / 100, 2))));

      setProgress((prev) => Math.max(prev, easedProgress));

      if (elapsed >= minDurationMs) {
        setProgress(100);
        clearInterval(timer);
        setTimeout(() => {
          setIsFadingOut(true);
          setTimeout(() => {
            if (onComplete) onComplete();
          }, 350);
        }, 150);
      }
    }, intervalMs);

    return () => clearInterval(timer);
  }, [minDurationMs, onComplete]);

  // Handle instant skip on Escape or click
  const handleSkip = () => {
    setProgress(100);
    setIsFadingOut(true);
    setTimeout(() => {
      if (onComplete) onComplete();
    }, 150);
  };

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === 'Enter') {
        handleSkip();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const currentStep = BOOT_STEPS.slice().reverse().find((s) => progress >= s.threshold) || BOOT_STEPS[0];

  return (
    <div
      className={`fixed inset-0 z-[95] flex flex-col items-center justify-center bg-[#070708] text-white select-none transition-all duration-350 ease-out ${
        isFadingOut ? 'opacity-0 pointer-events-none scale-102' : 'opacity-100'
      }`}
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label="Loading Soul Workspace Developer Portal"
    >
      {/* ── Ambient Radial Glow Layers ── */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-indigo-600/15 rounded-full blur-[80px] pointer-events-none" />

      {/* ── Background Subtle Tech Grid ── */}
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: `radial-gradient(circle, #ffffff 1px, transparent 1px)`,
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 w-full max-w-md px-6 flex flex-col items-center gap-7">
        {/* ── Emblem Pedestal with Orbital Glow ── */}
        <div className="relative flex items-center justify-center">
          {/* Orbital Radar Ring */}
          <div className="absolute -inset-4 rounded-full border border-sky-500/20 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="absolute -inset-8 rounded-full border border-indigo-500/15 animate-ping opacity-25" style={{ animationDuration: '3s' }} />

          {/* Core Pedestal */}
          <div className="w-20 h-20 rounded-2xl bg-[#111116] border border-white/15 flex items-center justify-center shadow-2xl shadow-sky-500/20 backdrop-blur-xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-indigo-500/20" />
            <SoulLogoIcon size={44} className="relative z-10 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          </div>
        </div>

        {/* ── Brand Title & Subtitle ── */}
        <div className="flex flex-col items-center gap-1.5 text-center">
          <div className="flex items-center gap-2">
            <h1 className="text-xl md:text-2xl font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              Soul DevPortal
            </h1>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 border border-sky-400/30 text-sky-300">
              v0.0.1
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-400 uppercase tracking-widest">
            Workspace &amp; System Portal
          </p>
        </div>

        {/* ── Progress Bar & Telemetry Row ── */}
        <div className="w-full flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-400 flex items-center gap-2">
              <span className="animate-spin text-sky-400">⚡</span>
              <span className="truncate max-w-[220px]">{currentStep.label}</span>
            </span>
            <strong className="text-sky-400 font-bold">{progress}%</strong>
          </div>

          {/* Progress Bar Container */}
          <div className="w-full h-2 rounded-full bg-[#16161c] border border-white/[0.08] overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-emerald-400 transition-all duration-75 ease-out shadow-[0_0_10px_rgba(56,189,248,0.8)]"
              style={{ width: `${progress}%` }}
            />
          </div>

          <div className="text-[11px] font-mono text-zinc-500 text-center truncate">
            {currentStep.subLabel}
          </div>
        </div>

        {/* ── Subsystem Verification Checklist ── */}
        <div className="w-full p-3.5 rounded-xl bg-[#111116]/80 border border-white/[0.06] backdrop-blur-md flex flex-col gap-2">
          {BOOT_STEPS.slice(0, 4).map((step) => {
            const isDone = progress >= step.threshold;
            const isCurrent = progress < step.threshold && progress >= (BOOT_STEPS[BOOT_STEPS.indexOf(step) - 1]?.threshold || 0);

            return (
              <div key={step.id} className="flex items-center justify-between text-xs">
                <span className={`flex items-center gap-2 ${isDone ? 'text-zinc-200' : isCurrent ? 'text-sky-300 font-semibold' : 'text-zinc-600'}`}>
                  <span className="text-sm">{step.icon}</span>
                  <span>{step.label}</span>
                </span>
                {isDone ? (
                  <span className="text-emerald-400 font-mono text-[11px] font-bold">✓ READY</span>
                ) : isCurrent ? (
                  <span className="text-sky-400 font-mono text-[10px] animate-pulse">BOOTING...</span>
                ) : (
                  <span className="text-zinc-700 font-mono text-[10px]">PENDING</span>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Footer Telemetry & Skip Button ── */}
        <div className="flex items-center justify-between w-full pt-1 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>SOUL DEVPORTAL · v0.0.1</span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="text-zinc-400 hover:text-white transition-colors underline cursor-pointer"
            title="Skip loading screen (Press ESC)"
          >
            Skip (ESC) →
          </button>
        </div>
      </div>
    </div>
  );
};

export default LoadingScreen;
