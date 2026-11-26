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
  { id: 'connect', icon: '⚡', label: 'Connecting Workspace Engine', threshold: 25 },
  { id: 'schema', icon: '📦', label: 'Syncing Apps & Metadata', threshold: 55 },
  { id: 'inspect', icon: '🛰️', label: 'Reading System State', threshold: 80 },
  { id: 'render', icon: '✨', label: 'Preparing View', threshold: 95 },
];

export default function TabLoadingState({
  title = 'Loading Workspace View',
  subtitle = 'Soul DevPortal · Preparing View',
  steps = DEFAULT_STEPS,
  badgeText = 'v0.0.1',
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
      className="relative w-full min-h-[300px] sm:min-h-[340px] py-8 px-5 sm:px-8 rounded-2xl bg-[#0c0d11]/[0.96] border border-white/[0.08] shadow-2xl flex flex-col items-center justify-center overflow-hidden fade-in-up portal-header-sheen"
      role="progressbar"
      aria-valuenow={progress}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-live="polite"
    >
      <HeroArtworkBackdrop src={backdropSrc} alt="" opacityClass="opacity-55 sm:opacity-72" />

      {/* Properly absolute ambient radial halo (never affects flow layout) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-[320px] h-[320px] bg-sky-500/10 rounded-full blur-[90px]" />
      </div>

      <div className="relative z-10 w-full max-w-md flex flex-col items-center gap-4">
        {/* Emblem Pedestal */}
        <div className="relative flex items-center justify-center">
          <div
            className="absolute -inset-3 rounded-full border border-sky-400/20 border-t-sky-400/70 animate-spin"
            style={{ animationDuration: '2.4s' }}
          />
          <div className="w-14 h-14 rounded-2xl bg-[#13141b] border border-white/[0.14] flex items-center justify-center shadow-lg shadow-sky-500/15 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-sky-500/15 via-transparent to-indigo-500/20" />
            <SoulLogoIcon size={32} className="relative z-10 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]" />
          </div>
        </div>

        {/* Title & Subtitle */}
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="flex items-center gap-2">
            <h2 className="text-base sm:text-lg font-extrabold tracking-tight text-white">
              Soul DevPortal
            </h2>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 border border-sky-400/30 text-sky-300">
              {badgeText}
            </span>
          </div>
          <p className="text-[11px] font-mono text-zinc-400 tracking-wide max-w-sm truncate">
            {subtitle}
          </p>
        </div>

        {/* Compact Progress Track */}
        <div className="w-full flex flex-col gap-1.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-zinc-200 flex items-center gap-2 min-w-0">
              <span className="text-sky-400">{currentStep.icon}</span>
              <span className="truncate">{title}</span>
            </span>
            <strong className="text-sky-400 font-bold tabular-nums shrink-0">{progress}%</strong>
          </div>
          <div className="w-full h-1.5 rounded-full bg-[#171820] border border-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-400 to-emerald-400 transition-all duration-150 ease-out shadow-[0_0_8px_rgba(56,189,248,0.65)] portal-shimmer-bar"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Compact 2x2 Status Grid */}
        <div className="w-full p-3 rounded-xl bg-[#111218]/90 border border-white/[0.07] grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
          {steps.map((step, idx) => {
            const isDone = progress >= step.threshold;
            const isCurrent = !isDone && progress >= (steps[idx - 1]?.threshold || 0);
            return (
              <div key={step.id} className="flex items-center justify-between text-[11px] gap-2 min-w-0">
                <span
                  className={`flex items-center gap-1.5 truncate ${
                    isDone ? 'text-zinc-200' : isCurrent ? 'text-sky-300 font-semibold' : 'text-zinc-500'
                  }`}
                >
                  <span className="shrink-0">{step.icon}</span>
                  <span className="truncate">{step.label}</span>
                </span>
                {isDone ? (
                  <span className="text-emerald-400 font-mono text-[10px] font-bold shrink-0">✓</span>
                ) : isCurrent ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse shrink-0" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-zinc-700 shrink-0" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
