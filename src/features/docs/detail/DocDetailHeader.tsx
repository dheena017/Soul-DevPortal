import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { HeroArtworkBackdrop, ProportionalSpectrumBar } from '../../../components/PortalVisuals';
import { GuideMeta } from '../docsConstants';

export type DocDetailTab = 'spec' | 'highlights' | 'snippets' | 'tables';

export interface DocDetailHeaderProps {
  guideMeta: GuideMeta;
  activeTab: DocDetailTab;
  onTabChange: (tab: DocDetailTab) => void;
  headingsCount: number;
  codeBlocksCount: number;
  tablesCount: number;
  activeTitle?: string;
  activeDescription?: string;
  activeIcon?: string;
  activeBadge?: string;
  activeFilename?: string;
  activeTag?: string;
  onBack?: () => void;
}

export default function DocDetailHeader({
  guideMeta,
  activeTab,
  onTabChange,
  headingsCount,
  codeBlocksCount,
  tablesCount,
  activeTitle,
  activeDescription,
  activeIcon,
  activeBadge,
  activeFilename,
  activeTag,
  onBack,
}: DocDetailHeaderProps) {
  const displayTitle = activeTitle || guideMeta.title;
  const displayDescription = activeDescription || guideMeta.description;
  const displayIcon = activeIcon || guideMeta.icon || '📜';
  const displayBadge = activeBadge || guideMeta.badge || 'OFFICIAL SPEC V1.0';
  const displayFilename = activeFilename || guideMeta.filename;

  return (
    <header className="w-full neu-card bg-[#111115] border border-white/[0.08] rounded-2xl p-4 sm:p-5 md:p-6 flex flex-col gap-4 sm:gap-6 portal-header-sheen">
      <HeroArtworkBackdrop src="/visuals/pillar-docs-blueprint.jpg" alt="Documentation Specification Visual" opacityClass="opacity-80 sm:opacity-95" />
      <div className="relative z-10 flex flex-col gap-4 sm:gap-6">
      {/* ── Top Row: Breadcrumb & Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 sm:gap-4 pb-3.5 sm:pb-4 border-b border-white/[0.06]">
        <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs min-w-0">
          {onBack ? (
            <button
              type="button"
              className="neu-btn group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] transition-all font-semibold cursor-pointer"
              onClick={onBack}
              title="Return to docs dashboard"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Docs</span>
            </button>
          ) : (
            <a
              href="#docs"
              className="neu-btn group inline-flex items-center gap-1.5 px-3 py-1.5 sm:px-3.5 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] transition-all font-semibold cursor-pointer"
              title="Return to docs dashboard"
            >
              <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back to Docs</span>
            </a>
          )}
          <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-400 font-medium">Soul Workspace</span>
          <span className="hidden sm:inline text-zinc-600 font-bold px-0.5" aria-hidden="true">›</span>
          <a
            href="#docs"
            className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.06] hover:text-white transition-all text-zinc-300 font-medium"
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              }
            }}
          >
            Pillar 3: Docs Dashboard
          </a>
          <span className="text-zinc-600 font-bold px-0.5" aria-hidden="true">›</span>
          <span className="inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#16161c] border border-white/10 text-zinc-300 font-medium truncate max-w-[175px] sm:max-w-xs">{guideMeta.title}</span>
          {activeTitle && activeTitle !== guideMeta.title && (
            <>
              <span className="text-zinc-600 font-bold px-0.5" aria-hidden="true">›</span>
              <strong className="neu-tile inline-flex items-center px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full bg-[#1e1e28] border border-white/20 text-white font-semibold truncate max-w-[180px] sm:max-w-sm">{displayTitle}</strong>
            </>
          )}
          <span className="neu-tile px-2 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/10 border border-sky-500/25 text-sky-400 inline-flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse"></span>
            <span className="sm:hidden">INSPECTOR</span>
            <span className="hidden sm:inline">SPECIFICATION INSPECTOR</span>
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="neu-tile inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#16161c] border border-white/[0.08] text-xs font-semibold text-zinc-300 select-none">
            <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
            <span>Official Specification · 100% Compliant (9/9 Apps)</span>
          </div>
          <CopyButton
            text={typeof window !== 'undefined' ? window.location.href : ''}
            label="Share link"
            copiedLabel="Link copied!"
            variant="compact"
          />
        </div>
      </div>

      {/* ── Hero Title & 2x2 Balanced Cards Row ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        <div className="flex items-start gap-4 min-w-0">
          <div className="neu-inset w-14 h-14 rounded-2xl bg-[#16161c] border border-white/[0.08] flex items-center justify-center shrink-0 text-2xl portal-emblem-hover">
            {displayIcon}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-sky-500/15 border border-sky-500/30 text-sky-400">
                {displayBadge}
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
                v1.0.0
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-purple-500/15 border border-purple-500/30 text-purple-400">
                {guideMeta.category.toUpperCase()}
              </span>
              {activeTag && (
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  {activeTag}
                </span>
              )}
              {guideMeta.relativeTime && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-mono font-medium bg-[#16161c] border border-white/[0.08] text-zinc-300" title={`Last revised: ${guideMeta.updatedAt || guideMeta.relativeTime}`}>
                  <svg className="w-3 h-3 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  <span>Updated {guideMeta.relativeTime}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{displayTitle}</h1>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-2xl">{displayDescription}</p>
            <div className="text-[11px] font-mono text-zinc-500 flex items-center gap-1.5 mt-0.5">
              <span>📄</span>
              <span className="text-zinc-400">Soul-DevPortal-Docs/{displayFilename}</span>
            </div>
          </div>
        </div>

        {/* 4-Card Balanced Metadata Grid */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 w-full lg:w-auto lg:min-w-[340px] shrink-0 portal-grid-stagger">
          <div className="flex flex-col p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.18] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>📑</span>
              <span>SECTIONS</span>
            </span>
            <strong className="text-base font-bold text-sky-400 font-mono mt-1">{headingsCount} headings</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.18] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>⏱️</span>
              <span>READ TIME</span>
            </span>
            <strong className="text-base font-bold text-amber-400 font-mono mt-1">{guideMeta.readTime}</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.18] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>💻</span>
              <span>CODE EXAMPLES</span>
            </span>
            <strong className="text-base font-bold text-emerald-400 font-mono mt-1">{codeBlocksCount} snippets</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.18] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>📊</span>
              <span>TABLES &amp; MATRICES</span>
            </span>
            <strong className="text-base font-bold text-purple-400 font-mono mt-1">{tablesCount} tables</strong>
          </div>
        </div>
      </div>

      <ProportionalSpectrumBar
        title="SPECIFICATION CONTENT PROFILE"
        segments={[
          { label: 'Headings', value: headingsCount, colorClass: 'bg-sky-400', hex: '#38bdf8' },
          { label: 'Golden Rules', value: guideMeta.keyHighlights.length, colorClass: 'bg-amber-400', hex: '#fbbf24' },
          { label: 'Code Snippets', value: codeBlocksCount, colorClass: 'bg-emerald-400', hex: '#34d399' },
          { label: 'Tables', value: tablesCount, colorClass: 'bg-purple-400', hex: '#c084fc' },
        ]}
      />

      {/* ── Integrated Header Navigation Tabs ── */}
      <div className="pt-2 border-t border-white/[0.06]">
        <div className="flex flex-nowrap sm:flex-wrap items-center gap-1.5 p-1 bg-[#09090c] border border-white/[0.08] rounded-xl overflow-x-auto scrollbar-none" role="tablist" aria-label="Documentation guide sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'spec'}
            className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs transition-all shrink-0 ${
              activeTab === 'spec'
                ? 'text-white font-bold border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('spec')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'spec' ? 'text-white' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Full Specification</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'spec' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold' : 'bg-sky-500/15 text-sky-400 border border-sky-500/30'}`}>
              {headingsCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'highlights'}
            className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs transition-all shrink-0 ${
              activeTab === 'highlights'
                ? 'text-white font-bold border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('highlights')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'highlights' ? 'text-white' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Key Rules &amp; Highlights</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'highlights' ? 'bg-amber-500/25 text-amber-300 border border-amber-500/40 font-bold' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}>
              {guideMeta.keyHighlights.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'snippets'}
            className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs transition-all shrink-0 ${
              activeTab === 'snippets'
                ? 'text-white font-bold border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('snippets')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'snippets' ? 'text-white' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Code Snippets</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'snippets' ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 font-bold' : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'}`}>
              {codeBlocksCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tables'}
            className={`inline-flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-lg text-xs transition-all shrink-0 ${
              activeTab === 'tables'
                ? 'text-white font-bold border border-white/20'
                : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('tables')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'tables' ? 'text-white' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            <span>Tables &amp; Matrices</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'tables' ? 'bg-purple-500/25 text-purple-300 border border-purple-500/40 font-bold' : 'bg-purple-500/15 text-purple-400 border border-purple-500/30'}`}>
              {tablesCount}
            </span>
          </button>
        </div>
      </div>
      </div>
    </header>
  );
}
