import React from 'react';
import { ProjectData } from '../../../types';
import ProjectFileExplorer from '../ProjectFileExplorer';

export interface ProjectFilesTabProps {
  project: ProjectData;
  fileTree: string[];
}

export default function ProjectFilesTab({ project, fileTree }: ProjectFilesTabProps) {
  return (
    <section className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
      {/* ── Tab Header Card ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-2xl">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">REPOSITORY STRUCTURE</span>
          <h2 className="text-xl font-bold text-white tracking-tight">Project Directory &amp; Source Files</h2>
          <p className="text-xs text-neutral-400">
            Interactive source code tree, categorized directories, file metadata tags, and quick-copy paths.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#161616] border border-[#262626] text-neutral-300">
            Soul-DevPortal-Projects/{project.id}
          </span>
        </div>
      </div>

      {/* ── Interactive File Explorer ── */}
      <ProjectFileExplorer fileTree={fileTree} projectId={project.id} />
    </section>
  );
}
