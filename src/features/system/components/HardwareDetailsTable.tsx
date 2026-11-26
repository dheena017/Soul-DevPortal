import React, { useState } from 'react';
import CopyButton from '../../../components/CopyButton';

export interface HardwareDetailItem {
  label: string;
  value: string;
  code?: string | null;
  copyValue?: string;
  tone?: 'default' | 'emerald' | 'sky' | 'purple' | 'amber' | 'rose';
}

export interface HardwareDetailTableRow {
  id: string;
  name: string;
  summary: string;
  hardwareCode?: string | null;
  statusLabel: string;
  statusTone?: 'emerald' | 'sky' | 'purple' | 'amber' | 'rose' | 'zinc';
  primaryMetric?: string;
  accent?: 'sky' | 'purple' | 'emerald' | 'amber' | 'rose' | 'zinc';
  details: HardwareDetailItem[];
}

export interface HardwareDetailsTableProps {
  title: string;
  subtitle?: string;
  rows: HardwareDetailTableRow[];
  defaultExpandedIds?: string[];
  onClearFilter?: () => void;
}

const TONE_BADGE: Record<string, string> = {
  emerald: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
  sky: 'bg-sky-500/15 border-sky-400/35 text-sky-300',
  purple: 'bg-purple-500/15 border-purple-500/35 text-purple-300',
  amber: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
  rose: 'bg-rose-500/15 border-rose-500/35 text-rose-300',
  zinc: 'bg-white/[0.06] border-white/[0.12] text-zinc-300',
  default: 'text-white',
};

const ACCENT_DOT: Record<string, string> = {
  sky: 'bg-sky-400',
  purple: 'bg-purple-400',
  emerald: 'bg-emerald-400',
  amber: 'bg-amber-400',
  rose: 'bg-rose-400',
  zinc: 'bg-zinc-400',
};

