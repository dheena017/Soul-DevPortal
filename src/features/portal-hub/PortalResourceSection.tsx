import React from 'react';
import CopyButton from '../../components/CopyButton';
import { HeroArtworkBackdrop } from '../../components/PortalVisuals';
import { PortalResourceItem } from './portalHubConstants';

export interface PortalResourceSectionProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  accent: 'emerald' | 'amber' | 'sky' | 'purple' | 'rose';
  primaryUrl: string;
  primaryLabel: string;
  items: PortalResourceItem[];
  visualSrc?: string;
}

const ACCENT_STYLES: Record<
  PortalResourceSectionProps['accent'],
  { eyebrow: string; badge: string; border: string; button: string }
> = {
  emerald: {
    eyebrow: 'text-emerald-400',
    badge: 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300',
    border: 'hover:border-emerald-400/40',
    button: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-200 hover:bg-emerald-500/25',
  },
  amber: {
    eyebrow: 'text-amber-400',
    badge: 'bg-amber-500/15 border-amber-500/30 text-amber-300',
    border: 'hover:border-amber-400/40',
    button: 'bg-amber-500/15 border-amber-500/35 text-amber-200 hover:bg-amber-500/25',
  },
  sky: {
    eyebrow: 'text-sky-400',
    badge: 'bg-sky-500/15 border-sky-500/30 text-sky-300',
    border: 'hover:border-sky-400/40',
    button: 'bg-sky-500/15 border-sky-500/35 text-sky-200 hover:bg-sky-500/25',
  },
  purple: {
    eyebrow: 'text-purple-400',
    badge: 'bg-purple-500/15 border-purple-500/30 text-purple-300',
    border: 'hover:border-purple-400/40',
    button: 'bg-purple-500/15 border-purple-500/35 text-purple-200 hover:bg-purple-500/25',
  },
  rose: {
    eyebrow: 'text-rose-400',
    badge: 'bg-rose-500/15 border-rose-500/30 text-rose-300',
    border: 'hover:border-rose-400/40',
    button: 'bg-rose-500/15 border-rose-500/35 text-rose-200 hover:bg-rose-500/25',
  },
};

export default function PortalResourceSection({
  eyebrow,
  title,
  subtitle,
  accent,
  primaryUrl,
  primaryLabel,
  items,
  visualSrc = '/visuals/tab-api-rest.jpg',
}: PortalResourceSectionProps) {
  const st = ACCENT_STYLES[accent];

  return (
    <section className="w-full flex flex-col gap-4 portal-stagger">
      <div className="p-5 rounded-2xl neu-card bg-[#111115] border border-white/[0.08] flex flex-wrap items-center justify-between gap-4 portal-header-sheen">
        <HeroArtworkBackdrop src={visualSrc} alt={title} variant="corner" opacityClass="opacity-40 sm:opacity-55" />
        <div className="relative z-10 flex flex-col gap-1 max-w-2xl">
          <span className={`text-[10px] font-mono font-bold uppercase tracking-wider ${st.eyebrow}`}>
            {eyebrow}
          </span>
          <h2 className="text-lg font-bold text-white">{title}</h2>
          <p className="text-xs text-zinc-400 leading-relaxed">{subtitle}</p>
        </div>
        <a
          href={primaryUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`relative z-10 px-3.5 py-2 rounded-xl text-xs font-bold border transition-all ${st.button}`}
        >
          {primaryLabel} ↗
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 portal-grid-stagger">
        {items.map((item) => (
          <div
            key={item.id}
            className={`p-4 rounded-2xl neu-tile bg-[#121216] border border-white/[0.08] ${st.border} flex flex-col justify-between gap-3.5 portal-card-hover`}
          >
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between gap-2">
                <strong className="text-sm font-bold text-white truncate">{item.title}</strong>
                <span className={`px-2 py-0.5 rounded-md text-[10px] font-mono border shrink-0 ${st.badge}`}>
                  {item.badge}
                </span>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed">{item.description}</p>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
              {item.command && (
                <div className="px-2.5 py-1.5 rounded-lg bg-[#09090c] border border-white/[0.08] flex items-center justify-between gap-2 font-mono text-[11px]">
                  <span className="text-zinc-300 truncate">{item.command}</span>
                  <CopyButton text={item.command} variant="compact" label={item.commandLabel || 'Copy'} />
                </div>
              )}
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono text-[10px] text-zinc-500 truncate max-w-[70%]">{item.url}</span>
                <a
                  href={item.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-sky-300 font-semibold shrink-0"
                >
                  Open ↗
                </a>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
