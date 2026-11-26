import React, { useEffect, useRef, useState } from 'react';
import { ProjectData } from '../types';
import { PROJECT_LOGOS, PROJECT_BRAND_MAP, formatProjectTitle } from '../features/projects/projectsConstants';

/**
 * Animated 4-bar equalizer indicator for Header Live status & Telemetry strips.
 */
export function HeaderEqualizerBars({ active = true, tone = 'emerald' }: { active?: boolean; tone?: 'emerald' | 'sky' | 'amber' }) {
  const fillClass =
    tone === 'sky' ? 'bg-sky-400' : tone === 'amber' ? 'bg-amber-400' : 'bg-emerald-400';

  if (!active) {
    return (
      <span className="inline-flex items-end gap-[2px] h-3 shrink-0" aria-hidden="true">
        <span className="w-[2px] h-1 bg-zinc-600 rounded-full" />
        <span className="w-[2px] h-1.5 bg-zinc-600 rounded-full" />
        <span className="w-[2px] h-1 bg-zinc-600 rounded-full" />
      </span>
    );
  }

  return (
    <span className="inline-flex items-end gap-[2px] h-3 shrink-0" aria-hidden="true">
      <span className={`w-[2px] h-2.5 rounded-full portal-eq-bar ${fillClass}`} style={{ animationDelay: '0ms' }} />
      <span className={`w-[2px] h-3 rounded-full portal-eq-bar ${fillClass}`} style={{ animationDelay: '180ms' }} />
      <span className={`w-[2px] h-2 rounded-full portal-eq-bar ${fillClass}`} style={{ animationDelay: '360ms' }} />
      <span className={`w-[2px] h-2.5 rounded-full portal-eq-bar ${fillClass}`} style={{ animationDelay: '520ms' }} />
    </span>
  );
}

/**
 * Compact radial progress ring for Header CPU chip & System Header telemetry.
 */
export function MiniRadialRing({
  percent,
  color = '#38bdf8',
  size = 16,
}: {
  percent: number;
  color?: string;
  size?: number;
}) {
  const clamped = Math.max(0, Math.min(100, percent));
  const r = 6;
  const circumference = 2 * Math.PI * r;
  const offset = circumference - (clamped / 100) * circumference;

  return (
    <svg width={size} height={size} viewBox="0 0 16 16" className="shrink-0 -rotate-90" aria-hidden="true">
      <circle cx="8" cy="8" r={r} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="2.2" />
      <circle
        cx="8"
        cy="8"
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.55s cubic-bezier(0.16, 1, 0.3, 1)' }}
      />
    </svg>
  );
}

/**
 * Blended right-side artwork canvas rendered inside Hero Header cards (or capped header corner in sections) without reducing text contrast.
 */
export function HeroArtworkBackdrop({
  src,
  alt,
  opacityClass,
  variant = 'banner',
}: {
  src: string;
  alt: string;
  opacityClass?: string;
  variant?: 'banner' | 'corner';
}) {
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  const effectiveOpacity =
    opacityClass ?? (variant === 'corner' ? 'opacity-45 sm:opacity-58' : 'opacity-58 sm:opacity-74');

  const containerClass =
    variant === 'corner'
      ? 'portal-hero-art-corner absolute top-0 right-0 h-32 sm:h-40 w-[72%] sm:w-[58%] lg:w-[46%] overflow-hidden pointer-events-none select-none rounded-tr-2xl z-0'
      : 'portal-hero-art-wrap absolute inset-y-0 right-0 w-[80%] sm:w-[70%] lg:w-[62%] overflow-hidden pointer-events-none select-none rounded-r-2xl z-0';

  return (
    <div className={containerClass} aria-hidden="true">
      {failed && (
        <div className="absolute inset-0 bg-gradient-to-bl from-sky-500/12 via-purple-500/8 to-transparent" />
      )}
      {!failed && (
        <img
          src={src}
          alt={alt}
          loading="eager"
          decoding="sync"
          fetchPriority="high"
          onError={() => setFailed(true)}
          className={`w-full h-full object-cover object-right portal-hero-art ${effectiveOpacity}`}
        />
      )}
      <div className="absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-[#0d0f15]/75 via-[#0d0f15]/25 to-transparent pointer-events-none" />
    </div>
  );
}

