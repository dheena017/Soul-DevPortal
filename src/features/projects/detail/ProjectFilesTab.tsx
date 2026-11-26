import React, { useMemo } from 'react';
import { HeroArtworkBackdrop, ProportionalSpectrumBar } from '../../../components/PortalVisuals';
import { ProjectData } from '../../../types';
import ProjectFileExplorer from '../ProjectFileExplorer';
import TabLoadingState from '../../../components/TabLoadingState';

export interface ProjectFilesTabProps {
  project: ProjectData;
  fileTree: string[];
  isLoading?: boolean;
}

export default function ProjectFilesTab({ project, fileTree, isLoading = false }: ProjectFilesTabProps) {
  const fileComposition = useMemo(() => {
    let tsReact = 0;
    let python = 0;
    let configJson = 0;
    let other = 0;
    for (const p of fileTree) {
      const low = p.toLowerCase();
      if (low.endsWith('.ts') || low.endsWith('.tsx') || low.endsWith('.js') || low.endsWith('.jsx')) tsReact++;
      else if (low.endsWith('.py')) python++;
      else if (low.endsWith('.json') || low.endsWith('.toml') || low.endsWith('.yaml') || low.endsWith('.yml') || low.includes('.env')) configJson++;
      else other++;
    }
    return { tsReact, python, configJson, other };
  }, [fileTree]);

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
    <section className="w-full flex flex-col gap-4 animate-in fade-in duration-200 portal-stagger">
      {/* ── Tab Header Card ── */}
      <div className="flex flex-col gap-4 p-5 md:p-6 rounded-2xl neu-card bg-[#151519] border border-white/[0.08] portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/tab-code-playground.jpg" alt="Repository Source Code Visual" variant="corner" opacityClass="opacity-45 sm:opacity-58" />
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">REPOSITORY STRUCTURE</span>
            <h2 className="text-xl font-bold text-neutral-200 tracking-tight">Project Directory &amp; Source Files</h2>
            <p className="text-xs text-neutral-400">
              Interactive source code tree, categorized directories, file metadata tags, and quick-copy paths.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="neu-tile px-3 py-1.5 rounded-lg text-xs font-mono font-semibold bg-[#151519] border border-[#212126] text-neutral-300">
              Soul-DevPortal-Projects/{project.id}
            </span>
          </div>
        </div>
        <ProportionalSpectrumBar
          title="SOURCE FILE COMPOSITION"
          segments={[
            { label: 'TS / React / JS', value: fileComposition.tsReact, colorClass: 'bg-sky-400', hex: '#38bdf8' },
            { label: 'Python Modules', value: fileComposition.python, colorClass: 'bg-amber-400', hex: '#fbbf24' },
            { label: 'JSON / Config', value: fileComposition.configJson, colorClass: 'bg-emerald-400', hex: '#34d399' },
            { label: 'Docs & Assets', value: fileComposition.other, colorClass: 'bg-purple-400', hex: '#c084fc' },
          ]}
        />
      </div>

      {/* ── Interactive File Explorer ── */}
      <ProjectFileExplorer fileTree={fileTree} projectId={project.id} />
    </section>
  );
}
