import React, { useMemo, useState } from 'react';
import CopyButton from './CopyButton';
import {
  ArchitectureFlowDiagram,
  HeroArtworkBackdrop,
  ProjectLogoFleetStrip,
  ProjectLogoImage,
  ProportionalSpectrumBar,
} from './PortalVisuals';
import { PackageData, ProjectData } from '../types';
import {
  PROJECT_BRAND_MAP,
  PROJECT_LOGOS,
  formatProjectTitle,
} from '../features/projects/projectsConstants';
import { DOCUMENTATION_GUIDES_REGISTRY } from '../features/docs/docsConstants';

export interface PortalHubViewProps {
  projects?: ProjectData[];
  packages?: PackageData[];
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
}

type PortalHubTab = 'endpoints' | 'repositories' | 'api' | 'blueprint';

const GITHUB_REPO_URL = 'https://github.com/dheena017/Soul-DevPortal';

const PORTAL_API_ROUTES = [
  { method: 'GET', path: '/api/health', desc: 'FastAPI portal health & SQLite WAL status' },
  { method: 'GET', path: '/api/workspace', desc: 'Full monorepo AST + package + docs payload' },
  { method: 'GET', path: '/api/projects/list-all', desc: 'All workspace micro-apps & live port status' },
  { method: 'GET', path: '/api/packages/list-all', desc: 'Shared TypeScript & Python library manifests' },
  { method: 'GET', path: '/api/docs/list-all', desc: 'Architecture specs & golden rules registry' },
  { method: 'GET', path: '/api/system/overview?window_sec=300', desc: 'Hardware specs + live host telemetry snapshot' },
  { method: 'GET', path: '/api/system/stream?interval_ms=1000', desc: 'Real-time Server-Sent Events (SSE) telemetry feed' },
  { method: 'GET', path: '/api/soul-dev-portal/commands', desc: 'Canonical workspace CLI runner definitions' },
];

