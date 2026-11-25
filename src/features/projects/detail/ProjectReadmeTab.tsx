import React, { useMemo } from 'react';
import Markdown from '../../../components/Markdown';
import { HeroArtworkBackdrop } from '../../../components/PortalVisuals';
import TableOfContents from '../../../components/TableOfContents';
import TabLoadingState from '../../../components/TabLoadingState';
import { ProjectData } from '../../../types';

export interface ProjectReadmeTabProps {
  project: ProjectData;
  isLoading?: boolean;
}

export default function ProjectReadmeTab({ project, isLoading = false }: ProjectReadmeTabProps) {
  const blocks = project.readmeBlocks || [];
  const headings = useMemo(
    () => blocks.filter((block) => block.type === 'h2' || block.type === 'h3'),
    [blocks]
  );

  if (blocks.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="article"
        title={`Loading ${project.title} README.md`}
        subtitle={`Parsing Soul-DevPortal-Projects/${project.id}/README.md and Table of Contents...`}
      />
    );
  }

  if (blocks.length === 0) {
    return (
      <section className="w-full p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl text-center">
        <p className="text-xs font-mono text-zinc-400">
          No README.md documentation found for {project.title}.
        </p>
      </section>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[300px_1fr] xl:grid-cols-[316px_1fr] gap-6 items-start portal-stagger">
      {headings.length > 0 && (
        <TableOfContents headings={headings} title="On this page" className="w-full" />
      )}
      <section className="w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl flex flex-col gap-4 min-w-0 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/pillar-docs-blueprint.jpg" alt="Project Documentation Blueprint Visual" opacityClass="opacity-28 sm:opacity-38" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-[#19191d]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">REFERENCE</span>
            <h2 className="text-lg font-bold text-neutral-200">Project README.md</h2>
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
