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
    <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[#111111] border border-[#222222] text-center gap-4 shadow-2xl" role="status">
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 border border-blue-500/25 flex items-center justify-center text-blue-400" aria-hidden="true">
        <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="11" cy="11" r="8" />
          <line x1="21" y1="21" x2="16.65" y2="16.65" />
          <line x1="8" y1="11" x2="14" y2="11" />
        </svg>
      </div>
      <h3 className="text-sm font-bold text-white">{title}</h3>
      <p className="text-xs text-neutral-400 max-w-sm">{description}</p>
      {onAction && (
        <button
          type="button"
          className="px-4 py-2 rounded-xl text-xs font-semibold bg-blue-600 text-white hover:bg-blue-500 transition-all shadow-md shadow-blue-600/20"
          onClick={onAction}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}