export default function PortalHubView({
  projects = [],
  packages = [],
  onNavigate,
  onBack,
}: PortalHubViewProps) {
  const [activeTab, setActiveTab] = useState<PortalHubTab>('endpoints');
  const [filterText, setFilterText] = useState<string>('');

  const { fullstackCount, liveFeCount, liveBeCount } = useMemo(() => {
    let fullstack = 0;
    let feLive = 0;
    let beLive = 0;
    for (const p of projects) {
      if (p.frontendPort && p.backendPort) fullstack++;
      if (Boolean(p.frontend?.isLive ?? p.frontendActive)) feLive++;
      if (Boolean(p.backend?.isLive ?? p.backendActive)) beLive++;
    }
    return { fullstackCount: fullstack, liveFeCount: feLive, liveBeCount: beLive };
  }, [projects]);

  const filteredProjects = useMemo(() => {
    const needle = filterText.trim().toLowerCase();
    if (!needle) return projects;
    return projects.filter((p) =>
      [
        p.id,
        p.title,
        p.framework,
        p.dbInfo,
        p.frontendPort?.toString(),
        p.backendPort?.toString(),
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [projects, filterText]);

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 portal-stagger">
      {/* ── Hero Banner ── */}
      <header className="w-full bg-[#111115] border border-white/[0.08] rounded-2xl p-4 sm:p-5 md:p-6 shadow-2xl flex flex-col gap-5 portal-header-sheen">
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="Developer Hub & GitHub Mesh" />
        <div className="relative z-10 flex flex-col gap-5">
          {/* Top Breadcrumb Row */}
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.08]">
            <div className="flex items-center gap-2 text-xs min-w-0">
              <button
                type="button"
                onClick={() => (onBack ? onBack() : onNavigate('overview'))}
                className="group inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-200 hover:text-white hover:border-white/[0.2] hover:bg-white/[0.06] transition-all font-semibold shadow-sm cursor-pointer"
              >
                <svg className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M19 12H5M12 19l-7-7 7-7" />
                </svg>
                <span>Back to Overview</span>
              </button>
              <span className="hidden sm:inline-flex items-center px-2.5 py-1 rounded-full bg-[#16161c] border border-white/[0.08] text-zinc-400 font-medium">Soul Workspace</span>
              <span className="text-zinc-600 font-bold px-0.5" aria-hidden="true">›</span>
              <strong className="inline-flex items-center px-2.5 py-1 rounded-full bg-[#1e1e28] border border-white/15 text-white font-semibold shadow-sm truncate">
                Developer Hub &amp; GitHub Links
              </strong>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <CopyButton text={`git clone ${GITHUB_REPO_URL}.git`} label="Clone Monorepo" copiedLabel="Clone CMD Copied!" variant="compact" />
              <a
                href={GITHUB_REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md shadow-white/10"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                  <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                </svg>
                <span>Open GitHub</span>
                <span className="portal-arrow-glide">↗</span>
              </a>
            </div>
          </div>

          {/* Identity */}
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Developer Portal Hub &amp; Live Endpoints
              </h1>
              <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-emerald-500/15 border border-emerald-500/30 text-emerald-300">
                :5181 Client · :8008 FastAPI
              </span>
            </div>
            <p className="text-xs md:text-sm text-zinc-300 leading-relaxed max-w-3xl">
              Direct GitHub repository directories, live localhost URL launcher for all {projects.length || 9} micro-apps,
              FastAPI OpenAPI endpoints, and monorepo architecture topology in one command center.
            </p>
          </div>

          {/* 4-Metric Quick Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 portal-grid-stagger">
            <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">MONOREPO APPS</span>
              <strong className="text-xl font-extrabold text-white font-mono mt-1">{projects.length || 9} Apps</strong>
              <span className="text-[11px] text-emerald-400 font-mono mt-0.5">{fullstackCount} fullstack dual-port</span>
            </div>
            <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">SHARED LIBRARIES</span>
              <strong className="text-xl font-extrabold text-purple-300 font-mono mt-1">{packages.length || 3} Core</strong>
              <span className="text-[11px] text-zinc-400 font-mono mt-0.5">logger · config · runner</span>
            </div>
            <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">LIVE ENDPOINTS</span>
              <strong className="text-xl font-extrabold text-sky-300 font-mono mt-1">{liveFeCount + liveBeCount} Online</strong>
              <span className="text-[11px] text-zinc-400 font-mono mt-0.5">Ports 5173–5181 &amp; 8000–8008</span>
            </div>
            <div className="flex flex-col p-3.5 rounded-xl bg-[#16161c]/90 border border-white/[0.08] hover:border-white/[0.2] portal-card-hover">
              <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">GUIDES &amp; SPECS</span>
              <strong className="text-xl font-extrabold text-amber-300 font-mono mt-1">{DOCUMENTATION_GUIDES_REGISTRY.length} Specs</strong>
              <span className="text-[11px] text-zinc-400 font-mono mt-0.5">Golden Rules Enforced</span>
            </div>
          </div>

          <ProjectLogoFleetStrip
            projects={projects}
            onSelectProject={(projectId) => onNavigate(`projects/${projectId}`)}
          />

          {/* Integrated Hub Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#09090c] border border-white/[0.08] rounded-xl self-start" role="tablist" aria-label="Developer hub sections">
            {[
              { id: 'endpoints', label: `Live Endpoints & Ports (${projects.length})` },
              { id: 'repositories', label: `GitHub Repositories (${projects.length + packages.length + 1})` },
              { id: 'api', label: `Portal FastAPI (:8008)` },
              { id: 'blueprint', label: 'Architecture Flow' },
            ].map((tab) => {
              const isSelected = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setActiveTab(tab.id as PortalHubTab)}
                  className={`px-3.5 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                      : 'text-zinc-400 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* ── Active Tab Panel ── */}
      <div key={activeTab} className="w-full tab-content-animate">
        {activeTab === 'endpoints' && (
          <section className="w-full flex flex-col gap-4 portal-stagger">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-2xl bg-[#111115] border border-white/[0.08] portal-header-sheen">
              <div className="flex-1 min-w-[220px]">
                <input
                  type="text"
                  value={filterText}
                  onChange={(e) => setFilterText(e.target.value)}
                  placeholder="Filter live endpoints by app name, :port, or database..."
                  aria-label="Filter live endpoints"
                  className="w-full h-9 px-3 rounded-lg bg-[#09090c] border border-white/[0.08] text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
                />
              </div>
              <div className="flex items-center gap-2 shrink-0 text-xs font-mono text-zinc-400">
                <span>Portal UI: <strong className="text-emerald-400">:5181</strong></span>
                <span>·</span>
                <span>Portal Server: <strong className="text-sky-400">:8008</strong></span>
              </div>
            </div>

            <ProportionalSpectrumBar
              title="WORKSPACE TIER & PORT TOPOLOGY"
              segments={[
                { label: 'Frontend Ports', value: projects.filter((p) => p.frontendPort).length, colorClass: 'bg-emerald-400', hex: '#34d399' },
                { label: 'Backend Ports', value: projects.filter((p) => p.backendPort).length, colorClass: 'bg-indigo-400', hex: '#818cf8' },
                { label: 'Shared Packages', value: packages.length, colorClass: 'bg-purple-400', hex: '#c084fc' },
              ]}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 portal-grid-stagger">
              {filteredProjects.map((proj) => {
                const brand = PROJECT_BRAND_MAP[proj.id];
                const logoSrc = proj.logo || PROJECT_LOGOS[proj.id];
                const displayTitle = formatProjectTitle(proj.id, proj.title);
                const feUrl = proj.frontendPort ? `http://localhost:${proj.frontendPort}` : null;
                const beUrl = proj.backendPort ? `http://localhost:${proj.backendPort}` : null;

                return (
                  <div
                    key={proj.id}
                    className="group flex flex-col justify-between p-4 rounded-2xl bg-[#121216] border border-white/[0.08] hover:border-white/[0.2] gap-3.5 portal-card-hover"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className="w-10 h-10 rounded-xl bg-[#0b0b0f] border border-white/[0.1] flex items-center justify-center overflow-hidden shrink-0 portal-emblem-hover">
                          <ProjectLogoImage
                            src={logoSrc}
                            alt={displayTitle}
                            fallbackIcon={brand?.icon || '⚡'}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex flex-col min-w-0">
                          <button
                            type="button"
                            onClick={() => onNavigate(`projects/${proj.id}`)}
                            className="text-sm font-bold text-white hover:text-sky-300 text-left truncate cursor-pointer"
                          >
                            {displayTitle}
                          </button>
                          <code className="text-[11px] font-mono text-zinc-500 truncate">{proj.id}</code>
                        </div>
                      </div>
                      <CopyButton text={`npm run dev:${proj.id.replace(/-system$|-management$/, '')}`} variant="icon-only" title="Copy dev runner command" />
                    </div>

                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-[11px] font-mono">
                      {feUrl && (
                        <a
                          href={feUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/12 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 font-bold"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 status-pulse" />
                          <span>Client :{proj.frontendPort}</span>
                          <span>↗</span>
                        </a>
                      )}
                      {beUrl && (
                        <a
                          href={`${beUrl}/docs`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-indigo-500/12 border border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/20 font-bold"
                        >
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 status-pulse" />
                          <span>Swagger :{proj.backendPort}</span>
                          <span>↗</span>
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={() => onNavigate(`projects/${proj.id}`)}
                        className="ml-auto inline-flex items-center gap-1 text-zinc-300 hover:text-white font-semibold cursor-pointer"
                      >
                        <span>Inspect</span>
                        <span className="portal-arrow-glide">→</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'repositories' && (
          <section className="w-full flex flex-col gap-5 portal-stagger">
            <div className="p-5 rounded-2xl bg-[#111115] border border-white/[0.08] flex flex-col sm:flex-row sm:items-center justify-between gap-4 portal-header-sheen">
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-white text-zinc-950 flex items-center justify-center shrink-0 shadow-lg portal-emblem-hover">
                  <svg className="w-6 h-6" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                    <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
                  </svg>
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">PRIMARY REPOSITORY</span>
                  <strong className="text-base font-extrabold text-white truncate">dheena017/Soul-DevPortal</strong>
                  <span className="text-xs font-mono text-zinc-400 truncate">{GITHUB_REPO_URL}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <CopyButton text={GITHUB_REPO_URL} label="Copy Repo URL" variant="compact" />
                <a
                  href={GITHUB_REPO_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3.5 py-2 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all"
                >
                  Browse Source ↗
                </a>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 portal-grid-stagger">
              {projects.map((proj) => {
                const folderUrl = `${GITHUB_REPO_URL}/tree/main/Soul-DevPortal-Projects/${proj.id}`;
                return (
                  <div key={proj.id} className="p-4 rounded-xl bg-[#121216] border border-white/[0.08] hover:border-white/[0.2] flex flex-col justify-between gap-3 portal-card-hover">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm font-bold text-white truncate">{formatProjectTitle(proj.id, proj.title)}</strong>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-[#09090c] border border-white/[0.08] text-emerald-300">App</span>
                      </div>
                      <code className="text-[11px] font-mono text-zinc-500 truncate">Soul-DevPortal-Projects/{proj.id}</code>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                      <a href={folderUrl} target="_blank" rel="noopener noreferrer" className="text-sky-300 hover:underline font-semibold">
                        GitHub Directory ↗
                      </a>
                      <button type="button" onClick={() => onNavigate(`projects/${proj.id}`)} className="text-zinc-300 hover:text-white font-semibold cursor-pointer">
                        Details →
                      </button>
                    </div>
                  </div>
                );
              })}
              {packages.map((pkg) => {
                const folderUrl = `${GITHUB_REPO_URL}/tree/main/Soul-DevPortal-Packages/${pkg.id}`;
                return (
                  <div key={pkg.id} className="p-4 rounded-xl bg-[#121216] border border-purple-500/20 hover:border-purple-400/40 flex flex-col justify-between gap-3 portal-card-hover">
                    <div className="flex flex-col gap-1">
                      <div className="flex items-center justify-between gap-2">
                        <strong className="text-sm font-bold text-white font-mono truncate">@workspace/{pkg.id}</strong>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-purple-500/15 border border-purple-500/30 text-purple-300">Package</span>
                      </div>
                      <code className="text-[11px] font-mono text-zinc-500 truncate">Soul-DevPortal-Packages/{pkg.id}</code>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-white/[0.06] text-xs">
                      <a href={folderUrl} target="_blank" rel="noopener noreferrer" className="text-purple-300 hover:underline font-semibold">
                        GitHub Directory ↗
                      </a>
                      <button type="button" onClick={() => onNavigate(`packages/${pkg.id}`)} className="text-zinc-300 hover:text-white font-semibold cursor-pointer">
                        API →
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {activeTab === 'api' && (
          <section className="p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] flex flex-col gap-4 portal-header-sheen portal-stagger">
            <HeroArtworkBackdrop src="/visuals/tab-api-rest.jpg" alt="Portal FastAPI REST Visual" opacityClass="opacity-30 sm:opacity-42" />
            <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-white/[0.06]">
              <div>
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">DEVPORTAL SERVER :8008</span>
                <h2 className="text-lg font-bold text-white">Portal REST &amp; SSE Telemetry Endpoints</h2>
              </div>
              <a
                href="http://127.0.0.1:8008/docs"
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/25"
              >
                Open :8008 Swagger Docs ↗
              </a>
            </div>
            <div className="flex flex-col gap-2 portal-list-stagger">
              {PORTAL_API_ROUTES.map((r) => (
                <div key={r.path} className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-emerald-400/30 portal-row-hover">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">{r.method}</span>
                    <code className="text-xs font-mono font-bold text-white truncate">{r.path}</code>
                    <span className="text-xs text-zinc-400 hidden md:inline">— {r.desc}</span>
                  </div>
                  <CopyButton text={`http://127.0.0.1:8008${r.path}`} variant="compact" label="Copy URL" />
                </div>
              ))}
            </div>
          </section>
        )}

        {activeTab === 'blueprint' && (
          <section className="p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] flex flex-col gap-5 portal-header-sheen portal-stagger">
            <HeroArtworkBackdrop src="/visuals/tab-env-security.jpg" alt="Portal Architecture Vault Visual" opacityClass="opacity-30 sm:opacity-42" />
            <div>
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">ARCHITECTURE FLOW</span>
              <h2 className="text-lg font-bold text-white">Soul DevPortal Runtime Architecture</h2>
            </div>
            <ArchitectureFlowDiagram
              frontendPort={5181}
              backendPort={8008}
              framework="React 19 + Vite 8 + Tailwind v4"
              dbInfo="SQLite WAL (portal.db)"
              aiEngine="PSUtil + WMI + SSE Stream"
            />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 portal-grid-stagger">
              {[
                { id: 'projects', title: 'Projects Hub', desc: 'Micro-apps, API routes & SQLite schemas' },
                { id: 'packages', title: 'Packages Hub', desc: 'Logger, Config & Runner shared libraries' },
                { id: 'docs', title: 'Docs & Specs', desc: 'Architecture specs & golden engineering rules' },
                { id: 'computer', title: 'Computer Monitor', desc: 'Live CPU, GPU, disk, Wi-Fi & SSE gauges' },
              ].map((hub) => (
                <button
                  key={hub.id}
                  type="button"
                  onClick={() => onNavigate(hub.id)}
                  className="p-4 rounded-xl bg-[#16161c] border border-white/[0.08] hover:border-sky-400/35 text-left flex flex-col gap-1 cursor-pointer portal-card-hover"
                >
                  <strong className="text-sm font-bold text-white">{hub.title} →</strong>
                  <span className="text-xs text-zinc-400">{hub.desc}</span>
                </button>
              ))}
            </div>
          </section>
        )}
      </div>
    </article>
  );
}
