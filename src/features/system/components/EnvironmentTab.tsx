import React, { useMemo, useState } from 'react';
import CopyButton from '../../../components/CopyButton';
import { EnvVarSpec, PathEntrySpec, RuntimeToolSpec, SystemSpecs } from '../../../types';
import { formatBytes } from '../systemConstants';
import { ExpandToggleCell, FilterPillBar } from './SystemTablePrimitives';

export interface EnvironmentTabProps {
  specs: SystemSpecs;
}

type SectionKey = 'path' | 'env' | 'shell';
type PathFilter = 'all' | 'verified' | 'missing' | 'machine' | 'user' | 'session';
type EnvFilter = 'all' | 'machine' | 'user' | 'session' | 'sdk' | 'sensitive';
type RuntimeFilter = 'all' | 'Language / SDK' | 'Package / Build' | 'AI / Infra / CLI' | 'System Shell';

function SectionIcon({ kind, className }: { kind: 'runtime' | SectionKey | 'missing'; className?: string }) {
  if (kind === 'runtime') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="4 17 10 11 4 5" />
        <line x1="12" y1="19" x2="20" y2="19" />
      </svg>
    );
  }
  if (kind === 'path') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
      </svg>
    );
  }
  if (kind === 'missing') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }
  if (kind === 'env') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="16" rx="2" />
        <path d="M7 9h10M7 13h6" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  );
}

