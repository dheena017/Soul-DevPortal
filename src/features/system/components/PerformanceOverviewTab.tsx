import React, { useState } from 'react';
import { HistoryWindowSec, SystemLiveSnapshot, SystemSpecs } from '../../../types';
import { formatBytes, formatClock, formatNetRate, getLoadTone, SystemSubTabId } from '../systemConstants';
import RadialGauge from './RadialGauge';
import TelemetrySparkline from './TelemetrySparkline';

export interface PerformanceOverviewTabProps {
  specs: SystemSpecs;
  live: SystemLiveSnapshot;
  onSelectTab: (tab: SystemSubTabId) => void;
  historyWindowSec?: HistoryWindowSec;
}

export default function PerformanceOverviewTab({
  specs,
  live,
  onSelectTab,
  historyWindowSec = 60,
}: PerformanceOverviewTabProps) {
  const [consumerMode, setConsumerMode] = useState<'cpu' | 'ram' | 'disk'>('cpu');
  const [overlayRam, setOverlayRam] = useState<boolean>(true);
  const [syncHoverIdx, setSyncHoverIdx] = useState<number | null>(null);
  const winLabel = historyWindowSec >= 900 ? '15m' : historyWindowSec >= 300 ? '5m' : '60s';

  const primaryGpu = specs.graphics.find((g) => g.role !== 'Virtual') || specs.graphics[0];
  const primaryDisplay = specs.displays.find((d) => d.primary) || specs.displays[0];
  const primaryDisk = specs.physicalDisks[0];
  const primaryVol = live.disk.volumes[0];
  const wifi = live.connectedWifi;

  const nvidiaSensor = live.gpu.nvidiaSensors?.[0];
  const gpuLoadPct = live.gpu.utilizationPercent ?? null;
  const consumers =
    consumerMode === 'cpu'
      ? live.topCpu
      : consumerMode === 'ram'
        ? live.topMemory
        : live.topDiskIo || live.topCpu;
  const maxConsumerVal = Math.max(
    1,
    ...consumers.map((p) =>
      consumerMode === 'cpu'
        ? p.cpuPercent
        : consumerMode === 'ram'
          ? p.memoryMB
          : (p.ioReadBps || 0) + (p.ioWriteBps || 0)
    )
  );

  const wifiBars = wifi?.signalPercent
    ? wifi.signalPercent >= 85
      ? 5
      : wifi.signalPercent >= 65
        ? 4
        : wifi.signalPercent >= 45
          ? 3
          : wifi.signalPercent >= 25
            ? 2
            : 1
    : 0;

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* ── Row 1: 4 Live SVG Radial Ring KPI Gauges ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <RadialGauge
          title="Processor (CPU)"
          value={live.cpu.totalPercent}
          centerCaption="CPU LOAD"
          subtitle={`${specs.cpu.physicalCores} Cores / ${specs.cpu.logicalThreads} Threads · ${formatClock(live.cpu.currentClockMHz)}`}
          detailLine={`Peak ${live.peaks.cpuPeakPercent}% · Avg ${live.peaks.cpuAvgPercent}%`}
          accent="sky"
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="4" y="4" width="16" height="16" rx="2" />
              <rect x="9" y="9" width="6" height="6" />
              <line x1="9" y1="1" x2="9" y2="4" /><line x1="15" y1="1" x2="15" y2="4" />
              <line x1="9" y1="20" x2="9" y2="23" /><line x1="15" y1="20" x2="15" y2="23" />
            </svg>
          }
          onClick={() => onSelectTab('hardware')}
        />

        <RadialGauge
          title="Memory (RAM)"
          value={live.memory.percent}
          centerCaption="IN USE"
          subtitle={`${formatBytes(live.memory.usedBytes)} / ${formatBytes(live.memory.totalBytes)}`}
          detailLine={`${specs.memory.ddrType} ${specs.memory.configuredSpeedMTs ? `${specs.memory.configuredSpeedMTs} MT/s` : ''} · Peak ${live.peaks.ramPeakPercent}%`}
          accent="purple"
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="6" width="20" height="12" rx="2" />
              <line x1="6" y1="10" x2="6" y2="14" /><line x1="10" y1="10" x2="10" y2="14" />
              <line x1="14" y1="10" x2="14" y2="14" /><line x1="18" y1="10" x2="18" y2="14" />
            </svg>
          }
          onClick={() => onSelectTab('hardware')}
        />

        <RadialGauge
          title="Graphics (GPU)"
          value={gpuLoadPct}
          centerText={gpuLoadPct !== null ? `${Math.round(gpuLoadPct)}%` : nvidiaSensor ? 'Active' : 'Idle'}
          centerCaption="GPU ENGINE"
          statusText={gpuLoadPct !== null && gpuLoadPct > 50 ? 'Active' : 'Ready'}
          subtitle={primaryGpu ? primaryGpu.name.replace(/\(R\)|\(TM\)/gi, '').trim() : 'Graphics Adapter'}
          detailLine={
            primaryDisplay?.nativeWidth
              ? `${primaryDisplay.nativeWidth}×${primaryDisplay.nativeHeight} @ ${primaryDisplay.refreshRateHz || 60}Hz`
              : primaryGpu?.vramMode || 'Display Ready'
          }
          accent="amber"
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2" />
              <polyline points="2 17 12 22 22 17" />
              <polyline points="2 12 12 17 22 12" />
            </svg>
          }
          onClick={() => onSelectTab('peripherals')}
        />

        <RadialGauge
          title="Storage & Wi-Fi"
          value={primaryVol ? primaryVol.usedPercent : wifi?.signalPercent ?? null}
          centerCaption={primaryVol ? `DISK ${primaryVol.mountpoint.replace('\\', '')}` : 'LINK'}
          statusText={primaryDisk?.healthStatus || 'Online'}
          subtitle={
            primaryDisk
              ? `${primaryDisk.busType} · ${primaryDisk.healthStatus}`
              : primaryVol
                ? `${primaryVol.mountpoint} (${formatBytes(primaryVol.freeBytes)} free)`
                : 'Host Storage'
          }
          detailLine={
            wifi
              ? `Wi-Fi ${wifi.signalPercent ?? 0}% (${wifi.band || 'Link'})`
              : `Net ↓ ${formatNetRate(live.network.rxKBps)}`
          }
          accent="emerald"
          icon={
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <ellipse cx="12" cy="5" rx="9" ry="3" />
              <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
              <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
            </svg>
          }
          onClick={() => onSelectTab('storage-network')}
        />
      </div>

      {/* ── Row 2: Processor Load Sparkline & Die Heatmap + Disk/Net I/O & Top Consumers ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Left: CPU Telemetry + Core Die Heatmap */}
        <section className="lg:col-span-7 p-5 rounded-2xl system-card flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-sky-500/12 border border-sky-400/25 flex items-center justify-center text-sky-400 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </span>
              <div className="flex flex-col gap-0.5 min-w-0">
                <h2 className="text-sm font-bold text-white tracking-tight">Processor Load &amp; Core Die Matrix</h2>
                <p className="text-[11px] text-zinc-400 truncate">
                  {specs.cpu.name} · <span className="font-mono text-sky-300">{specs.cpu.topologyMode}</span>
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono tabular-nums">
              <button
                type="button"
                onClick={() => setOverlayRam((v) => !v)}
                className={`px-2.5 py-1 rounded-md border font-bold transition-colors cursor-pointer ${
                  overlayRam
                    ? 'bg-purple-500/15 border-purple-400/35 text-purple-200'
                    : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white'
                }`}
              >
                {overlayRam ? '+ RAM Overlay On' : '+ RAM Overlay'}
              </button>
              <span className="px-2 py-1 rounded-md bg-[#16161c] border border-white/[0.08] text-zinc-300">
                Ctx {live.cpu.contextSwitchesPerSec.toLocaleString()}/s
              </span>
              <span className="px-2 py-1 rounded-md bg-[#16161c] border border-white/[0.08] text-zinc-300">
                IRQ {live.cpu.interruptsPerSec.toLocaleString()}/s
              </span>
            </div>
          </div>

          {/* Framed Hero Multi-Series Spline Chart */}
          <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-3">
            <TelemetrySparkline
              data={live.history}
              fixedMax={100}
              height={215}
              syncHoverIdx={syncHoverIdx}
              onHoverChange={setSyncHoverIdx}
              series={
                overlayRam
                  ? [
                      { key: 'cpuPercent', label: 'CPU', color: '#38bdf8', unit: '%', decimals: 1 },
                      { key: 'ramPercent', label: 'RAM', color: '#a855f7', unit: '%', decimals: 1 },
                    ]
                  : [{ key: 'cpuPercent', label: 'CPU', color: '#38bdf8', unit: '%', decimals: 1 }]
              }
            />

            {/* Execution Time Split Bar Integrated with Chart Frame */}
            <div className="flex flex-col gap-1.5 pt-2.5 border-t border-white/[0.06]">
              <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
                <div className="flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center gap-1.5 text-emerald-300">
                    <span className="w-2 h-2 rounded-sm bg-emerald-400" />
                    User {live.cpu.userPercent.toFixed(1)}%
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-sky-300">
                    <span className="w-2 h-2 rounded-sm bg-sky-400" />
                    Kernel {live.cpu.systemPercent.toFixed(1)}%
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-zinc-400">
                    <span className="w-2 h-2 rounded-sm bg-zinc-600" />
                    Idle {live.cpu.idlePercent.toFixed(1)}%
                  </span>
                </div>
                <span className="text-sky-300 font-bold">Live Clock {formatClock(live.cpu.currentClockMHz)}</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-[#0a0a0e] overflow-hidden flex border border-white/[0.06]">
                <div
                  className="h-full bg-emerald-500/85 transition-all duration-300"
                  style={{ width: `${Math.min(100, live.cpu.userPercent)}%` }}
                />
                <div
                  className="h-full bg-sky-500/85 transition-all duration-300"
                  style={{ width: `${Math.min(100 - live.cpu.userPercent, live.cpu.systemPercent)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Live Processor & Core-Tier Telemetry Metrics */}
          {(() => {
            const pSliceCount = specs.cpu.efficientCores > 0 ? specs.cpu.performanceCores * 2 : live.cpu.perCorePercent.length;
            const pCores = live.cpu.perCorePercent.slice(0, pSliceCount);
            const eCores = specs.cpu.efficientCores > 0 ? live.cpu.perCorePercent.slice(pSliceCount) : [];
            const pAvg = pCores.length ? pCores.reduce((a, b) => a + b, 0) / pCores.length : live.cpu.totalPercent;
            const eAvg = eCores.length ? eCores.reduce((a, b) => a + b, 0) / eCores.length : null;
            return (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono tabular-nums">
                <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">
                    {eCores.length > 0 ? `P-Core Mean (${specs.cpu.performanceCores}P)` : 'Core Mean'}
                  </span>
                  <strong className="text-sky-300">{pAvg.toFixed(1)}%</strong>
                </div>
                <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">
                    {eCores.length > 0 ? `E-Core Mean (${specs.cpu.efficientCores}E)` : 'Peak Thread'}
                  </span>
                  <strong className="text-emerald-300">
                    {eAvg !== null ? `${eAvg.toFixed(1)}%` : `${Math.max(...(live.cpu.perCorePercent.length ? live.cpu.perCorePercent : [0])).toFixed(0)}%`}
                  </strong>
                </div>
                <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Processes Live</span>
                  <strong className="text-white">{live.totalProcessesCount} Active</strong>
                </div>
                <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Nominal Base</span>
                  <strong className="text-purple-300">{formatClock(specs.cpu.maxClockMHz)}</strong>
                </div>
              </div>
            );
          })()}

          {/* Framed Per-Logical-Core Heatmap Grid */}
          <div className="neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2.5 mt-auto">
            <div className="flex items-center justify-between text-[11px] text-zinc-400">
              <span className="font-semibold text-zinc-200">Per-Core Utilization ({live.cpu.perCorePercent.length} Threads)</span>
              <span className="font-mono tabular-nums text-sky-300">
                Peak Thread {Math.max(...(live.cpu.perCorePercent.length ? live.cpu.perCorePercent : [0])).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
              {live.cpu.perCorePercent.map((pct, idx) => {
                const tone = getLoadTone(pct);
                const isPCoreThread = specs.cpu.efficientCores > 0 && idx < specs.cpu.performanceCores * 2;
                const coreKind = specs.cpu.efficientCores > 0 ? (isPCoreThread ? 'P' : 'E') : null;
                return (
                  <div
                    key={idx}
                    title={`Logical Core ${idx}${coreKind ? ` (${coreKind}-Core Thread)` : ''}: ${pct.toFixed(1)}%`}
                    className={`neu-tile px-2.5 py-2 rounded-xl border flex flex-col gap-1.5 font-mono tabular-nums text-[11px] transition-colors ${tone.tileBg}`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <span className="flex items-center gap-1">
                        <span className="opacity-75 font-semibold">C{idx}</span>
                        {coreKind && (
                          <span className={`px-1 rounded text-[9px] font-bold ${coreKind === 'P' ? 'bg-sky-500/20 text-sky-200' : 'bg-white/[0.08] text-zinc-300'}`}>
                            {coreKind}
                          </span>
                        )}
                      </span>
                      <span className="font-bold">{Math.round(pct)}%</span>
                    </div>
                    <div className="w-full h-1 rounded-full bg-black/35 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-300"
                        style={{ width: `${Math.max(4, Math.min(100, pct))}%`, backgroundColor: tone.stroke }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Right: Disk & Net Dual-Series Graphs + Wi-Fi Meter + Top Consumers */}
        <section className="lg:col-span-5 p-5 rounded-2xl system-card flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <circle cx="12" cy="20" r="1" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-bold text-white tracking-tight">Storage &amp; Network I/O Streams</h2>
                <p className="text-[11px] text-zinc-400">Smooth real-time read/write &amp; bandwidth curves</p>
              </div>
            </div>
            {wifi && (
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">
                <div className="flex items-end gap-0.5 h-3.5" aria-label={`Wi-Fi Signal ${wifi.signalPercent}%`}>
                  {[1, 2, 3, 4, 5].map((bar) => (
                    <span
                      key={bar}
                      className={`w-1 rounded-xs transition-colors ${bar <= wifiBars ? 'bg-emerald-400' : 'bg-zinc-700'}`}
                      style={{ height: `${bar * 20}%` }}
                    />
                  ))}
                </div>
                <span className="text-[10px] font-mono tabular-nums font-bold text-emerald-300">
                  {wifi.signalPercent ?? 0}% · {wifi.band || 'Wi-Fi'}
                </span>
              </div>
            )}
          </div>

          {/* Disk Read/Write Smooth Graph */}
          <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
              <span className="font-bold text-zinc-100 font-sans">Disk I/O Throughput</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  R {live.disk.readMBps.toFixed(1)} MB/s
                </span>
                <span className="inline-flex items-center gap-1 text-amber-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  W {live.disk.writeMBps.toFixed(1)} MB/s
                </span>
              </div>
            </div>
            <TelemetrySparkline
              data={live.history}
              height={102}
              compact
              syncHoverIdx={syncHoverIdx}
              onHoverChange={setSyncHoverIdx}
              series={[
                { key: 'diskReadMBps', label: 'Read', color: '#10b981', unit: ' MB/s', decimals: 1 },
                { key: 'diskWriteMBps', label: 'Write', color: '#f59e0b', unit: ' MB/s', decimals: 1 },
              ]}
            />
            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-zinc-400">
              <span>R {live.disk.readIops.toFixed(0)} / W {live.disk.writeIops.toFixed(0)} IOPS</span>
              <span>{winLabel} Peak R {live.peaks.diskReadPeakMBps} / W {live.peaks.diskWritePeakMBps} MB/s</span>
            </div>
          </div>

          {/* Network Rx/Tx Smooth Graph */}
          <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2.5">
            <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
              <span className="font-bold text-zinc-100 font-sans">Network Bandwidth</span>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center gap-1 text-sky-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400" />
                  ↓ {formatNetRate(live.network.rxKBps)}
                </span>
                <span className="inline-flex items-center gap-1 text-purple-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-400" />
                  ↑ {formatNetRate(live.network.txKBps)}
                </span>
              </div>
            </div>
            <TelemetrySparkline
              data={live.history}
              height={102}
              compact
              syncHoverIdx={syncHoverIdx}
              onHoverChange={setSyncHoverIdx}
              valueFormatter={(v) => formatNetRate(v)}
              series={[
                { key: 'netRxKBps', label: 'Down', color: '#38bdf8', unit: ' KB/s', decimals: 1 },
                { key: 'netTxKBps', label: 'Up', color: '#a855f7', unit: ' KB/s', decimals: 1 },
              ]}
            />
            <div className="flex items-center justify-between text-[10px] font-mono tabular-nums text-zinc-400">
              <span>{live.socketCounts.established} Estab · {live.socketCounts.listening} Listen</span>
              <span>{winLabel} Peak ↓ {formatNetRate(live.peaks.netRxPeakKBps)} · ↑ {formatNetRate(live.peaks.netTxPeakKBps)}</span>
            </div>
          </div>

          {/* Top Consumers Mini-Leaderboard */}
          <div className="flex flex-col gap-2 pt-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs font-bold text-white">Top Resource Consumers</span>
              <div className="inline-flex items-center gap-1 rounded-xl neu-tray bg-[#16161c] border border-white/[0.06] p-0.5 text-[10px] font-mono font-bold" role="tablist" aria-label="Resource consumer metric">
                <button
                  type="button"
                  role="tab"
                  aria-selected={consumerMode === 'cpu'}
                  onClick={() => setConsumerMode('cpu')}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    consumerMode === 'cpu'
                      ? 'text-sky-300 border border-white/20'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  CPU %
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={consumerMode === 'ram'}
                  onClick={() => setConsumerMode('ram')}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    consumerMode === 'ram'
                      ? 'text-purple-300 border border-white/20'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  RAM MB
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={consumerMode === 'disk'}
                  onClick={() => setConsumerMode('disk')}
                  className={`px-2 py-1 rounded-lg cursor-pointer transition-all ${
                    consumerMode === 'disk'
                      ? 'text-emerald-300 border border-white/20'
                      : 'text-zinc-400 hover:text-white border border-transparent'
                  }`}
                >
                  Disk I/O
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-2">
              {consumers.map((proc, rankIdx) => {
                const diskTotalBps = (proc.ioReadBps || 0) + (proc.ioWriteBps || 0);
                const rawVal =
                  consumerMode === 'cpu'
                    ? proc.cpuPercent
                    : consumerMode === 'ram'
                      ? proc.memoryMB
                      : diskTotalBps;
                const relPct = Math.min(100, Math.max(8, Math.round((rawVal / maxConsumerVal) * 100)));
                return (
                  <button
                    key={proc.pid}
                    type="button"
                    onClick={() => onSelectTab('processes')}
                    className="neu-tile neu-btn w-full p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06] hover:border-white/[0.16] flex flex-col gap-1.5 text-left transition-colors cursor-pointer"
                  >
                    <div className="flex items-center justify-between gap-2 text-xs">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="neu-inset w-5 h-5 rounded-md bg-[#0e0e13] border border-white/[0.08] flex items-center justify-center text-[10px] font-mono font-bold text-zinc-400 shrink-0">
                          {rankIdx + 1}
                        </span>
                        <span className="font-semibold text-white truncate">
                          {proc.name} <span className="font-mono text-[10px] text-zinc-500">#{proc.pid}</span>
                        </span>
                      </div>
                      <div className="flex items-center gap-2 font-mono tabular-nums text-[11px] shrink-0">
                        <span className={consumerMode === 'cpu' ? 'font-bold text-sky-300' : 'text-zinc-400'}>
                          {proc.cpuPercent.toFixed(1)}%
                        </span>
                        <span className="text-zinc-600">·</span>
                        <span className={consumerMode === 'ram' ? 'font-bold text-purple-300' : 'text-zinc-400'}>
                          {proc.memoryMB.toFixed(0)} MB
                        </span>
                        {consumerMode === 'disk' && (
                          <>
                            <span className="text-zinc-600">·</span>
                            <span className="font-bold text-emerald-300">{formatBytes(diskTotalBps)}/s</span>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          consumerMode === 'cpu'
                            ? 'soul-gradient-bar'
                            : consumerMode === 'ram'
                              ? 'bg-gradient-to-r from-purple-500 to-fuchsia-400'
                              : 'bg-gradient-to-r from-emerald-500 to-teal-300'
                        }`}
                        style={{ width: `${relPct}%` }}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      {/* ── Row 3: Memory Commit Trend + Graphics Engine Trend ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Memory & Pagefile Allocation Card with Live Trend */}
        <section className="p-5 rounded-2xl system-card flex flex-col gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Memory &amp; Pagefile Allocation</h3>
            <span className="text-[11px] font-mono tabular-nums text-purple-300">
              {formatBytes(live.memory.usedBytes)} Active · {formatBytes(live.memory.availableBytes)} Available
            </span>
          </div>

          <TelemetrySparkline
            data={live.history}
            fixedMax={100}
            height={110}
            compact
            syncHoverIdx={syncHoverIdx}
            onHoverChange={setSyncHoverIdx}
            series={[{ key: 'ramPercent', label: 'RAM', color: '#a855f7', unit: '%', decimals: 1 }]}
          />

          <div className="neu-inset w-full h-2.5 rounded-full bg-[#181820] overflow-hidden flex border border-white/[0.06]">
            <div
              className="h-full soul-gradient-bar sys-bar-shimmer transition-all duration-300"
              style={{ width: `${Math.min(100, live.memory.percent)}%` }}
            />
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono tabular-nums">
            <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Used RAM</span>
              <strong className="text-white">{formatBytes(live.memory.usedBytes)}</strong>
            </div>
            <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Available</span>
              <strong className="text-emerald-300">{formatBytes(live.memory.availableBytes)}</strong>
            </div>
            <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Pagefile / Swap</span>
              <strong className="text-amber-300">{formatBytes(live.swap.usedBytes)} / {formatBytes(live.swap.totalBytes)}</strong>
            </div>
            <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">DIMM Speed</span>
              <strong className="text-sky-300">{specs.memory.configuredSpeedMTs ? `${specs.memory.configuredSpeedMTs} MT/s` : specs.memory.ddrType}</strong>
            </div>
          </div>
        </section>

        {/* GPU Activity Trend & Engine Breakdown */}
        <section className="p-5 rounded-2xl system-card flex flex-col justify-between gap-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-bold text-white">Graphics Engine &amp; Video Memory</h3>
            <span className="text-[11px] font-mono text-amber-300 truncate max-w-xs">
              {primaryGpu?.name || 'Host Graphics'}
            </span>
          </div>

          <TelemetrySparkline
            data={live.history}
            fixedMax={100}
            height={110}
            compact
            syncHoverIdx={syncHoverIdx}
            onHoverChange={setSyncHoverIdx}
            series={[{ key: 'gpuPercent', label: 'GPU Engine', color: '#f59e0b', unit: '%', decimals: 1 }]}
          />

          {nvidiaSensor ? (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono tabular-nums">
              <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                <span className="block text-[10px] text-zinc-400">GPU Core</span>
                <strong className="text-amber-300">{nvidiaSensor.utilizationPercent ?? '—'}%</strong>
              </div>
              <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                <span className="block text-[10px] text-zinc-400">VRAM</span>
                <strong className="text-white">{nvidiaSensor.vramUsedMB ?? '—'} / {nvidiaSensor.vramTotalMB ?? '—'} MB</strong>
              </div>
              {nvidiaSensor.temperatureC !== null && (
                <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Temperature</span>
                  <strong className="text-rose-300">{nvidiaSensor.temperatureC}°C</strong>
                </div>
              )}
              {nvidiaSensor.powerWatts !== null && (
                <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Power Draw</span>
                  <strong className="text-emerald-300">{nvidiaSensor.powerWatts} W</strong>
                </div>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-[11px] font-mono tabular-nums">
              <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                <span className="block text-[10px] text-zinc-400">3D Render</span>
                <strong className="text-amber-300">{live.gpu.engines?.['3D'] !== undefined ? `${live.gpu.engines['3D']}%` : '—'}</strong>
              </div>
              <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                <span className="block text-[10px] text-zinc-400">Video Decode</span>
                <strong className="text-sky-300">{live.gpu.engines?.VideoDecode !== undefined ? `${live.gpu.engines.VideoDecode}%` : '—'}</strong>
              </div>
              <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                <span className="block text-[10px] text-zinc-400">Shared GPU Mem</span>
                <strong className="text-purple-300">{formatBytes(live.gpu.sharedUsedBytes)}</strong>
              </div>
              <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
                <span className="block text-[10px] text-zinc-400">Display Mode</span>
                <strong className="text-white">
                  {primaryDisplay?.nativeWidth ? `${primaryDisplay.nativeWidth}×${primaryDisplay.nativeHeight}` : 'Active'}
                </strong>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
