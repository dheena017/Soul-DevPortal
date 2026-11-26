import React from 'react';
import { getLoadTone } from '../systemConstants';

export interface TelemetryTileItem {
  id: string;
  label: string;
  badge?: string | null;
  badgeTone?: 'sky' | 'purple' | 'emerald' | 'amber' | 'rose' | 'neutral';
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
  sky: 'bg-sky-500/20 text-sky-200',
  purple: 'bg-purple-500/20 text-purple-200',
  emerald: 'bg-emerald-500/20 text-emerald-200',
  amber: 'bg-amber-500/20 text-amber-200',
  rose: 'bg-rose-500/20 text-rose-200',
  neutral: 'bg-white/[0.08] text-zinc-300',
};

export default function TelemetryTileGrid({
  title,
  rightLabel,
  rightToneClass = 'text-sky-300',
  items,
  columnsClass = 'grid-cols-3 sm:grid-cols-4 md:grid-cols-6',
  className = '',
}: TelemetryTileGridProps) {
  return (
    <div className={`neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2.5 ${className}`}>
      <div className="flex items-center justify-between gap-2 text-[11px] text-zinc-400">
        <span className="font-semibold text-zinc-200 truncate">{title}</span>
        {rightLabel && (
          <span className={`font-mono tabular-nums shrink-0 ${rightToneClass}`}>{rightLabel}</span>
        )}
      </div>

      <div className={`grid ${columnsClass} gap-2`}>
        {items.map((item) => {
          const pct = Math.max(0, Math.min(100, item.percent));
          const tone = getLoadTone(pct);
          const tileSurface = item.muted
            ? 'bg-white/[0.03] border-white/[0.07] text-zinc-400'
            : tone.tileBg;
          const barColor = item.muted ? '#52525b' : tone.stroke;
          const badgeCls = BADGE_CLASSES[item.badgeTone || 'neutral'];
          const Tag = item.onClick ? 'button' : 'div';

          return (
            <Tag
              key={item.id}
              type={item.onClick ? 'button' : undefined}
              onClick={item.onClick}
              title={item.tooltip}
              className={`neu-tile px-2.5 py-2 rounded-xl border flex flex-col gap-1.5 font-mono tabular-nums text-[11px] text-left transition-colors ${tileSurface} ${
                item.onClick ? 'cursor-pointer hover:brightness-110' : ''
              }`}
            >
              <div className="flex items-center justify-between gap-1 min-w-0">
                <span className="flex items-center gap-1 min-w-0">
                  <span className="opacity-80 font-semibold truncate">{item.label}</span>
                  {item.badge && (
                    <span className={`px-1 rounded text-[9px] font-bold shrink-0 ${badgeCls}`}>
                      {item.badge}
                    </span>
                  )}
                </span>
                <span className="font-bold shrink-0">{item.valueText}</span>
              </div>
              <div className="w-full h-1 rounded-full bg-black/35 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-300"
                  style={{ width: `${item.muted ? 0 : Math.max(4, pct)}%`, backgroundColor: barColor }}
                />
              </div>
            </Tag>
          );
        })}
      </div>
    </div>
  );
}
