import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { HeroArtworkBackdrop, ProportionalSpectrumBar } from '../../../components/PortalVisuals';
import TabLoadingState from '../../../components/TabLoadingState';
import { ProjectData } from '../../../types';

export interface ProjectApiTabProps {
  project: ProjectData;
  beUrl: string | null;
  rawEndpoints?: any[];
  isLoading?: boolean;
}

export interface ApiRouteItem {
  id: string;
  method: string;
  path: string;
  group: string;
  handler?: string;
  summary?: string;
  description?: string;
  isAsync?: boolean;
  file?: string;
}

function deriveGroupFromPath(path: string): string {
  const staticParts = path
    .trim()
    .replace(/^\/+/, '')
    .split('/')
    .filter((p) => p && !(p.startsWith('{') && p.endsWith('}')) && p !== 'api' && p !== 'v1' && p !== 'v2');

  if (staticParts.length >= 2) {
    const section = staticParts[0].replace(/[-_]/g, ' ');
    const sub = staticParts[1].replace(/[-_]/g, ' ');
    return `${section.charAt(0).toUpperCase() + section.slice(1)} · ${sub.charAt(0).toUpperCase() + sub.slice(1)}`;
  }
  if (staticParts.length === 1) {
    const section = staticParts[0].replace(/[-_]/g, ' ');
    return section.charAt(0).toUpperCase() + section.slice(1);
  }
  return 'General';
}

function extractPathParams(path: string): string[] {
  const matches = path.match(/\{([^}]+)\}/g) || [];
  return Array.from(new Set(matches.map((m) => m.slice(1, -1))));
}

function applyPathParams(path: string, values: Record<string, string>): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return normalized.replace(/\{([^}]+)\}/g, (_, key) => encodeURIComponent(values[key]?.trim() || `{${key}}`));
}

function isRedundantSummary(summary?: string, handler?: string): boolean {
  if (!summary) return true;
  if (!handler) return false;
  const norm = (v: string) => v.toLowerCase().replace(/[^a-z0-9]/g, '');
  return norm(summary) === norm(handler);
}

function renderRoutePath(path: string) {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const segments = normalized.split('/');
  const lastStaticIdx = segments.length - 1;

  return (
    <span className="inline-flex items-baseline flex-wrap font-mono text-xs min-w-0 leading-relaxed">
      {segments.map((seg, i) => {
        if (i === 0) return null;
        const isParam = seg.startsWith('{') && seg.endsWith('}');
        const isLast = i === lastStaticIdx;
        return (
          <React.Fragment key={`${i}-${seg}`}>
            <span className="text-zinc-600 select-none">/</span>
            {isParam ? (
              <span className="mx-0.5 px-1.5 py-0.5 rounded bg-amber-500/12 border border-amber-500/30 text-amber-300 font-semibold text-[11px]">
                {seg}
              </span>
            ) : (
              <span className={isLast ? 'text-white font-bold' : 'text-zinc-400 font-medium'}>
                {seg}
              </span>
            )}
          </React.Fragment>
        );
      })}
      {normalized === '/' && <span className="text-white font-bold">/</span>}
    </span>
  );
}

function getMethodBadgeStyle(method: string) {
  switch (method.toUpperCase()) {
    case 'GET':
      return {
        badge: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
        dot: 'bg-emerald-400',
        border: 'hover:border-emerald-500/40',
      };
    case 'POST':
      return {
        badge: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
        dot: 'bg-blue-400',
        border: 'hover:border-blue-500/40',
      };
    case 'PUT':
      return {
        badge: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
        dot: 'bg-amber-400',
        border: 'hover:border-amber-500/40',
      };
    case 'PATCH':
      return {
        badge: 'bg-purple-500/15 text-purple-400 border-purple-500/30',
        dot: 'bg-purple-400',
        border: 'hover:border-purple-500/40',
      };
    case 'DELETE':
      return {
        badge: 'bg-rose-500/15 text-rose-400 border-rose-500/30',
        dot: 'bg-rose-400',
        border: 'hover:border-rose-500/40',
      };
    default:
      return {
        badge: 'bg-[#16161c] text-zinc-300 border-zinc-700',
        dot: 'bg-zinc-400',
        border: 'hover:border-zinc-500',
      };
  }
}

