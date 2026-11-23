import React from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import { PackageData, MarkdownBlock } from '../../../types';

export interface PackageDocsTabProps {
  pkg: PackageData;
  headings: MarkdownBlock[];
}

export default function PackageDocsTab({ pkg, headings }: PackageDocsTabProps) {
  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      <TableOfContents headings={headings} title="On this page" />
      <section className="flex-1 w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1f1f1f]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">REFERENCE</span>
            <h2 className="text-lg font-bold text-white">Package Documentation</h2>
          </div>
          <span className="text-xs font-mono text-neutral-500 truncate">
            README.md
          </span>
        </div>
        <div className="prose prose-invert max-w-none text-xs leading-relaxed text-neutral-300">
          <Markdown blocks={pkg.readmeBlocks || []} skipFirstHeading />
        </div>
      </section>
    </div>
  );
}
