import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { GuideMeta } from '../docsConstants';

export type DocDetailTab = 'spec' | 'highlights' | 'snippets' | 'tables';

export interface DocDetailHeaderProps {
  guideMeta: GuideMeta;
  activeTab: DocDetailTab;
  onTabChange: (tab: DocDetailTab) => void;
  headingsCount: number;
  codeBlocksCount: number;
  tablesCount: number;
  onBack?: () => void;
}

export default function DocDetailHeader({
  guideMeta,
  activeTab,
  onTabChange,
  headingsCount,
  codeBlocksCount,
  tablesCount,
  onBack,
}: DocDetailHeaderProps) {
  return (
    <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50 flex flex-col gap-6">
      {/* ── Top Row: Breadcrumb & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1f1f1f]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161616] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#3e3e3e] hover:bg-[#1c1c1c] transition-all font-semibold shadow-sm"
              onClick={onBack}
              title="Return to docs dashboard"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a
              href="#docs"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#161616] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#3e3e3e] hover:bg-[#1c1c1c] transition-all font-semibold shadow-sm"
              title="Return to docs dashboard"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#141414] border border-[#282828] text-neutral-400 font-medium">Soul Workspace</span>
          <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
          <a
            href="#docs"
            className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#161616] border border-[#282828] hover:border-[#383838] hover:bg-[#1c1c1c] hover:text-white transition-all text-neutral-300 font-medium"
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              }
            }}
          >
            Pillar 3: Docs Dashboard
          </a>
          <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
          <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1e1e1e] border border-[#333333] text-white font-semibold shadow-sm truncate max-w-sm">{guideMeta.title}</strong>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>100% Monorepo Compliant (8/8 Apps)</span>
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
          <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center shrink-0 text-2xl shadow-inner icon-3d-float">
            {guideMeta.icon || '📜'}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-sky-500/15 border border-sky-500/30 text-sky-400">
                OFFICIAL SPEC V1.0
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                v1.0.0
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-purple-500/15 border border-purple-500/30 text-purple-400">
                {guideMeta.category.toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{guideMeta.title}</h1>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-2xl">{guideMeta.description}</p>
          </div>
        </div>

        {/* 4-Card Balanced Metadata Grid with 3D Depth */}
        <div className="grid grid-cols-2 gap-3 min-w-[280px] lg:min-w-[340px] shrink-0">
          <div className="card-3d flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>📑</span>
              <span>SECTIONS</span>
            </span>
            <strong className="text-base font-bold text-sky-400 font-mono mt-1">{headingsCount} headings</strong>
          </div>

          <div className="card-3d flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>⏱️</span>
              <span>READ TIME</span>
            </span>
            <strong className="text-base font-bold text-emerald-400 font-mono mt-1">{guideMeta.readTime}</strong>
          </div>

          <div className="card-3d flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>💻</span>
              <span>CODE EXAMPLES</span>
            </span>
            <strong className="text-base font-bold text-purple-400 font-mono mt-1">{codeBlocksCount} snippets</strong>
          </div>

          <div className="card-3d flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>📊</span>
              <span>TABLES &amp; MATRICES</span>
            </span>
            <strong className="text-base font-bold text-amber-400 font-mono mt-1">{tablesCount} tables</strong>
          </div>
        </div>
      </div>

      {/* ── Integrated Header Navigation Tabs ── */}
      <div className="pt-2 border-t border-[#1f1f1f]">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0c0c0c] border border-[#222222] rounded-xl shadow-[inset_0_1px_3px_rgba(0,0,0,0.6)]" role="tablist" aria-label="Documentation guide sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'spec'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'spec'
                ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/40 shadow-[0_2px_8px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616] hover:border-[#262626] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('spec')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'spec' ? 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Full Specification</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'spec' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold' : 'bg-[#161616] text-neutral-400 border border-[#262626]'}`}>
              {headingsCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'highlights'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'highlights'
                ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/40 shadow-[0_2px_8px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616] hover:border-[#262626] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('highlights')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'highlights' ? 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Key Rules &amp; Highlights</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'highlights' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold' : 'bg-[#161616] text-neutral-400 border border-[#262626]'}`}>
              {guideMeta.keyHighlights.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'snippets'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'snippets'
                ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/40 shadow-[0_2px_8px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616] hover:border-[#262626] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('snippets')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'snippets' ? 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Code Snippets</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'snippets' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold' : 'bg-[#161616] text-neutral-400 border border-[#262626]'}`}>
              {codeBlocksCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tables'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'tables'
                ? 'bg-sky-500/15 text-sky-400 font-bold border border-sky-500/40 shadow-[0_2px_8px_rgba(56,189,248,0.18),inset_0_1px_0_rgba(255,255,255,0.08)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616] hover:border-[#262626] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('tables')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'tables' ? 'text-sky-400 drop-shadow-[0_0_6px_rgba(56,189,248,0.4)]' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            <span>Tables &amp; Matrices</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'tables' ? 'bg-sky-500/25 text-sky-300 border border-sky-500/40 font-bold' : 'bg-[#161616] text-neutral-400 border border-[#262626]'}`}>
              {tablesCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
