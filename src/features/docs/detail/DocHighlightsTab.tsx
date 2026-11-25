import React from 'react';
import Markdown from '../../../components/Markdown';
import { HeroArtworkBackdrop, ProportionalSpectrumBar } from '../../../components/PortalVisuals';
import TableOfContents from '../../../components/TableOfContents';
import TabLoadingState from '../../../components/TabLoadingState';
import { MarkdownBlock } from '../../../types';
import { GuideMeta } from '../docsConstants';

export interface DocHighlightsTabProps {
  guideMeta: GuideMeta;
  goldenRulesBlocks?: MarkdownBlock[];
  headings?: MarkdownBlock[];
  activeTitle?: string;
  activeFilename?: string;
  isLoading?: boolean;
}

export default function DocHighlightsTab({
  guideMeta,
  goldenRulesBlocks = [],
  headings = [],
  activeTitle,
  activeFilename,
  isLoading = false,
}: DocHighlightsTabProps) {
  const hasHeadings = headings && headings.length > 0;
  const hasGoldenRulesContent = goldenRulesBlocks && goldenRulesBlocks.length > 0;
  const displayTitle = activeTitle || `${guideMeta.title} — Golden Architectural Invariants`;
  const displayFilename = activeFilename || guideMeta.rulesFile || `${guideMeta.folder}/golden-rules.md`;

  return (
    <div className="w-full flex flex-col gap-6 portal-stagger">
      {/* ── Key Rules & Highlights Card: Compliance & Authoritative Mandates ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl flex flex-col gap-6 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/pillar-docs-blueprint.jpg" alt="" opacityClass="opacity-28 sm:opacity-40" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#19191d]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
              KEY RULES &amp; HIGHLIGHTS
            </span>
            <h2 className="text-lg font-bold text-neutral-200">Mandatory Standards Checklist</h2>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#151519] border border-[#212126] text-amber-300">
            {guideMeta.keyHighlights.length} core rules active
          </span>
        </div>

        <ProportionalSpectrumBar
          title="SPECIFICATION COMPLIANCE BREAKDOWN"
          segments={[
            { label: 'Key Rules', value: guideMeta.keyHighlights.length, colorClass: 'bg-amber-400', hex: '#fbbf24' },
            { label: 'Golden Sections', value: headings.length || 6, colorClass: 'bg-sky-400', hex: '#38bdf8' },
            { label: 'Content Blocks', value: goldenRulesBlocks.length || 12, colorClass: 'bg-emerald-400', hex: '#34d399' },
          ]}
        />

        {/* Top Audience & Compliance Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 portal-grid-stagger">
          <div className="flex flex-col p-4 rounded-xl bg-[#0d0d10] border border-[#212126] hover:border-neutral-500 gap-2 portal-card-hover">
            <div className="flex items-center gap-2">
              <span className="text-base">🎯</span>
              <h3 className="text-xs font-bold text-neutral-200">Target Audience</h3>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {guideMeta.targetAudience}
            </p>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#0d0d10] border border-[#212126] hover:border-neutral-500 gap-2 portal-card-hover">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-base">🛡️</span>
                <h3 className="text-xs font-bold text-neutral-200">Compliance Mandate</h3>
              </div>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/30 text-amber-300">
                Enforced
              </span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              {guideMeta.complianceStatus}
            </p>
          </div>
        </div>

        {/* Key Highlights Checklist Card */}
        <div className="flex flex-col gap-3 pt-2">
          <div className="flex items-center gap-2 pb-1">
            <span className="text-xs font-bold text-neutral-300">Authoritative Highlights</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 portal-grid-stagger">
            {guideMeta.keyHighlights.map((hl, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 p-3.5 rounded-xl bg-[#0d0d10] border border-[#212126] hover:border-amber-500/40 portal-card-hover"
              >
                <span className="w-5 h-5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-xs font-bold text-neutral-200">Rule #{idx + 1}</strong>
                  <p className="text-xs text-neutral-300 leading-relaxed">{hl}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Complete Golden Rules Markdown Specification (golden-rules.md) ── */}
      {!hasGoldenRulesContent && isLoading && (
        <TabLoadingState
          variant="article"
          title={`Loading ${displayTitle}`}
          subtitle={`Fetching Soul-DevPortal-Docs/${displayFilename}...`}
        />
      )}
      {hasGoldenRulesContent && (
        <div
          className={`w-full ${
            hasHeadings ? 'grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[316px_1fr]' : 'flex flex-col'
          } gap-5 items-start`}
        >
          {hasHeadings && (
            <TableOfContents headings={headings} title="Golden Invariants" className="w-full" />
          )}
          <section className="w-full p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl flex flex-col gap-4 min-w-0 portal-header-sheen">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#19191d]">
              <div className="flex flex-col gap-0.5">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">
                  GOLDEN INVARIANTS &amp; ENGINEERING RULES
                </span>
                <h2 className="text-lg font-bold text-neutral-200">{displayTitle}</h2>
              </div>
              <span className="text-xs font-mono text-neutral-400 truncate">
                Soul-DevPortal-Docs/{displayFilename}
              </span>
            </div>
            <div className="prose prose-invert max-w-none text-xs leading-relaxed text-neutral-300">
              <Markdown blocks={goldenRulesBlocks} skipFirstHeading />
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
