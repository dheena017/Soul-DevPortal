import React from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import { MarkdownBlock } from '../../../types';
import { GuideMeta } from '../docsConstants';

export interface DocSpecTabProps {
  headings: MarkdownBlock[];
  finalBlocks: MarkdownBlock[];
  guideMeta: GuideMeta;
}

export default function DocSpecTab({ headings, finalBlocks, guideMeta }: DocSpecTabProps) {
  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-5 items-start">
      <TableOfContents headings={headings} title="On this page" className="w-full" />
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl flex flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1a1a1a]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">DOCUMENTATION SPECIFICATION</span>
            <h2 className="text-lg font-bold text-neutral-200">{guideMeta.title}</h2>
          </div>
          <span className="text-xs font-mono text-neutral-400 truncate">
            Soul-DevPortal-Docs/{guideMeta.filename}
          </span>
        </div>
        <div className="prose prose-invert max-w-none text-xs leading-relaxed text-neutral-300">
          <Markdown blocks={finalBlocks || []} skipFirstHeading />
        </div>
      </section>
    </div>
  );
}
