import React from 'react';

export function ExpandToggleCell({ isOpen, tone = 'sky' }: { isOpen: boolean; tone?: 'sky' | 'emerald' | 'amber' | 'violet' | 'cyan' | 'purple' }) {
  const openMap = {
    sky: 'bg-sky-500/20 border-sky-400/50 text-sky-300',
    emerald: 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300',
    amber: 'bg-amber-500/20 border-amber-400/50 text-amber-300',
    violet: 'bg-violet-500/20 border-violet-400/50 text-violet-300',
    cyan: 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300',
    purple: 'bg-purple-500/20 border-purple-400/50 text-purple-300',
  };
  return (
    <span
      className={`w-6 h-6 inline-flex items-center justify-center rounded-md border text-xs font-mono font-bold shrink-0 transition-all duration-200 ${
        isOpen ? `${openMap[tone]} scale-105 shadow-sm` : 'bg-[#181820] border-white/[0.1] text-zinc-300 hover:border-white/25'
      }`}
    >
      {isOpen ? '−' : '+'}
    </span>
  );
}

export interface FilterPillItem {
  id: string;
  label: string;
  danger?: boolean;
}

export function FilterPillBar({
  items,
  activeId,
  onSelect,
  tone = 'sky',
  shownCount,
  totalCount,
}: {
  items: readonly FilterPillItem[];
  activeId: string;
  onSelect: (id: string) => void;
  tone?: 'sky' | 'emerald' | 'amber' | 'violet' | 'cyan' | 'purple';
  shownCount: number;
  totalCount: number;
}) {
  const activeToneMap = {
    sky: 'bg-sky-500/15 border-sky-500/40 text-sky-200 font-bold',
    emerald: 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold',
    amber: 'bg-amber-500/15 border-amber-500/40 text-amber-200 font-bold',
    violet: 'bg-violet-500/15 border-violet-500/40 text-violet-200 font-bold',
    cyan: 'bg-cyan-500/15 border-cyan-500/40 text-cyan-200 font-bold',
    purple: 'bg-purple-500/15 border-purple-500/40 text-purple-200 font-bold',
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/[0.05]">
      <div className="flex flex-wrap items-center gap-1.5">
        {items.map((f) => {
          const isActive = activeId === f.id;
          return (
            <button
              key={f.id}
              type="button"
              onClick={() => onSelect(f.id)}
              className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border cursor-pointer transition-all hover:scale-[1.03] active:scale-[0.97] ${
                isActive
                  ? f.danger
                    ? 'bg-rose-500/15 border-rose-500/40 text-rose-200 font-bold'
                    : activeToneMap[tone]
                  : 'bg-[#16161c] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {f.label}
            </button>
          );
        })}
      </div>
      <span className="text-[11px] font-mono text-zinc-400 tabular-nums">
        Showing {shownCount} of {totalCount}
      </span>
    </div>
  );
}

export function TableLoadAllFooter({
  visibleCount,
  totalCount,
  noun,
  showAll,
  onToggle,
  tone = 'sky',
}: {
  visibleCount: number;
  totalCount: number;
  noun: string;
  showAll: boolean;
  onToggle: () => void;
  tone?: 'sky' | 'emerald' | 'amber' | 'violet';
}) {
  if (totalCount <= 120) return null;
  const textTone = {
    sky: 'text-sky-300',
    emerald: 'text-emerald-300',
    amber: 'text-amber-300',
    violet: 'text-violet-300',
  }[tone];

  return (
    <div className="px-4 py-3 border-t border-white/[0.06] bg-[#0e0e12] flex items-center justify-between text-xs">
      <span className="font-mono text-zinc-400">
        Displaying {visibleCount} of {totalCount} {noun}
      </span>
      <button
        type="button"
        onClick={onToggle}
        className={`px-3 py-1 rounded-lg bg-[#181820] hover:bg-white/[0.08] border border-white/[0.1] font-mono cursor-pointer ${textTone}`}
      >
        {showAll ? 'Show Compact 120' : `Load All ${totalCount} ${noun}`}
      </button>
    </div>
  );
}
