import React from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import TabLoadingState from '../../../components/TabLoadingState';
import { PackageData, MarkdownBlock } from '../../../types';

export interface PackageDocsTabProps {
  pkg: PackageData;
  headings: MarkdownBlock[];
  isLoading?: boolean;
}

export default function PackageDocsTab({ pkg, headings, isLoading = false }: PackageDocsTabProps) {
  const blocks = pkg.readmeBlocks || [];
  const hasHeadings = headings && headings.length > 0;

  if (blocks.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="article"
        title={`Loading @workspace/${pkg.id} Documentation`}
        subtitle="Parsing README.md blueprint and indexing section headings..."
      />
    );
  }

  return (
    <div className={`w-full ${hasHeadings ? 'grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[316px_1fr]' : 'flex flex-col'} gap-5 items-start`}>
      {hasHeadings && (
        <TableOfContents headings={headings} title="On this page" className="w-full" />
      )}
      <section className="w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl flex flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#19191d]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">REFERENCE</span>
            <h2 className="text-lg font-bold text-neutral-200">Package Documentation</h2>
          </div>
          <span className="text-xs font-mono text-neutral-400 truncate">
            README.md
          </span>
        </div>
        {blocks.length > 0 ? (
          <div className="prose prose-invert max-w-none text-xs leading-relaxed text-neutral-300">
            <Markdown blocks={blocks} skipFirstHeading />
          </div>
        ) : (
          <div className="p-8 rounded-xl bg-[#111115] border border-white/[0.06] text-center">
            <p className="text-xs text-zinc-400 font-mono">
              No README.md documentation found for @workspace/{pkg.id}.
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
