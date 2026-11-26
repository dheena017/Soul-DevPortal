import React, { useCallback, useEffect, useRef, useState } from 'react';
import { HeaderEqualizerBars, HeroArtworkBackdrop, MiniRadialRing } from '../../../components/PortalVisuals';
import { HistoryWindowSec, SystemLiveSnapshot, SystemSpecs } from '../../../types';
import {
  buildDiagnosticReportMarkdown,
  formatUptime,
  HISTORY_WINDOW_OPTIONS,
  POLL_INTERVAL_OPTIONS,
  SystemSubTabId,
} from '../systemConstants';

export interface SystemHeaderCardProps {
  specs: SystemSpecs;
  live: SystemLiveSnapshot;
  activeTab: SystemSubTabId;
  onSelectTab: (tab: SystemSubTabId) => void;
  isPaused: boolean;
  isTabHidden: boolean;
  pollIntervalMs: number;
  historyWindowSec: HistoryWindowSec;
  streamMode: 'sse' | 'poll';
  isRescanning: boolean;
  onTogglePause: () => void;
  onChangePollInterval: (ms: number) => void;
  onChangeHistoryWindow: (sec: HistoryWindowSec) => void;
  onRescanHardware: () => void;
}

export default function SystemHeaderCard({
  specs,
  live,
  activeTab,
  onSelectTab,
  isPaused,
  isTabHidden,
  pollIntervalMs,
  historyWindowSec,
  streamMode,
  isRescanning,
  onTogglePause,
  onChangePollInterval,
  onChangeHistoryWindow,
  onRescanHardware,
}: SystemHeaderCardProps) {
  const [exportFlash, setExportFlash] = useState<'json' | 'md' | null>(null);

  const triggerDownload = (filename: string, content: string, mime: string, tag: 'json' | 'md') => {
    try {
      const blob = new Blob([content], { type: mime });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setExportFlash(tag);
      window.setTimeout(() => setExportFlash(null), 1600);
    } catch {
      // ignore
    }
  };

  const handleExportJson = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), specs, live }, null, 2);
    triggerDownload(`system-report-${specs.host.hostname}-${stamp}.json`, payload, 'application/json', 'json');
  };

  const handleExportMarkdown = () => {
    const stamp = new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-');
    const md = buildDiagnosticReportMarkdown(specs, live);
    triggerDownload(`system-report-${specs.host.hostname}-${stamp}.md`, md, 'text/markdown;charset=utf-8', 'md');
  };
  const { host, motherboard } = specs;
  const battery = live.battery;
  const posture = live.healthPosture;

  const tabsRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateScrollArrows = useCallback(() => {
    const el = tabsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    updateScrollArrows();
    const el = tabsRef.current;
    if (!el) return;
    const ro = new ResizeObserver(updateScrollArrows);
    ro.observe(el);
    window.addEventListener('resize', updateScrollArrows);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScrollArrows);
    };
  }, [updateScrollArrows, activeTab]);

  const scrollTabs = (dir: -1 | 1) => {
    const el = tabsRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * 260, behavior: 'smooth' });
  };

  const handleTabClick = (tab: SystemSubTabId, e: React.MouseEvent<HTMLButtonElement>) => {
    onSelectTab(tab);
    e.currentTarget.scrollIntoView({ behavior: 'smooth', inline: 'nearest', block: 'nearest' });
  };

  const postureCls =
    posture.severity === 'critical'
      ? 'bg-rose-500/15 border-rose-500/40 text-rose-300'
      : posture.severity === 'warn'
        ? 'bg-amber-500/15 border-amber-500/40 text-amber-300'
        : 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300';

  const statusActive = !isPaused && !isTabHidden;
  const hardwareCount =
    1 +
    specs.memory.modules.length +
    specs.graphics.length +
    specs.physicalDisks.length;
  const devicesCount =
    specs.displays.length +
    specs.peripherals.audio.length +
    specs.peripherals.usbControllers.length +
    specs.peripherals.cameras.length +
    specs.peripherals.bluetooth.length +
    (specs.peripherals.keyboards?.length || 0) +
    (specs.peripherals.pointingDevices?.length || 0);
  const storageNetCount = live.disk.volumes.length + live.networkAdapters.filter((n) => n.isUp).length;
  const startupServicesCount =
    (specs.startupApps?.length || 0) +
    (specs.services?.filter((s) => s.status === 'Running').length || 0);
  const envCount = (specs.environment?.pathEntries.length || 0) + (specs.environment?.totalEnvCount || 0);

  const tabClass = (isActive: boolean) =>
    `inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all whitespace-nowrap cursor-pointer shrink-0 ${
      isActive
        ? 'bg-zinc-800 text-white font-bold border border-white/20 shadow-sm'
        : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
    }`;

  return (
    <header className="relative overflow-hidden w-full p-4 sm:p-5 md:p-6 rounded-2xl system-card shadow-2xl flex flex-col gap-4 sm:gap-5">
      <HeroArtworkBackdrop src="/visuals/pillar-computer-silicon.jpg" alt="Hardware Silicon Die Architecture" opacityClass="opacity-80 sm:opacity-95" />
      <div className="relative z-10 flex flex-col gap-4 sm:gap-5">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Host Identity */}
        <div className="flex items-start gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl soul-emblem-box flex items-center justify-center text-sky-400 shrink-0 portal-emblem-hover">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
              <line x1="8" y1="21" x2="16" y2="21" />
              <line x1="12" y1="17" x2="12" y2="21" />
            </svg>
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight truncate">
                {host.manufacturer} {host.model}
              </h1>
              <span className="px-2 py-0.5 rounded-md text-[10px] font-mono font-bold bg-[#181820] border border-white/[0.1] text-zinc-300">
                {host.chassisType}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md border text-[10px] font-mono font-bold ${postureCls}`}
                title={posture.reasons.join(' · ')}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${posture.severity === 'critical' ? 'bg-rose-400' : posture.severity === 'warn' ? 'bg-amber-400' : 'bg-emerald-400'}`} />
                <span>{posture.label}</span>
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-zinc-400">
              <span>{host.osName}</span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono text-zinc-300">{host.hostname}</span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono">BIOS {motherboard.biosVersion || 'UEFI'}</span>
              <span className="text-zinc-600">•</span>
              <span className="font-mono tabular-nums text-sky-300">Uptime {formatUptime(live.uptimeSeconds)}</span>
            </div>
          </div>
        </div>

        {/* Live Telemetry Controls & Badges */}
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onTogglePause}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-bold hover:scale-[1.03] active:scale-[0.97] transition-all cursor-pointer ${
              statusActive
                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 hover:bg-emerald-500/20'
                : 'bg-amber-500/15 border-amber-500/35 text-amber-300 hover:bg-amber-500/20'
            }`}
            title={statusActive ? 'Click to pause live updates' : 'Click to resume live updates'}
          >
            <span className={`w-2 h-2 rounded-full ${statusActive ? 'bg-emerald-400 status-pulse' : 'bg-amber-400'}`} />
            <HeaderEqualizerBars active={statusActive} tone="emerald" />
            <span>
              {isTabHidden
                ? 'TAB HIDDEN'
                : isPaused
                  ? 'PAUSED'
                  : `${streamMode === 'sse' ? 'SSE' : 'LIVE'} ${pollIntervalMs / 1000}s`}
            </span>
          </button>

          <div className="inline-flex items-center rounded-lg bg-[#16161c] border border-white/[0.08] p-0.5" title="Sample cadence">
            {POLL_INTERVAL_OPTIONS.map((opt) => (
              <button
                key={opt.ms}
                type="button"
                onClick={() => onChangePollInterval(opt.ms)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  pollIntervalMs === opt.ms
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-400/30'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="inline-flex items-center rounded-lg bg-[#16161c] border border-white/[0.08] p-0.5" title="Sparkline time window">
            {HISTORY_WINDOW_OPTIONS.map((w) => (
              <button
                key={w.sec}
                type="button"
                onClick={() => onChangeHistoryWindow(w.sec)}
                className={`px-2 py-1 rounded-md text-[11px] font-mono font-bold transition-colors cursor-pointer ${
                  historyWindowSec === w.sec
                    ? 'bg-purple-500/20 text-purple-200 border border-purple-400/35'
                    : 'text-zinc-400 hover:text-white border border-transparent'
                }`}
              >
                {w.label}
              </button>
            ))}
          </div>

          <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.08] text-[11px] font-mono text-zinc-300">
            <svg className="w-3.5 h-3.5 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>{host.powerPlan}</span>
          </span>

          {battery && (
            <span
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.08] text-[11px] font-mono tabular-nums text-zinc-200"
              title={battery.statusLabel}
            >
              <span className="w-5 h-3 rounded-sm border border-zinc-400 p-[1.5px] flex items-center relative">
                <span
                  className={`h-full rounded-[1px] ${battery.percent <= 20 ? 'bg-rose-400' : 'bg-emerald-400'}`}
                  style={{ width: `${Math.max(8, Math.min(100, battery.percent))}%` }}
                />
              </span>
              <span>{Math.round(battery.percent)}%</span>
              {battery.powerPlugged && <span className="text-emerald-400 font-bold">AC</span>}
            </span>
          )}

          <button
            type="button"
            onClick={onRescanHardware}
            disabled={isRescanning}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.1] text-xs font-semibold text-zinc-200 hover:text-white hover:border-white/[0.22] hover:bg-white/[0.06] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 transition-all cursor-pointer portal-icon-spin"
          >
            <svg
              className={`w-3.5 h-3.5 ${isRescanning ? 'animate-spin text-sky-400' : 'text-zinc-400'}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            <span>{isRescanning ? 'Scanning...' : 'Rescan Hardware'}</span>
          </button>

          <div className="inline-flex items-center rounded-lg bg-[#16161c] border border-white/[0.1] p-0.5">
            <button
              type="button"
              onClick={handleExportMarkdown}
              title="Download diagnostic summary as Markdown"
              className="px-2 py-1 rounded-md text-[11px] font-mono font-bold text-zinc-300 hover:text-white hover:bg-white/[0.06] cursor-pointer"
            >
              {exportFlash === 'md' ? 'Saved .md' : 'Export .md'}
            </button>
            <button
              type="button"
              onClick={handleExportJson}
              title="Download full sanitized telemetry bundle as JSON"
              className="px-2 py-1 rounded-md text-[11px] font-mono font-bold text-sky-300 hover:text-sky-200 hover:bg-sky-500/15 cursor-pointer"
            >
              {exportFlash === 'json' ? 'Saved .json' : '.json'}
            </button>
          </div>
        </div>
      </div>

      {/* ── Live Silicon Visual Telemetry Bar ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 portal-grid-stagger">
        <button
          type="button"
          onClick={() => onSelectTab('performance')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e0e13]/90 border border-white/[0.07] hover:border-sky-400/35 text-left cursor-pointer portal-card-hover"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">CPU LOAD</span>
            <strong className="text-sm font-mono font-bold text-sky-300 tabular-nums">{Math.round(live.cpu.totalPercent)}%</strong>
          </div>
          <MiniRadialRing percent={live.cpu.totalPercent} color="#38bdf8" size={26} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('performance')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e0e13]/90 border border-white/[0.07] hover:border-purple-400/35 text-left cursor-pointer portal-card-hover"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">MEMORY</span>
            <strong className="text-sm font-mono font-bold text-purple-300 tabular-nums">{Math.round(live.memory.percent)}%</strong>
          </div>
          <MiniRadialRing percent={live.memory.percent} color="#c084fc" size={26} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('storage-network')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e0e13]/90 border border-white/[0.07] hover:border-emerald-400/35 text-left cursor-pointer portal-card-hover"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">VOLUMES</span>
            <strong className="text-sm font-mono font-bold text-emerald-300 tabular-nums">
              {live.disk.volumes[0] ? `${Math.round(live.disk.volumes[0].usedPercent)}%` : `${live.disk.volumes.length}Vol`}
            </strong>
          </div>
          <MiniRadialRing percent={live.disk.volumes[0]?.usedPercent ?? 0} color="#34d399" size={26} />
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('power-health')}
          className="flex items-center justify-between p-2.5 rounded-xl bg-[#0e0e13]/90 border border-white/[0.07] hover:border-amber-400/35 text-left cursor-pointer portal-card-hover"
        >
          <div className="flex flex-col min-w-0">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              {battery ? 'BATTERY' : 'GPU LOAD'}
            </span>
            <strong className="text-sm font-mono font-bold text-amber-300 tabular-nums">
              {battery
                ? `${Math.round(battery.percent)}%`
                : live.gpu.utilizationPercent != null
                  ? `${Math.round(live.gpu.utilizationPercent)}%`
                  : `${live.socketCounts.established} Est`}
            </strong>
          </div>
          <MiniRadialRing
            percent={battery?.percent ?? live.gpu.utilizationPercent ?? Math.min(100, live.socketCounts.established)}
            color="#fbbf24"
            size={26}
          />
        </button>
      </div>

      {/* ── Integrated 8-Tab Icon + Pill Strip with Styled Left / Right Scroll Arrows ── */}
      <div className="pt-3.5 border-t border-white/[0.06] flex items-center gap-2">
        {(canScrollLeft || canScrollRight) && (
          <button
            type="button"
            onClick={() => scrollTabs(-1)}
            disabled={!canScrollLeft}
            aria-label="Scroll tabs left"
            title="Scroll tabs left"
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
              canScrollLeft
                ? 'bg-[#16161c] border-white/[0.14] text-zinc-200 hover:text-white hover:border-sky-400/50 hover:bg-sky-500/15 shadow-sm cursor-pointer'
                : 'bg-[#111115] border-white/[0.05] text-zinc-600 opacity-45 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </button>
        )}

        <div
          ref={tabsRef}
          role="tablist"
          aria-label="Computer & Performance sections"
          onScroll={updateScrollArrows}
          className="relative flex-1 min-w-0 flex items-center gap-1.5 overflow-x-auto system-tabs-scroller"
        >
          <button type="button" role="tab" aria-selected={activeTab === 'performance'} onClick={(e) => handleTabClick('performance', e)} className={tabClass(activeTab === 'performance')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'performance' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span>Live Performance</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'performance' ? 'bg-sky-500/25 text-sky-200 border border-sky-500/40 font-bold' : 'bg-sky-500/15 text-sky-300 border border-sky-500/30'}`}>
              {Math.round(live.cpu.totalPercent)}%
            </span>
          </button>

          <button type="button" role="tab" aria-selected={activeTab === 'hardware'} onClick={(e) => handleTabClick('hardware', e)} className={tabClass(activeTab === 'hardware')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'hardware' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
            </svg>
            <span>Hardware Specs</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'hardware' ? 'bg-purple-500/25 text-purple-200 border border-purple-500/40 font-bold' : 'bg-purple-500/15 text-purple-300 border border-purple-500/30'}`}>
              {hardwareCount}
            </span>
          </button>

          <button type="button" role="tab" aria-selected={activeTab === 'peripherals'} onClick={(e) => handleTabClick('peripherals', e)} className={tabClass(activeTab === 'peripherals')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'peripherals' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <line x1="8" y1="21" x2="16" y2="21" /><line x1="12" y1="17" x2="12" y2="21" />
            </svg>
            <span>Displays &amp; Devices</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'peripherals' ? 'bg-indigo-500/25 text-indigo-200 border border-indigo-500/40 font-bold' : 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/30'}`}>
              {devicesCount}
            </span>
          </button>

          <button type="button" role="tab" aria-selected={activeTab === 'storage-network'} onClick={(e) => handleTabClick('storage-network', e)} className={tabClass(activeTab === 'storage-network')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'storage-network' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
            <span>Storage &amp; Network</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'storage-network' ? 'bg-emerald-500/25 text-emerald-200 border border-emerald-500/40 font-bold' : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'}`}>
              {storageNetCount}
            </span>
          </button>

          <button type="button" role="tab" aria-selected={activeTab === 'power-health'} onClick={(e) => handleTabClick('power-health', e)} className={tabClass(activeTab === 'power-health')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'power-health' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            <span>Power &amp; Health</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'power-health' ? 'bg-rose-500/25 text-rose-200 border border-rose-500/40 font-bold' : 'bg-rose-500/15 text-rose-300 border border-rose-500/30'}`}>
              {battery ? `${Math.round(battery.percent)}%` : 'OK'}
            </span>
          </button>

          <button type="button" role="tab" aria-selected={activeTab === 'startup-services'} onClick={(e) => handleTabClick('startup-services', e)} className={tabClass(activeTab === 'startup-services')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'startup-services' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            <span>Startup &amp; Services</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'startup-services' ? 'bg-cyan-500/25 text-cyan-200 border border-cyan-500/40 font-bold' : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'}`}>
              {startupServicesCount}
            </span>
          </button>

          <button type="button" role="tab" aria-selected={activeTab === 'processes'} onClick={(e) => handleTabClick('processes', e)} className={tabClass(activeTab === 'processes')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'processes' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="4 17 10 11 4 5" />
              <line x1="12" y1="19" x2="20" y2="19" />
            </svg>
            <span>Processes &amp; Ports</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'processes' ? 'bg-amber-500/25 text-amber-200 border border-amber-500/40 font-bold' : 'bg-amber-500/15 text-amber-300 border border-amber-500/30'}`}>
              {live.totalProcessesCount || live.activePorts.length}
            </span>
          </button>

          <button type="button" role="tab" aria-selected={activeTab === 'environment'} onClick={(e) => handleTabClick('environment', e)} className={tabClass(activeTab === 'environment')}>
            <svg className={`w-3.5 h-3.5 shrink-0 ${activeTab === 'environment' ? 'text-white' : 'text-zinc-400'}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="4" y1="21" x2="4" y2="14" /><line x1="4" y1="10" x2="4" y2="3" />
              <line x1="12" y1="21" x2="12" y2="12" /><line x1="12" y1="8" x2="12" y2="3" />
              <line x1="20" y1="21" x2="20" y2="16" /><line x1="20" y1="12" x2="20" y2="3" />
            </svg>
            <span>Environment &amp; PATH</span>
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono tabular-nums ${activeTab === 'environment' ? 'bg-teal-500/25 text-teal-200 border border-teal-500/40 font-bold' : 'bg-teal-500/15 text-teal-300 border border-teal-500/30'}`}>
              {envCount}
            </span>
          </button>
        </div>

        {(canScrollLeft || canScrollRight) && (
          <button
            type="button"
            onClick={() => scrollTabs(1)}
            disabled={!canScrollRight}
            aria-label="Scroll tabs right"
            title="Scroll tabs right"
            className={`w-8 h-8 rounded-lg border flex items-center justify-center shrink-0 transition-all ${
              canScrollRight
                ? 'bg-[#16161c] border-white/[0.14] text-zinc-200 hover:text-white hover:border-sky-400/50 hover:bg-sky-500/15 shadow-sm cursor-pointer'
                : 'bg-[#111115] border-white/[0.05] text-zinc-600 opacity-45 cursor-not-allowed'
            }`}
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        )}
      </div>
      </div>
    </header>
  );
}
