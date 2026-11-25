import React, { useEffect, useState } from 'react';
import { HeroArtworkBackdrop } from './PortalVisuals';
import { SoulLogoIcon } from './SoulLogo';

export interface LoadingStepItem {
  id: string;
  icon: string;
  label: string;
  threshold: number;
}

export interface TabLoadingStateProps {
  title?: string;
  subtitle?: string;
  variant?: 'article' | 'grid' | 'list';
  steps?: LoadingStepItem[];
  badgeText?: string;
  backdropSrc?: string;
}

const DEFAULT_STEPS: LoadingStepItem[] = [
  { id: 'connect', icon: '⚡', label: 'Connecting Telemetry Engine', threshold: 25 },
  { id: 'schema', icon: '📦', label: 'Synchronizing Workspace & Metadata', threshold: 55 },
  { id: 'inspect', icon: '🚀', label: 'Probing Live Host & Endpoints', threshold: 80 },
  { id: 'render', icon: '📜', label: 'Hydrating Interactive View', threshold: 95 },
];

export default function TabLoadingState({
  title = 'Synchronizing Workspace Telemetry',
  subtitle = 'Developer Portal • Live Data Engine',
  steps = DEFAULT_STEPS,
  badgeText = 'v1.0',
  backdropSrc = '/visuals/hero-overview-mesh.jpg',
}: TabLoadingStateProps) {
  const [progress, setProgress] = useState<number>(22);

  useEffect(() => {
    const id = window.setInterval(() => {
      setProgress((prev) => (prev >= 94 ? 94 : prev + Math.max(2, Math.round((96 - prev) * 0.16))));
    }, 85);
    return () => window.clearInterval(id);
  }, []);

  const currentStep = steps.slice().reverse().find((s) => progress >= s.threshold) || steps[0];

  return (
    <div
      className="relative w-full min-h-[420px] py-10 px-6 rounded-2xl bg-[#0b0b0e] border border-[#212126] shadow-2xl flex flex-col items-center justify-center overflow-hidden fade-in-up portal-header-sheen"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
    >
      <HeroArtworkBackdrop src={backdropSrc} alt="" opacityClass="opacity-30 sm:opacity-45" />
      {/* Subtle Ambient Glow + Tech Dot Grid matching LoadingScreen.tsx */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] bg-sky-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none"
        style={{
          backgroundImage: 'radial-gradient(circle, #ffffff 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-5">
        {/* Unified Soul Workspace Emblem Pedestal */}
        <div className="relative flex items-center justify-center">
          <div className="absolute -inset-3.5 rounded-full border border-sky-500/20 animate-spin" style={{ animationDuration: '6s' }} />
          <div className="w-16 h-16 rounded-2xl bg-[#111116] border border-white/15 flex items-center justify-center shadow-2xl shadow-sky-500/20 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-indigo-500/20" />
            <SoulLogoIcon size={38} className="relative z-10 drop-shadow-[0_0_12px_rgba(56,189,248,0.6)]" />
          </div>
        </div>

        {/* Title & Monospace Subtitle */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-zinc-100 to-zinc-400 bg-clip-text text-transparent">
              SOUL WORKSPACE
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 border border-sky-500/30 text-sky-400">
              {badgeText}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 uppercase tracking-widest max-w-sm truncate">
            {subtitle}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-300 flex items-center gap-2 min-w-0">
              <span className="text-sky-400">{currentStep.icon}</span>
              <span className="truncate">{title}</span>
            </span>
            <strong className="text-sky-400 font-bold tabular-nums shrink-0">{progress}%</strong>
          </div>
          <div className="w-full h-2 rounded-full bg-[#16161c] border border-white/[0.08] overflow-hidden p-0.5 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-400 to-emerald-400 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(56,189,248,0.8)] portal-shimmer-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Unified 4-Step Verification Box */}
        <div className="w-full p-3.5 rounded-xl bg-[#111116]/85 border border-white/[0.06] flex flex-col gap-2 portal-list-stagger">
          {steps.map((step, idx) => {
            const isDone = progress >= step.threshold;
            const isCurrent = !isDone && progress >= (steps[idx - 1]?.threshold || 0);
            return (
              <div key={step.id} className="flex items-center justify-between text-xs gap-2">
                <span className={`flex items-center gap-2 truncate ${isDone ? 'text-zinc-200' : isCurrent ? 'text-sky-300 font-semibold' : 'text-zinc-600'}`}>
                  <span className="text-sm">{step.icon}</span>
                  <span className="truncate">{step.label}</span>
                </span>
                {isDone ? (
                  <span className="text-emerald-400 font-mono text-[11px] font-bold shrink-0">✓ READY</span>
                ) : isCurrent ? (
                  <span className="text-sky-400 font-mono text-[10px] animate-pulse shrink-0">LOADING...</span>
                ) : (
                  <span className="text-zinc-700 font-mono text-[10px] shrink-0">PENDING</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Unified Footer */}
        <div className="flex items-center justify-center gap-2 text-[11px] font-mono text-zinc-500">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          <span>:8008 LIVE · :5181 VITE</span>
        </div>
      </div>
    </div>
  );
}
