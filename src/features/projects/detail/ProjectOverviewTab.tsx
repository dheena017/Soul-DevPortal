import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { ArchitectureFlowDiagram, HeroArtworkBackdrop } from '../../../components/PortalVisuals';
import { ProjectData } from '../../../types';
import { PROJECT_DESCRIPTIONS } from '../projectsConstants';

export interface ProjectOverviewTabProps {
  project: ProjectData;
  featuresList: Array<{ title: string; desc: string }>;
  scriptsCount: number;
  totalDepsCount: number;
  envCount: number;
  runnerCmd: string;
  feUrl: string | null;
  beUrl: string | null;
  fileTree: string[];
  onNavigateToFiles?: () => void;
}

export default function ProjectOverviewTab({
  project,
  featuresList,
  scriptsCount,
  totalDepsCount,
  envCount,
  runnerCmd,
  feUrl,
  beUrl,
  fileTree,
  onNavigateToFiles,
}: ProjectOverviewTabProps) {
  return (
    <div className="w-full flex flex-col gap-6 portal-stagger">
      {/* ── Project Executive Summary ── */}
      <section className="w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-5 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/pillar-projects-topology.jpg" alt="" opacityClass="opacity-68 sm:opacity-84" />
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-3.5 border-b border-white/[0.06]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400">APPLICATION OVERVIEW</span>
            <h2 className="text-xl md:text-2xl font-extrabold text-white uppercase">{project.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-sky-500/12 border border-sky-400/30 text-sky-200">
              {project.framework || 'React 19 + Vite 8 + Tailwind CSS v4'}
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-purple-500/12 border border-purple-400/30 text-purple-200 inline-flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-purple-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg>
              <span>{project.dbInfo || `SQLite (server/data/${project.id}.db)`}</span>
            </span>
            <span className="px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold bg-amber-500/12 border border-amber-400/30 text-amber-200 inline-flex items-center gap-1.5">
              <span>✨</span>
              <span>{project.aiEngine && project.aiEngine !== 'N/A' ? project.aiEngine.split('+')[0].trim() : 'Google Gemini 2.5 Flash'}</span>
            </span>
          </div>
        </div>

        <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-4xl">
          {project.description || PROJECT_DESCRIPTIONS[project.id] || 'Monorepo application fully integrated with shared tooling.'}
        </p>

        {/* Quickstart CLI Terminal Strip */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-zinc-200 flex items-center gap-2">
              <svg className="w-3.5 h-3.5 text-zinc-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg><span>Quickstart CLI Commands</span>
            </span>
            <span className="text-[10px] font-mono text-zinc-500 shrink-0">Run from workspace root</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] font-mono text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-zinc-500 select-none font-bold">$</span>
                <code className="text-zinc-100 text-[11px] truncate select-all font-mono font-semibold">{runnerCmd}</code>
              </div>
              <CopyButton text={runnerCmd} variant="compact" label="Copy" />
            </div>

            <div className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#09090c] border border-white/[0.08] font-mono text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-zinc-500 select-none font-bold">$</span>
                <code className="text-zinc-100 text-[11px] truncate select-all font-mono">cd Soul-DevPortal-Projects/{project.id} &amp;&amp; npm run dev</code>
              </div>
              <CopyButton text={`cd Soul-DevPortal-Projects/${project.id} && npm run dev`} variant="compact" label="Copy" />
            </div>
          </div>
        </div>

        {/* 4-Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 portal-grid-stagger">
          <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">RUNTIME PORTS</span>
            <strong className="text-xs md:text-sm font-bold text-emerald-400 font-mono mt-1 inline-flex items-center gap-1.5">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <span>Client :{project.frontendPort || 'N/A'} {project.backendPort ? `· Server :${project.backendPort}` : ''}</span>
            </strong>
          </div>
          <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">NPM SCRIPTS</span>
            <strong className="text-xs md:text-sm font-bold text-amber-300 font-mono mt-1">{scriptsCount} commands</strong>
          </div>
          <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">DEPENDENCIES</span>
            <strong className="text-xs md:text-sm font-bold text-sky-300 font-mono mt-1">{totalDepsCount} packages</strong>
          </div>
          <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
            <span className="text-[10px] font-mono text-zinc-400 uppercase tracking-wider font-semibold">ENV VARIABLES</span>
            <strong className="text-xs md:text-sm font-bold text-purple-300 font-mono mt-1">{envCount} configured</strong>
          </div>
        </div>
      </section>

      {/* ── Architecture & Port Binding ── */}
      <section className="w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-4 portal-header-sheen">
        <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">SYSTEM DESIGN</span>
          <h2 className="text-lg font-bold text-neutral-200">Runtime Architecture &amp; Port Binding</h2>
        </div>

        <ArchitectureFlowDiagram
          frontendPort={project.frontendPort}
          backendPort={project.backendPort}
          framework={project.framework}
          dbInfo={project.dbInfo}
          aiEngine={project.aiEngine}
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 portal-grid-stagger">
          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-emerald-500/35 gap-3 portal-card-hover">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-neutral-300">Client Tier</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                Port {project.frontendPort || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Framework:</strong> {project.framework || 'Vite React'}</p>
              <p><strong className="text-neutral-300">Dev Command:</strong> <code className="text-[11px] text-neutral-200 font-mono break-all">{project.frontendCmd || 'npm run dev'}</code></p>
              <p><strong className="text-neutral-300">Local URL:</strong> <a href={feUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline break-all">{feUrl || 'Not configured'}</a></p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-indigo-500/35 gap-3 portal-card-hover">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-neutral-300">Server Tier</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                Port {project.backendPort || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Runtime:</strong> {project.backendCmd?.includes('python') ? 'Python (FastAPI / Uvicorn)' : 'Node.js Express / TS'}</p>
              <p><strong className="text-neutral-300">Command:</strong> <code className="text-[11px] text-neutral-200 font-mono break-all">{project.backendCmd || 'Standalone fullstack'}</code></p>
              <p><strong className="text-neutral-300">Local URL:</strong> <a href={beUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline break-all">{beUrl || 'Not configured'}</a></p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-purple-500/35 gap-3 portal-card-hover">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-neutral-300">Persistence</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-300">
                Database
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Engine:</strong> {project.dbInfo || 'Local Storage'}</p>
              <p><strong className="text-neutral-300">Storage Model:</strong> Embedded zero-config SQLite / relational</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-amber-500/35 gap-3 portal-card-hover">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-bold text-neutral-300">AI Intelligence</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#09090c] border border-white/[0.08] text-neutral-300">
                Engine
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Engine:</strong> {project.aiEngine || 'Standard algorithmic processing'}</p>
              <p><strong className="text-neutral-300">Provider:</strong> Google Gemini 2.5 Flash / Multimodal SDK</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Features Card ── */}
      {featuresList.length > 0 && (
        <section className="w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-4 portal-header-sheen">
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.06]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">CAPABILITIES</span>
              <h2 className="text-lg font-bold text-neutral-200">Application Features &amp; Core Workflows</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#16161c] border border-white/[0.08] text-neutral-300">
              {featuresList.length} features active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 portal-grid-stagger">
            {featuresList.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-emerald-500/35 portal-card-hover">
                <span className="w-5 h-5 rounded-full bg-[#09090c] border border-white/[0.08] text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="flex flex-col gap-0.5 min-w-0">
                  <strong className="text-xs font-bold text-neutral-200">{feat.title}</strong>
                  {feat.desc ? <p className="text-xs text-neutral-400">{feat.desc}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Shared Monorepo Packages Integration ── */}
      <section className="w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-4 portal-header-sheen">
        <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">ECOSYSTEM</span>
          <h2 className="text-lg font-bold text-neutral-200">Shared Monorepo Packages Integration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 portal-grid-stagger">
          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] gap-2.5 portal-card-hover">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-bold text-neutral-200">@workspace/logger</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#09090c] border border-white/[0.08] text-neutral-300">
                Telemetry
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> Universal 5-column ANSI terminal &amp; browser console</p>
              <p><strong className="text-neutral-300">Feature:</strong> Vite HMR bridge, sensitive key masking &amp; tracing</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] gap-2.5 portal-card-hover">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-bold text-neutral-200">@workspace/config</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#09090c] border border-white/[0.08] text-neutral-300">
                Foundations
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> Strict TypeScript configuration &amp; Tailwind tokens</p>
              <p><strong className="text-neutral-300">Feature:</strong> Shared presets, Prettier rules, and zero-drift configs</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.2] gap-2.5 portal-card-hover">
            <div className="flex items-center justify-between pb-2 border-b border-white/[0.06]">
              <span className="text-xs font-mono font-bold text-neutral-200">@workspace/runner</span>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#09090c] border border-white/[0.08] text-neutral-300">
                Orchestration
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> CLI dev runner with automatic port conflict guard</p>
              <p><strong className="text-neutral-300">Command:</strong> <code className="text-[11px] text-neutral-200 font-mono break-all">{runnerCmd}</code></p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Repository Structure CTA Banner ── */}
      {fileTree.length > 0 && (
        <section className="group w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] hover:border-white/[0.2] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4 portal-card-hover portal-header-sheen">
          <div className="flex items-center gap-4 min-w-0">
            <div className="w-12 h-12 rounded-xl bg-[#16161c] border border-white/[0.08] flex items-center justify-center text-neutral-400 shrink-0 portal-emblem-hover">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">REPOSITORY STRUCTURE</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-semibold bg-[#16161c] border border-white/[0.08] text-neutral-300">
                  {fileTree.length} indexed items
                </span>
              </div>
              <h3 className="text-base font-bold text-neutral-200">Project Directory &amp; Source Files</h3>
              <p className="text-xs text-neutral-400">
                Explore the complete source tree, client/server split, config assets, and copy relative paths.
              </p>
            </div>
          </div>

          {onNavigateToFiles && (
            <button
              type="button"
              onClick={onNavigateToFiles}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold bg-[#16161c] border border-white/[0.1] text-neutral-200 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] shadow-sm transition-all shrink-0 self-start sm:self-center cursor-pointer"
            >
              <span>Explore File Tree</span>
              <svg className="w-3.5 h-3.5 portal-arrow-glide" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </section>
      )}

      {/* ── Local Services Card ── */}
      {project.localServices && Object.keys(project.localServices).length > 0 && (
        <section className="w-full p-4 sm:p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] shadow-2xl flex flex-col gap-4 portal-header-sheen">
          <div className="flex flex-col gap-0.5 pb-2 border-b border-white/[0.06]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">LOCAL ENDPOINTS</span>
            <h2 className="text-lg font-bold text-neutral-200">Network Services</h2>
          </div>
          <div className="flex flex-col gap-2 portal-list-stagger">
            {Object.entries(project.localServices).map(([serviceName, url]) => (
              <div key={serviceName} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-white/[0.18] text-xs portal-row-hover">
                <span className="font-semibold text-neutral-200">{serviceName}</span>
                <div className="flex items-center gap-2 min-w-0">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-zinc-300 hover:text-white hover:underline font-mono truncate">
                    {url}
                  </a>
                  <CopyButton text={url} variant="compact" />
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
