import React from 'react';

export interface TabLoadingStateProps {
  title?: string;
  subtitle?: string;
  variant?: 'article' | 'grid' | 'list';
}

export default function TabLoadingState({
  title = 'Loading content...',
  subtitle = 'Synchronizing live workspace metadata and AST telemetry.',
  variant = 'grid',
}: TabLoadingStateProps) {
  return (
    <div
      className="w-full p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-5"
      role="status"
      aria-live="polite"
      aria-busy="true"
    >
      {/* Status Banner */}
      <div className="flex items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/12 border border-sky-400/30 flex items-center justify-center text-sky-400 shrink-0">
            <svg
              className="w-4 h-4 animate-spin"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.4"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="9" className="opacity-20" />
              <path d="M21 12a9 9 0 0 0-9-9" strokeLinecap="round" />
            </svg>
          </div>
          <div className="flex flex-col min-w-0">
            <span className="text-xs font-bold text-white tracking-tight truncate">
              {title}
            </span>
            <span className="text-[11px] font-mono text-zinc-400 truncate">
              {subtitle}
            </span>
          </div>
        </div>

        <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 border border-sky-400/25 text-sky-300 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" />
          <span>LOADING</span>
        </span>
      </div>

      {/* Variant-Matched Skeleton */}
      {variant === 'article' ? (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start animate-pulse">
          <div className="hidden lg:flex flex-col gap-2.5 p-4 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <div className="h-4 w-28 rounded bg-white/[0.08]" />
            <div className="h-7 w-full rounded-lg bg-white/[0.05]" />
            <div className="h-3.5 w-4/5 rounded bg-white/[0.06] mt-2" />
            <div className="h-3 w-3/5 rounded bg-white/[0.04] ml-3" />
            <div className="h-3 w-2/3 rounded bg-white/[0.04] ml-3" />
            <div className="h-3.5 w-3/4 rounded bg-white/[0.06] mt-2" />
            <div className="h-3 w-1/2 rounded bg-white/[0.04] ml-3" />
          </div>
          <div className="flex flex-col gap-3 p-4 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <div className="h-5 w-2/5 rounded bg-white/[0.08]" />
            <div className="h-3 w-full rounded bg-white/[0.05]" />
            <div className="h-3 w-11/12 rounded bg-white/[0.05]" />
            <div className="h-3 w-4/5 rounded bg-white/[0.05]" />
            <div className="h-24 w-full rounded-lg bg-white/[0.04] mt-2" />
            <div className="h-3 w-5/6 rounded bg-white/[0.05] mt-2" />
            <div className="h-3 w-2/3 rounded bg-white/[0.05]" />
          </div>
        </div>
      ) : variant === 'grid' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 animate-pulse">
          {[0, 1, 2, 3, 4, 5].map((idx) => (
            <div
              key={idx}
              className="p-4 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2.5"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="h-3.5 w-28 rounded bg-white/[0.08]" />
                <div className="h-4 w-12 rounded bg-white/[0.05]" />
              </div>
              <div className="h-3 w-full rounded bg-white/[0.05]" />
              <div className="h-3 w-3/4 rounded bg-white/[0.04]" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex flex-col gap-2.5 animate-pulse">
          {[0, 1, 2, 3, 4].map((idx) => (
            <div
              key={idx}
              className="h-11 px-4 rounded-xl bg-[#16161c] border border-white/[0.06] flex items-center justify-between gap-4"
            >
              <div className="h-3 w-1/3 rounded bg-white/[0.07]" />
              <div className="h-3 w-16 rounded bg-white/[0.05]" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
