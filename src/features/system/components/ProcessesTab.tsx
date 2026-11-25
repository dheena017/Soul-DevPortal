import React, { useEffect, useMemo, useState } from 'react';
import CopyButton from '../../../components/CopyButton';
import { ActiveConnectionMetric, ActivePortMetric, ProcessMetric, SystemLiveSnapshot } from '../../../types';
import { formatBytes } from '../systemConstants';
import { ExpandToggleCell, FilterPillBar, TableLoadAllFooter } from './SystemTablePrimitives';

export interface ProcessesTabProps {
  live: SystemLiveSnapshot;
}

type SectionKey = 'processes' | 'ports' | 'connections';
type SortField = 'cpu' | 'memory' | 'disk' | 'threads' | 'pid' | 'ppid' | 'name';
type ProcessFilter = 'all' | 'pinned' | 'active_cpu' | 'disk_io' | 'with_ports' | 'heavy_ram' | 'user_space';
type PortFilter = 'all' | 'tcp' | 'udp' | 'exposed' | 'loopback' | 'portal';
type ConnFilter = 'all' | 'established' | 'external' | 'local' | 'time_wait';

const PINNED_STORAGE_KEY = 'soul.system.pinnedProcs';

function loadPinnedProcs(): string[] {
  try {
    const raw = localStorage.getItem(PINNED_STORAGE_KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr.map((x) => String(x).toLowerCase()) : [];
  } catch {
    return [];
  }
}

function SectionIcon({ kind, className }: { kind: SectionKey | 'threads'; className?: string }) {
  if (kind === 'processes') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (kind === 'threads') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v20M2 12h20M4.93 4.93l14.14 14.14M19.07 4.93 4.93 19.07" />
      </svg>
    );
  }
  if (kind === 'ports') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="6" cy="6" r="3" />
      <circle cx="18" cy="18" r="3" />
      <path d="M8.5 8.5 15.5 15.5M18 6a3 3 0 1 0 0 .01M6 18a3 3 0 1 0 0 .01" />
    </svg>
  );
}

