import React from 'react';
import Markdown from '../../../components/Markdown';
import { HeroArtworkBackdrop } from '../../../components/PortalVisuals';
import TabLoadingState from '../../../components/TabLoadingState';
import { MarkdownBlock } from '../../../types';

export interface DocSnippetsTabProps {
  codeBlocks: MarkdownBlock[];
  isLoading?: boolean;
}

export default function DocSnippetsTab({ codeBlocks, isLoading = false }: DocSnippetsTabProps) {
  if (codeBlocks.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="list"
        title="Extracting Code Snippets"
        subtitle="Indexing implementation examples from specification markdown..."
      />
    );
  }
  return (
    <section className="w-full p-6 md:p-8 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-6 portal-stagger portal-header-sheen">
      <HeroArtworkBackdrop src="/visuals/tab-code-playground.jpg" alt="Code Snippets Synthesis Visual" opacityClass="opacity-70 sm:opacity-85" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 status-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              EXTRACTED IMPLEMENTATION EXAMPLES
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Code Snippets &amp; Configurations</h2>
        </div>
        <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
          {codeBlocks.length} snippets indexed
        </span>
      </div>

      {codeBlocks.length > 0 ? (
        <div className="flex flex-col gap-5">
          <Markdown blocks={codeBlocks} />
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-xs text-zinc-400 font-mono">
            No dedicated code snippets found in this documentation specification.
          </p>
        </div>
      )}
    </section>
  );
}
