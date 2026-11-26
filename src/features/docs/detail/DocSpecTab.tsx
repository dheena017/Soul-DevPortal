import React from 'react';
import Markdown from '../../../components/Markdown';
import { HeroArtworkBackdrop } from '../../../components/PortalVisuals';
import TableOfContents from '../../../components/TableOfContents';
import TabLoadingState from '../../../components/TabLoadingState';
import { MarkdownBlock } from '../../../types';
import { GuideMeta } from '../docsConstants';

export interface DocSpecTabProps {
  headings: MarkdownBlock[];
  finalBlocks: MarkdownBlock[];
  guideMeta: GuideMeta;
  activeTitle?: string;
  activeFilename?: string;
  isLoading?: boolean;
}

export default function DocSpecTab({
  headings,
  finalBlocks,
  guideMeta,
  activeTitle,
  activeFilename,
  isLoading = false,
}: DocSpecTabProps) {
  const hasHeadings = headings && headings.length > 0;
  const displayTitle = activeTitle || `${guideMeta.title} — Full Specification`;
  const displayFilename = activeFilename || guideMeta.mainFile || `${guideMeta.folder}/main.md`;

  if ((!finalBlocks || finalBlocks.length === 0) && isLoading) {
    return (
      <TabLoadingState
        variant="article"
        title={`Loading ${displayTitle}`}
        subtitle={`Fetching Soul-DevPortal-Docs/${displayFilename}...`}
      />
    );
  }

  return (
    <div
      className={`w-full ${
        hasHeadings ? 'grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[316px_1fr]' : 'flex flex-col'
      } gap-6 items-start portal-stagger`}
    >
      {hasHeadings && (
        <TableOfContents headings={headings} title="On this page" className="w-full" />
      )}
      <section className="w-full p-4 sm:p-6 md:p-8 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-5 sm:gap-6 min-w-0 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/pillar-docs-blueprint.jpg" alt="" variant="corner" opacityClass="opacity-45 sm:opacity-58" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-sky-400 status-pulse"></span>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
                MASTER SPECIFICATION BLUEPRINT
              </span>
            </div>
            <h2 className="text-xl font-extrabold text-white tracking-tight">{displayTitle}</h2>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-white/[0.04] border border-white/[0.08] text-zinc-400 truncate">
            Soul-DevPortal-Docs/{displayFilename}
          </span>
        </div>
        <div className="w-full">
          {finalBlocks && finalBlocks.length > 0 ? (
            <Markdown blocks={finalBlocks} skipFirstHeading />
          ) : (
            <div className="p-12 text-center text-zinc-500 font-mono text-xs">
              No content found for this specification.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
