import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';

export type ProjectDetailTab = 'overview' | 'files' | 'api' | 'scripts' | 'database' | 'env' | 'readme';

export interface ProjectDetailHeaderProps {
  project: ProjectData;
  activeTab: ProjectDetailTab;
  onTabChange: (tab: ProjectDetailTab) => void;
  portTesting: boolean;
  portStatus: { fe: string; be: string; latency: number } | null;
  onTestPorts: () => void;
  fileTreeCount: number;
  tablesCount: number;
  scriptsCount: number;
  envCount: number;
  feUrl: string | null;
  beUrl: string | null;
  onBack?: () => void;
}

export default function ProjectDetailHeader({
  project,
  activeTab,
  onTabChange,
  portTesting,
  portStatus,
  onTestPorts,
  fileTreeCount,
  tablesCount,
  scriptsCount,
  envCount,
  feUrl,
  beUrl,
  onBack,
}: ProjectDetailHeaderProps) {
  return (
    <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col gap-6">
      {/* ── Top Row: Breadcrumb & Actions ── */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1f1f1f]">
        <div className="flex flex-wrap items-center gap-3 text-xs">
          {onBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#3a3a3a] transition-all font-semibold"
              onClick={onBack}
              title="Back to all projects"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </button>
          ) : (
            <a
              href="#projects"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#3a3a3a] transition-all font-semibold"
              title="Back to all projects"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <div className="w-[1px] h-4 bg-neutral-800" aria-hidden="true" />
          <nav className="flex items-center gap-2 text-neutral-400" aria-label="Breadcrumb navigation">
            <span className="font-medium text-neutral-400">Soul Workspace</span>
            <span className="text-neutral-600 font-bold">/</span>
            <a
              href="#projects"
              className="hover:text-white transition-colors"
              onClick={(e) => {
                e.preventDefault();
                onBack?.();
              }}
            >
              Pillar 1: Projects
            </a>
            <span className="text-neutral-600 font-bold">/</span>
            <strong className="text-white font-bold">{project.title}</strong>
          </nav>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              portTesting
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 animate-pulse'
                : 'bg-[#181818] border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#444444]'
            }`}
            onClick={onTestPorts}
            disabled={portTesting}
            title="Probe socket port availability"
          >
            <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>{portTesting ? 'Probing Ports...' : 'Probe Socket Ports'}</span>
          </button>

          {feUrl && (
            <a
              href={feUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20 transition-all shadow-sm"
              title="Open Client in Browser"
            >
              <span className="w-2 h-2 rounded-full bg-emerald-400" aria-hidden="true" />
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
              <span>Launch Client :{project.frontendPort}</span>
            </a>
          )}
          {beUrl && (
            <a
              href={beUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-indigo-500/10 border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/20 transition-all shadow-sm"
              title="Open Server API"
            >
              <span className="w-2 h-2 rounded-full bg-indigo-400" aria-hidden="true" />
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="2" y="2" width="20" height="8" rx="2" ry="2" />
                <rect x="2" y="14" width="20" height="8" rx="2" ry="2" />
                <line x1="6" y1="6" x2="6.01" y2="6" />
                <line x1="6" y1="18" x2="6.01" y2="18" />
              </svg>
              <span>Launch Server :{project.backendPort}</span>
            </a>
          )}
          <CopyButton text={window.location.href} label="Share link" copiedLabel="Link copied!" variant="compact" />
        </div>
      </div>

      {/* ── Title & Identifiers Row ── */}
      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center shrink-0 overflow-hidden shadow-inner">
          {project.logo ? (
            <img
              src={project.logo}
              alt={`${project.title} logo`}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.currentTarget as HTMLElement).style.display = 'none';
              }}
            />
          ) : (
            <span className="text-2xl">⚡</span>
          )}
        </div>
        <div className="flex flex-col gap-2 min-w-0">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">{project.title}</h1>
            <code className="px-2 py-0.5 rounded-md bg-[#1c1c1c] border border-[#2c2c2c] text-xs font-mono text-neutral-300 font-semibold">
              {project.id}
            </code>
            {project.version && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
                v{project.version}
              </span>
            )}
          </div>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">
            {project.description || `${project.title} monorepo application powered by ${project.framework || 'standard frontend'}.`}
          </p>
          <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
            <span className="text-[11px] font-mono font-bold tracking-wider text-neutral-500 uppercase">CONSUMES:</span>
            <a href="#packages/logger" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#181818] border border-[#282828] text-neutral-400 hover:text-sky-400 hover:border-sky-500/30 transition-all font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
              <span>@workspace/logger</span>
            </a>
            <a href="#packages/config" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#181818] border border-[#282828] text-neutral-400 hover:text-sky-400 hover:border-sky-500/30 transition-all font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-sky-400" aria-hidden="true" />
              <span>@workspace/config</span>
            </a>
            <a href="#packages/runner" className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-[#181818] border border-[#282828] text-neutral-400 hover:text-sky-400 hover:border-sky-500/30 transition-all font-mono text-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
              <span>@workspace/runner</span>
            </a>
          </div>
        </div>
      </div>

      {/* ── Port Prober Status Banner (if tested) ── */}
      {portStatus && (
        <div className="flex flex-wrap items-center gap-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-xs text-emerald-300 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Client :{project.frontendPort}</span>
            <span className="font-bold text-emerald-400">● {portStatus.fe}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Server :{project.backendPort}</span>
            <span className="font-bold text-emerald-400">● {portStatus.be}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-400">Latency:</span>
            <span className="font-bold text-white">{portStatus.latency}ms</span>
          </div>
        </div>
      )}

      {/* ── Modern Navigation Tabs Bar ── */}
      <div className="pt-2 border-t border-[#1f1f1f]">
        <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#0c0c0c] border border-[#222222] rounded-xl" role="tablist" aria-label="Project sections">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
            }`}
            onClick={() => onTabChange('overview')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>Overview</span>
          </button>

          {fileTreeCount > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'files'}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'files'
                  ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
              }`}
              onClick={() => onTabChange('files')}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
              </svg>
              <span>Files &amp; Structure</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'files' ? 'bg-[#333333] text-white' : 'bg-[#181818] text-neutral-400 border border-[#2c2c2c]'}`}>
                {fileTreeCount}
              </span>
            </button>
          )}

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'api'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'api'
                ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
            }`}
            onClick={() => onTabChange('api')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>API &amp; Routes</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'api' ? 'bg-[#333333] text-white' : 'bg-[#181818] text-neutral-400 border border-[#2c2c2c]'}`}>
              {project.apiEndpoints?.length || (project.backendPort ? 1 : 0)}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'database'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'database'
                ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
            }`}
            onClick={() => onTabChange('database')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>Database &amp; Models</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'database' ? 'bg-[#333333] text-white' : 'bg-[#181818] text-neutral-400 border border-[#2c2c2c]'}`}>
              {tablesCount || 1}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scripts'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'scripts'
                ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
            }`}
            onClick={() => onTabChange('scripts')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>Scripts</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'scripts' ? 'bg-[#333333] text-white' : 'bg-[#181818] text-neutral-400 border border-[#2c2c2c]'}`}>
              {scriptsCount}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'env'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
              activeTab === 'env'
                ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
                : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
            }`}
            onClick={() => onTabChange('env')}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" />
              <line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" />
              <line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" />
              <line x1="20" y1="12" x2="20" y2="3" />
              <line x1="1" y1="14" x2="7" y2="14" />
              <line x1="9" y1="8" x2="15" y2="8" />
              <line x1="17" y1="16" x2="23" y2="16" />
            </svg>
            <span>Environment</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${activeTab === 'env' ? 'bg-[#333333] text-white' : 'bg-[#181818] text-neutral-400 border border-[#2c2c2c]'}`}>
              {envCount}
            </span>
          </button>

          {project.readmeBlocks && project.readmeBlocks.length > 0 && (
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === 'readme'}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === 'readme'
                  ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
                  : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
              }`}
              onClick={() => onTabChange('readme')}
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
              </svg>
              <span>Documentation</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
