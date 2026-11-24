import React from 'react';
import CopyButton from '../../../components/CopyButton';
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
    <div className="w-full flex flex-col gap-6">
      {/* ── Project Executive Summary ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col gap-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#21262d]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">APPLICATION OVERVIEW</span>
            <h2 className="text-xl font-extrabold text-white">{project.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#21262d] border border-neutral-700 text-neutral-200">
              {project.framework || 'Web Application'}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#21262d] border border-neutral-700 text-neutral-200">
              <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3"/><path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5"/></svg><span>{project.dbInfo || 'SQLite'}</span>
            </span>
            {project.aiEngine && project.aiEngine !== 'N/A' && (
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#161b22] border border-[#30363d] text-neutral-300">
                ✨ {project.aiEngine.split('+')[0].trim()}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs md:text-sm text-neutral-300 leading-relaxed max-w-4xl">
          {project.description || PROJECT_DESCRIPTIONS[project.id] || 'Monorepo application fully integrated with shared tooling.'}
        </p>

        {/* Quickstart CLI Terminal Strip */}
        <div className="flex flex-col gap-2 pt-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-neutral-300 flex items-center gap-1.5">
              <svg className="w-3.5 h-3.5 text-neutral-300 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="4 17 10 11 4 5"/><line x1="12" y1="19" x2="20" y2="19"/></svg><span>Quickstart CLI Commands</span>
            </span>
            <span className="text-[10px] font-mono text-neutral-500">Run from workspace root</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            <div className="flex items-center justify-between gap-2 p-2.5 px-3 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-neutral-500 select-none font-bold">$</span>
                <code className="text-neutral-100 text-[11px] truncate select-all font-mono font-medium">{runnerCmd}</code>
              </div>
              <CopyButton text={runnerCmd} variant="compact" label="Copy" />
            </div>

            <div className="flex items-center justify-between gap-2 p-2.5 px-3 rounded-xl bg-[#0d1117] border border-[#30363d] font-mono text-xs">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <span className="text-neutral-500 select-none font-bold">$</span>
                <code className="text-neutral-300 text-[11px] truncate select-all">cd Soul-DevPortal-Projects/{project.id} &amp;&amp; npm run dev</code>
              </div>
              <CopyButton text={`cd Soul-DevPortal-Projects/${project.id} && npm run dev`} variant="compact" label="Copy" />
            </div>
          </div>
        </div>

        {/* 4-Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="flex flex-col p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">RUNTIME PORTS</span>
            <strong className="text-xs md:text-sm font-bold text-neutral-200 font-mono mt-1">
              Client :{project.frontendPort || 'N/A'} {project.backendPort ? `· Server :${project.backendPort}` : ''}
            </strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">NPM SCRIPTS</span>
            <strong className="text-xs md:text-sm font-bold text-neutral-200 font-mono mt-1">{scriptsCount} commands</strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">DEPENDENCIES</span>
            <strong className="text-xs md:text-sm font-bold text-neutral-200 font-mono mt-1">{totalDepsCount} packages</strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">ENV VARIABLES</span>
            <strong className="text-xs md:text-sm font-bold text-neutral-300 font-mono mt-1">{envCount} configured</strong>
          </div>
        </div>
      </section>

      {/* ── Architecture & Port Binding ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 pb-2 border-b border-[#21262d]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">SYSTEM DESIGN</span>
          <h2 className="text-lg font-bold text-neutral-200">Runtime Architecture &amp; Port Binding</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
              <span className="text-xs font-bold text-neutral-300">Client Tier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
                Port {project.frontendPort || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Framework:</strong> {project.framework || 'Vite React'}</p>
              <p><strong className="text-neutral-300">Dev Command:</strong> <code className="text-[11px] text-neutral-200 font-mono">{project.frontendCmd || 'npm run dev'}</code></p>
              <p><strong className="text-neutral-300">Local URL:</strong> <a href={feUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline">{feUrl || 'Not configured'}</a></p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
              <span className="text-xs font-bold text-neutral-300">Server Tier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
                Port {project.backendPort || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Runtime:</strong> {project.backendCmd?.includes('python') ? 'Python (FastAPI / Uvicorn)' : 'Node.js Express / TS'}</p>
              <p><strong className="text-neutral-300">Command:</strong> <code className="text-[11px] text-neutral-200 font-mono">{project.backendCmd || 'Standalone fullstack'}</code></p>
              <p><strong className="text-neutral-300">Local URL:</strong> <a href={beUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline">{beUrl || 'Not configured'}</a></p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
              <span className="text-xs font-bold text-neutral-300">Persistence</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
                Database
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Engine:</strong> {project.dbInfo || 'Local Storage'}</p>
              <p><strong className="text-neutral-300">Storage Model:</strong> Embedded zero-config SQLite / relational</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
              <span className="text-xs font-bold text-neutral-300">AI Intelligence</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
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
        <section className="w-full p-5 md:p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">CAPABILITIES</span>
              <h2 className="text-lg font-bold text-neutral-200">Application Features &amp; Core Workflows</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-[#161b22] border border-[#30363d] text-neutral-300">
              {featuresList.length} features active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featuresList.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
                <span className="w-5 h-5 rounded-full bg-[#161b22] border border-[#30363d] text-neutral-300 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-xs font-bold text-neutral-200">{feat.title}</strong>
                  {feat.desc ? <p className="text-xs text-neutral-400">{feat.desc}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Shared Monorepo Packages Integration ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 pb-2 border-b border-[#21262d]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">ECOSYSTEM</span>
          <h2 className="text-lg font-bold text-neutral-200">Shared Monorepo Packages Integration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
              <span className="text-xs font-mono font-bold text-neutral-300">@workspace/logger</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
                Telemetry
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> Universal 5-column ANSI terminal &amp; browser console</p>
              <p><strong className="text-neutral-300">Feature:</strong> Vite HMR bridge, sensitive key masking &amp; tracing</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
              <span className="text-xs font-mono font-bold text-neutral-300">@workspace/config</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
                Foundations
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> Strict TypeScript configuration &amp; Tailwind tokens</p>
              <p><strong className="text-neutral-300">Feature:</strong> Shared presets, Prettier rules, and zero-drift configs</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#161b22] border border-[#30363d] gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#21262d]">
              <span className="text-xs font-mono font-bold text-neutral-300">@workspace/runner</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
                Orchestration
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> CLI dev runner with automatic port conflict guard</p>
              <p><strong className="text-neutral-300">Command:</strong> <code className="text-[11px] text-neutral-200 font-mono">{runnerCmd}</code></p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Repository Structure CTA Banner ── */}
      {fileTree.length > 0 && (
        <section className="w-full p-5 md:p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-[#161b22] border border-[#30363d] flex items-center justify-center text-neutral-400 shrink-0">
              <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <div className="flex flex-col gap-0.5">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">REPOSITORY STRUCTURE</span>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-mono font-semibold bg-[#161b22] border border-[#30363d] text-neutral-300">
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold bg-[#161b22] border border-[#30363d] text-neutral-300 font-bold hover:text-neutral-100 hover:border-neutral-500 shadow-sm border border-[#30363d] transition-all shrink-0 self-start sm:self-center"
            >
              <span>Explore File Tree</span>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          )}
        </section>
      )}

      {/* ── Local Services Card ── */}
      {project.localServices && Object.keys(project.localServices).length > 0 && (
        <section className="w-full p-5 md:p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col gap-4">
          <div className="flex flex-col gap-0.5 pb-2 border-b border-[#21262d]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">LOCAL ENDPOINTS</span>
            <h2 className="text-lg font-bold text-neutral-200">Network Services</h2>
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(project.localServices).map(([serviceName, url]) => (
              <div key={serviceName} className="flex items-center justify-between p-3 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-neutral-500 transition-all text-xs">
                <span className="font-semibold text-neutral-300">{serviceName}</span>
                <div className="flex items-center gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-neutral-300 hover:underline font-mono">
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
