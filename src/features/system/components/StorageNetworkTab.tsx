import React, { useMemo, useState } from 'react';
import { HistoryWindowSec, SystemLiveSnapshot, SystemSpecs } from '../../../types';
import { formatBytes, formatNetRate } from '../systemConstants';
import HardwareDetailsTable, { HardwareDetailTableRow } from './HardwareDetailsTable';
import TelemetrySparkline from './TelemetrySparkline';

export interface StorageNetworkTabProps {
  specs: SystemSpecs;
  live: SystemLiveSnapshot;
  historyWindowSec?: HistoryWindowSec;
}

export default function StorageNetworkTab({ specs, live, historyWindowSec = 60 }: StorageNetworkTabProps) {
  const wifi = live.connectedWifi;
  const netProfile = specs.networkProfiles[0];
  const primaryVol = live.disk.volumes[0];
  const primaryDisk = specs.physicalDisks[0];
  const [nicSearch, setNicSearch] = useState('');
  const [syncHoverIdx, setSyncHoverIdx] = useState<number | null>(null);
  const winLabel = historyWindowSec >= 900 ? '15-Minute' : historyWindowSec >= 300 ? '5-Minute' : '60-Second';
  const primaryGateway = specs.networkGateways?.find((g) => g.ipv4Gateway) || specs.networkGateways?.[0];

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

  const sortedAdapters = useMemo(() => {
    const isVirtualNic = (name: string) => /loopback|vethernet|wsl|virtual|pseudo/i.test(name);
    return [...live.networkAdapters].sort((a, b) => {
      const va = isVirtualNic(a.name) ? 1 : 0;
      const vb = isVirtualNic(b.name) ? 1 : 0;
      if (va !== vb) return va - vb;
      if (a.isUp !== b.isUp) return a.isUp ? -1 : 1;
      return a.name.localeCompare(b.name);
    });
  }, [live.networkAdapters]);

  const defaultExpandedAdapterIds = useMemo(() => {
    const idx = sortedAdapters.findIndex((n) => n.isUp);
    if (idx < 0) return [];
    return [`nic-${idx}-${sortedAdapters[idx].name}`];
  }, [sortedAdapters]);

  const adapterRows: HardwareDetailTableRow[] = useMemo(() => {
    const q = nicSearch.trim().toLowerCase();
    const mapped = sortedAdapters.map((nic, idx) => {
      const rateSummary =
        (nic.rxKBps || 0) > 0 || (nic.txKBps || 0) > 0
          ? ` · ↓ ${formatNetRate(nic.rxKBps)} / ↑ ${formatNetRate(nic.txKBps)}`
          : '';
      return {
        id: `nic-${idx}-${nic.name}`,
        name: nic.name,
        summary: nic.ipv4 ? `IPv4 ${nic.ipv4}${rateSummary}` : nic.mac ? `MAC ${nic.mac}${rateSummary}` : 'Virtual / No IPv4',
        hardwareCode: nic.mtu ? `MTU ${nic.mtu}` : null,
        statusLabel: nic.isUp ? 'Connected' : 'Disconnected',
        statusTone: (nic.isUp ? 'emerald' : 'zinc') as 'emerald' | 'zinc',
        primaryMetric: nic.speedMbps > 0 ? `${nic.speedMbps} Mbps` : nic.isUp ? 'Active' : 'Down',
        accent: (nic.isUp ? 'emerald' : 'zinc') as 'emerald' | 'zinc',
        details: [
          { label: 'Adapter Interface Name', value: nic.name },
          { label: 'Live Interface Rate', value: `↓ ${formatNetRate(nic.rxKBps || 0)} · ↑ ${formatNetRate(nic.txKBps || 0)}`, tone: 'emerald' as const },
          { label: 'IPv4 Address', value: nic.ipv4 || 'Unassigned', copyValue: nic.ipv4 || '' },
          { label: 'IPv6 Address', value: nic.ipv6 || 'Unassigned', copyValue: nic.ipv6 || '' },
          { label: 'MAC Physical Address', value: nic.mac || 'N/A', copyValue: nic.mac || '' },
          { label: 'Session Counters & Link', value: `${nic.speedMbps > 0 ? `${nic.speedMbps} Mbps` : 'N/A'} · ↓ ${formatBytes(nic.bytesRecv)} · ↑ ${formatBytes(nic.bytesSent)}`, tone: 'sky' as const },
        ],
      };
    });

    if (!q) return mapped;
    return mapped.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        r.details.some((d) => d.value.toLowerCase().includes(q))
    );
  }, [sortedAdapters, nicSearch]);

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* ── Top Storage & Network KPI Strip ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Primary Volume</span>
          <strong className="text-xl font-extrabold font-mono tabular-nums text-emerald-300">
            {primaryVol ? `${primaryVol.usedPercent}% Used` : 'Online'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {primaryVol ? `${formatBytes(primaryVol.freeBytes, 1)} Free of ${formatBytes(primaryVol.totalBytes, 1)}` : 'No Volume'}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Disk Throughput</span>
          <strong className="text-xl font-extrabold font-mono tabular-nums text-amber-300">
            R {live.disk.readMBps.toFixed(1)} · W {live.disk.writeMBps.toFixed(1)}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400">
            MB/s · {live.disk.readIops.toFixed(0)} R / {live.disk.writeIops.toFixed(0)} W IOPS
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
            {wifi ? `Wi-Fi (${wifi.band || 'Radio'})` : 'Network Interface'}
          </span>
          <strong className="text-xl font-extrabold font-mono tabular-nums text-sky-300">
            {wifi?.signalPercent !== undefined && wifi?.signalPercent !== null
              ? `${wifi.signalPercent}% Signal`
              : `${live.networkAdapters.filter((n) => n.isUp).length} Active`}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {wifi?.rxRateMbps ? `${wifi.rxRateMbps}/${wifi.txRateMbps || wifi.rxRateMbps} Mbps · ${wifi.ssid}` : 'Ethernet / Local'}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Network Bandwidth</span>
          <strong className="text-xl font-extrabold font-mono tabular-nums text-purple-300">
            ↓ {formatNetRate(live.network.rxKBps)}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400">
            ↑ {formatNetRate(live.network.txKBps)} · {live.socketCounts.established} Estab Sockets
          </span>
        </div>
      </div>

      {/* ── Storage Physical Drives + Logical Volumes ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        <section className="p-5 rounded-2xl system-card flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <ellipse cx="12" cy="5" rx="9" ry="3" />
                  <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                  <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">Physical Storage Drives</h2>
                <p className="text-[11px] text-zinc-400">Bus protocol, drive health, GPT partitions &amp; pagefile</p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300">
              {specs.physicalDisks.length} Physical Drive{specs.physicalDisks.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-col gap-3 flex-1">
            {specs.physicalDisks.length > 0 ? (
              specs.physicalDisks.map((disk, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex flex-col gap-0.5 min-w-0">
                      <strong className="text-sm font-bold text-white truncate">{disk.model}</strong>
                      <span className="text-xs font-mono text-zinc-400">
                        {disk.busType} · {disk.mediaType} · Firmware {disk.firmwareVersion || 'N/A'}
                      </span>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold shrink-0 ${
                        disk.healthStatus === 'Healthy'
                          ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                          : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                      }`}
                    >
                      {disk.healthStatus}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono text-zinc-300">
                    <span className="px-2 py-0.5 rounded bg-[#0c0c10] border border-white/[0.08]">{formatBytes(disk.sizeBytes, 1)}</span>
                    <span className="px-2 py-0.5 rounded bg-[#0c0c10] border border-white/[0.08]">{disk.partitionStyle}</span>
                    <span className="px-2 py-0.5 rounded bg-[#0c0c10] border border-white/[0.08]">{disk.sectorAlignment}</span>
                    <span
                      className={`px-2 py-0.5 rounded border ${
                        specs.sensorCapabilities?.nvmeSmartAvailable
                          ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                          : 'bg-[#0c0c10] border-white/[0.08] text-zinc-400'
                      }`}
                    >
                      {specs.sensorCapabilities?.nvmeSmartAvailable ? 'SMART Counters Active' : 'SMART IOCTL Requires Admin'}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-zinc-400">Physical drive enumeration is derived from mounted volumes below.</p>
            )}

            {specs.diskPartitions && specs.diskPartitions.length > 0 && (
              <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-1.5 text-[11px] font-mono tabular-nums">
                <span className="text-[10px] uppercase tracking-wider text-zinc-400">GPT Partition Map</span>
                {specs.diskPartitions.map((pt) => (
                  <div key={`${pt.diskNumber}-${pt.partitionNumber}`} className="flex items-center justify-between gap-2">
                    <span className="text-zinc-200 truncate">
                      Partition {pt.partitionNumber}:{' '}
                      <strong className="text-white">{pt.driveLetter ? `${pt.driveLetter} ` : ''}{pt.type}</strong>
                    </span>
                    <span className="text-sky-300 shrink-0">{formatBytes(pt.sizeBytes, 1)}</span>
                  </div>
                ))}
              </div>
            )}

            {specs.host.pagefile && (
              <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs font-mono tabular-nums mt-auto">
                <div>
                  <span className="block text-[10px] text-zinc-400">OS Pagefile ({specs.host.pagefile.path})</span>
                  <strong className="text-purple-300">{specs.host.pagefile.currentMB} MB Used</strong>
                  <span className="text-zinc-400"> / {specs.host.pagefile.allocatedMB} MB Allocated</span>
                </div>
                <span className="px-2 py-0.5 rounded bg-[#0c0c10] border border-white/[0.08] text-[10px] text-zinc-300">
                  Peak {specs.host.pagefile.peakMB} MB
                </span>
              </div>
            )}
          </div>
        </section>

        {/* Logical Mounted Partitions & Storage I/O Telemetry */}
        <section className="p-5 rounded-2xl system-card flex flex-col gap-4">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-sky-500/12 border border-sky-400/25 flex items-center justify-center text-sky-400 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M6 12h12M6 16h8" />
                </svg>
              </span>
              <div>
                <h2 className="text-sm font-bold text-white">Mounted Disk Partitions &amp; Live Space</h2>
                <p className="text-[11px] text-zinc-400">
                  Active Throughput: R {live.disk.readMBps.toFixed(1)} MB/s · W {live.disk.writeMBps.toFixed(1)} MB/s
                </p>
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
              {live.disk.volumes.length} Volume{live.disk.volumes.length === 1 ? '' : 's'}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {live.disk.volumes.map((vol) => (
              <div key={vol.mountpoint} className="p-4 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2 min-w-0">
                    <strong className="font-mono text-white">{vol.mountpoint}</strong>
                    <span className="px-1.5 py-0.5 rounded bg-[#0c0c10] border border-white/[0.08] text-[10px] font-mono text-zinc-400">
                      {vol.fstype}
                    </span>
                  </div>
                  <span className="font-mono tabular-nums text-zinc-200 font-bold">
                    {formatBytes(vol.usedBytes, 1)} / {formatBytes(vol.totalBytes, 1)} ({vol.usedPercent}%)
                  </span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-[#0c0c10] overflow-hidden border border-white/[0.06]">
                  <div
                    className={`h-full rounded-full sys-bar-shimmer transition-all duration-300 ${
                      vol.usedPercent >= 90 ? 'bg-rose-500' : vol.usedPercent >= 75 ? 'bg-amber-400' : 'soul-gradient-bar'
                    }`}
                    style={{ width: `${Math.min(100, vol.usedPercent)}%` }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] font-mono tabular-nums text-zinc-400">
                  <span>{formatBytes(vol.freeBytes, 1)} Free Remaining</span>
                  <span>Read Total {formatBytes(live.disk.totalReadBytes, 1)}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Live Storage Metrics Grid matching height of Left Card cleanly */}
          <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums mt-auto">
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Session Read / Write</span>
              <strong className="text-emerald-300">
                {formatBytes(live.disk.totalReadBytes, 1)} / {formatBytes(live.disk.totalWriteBytes, 1)}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">60s Peak Read / Write</span>
              <strong className="text-amber-300">
                {live.peaks.diskReadPeakMBps} / {live.peaks.diskWritePeakMBps} MB/s
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Active Disk IOPS</span>
              <strong className="text-white">
                {live.disk.readIops.toFixed(0)} R · {live.disk.writeIops.toFixed(0)} W
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Sector Geometry</span>
              <strong className="text-sky-300 truncate block">
                {primaryDisk ? `${primaryDisk.logicalSectorSize}B / ${primaryDisk.physicalSectorSize}B` : '4K Aligned'}
              </strong>
            </div>
          </div>
        </section>
      </div>

      {/* ── Live Storage & Network Throughput Spline Charts ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="p-5 rounded-2xl system-card flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-emerald-500/12 border border-emerald-400/25 flex items-center justify-center text-emerald-400">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                </svg>
              </span>
              <strong className="text-white">{winLabel} Disk Read / Write Trend</strong>
            </div>
            <span className="font-mono tabular-nums text-emerald-300">
              R {live.disk.readMBps.toFixed(1)} · W {live.disk.writeMBps.toFixed(1)} MB/s
            </span>
          </div>
          <TelemetrySparkline
            data={live.history}
            height={145}
            syncHoverIdx={syncHoverIdx}
            onHoverChange={setSyncHoverIdx}
            series={[
              { key: 'diskReadMBps', label: 'Disk Read', color: '#10b981', unit: ' MB/s', decimals: 1 },
              { key: 'diskWriteMBps', label: 'Disk Write', color: '#f59e0b', unit: ' MB/s', decimals: 1 },
            ]}
          />
        </section>

        <section className="p-5 rounded-2xl system-card flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-md bg-sky-500/12 border border-sky-400/25 flex items-center justify-center text-sky-400">
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <circle cx="12" cy="20" r="1" />
                </svg>
              </span>
              <strong className="text-white">{winLabel} Network Down / Up Trend</strong>
            </div>
            <span className="font-mono tabular-nums text-sky-300">
              ↓ {formatNetRate(live.network.rxKBps)} · ↑ {formatNetRate(live.network.txKBps)}
            </span>
          </div>
          <TelemetrySparkline
            data={live.history}
            height={145}
            syncHoverIdx={syncHoverIdx}
            onHoverChange={setSyncHoverIdx}
            valueFormatter={(v) => formatNetRate(v)}
            series={[
              { key: 'netRxKBps', label: 'Download', color: '#38bdf8', unit: ' KB/s', decimals: 1 },
              { key: 'netTxKBps', label: 'Upload', color: '#a855f7', unit: ' KB/s', decimals: 1 },
            ]}
          />
        </section>
      </div>

      {/* ── Live Wi-Fi Radio Card + Active Sockets & Physical Radios Strip ── */}
      <section className="p-5 rounded-2xl system-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex items-end gap-1 h-7 px-2.5 py-1.5 rounded-xl bg-[#16161c] border border-white/[0.08]">
              {[1, 2, 3, 4, 5].map((bar) => (
                <span
                  key={bar}
                  className={`w-1.5 rounded-xs ${wifi && bar <= wifiBars ? 'bg-emerald-400 sys-wifi-bar-active' : 'bg-zinc-700'}`}
                  style={{ height: `${bar * 20}%`, animationDelay: `${bar * 140}ms` }}
                />
              ))}
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {wifi ? `Connected Wi-Fi: ${wifi.ssid || wifi.name}` : 'Network Radio & Socket Health'}
              </h2>
              <p className="text-[11px] text-zinc-400">
                {wifi
                  ? `${wifi.standardLabel || wifi.radioType || 'Wireless'} · ${wifi.band || 'Radio'} · ${wifi.description || wifi.name}${wifi.bssid ? ` · BSSID ${wifi.bssid}` : ''}`
                  : 'Wired or virtual network interfaces currently active'}
              </p>
            </div>
          </div>

          {netProfile && (
            <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
              <span className="px-2.5 py-1 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-emerald-300">
                {netProfile.connectivity}
              </span>
              <span className="px-2.5 py-1 rounded-md bg-[#16161c] border border-white/[0.08] text-zinc-300">
                {netProfile.category}
              </span>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5 text-xs font-mono tabular-nums">
          <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <span className="block text-[10px] text-zinc-400">Signal Quality</span>
            <strong className="text-emerald-300">{wifi?.signalPercent !== undefined && wifi?.signalPercent !== null ? `${wifi.signalPercent}%` : 'Wired / N/A'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <span className="block text-[10px] text-zinc-400">PHY Rx / Tx Link</span>
            <strong className="text-white">
              {wifi?.rxRateMbps ? `${wifi.rxRateMbps}/${wifi.txRateMbps || wifi.rxRateMbps} Mbps` : '—'}
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <span className="block text-[10px] text-zinc-400">Channel / Security</span>
            <strong className="text-sky-300 truncate block">{wifi?.channel ? `Ch ${wifi.channel} · ${wifi.authentication || 'WPA'}` : 'Ethernet / Local'}</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <span className="block text-[10px] text-zinc-400">Live Speed ↓ / ↑</span>
            <strong className="text-white">{formatNetRate(live.network.rxKBps)} / {formatNetRate(live.network.txKBps)}</strong>
          </div>
          <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <span className="block text-[10px] text-zinc-400">Session Data / Drops</span>
            <strong className="text-purple-300 block truncate">
              {formatBytes(live.network.totalRecvBytes, 1)} ↓ · {live.network.dropsIn + live.network.dropsOut} drp
            </strong>
          </div>
          <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <span className="block text-[10px] text-zinc-400">Gateway, DNS &amp; Sockets</span>
            <strong className="text-amber-300 block truncate">
              {primaryGateway?.ipv4Gateway ? `GW ${primaryGateway.ipv4Gateway}` : `${live.socketCounts.established} Est / ${live.socketCounts.listening} Lsn`}
            </strong>
            <span className="block text-[10px] text-zinc-400 truncate mt-0.5">
              {specs.dnsServers?.[0]?.servers[0]
                ? `DNS ${specs.dnsServers[0].servers[0]} · ${live.socketCounts.established} Est`
                : `${live.socketCounts.established} Est / ${live.socketCounts.listening} Lsn`}
            </span>
          </div>
        </div>

        {specs.physicalNetworkHw && specs.physicalNetworkHw.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-white/[0.06] text-[10.5px] font-mono">
            <span className="text-zinc-400">Physical Silicon:</span>
            {specs.physicalNetworkHw.map((nic, idx) => (
              <span
                key={`${nic.pnpId}-${idx}`}
                className={`px-2 py-0.5 rounded-md border ${
                  nic.connected
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300 font-bold'
                    : 'bg-[#16161c] border-white/[0.08] text-zinc-400'
                }`}
              >
                {nic.name}
                {nic.macAddress ? ` (${nic.macAddress})` : ''}
              </span>
            ))}
          </div>
        )}
      </section>

      {/* Filter Network Interface Adapters */}
      <div className="p-3.5 rounded-2xl system-card flex items-center justify-between gap-3">
        <div className="relative flex-1">
          <svg
            className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            value={nicSearch}
            onChange={(e) => setNicSearch(e.target.value)}
            placeholder="Filter network adapters by interface name, IPv4, IPv6, or MAC..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400/50"
          />
          {nicSearch && (
            <button
              type="button"
              onClick={() => setNicSearch('')}
              aria-label="Clear filter"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 shrink-0 hidden sm:inline">
          {adapterRows.length}/{live.networkAdapters.length} Adapters
        </span>
      </div>

      {/* ── In-Place (+ / -) Expandable Network Adapters Table (Wi-Fi / Real NIC First) ── */}
      <HardwareDetailsTable
        title="Network Interface Adapters"
        subtitle="Real hardware NICs prioritized at top. Click + on any adapter to inspect full IPv4, IPv6, MAC address, link speed, MTU, and session counters."
        rows={adapterRows}
        defaultExpandedIds={defaultExpandedAdapterIds}
        onClearFilter={() => setNicSearch('')}
      />
    </div>
  );
}
