import React, { useState, useMemo } from 'react';
import { consoleLogger } from '@workspace/logger';
import CopyButton from './CopyButton';
import StatsCards from './StatsCards';
import EmptyState from './EmptyState';
import { PackageData, ProjectData, StatsData } from '../types';
import { PACKAGE_METADATA_MAP } from '../features/packages/packagesConstants';
import { DOCUMENTATION_GUIDES_REGISTRY } from '../features/docs/docsConstants';
import { PROJECT_LOGOS, PROJECT_BRAND_MAP, formatProjectTitle } from '../features/projects/projectsConstants';

function getPackageInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'npm install @workspace/logger';
  if (pkg.id === 'runner') return 'npm install @workspace/runner';
  return 'npm install @workspace/config';
}

function getPackagePythonInstallCommand(pkg: PackageData): string {
  if (pkg.id === 'logger') return 'pip install -e Soul-DevPortal-Packages/logger';
  if (pkg.id === 'runner') return 'pip install -e Soul-DevPortal-Packages/runner';
  if (pkg.id === 'config') return 'pip install -e Soul-DevPortal-Packages/config';
  return '';
}

export interface OverviewProps {
  packages?: PackageData[];
  projects?: ProjectData[];
  rootWorkspaces?: string[];
  rootScripts?: Record<string, string>;
  stats?: StatsData;
  onNavigate: (id: string) => void;
  onClearSearch?: () => void;
}

