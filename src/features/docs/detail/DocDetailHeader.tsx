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
    <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col gap-6">
      {/* ── Top Row: Breadcrumb & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1a1a1a]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#222222] text-neutral-300 hover:text-white hover:border-blue-500/40 hover:bg-[#111111] transition-all font-semibold shadow-sm"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#111111] border border-[#222222] text-neutral-300 hover:text-white hover:border-blue-500/40 hover:bg-[#111111] transition-all font-semibold shadow-sm"
              title="Return to docs dashboard"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111111] border border-[#222222] text-neutral-400 font-medium">Soul Workspace</span>
          <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
          <a
            href="#docs"
            className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111111] border border-[#222222] hover:border-blue-500/40 hover:bg-[#111111] hover:text-white transition-all text-neutral-300 font-medium"
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
          <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#111111] border border-[#222222] text-white font-semibold shadow-sm truncate max-w-sm">{guideMeta.title}</strong>
        </div>

        <div className="flex items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/40 text-xs font-semibold text-blue-400 select-none shadow-sm">
            <span className="w-2 h-2 rounded-full bg-blue-400" aria-hidden="true" />
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
          <div className="w-14 h-14 rounded-2xl bg-[#111111] border border-[#222222] flex items-center justify-center shrink-0 text-2xl shadow-inner">
            {guideMeta.icon || '📜'}
          </div>

          <div className="flex flex-col gap-2 min-w-0">
            <div className="flex flex-wrap items-center gap-2.5">
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-blue-500/15 border border-blue-500/30 text-blue-400">
                OFFICIAL SPEC V1.0
              </span>
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-blue-500/10 border border-blue-500/30 text-blue-400">
                v1.0.0
              </span>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-blue-500/15 border border-[#222222] text-blue-400">
                {guideMeta.category.toUpperCase()}
              </span>
            </div>

            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{guideMeta.title}</h1>
            <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-2xl">{guideMeta.description}</p>
          </div>
        </div>

        {/* 4-Card Balanced Metadata Grid */}
        <div className="grid grid-cols-2 gap-3 min-w-[280px] lg:min-w-[340px] shrink-0">
          <div className="flex flex-col p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-blue-500/40 transition-all">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>📑</span>
              <span>SECTIONS</span>
            </span>
            <strong className="text-base font-bold text-blue-400 font-mono mt-1">{headingsCount} headings</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-blue-500/40 transition-all">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>⏱️</span>
              <span>READ TIME</span>
            </span>
            <strong className="text-base font-bold text-blue-400 font-mono mt-1">{guideMeta.readTime}</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#222222] transition-all">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>💻</span>
              <span>CODE EXAMPLES</span>
            </span>
            <strong className="text-base font-bold text-blue-400 font-mono mt-1">{codeBlocksCount} snippets</strong>
          </div>

          <div className="flex flex-col p-3 rounded-xl bg-[#111111] border border-[#222222] hover:border-[#222222] transition-all">
            <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider flex items-center gap-1">
              <span>📊</span>
              <span>TABLES &amp; MATRICES</span>
            </span>
            <strong className="text-base font-bold text-neutral-300 font-mono mt-1">{tablesCount} tables</strong>
          </div>
        </div>
      </div>

      {/* ── Integrated Header Navigation Tabs ── */}
      <div className="pt-2 border-t border-[#1a1a1a]">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0a0a0a] border border-[#222222] rounded-xl" role="tablist" aria-label="Documentation guide sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'spec'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'spec'
                ? 'bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('spec')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'spec' ? 'text-blue-400' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Full Specification</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'spec' ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}`}>
              {headingsCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'highlights'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'highlights'
                ? 'bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('highlights')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'highlights' ? 'text-blue-400' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
            </svg>
            <span>Key Rules &amp; Highlights</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'highlights' ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}`}>
              {guideMeta.keyHighlights.length}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'snippets'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'snippets'
                ? 'bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('snippets')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'snippets' ? 'text-blue-400' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="16 18 22 12 16 6" />
              <polyline points="8 6 2 12 8 18" />
            </svg>
            <span>Code Snippets</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'snippets' ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}`}>
              {codeBlocksCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'tables'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'tables'
                ? 'bg-blue-500/15 text-blue-400 font-bold border border-blue-500/40 shadow-[0_2px_8px_rgba(59,130,246,0.18)]'
                : 'text-neutral-400 hover:text-white hover:bg-[#111111] hover:border-[#222222] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('tables')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'tables' ? 'text-blue-400' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
              <line x1="3" y1="9" x2="21" y2="9" />
              <line x1="3" y1="15" x2="21" y2="15" />
              <line x1="12" y1="3" x2="12" y2="21" />
            </svg>
            <span>Tables &amp; Matrices</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'tables' ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 font-bold' : 'bg-[#111111] text-neutral-400 border border-[#222222]'}`}>
              {tablesCount}
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}
