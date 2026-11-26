import React from 'react';

export interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export default function EmptyState({
  title = 'No packages found',
  description = 'Try searching with a different term, symbol name, or filter option.',
  actionLabel = 'Clear search',
  onAction,
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-12 rounded-2xl neu-card bg-[#111115] border border-white/[0.08] text-center gap-4 fade-in-up portal-header-sheen portal-stagger" role="status">
      <div className="w-12 h-12 rounded-xl neu-inset bg-[#09090c] border border-white/[0.07] flex items-center justify-center text-zinc-300 portal-emblem-hover" aria-hidden="true">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-zinc-400 max-w-sm">{description}</p>
      {onAction && (
        <button
          type="button"
          className="neu-btn px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all cursor-pointer"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