export default function Overview({
  packages = [],
  projects = [],
  rootWorkspaces = [],
  rootScripts = {},
  stats,
  onNavigate,
  onClearSearch,
}: OverviewProps) {
  const [activeTab, setActiveTab] = useState<'apps' | 'packages' | 'docs'>('apps');
  const [ecosystemFilter, setEcosystemFilter] = useState<'all' | 'npm' | 'python' | 'config'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'exports' | 'version'>('name');

  const filteredPackages = useMemo(() => {
    return packages
      .filter((pkg) => {
        if (ecosystemFilter === 'npm') return pkg.hasNpmManifest && !pkg.name.includes('config');
        if (ecosystemFilter === 'python') return pkg.hasPythonManifest || pkg.pythonModule;
        if (ecosystemFilter === 'config') return pkg.name?.includes('config') || pkg.id?.includes('config');
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'name') return (a.displayName || a.name).localeCompare(b.displayName || b.name);
        if (sortBy === 'exports') {
          const aCount = (a.exports || []).length + (a.pythonExports || []).length;
          const bCount = (b.exports || []).length + (b.pythonExports || []).length;
          return bCount - aCount;
        }
        if (sortBy === 'version') return (b.version || '').localeCompare(a.version || '');
        return 0;
      });
  }, [packages, ecosystemFilter, sortBy]);

  const previewProjects = useMemo(() => {
    return projects || [];
  }, [projects]);

  return (
    <article className="w-full flex flex-col gap-8 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      {/* ── Standardized Hero Header matching Pillar Dashboards ── */}
      <header className="w-full bg-[#111111] border border-[#222222] rounded-2xl p-5 md:p-6 shadow-2xl shadow-black/50 flex flex-col gap-6">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-[#1f1f1f]">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-neutral-400 font-medium">Soul Workspace</span>
            <span className="text-neutral-600 font-bold">/</span>
            <strong className="text-white font-bold">Overview Dashboard</strong>
          </div>

          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-xs font-semibold text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" aria-hidden="true" />
            <span>Live Ecosystem · 3 Pillars · {projects.length || 8} Apps · {packages.length || 3} Packages</span>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-white">Soul Workspace Developer Portal</h1>
            <span className="px-2.5 py-0.5 rounded-md text-[11px] font-mono font-bold tracking-wider uppercase bg-sky-500/15 border border-sky-500/30 text-sky-400">
              Enterprise Monorepo
            </span>
          </div>
          <p className="text-xs md:text-sm text-neutral-400 leading-relaxed max-w-4xl">
            Unified command center, runtime telemetry, live port topology, and SDK catalog for all applications and shared libraries in the monorepo.
          </p>
        </div>

        {/* Dashboard Key Metrics Banner */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 pt-1">
          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-lg font-extrabold text-sky-400 font-mono">3</span>
            <span className="text-xs font-semibold text-neutral-300 mt-0.5">Core Pillars</span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-lg font-extrabold text-emerald-400 font-mono">{projects.length || 8}</span>
            <span className="text-xs font-semibold text-neutral-300 mt-0.5">Integrated Apps</span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-lg font-extrabold text-purple-400 font-mono">{packages.length || 3}</span>
            <span className="text-xs font-semibold text-neutral-300 mt-0.5">Shared Packages</span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-lg font-extrabold text-amber-400 font-mono">5</span>
            <span className="text-xs font-semibold text-neutral-300 mt-0.5">Architecture Specs</span>
          </div>
          <div className="flex flex-col p-3 rounded-xl bg-[#141414] border border-[#222222]">
            <span className="text-lg font-extrabold text-emerald-400 font-mono">0</span>
            <span className="text-xs font-semibold text-neutral-300 mt-0.5">Port Collisions</span>
          </div>
        </div>
      </header>

      {/* ── 3 Pillars Interactive Gateway Navigation ── */}
      <section className="w-full flex flex-col gap-4" aria-label="Monorepo 3 Pillars Navigation">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div
            className="group flex flex-col justify-between p-6 rounded-2xl bg-[#111111] border border-[#222222] hover:border-sky-500/50 hover:bg-[#131313] hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 cursor-pointer gap-4"
            onClick={() => onNavigate('projects')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('projects'); }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/25 flex items-center justify-center text-2xl">
                  💻
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 border border-sky-500/30 text-sky-400">
                  Pillar 1
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-sky-400 transition-colors">
                Projects &amp; Applications
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                {projects.length || 8} fullstack applications, strict client &amp; server port allocations (:5173-:5180 / :8000-:8008), and SQLite datastores.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-sky-400 pt-2 border-t border-[#1e1e1e]">
              <span>Explore {projects.length || 8} Apps</span>
              <span>→</span>
            </div>
          </div>

          <div
            className="group flex flex-col justify-between p-6 rounded-2xl bg-[#111111] border border-[#222222] hover:border-emerald-500/50 hover:bg-[#131313] hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 cursor-pointer gap-4"
            onClick={() => onNavigate('packages')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('packages'); }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center text-2xl">
                  📦
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  Pillar 2
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-emerald-400 transition-colors">
                Shared Packages
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Core reusable libraries: @workspace/logger (universal logging), @workspace/runner (CLI supervisor), and @workspace/config (design tokens).
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 pt-2 border-t border-[#1e1e1e]">
              <span>Inspect {packages.length || 3} Packages</span>
              <span>→</span>
            </div>
          </div>

          <div
            className="group flex flex-col justify-between p-6 rounded-2xl bg-[#111111] border border-[#222222] hover:border-amber-500/50 hover:bg-[#131313] hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 cursor-pointer gap-4"
            onClick={() => onNavigate('docs')}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => { if (e.key === 'Enter') onNavigate('docs'); }}
          >
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-center text-2xl">
                  📚
                </span>
                <span className="px-2.5 py-0.5 rounded text-[11px] font-mono font-bold uppercase tracking-wider bg-amber-500/15 border border-amber-500/30 text-amber-400">
                  Pillar 3
                </span>
              </div>
              <h3 className="text-lg font-bold text-white group-hover:text-amber-400 transition-colors">
                Docs &amp; Specifications
              </h3>
              <p className="text-xs text-neutral-400 leading-relaxed">
                5 authoritative architecture guides: mandatory golden rules, port matrices, tech stack standards, and compliance cheatsheets.
              </p>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400 pt-2 border-t border-[#1e1e1e]">
              <span>Read 5 Guides</span>
              <span>→</span>
            </div>
          </div>
        </div>
      </section>

      {/* ── Codebase Telemetry Metrics Cards ── */}
      <StatsCards stats={stats} packagesCount={packages.length || 3} projectsCount={projects?.length || 8} />

      {/* ── Ecosystem Tabs Navigation ── */}
      <div className="flex flex-wrap items-center gap-1.5 p-1 bg-[#101010] border border-[#242424] rounded-xl self-start" role="tablist" aria-label="Ecosystem overview sections">
        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'apps'}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'apps'
              ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
              : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
          }`}
          onClick={() => setActiveTab('apps')}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <line x1="8" y1="21" x2="16" y2="21" />
            <line x1="12" y1="17" x2="12" y2="21" />
          </svg>
          <span>Consumer Applications</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-300">{projects.length || 8}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'packages'}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'packages'
              ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
              : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
          }`}
          onClick={() => setActiveTab('packages')}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="16.5" y1="9.4" x2="7.55" y2="4.24" />
            <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
          </svg>
          <span>Shared Packages</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-300">{packages.length || 3}</span>
        </button>

        <button
          type="button"
          role="tab"
          aria-selected={activeTab === 'docs'}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
            activeTab === 'docs'
              ? 'bg-[#222222] text-white shadow-md border border-[#333333]'
              : 'text-neutral-400 hover:text-white hover:bg-[#161616]'
          }`}
          onClick={() => setActiveTab('docs')}
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
            <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
          </svg>
          <span>Architecture Specifications</span>
          <span className="px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-neutral-800 text-neutral-300">5</span>
        </button>
      </div>

      {/* ── Tab 1: Integrated Consumer Applications ── */}
      {activeTab === 'apps' && projects && projects.length > 0 && (
        <section className="w-full flex flex-col gap-4" aria-label="Integrated monorepo applications">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">PILLAR 1: APPLICATIONS</span>
              <h2 className="text-lg font-bold text-white">Integrated Consumer Applications</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181818] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-neutral-500 transition-all"
              onClick={() => onNavigate('projects')}
            >
              <span>View all {projects.length} apps &amp; ports</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {previewProjects.map((p) => {
              const brand = PROJECT_BRAND_MAP[p.id];
              const displayTitle = formatProjectTitle(p.id, p.title);
              const logoSrc = p.logo || PROJECT_LOGOS[p.id];
              const hasAi = Boolean(p.aiEngine && p.aiEngine !== 'N/A');
              const aiSummary = hasAi ? p.aiEngine!.split('+')[0].trim() : null;

              return (
                <div
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-sky-500/40 hover:bg-[#131313] hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 gap-4 cursor-pointer"
                  key={p.id}
                  onClick={() => onNavigate(`projects/${p.id}`)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(`projects/${p.id}`); }}
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border overflow-hidden"
                          style={{
                            borderColor: brand ? `${brand.themeColor}33` : undefined,
                            background: brand ? brand.accentBg : undefined,
                          }}
                        >
                          {logoSrc ? (
                            <img
                              src={logoSrc}
                              alt={`${displayTitle} logo`}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.currentTarget as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-base">{brand?.icon || '⚡'}</span>
                          )}
                        </div>
                        <div className="flex flex-col min-w-0">
                          <strong className="text-sm font-bold text-white group-hover:text-sky-400 transition-colors truncate">
                            {displayTitle}
                          </strong>
                          <div className="flex items-center gap-1.5">
                            <code className="text-[11px] font-mono text-neutral-400">{p.id}</code>
                            {brand?.tag && <span className="text-[10px] font-mono text-neutral-500">· {brand.tag}</span>}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 shrink-0 font-mono text-[11px]">
                        {p.frontendPort && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/25 text-sky-400 font-bold">
                            FE :{p.frontendPort}
                          </span>
                        )}
                        {p.backendPort && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-500/10 border border-indigo-500/25 text-indigo-400 font-bold">
                            BE :{p.backendPort}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5 p-2.5 rounded-xl bg-[#0d0d0d] border border-[#202020] text-xs">
                      <div className="flex items-center gap-2 text-neutral-400">
                        <span>⚡</span>
                        <span className="truncate">{p.framework || 'React 19 + Vite 8 + Tailwind v4'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-neutral-400">
                        <span>🗄️</span>
                        <span className="truncate">{p.dbInfo || 'SQLite datastore'}</span>
                      </div>
                      {hasAi && (
                        <div className="flex items-center gap-2 text-sky-400 font-medium">
                          <span>✨</span>
                          <span className="truncate">{aiSummary}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e1e1e] text-xs font-semibold text-neutral-400 group-hover:text-sky-400 transition-colors">
                    <span>Inspect Application</span>
                    <span>→</span>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tab 2: Core Monorepo Packages ── */}
      {activeTab === 'packages' && (
        <section className="w-full flex flex-col gap-4" aria-label="Shared packages explorer">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 pb-2 border-b border-[#1f1f1f]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">PILLAR 2: SHARED LIBRARIES</span>
              <h2 className="text-lg font-bold text-white">Core Monorepo Packages</h2>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex flex-wrap items-center gap-1 p-1 bg-[#101010] border border-[#242424] rounded-xl text-xs">
                {(['all', 'npm', 'python', 'config'] as const).map((eco) => {
                  const label = eco === 'all' ? `All (${packages.length})` : eco === 'npm' ? 'TypeScript / Node' : eco === 'python' ? 'Python Modules' : 'Config';
                  const isActive = ecosystemFilter === eco;
                  return (
                    <button
                      key={eco}
                      type="button"
                      className={`px-3 py-1 rounded-lg font-semibold transition-all ${
                        isActive ? 'bg-[#222222] text-white shadow-sm border border-[#333333]' : 'text-neutral-400 hover:text-white border border-transparent'
                      }`}
                      onClick={() => setEcosystemFilter(eco)}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="h-8 px-2.5 rounded-lg bg-[#141414] border border-[#282828] text-xs text-neutral-200 focus:outline-none focus:border-sky-500 font-medium"
              >
                <option value="name">Name (A-Z)</option>
                <option value="exports">Most Exports</option>
                <option value="version">Version</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredPackages.map((pkg) => {
              const meta = PACKAGE_METADATA_MAP[pkg.id] || {
                icon: '📦',
                theme: 'blue' as const,
                role: 'Workspace Shared Library',
                tags: ['Shared Library', 'TypeScript'],
                scope: 'Monorepo Core',
              };
              const installCmd = getPackageInstallCommand(pkg);
              const pyInstallCmd = getPackagePythonInstallCommand(pkg);
              const exportsCount = (pkg.exports || []).length + (pkg.pythonExports || []).length + (pkg.typeScriptExports || []).length;

              return (
                <article
                  key={pkg.id}
                  className="group flex flex-col justify-between p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-sky-500/40 hover:bg-[#131313] hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 gap-4"
                >
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border border-sky-500/25 bg-sky-500/10 text-xl">
                          {meta.icon}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-xs font-mono font-bold text-white">v{pkg.version}</span>
                          <span className="text-[10px] font-mono text-neutral-500">packages/{pkg.id}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {pkg.hasNpmManifest && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-amber-500/10 border border-amber-500/25 text-amber-400">
                            npm
                          </span>
                        )}
                        {pkg.hasPythonManifest && (
                          <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-sky-500/10 border border-sky-500/25 text-sky-400">
                            python
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      <h3 className="text-base font-bold font-mono text-white group-hover:text-sky-400 transition-colors">
                        {pkg.displayName || pkg.name}
                      </h3>
                      <span className="text-xs text-sky-400 font-semibold">{meta.role}</span>
                      {pkg.description && (
                        <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed min-h-[36px]">{pkg.description}</p>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2 rounded-xl bg-[#0d0d0d] border border-[#202020] text-center font-mono text-xs">
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase">EXPORTS</span>
                        <strong className="block text-xs font-bold text-sky-400 mt-0.5">{exportsCount} APIs</strong>
                      </div>
                      <div className="border-x border-[#1e1e1e]">
                        <span className="text-[10px] text-neutral-500 uppercase">LICENSE</span>
                        <strong className="block text-xs font-bold text-white mt-0.5">{pkg.license || 'MIT'}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-neutral-500 uppercase">PYTHON</span>
                        <strong className="block text-xs font-bold text-neutral-300 mt-0.5 truncate">{pkg.pythonModule ? 'yes' : 'N/A'}</strong>
                      </div>
                    </div>

                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-[#0c0c0c] border border-[#222222] font-mono text-xs">
                      <code className="text-[11px] text-sky-300 truncate">$ {installCmd}</code>
                      <CopyButton text={installCmd} variant="compact" label="" copiedLabel="Copied!" />
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#1e1e1e]">
                    <button
                      type="button"
                      className="w-full py-2 px-4 rounded-xl text-xs font-bold bg-sky-600 text-white hover:bg-sky-500 transition-all shadow-md shadow-sky-600/20 flex items-center justify-center gap-2"
                      onClick={() => onNavigate(`packages/${pkg.id}`)}
                    >
                      <span>Inspect Package API</span>
                      <span>→</span>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Tab 3: Documentation Hub Overview ── */}
      {activeTab === 'docs' && (
        <section className="w-full flex flex-col gap-4" aria-label="Docs Dashboard and architectural specifications">
          <div className="flex items-center justify-between pb-2 border-b border-[#1f1f1f]">
            <div className="flex flex-col gap-0.5">
              <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-500">PILLAR 3: SPECIFICATIONS</span>
              <h2 className="text-lg font-bold text-white">Official Architecture Documentation</h2>
            </div>
            <button
              type="button"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#181818] border border-[#2c2c2c] text-neutral-300 hover:text-white hover:border-neutral-500 transition-all"
              onClick={() => onNavigate('docs')}
            >
              <span>Open Docs Dashboard</span>
              <span>→</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {DOCUMENTATION_GUIDES_REGISTRY.map((guide) => (
              <div
                className="group flex flex-col justify-between p-5 rounded-2xl bg-[#111111] border border-[#222222] hover:border-sky-500/40 hover:bg-[#131313] hover:shadow-2xl hover:shadow-black/70 transition-all duration-300 cursor-pointer gap-4"
                key={guide.id}
                onClick={() => onNavigate(`docs/${guide.slug || guide.id}`)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => { if (e.key === 'Enter') onNavigate(`docs/${guide.slug || guide.id}`); }}
              >
                <div className="flex flex-col gap-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl">{guide.icon}</span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-sky-500/15 border border-sky-500/30 text-sky-400">
                      {guide.badge}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white group-hover:text-sky-400 transition-colors">
                    {guide.title}
                  </h3>
                  <p className="text-xs text-neutral-400 line-clamp-2 leading-relaxed">{guide.description}</p>
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-sky-400 pt-2 border-t border-[#1e1e1e]">
                  <span>Read Specification</span>
                  <span>→</span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Monorepo Command Runners Quick Banner ── */}
      <section className="w-full p-6 rounded-2xl bg-gradient-to-r from-[#111118] to-[#141422] border border-[#2a2a3e] flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-2xl">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-2xl shrink-0">
            ⚡
          </div>
          <div className="flex flex-col gap-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <h3 className="text-lg font-bold text-white">15 Monorepo Automation Scripts &amp; Command Runners</h3>
              <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-purple-500/15 border border-purple-500/30 text-purple-400">
                Python FastAPI · Vite · TS Gates
              </span>
            </div>
            <p className="text-xs text-neutral-400 leading-relaxed max-w-3xl">
              Orchestrate all {projects.length || 8} fullstack applications concurrently, launch micro-app dev servers,
              run TypeScript validation gates, and supervise port lifecycles from the dedicated Command Runner.
            </p>
          </div>
        </div>

        <button
          type="button"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 text-white hover:bg-purple-500 transition-all shadow-lg shadow-purple-600/25 shrink-0"
          onClick={() => onNavigate('scripts')}
        >
          <span>Open Scripts &amp; Runners Center</span>
          <span>→</span>
        </button>
      </section>
    </article>
  );
}
