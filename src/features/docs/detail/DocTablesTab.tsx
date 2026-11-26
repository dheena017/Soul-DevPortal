import React from 'react';
import Markdown from '../../../components/Markdown';
import { HeroArtworkBackdrop } from '../../../components/PortalVisuals';
import TabLoadingState from '../../../components/TabLoadingState';
import { MarkdownBlock } from '../../../types';

export interface DocTablesTabProps {
  tables: MarkdownBlock[];
  isLoading?: boolean;
}

export default function DocTablesTab({ tables, isLoading = false }: DocTablesTabProps) {
  if (tables.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="list"
        title="Extracting Configuration Matrices"
        subtitle="Indexing markdown tables and schemas..."
      />
    );
  }
  return (
    <section className="w-full p-6 md:p-8 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-6 portal-stagger portal-header-sheen">
      <HeroArtworkBackdrop src="/visuals/tab-database-wal.jpg" alt="Specification Matrices & Tables Visual" variant="corner" opacityClass="opacity-45 sm:opacity-58" />
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-white/[0.06]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-purple-400 status-pulse"></span>
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
              SPECIFICATION MATRICES &amp; SCHEMAS
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight">Tables &amp; Configuration Matrices</h2>
        </div>
        <span className="px-3 py-1 rounded-md text-xs font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
          {tables.length} tables indexed
        </span>
      </div>

      {tables.length > 0 ? (
        <div className="flex flex-col gap-5 overflow-x-auto">
          <Markdown blocks={tables} />
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-white/[0.02] border border-white/[0.06] text-center">
          <p className="text-xs text-zinc-400 font-mono">
            No structured tables found in this documentation specification.
          </p>
        </div>
      )}
    </section>
  );
}
