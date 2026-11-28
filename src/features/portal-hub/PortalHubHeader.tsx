import React, { useCallback, useEffect, useRef, useState } from 'react';
import CopyButton from '../../components/CopyButton';
import { HeroArtworkBackdrop } from '../../components/PortalVisuals';
import { GITHUB_REPO_URL, PortalHubTab } from './portalHubConstants';

export interface PortalHubHeaderProps {
  packageCount: number;
  activeTab: PortalHubTab;
  onSelectTab: (tab: PortalHubTab) => void;
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
  onOpenShortcuts?: () => void;
}

const HUB_TABS: Array<{ id: PortalHubTab; label: string }> = [
  { id: 'github', label: 'GitHub' },
  { id: 'leetcode', label: 'LeetCode' },
  { id: 'gcloud', label: 'Google Cloud' },
  { id: 'ai', label: 'AI Consoles' },
  { id: 'devops', label: 'DevOps & Cloud' },
  { id: 'docsref', label: 'Docs & Refs' },
  { id: 'design', label: 'Design & UI' },
  { id: 'apidb', label: 'API & DB' },
  { id: 'security', label: 'Security & QA' },
  { id: 'containers', label: 'Containers' },
  { id: 'learning', label: 'System Design' },
  { id: 'media3d', label: 'Media & 3D' },
  { id: 'cli', label: 'CLI & Terminal' },
  { id: 'monitoring', label: 'Monitoring' },
  { id: 'pkgmgrs', label: 'Build & Tooling' },
];

export default function PortalHubHeader({
  packageCount,
  activeTab,
  onSelectTab,
  onNavigate,
  onBack,
  onOpenShortcuts,
}: PortalHubHeaderProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const [canLeft, setCanLeft] = useState(false);
  const [canRight, setCanRight] = useState(false);

  const updateScrollButtons = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setCanLeft(el.scrollLeft > 4);
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollButtons();
    window.addEventListener('resize', updateScrollButtons);
    return () => window.removeEventListener('resize', updateScrollButtons);
  }, [updateScrollButtons]);

  const scrollTabs = (delta: number) => {
    scrollRef.current?.scrollBy({ left: delta, behavior: 'smooth' });
  };

  return (
    <header className="w-full neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col gap-5 portal-header-sheen">
      <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="Developer Hub & Platform Consoles" />
      <div className="relative z-10 flex flex-col gap-5">
        {/* Top Breadcrumb Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
          <div className="flex items-center gap-2 text-xs min-w-0">
            <button
              type="button"
              onClick={() => (onBack ? onBack() : onNavigate('overview'))}
              className="neu-btn group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-200 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] transition-all font-semibold cursor-pointer"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 12H5M12 19l-7-7 7-7" />
              </svg>
              <span>Back to Overview</span>
            </button>
            <span className="neu-tile hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-400 font-medium">
              Soul Workspace
            </span>
            <span className="text-zinc-600 font-bold px-0.5" aria-hidden="true">›</span>
            <strong className="neu-tile inline-flex items-center px-2.5 py-1 rounded-full bg-[#1e1e28] border border-white/15 text-white font-semibold truncate">
              Developer Hub &amp; Consoles
            </strong>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenShortcuts && (
              <button
                type="button"
                onClick={onOpenShortcuts}
                className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-sky-500/15 border border-sky-400/35 text-sky-200 hover:bg-sky-500/25 transition-all cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <rect x="2" y="3" width="20" height="14" rx="2" />
                  <line x1="8" y1="21" x2="16" y2="21" />
                  <line x1="12" y1="17" x2="12" y2="21" />
                </svg>
                <span>Desktop App .exe</span>
              </button>
            )}
            <CopyButton text={`git clone ${GITHUB_REPO_URL}.git`} label="Clone Monorepo" copiedLabel="Clone CMD Copied!" variant="compact" />
            <a
              href={GITHUB_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="neu-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              <span>Open GitHub</span>
              <span className="portal-arrow-glide">↗</span>
            </a>
          </div>
        </div>

        {/* Identity */}
        <div className="flex flex-col gap-1.5">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
              Developer Hub &amp; Platform Consoles
            </h1>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
              15 Developer Workbenches
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-3xl">
            Organized launchpad for GitHub repositories &amp; packages, LeetCode DSA practice, Google Cloud Console,
            AI model providers, and DevOps hosting dashboards.
          </p>
        </div>

        {/* 4-Metric Quick Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 portal-grid-stagger">
          <div className="flex flex-col p-3.5 rounded-xl neu-tile bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">GITHUB</span>
            <strong className="text-xl font-extrabold text-purple-300 font-mono mt-1">2 Repos</strong>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5">{packageCount || 78} npm packages</span>
          </div>
          <div className="flex flex-col p-3.5 rounded-xl neu-tile bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">LEETCODE</span>
            <strong className="text-xl font-extrabold text-amber-300 font-mono mt-1">DSA &amp; SQL</strong>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5">Study plans &amp; contests</span>
          </div>
          <div className="flex flex-col p-3.5 rounded-xl neu-tile bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">GOOGLE CLOUD</span>
            <strong className="text-xl font-extrabold text-sky-300 font-mono mt-1">GCP Console</strong>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5">Cloud Run · BigQuery · GCS</span>
          </div>
          <div className="flex flex-col p-3.5 rounded-xl neu-tile bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">AI &amp; DEVOPS</span>
            <strong className="text-xl font-extrabold text-emerald-300 font-mono mt-1">12 Consoles</strong>
            <span className="text-[11px] text-zinc-400 font-mono mt-0.5">AI Studio · Vercel · npm</span>
          </div>
        </div>

        {/* Integrated Hub Tabs with Left / Right Scroll */}
        <div className="relative flex items-center gap-1.5 w-full">
          <button
            type="button"
            onClick={() => scrollTabs(-260)}
            disabled={!canLeft}
            aria-label="Scroll tabs left"
            className={`shrink-0 w-8 h-9 rounded-xl border flex items-center justify-center text-sm font-bold transition-all ${
              canLeft
                ? 'bg-[#16161c] border-white/[0.12] text-white hover:bg-white/[0.08] cursor-pointer'
                : 'bg-[#09090c] border-white/[0.05] text-zinc-600 cursor-not-allowed opacity-50'
            }`}
          >
            ‹
          </button>

          <div
            ref={scrollRef}
            onScroll={updateScrollButtons}
            className="flex-1 min-w-0 flex flex-nowrap items-center gap-1.5 p-1 neu-tray bg-[#09090c] border border-white/[0.08] rounded-xl overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            role="tablist"
            aria-label="Developer hub sections"
          >
            {HUB_TABS.map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={(e) => {
                    onSelectTab(tab.id);
                    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
                  }}
                  className={`shrink-0 whitespace-nowrap px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'text-white font-bold border border-white/20 bg-[#1a1a22]'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>

          <button
            type="button"
            onClick={() => scrollTabs(260)}
            disabled={!canRight}
            aria-label="Scroll tabs right"
            className={`shrink-0 w-8 h-9 rounded-xl border flex items-center justify-center text-sm font-bold transition-all ${
              canRight
                ? 'bg-[#16161c] border-white/[0.12] text-white hover:bg-white/[0.08] cursor-pointer'
                : 'bg-[#09090c] border-white/[0.05] text-zinc-600 cursor-not-allowed opacity-50'
            }`}
          >
            ›
          </button>
        </div>
      </div>
    </header>
  );
}