export default function EnvironmentTab({ specs }: EnvironmentTabProps) {
  const env = specs.environment;
  const pathEntries: PathEntrySpec[] = env?.pathEntries || [];
  const envVars: EnvVarSpec[] = env?.envVars || [];
  const runtimes: RuntimeToolSpec[] = specs.runtimes || [];
  const shellProfile = env?.shellProfile;

  const [section, setSection] = useState<SectionKey>('path');
  const [search, setSearch] = useState('');
  const [rtFilter, setRtFilter] = useState<RuntimeFilter>('all');
  const [pathFilter, setPathFilter] = useState<PathFilter>('all');
  const [envFilter, setEnvFilter] = useState<EnvFilter>('all');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});

  const pathStats = useMemo(() => {
    const missing = env?.missingPathCount ?? pathEntries.filter((p) => !p.exists).length;
    const verified = Math.max(0, pathEntries.length - missing);
    const machine = pathEntries.filter((p) => (p.registrySource || '').includes('HKLM')).length;
    const user = pathEntries.filter((p) => (p.registrySource || '').includes('HKCU')).length;
    const session = pathEntries.filter((p) => (p.registrySource || '').includes('Session')).length;
    const executables = env?.totalExecutablesInPath ?? pathEntries.reduce((s, p) => s + (p.executableCount || 0), 0);
    return { verified, missing, machine, user, session, executables };
  }, [pathEntries, env]);

  const envStats = useMemo(() => {
    const redacted = envVars.filter((v) => v.isSensitive).length;
    const machine = envVars.filter((v) => (v.source || '').includes('HKLM')).length;
    const user = envVars.filter((v) => (v.source || '').includes('HKCU')).length;
    const session = envVars.filter((v) => !v.source || v.source.includes('Session')).length;
    const sdk = envVars.filter((v) => v.category === 'Developer / SDK').length;
    return { redacted, machine, user, session, sdk };
  }, [envVars]);

  const filteredRuntimes = useMemo(() => {
    const q = search.trim().toLowerCase();
    return runtimes.filter((rt) => {
      if (rtFilter !== 'all' && rt.category !== rtFilter) return false;
      if (!q) return true;
      return (
        rt.name.toLowerCase().includes(q) ||
        rt.version.toLowerCase().includes(q) ||
        rt.path.toLowerCase().includes(q)
      );
    });
  }, [runtimes, rtFilter, search]);

  const filteredPaths = useMemo(() => {
    const q = search.trim().toLowerCase();
    return pathEntries.filter((item) => {
      if (pathFilter === 'verified' && !item.exists) return false;
      if (pathFilter === 'missing' && item.exists) return false;
      if (pathFilter === 'machine' && !(item.registrySource || '').includes('HKLM')) return false;
      if (pathFilter === 'user' && !(item.registrySource || '').includes('HKCU')) return false;
      if (pathFilter === 'session' && !(item.registrySource || '').includes('Session')) return false;
      if (!q) return true;
      return (
        item.path.toLowerCase().includes(q) ||
        item.scope.toLowerCase().includes(q) ||
        (item.registrySource || '').toLowerCase().includes(q) ||
        (item.sampleExecutables || []).some((e) => e.toLowerCase().includes(q))
      );
    });
  }, [pathEntries, pathFilter, search]);

  const filteredVars = useMemo(() => {
    const q = search.trim().toLowerCase();
    return envVars.filter((v) => {
      if (envFilter === 'machine' && !(v.source || '').includes('HKLM')) return false;
      if (envFilter === 'user' && !(v.source || '').includes('HKCU')) return false;
      if (envFilter === 'session' && v.source && !v.source.includes('Session')) return false;
      if (envFilter === 'sdk' && v.category !== 'Developer / SDK') return false;
      if (envFilter === 'sensitive' && !v.isSensitive) return false;
      if (!q) return true;
      return (
        v.key.toLowerCase().includes(q) ||
        (!v.isSensitive && v.value.toLowerCase().includes(q)) ||
        (v.source || '').toLowerCase().includes(q) ||
        (v.category || '').toLowerCase().includes(q)
      );
    });
  }, [envVars, envFilter, search]);

  const sdkHomeVars = useMemo(
    () => envVars.filter((v) => v.category === 'Developer / SDK' && !v.isSensitive),
    [envVars]
  );

  const visibleKeys = useMemo(() => {
    if (section === 'path') return filteredPaths.map((p) => `path-${p.index}`);
    if (section === 'env') return filteredVars.map((v) => `env-${v.key}`);
    return [];
  }, [section, filteredPaths, filteredVars]);

  const allExpanded = visibleKeys.length > 0 && visibleKeys.every((k) => expandedKeys[k]);

  const toggleExpand = (k: string) => {
    setExpandedKeys((prev) => ({ ...prev, [k]: !prev[k] }));
  };

  const toggleAllVisible = () => {
    setExpandedKeys((prev) => {
      const next = { ...prev };
      const target = !allExpanded;
      visibleKeys.forEach((k) => {
        next[k] = target;
      });
      return next;
    });
  };

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* 4-Card Summary Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Developer Runtimes</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <SectionIcon kind="runtime" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-emerald-300">{runtimes.length}</strong>
            <span className="text-[11px] font-mono text-zinc-400">SDKs &amp; CLI Tools</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {pathStats.executables.toLocaleString()} Executables on PATH
          </span>
        </div>

        <button
          type="button"
          onClick={() => {
            setSection('path');
            setPathFilter('all');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            section === 'path' && pathFilter !== 'missing' ? 'ring-1 ring-sky-400/50 border-sky-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Verified PATH Folders</span>
            <span className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300">
              <SectionIcon kind="path" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-sky-300">{pathStats.verified}</strong>
            <span className="text-[11px] font-mono text-zinc-400">/ {pathEntries.length} Total</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {pathStats.machine} HKLM · {pathStats.user} HKCU · {pathStats.session} Session
          </span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSection('path');
            setPathFilter('missing');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            section === 'path' && pathFilter === 'missing' ? 'ring-1 ring-rose-400/50 border-rose-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">PATH Hygiene Audit</span>
            <span className="w-6 h-6 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-300">
              <SectionIcon kind="missing" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className={`text-xl font-extrabold font-mono tabular-nums ${pathStats.missing > 0 ? 'text-rose-300' : 'text-emerald-300'}`}>
              {pathStats.missing} Missing
            </strong>
            {env?.duplicatePathCount ? (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 text-[10px] font-mono">
                {env.duplicatePathCount} Dupes Deduped
              </span>
            ) : null}
          </div>
          <span className="text-[11px] font-mono text-zinc-400">Click to Isolate Dead PATHs</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setSection('env');
            setEnvFilter('all');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            section === 'env' ? 'ring-1 ring-purple-400/50 border-purple-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Env Variables</span>
            <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <SectionIcon kind="env" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-purple-300">{envVars.length}</strong>
            <span className="text-[11px] font-mono text-zinc-400">{envStats.redacted} Secrets Masked</span>
          </div>
          <span className="text-[11px] font-mono text-zinc-400">
            {envStats.machine} Sys · {envStats.user} User · {envStats.sdk} SDK Keys
          </span>
        </button>
      </div>

      {/* Detected CLI Runtimes & Toolchains Matrix */}
      <section className="p-4 rounded-2xl system-card flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <SectionIcon kind="runtime" className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-bold text-white">Detected CLI Runtimes, SDKs &amp; Build Toolchains</span>
          </div>

          <div className="flex flex-wrap items-center gap-1.5">
            {(['all', 'Language / SDK', 'Package / Build', 'AI / Infra / CLI', 'System Shell'] as const).map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setRtFilter(cat)}
                className={`px-2 py-0.5 rounded-lg text-[10px] font-mono border cursor-pointer transition-colors ${
                  rtFilter === cat
                    ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-200 font-bold'
                    : 'bg-[#16161c] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {cat === 'all' ? `All (${runtimes.length})` : cat}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {filteredRuntimes.map((rt) => (
            <div key={rt.name} className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex items-center justify-between gap-2">
              <div className="flex flex-col min-w-0 gap-0.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <strong className="text-xs font-bold text-white">{rt.name}</strong>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300">
                    v{rt.version}
                  </span>
                  {rt.category && (
                    <span className="text-[9px] font-mono text-zinc-400 uppercase">{rt.category}</span>
                  )}
                </div>
                <code className="text-[10px] font-mono text-zinc-400 truncate">
                  {rt.path}
                  {rt.sizeBytes ? ` (${formatBytes(rt.sizeBytes)})` : ''}
                </code>
              </div>
              <CopyButton text={rt.path} variant="icon-only" className="shrink-0" title={`Copy ${rt.name} binary path`} />
            </div>
          ))}
        </div>
      </section>

      {/* Toolbar */}
      <div className="p-4 rounded-2xl system-card flex flex-col gap-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-[#16161c] border border-white/[0.08] p-1">
            {(
              [
                { id: 'path', label: 'PATH Folders', count: pathEntries.length, badge: 'bg-sky-500/25 text-sky-200 border-sky-500/40' },
                { id: 'env', label: 'Environment Variables', count: envVars.length, badge: 'bg-purple-500/25 text-purple-200 border-purple-500/40' },
                { id: 'shell', label: 'Shell, PATHEXT & SDK Config', count: shellProfile?.pathext.length || 0, badge: 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40' },
              ] as const
            ).map((tab) => {
              const active = section === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setSection(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    active
                      ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
                  }`}
                >
                  <SectionIcon kind={tab.id} className="w-3.5 h-3.5 opacity-85" />
                  <span>{tab.label}</span>
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums border ${active ? `${tab.badge} font-bold` : 'bg-white/[0.05] text-zinc-300 border-white/[0.08]'}`}>
                    {tab.count}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-2 flex-1 xl:justify-end">
            <div className="relative flex-1 min-w-[220px] xl:max-w-sm">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  section === 'path'
                    ? 'Filter PATH folder, registry scope, or executable...'
                    : section === 'env'
                      ? 'Filter variable name, value, registry hive, or SDK...'
                      : 'Filter runtimes, PATHs, or shell variables...'
                }
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {section !== 'shell' && (
              <button
                type="button"
                onClick={toggleAllVisible}
                className="px-3 py-2 rounded-xl bg-[#16161c] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono font-bold text-zinc-200 cursor-pointer shrink-0 transition-colors"
              >
                {allExpanded ? '− Collapse All' : '+ Expand Visible'}
              </button>
            )}
          </div>
        </div>

        {/* Sub-Filter Pill Strip */}
        {section === 'path' && (
          <FilterPillBar
            tone="sky"
            activeId={pathFilter}
            onSelect={(id) => setPathFilter(id as PathFilter)}
            shownCount={visibleKeys.length}
            totalCount={pathEntries.length}
            items={[
              { id: 'all', label: `All (${pathEntries.length})` },
              { id: 'verified', label: `Verified (${pathStats.verified})` },
              { id: 'missing', label: `Missing (${pathStats.missing})`, danger: pathStats.missing > 0 },
              { id: 'machine', label: `Machine HKLM (${pathStats.machine})` },
              { id: 'user', label: `User HKCU (${pathStats.user})` },
              { id: 'session', label: `Session Injected (${pathStats.session})` },
            ]}
          />
        )}
        {section === 'env' && (
          <FilterPillBar
            tone="purple"
            activeId={envFilter}
            onSelect={(id) => setEnvFilter(id as EnvFilter)}
            shownCount={visibleKeys.length}
            totalCount={envVars.length}
            items={[
              { id: 'all', label: `All (${envVars.length})` },
              { id: 'machine', label: `Machine HKLM (${envStats.machine})` },
              { id: 'user', label: `User HKCU (${envStats.user})` },
              { id: 'session', label: `Session / Process (${envStats.session})` },
              { id: 'sdk', label: `Developer & SDK (${envStats.sdk})` },
              { id: 'sensitive', label: `Redacted Secrets (${envStats.redacted})` },
            ]}
          />
        )}
      </div>

      {/* SECTION 1: Expandable PATH Folders */}
      {section === 'path' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {filteredPaths.map((entry) => {
              const key = `path-${entry.index}`;
              const isOpen = Boolean(expandedKeys[key]);
              return (
                <div key={key} className="flex flex-col">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => toggleExpand(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(key);
                      }
                    }}
                    className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isOpen ? 'bg-sky-500/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <ExpandToggleCell isOpen={isOpen} tone="sky" />
                      <span className="text-[10px] font-mono tabular-nums text-zinc-500 w-6 shrink-0">#{entry.index}</span>
                      <code className="text-xs font-mono text-white break-all">{entry.path}</code>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0 pl-9 sm:pl-0" onClick={(e) => e.stopPropagation()}>
                      {entry.executableCount ? (
                        <span className="px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/25 text-[10px] font-mono text-sky-300">
                          {entry.executableCount} CLI / Exe
                        </span>
                      ) : null}
                      <span className="px-2 py-0.5 rounded bg-[#181820] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                        {entry.registrySource || entry.scope}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded border text-[10px] font-mono font-bold ${
                          entry.exists
                            ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                        }`}
                      >
                        {entry.exists ? 'Verified' : 'Missing'}
                      </span>
                      <CopyButton text={entry.path} variant="icon-only" />
                    </div>
                  </div>

                  {isOpen && (
                    <div className="px-5 py-3.5 bg-[#0b0b0f] border-t border-sky-400/15">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs sys-drawer-open">
                        <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                            Registry Provenance &amp; Scope
                          </span>
                          <strong className="text-white">{entry.registrySource || entry.scope}</strong>
                          <span className="text-[11px] font-mono text-zinc-400">
                            Resolution Order #{entry.index} · {entry.scope}
                          </span>
                        </div>

                        <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1.5 md:col-span-2">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                            Executables Discovered Inside Directory ({entry.executableCount || 0})
                          </span>
                          {entry.exists && (entry.sampleExecutables || []).length > 0 ? (
                            <div className="flex flex-wrap gap-1.5">
                              {(entry.sampleExecutables || []).map((exe) => (
                                <span
                                  key={exe}
                                  className="px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/25 text-[11px] font-mono text-emerald-300"
                                >
                                  {exe}
                                </span>
                              ))}
                              {(entry.executableCount || 0) > (entry.sampleExecutables || []).length && (
                                <span className="text-[11px] font-mono text-zinc-400 self-center">
                                  +{(entry.executableCount || 0) - (entry.sampleExecutables || []).length} more binaries
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-[11px] font-mono text-zinc-400">
                              {entry.exists
                                ? 'Directory exists on disk with no top-level .exe / .cmd / .bat launchers'
                                : 'Directory does not exist on disk — candidate for PATH cleanup'}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredPaths.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-400">No PATH directories matched your current filter.</div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 2: Expandable Environment Variables */}
      {section === 'env' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="divide-y divide-white/[0.05]">
            {filteredVars.map((item) => {
              const key = `env-${item.key}`;
              const isOpen = Boolean(expandedKeys[key]);
              const multiParts = !item.isSensitive && item.value.includes(';') ? item.value.split(';').filter(Boolean) : [];
              return (
                <div key={item.key} className="flex flex-col">
                  <div
                    role="button"
                    tabIndex={0}
                    aria-expanded={isOpen}
                    onClick={() => toggleExpand(key)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        toggleExpand(key);
                      }
                    }}
                    className={`px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 cursor-pointer transition-colors ${
                      isOpen ? 'bg-purple-500/[0.06]' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <span
                        className={`w-6 h-6 inline-flex items-center justify-center rounded-md border text-xs font-mono font-bold shrink-0 mt-0.5 ${
                          isOpen ? 'bg-purple-500/20 border-purple-400/50 text-purple-300' : 'bg-[#181820] border-white/[0.1] text-zinc-300'
                        }`}
                      >
                        {isOpen ? '−' : '+'}
                      </span>
                      <div className="flex flex-col gap-0.5 min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <strong className="text-xs font-mono text-sky-300">{item.key}</strong>
                          {item.category && (
                            <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[9px] font-mono text-zinc-300">
                              {item.category}
                            </span>
                          )}
                          {item.source && (
                            <span className="px-1.5 py-0.5 rounded bg-purple-500/10 border border-purple-500/25 text-[9px] font-mono text-purple-300">
                              {item.source}
                            </span>
                          )}
                          {item.isSensitive && (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-[9px] font-mono font-bold text-amber-300">
                              REDACTED SECRET
                            </span>
                          )}
                        </div>
                        <code className={`text-xs font-mono break-all ${item.isSensitive ? 'text-zinc-500 italic' : 'text-zinc-200'}`}>
                          {item.value}
                        </code>
                      </div>
                    </div>
                    {!item.isSensitive && (
                      <div onClick={(e) => e.stopPropagation()} className="shrink-0">
                        <CopyButton text={item.value} variant="icon-only" />
                      </div>
                    )}
                  </div>

                  {isOpen && (
                    <div className="px-5 py-3.5 bg-[#0b0b0f] border-t border-purple-400/15">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                            Origin &amp; Security Policy
                          </span>
                          <strong className="text-white">{item.source || 'Process Environment'}</strong>
                          <span className="text-[11px] font-mono text-zinc-400">
                            {item.isSensitive ? 'Auto-masked server-side (zero secret leak)' : `${item.value.length} characters · ${item.category}`}
                          </span>
                        </div>
                        <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1.5 md:col-span-2">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                              {multiParts.length > 1 ? `Multi-Segment Breakdown (${multiParts.length} items)` : 'Exact Variable Expression'}
                            </span>
                            {!item.isSensitive && <CopyButton text={`${item.key}=${item.value}`} label="Copy KEY=VAL" copiedLabel="Copied" />}
                          </div>
                          {multiParts.length > 1 ? (
                            <div className="flex flex-col gap-1">
                              {multiParts.map((seg, i) => (
                                <code key={`${seg}-${i}`} className="text-[11px] font-mono text-zinc-200 break-all">
                                  {i + 1}. {seg}
                                </code>
                              ))}
                            </div>
                          ) : (
                            <code className="text-[11px] font-mono text-zinc-200 break-all">{item.value}</code>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            {filteredVars.length === 0 && (
              <div className="py-8 text-center text-xs text-zinc-400">No environment variables matched your current filter.</div>
            )}
          </div>
        </section>
      )}

      {/* SECTION 3: Shell Profile, PATHEXT & SDK Variables */}
      {section === 'shell' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <section className="lg:col-span-5 p-5 rounded-2xl system-card flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Host Shell, Codepage &amp; Registry Counts</span>
              <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300">
                Windows Runtime
              </span>
            </div>

            <div className="grid grid-cols-1 gap-2.5 text-xs">
              <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Command Interpreter (COMSPEC)</span>
                <code className="font-mono text-white break-all">{shellProfile?.comspec || 'C:\\WINDOWS\\system32\\cmd.exe'}</code>
              </div>

              <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-1.5">
                <span className="text-[10px] font-mono uppercase text-zinc-400">
                  Executable Extension Precedence (PATHEXT)
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {(shellProfile?.pathext || ['.COM', '.EXE', '.BAT', '.CMD']).map((ext) => (
                    <span
                      key={ext}
                      className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-500/35 text-[10px] font-mono font-bold text-sky-300"
                    >
                      {ext}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">OS / FS Encoding</span>
                  <strong className="text-xs font-mono text-emerald-300">
                    {shellProfile?.preferredEncoding || 'cp1252'} / {shellProfile?.fsEncoding || 'utf-8'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-0.5">
                  <span className="text-[10px] font-mono uppercase text-zinc-400">Registry Env Keys</span>
                  <strong className="text-xs font-mono text-purple-300">
                    {shellProfile?.machineRegistryCount ?? 0} HKLM · {shellProfile?.userRegistryCount ?? 0} HKCU
                  </strong>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-1">
                <span className="text-[10px] font-mono uppercase text-zinc-400">Active Virtual Environment / Temp Root</span>
                <code className="font-mono text-zinc-200 break-all">
                  {shellProfile?.virtualEnv ? `Active VEnv: ${shellProfile.virtualEnv}` : `Temp: ${shellProfile?.tempDir || 'Default'}`}
                </code>
              </div>
            </div>
          </section>

          <section className="lg:col-span-7 p-5 rounded-2xl system-card flex flex-col gap-3.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Developer &amp; SDK Environment Anchors</span>
              <span className="text-[11px] font-mono text-zinc-400">{sdkHomeVars.length} Keys</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {sdkHomeVars.map((item) => (
                <div key={item.key} className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex items-center justify-between gap-2">
                  <div className="flex flex-col gap-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <strong className="text-xs font-mono text-sky-300">{item.key}</strong>
                      <span className="text-[9px] font-mono text-zinc-400">{item.source?.replace(' Registry', '')}</span>
                    </div>
                    <code className="text-[11px] font-mono text-zinc-200 break-all">{item.value}</code>
                  </div>
                  <CopyButton text={item.value} variant="icon-only" className="shrink-0" />
                </div>
              ))}
              {sdkHomeVars.length === 0 && (
                <div className="col-span-2 py-8 text-center text-xs text-zinc-400">No developer SDK environment keys detected.</div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
