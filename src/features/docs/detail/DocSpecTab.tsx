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
  const hasHeadings = headings && headings.length > 0;

  return (
    <div className={`w-full ${hasHeadings ? 'grid grid-cols-1 lg:grid-cols-[280px_1fr]' : 'flex flex-col'} gap-5 items-start`}>
      {hasHeadings && (
        <TableOfContents headings={headings} title="On this page" className="w-full" />
      )}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl flex flex-col gap-4 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#19191d]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">DOCUMENTATION SPECIFICATION</span>
            <h2 className="text-lg font-bold text-neutral-200">{guideMeta.title}</h2>
          </div>
          <span className="text-xs font-mono text-neutral-400 truncate">
            Soul-DevPortal-Docs/{guideMeta.filename}
          </span>
        </div>
        <div className="prose prose-invert max-w-none text-xs leading-relaxed text-neutral-300">
          {finalBlocks && finalBlocks.length > 0 ? (
            <Markdown blocks={finalBlocks} skipFirstHeading />
          ) : (
            <div className="p-8 text-center text-neutral-500 font-mono text-xs">
              No content found for this specification.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
