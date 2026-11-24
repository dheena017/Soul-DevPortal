import React, { useMemo } from 'react';
import Markdown from '../../../components/Markdown';
import TableOfContents from '../../../components/TableOfContents';
import { ProjectData } from '../../../types';

export interface ProjectReadmeTabProps {
  project: ProjectData;
}

export default function ProjectReadmeTab({ project }: ProjectReadmeTabProps) {
  const blocks = project.readmeBlocks || [];
  const headings = useMemo(
    () => blocks.filter((block) => block.type === 'h2' || block.type === 'h3'),
    [blocks]
  );

  if (blocks.length === 0) {
    return null;
  }

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      {headings.length > 0 && (
        <TableOfContents headings={headings} title="On this page" />
      )}
      <section className="flex-1 w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#1a1a1a]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-400">REFERENCE</span>
            <h2 className="text-lg font-bold text-white">Project README.md</h2>
          </div>
          <span className="text-xs font-mono text-neutral-500 truncate">
            Soul-DevPortal-Projects/{project.id}/README.md
          </span>
        </div>
        <div className="prose prose-invert max-w-none text-xs leading-relaxed text-neutral-300">
          <Markdown blocks={blocks} skipFirstHeading />
        </div>
      </section>
    </div>
  );
}
