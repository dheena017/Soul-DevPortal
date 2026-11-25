import React, { useEffect, useId, useState } from 'react';
import { getLoadTone } from '../systemConstants';

export interface RadialGaugeProps {
  title: string;
  value: number | null | undefined;
  centerText?: string;
  centerCaption?: string;
  subtitle: string;
  detailLine?: string;
  statusText?: string;
  icon?: React.ReactNode;
  accent?: 'auto' | 'sky' | 'purple' | 'amber' | 'emerald' | 'rose';
  onClick?: () => void;
}

const ACCENT_PALETTES: Record<
  Exclude<RadialGaugeProps['accent'], 'auto' | undefined>,
  {
    start: string;
    end: string;
    text: string;
    iconBg: string;
    pill: string;
    glow: string;
  }
> = {
  sky: {
    start: '#38bdf8',
    end: '#6366f1',
    text: 'text-sky-300',
    iconBg: 'bg-sky-500/12 border-sky-400/25 text-sky-400',
    pill: 'bg-sky-500/12 border-sky-400/25 text-sky-300',
    glow: 'rgba(56, 189, 248, 0.35)',
  },
  purple: {
    start: '#a855f7',
    end: '#ec4899',
    text: 'text-purple-300',
    iconBg: 'bg-purple-500/12 border-purple-400/25 text-purple-400',
    pill: 'bg-purple-500/12 border-purple-400/25 text-purple-300',
    glow: 'rgba(168, 85, 247, 0.35)',
  },
  amber: {
    start: '#f59e0b',
    end: '#fb7185',
    text: 'text-amber-300',
    iconBg: 'bg-amber-500/12 border-amber-400/25 text-amber-400',
    pill: 'bg-amber-500/12 border-amber-400/25 text-amber-300',
    glow: 'rgba(245, 158, 11, 0.35)',
  },
  emerald: {
    start: '#10b981',
    end: '#2dd4bf',
    text: 'text-emerald-300',
    iconBg: 'bg-emerald-500/12 border-emerald-400/25 text-emerald-400',
    pill: 'bg-emerald-500/12 border-emerald-400/25 text-emerald-300',
    glow: 'rgba(16, 185, 129, 0.35)',
  },
  rose: {
    start: '#f43f5e',
    end: '#fb923c',
    text: 'text-rose-300',
    iconBg: 'bg-rose-500/12 border-rose-400/25 text-rose-400',
    pill: 'bg-rose-500/12 border-rose-400/25 text-rose-300',
    glow: 'rgba(244, 63, 94, 0.38)',
  },
};

export default function RadialGauge({
  title,
  value,
  centerText,
  centerCaption,
  subtitle,
  detailLine,
  statusText,
  icon,
  accent = 'auto',
  onClick,
}: RadialGaugeProps) {
  const uid = useId().replace(/:/g, '');
  const gradId = `gauge-grad-${uid}`;
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);

  const hasValue = value !== null && value !== undefined && !Number.isNaN(value);
  const clamped = hasValue ? Math.max(0, Math.min(100, value!)) : 0;
  const autoTone = getLoadTone(clamped);

  const resolvedPalette =
    accent === 'auto'
      ? {
          start: autoTone.stroke,
          end: autoTone.stroke,
          text: autoTone.text,
          iconBg: 'bg-white/[0.06] border-white/[0.12] text-zinc-200',
          pill: autoTone.badge,
          glow: autoTone.glow,
        }
      : clamped >= 90 && accent !== 'emerald'
        ? ACCENT_PALETTES.rose
        : ACCENT_PALETTES[accent];

  const derivedStatus =
    statusText ||
    (!hasValue ? 'Standby' : clamped >= 85 ? 'High' : clamped >= 65 ? 'Busy' : 'Nominal');

  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = mounted ? circumference - (clamped / 100) * circumference : circumference;
  const displayValue = !hasValue ? '—' : centerText ?? `${Math.round(clamped)}%`;

  return (
    <div
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
      className={`group flex flex-col justify-between p-4 sm:p-5 rounded-2xl system-kpi-card shadow-xl ${
        onClick ? 'cursor-pointer hover:-translate-y-0.5' : ''
      }`}
    >
      {/* Card Top Row: Icon Badge + Title + Status Pill */}
      <div className="flex items-center justify-between gap-2 w-full">
        <div className="flex items-center gap-2 min-w-0">
          {icon && (
            <span className={`w-7 h-7 rounded-lg border flex items-center justify-center shrink-0 ${resolvedPalette.iconBg}`}>
              {icon}
            </span>
          )}
          <span className="text-xs font-bold tracking-tight text-white truncate">{title}</span>
        </div>

        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-mono font-bold shrink-0 ${resolvedPalette.pill}`}>
          {derivedStatus}
        </span>
      </div>

      {/* Center Circular Gauge with Inner Plate, Tick Bezel & Dual Gradient Stroke */}
      <div className="relative w-32 h-32 mx-auto my-3.5 flex items-center justify-center">
        <svg viewBox="0 0 120 120" className="w-full h-full -rotate-90" aria-hidden="true">
          <defs>
            <linearGradient id={gradId} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor={resolvedPalette.start} />
              <stop offset="100%" stopColor={resolvedPalette.end} />
            </linearGradient>
          </defs>

          {/* Inner radial backing disc */}
          <circle cx="60" cy="60" r="39" fill="#0b0b0f" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />

          {/* Subtle tick ring */}
          <circle
            cx="60"
            cy="60"
            r="35"
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="1.2"
            strokeDasharray="1.5 5.5"
            className="origin-center transition-transform duration-700 ease-out group-hover:rotate-12"
          />

          {/* Outer track */}
          <circle
            cx="60"
            cy="60"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth="7.5"
          />

          {hasValue && (
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={`url(#${gradId})`}
              strokeWidth="7.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              style={{
                transition: 'stroke-dashoffset 450ms cubic-bezier(0.4, 0, 0.2, 1)',
                filter: `drop-shadow(0 0 7px ${resolvedPalette.glow})`,
              }}
            />
          )}
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center px-2 text-center">
          <span
            className={`text-2xl font-black font-mono tabular-nums tracking-tight leading-none ${
              hasValue ? 'text-white' : 'text-zinc-500'
            }`}
          >
            {displayValue}
          </span>
          {centerCaption && (
            <span className="mt-1 text-[9px] font-mono font-bold uppercase tracking-widest text-zinc-400">
              {centerCaption}
            </span>
          )}
        </div>
      </div>

      {/* Structured Inset Footer Readout */}
      <div className="w-full px-3 py-2 rounded-xl bg-[#16161c]/90 border border-white/[0.06] flex flex-col gap-0.5 text-center group-hover:border-white/[0.12] transition-colors">
        <span className="text-[11px] font-medium text-zinc-200 truncate">{subtitle}</span>
        {detailLine && (
          <div className="flex items-center justify-center gap-1.5 min-w-0">
            <span className={`text-[10px] font-mono tabular-nums truncate ${resolvedPalette.text}`}>
              {detailLine}
            </span>
            {onClick && (
              <span className="text-[10px] text-zinc-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all shrink-0">
                →
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
