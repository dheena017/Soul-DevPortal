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
  liveHint?: string | null;
  onRetry?: () => void;
}

const DEFAULT_STEPS: LoadingStepItem[] = [
  { id: 'connect', icon: '⚡', label: 'Connecting Workspace Engine', threshold: 25 },
  { id: 'schema', icon: '📦', label: 'Syncing Apps & Metadata', threshold: 55 },
  { id: 'inspect', icon: '🛰️', label: 'Reading System State', threshold: 80 },
  { id: 'render', icon: '✨', label: 'Preparing Workspace View', threshold: 94 },
];

const StepVectorIcon: React.FC<{ id: string; className?: string }> = ({
  id,
  className = 'w-3.5 h-3.5 shrink-0',
}) => {
  switch (id) {
    case 'cpu':
    case 'connect':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="4" y="4" width="16" height="16" rx="2" />
          <rect x="9" y="9" width="6" height="6" />
          <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
          <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
        </svg>
      );
    case 'ram':
    case 'schema':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <ellipse cx="12" cy="5" rx="9" ry="3" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case 'gpu':
    case 'inspect':
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
        </svg>
      );
    default:
      return (
        <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.1" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="4 17 10 11 4 5" />
          <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
      );
  }
};

export default function TabLoadingState({
  title = 'Loading Workspace View',
  subtitle = 'Soul DevPortal · Preparing View',
  steps = DEFAULT_STEPS,
  badgeText = 'v0.0.1',
  backdropSrc = '/visuals/hero-overview-mesh.jpg',
  liveHint,
  onRetry,
}: TabLoadingStateProps) {
  const [elapsedMs, setElapsedMs] = useState<number>(0);

  useEffect(() => {
    const startedAt = Date.now();
    const id = window.setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 120);
    return () => window.clearInterval(id);
  }, []);

  // Smooth exponential approach to 96% over ~5s so the bar never snaps to 94% and freezes immediately
  const rawPct = 18 + Math.round(78 * (1 - Math.exp(-elapsedMs / 1700)));
  const progress = Math.min(96, Math.max(18, rawPct));
  const elapsedSec = (elapsedMs / 1000).toFixed(1);
  const currentStep = steps.slice().reverse().find((s) => progress >= s.threshold) || steps[0];

  return (
    <div
      className="relative w-full min-h-[340px] sm:min-h-[370px] py-8 px-4 sm:px-8 rounded-2xl neu-card bg-[#0c0d12] border border-white/[0.08] flex flex-col items-center justify-center overflow-hidden fade-in-up portal-header-sheen"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
    >
      <HeroArtworkBackdrop src={backdropSrc} alt="" variant="corner" opacityClass="opacity-35 sm:opacity-48" />

      {/* Centered ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[340px] h-[340px] bg-sky-500/8 rounded-full blur-[95px]" />
      </div>

      <div className="relative z-10 w-full max-w-2xl flex flex-col items-center gap-4">
        {/* Emblem Pedestal */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute -inset-3 rounded-full border border-sky-400/20 border-t-sky-400/75 animate-spin"
            style={{ animationDuration: '2.2s' }}
          />
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-2xl neu-tile bg-[#13151d] border border-white/[0.14] flex items-center justify-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-indigo-500/20" />
            <SoulLogoIcon size={30} className="relative z-10 drop-shadow-[0_0_10px_rgba(56,189,248,0.45)]" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2 flex-wrap justify-center">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              Soul DevPortal
            </h2>
            <span className="neu-tile px-2 py-0.5 rounded-full text-[10px] font-mono font-bold tracking-wider bg-sky-500/15 border border-sky-400/30 text-sky-300">
              {badgeText}
            </span>
          </div>
          <p className="text-xs font-mono text-zinc-400 tracking-wide">
            {liveHint || subtitle}
          </p>
        </div>

        {/* Progress Header & Smooth Bar */}
        <div className="w-full flex flex-col gap-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-zinc-100 flex items-center gap-2 font-semibold min-w-0">
              <StepVectorIcon id={currentStep.id} className="w-4 h-4 text-sky-400 shrink-0" />
              <span className="truncate">{title}</span>
            </span>
            <div className="flex items-center gap-2 shrink-0 tabular-nums">
              <span className="text-[11px] text-zinc-500">{elapsedSec}s</span>
              <strong className="text-sky-300 font-bold">{progress}%</strong>
            </div>
          </div>

          <div className="neu-inset w-full h-2 rounded-full bg-[#151720] border border-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-400 to-emerald-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(56,189,248,0.6)] portal-shimmer-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Un-truncated 2x2 Step Checklist Grid */}
        <div className="neu-inset w-full p-3.5 rounded-xl bg-[#101219]/95 border border-white/[0.08] grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {steps.map((step, idx) => {
            const isDone = progress >= step.threshold;
            const isCurrent = !isDone && progress >= (steps[idx - 1]?.threshold || 0);
            return (
              <div
                key={step.id}
                className={`flex items-center justify-between gap-2.5 px-3 py-2 rounded-lg border text-xs transition-colors ${
                  isDone
                    ? 'bg-emerald-500/[0.06] border-emerald-500/20 text-zinc-100'
                    : isCurrent
                      ? 'bg-sky-500/[0.08] border-sky-400/30 text-sky-200 font-semibold'
                      : 'bg-[#0b0c11] border-white/[0.05] text-zinc-500'
                }`}
              >
                <span className="flex items-center gap-2 min-w-0">
                  <StepVectorIcon
                    id={step.id}
                    className={`w-3.5 h-3.5 shrink-0 ${
                      isDone ? 'text-emerald-400' : isCurrent ? 'text-sky-400' : 'text-zinc-600'
                    }`}
                  />
                  <span className="leading-snug">{step.label}</span>
                </span>
                {isDone ? (
                  <span className="text-emerald-400 font-mono text-[11px] font-bold shrink-0">✓</span>
                ) : isCurrent ? (
                  <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse shrink-0" />
                ) : (
                  <span className="w-2 h-2 rounded-full bg-zinc-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>

        {/* Helpful slow-probe feedback + optional retry */}
        {elapsedMs >= 4500 && (
          <div className="flex flex-wrap items-center justify-center gap-2.5 pt-0.5 text-[11px] font-mono text-zinc-400">
            <span>Finalizing host telemetry inspection...</span>
            {onRetry && (
              <button
                type="button"
                onClick={onRetry}
                className="neu-btn px-2.5 py-1 rounded-lg bg-[#161822] border border-white/[0.12] hover:border-sky-400/45 text-sky-200 hover:text-white cursor-pointer"
              >
                ↻ Retry Now
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
