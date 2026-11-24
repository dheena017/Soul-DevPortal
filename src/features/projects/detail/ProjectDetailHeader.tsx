import React from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';
import { PROJECT_LOGOS } from '../projectsConstants';

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
  const logoSrc = project.logo || PROJECT_LOGOS[project.id];

  return (
    <header className="w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-5 md:p-6 shadow-2xl flex flex-col gap-6">
      {/* ── Top Row: Breadcrumb & Actions ── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b border-[#19191d]">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {onBack ? (
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#151519] border border-[#212126] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#151519] transition-all font-semibold shadow-sm"
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
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#151519] border border-[#212126] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 hover:bg-[#151519] transition-all font-semibold shadow-sm"
              title="Back to all projects"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <line x1="19" y1="12" x2="5" y2="12" />
                <polyline points="12 19 5 12 12 5" />
              </svg>
              <span>Back</span>
            </a>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#151519] border border-[#212126] text-neutral-400 font-medium">Soul Workspace</span>
          <span className="text-neutral-600 font-bold px-0.5" aria-hidden="true">›</span>
          <a
            href="#projects"
            className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#151519] border border-[#212126] hover:border-neutral-500 hover:bg-[#151519] hover:text-neutral-200 transition-all text-neutral-300 font-medium"
            onClick={(e) => {
              e.preventDefault();
              onBack?.();
            }}
          >
            Pillar 1: Projects
          </a>
          <span className="text-zinc-600 font-bold px-0.5" aria-hidden="true">›</span>
          <strong className="inline-flex items-center px-3 py-1.5 rounded-full bg-[#1a1a22] border border-white/15 text-white font-semibold shadow-sm truncate max-w-sm uppercase">{project.title}</strong>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              portTesting
                ? 'bg-[#18181f] border-white/10 text-zinc-300 animate-pulse'
                : 'bg-[#16161c] border border-white/[0.1] text-zinc-200 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06]'
            }`}
            onClick={onTestPorts}
            disabled={portTesting}
            title="Probe socket port availability"
          >
            <svg className="w-3.5 h-3.5 text-zinc-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>{portTesting ? 'Probing Ports...' : 'Probe Socket Ports'}</span>
          </button>

          {feUrl && (
            <a
              href={feUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-500/15 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/25 transition-all shadow-[0_0_10px_rgba(16,185,129,0.15)]"
              title="Open Client in Browser"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400"></span>
              </span>
              <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold bg-indigo-500/15 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-500/25 transition-all shadow-[0_0_10px_rgba(99,102,241,0.15)]"
              title="Open Server API"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-indigo-400"></span>
              </span>
              <svg className="w-3.5 h-3.5 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
        <div className="w-14 h-14 rounded-2xl bg-[#16161c] border border-white/[0.1] flex items-center justify-center shrink-0 overflow-hidden shadow-inner p-2">
          {logoSrc ? (
            <img
              src={logoSrc}
              alt={`${project.title} logo`}
              className="w-full h-full object-contain"
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
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white uppercase">{project.title}</h1>
            <code className="px-2 py-0.5 rounded-md bg-[#19191d] border border-neutral-700 text-xs font-mono text-neutral-200 font-semibold">
              {project.id}
            </code>
            <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-mono font-semibold bg-amber-500/15 border border-amber-500/30 text-amber-400">
              v{project.version || '0.0.0'}
            </span>
          </div>
          <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-4xl">
            {project.description || `${project.title} monorepo application powered by ${project.framework || 'standard frontend'}.`}
          </p>
        </div>
      </div>

      {/* ── Port Prober Status Banner (if tested) ── */}
      {portStatus && (
        <div className="flex flex-wrap items-center gap-4 p-3.5 rounded-xl bg-[#16161c] border border-white/[0.1] text-xs text-zinc-100 font-mono">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Client :{project.frontendPort}</span>
            <span className="font-bold text-emerald-400">● {portStatus.fe}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Server :{project.backendPort}</span>
            <span className="font-bold text-indigo-400">● {portStatus.be}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">Latency:</span>
            <span className="font-bold text-amber-300">{portStatus.latency}ms</span>
          </div>
        </div>
      )}

      {/* ── 7 High-Density Project Detail Tabs ── */}
      <div className="w-full flex items-center justify-between border-b border-white/[0.06] pb-px overflow-x-auto scrollbar-none" role="tablist">
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'overview'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'overview'
                ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('overview')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'overview' ? 'text-white' : 'text-neutral-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="7" height="9" />
              <rect x="14" y="3" width="7" height="5" />
              <rect x="14" y="12" width="7" height="9" />
              <rect x="3" y="16" width="7" height="5" />
            </svg>
            <span>Overview</span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'files'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'files'
                ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('files')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'files' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span>Files &amp; Structure</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'files' ? 'bg-sky-500/25 text-sky-200 border border-sky-500/40 font-bold' : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'}`}>
              {fileTreeCount || 9}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'api'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'api'
                ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('api')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'api' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>API &amp; Routes</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'api' ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 font-bold' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
              {project.apiEndpoints?.length || 19}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'database'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'database'
                ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('database')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'database' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>Database &amp; Models</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'database' ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40 font-bold' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'}`}>
              {tablesCount || 1}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'scripts'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'scripts'
                ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('scripts')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'scripts' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>Scripts</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'scripts' ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 font-bold' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>
              {scriptsCount || 10}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'env'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'env'
                ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('env')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'env' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono ${activeTab === 'env' ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40 font-bold' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'}`}>
              {envCount || 42}
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={activeTab === 'readme'}
            className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs transition-all ${
              activeTab === 'readme'
                ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
            }`}
            onClick={() => onTabChange('readme')}
          >
            <svg className={`w-3.5 h-3.5 ${activeTab === 'readme' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
              <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
            </svg>
            <span>Documentation</span>
          </button>
        </div>
      </div>
    </header>
  );
}