/**
 * Eager project logo renderer with automatic fallback icon instead of empty/broken image states.
 */
export function ProjectLogoImage({
  src,
  alt = '',
  fallbackIcon = '⚡',
  className = 'w-full h-full object-cover',
  fallbackClassName = 'text-base',
}: {
  src?: string;
  alt?: string;
  fallbackIcon?: string;
  className?: string;
  fallbackClassName?: string;
}) {
  const [failed, setFailed] = useState<boolean>(false);

  useEffect(() => {
    setFailed(false);
  }, [src]);

  if (!src || failed) {
    return <span className={fallbackClassName}>{fallbackIcon}</span>;
  }

  return (
    <img
      src={src}
      alt={alt}
      loading="eager"
      decoding="async"
      onError={() => setFailed(true)}
      className={className}
    />
  );
}

/**
 * Interactive App Logo Avatar Fleet Strip showcasing monorepo project brand marks.
 */
export function ProjectLogoFleetStrip({
  projects,
  onSelectProject,
  maxItems = 8,
}: {
  projects: ProjectData[];
  onSelectProject: (projectId: string) => void;
  maxItems?: number;
}) {
  const list = projects.slice(0, maxItems);
  if (list.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2 pt-1">
      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400 mr-1">
        LIVE FLEET APPS:
      </span>
      <div className="flex flex-wrap items-center gap-1.5 portal-grid-stagger">
        {list.map((proj) => {
          const logoSrc = proj.logo || PROJECT_LOGOS[proj.id];
          const brand = PROJECT_BRAND_MAP[proj.id];
          const label = formatProjectTitle(proj.id, proj.title);
          return (
            <button
              key={proj.id}
              type="button"
              onClick={() => onSelectProject(proj.id)}
              title={`${label} (FE :${proj.frontendPort || '—'}${proj.backendPort ? ` / BE :${proj.backendPort}` : ''})`}
              className="group inline-flex items-center gap-1.5 pl-1 pr-2 py-1 rounded-full bg-[#16161c]/90 border border-white/[0.1] hover:border-white/[0.3] hover:bg-[#1e1e26] hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer shadow-sm"
            >
              <span
                className="w-5 h-5 rounded-full flex items-center justify-center overflow-hidden border shrink-0 bg-[#0d0d12]"
                style={{ borderColor: brand ? `${brand.themeColor}55` : 'rgba(255,255,255,0.16)' }}
              >
                <ProjectLogoImage
                  src={logoSrc}
                  alt=""
                  fallbackIcon={brand?.icon || '⚡'}
                  className="w-full h-full object-cover portal-visual-zoom"
                  fallbackClassName="text-[10px]"
                />
              </span>
              <span className="text-[11px] font-mono font-semibold text-zinc-300 group-hover:text-white transition-colors truncate max-w-[96px]">
                {brand?.shortName || proj.id}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export interface SpectrumSegment {
  label: string;
  value: number;
  colorClass: string;
  hex: string;
}

/**
 * Multi-segment animated visual ratio bar with crisp legend pills for tabs and headers.
 */
export function ProportionalSpectrumBar({
  title,
  segments,
}: {
  title?: string;
  segments: SpectrumSegment[];
}) {
  const total = segments.reduce((acc, s) => acc + Math.max(0, s.value), 0);
  if (total === 0) return null;

  return (
    <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#131318]/90 border border-white/[0.08]">
      <div className="flex flex-wrap items-center justify-between gap-2">
        {title && (
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
            {title}
          </span>
        )}
        <div className="flex flex-wrap items-center gap-3 text-[11px] font-mono">
          {segments
            .filter((s) => s.value > 0)
            .map((seg) => (
              <span key={seg.label} className="inline-flex items-center gap-1.5 text-zinc-300">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: seg.hex }} />
                <span>{seg.label}</span>
                <strong className="text-white tabular-nums">{seg.value}</strong>
              </span>
            ))}
        </div>
      </div>
      <div className="w-full h-2 rounded-full bg-[#09090c] border border-white/[0.06] overflow-hidden flex gap-0.5 p-[1px]">
        {segments
          .filter((s) => s.value > 0)
          .map((seg) => {
            const pct = Math.max(3, (seg.value / total) * 100);
            return (
              <div
                key={seg.label}
                className={`h-full rounded-full ${seg.colorClass} transition-all duration-500`}
                style={{ width: `${pct}%` }}
                title={`${seg.label}: ${seg.value} (${Math.round((seg.value / total) * 100)}%)`}
              />
            );
          })}
      </div>
    </div>
  );
}

/**
 * Live Animated Architecture Flow Visual for Project Detail Header & Overview Tab.
 */
export function ArchitectureFlowDiagram({
  frontendPort,
  backendPort,
  framework,
  dbInfo,
  aiEngine,
  compact = false,
}: {
  frontendPort?: number | null;
  backendPort?: number | null;
  framework?: string;
  dbInfo?: string;
  aiEngine?: string;
  compact?: boolean;
}) {
  const nodes = [
    {
      title: 'Client UI',
      sub: frontendPort ? `:${frontendPort}` : 'Vite',
      accent: 'border-emerald-500/35 bg-emerald-500/10 text-emerald-300',
      dot: 'bg-emerald-400',
      icon: '🖥️',
    },
    {
      title: backendPort ? 'FastAPI / API' : 'Standalone App',
      sub: backendPort ? `:${backendPort}` : (framework?.split('+')[0]?.trim() || 'SPA'),
      accent: 'border-indigo-500/35 bg-indigo-500/10 text-indigo-300',
      dot: 'bg-indigo-400',
      icon: '⚡',
    },
    {
      title: 'SQLite WAL',
      sub: dbInfo ? dbInfo.split('(')[0].trim() : 'Local DB',
      accent: 'border-purple-500/35 bg-purple-500/10 text-purple-300',
      dot: 'bg-purple-400',
      icon: '🗄️',
    },
    {
      title: 'AI / Engine',
      sub: aiEngine && aiEngine !== 'N/A' ? aiEngine.split('+')[0].trim() : 'Gemini 2.5',
      accent: 'border-amber-500/35 bg-amber-500/10 text-amber-300',
      dot: 'bg-amber-400',
      icon: '✨',
    },
  ];

  return (
    <div className={`w-full rounded-xl bg-[#0b0b0f]/95 border border-white/[0.08] ${compact ? 'p-2.5' : 'p-4'} overflow-x-auto`}>
      <div className="flex items-center justify-between gap-2 min-w-[540px]">
        {nodes.map((node, idx) => (
          <React.Fragment key={node.title}>
            <div className={`flex-1 flex items-center gap-2.5 ${compact ? 'px-2.5 py-2' : 'px-3 py-2.5'} rounded-xl border ${node.accent} portal-card-hover min-w-0`}>
              <span className="text-base shrink-0 portal-emblem-hover">{node.icon}</span>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white truncate flex items-center gap-1.5">
                  <span className={`w-1.5 h-1.5 rounded-full ${node.dot} status-pulse shrink-0`} />
                  <span className="truncate">{node.title}</span>
                </span>
                <span className="text-[10px] font-mono opacity-85 truncate">{node.sub}</span>
              </div>
            </div>
            {idx < nodes.length - 1 && (
              <svg className="w-8 h-4 shrink-0 text-sky-400/70" viewBox="0 0 32 16" fill="none" aria-hidden="true">
                <line x1="2" y1="8" x2="26" y2="8" stroke="currentColor" strokeWidth="1.6" className="portal-flow-dash" />
                <polyline points="22 4 27 8 22 12" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}
