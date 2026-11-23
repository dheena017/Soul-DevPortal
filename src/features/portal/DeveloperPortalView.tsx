import React, { useState } from 'react';
import CopyButton from '../../components/CopyButton';
import { ProjectData, PackageData } from '../../types';
import { DOCUMENTATION_GUIDES_REGISTRY } from '../docs/docsConstants';

export interface DeveloperPortalViewProps {
  projects: ProjectData[];
  packages: PackageData[];
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
}

export default function DeveloperPortalView({
  projects,
  packages,
  onNavigate,
  onBack,
}: DeveloperPortalViewProps) {
  const [filterQuery, setFilterQuery] = useState('');
  const repoUrl = 'https://github.com/dheena017/Soul-DevPortal';
  const cloneCmd = 'git clone https://github.com/dheena017/Soul-DevPortal.git';

  const devToolsList = [
    {
      name: 'Start All Services',
      cmd: 'npm run dev:all',
      desc: 'Concurrently boots all 8 client frontends and 8 backend API microservices.',
      category: 'Runners',
      badge: 'BOOT',
    },
    {
      name: 'Strict Typecheck Audit',
      cmd: 'npm run typecheck',
      desc: 'Executes static TypeScript audit across all packages and projects with zero-emit.',
      category: 'Quality',
      badge: 'TSC',
    },
    {
      name: 'Production Bundle Build',
      cmd: 'npm run build',
      desc: 'Compiles client environment with Vite 8 + Tailwind CSS v4 engine for deployment.',
      category: 'Build',
      badge: 'VITE',
    },
    {
      name: 'Port Conflict Supervisor',
      cmd: 'python Soul-DevPortal-Packages/runner/audit_ports.py',
      desc: 'Audits port allocations (:5173-:5180 / :8000-:8008) and detaches zombie sockets.',
      category: 'Supervisor',
      badge: 'PORTS',
    },
    {
      name: 'Python Unit Test Suite',
      cmd: 'pytest tests/ -v',
      desc: 'Runs automated integration and unit test suite across Python backend handlers.',
      category: 'Testing',
      badge: 'PYTEST',
    },
    {
      name: 'Workspace Logger Dev Banner',
      cmd: 'node -e "require(\'@workspace/logger\').printDevBanner()"',
      desc: 'Prints 5-column ANSI terminal diagnostic banner and DevTools bridge check.',
      category: 'Telemetry',
      badge: 'LOG',
    },
  ];

  const externalDocs = [
    { name: 'React 19', url: 'https://react.dev', desc: 'Component library, Hooks, and Server Component paradigms' },
    { name: 'Vite 8', url: 'https://vite.dev', desc: 'Next-generation frontend tooling with lightning-fast HMR' },
    { name: 'Tailwind CSS v4', url: 'https://tailwindcss.com', desc: 'Modern CSS utility-first engine using native CSS variables' },
    { name: 'FastAPI', url: 'https://fastapi.tiangolo.com', desc: 'High-performance Python web framework with OpenAPI schemas' },
    { name: 'Python 3.11', url: 'https://docs.python.org/3/', desc: 'Core server runtime documentation and standard library' },
    { name: 'TypeScript', url: 'https://www.typescriptlang.org/docs/', desc: 'Strict static type definitions and compiler configuration' },
  ];

  const filteredProjects = projects.filter(
    (p) =>
      p.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      p.id.toLowerCase().includes(filterQuery.toLowerCase()) ||
      (p.framework || '').toLowerCase().includes(filterQuery.toLowerCase())
  );

  return (
    <article className="w-full flex flex-col gap-8 max-w-7xl mx-auto pb-16 animate-in fade-in duration-300">
      {/* ── Main Hero Header ── */}
      <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-[#1f1f1f]">
          <div className="flex flex-wrap items-center gap-3 text-xs">
            {onBack ? (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#3a3a3a] transition-all font-semibold"
                onClick={onBack}
                title="Return to previous screen"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
            ) : (
              <button
                type="button"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#161616] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-[#3a3a3a] transition-all font-semibold"
                onClick={() => onNavigate('overview')}
                title="Return to Overview"
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Back</span>
              </button>
            )}
            <span className="text-neutral-400 font-medium">Soul Workspace</span>
            <span className="text-neutral-600 font-bold">/</span>
            <strong className="text-white font-bold">Developer Portal Hub</strong>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161616] border border-[#282828] text-neutral-300 hover:text-white hover:border-neutral-500 transition-all"
              title="Open GitHub Repository"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              <span>GitHub</span>
              <span className="text-[10px] text-neutral-500">↗</span>
            </a>
            <CopyButton text={cloneCmd} label="Copy Clone" copiedLabel="Clone Copied!" variant="compact" />
          </div>
        </div>

        {/* Hero Title & Description */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="flex items-start gap-4 min-w-0">
            <div className="w-14 h-14 rounded-2xl bg-[#161616] border border-[#262626] flex items-center justify-center shrink-0 text-2xl shadow-inner text-sky-400">
              ⚡
            </div>

            <div className="flex flex-col gap-2 min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  DEVELOPER PLATFORM
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
                  <span>v1.0.0 Live</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-purple-500/15 border border-purple-500/30 text-purple-400">
                  MONOREPO HUB
                </span>
              </div>

              <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">
                Soul Workspace Developer Portal
              </h1>
              <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-3xl">
                The authoritative central engineering portal: official GitHub repositories, live microservice endpoints, interactive OpenAPI links, terminal commands, and shared library tooling.
              </p>
            </div>
          </div>

          {/* 4-Stat Metric Strip */}
          <div className="grid grid-cols-2 gap-3 min-w-[280px] shrink-0">
            <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">APPLICATIONS</span>
              <strong className="text-base font-bold text-sky-400 font-mono mt-1">{projects.length} Microservices</strong>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">SHARED PACKAGES</span>
              <strong className="text-base font-bold text-emerald-400 font-mono mt-1">{packages.length} Libraries</strong>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">OFFICIAL SPECS</span>
              <strong className="text-base font-bold text-amber-400 font-mono mt-1">5 Standard Guides</strong>
            </div>
            <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
              <span className="text-[10px] font-mono text-neutral-500 font-bold uppercase tracking-wider">PORT CONFLICTS</span>
              <strong className="text-base font-bold text-purple-400 font-mono mt-1">0 Collisions</strong>
            </div>
          </div>
        </div>
      </header>

      {/* ── Section 1: Official GitHub Ecosystem ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">SOURCE CONTROL</span>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <svg className="w-4 h-4 text-white" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
                <path d="M8 0c4.42 0 8 3.58 8 8a8.013 8.013 0 0 1-5.45 7.59c-.4.08-.55-.17-.55-.38 0-.27.01-1.13.01-2.2 0-.75-.25-1.23-.54-1.48 1.78-.2 3.65-.88 3.65-3.95 0-.88-.31-1.59-.82-2.15.08-.2.36-1.02-.08-2.12 0 0-.67-.22-2.2.82-.64-.18-1.32-.27-2-.27-.68 0-1.36.09-2 .27-1.53-1.03-2.2-.82-2.2-.82-.44 1.1-.16 1.92-.08 2.12-.51.56-.82 1.28-.82 2.15 0 3.06 1.86 3.75 3.64 3.95-.23.2-.44.55-.51 1.07-.46.21-1.61.55-2.33-.66-.15-.24-.6-.83-1.23-.82-.67.01-.27.38.01.53.34.19.73.9.82 1.13.16.45.68 1.31 2.69.94 0 .67.01 1.3.01 1.49 0 .21-.15.45-.55.38A7.995 7.995 0 0 1 0 8c0-4.42 3.58-8 8-8Z" />
              </svg>
              <span>Official GitHub Monorepo Ecosystem</span>
            </h2>
          </div>
          <span className="px-2.5 py-1 rounded-md text-xs font-mono font-bold bg-[#161616] border border-[#282828] text-neutral-300">
            dheena017/Soul-DevPortal
          </span>
        </div>

        {/* Repository Primary Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex flex-col justify-between p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] transition-all gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-sky-400">MAIN REPOSITORY</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                  Public
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Soul-DevPortal</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Full monorepo workspace housing all 8 applications, shared packages, and developer portal interface.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-xs">
              <a
                href={repoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sky-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>View on GitHub</span>
                <span>↗</span>
              </a>
              <CopyButton text={repoUrl} variant="compact" label="Copy Link" />
            </div>
          </div>

          <div className="flex flex-col justify-between p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] transition-all gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-purple-400">PULL REQUESTS</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-purple-500/10 border border-purple-500/25 text-purple-400">
                  PR Flow
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Code Review &amp; Merges</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Inspect active pull requests, feature branches, and monorepo architectural changes.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-xs">
              <a
                href={`${repoUrl}/pulls`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-purple-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Inspect Pull Requests</span>
                <span>↗</span>
              </a>
              <span className="text-neutral-500 text-[11px] font-mono">Automated CI</span>
            </div>
          </div>

          <div className="flex flex-col justify-between p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] transition-all gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-mono font-bold text-amber-400">ISSUE TRACKING</span>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400">
                  Issues
                </span>
              </div>
              <h3 className="text-sm font-bold text-white">Bugs &amp; Feature Tasks</h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Report port collisions, request shared package exports, and submit design improvements.
              </p>
            </div>
            <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-xs">
              <a
                href={`${repoUrl}/issues`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-amber-400 hover:underline font-semibold flex items-center gap-1"
              >
                <span>Open Issues</span>
                <span>↗</span>
              </a>
              <a
                href={`${repoUrl}/issues/new`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-neutral-400 hover:text-white text-[11px] font-medium"
              >
                + New Issue
              </a>
            </div>
          </div>
        </div>

        {/* Clone & Quick Setup Command Banner */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-[#161616] border border-[#262626]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="text-emerald-400 font-mono font-bold select-none">$</span>
            <code className="text-xs font-mono text-neutral-200 truncate">{cloneCmd}</code>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <CopyButton text={cloneCmd} variant="compact" label="Copy Clone Command" copiedLabel="Copied!" />
          </div>
        </div>
      </section>

      {/* ── Section 2: Live Application Endpoints & Ports Directory ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">RUNTIME TOPOLOGY</span>
            <h2 className="text-lg font-bold text-white">Live Application &amp; API Service Links</h2>
          </div>
          <div className="relative flex items-center min-w-[240px]">
            <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="Filter live applications..."
              aria-label="Filter applications"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#141414] border border-[#262626] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-sky-500 transition-all font-mono"
            />
            {filterQuery && (
              <button
                type="button"
                className="absolute right-2.5 text-xs text-neutral-400 hover:text-white p-1"
                onClick={() => setFilterQuery('')}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
        </div>

        {/* Applications Live Matrix */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredProjects.map((proj) => {
            const clientUrl = proj.frontendPort ? `http://localhost:${proj.frontendPort}` : null;
            const serverUrl = proj.backendPort ? `http://localhost:${proj.backendPort}` : null;
            const swaggerUrl = proj.backendPort ? `http://localhost:${proj.backendPort}/docs` : null;

            return (
              <div
                key={proj.id}
                className="flex flex-col justify-between p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] transition-all gap-4"
              >
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-[#161616] border border-[#282828] flex items-center justify-center shrink-0 text-base">
                        💻
                      </div>
                      <div className="flex flex-col">
                        <h3 className="text-sm font-bold text-white leading-tight">{proj.title}</h3>
                        <span className="text-[10px] font-mono text-neutral-500">{proj.id}</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 border border-sky-500/25 text-sky-400">
                      {proj.framework || 'Vite React'}
                    </span>
                  </div>

                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                    {proj.description || 'Fullstack monorepo application integrated with shared tooling.'}
                  </p>
                </div>

                {/* Ports & Launch Endpoints */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[#1f1f1f]">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500">Frontend Client:</span>
                    {clientUrl ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={clientUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-400 hover:underline font-bold flex items-center gap-1"
                        >
                          <span>:{proj.frontendPort}</span>
                          <span>↗</span>
                        </a>
                        <CopyButton text={clientUrl} variant="compact" label="" copiedLabel="Copied!" />
                      </div>
                    ) : (
                      <span className="text-neutral-600 italic">Not bound</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className="text-neutral-500">Backend API:</span>
                    {serverUrl ? (
                      <div className="flex items-center gap-2">
                        <a
                          href={swaggerUrl || serverUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sky-400 hover:underline font-bold flex items-center gap-1"
                          title="Open Swagger OpenAPI Docs"
                        >
                          <span>:{proj.backendPort}/docs</span>
                          <span>↗</span>
                        </a>
                        <CopyButton text={serverUrl} variant="compact" label="" copiedLabel="Copied!" />
                      </div>
                    ) : (
                      <span className="text-neutral-600 italic">No backend</span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-[#1a1a1a]">
                    <span className="text-[11px] font-mono text-neutral-500">
                      DB: <span className="text-neutral-300 font-semibold">{proj.dbInfo || 'SQLite'}</span>
                    </span>
                    <button
                      type="button"
                      className="text-xs font-semibold text-sky-400 hover:text-white hover:underline transition-colors"
                      onClick={() => onNavigate(`projects/${proj.id}`)}
                    >
                      Project Details →
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Section 3: Essential Developer CLI Runners & Commands ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-amber-400">ENGINEERING WORKFLOWS</span>
            <h2 className="text-lg font-bold text-white">Developer CLI Commands &amp; Automation</h2>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-sky-400 hover:underline"
            onClick={() => onNavigate('scripts')}
          >
            Open All Scripts (15 commands) →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {devToolsList.map((tool) => (
            <div
              key={tool.name}
              className="flex flex-col justify-between p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] transition-all gap-3"
            >
              <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-white">{tool.name}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-neutral-800 text-neutral-300">
                    {tool.badge}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed min-h-[32px]">
                  {tool.desc}
                </p>
              </div>

              <div className="flex items-center justify-between gap-2 p-2 rounded-lg bg-[#161616] border border-[#262626]">
                <code className="text-[11px] font-mono text-sky-300 truncate">{tool.cmd}</code>
                <CopyButton text={tool.cmd} variant="compact" label="Copy" copiedLabel="Copied!" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 4: Shared Monorepo Packages ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">SHARED ECOSYSTEM</span>
            <h2 className="text-lg font-bold text-white">Universal Packages &amp; Tooling</h2>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-emerald-400 hover:underline"
            onClick={() => onNavigate('packages')}
          >
            Packages Dashboard →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {packages.map((pkg) => (
            <div
              key={pkg.id}
              className="flex flex-col justify-between p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] transition-all gap-4"
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white font-mono">{pkg.name || `@workspace/${pkg.id}`}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/10 border border-emerald-500/25 text-emerald-400">
                    v{pkg.version || '1.0.0'}
                  </span>
                </div>
                <p className="text-xs text-neutral-400 leading-relaxed">
                  {pkg.description || 'Shared monorepo library package.'}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-xs">
                <button
                  type="button"
                  className="text-sky-400 hover:underline font-semibold"
                  onClick={() => onNavigate(`packages/${pkg.id}`)}
                >
                  View Package Specs →
                </button>
                <span className="text-[11px] font-mono text-neutral-500">
                  {(pkg.exports || []).length + (pkg.pythonExports || []).length} exports
                </span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 5: Official Documentation Guides & Standards ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">ENGINEERING SPECS</span>
            <h2 className="text-lg font-bold text-white">Architecture Rules &amp; Technical Specifications</h2>
          </div>
          <button
            type="button"
            className="text-xs font-semibold text-sky-400 hover:underline"
            onClick={() => onNavigate('docs')}
          >
            All Docs Hub →
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {DOCUMENTATION_GUIDES_REGISTRY.map((guide) => (
            <div
              key={guide.id}
              className="group flex flex-col justify-between p-4 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] transition-all gap-3 cursor-pointer"
              onClick={() => onNavigate(`docs/${guide.slug || guide.id}`)}
            >
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-lg">{guide.icon}</span>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161616] border border-[#262626] text-neutral-400">
                    {guide.badge}
                  </span>
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors">
                  {guide.title}
                </h3>
                <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">
                  {guide.description}
                </p>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-[#1f1f1f] text-xs">
                <span className="text-sky-400 font-semibold group-hover:underline">Read Spec →</span>
                <span className="text-[11px] font-mono text-neutral-500">{guide.readTime}</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Section 6: External Ecosystem & Standards Links ── */}
      <section className="w-full p-5 md:p-6 rounded-2xl bg-[#111111] border border-[#222222] shadow-xl flex flex-col gap-4">
        <div className="flex flex-col gap-0.5 pb-2 border-b border-[#1f1f1f]">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">DOCUMENTATION REFERENCES</span>
          <h2 className="text-base font-bold text-white">External Ecosystem Standards</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {externalDocs.map((doc) => (
            <a
              key={doc.name}
              href={doc.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222] hover:border-[#333333] hover:bg-[#161616] transition-all gap-1 group"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white group-hover:text-sky-400 transition-colors">{doc.name}</span>
                <span className="text-[10px] text-neutral-500 group-hover:text-white">↗</span>
              </div>
              <p className="text-[11px] text-neutral-500 line-clamp-2 leading-snug">{doc.desc}</p>
            </a>
          ))}
        </div>
      </section>
    </article>
  );
}
