import React from 'react';

export interface TelemetryTileItem {
  id: string;
  label: string;
  badge?: string | null;
  badgeTone?: 'sky' | 'purple' | 'emerald' | 'amber' | 'rose' | 'neutral';
  tone?: 'sky' | 'amber' | 'rose' | 'muted';
  valueText: string;
  percent: number;
  tooltip?: string;
  muted?: boolean;
  onClick?: () => void;
}

export interface TelemetryTileGridProps {
  title: string;
  rightLabel?: string;
  rightToneClass?: string;
  items: TelemetryTileItem[];
  columnsClass?: string;
  className?: string;
}

const BADGE_CLASSES: Record<NonNullable<TelemetryTileItem['badgeTone']>, string> = {
  sky: 'bg-sky-400/15 text-sky-300 border border-sky-400/20',
  purple: 'bg-purple-400/15 text-purple-300 border border-purple-400/20',
  emerald: 'bg-emerald-400/15 text-emerald-300 border border-emerald-400/20',
  amber: 'bg-amber-400/15 text-amber-300 border border-amber-400/20',
  rose: 'bg-rose-400/15 text-rose-300 border border-rose-400/20',
  neutral: 'bg-white/[0.07] text-zinc-300 border border-white/[0.08]',
};

function getMatrixTileStyle(percent: number, muted?: boolean, explicitTone?: TelemetryTileItem['tone']) {
  if (muted || explicitTone === 'muted') {
    return {
      surface: 'bg-[#111318] border-white/[0.06] text-zinc-500',
      valueClass: 'text-zinc-400',
      stroke: '#3f3f46',
    };
  }
  if (explicitTone === 'rose' || (!explicitTone && percent >= 85)) {
    return {
      surface: 'bg-rose-950/35 border-rose-500/40 text-rose-100',
      valueClass: 'text-rose-300',
      stroke: '#f43f5e',
    };
  }
  if (explicitTone === 'amber' || (!explicitTone && percent >= 65)) {
    return {
      surface: 'bg-amber-950/35 border-amber-500/45 text-amber-100',
      valueClass: 'text-amber-300',
      stroke: '#f59e0b',
    };
  }
  return {
    surface: 'bg-[#0e1e29]/85 border-sky-500/25 text-zinc-100',
    valueClass: 'text-sky-200',
    stroke: '#38bdf8',
  };
}

export default function TelemetryTileGrid({
  title,
  rightLabel,
  rightToneClass = 'text-sky-300',
  items,
  columnsClass = 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6',
  className = '',
}: TelemetryTileGridProps) {
  return (
    <div
      className={`p-4 rounded-2xl bg-[#111217] border border-white/[0.07] shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] flex flex-col gap-3 ${className}`}
    >
      <div className="flex items-center justify-between gap-2 text-xs">
        <span className="font-semibold text-zinc-200 truncate">{title}</span>
        {rightLabel && (
          <span className={`font-mono text-[11px] font-semibold tabular-nums shrink-0 ${rightToneClass}`}>
            {rightLabel}
          </span>
        )}
      </div>

      <div className={`grid ${columnsClass} gap-2.5`}>
        {items.map((item) => {
          const pct = Math.max(0, Math.min(100, item.percent));
          const style = getMatrixTileStyle(pct, item.muted, item.tone);
          const badgeCls = BADGE_CLASSES[item.badgeTone || 'neutral'];
          const Tag = item.onClick ? 'button' : 'div';

          return (
            <Tag
              key={item.id}
              type={item.onClick ? 'button' : undefined}
              onClick={item.onClick}
              title={item.tooltip}
              className={`px-3 py-2.5 rounded-xl border shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] flex flex-col gap-2 font-mono tabular-nums text-[11px] text-left transition-all ${style.surface} ${
                item.onClick ? 'cursor-pointer hover:border-sky-400/50 hover:bg-[#132634]' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-2 min-w-0">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="font-semibold tracking-tight truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`px-1.5 py-0.5 rounded text-[9px] leading-none font-bold shrink-0 ${badgeCls}`}>
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className={`font-bold shrink-0 ${style.valueClass}`}>{item.valueText}</span>
              </div>
              <div className="w-full h-1 rounded-full bg-black/45 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.muted ? 0 : Math.max(4, pct)}%`, backgroundColor: style.stroke }}
                />
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