export default function ProjectApiTab({ project, beUrl, rawEndpoints, isLoading = false }: ProjectApiTabProps) {
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [methodFilter, setMethodFilter] = useState<string>('ALL');
  const [activeGroupFilter, setActiveGroupFilter] = useState<string>('ALL');
  const [collapsedGroups, setCollapsedGroups] = useState<Record<string, boolean>>({});
  const [testingEndpointId, setTestingEndpointId] = useState<string | null>(null);
  const [testPayload, setTestPayload] = useState<string>('{}');
  const [pathParamValues, setPathParamValues] = useState<Record<string, string>>({});
  const [testResult, setTestResult] = useState<{
    endpointId: string;
    status: number | string;
    statusText: string;
    latency: number;
    body: string;
    isError: boolean;
  } | null>(null);
  const [isSending, setIsSending] = useState<boolean>(false);

  // Normalize all available endpoints
  const allRoutes = useMemo<ApiRouteItem[]>(() => {
    // 1. Prioritize rich AST endpoints
    if (rawEndpoints && rawEndpoints.length > 0) {
      return rawEndpoints.map((ep: any, idx: number) => {
        const method = (ep.method || 'GET').toUpperCase();
        const path = ep.path || '/';
        const group = ep.group || deriveGroupFromPath(path);
        return {
          id: `${method}-${path}-${idx}`,
          method,
          path,
          group,
          handler: ep.handler,
          summary: ep.summary,
          description: ep.description,
          isAsync: ep.isAsync,
          file: ep.file,
        };
      });
    }

    // 2. Fallback to project.apiEndpoints
    const sourceList = project.apiEndpoints || [];
    return sourceList.map((ep: any, idx: number) => {
      if (typeof ep === 'object' && ep !== null) {
        const method = (ep.method || 'GET').toUpperCase();
        const path = ep.path || '/';
        return {
          id: `${method}-${path}-${idx}`,
          method,
          path,
          group: ep.group || deriveGroupFromPath(path),
          handler: ep.handler,
          summary: ep.summary,
          description: ep.description,
          isAsync: ep.isAsync,
        };
      }
      const str = String(ep).trim();
      const parts = str.split(' ');
      const method = (parts.length > 1 ? parts[0] : 'GET').toUpperCase();
      const path = parts.length > 1 ? parts[1] : parts[0];
      return {
        id: `${method}-${path}-${idx}`,
        method,
        path,
        group: deriveGroupFromPath(path),
        summary: path.split('/').pop()?.replace(/[-_]/g, ' '),
      };
    });
  }, [rawEndpoints, project.apiEndpoints]);

  // Method Counts
  const methodStats = useMemo(() => {
    const stats: Record<string, number> = { ALL: allRoutes.length, GET: 0, POST: 0, PUT: 0, DELETE: 0 };
    allRoutes.forEach((r) => {
      const m = r.method.toUpperCase();
      stats[m] = (stats[m] || 0) + 1;
    });
    return stats;
  }, [allRoutes]);

  // Unique Groups
  const groupStats = useMemo(() => {
    const map = new Map<string, number>();
    allRoutes.forEach((r) => {
      map.set(r.group, (map.get(r.group) || 0) + 1);
    });
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [allRoutes]);

  // Filtered Routes
  const filteredRoutes = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return allRoutes.filter((r) => {
      // Method filter
      if (methodFilter !== 'ALL' && r.method.toUpperCase() !== methodFilter) return false;

      // Group filter
      if (activeGroupFilter !== 'ALL' && r.group !== activeGroupFilter) return false;

      // Search query
      if (!q) return true;
      return (
        r.path.toLowerCase().includes(q) ||
        r.method.toLowerCase().includes(q) ||
        r.group.toLowerCase().includes(q) ||
        (r.handler && r.handler.toLowerCase().includes(q)) ||
        (r.summary && r.summary.toLowerCase().includes(q))
      );
    });
  }, [allRoutes, filterQuery, methodFilter, activeGroupFilter]);

  // Grouped by Category
  const groupedRoutes = useMemo(() => {
    const groups: Record<string, ApiRouteItem[]> = {};
    filteredRoutes.forEach((r) => {
      if (!groups[r.group]) groups[r.group] = [];
      groups[r.group].push(r);
    });
    return groups;
  }, [filteredRoutes]);

  const toggleGroupCollapse = (grp: string) => {
    setCollapsedGroups((prev) => ({ ...prev, [grp]: !prev[grp] }));
  };

  const collapseAll = () => {
    const next: Record<string, boolean> = {};
    Object.keys(groupedRoutes).forEach((g) => {
      next[g] = true;
    });
    setCollapsedGroups(next);
  };

  const expandAll = () => {
    setCollapsedGroups({});
  };

  const handleExecuteLiveTest = async (route: ApiRouteItem) => {
    setIsSending(true);
    setTestResult(null);
    const start = performance.now();
    const resolvedPath = applyPathParams(route.path, pathParamValues);
    const targetUrl = beUrl ? `${beUrl}${resolvedPath}` : `http://localhost:${project.backendPort || 8000}${resolvedPath}`;

    try {
      const options: RequestInit = {
        method: route.method,
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
      };

      if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
        options.body = testPayload;
      }

      const res = await fetch(targetUrl, options);
      const latency = Math.max(1, Math.round(performance.now() - start));
      const text = await res.text();
      let formatted = text;
      try {
        const json = JSON.parse(text);
        formatted = JSON.stringify(json, null, 2);
      } catch {
        // keep text
      }

      setTestResult({
        endpointId: route.id,
        status: res.status,
        statusText: res.statusText || (res.ok ? 'OK' : 'Error'),
        latency,
        body: formatted,
        isError: !res.ok,
      });
    } catch (err: any) {
      const latency = Math.max(1, Math.round(performance.now() - start));
      setTestResult({
        endpointId: route.id,
        status: 'FETCH_FAIL',
        statusText: err?.message || 'Network / Port Offline',
        latency,
        body: JSON.stringify(
          {
            error: 'Failed to connect to backend server',
            targetUrl,
            hint: `Ensure server is running on port ${project.backendPort || 8000}`,
          },
          null,
          2
        ),
        isError: true,
      });
    } finally {
      setIsSending(false);
    }
  };

  if (allRoutes.length === 0 && isLoading) {
    return (
      <TabLoadingState
        variant="grid"
        title={`Inspecting ${project.title} API Endpoints`}
        subtitle="Scanning FastAPI router modules and OpenAPI route definitions..."
      />
    );
  }

  return (
    <section className="neu-card w-full flex flex-col gap-5 p-5 md:p-6 rounded-2xl bg-[#111115] border border-white/[0.08] animate-in fade-in duration-200 portal-stagger portal-header-sheen">
      <HeroArtworkBackdrop src="/visuals/tab-api-rest.jpg" alt="REST API Pipeline Visual" variant="corner" opacityClass="opacity-45 sm:opacity-58" />
      {/* ── Top Header Bar ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-white/[0.08]">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
              FASTAPI LIVE REST SUITE
            </span>
            <span className="text-zinc-600 font-bold">·</span>
            <span className="text-xs text-zinc-400 font-mono">
              Port :{project.backendPort || 8000}
            </span>
          </div>
          <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>API Endpoints &amp; Routers</span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-[#191922] border border-white/[0.1] text-zinc-300">
              {allRoutes.length} indexed
            </span>
          </h2>
          <p className="text-xs text-zinc-400">
            AST-discovered FastAPI routers, organized by service domain with interactive execution and cURL generator.
          </p>
        </div>

        {/* Global Toolbar */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={expandAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            title="Expand all resource groups"
          >
            Expand All
          </button>
          <button
            type="button"
            onClick={collapseAll}
            className="px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20 transition-all"
            title="Collapse all resource groups"
          >
            Collapse All
          </button>
          {beUrl && (
            <a
              href={`${beUrl}/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold neu-btn bg-[#1d1d26] border border-white/15 text-emerald-300 hover:text-emerald-200 hover:border-emerald-400/40 hover:bg-[#16161c] transition-all"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Swagger UI</span>
              <span className="text-[10px]">↗</span>
            </a>
          )}
        </div>
      </div>

      {/* ── HTTP Method Ratio Visual ── */}
      <ProportionalSpectrumBar
        title="HTTP METHOD DISTRIBUTION"
        segments={[
          { label: 'GET', value: methodStats['GET'] || 0, colorClass: 'bg-emerald-400', hex: '#34d399' },
          { label: 'POST', value: methodStats['POST'] || 0, colorClass: 'bg-blue-400', hex: '#60a5fa' },
          { label: 'PUT / PATCH', value: (methodStats['PUT'] || 0) + (methodStats['PATCH'] || 0), colorClass: 'bg-amber-400', hex: '#fbbf24' },
          { label: 'DELETE', value: methodStats['DELETE'] || 0, colorClass: 'bg-rose-400', hex: '#fb7185' },
        ]}
      />

      {/* ── Search & Filter Controls ── */}
      <div className="neu-tile flex flex-col md:flex-row md:items-center justify-between gap-3 p-3 rounded-xl bg-[#14141a] border border-white/[0.06]">
        {/* Method Chips */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 scrollbar-none">
          {(['ALL', 'GET', 'POST', 'PUT', 'DELETE'] as const).map((m) => {
            const count = methodStats[m] || 0;
            const isSelected = methodFilter === m;
            let badgeColor = 'text-zinc-400 hover:text-zinc-200 bg-[#191922] border-white/[0.08]';
            if (isSelected) {
              if (m === 'GET') badgeColor = 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold';
              else if (m === 'POST') badgeColor = 'bg-blue-500/20 text-blue-300 border-blue-500/40 font-bold';
              else if (m === 'PUT') badgeColor = 'bg-amber-500/20 text-amber-300 border-amber-500/40 font-bold';
              else if (m === 'DELETE') badgeColor = 'bg-rose-500/20 text-rose-300 border-rose-500/40 font-bold';
              else badgeColor = 'bg-white/15 text-white border-white/30 font-bold';
            }

            return (
              <button
                key={m}
                type="button"
                onClick={() => setMethodFilter(m)}
                className={`neu-btn inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-mono border transition-all shrink-0 ${badgeColor}`}
              >
                <span>{m}</span>
                <span className="text-[10px] opacity-75 font-sans font-semibold">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Search Bar */}
        <div className="relative flex items-center min-w-[260px] md:w-80">
          <svg className="absolute left-3 w-3.5 h-3.5 text-zinc-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={filterQuery}
            onChange={(e) => setFilterQuery(e.target.value)}
            placeholder="Search by path, handler, action..."
            aria-label="Filter endpoint routes"
            className="w-full h-8.5 pl-9 pr-8 rounded-lg bg-[#0a0a0e] border border-white/[0.1] text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/20 transition-all font-mono"
          />
          {filterQuery && (
            <button
              type="button"
              className="absolute right-2.5 text-xs text-zinc-400 hover:text-white p-1"
              onClick={() => setFilterQuery('')}
              title="Clear search"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Group Quick Filter Bar (if multiple groups) */}
      {groupStats.length > 1 && (
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs scrollbar-none">
          <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider shrink-0 pr-1">Domains:</span>
          <button
            type="button"
            onClick={() => setActiveGroupFilter('ALL')}
            className={`neu-btn px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
              activeGroupFilter === 'ALL'
                ? 'bg-white text-zinc-950 font-bold'
                : 'bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20'
            }`}
          >
            All Domains ({allRoutes.length})
          </button>
          {groupStats.map(([grp, cnt]) => (
            <button
              key={grp}
              type="button"
              onClick={() => setActiveGroupFilter(grp)}
              className={`neu-btn px-2.5 py-0.5 rounded-full text-[11px] font-semibold transition-all shrink-0 ${
                activeGroupFilter === grp
                  ? 'bg-emerald-400 text-zinc-950 font-bold'
                  : 'bg-[#16161c] border border-white/[0.08] text-zinc-300 hover:text-white hover:border-white/20'
              }`}
            >
              {grp} <span className="opacity-70">({cnt})</span>
            </button>
          ))}
        </div>
      )}

      {/* ── Main Grouped Endpoints List ── */}
      {Object.keys(groupedRoutes).length > 0 ? (
        <div key={`${methodFilter}-${activeGroupFilter}`} className="flex flex-col gap-4 portal-grid-stagger">
          {(Object.entries(groupedRoutes) as [string, ApiRouteItem[]][]).map(([groupTitle, routes]) => {
            const isCollapsed = Boolean(collapsedGroups[groupTitle]);
            const groupMethodCounts = routes.reduce<Record<string, number>>((acc, item) => {
              const m = item.method.toUpperCase();
              acc[m] = (acc[m] || 0) + 1;
              return acc;
            }, {});

            return (
              <div
                key={groupTitle}
                className="neu-card flex flex-col rounded-2xl bg-[#121217]/95 border border-white/[0.08] hover:border-white/[0.16] overflow-hidden transition-all"
              >
                {/* Group Header Banner */}
                <button
                  type="button"
                  onClick={() => toggleGroupCollapse(groupTitle)}
                  className="w-full flex flex-wrap items-center justify-between gap-3 px-4 py-3 bg-[#16161d] hover:bg-[#1a1a24] border-b border-white/[0.06] transition-all text-left group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-6 h-6 rounded-lg bg-[#0d0d12] border border-white/[0.08] flex items-center justify-center text-zinc-400 group-hover:text-white group-hover:border-white/20 transition-colors shrink-0">
                      <svg
                        className={`w-3.5 h-3.5 transition-transform duration-200 ${isCollapsed ? 'rotate-0' : 'rotate-90'}`}
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        aria-hidden="true"
                      >
                        <polyline points="9 18 15 12 9 6" />
                      </svg>
                    </span>
                    <div className="flex flex-wrap items-center gap-2 min-w-0">
                      <h3 className="text-sm font-extrabold text-white tracking-tight group-hover:text-emerald-300 transition-colors truncate">
                        {groupTitle}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-[#1d1d27] border border-white/[0.08] text-zinc-300">
                        {routes.length} {routes.length === 1 ? 'route' : 'routes'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <div className="hidden sm:flex items-center gap-1">
                      {Object.entries(groupMethodCounts).map(([m, cnt]) => {
                        const mStyle = getMethodBadgeStyle(m);
                        return (
                          <span
                            key={m}
                            className={`px-1.5 py-0.5 rounded text-[10px] font-mono font-bold border ${mStyle.badge}`}
                          >
                            {cnt} {m}
                          </span>
                        );
                      })}
                    </div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-mono font-semibold bg-[#0f0f14] border border-white/[0.08] text-zinc-400 group-hover:text-zinc-200 group-hover:border-white/[0.18] transition-colors">
                      <span>{isCollapsed ? 'Expand' : 'Collapse'}</span>
                    </span>
                  </div>
                </button>

                {/* Group Routes List */}
                {!isCollapsed && (
                  <div className="flex flex-col divide-y divide-white/[0.05] p-2 portal-list-stagger portal-drawer-enter">
                    {routes.map((route) => {
                      const style = getMethodBadgeStyle(route.method);
                      const isTesting = testingEndpointId === route.id;
                      const pathParams = extractPathParams(route.path);
                      const resolvedPath = isTesting ? applyPathParams(route.path, pathParamValues) : (route.path.startsWith('/') ? route.path : `/${route.path}`);
                      const fullUrl = beUrl ? `${beUrl}${resolvedPath}` : `http://localhost:${project.backendPort || 8000}${resolvedPath}`;
                      const curlCmd = `curl -X ${route.method} "${fullUrl}" -H "Accept: application/json"${
                        ['POST', 'PUT', 'PATCH'].includes(route.method) ? ' -H "Content-Type: application/json" -d \'{}\'' : ''
                      }`;
                      const hasTestResult = testResult && testResult.endpointId === route.id;
                      const showSummary = !isRedundantSummary(route.summary, route.handler);

                      return (
                        <div
                          key={route.id}
                          className={`neu-tile flex flex-col p-3.5 rounded-xl hover:bg-[#181821] gap-2 border border-transparent portal-row-hover ${style.border}`}
                        >
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-2.5">
                            {/* Route Path & Metadata */}
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {/* Method Badge */}
                              <span className={`w-20 justify-center px-2.5 py-1 rounded-md text-[11px] font-mono font-bold uppercase tracking-wider border shrink-0 flex items-center gap-1.5 ${style.badge}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                                <span>{route.method}</span>
                              </span>

                              {/* Formatted URL Path */}
                              <div className="flex items-center gap-2 min-w-0 flex-1 flex-wrap">
                                {renderRoutePath(route.path)}
                                {route.isAsync && (
                                  <span className="hidden sm:inline-flex items-center text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1d1d26] text-sky-300/90 border border-sky-400/20" title="Async FastAPI handler">
                                    async
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
                              <button
                                type="button"
                                onClick={() => {
                                  if (testingEndpointId === route.id) {
                                    setTestingEndpointId(null);
                                  } else {
                                    setTestingEndpointId(route.id);
                                    setTestResult(null);
                                    setPathParamValues({});
                                    if (['POST', 'PUT', 'PATCH'].includes(route.method)) {
                                      setTestPayload('{\n  "demo": true\n}');
                                    } else {
                                      setTestPayload('{}');
                                    }
                                  }
                                }}
                                className={`neu-btn inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold border transition-all cursor-pointer ${
                                  isTesting
                                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                    : 'bg-[#171720] border-white/[0.1] text-zinc-200 hover:text-white hover:border-emerald-400/40 hover:bg-emerald-500/10'
                                }`}
                                title="Open interactive test runner"
                              >
                                {isTesting ? (
                                  <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                  </svg>
                                ) : (
                                  <svg className="w-3 h-3 text-emerald-400" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                    <polygon points="6 4 20 12 6 20 6 4" />
                                  </svg>
                                )}
                                <span>{isTesting ? 'Close' : 'Try It'}</span>
                              </button>

                              <CopyButton text={fullUrl} variant="compact" label="URL" />
                              <CopyButton text={curlCmd} variant="compact" label="cURL" />
                            </div>
                          </div>

                          {/* Secondary info: docstring summary, handler function & source file */}
                          {(showSummary || route.handler || route.file) && (
                            <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-400 md:pl-[92px]">
                              {showSummary && (
                                <span className="text-zinc-300 text-xs font-medium">
                                  {route.summary}
                                </span>
                              )}
                              {route.handler && (
                                <code className="text-[11px] font-mono text-zinc-400 bg-[#0d0d12] px-2 py-0.5 rounded border border-white/[0.06]">
                                  {route.handler}()
                                </code>
                              )}
                              {route.file && (
                                <span className="text-[10px] font-mono text-zinc-500 truncate">
                                  {route.file}
                                </span>
                              )}
                            </div>
                          )}

                          {/* ── Interactive Test Drawer ── */}
                          {isTesting && (
                            <div className="neu-inset mt-2 p-4 rounded-xl bg-[#0c0c10] border border-emerald-500/30 flex flex-col gap-3 portal-drawer-enter">
                              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded shrink-0">
                                    LIVE TEST RUNNER
                                  </span>
                                  <span className="text-xs font-mono text-zinc-300 truncate max-w-lg">
                                    {fullUrl}
                                  </span>
                                </div>
                                <button
                                  type="button"
                                  disabled={isSending}
                                  onClick={() => handleExecuteLiveTest(route)}
                                  className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-zinc-950 transition-all disabled:opacity-50 cursor-pointer shrink-0"
                                >
                                  {isSending ? (
                                    <>
                                      <span className="animate-spin text-sm">↻</span>
                                      <span>Sending...</span>
                                    </>
                                  ) : (
                                    <>
                                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                                        <polygon points="6 4 20 12 6 20 6 4" />
                                      </svg>
                                      <span>Send Request</span>
                                    </>
                                  )}
                                </button>
                              </div>

                              {/* Path parameter inputs for parameterized endpoints */}
                              {pathParams.length > 0 && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                  {pathParams.map((param) => (
                                    <label key={param} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-[#07070a] border border-amber-500/25 text-xs font-mono">
                                      <span className="text-amber-300 shrink-0">{`{${param}}`}:</span>
                                      <input
                                        type="text"
                                        value={pathParamValues[param] || ''}
                                        onChange={(e) =>
                                          setPathParamValues((prev) => ({ ...prev, [param]: e.target.value }))
                                        }
                                        placeholder={`Enter ${param}...`}
                                        className="flex-1 bg-transparent text-white placeholder-zinc-600 focus:outline-none min-w-0"
                                      />
                                    </label>
                                  ))}
                                </div>
                              )}

                              {/* Payload editor for write methods */}
                              {['POST', 'PUT', 'PATCH'].includes(route.method) && (
                                <div className="flex flex-col gap-1">
                                  <span className="text-[11px] font-mono text-zinc-400">Request Body (JSON):</span>
                                  <textarea
                                    value={testPayload}
                                    onChange={(e) => setTestPayload(e.target.value)}
                                    rows={3}
                                    className="w-full p-2.5 rounded-lg bg-[#07070a] border border-white/[0.1] text-xs font-mono text-emerald-300 focus:outline-none focus:border-emerald-500/50 resize-y"
                                  />
                                </div>
                              )}

                              {/* Test Result Display */}
                              {hasTestResult && (
                                <div className="flex flex-col gap-2 pt-2 border-t border-white/[0.06]">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-xs font-mono">
                                      <span
                                        className={`px-2 py-0.5 rounded font-bold ${
                                          testResult.isError
                                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                                            : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                        }`}
                                      >
                                        HTTP {testResult.status} {testResult.statusText}
                                      </span>
                                      <span className="text-zinc-500">·</span>
                                      <span className="text-zinc-400">{testResult.latency} ms</span>
                                    </div>
                                    <CopyButton text={testResult.body} variant="compact" label="Copy Response" />
                                  </div>

                                  <pre className="p-3 rounded-lg bg-[#07070a] border border-white/[0.08] text-xs font-mono text-zinc-300 overflow-x-auto max-h-56 scrollbar-thin">
                                    {testResult.body}
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-[#14141a] border border-white/[0.08] text-center flex flex-col items-center gap-3">
          <p className="text-xs text-zinc-400 max-w-md">
            {filterQuery || methodFilter !== 'ALL' || activeGroupFilter !== 'ALL'
              ? 'No endpoints match your active filter criteria.'
              : 'No endpoints explicitly declared. Standard healthcheck route available below:'}
          </p>
          {(filterQuery || methodFilter !== 'ALL' || activeGroupFilter !== 'ALL') && (
            <button
              type="button"
              onClick={() => {
                setFilterQuery('');
                setMethodFilter('ALL');
                setActiveGroupFilter('ALL');
              }}
              className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/[0.08] text-white hover:bg-white/[0.15] transition-all"
            >
              Reset Filters
            </button>
          )}
          {project.backendPort && (
            <div className="flex items-center justify-between w-full max-w-md p-3 rounded-xl bg-[#171720] border border-white/[0.08]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                  GET
                </span>
                <code className="text-xs font-mono text-white">/api/health</code>
              </div>
              <CopyButton text={`http://localhost:${project.backendPort}/api/health`} variant="compact" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