export default function ProcessesTab({ live }: ProcessesTabProps) {
  const activeConnections: ActiveConnectionMetric[] = live.activeConnections || [];

  const [viewSection, setViewSection] = useState<SectionKey>('processes');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortField>('cpu');
  const [procFilter, setProcFilter] = useState<ProcessFilter>('all');
  const [portFilter, setPortFilter] = useState<PortFilter>('all');
  const [connFilter, setConnFilter] = useState<ConnFilter>('all');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [showAllRows, setShowAllRows] = useState(false);
  const [pinnedNames, setPinnedNames] = useState<string[]>(loadPinnedProcs);

  useEffect(() => {
    try {
      localStorage.setItem(PINNED_STORAGE_KEY, JSON.stringify(pinnedNames));
    } catch {
      // ignore storage quota errors
    }
  }, [pinnedNames]);

  const pinnedSet = useMemo(() => new Set(pinnedNames), [pinnedNames]);

  const togglePin = (procName: string) => {
    const low = procName.toLowerCase();
    setPinnedNames((prev) => (prev.includes(low) ? prev.filter((x) => x !== low) : [...prev, low]));
  };

  const procStats = useMemo(() => {
    const activeCpu = live.processes.filter((p) => p.cpuPercent > 0).length;
    const diskActive = live.processes.filter((p) => (p.ioReadBps || 0) + (p.ioWriteBps || 0) > 1024).length;
    const withPorts = live.processes.filter((p) => p.ports.length > 0).length;
    const heavyRam = live.processes.filter((p) => p.memoryMB >= 100).length;
    const pinnedCount = live.processes.filter((p) => pinnedSet.has(p.name.toLowerCase())).length;
    const userSpace = live.processes.filter(
      (p) => p.username && !p.username.toLowerCase().includes('nt authority\\') && !p.username.toLowerCase().includes('window manager\\')
    ).length;
    const totalThreads = live.totalThreadsCount || live.processes.reduce((sum, p) => sum + (p.threads || 0), 0);
    return { activeCpu, diskActive, withPorts, heavyRam, pinnedCount, userSpace, totalThreads };
  }, [live.processes, live.totalThreadsCount, pinnedSet]);

  const portStats = useMemo(() => {
    const tcp = live.activePorts.filter((p) => p.protocol === 'TCP').length;
    const udp = live.activePorts.filter((p) => p.protocol === 'UDP').length;
    const exposed = live.activePorts.filter((p) => p.exposure === 'All Interfaces' || p.exposure === 'LAN / Private').length;
    const loopback = live.activePorts.filter((p) => p.exposure === 'Loopback').length;
    const portal = live.activePorts.filter((p) => p.isWorkspaceApp || p.isDevPortal).length;
    return { tcp, udp, exposed, loopback, portal };
  }, [live.activePorts]);

  const connStats = useMemo(() => {
    const established = activeConnections.filter((c) => c.status === 'ESTABLISHED').length;
    const external = activeConnections.filter((c) => c.remoteScope === 'External Remote').length;
    const local = activeConnections.filter((c) => c.remoteScope === 'Loopback' || c.remoteScope === 'LAN / Private').length;
    const timeWait = activeConnections.filter((c) => c.status === 'TIME_WAIT').length;
    return { established, external, local, timeWait };
  }, [activeConnections]);

  const filteredProcesses = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = live.processes.filter((p) => {
      const isPinned = pinnedSet.has(p.name.toLowerCase());
      if (procFilter === 'pinned' && !isPinned) return false;
      if (procFilter === 'active_cpu' && p.cpuPercent <= 0) return false;
      if (procFilter === 'disk_io' && (p.ioReadBps || 0) + (p.ioWriteBps || 0) <= 1024) return false;
      if (procFilter === 'with_ports' && p.ports.length === 0) return false;
      if (procFilter === 'heavy_ram' && p.memoryMB < 100) return false;
      if (
        procFilter === 'user_space' &&
        (!p.username || p.username.toLowerCase().includes('nt authority\\') || p.username.toLowerCase().includes('window manager\\'))
      ) {
        return false;
      }
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        String(p.pid).includes(q) ||
        (p.ppid ? String(p.ppid).includes(q) : false) ||
        (p.username || '').toLowerCase().includes(q) ||
        (p.exePath || '').toLowerCase().includes(q) ||
        (p.cmdline || '').toLowerCase().includes(q) ||
        p.ports.some((port) => String(port).includes(q))
      );
    });

    return [...list].sort((a, b) => {
      if (procFilter === 'all') {
        const pa = pinnedSet.has(a.name.toLowerCase()) ? 0 : 1;
        const pb = pinnedSet.has(b.name.toLowerCase()) ? 0 : 1;
        if (pa !== pb) return pa - pb;
      }
      if (sortBy === 'memory') return b.memoryBytes - a.memoryBytes;
      if (sortBy === 'disk') return (b.ioReadBps || 0) + (b.ioWriteBps || 0) - ((a.ioReadBps || 0) + (a.ioWriteBps || 0));
      if (sortBy === 'threads') return b.threads - a.threads;
      if (sortBy === 'pid') return a.pid - b.pid;
      if (sortBy === 'ppid') return (a.ppid || 0) - (b.ppid || 0);
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return b.cpuPercent - a.cpuPercent || b.memoryBytes - a.memoryBytes;
    });
  }, [live.processes, procFilter, searchQuery, sortBy, pinnedSet]);

  const filteredPorts = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return live.activePorts.filter((item) => {
      if (portFilter === 'tcp' && item.protocol !== 'TCP') return false;
      if (portFilter === 'udp' && item.protocol !== 'UDP') return false;
      if (portFilter === 'exposed' && item.exposure !== 'All Interfaces' && item.exposure !== 'LAN / Private') return false;
      if (portFilter === 'loopback' && item.exposure !== 'Loopback') return false;
      if (portFilter === 'portal' && !item.isWorkspaceApp && !item.isDevPortal) return false;
      if (!q) return true;
      return (
        String(item.port).includes(q) ||
        item.serviceLabel.toLowerCase().includes(q) ||
        (item.processName || '').toLowerCase().includes(q) ||
        item.address.toLowerCase().includes(q) ||
        (item.pid ? String(item.pid).includes(q) : false)
      );
    });
  }, [live.activePorts, portFilter, searchQuery]);

  const filteredConnections = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return activeConnections.filter((c) => {
      if (connFilter === 'established' && c.status !== 'ESTABLISHED') return false;
      if (connFilter === 'external' && c.remoteScope !== 'External Remote') return false;
      if (connFilter === 'local' && c.remoteScope !== 'Loopback' && c.remoteScope !== 'LAN / Private') return false;
      if (connFilter === 'time_wait' && c.status !== 'TIME_WAIT') return false;
      if (!q) return true;
      return (
        (c.processName || '').toLowerCase().includes(q) ||
        String(c.localPort).includes(q) ||
        String(c.remotePort).includes(q) ||
        c.remoteAddress.toLowerCase().includes(q) ||
        c.localAddress.toLowerCase().includes(q) ||
        c.status.toLowerCase().includes(q) ||
        (c.pid ? String(c.pid).includes(q) : false)
      );
    });
  }, [activeConnections, connFilter, searchQuery]);

  const rowLimit = showAllRows || searchQuery.trim().length > 0 ? 1000 : 120;
  const visibleProcesses = useMemo(() => filteredProcesses.slice(0, rowLimit), [filteredProcesses, rowLimit]);
  const visibleConnections = useMemo(() => filteredConnections.slice(0, rowLimit), [filteredConnections, rowLimit]);

  const activeTotalCount =
    viewSection === 'processes'
      ? filteredProcesses.length
      : viewSection === 'ports'
        ? filteredPorts.length
        : filteredConnections.length;

  const visibleRowKeys = useMemo(() => {
    if (viewSection === 'processes') return visibleProcesses.map((p) => `proc-${p.pid}`);
    if (viewSection === 'ports') return filteredPorts.map((item, i) => `port-${item.protocol}-${item.port}-${item.address}-${i}`);
    return visibleConnections.map((c, i) => `conn-${c.protocol}-${c.localPort}-${c.remoteAddress}-${c.remotePort}-${i}`);
  }, [viewSection, visibleProcesses, filteredPorts, visibleConnections]);

  const allVisibleExpanded = visibleRowKeys.length > 0 && visibleRowKeys.every((k) => expandedKeys[k]);

  const toggleExpand = (key: string) => {
    setExpandedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAllVisible = () => {
    setExpandedKeys((prev) => {
      const next = { ...prev };
      const target = !allVisibleExpanded;
      visibleRowKeys.forEach((k) => {
        next[k] = target;
      });
      return next;
    });
  };

  const handleRowKeyDown = (e: React.KeyboardEvent, key: string) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleExpand(key);
    }
  };

  const switchSection = (next: SectionKey) => {
    setViewSection(next);
    setShowAllRows(false);
  };

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* 4-Card KPI Overview Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => {
            switchSection('processes');
            setProcFilter('all');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            viewSection === 'processes' ? 'ring-1 ring-sky-400/50 border-sky-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Running Processes</span>
            <span className="w-6 h-6 rounded-lg bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-300">
              <SectionIcon kind="processes" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-sky-300">{live.totalProcessesCount}</strong>
            <span className="text-[11px] font-mono text-zinc-400">All {live.processes.length} Enriched</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-300 border border-sky-500/30">
              {procStats.activeCpu} Active CPU
            </span>
            <span className="text-zinc-400">{procStats.diskActive} Disk Active</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            switchSection('processes');
            setSortBy('threads');
          }}
          className="p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">OS Threads &amp; Watchlist</span>
            <span className="w-6 h-6 rounded-lg bg-purple-500/15 border border-purple-500/30 flex items-center justify-center text-purple-300">
              <SectionIcon kind="threads" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-purple-300">{procStats.totalThreads.toLocaleString()}</strong>
            <span className="text-[11px] font-mono text-zinc-400">OS Threads</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-300 border border-purple-500/30">
              {procStats.heavyRam} &gt;= 100 MB
            </span>
            <span className="text-zinc-400">{procStats.pinnedCount} Pinned ★</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            switchSection('ports');
            setPortFilter('all');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            viewSection === 'ports' ? 'ring-1 ring-emerald-400/50 border-emerald-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Listening Ports</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <SectionIcon kind="ports" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-emerald-300">{live.activePorts.length}</strong>
            <span className="text-[11px] font-mono text-zinc-400">
              {portStats.tcp} TCP · {portStats.udp} UDP
            </span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {portStats.exposed} Exposed
            </span>
            <span className="text-zinc-400">{portStats.loopback} Loopback</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            switchSection('connections');
            setConnFilter('established');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            viewSection === 'connections' ? 'ring-1 ring-amber-400/50 border-amber-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Active Sockets</span>
            <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <SectionIcon kind="connections" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-amber-300">{live.socketCounts.established} Est</strong>
            <span className="text-[11px] font-mono text-zinc-400">{live.socketCounts.total} Total</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {connStats.external} External
            </span>
            <span className="text-zinc-400">{live.socketCounts.timeWait} Time-Wait</span>
          </div>
        </button>
      </div>

      {/* Unified 3-Section Switcher, Filter Strip & Search */}
      <div className="p-4 rounded-2xl system-card flex flex-col gap-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl bg-[#16161c] border border-white/[0.08] p-1">
            {(
              [
                { id: 'processes', label: 'All Processes', count: live.processes.length, badge: 'bg-sky-500/25 text-sky-200 border-sky-500/40' },
                { id: 'ports', label: 'Listening Ports', count: live.activePorts.length, badge: 'bg-emerald-500/25 text-emerald-200 border-emerald-500/40' },
                { id: 'connections', label: 'Live Connections', count: activeConnections.length, badge: 'bg-amber-500/25 text-amber-200 border-amber-500/40' },
              ] as const
            ).map((tab) => {
              const active = viewSection === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchSection(tab.id)}
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
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={
                  viewSection === 'processes'
                    ? 'Filter process, PID, PPID, user, port, or cmdline...'
                    : viewSection === 'ports'
                      ? 'Filter port, protocol, service, address, or process...'
                      : 'Filter peer IP, local/remote port, state, or process...'
                }
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400/50"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  aria-label="Clear search"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            {viewSection === 'processes' && (
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortField)}
                aria-label="Sort processes by"
                className="px-3 py-2 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs font-mono text-zinc-200 focus:outline-none focus:border-sky-400/50 cursor-pointer"
              >
                <option value="cpu">Sort: CPU %</option>
                <option value="memory">Sort: Memory MB</option>
                <option value="disk">Sort: Disk I/O</option>
                <option value="threads">Sort: Threads</option>
                <option value="name">Sort: Name</option>
                <option value="pid">Sort: PID</option>
                <option value="ppid">Sort: Parent PID</option>
              </select>
            )}

            <button
              type="button"
              onClick={toggleAllVisible}
              className="px-3 py-2 rounded-xl bg-[#16161c] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono font-bold text-zinc-200 cursor-pointer shrink-0 transition-colors"
            >
              {allVisibleExpanded ? '− Collapse All' : '+ Expand Visible'}
            </button>
          </div>
        </div>

        {/* Sub-Filter Pill Strip */}
        {viewSection === 'processes' && (
          <FilterPillBar
            tone="sky"
            activeId={procFilter}
            onSelect={(id) => setProcFilter(id as ProcessFilter)}
            shownCount={visibleRowKeys.length}
            totalCount={activeTotalCount}
            items={[
              { id: 'all', label: `All (${live.processes.length})` },
              { id: 'pinned', label: `Pinned ★ (${procStats.pinnedCount})` },
              { id: 'active_cpu', label: `Active CPU (${procStats.activeCpu})` },
              { id: 'disk_io', label: `Disk I/O (${procStats.diskActive})` },
              { id: 'with_ports', label: `With Ports (${procStats.withPorts})` },
              { id: 'heavy_ram', label: `RAM >= 100M (${procStats.heavyRam})` },
              { id: 'user_space', label: `User Apps (${procStats.userSpace})` },
            ]}
          />
        )}
        {viewSection === 'ports' && (
          <FilterPillBar
            tone="emerald"
            activeId={portFilter}
            onSelect={(id) => setPortFilter(id as PortFilter)}
            shownCount={visibleRowKeys.length}
            totalCount={activeTotalCount}
            items={[
              { id: 'all', label: `All (${live.activePorts.length})` },
              { id: 'tcp', label: `TCP (${portStats.tcp})` },
              { id: 'udp', label: `UDP (${portStats.udp})` },
              { id: 'exposed', label: `Exposed Interfaces (${portStats.exposed})` },
              { id: 'loopback', label: `Loopback (${portStats.loopback})` },
              { id: 'portal', label: `Portal & Dev (${portStats.portal})` },
            ]}
          />
        )}
        {viewSection === 'connections' && (
          <FilterPillBar
            tone="amber"
            activeId={connFilter}
            onSelect={(id) => setConnFilter(id as ConnFilter)}
            shownCount={visibleRowKeys.length}
            totalCount={activeTotalCount}
            items={[
              { id: 'all', label: `All Captured (${activeConnections.length})` },
              { id: 'established', label: `Established (${connStats.established})` },
              { id: 'external', label: `External Peers (${connStats.external})` },
              { id: 'local', label: `Loopback / LAN (${connStats.local})` },
              { id: 'time_wait', label: `Time-Wait (${connStats.timeWait})` },
            ]}
          />
        )}
      </div>

      {/* SECTION 1: All Running Processes */}
      {viewSection === 'processes' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
                  <th className="py-2.5 px-2 w-8 text-center">★</th>
                  <th className="py-2.5 px-3">PID / PPID</th>
                  <th className="py-2.5 px-3">Process, Owner &amp; Bound Ports</th>
                  <th className="py-2.5 px-3 text-right">CPU %</th>
                  <th className="py-2.5 px-3 text-right">Memory (RSS)</th>
                  <th className="py-2.5 px-3 text-right">Disk R/W</th>
                  <th className="py-2.5 px-3 text-right">Threads</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05]">
                {visibleProcesses.map((proc: ProcessMetric) => {
                  const key = `proc-${proc.pid}`;
                  const isOpen = Boolean(expandedKeys[key]);
                  const isPinned = pinnedSet.has(proc.name.toLowerCase());
                  const shortUser = proc.username ? proc.username.split('\\').pop() || proc.username : 'System';
                  const diskRate = (proc.ioReadBps || 0) + (proc.ioWriteBps || 0);
                  return (
                    <React.Fragment key={key}>
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        onClick={() => toggleExpand(key)}
                        onKeyDown={(e) => handleRowKeyDown(e, key)}
                        className={`cursor-pointer transition-colors focus:outline-none focus:bg-sky-500/[0.08] ${
                          isOpen ? 'bg-sky-500/[0.06]' : isPinned ? 'bg-amber-500/[0.03] hover:bg-amber-500/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-2 text-center">
                          <ExpandToggleCell isOpen={isOpen} tone="sky" />
                        </td>
                        <td className="py-2.5 px-2 text-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            type="button"
                            onClick={() => togglePin(proc.name)}
                            title={isPinned ? `Unpin ${proc.name}` : `Pin ${proc.name} to Watchlist`}
                            aria-label={isPinned ? `Unpin ${proc.name}` : `Pin ${proc.name}`}
                            className={`text-sm leading-none cursor-pointer transition-colors ${
                              isPinned ? 'text-amber-300' : 'text-zinc-600 hover:text-zinc-300'
                            }`}
                          >
                            {isPinned ? '★' : '☆'}
                          </button>
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums text-xs">
                          <div className="flex flex-col">
                            <span className="text-zinc-200 font-bold">{proc.pid}</span>
                            {proc.ppid ? <span className="text-[10px] text-zinc-400">PPID {proc.ppid}</span> : null}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="text-xs font-bold text-white">{proc.name}</span>
                              {proc.ports.slice(0, 4).map((pt) => (
                                <span
                                  key={pt}
                                  className={`px-1.5 py-0.5 rounded border text-[10px] font-mono font-bold ${
                                    pt === 5181 || pt === 8008
                                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                                      : 'bg-sky-500/15 border-sky-400/30 text-sky-300'
                                  }`}
                                >
                                  :{pt}
                                </span>
                              ))}
                              {proc.ports.length > 4 && (
                                <span className="text-[10px] font-mono text-sky-300">+{proc.ports.length - 4}</span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-zinc-400">
                              {shortUser}
                              {proc.parentName ? ` · child of ${proc.parentName}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold text-sky-300">
                          {proc.cpuPercent.toFixed(1)}%
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs font-bold text-purple-300">
                          {proc.memoryMB.toFixed(1)} MB
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-emerald-300">
                          {diskRate > 0 ? `${formatBytes(diskRate, 1)}/s` : '0 B/s'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono tabular-nums text-xs text-zinc-300">{proc.threads}</td>
                        <td className="py-2.5 pl-3 pr-5 text-right">
                          <span className="px-2 py-0.5 rounded bg-[#181820] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                            {proc.status}
                          </span>
                        </td>
                      </tr>

                      {isOpen && (
                        <tr className="bg-[#0b0b0f]">
                          <td colSpan={9} className="p-4 border-t border-sky-400/15">
                            <div className="flex flex-col gap-3 text-xs sys-drawer-open">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Identity &amp; Process Tree
                                  </span>
                                  <strong className="text-white font-mono">
                                    PID {proc.pid} {proc.ppid ? `← PPID ${proc.ppid}` : ''}
                                  </strong>
                                  <span className="text-[11px] font-mono text-zinc-400">
                                    {proc.username || 'NT AUTHORITY\\SYSTEM'}
                                    {proc.parentName ? ` · Parent: ${proc.parentName}` : ''}
                                  </span>
                                  {proc.startedAt && (
                                    <span className="text-[10px] font-mono text-zinc-400">Started: {proc.startedAt}</span>
                                  )}
                                </div>

                                <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Listeners &amp; Disk I/O Footprint
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {proc.ports.length > 0 ? (
                                      proc.ports.map((pt) => (
                                        <span key={pt} className="px-1.5 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono text-emerald-300">
                                          :{pt}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] font-mono text-zinc-400">No listening TCP/UDP sockets</span>
                                    )}
                                  </div>
                                  <span className="text-[11px] font-mono text-zinc-300">
                                    Disk Live: R {formatBytes(proc.ioReadBps || 0)}/s · W {formatBytes(proc.ioWriteBps || 0)}/s
                                  </span>
                                  <span className="text-[10px] font-mono text-zinc-400">
                                    Total Cumulative: {formatBytes(proc.ioReadBytes || 0)} R · {formatBytes(proc.ioWriteBytes || 0)} W
                                  </span>
                                </div>

                                <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                      Command Line (Redacted)
                                    </span>
                                    {proc.cmdline && <CopyButton text={proc.cmdline} label="Copy" copiedLabel="Copied" />}
                                  </div>
                                  <code className="text-[11px] font-mono text-sky-300 break-all">
                                    {proc.cmdline || 'Protected or OS Kernel Thread'}
                                  </code>
                                </div>
                              </div>

                              <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Executable Image Path
                                  </span>
                                  <code className="font-mono text-zinc-100 break-all">
                                    {proc.exePath || 'Protected / System Process'}
                                  </code>
                                </div>
                                {proc.exePath && <CopyButton text={proc.exePath} label="Copy Path" copiedLabel="Copied" className="shrink-0" />}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {visibleProcesses.length === 0 && (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-xs text-zinc-400">
                      No running processes matched your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Layout */}
          <div className="sm:hidden divide-y divide-white/[0.06]">
            {visibleProcesses.map((proc) => {
              const key = `proc-${proc.pid}`;
              const isOpen = Boolean(expandedKeys[key]);
              return (
                <div key={`m-${proc.pid}`} className="p-3.5 flex flex-col gap-2">
                  <button type="button" onClick={() => toggleExpand(key)} className="w-full flex items-center justify-between gap-2 text-left">
                    <div className="flex items-center gap-2 min-w-0">
                      <ExpandToggleCell isOpen={isOpen} tone="sky" />
                      <span className="text-xs font-bold text-white truncate">{proc.name}</span>
                      <span className="text-[10px] font-mono text-zinc-400">#{proc.pid}</span>
                    </div>
                    <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] shrink-0">
                      <span className="text-sky-300">{proc.cpuPercent.toFixed(1)}%</span>
                      <span className="text-purple-300">{proc.memoryMB.toFixed(0)}M</span>
                    </div>
                  </button>
                  {isOpen && (
                    <div className="p-2.5 rounded-lg bg-[#16161c] border border-white/[0.06] text-[11px] font-mono text-zinc-300 break-all flex flex-col gap-1">
                      <span>{proc.exePath || 'Protected / System Process'}</span>
                      {proc.cmdline && <span className="text-sky-300">{proc.cmdline}</span>}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {!searchQuery.trim() && (
            <TableLoadAllFooter
              visibleCount={visibleProcesses.length}
              totalCount={filteredProcesses.length}
              noun="live OS processes"
              showAll={showAllRows}
              onToggle={() => setShowAllRows((v) => !v)}
              tone="sky"
            />
          )}
        </section>
      )}

      {/* SECTION 2: Listening TCP/UDP Endpoints with (+) Details */}
      {viewSection === 'ports' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
                  <th className="py-2.5 px-3">Port</th>
                  <th className="py-2.5 px-3">Protocol</th>
                  <th className="py-2.5 px-3">Service Signature</th>
                  <th className="py-2.5 px-3">Owning Process</th>
                  <th className="py-2.5 px-3">Exposure</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Bind Address</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {filteredPorts.map((item: ActivePortMetric, i: number) => {
                  const key = `port-${item.protocol}-${item.port}-${item.address}-${i}`;
                  const isOpen = Boolean(expandedKeys[key]);
                  const scopeLabel = item.exposure || (item.address === '127.0.0.1' || item.address === '::1' ? 'Loopback' : 'All Interfaces');
                  return (
                    <React.Fragment key={key}>
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        onClick={() => toggleExpand(key)}
                        onKeyDown={(e) => handleRowKeyDown(e, key)}
                        className={`cursor-pointer transition-colors focus:outline-none focus:bg-emerald-500/[0.08] ${
                          isOpen ? 'bg-emerald-500/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-2 text-center">
                          <ExpandToggleCell isOpen={isOpen} tone="emerald" />
                        </td>
                        <td className="py-2.5 px-3 font-mono tabular-nums font-bold text-white">:{item.port}</td>
                        <td className="py-2.5 px-3">
                          <span className="px-2 py-0.5 rounded bg-[#181820] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                            {item.protocol} {item.family ? `· ${item.family}` : ''}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              item.isDevPortal
                                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                                : item.isWorkspaceApp
                                  ? 'bg-sky-500/15 border-sky-400/35 text-sky-300'
                                  : 'bg-[#181820] border-white/[0.1] text-zinc-200'
                            }`}
                          >
                            {item.serviceLabel}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-zinc-200">
                          <strong>{item.processName || 'System'}</strong>{' '}
                          {item.pid ? <span className="font-mono text-[10px] text-zinc-400">#{item.pid}</span> : null}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              scopeLabel === 'Loopback'
                                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                : scopeLabel === 'LAN / Private'
                                  ? 'bg-sky-500/10 border-sky-500/30 text-sky-300'
                                  : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                            }`}
                          >
                            {scopeLabel}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right font-mono text-zinc-300">{item.address}</td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0b0b0f]">
                          <td colSpan={7} className="p-4 border-t border-emerald-400/15">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                  Owning Process &amp; Memory
                                </span>
                                <strong className="text-white">
                                  {item.processName || 'System'} {item.pid ? `(#${item.pid})` : ''}
                                </strong>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  {item.memoryMB !== null && item.memoryMB !== undefined ? `Process RSS: ${item.memoryMB.toFixed(1)} MB` : 'Kernel / System Listener'}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                  Binding &amp; Exposure Posture
                                </span>
                                <strong className="text-emerald-300 font-mono">
                                  {item.address}:{item.port} ({item.protocol})
                                </strong>
                                <span className="text-[11px] text-zinc-400">
                                  {scopeLabel === 'Loopback'
                                    ? 'Localhost-only binding (not reachable externally)'
                                    : scopeLabel === 'LAN / Private'
                                      ? 'Bound specifically to private LAN / virtual interface'
                                      : 'Bound across all interfaces (subject to host firewall)'}
                                </span>
                              </div>

                              <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Owning Image Path
                                  </span>
                                  <CopyButton text={`${item.address}:${item.port}`} label="Copy Bind" copiedLabel="Copied" />
                                </div>
                                <code className="text-[11px] font-mono text-zinc-200 break-all">
                                  {item.exePath || 'NT Kernel / Protected Service Binary'}
                                </code>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredPorts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-xs text-zinc-400">
                      No listening ports matched your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 3: Active Network Connections */}
      {viewSection === 'connections' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
                  <th className="py-2.5 px-3">Owning Process</th>
                  <th className="py-2.5 px-3">Local Socket</th>
                  <th className="py-2.5 px-3">Remote Peer</th>
                  <th className="py-2.5 px-3">Scope</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {visibleConnections.map((conn: ActiveConnectionMetric, i: number) => {
                  const key = `conn-${conn.protocol}-${conn.localPort}-${conn.remoteAddress}-${conn.remotePort}-${i}`;
                  const isOpen = Boolean(expandedKeys[key]);
                  return (
                    <React.Fragment key={key}>
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        onClick={() => toggleExpand(key)}
                        onKeyDown={(e) => handleRowKeyDown(e, key)}
                        className={`cursor-pointer transition-colors focus:outline-none focus:bg-amber-500/[0.08] ${
                          isOpen ? 'bg-amber-500/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-2 text-center">
                          <ExpandToggleCell isOpen={isOpen} tone="amber" />
                        </td>
                        <td className="py-2.5 px-3">
                          <strong className="text-white">{conn.processName || 'Kernel / Closed PID'}</strong>{' '}
                          {conn.pid ? <span className="font-mono text-[10px] text-zinc-400">#{conn.pid}</span> : null}
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-300">
                          {conn.localAddress}:{conn.localPort}{' '}
                          <span className="text-[10px] text-zinc-500">{conn.protocol}</span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-sky-300">
                          {conn.remoteAddress}:{conn.remotePort}
                          {conn.remoteService ? <span className="ml-1.5 text-[10px] text-zinc-400">({conn.remoteService})</span> : null}
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              conn.remoteScope === 'External Remote'
                                ? 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                                : conn.remoteScope === 'LAN / Private'
                                  ? 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                                  : 'bg-white/[0.05] border-white/[0.08] text-zinc-300'
                            }`}
                          >
                            {conn.remoteScope}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              conn.status === 'ESTABLISHED'
                                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                                : conn.status === 'TIME_WAIT'
                                  ? 'bg-zinc-800 border-white/[0.1] text-zinc-400'
                                  : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                            }`}
                          >
                            {conn.status}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0b0b0f]">
                          <td colSpan={6} className="p-4 border-t border-amber-400/15">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                              <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Local Socket</span>
                                <code className="font-mono text-white">
                                  {conn.localAddress}:{conn.localPort} ({conn.protocol})
                                </code>
                              </div>
                              <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                <div className="flex items-center justify-between gap-2">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Remote Endpoint</span>
                                  <CopyButton text={`${conn.remoteAddress}:${conn.remotePort}`} label="Copy" copiedLabel="Copied" />
                                </div>
                                <code className="font-mono text-sky-300">
                                  {conn.remoteAddress}:{conn.remotePort} · {conn.remoteScope}
                                </code>
                              </div>
                              <div className="p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Process Binary</span>
                                <code className="font-mono text-zinc-200 break-all">
                                  {conn.exePath || 'Closed PID / Kernel Socket Tear-Down'}
                                </code>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {visibleConnections.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                      No active socket connections matched your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!searchQuery.trim() && (
            <TableLoadAllFooter
              visibleCount={visibleConnections.length}
              totalCount={filteredConnections.length}
              noun="captured sockets"
              showAll={showAllRows}
              onToggle={() => setShowAllRows((v) => !v)}
              tone="amber"
            />
          )}
        </section>
      )}
    </div>
  );
}