export default function HardwareDetailsTable({
  title,
  subtitle,
  rows,
  defaultExpandedIds = [],
  onClearFilter,
}: HardwareDetailsTableProps) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    for (const id of defaultExpandedIds) {
      initial[id] = true;
    }
    return initial;
  });

  const expandedCount = rows.filter((r) => Boolean(expanded[r.id])).length;
  const allExpanded = rows.length > 0 && expandedCount === rows.length;

  const toggleRow = (id: string) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const toggleAll = () => {
    if (allExpanded) {
      setExpanded({});
    } else {
      const next: Record<string, boolean> = {};
      for (const r of rows) next[r.id] = true;
      setExpanded(next);
    }
  };

  return (
    <section className="w-full rounded-2xl system-card overflow-hidden">
      {/* Table Title & Global Expand (+) / Collapse (-) Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3.5 border-b border-white/[0.07] bg-[#131318]">
        <div className="flex flex-col gap-0.5 min-w-0">
          <h3 className="text-sm font-bold text-white tracking-tight">{title}</h3>
          {subtitle && <p className="text-[11px] text-zinc-400">{subtitle}</p>}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="px-2 py-1 rounded-md neu-inset bg-[#181820] border border-white/[0.07] text-[10px] font-mono tabular-nums text-zinc-400">
            {expandedCount}/{rows.length} Open
          </span>
          <button
            type="button"
            onClick={toggleAll}
            className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-mono font-bold bg-[#181820] border border-white/[0.09] text-zinc-200 hover:text-white hover:border-sky-400/40 hover:bg-sky-500/10 transition-all cursor-pointer"
          >
            <span className="w-4 h-4 rounded flex items-center justify-center bg-white/[0.08] text-sky-300 text-xs font-extrabold">
              {allExpanded ? '−' : '+'}
            </span>
            <span>{allExpanded ? 'Collapse All' : 'Expand All Details'}</span>
          </button>
        </div>
      </div>

      {/* Desktop Structured Color-Coded Table (sm+) */}
      <div className="hidden sm:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
              <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
              <th className="py-2.5 px-3">Subsystem / Component</th>
              <th className="py-2.5 px-3">Decoded Specification &amp; Hardware Code</th>
              <th className="py-2.5 px-3">State</th>
              <th className="py-2.5 pl-3 pr-5 text-right">Metric / Capacity</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/[0.05]">
            {rows.map((row) => {
              const isOpen = Boolean(expanded[row.id]);
              const dotCls = ACCENT_DOT[row.accent || 'sky'];
              const statusCls = TONE_BADGE[row.statusTone || 'emerald'];
              const detailGridCols =
                row.details.length <= 1
                  ? 'grid-cols-1'
                  : row.details.length === 2 || row.details.length === 4
                    ? 'grid-cols-1 md:grid-cols-2'
                    : 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3';

              return (
                <React.Fragment key={row.id}>
                  <tr
                    tabIndex={0}
                    onClick={() => toggleRow(row.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleRow(row.id);
                      }
                    }}
                    className={`cursor-pointer transition-colors focus:outline-none focus-visible:bg-sky-500/10 ${
                      isOpen ? 'bg-sky-500/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <td className="py-3 pl-4 pr-2 text-center align-middle">
                      <button
                        type="button"
                        aria-expanded={isOpen}
                        aria-label={`${isOpen ? 'Collapse' : 'Expand'} ${row.name} details`}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleRow(row.id);
                        }}
                        className={`neu-btn w-6 h-6 inline-flex items-center justify-center rounded-md border text-xs font-mono font-extrabold transition-all cursor-pointer ${
                          isOpen
                            ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                            : 'bg-[#181820] border-white/[0.12] text-zinc-300 hover:border-sky-400/40 hover:text-white'
                        }`}
                      >
                        {isOpen ? '−' : '+'}
                      </button>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="flex items-center gap-2.5">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
                        <span className="text-xs font-bold text-white">{row.name}</span>
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs text-zinc-200">{row.summary}</span>
                        {row.hardwareCode && (
                          <code className="neu-inset px-1.5 py-0.5 rounded bg-[#09090c] border border-white/[0.1] text-[10px] font-mono text-zinc-300">
                            {row.hardwareCode}
                          </code>
                        )}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${statusCls}`}>
                        {row.statusLabel}
                      </span>
                    </td>

                    <td className="py-3 pl-3 pr-5 text-right align-middle">
                      <span className="text-xs font-mono tabular-nums font-bold text-zinc-200">
                        {row.primaryMetric || '—'}
                      </span>
                    </td>
                  </tr>

                  {/* Inline Expanded Detail Drawer inside the Same Table Row */}
                  {isOpen && (
                    <tr className="bg-[#0b0b0f]">
                      <td colSpan={5} className="px-5 py-4 border-t border-sky-400/15 shadow-[inset_3px_0_0_#38bdf8]">
                        <div className={`grid ${detailGridCols} gap-2.5 sys-drawer-open`}>
                          {row.details.map((item, idx) => (
                            <div
                              key={`${row.id}-d-${idx}`}
                              className="neu-tile group flex items-start justify-between gap-2 p-2.5 rounded-xl bg-[#15151b] border border-white/[0.06] hover:border-white/[0.14] transition-colors"
                            >
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                  {item.label}
                                </span>
                                <div className="flex flex-wrap items-center gap-1.5 min-w-0">
                                  <span
                                    className={`text-xs font-medium break-words ${
                                      item.tone && item.tone !== 'default'
                                        ? TONE_BADGE[item.tone].split(' ').find((c) => c.startsWith('text-')) || 'text-white'
                                        : 'text-white'
                                    }`}
                                  >
                                    {item.value}
                                  </span>
                                  {item.code && (
                                    <code className="neu-inset px-1.5 py-0.5 rounded bg-[#09090c] border border-white/[0.1] text-[10px] font-mono text-zinc-300">
                                      {item.code}
                                    </code>
                                  )}
                                </div>
                              </div>

                              {(item.copyValue || item.value) && (
                                <CopyButton
                                  text={item.copyValue || item.value}
                                  variant="icon-only"
                                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 shrink-0"
                                  title={`Copy ${item.label}`}
                                />
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
            {rows.length === 0 && (
              <tr>
                <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                  <span>No hardware rows matched your filter.</span>
                  {onClearFilter && (
                    <button
                      type="button"
                      onClick={onClearFilter}
                      className="neu-btn ml-2 px-2.5 py-1 rounded-md bg-white/[0.06] border border-white/[0.1] text-sky-300 hover:text-white cursor-pointer"
                    >
                      Reset Filter
                    </button>
                  )}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Responsive Card View (< 640px) with Same In-Place (+) Expansion */}
      <div className="sm:hidden divide-y divide-white/[0.06]">
        {rows.map((row) => {
          const isOpen = Boolean(expanded[row.id]);
          const dotCls = ACCENT_DOT[row.accent || 'sky'];
          const statusCls = TONE_BADGE[row.statusTone || 'emerald'];

          return (
            <div key={`${row.id}-mob`} className="p-3.5 flex flex-col gap-2.5">
              <button
                type="button"
                onClick={() => toggleRow(row.id)}
                className="w-full flex items-start justify-between gap-3 text-left cursor-pointer"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <span
                    className={`neu-btn w-6 h-6 mt-0.5 shrink-0 inline-flex items-center justify-center rounded-md border text-xs font-mono font-extrabold ${
                      isOpen
                        ? 'bg-sky-500/20 border-sky-400/50 text-sky-300'
                        : 'bg-[#181820] border-white/[0.12] text-zinc-300'
                    }`}
                  >
                    {isOpen ? '−' : '+'}
                  </span>
                  <div className="flex flex-col gap-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`w-2 h-2 rounded-full shrink-0 ${dotCls}`} />
                      <strong className="text-xs font-bold text-white truncate">{row.name}</strong>
                    </div>
                    <span className="text-[11px] text-zinc-300 leading-snug">{row.summary}</span>
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${statusCls}`}>
                        {row.statusLabel}
                      </span>
                      {row.primaryMetric && (
                        <span className="text-[11px] font-mono tabular-nums font-bold text-zinc-200">
                          {row.primaryMetric}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </button>

              {isOpen && (
                <div className="pl-2 flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                  {row.details.map((item, idx) => (
                    <div key={`${row.id}-md-${idx}`} className="neu-tile flex items-center justify-between gap-2 p-2.5 rounded-lg bg-[#16161c] border border-white/[0.06]">
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <span className="text-[10px] font-mono uppercase text-zinc-400">{item.label}</span>
                        <span className="text-xs text-white break-all">{item.value}</span>
                        {item.code && <code className="text-[10px] font-mono text-zinc-400">{item.code}</code>}
                      </div>
                      <CopyButton text={item.copyValue || item.value} variant="icon-only" className="shrink-0" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
