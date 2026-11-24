import React from 'react';
import Markdown from '../../../components/Markdown';
import { MarkdownBlock } from '../../../types';

export interface DocSnippetsTabProps {
  codeBlocks: MarkdownBlock[];
}

export default function DocSnippetsTab({ codeBlocks }: DocSnippetsTabProps) {
  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#17171c] border border-[#282832] shadow-2xl flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f26]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">CODE EXAMPLES</span>
          <h2 className="text-lg font-bold text-neutral-200">Extracted Implementation Snippets</h2>
        </div>
        <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#17171c] border border-[#282832] text-neutral-300">
          {codeBlocks.length} snippets
        </span>
      </div>

      {codeBlocks.length > 0 ? (
        <div className="flex flex-col gap-4">
          <Markdown blocks={codeBlocks} />
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-[#17171c] border border-[#282832] text-center">
          <p className="text-xs text-neutral-400">No dedicated code snippets found in this guide specification.</p>
        </div>
      )}
    </section>
  );
}
