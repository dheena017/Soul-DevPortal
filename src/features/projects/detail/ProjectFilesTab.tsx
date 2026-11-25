import React from 'react';
import { ProjectData } from '../../../types';
import ProjectFileExplorer from '../ProjectFileExplorer';
import TabLoadingState from '../../../components/TabLoadingState';

export interface ProjectFilesTabProps {
  project: ProjectData;
  fileTree: string[];
  isLoading?: boolean;
}

export default function ProjectFilesTab({ project, fileTree, isLoading = false }: ProjectFilesTabProps) {
  if (fileTree.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="list"
        title={`Scanning ${project.title} File Tree`}
        subtitle={`Indexing directories and source files in Soul-DevPortal-Projects/${project.id}...`}
      />
    );
  }
  return (
    <section className="w-full flex flex-col gap-4 animate-in fade-in duration-200">
      {/* ── Tab Header Card ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-5 md:p-6 rounded-2xl bg-[#151519] border border-[#212126] shadow-2xl">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">REPOSITORY STRUCTURE</span>
          <h2 className="text-xl font-bold text-neutral-200 tracking-tight">Project Directory &amp; Source Files</h2>
          <p className="text-xs text-neutral-400">
            Interactive source code tree, categorized directories, file metadata tags, and quick-copy paths.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#151519] border border-[#212126] text-neutral-300">
            Soul-DevPortal-Projects/{project.id}
          </span>
        </div>
      </div>

      {/* ── Interactive File Explorer ── */}
      <ProjectFileExplorer fileTree={fileTree} projectId={project.id} />
    </section>
  );
}
