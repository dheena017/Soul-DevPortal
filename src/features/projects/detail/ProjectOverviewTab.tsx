import React from 'react';
import CopyButton from '../../../components/CopyButton';
import ProjectFileExplorer from '../ProjectFileExplorer';
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
}: ProjectOverviewTabProps) {
  return (
    <div className="w-full flex flex-col gap-6">
      {/* ── Project Executive Summary ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">APPLICATION OVERVIEW</span>
            <h2 className="text-xl font-extrabold text-white">{project.title}</h2>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#1a1a1a] border border-[#2c2c2c] text-neutral-200">
              {project.framework || 'Web Application'}
            </span>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#1a1a1a] border border-[#2c2c2c] text-neutral-200">
              🗄️ {project.dbInfo || 'SQLite'}
            </span>
            {project.aiEngine && project.aiEngine !== 'N/A' && (
              <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-sky-500/10 border border-sky-500/25 text-sky-400">
                ✨ {project.aiEngine.split('+')[0].trim()}
              </span>
            )}
          </div>
        </div>

        <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">
          {project.description || PROJECT_DESCRIPTIONS[project.id] || 'Monorepo application fully integrated with shared tooling.'}
        </p>

        {/* 4-Stat Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
          <div className="flex flex-col p-3 rounded-xl bg-[#0e0e0e] border border-[#202020]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">RUNTIME PORTS</span>
            <strong className="text-xs md:text-sm font-bold text-emerald-400 font-mono mt-1">
              Client :{project.frontendPort || 'N/A'} {project.backendPort ? `· Server :${project.backendPort}` : ''}
            </strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#0e0e0e] border border-[#202020]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">NPM SCRIPTS</span>
            <strong className="text-xs md:text-sm font-bold text-sky-400 font-mono mt-1">{scriptsCount} commands</strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#0e0e0e] border border-[#202020]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">DEPENDENCIES</span>
            <strong className="text-xs md:text-sm font-bold text-white font-mono mt-1">{totalDepsCount} packages</strong>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#0e0e0e] border border-[#202020]">
            <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">ENV VARIABLES</span>
            <strong className="text-xs md:text-sm font-bold text-amber-400 font-mono mt-1">{envCount} configured</strong>
          </div>
        </div>
      </section>

      {/* ── Architecture & Port Binding ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 pb-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">SYSTEM DESIGN</span>
          <h2 className="text-lg font-bold text-white">Runtime Architecture &amp; Port Binding</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
              <span className="text-xs font-bold text-white">Client Tier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                Port {project.frontendPort || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Framework:</strong> {project.framework || 'Vite React'}</p>
              <p><strong className="text-neutral-300">Dev Command:</strong> <code className="text-[11px] text-sky-300 font-mono">{project.frontendCmd || 'npm run dev'}</code></p>
              <p><strong className="text-neutral-300">Local URL:</strong> <a href={feUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline">{feUrl || 'Not configured'}</a></p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
              <span className="text-xs font-bold text-white">Server Tier</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-indigo-500/15 border border-indigo-500/30 text-indigo-400">
                Port {project.backendPort || 'N/A'}
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Runtime:</strong> {project.backendCmd?.includes('python') ? 'Python (FastAPI / Uvicorn)' : 'Node.js Express / TS'}</p>
              <p><strong className="text-neutral-300">Command:</strong> <code className="text-[11px] text-indigo-300 font-mono">{project.backendCmd || 'Standalone fullstack'}</code></p>
              <p><strong className="text-neutral-300">Local URL:</strong> <a href={beUrl || '#'} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:underline">{beUrl || 'Not configured'}</a></p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
              <span className="text-xs font-bold text-white">Persistence</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/15 border border-purple-500/30 text-purple-400">
                Database
              </span>
            </div>
            <div className="flex flex-col gap-1.5 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Engine:</strong> {project.dbInfo || 'Local Storage'}</p>
              <p><strong className="text-neutral-300">Storage Model:</strong> Embedded zero-config SQLite / relational</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] gap-3">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
              <span className="text-xs font-bold text-white">AI Intelligence</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/15 border border-amber-500/30 text-amber-400">
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
        <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">CAPABILITIES</span>
              <h2 className="text-lg font-bold text-white">Application Features &amp; Core Workflows</h2>
            </div>
            <span className="px-2.5 py-1 rounded-full text-xs font-mono font-semibold bg-sky-500/10 border border-sky-500/25 text-sky-400">
              {featuresList.length} features active
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {featuresList.map((feat, idx) => (
              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-[#0e0e0e] border border-[#1f1f1f]">
                <span className="w-5 h-5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 flex items-center justify-center text-xs shrink-0 mt-0.5">
                  ✓
                </span>
                <div className="flex flex-col gap-0.5">
                  <strong className="text-xs font-bold text-white">{feat.title}</strong>
                  {feat.desc ? <p className="text-xs text-neutral-400">{feat.desc}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Shared Monorepo Packages Integration ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 pb-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">ECOSYSTEM</span>
          <h2 className="text-lg font-bold text-white">Shared Monorepo Packages Integration</h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
              <span className="text-xs font-mono font-bold text-white">@workspace/logger</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Telemetry
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> Universal 5-column ANSI terminal &amp; browser console</p>
              <p><strong className="text-neutral-300">Feature:</strong> Vite HMR bridge, sensitive key masking &amp; tracing</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
              <span className="text-xs font-mono font-bold text-white">@workspace/config</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/15 border border-sky-500/30 text-sky-400">
                Foundations
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> Strict TypeScript configuration &amp; Tailwind tokens</p>
              <p><strong className="text-neutral-300">Feature:</strong> Shared presets, Prettier rules, and zero-drift configs</p>
            </div>
          </div>

          <div className="flex flex-col p-4 rounded-xl bg-[#0e0e0e] border border-[#222222] gap-2.5">
            <div className="flex items-center justify-between pb-2 border-b border-[#1c1c1c]">
              <span className="text-xs font-mono font-bold text-white">@workspace/runner</span>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                Orchestration
              </span>
            </div>
            <div className="flex flex-col gap-1 text-xs text-neutral-400">
              <p><strong className="text-neutral-300">Role:</strong> CLI dev runner with automatic port conflict guard</p>
              <p><strong className="text-neutral-300">Command:</strong> <code className="text-[11px] text-emerald-300 font-mono">{runnerCmd}</code></p>
            </div>
          </div>
        </div>
      </section>

      {/* ── Interactive Repository File Explorer ── */}
      {fileTree.length > 0 && (
        <section className="w-full flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">REPOSITORY STRUCTURE</span>
              <h2 className="text-lg font-bold text-white">Project Directory &amp; Source Files</h2>
            </div>
            <span className="px-2.5 py-1 rounded-md text-xs font-mono font-semibold bg-[#141414] border border-[#262626] text-neutral-400">
              Soul-DevPortal-Projects/{project.id}
            </span>
          </div>
          <ProjectFileExplorer fileTree={fileTree} projectId={project.id} />
        </section>
      )}

      {/* ── Local Services Card ── */}
      {project.localServices && Object.keys(project.localServices).length > 0 && (
        <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-4">
          <div className="flex flex-col gap-0.5 pb-2 border-b border-[#1f1f1f]">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">LOCAL ENDPOINTS</span>
            <h2 className="text-lg font-bold text-white">Network Services</h2>
          </div>
          <div className="flex flex-col gap-2">
            {Object.entries(project.localServices).map(([serviceName, url]) => (
              <div key={serviceName} className="flex items-center justify-between p-3 rounded-xl bg-[#0e0e0e] border border-[#202020] text-xs">
                <span className="font-semibold text-white">{serviceName}</span>
                <div className="flex items-center gap-2">
                  <a href={url} target="_blank" rel="noopener noreferrer" className="text-sky-400 hover:underline font-mono">
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
