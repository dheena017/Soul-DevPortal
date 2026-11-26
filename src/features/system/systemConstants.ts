export type SystemSubTabId =
  | 'performance'
  | 'hardware'
  | 'peripherals'
  | 'storage-network'
  | 'power-health'
  | 'startup-services'
  | 'processes'
  | 'environment';

export type SystemTabGroup = 'overview' | 'hardware' | 'peripherals' | 'software';

export interface SystemSubTabConfig {
  id: SystemSubTabId;
  label: string;
  shortLabel: string;
  group: SystemTabGroup;
}

export const SYSTEM_SUB_TABS: SystemSubTabConfig[] = [
  { id: 'performance', label: 'Live Performance', shortLabel: 'Performance', group: 'overview' },
  { id: 'hardware', label: 'Internal Hardware', shortLabel: 'Hardware', group: 'hardware' },
  { id: 'storage-network', label: 'Storage & Network', shortLabel: 'Storage & Net', group: 'hardware' },
  { id: 'power-health', label: 'Power & Firmware', shortLabel: 'Power', group: 'hardware' },
  { id: 'peripherals', label: 'Peripherals (In / Out)', shortLabel: 'Peripherals', group: 'peripherals' },
  { id: 'startup-services', label: 'OS, Drivers & Services', shortLabel: 'OS & Drivers', group: 'software' },
  { id: 'processes', label: 'Applications & Ports', shortLabel: 'Apps & Ports', group: 'software' },
  { id: 'environment', label: 'Runtimes & Environment', shortLabel: 'Env & PATH', group: 'software' },
];

import { HistoryWindowSec, SystemLiveSnapshot, SystemSpecs } from '../../types';

export const POLL_INTERVAL_OPTIONS = [
  { label: '1s', ms: 1000 },
  { label: '2s', ms: 2000 },
  { label: '5s', ms: 5000 },
] as const;

export const HISTORY_WINDOW_OPTIONS: ReadonlyArray<{ label: string; sec: HistoryWindowSec }> = [
  { label: '1m', sec: 60 },
  { label: '5m', sec: 300 },
  { label: '15m', sec: 900 },
];

export function buildDiagnosticReportMarkdown(specs: SystemSpecs, live: SystemLiveSnapshot): string {
  const bat = live.battery;
  const topCpuLines = live.topCpu
    .map((p, i) => `${i + 1}. \`${p.name}\` (#${p.pid}) — ${p.cpuPercent.toFixed(1)}% CPU, ${p.memoryMB.toFixed(1)} MB RAM`)
    .join('\n');
  const topRamLines = live.topMemory
    .map((p, i) => `${i + 1}. \`${p.name}\` (#${p.pid}) — ${p.memoryMB.toFixed(1)} MB RAM, ${p.cpuPercent.toFixed(1)}% CPU`)
    .join('\n');
  const evtLines = (specs.systemEvents || [])
    .slice(0, 8)
    .map((e) => `- [${e.level}] ${e.provider} (#${e.id}) @ ${e.timestamp}: ${e.message}`)
    .join('\n');
  return [
    `# System Diagnostic Report — ${specs.host.hostname}`,
    `Generated: ${new Date().toISOString()} | Uptime: ${formatUptime(live.uptimeSeconds)} | Posture: **${live.healthPosture.label}**`,
    '',
    '## Hardware & Platform',
    `- **Model**: ${specs.host.manufacturer} ${specs.host.model} (${specs.host.chassisType})`,
    `- **OS**: ${specs.host.osName} (${specs.host.architecture})`,
    `- **CPU**: ${specs.cpu.name} (${specs.cpu.physicalCores}C/${specs.cpu.logicalThreads}T · Live ${formatClock(live.cpu.currentClockMHz)})`,
    `- **Memory**: ${formatBytes(live.memory.usedBytes)} / ${formatBytes(live.memory.totalBytes)} (${live.memory.percent}%)`,
    bat ? `- **Battery**: ${Math.round(bat.percent)}% (${bat.statusLabel})` : '- **Power**: AC Mains',
    '',
    '## Top CPU Processes',
    topCpuLines || '- None',
    '',
    '## Top Memory Processes',
    topRamLines || '- None',
    '',
    `## Listening Ports (${live.activePorts.length})`,
    ...live.activePorts.slice(0, 20).map((p) => `- \`:${p.port}\` (${p.protocol}) — ${p.serviceLabel} [${p.processName || 'System'} #${p.pid ?? '?'}] (${p.address})`),
    '',
    '## Recent System Events',
    evtLines || '- No recent Critical/Error/Warning system events captured.',
  ].join('\n');
}

export function formatBytes(bytes?: number | null, decimals = 1): string {
  if (bytes === undefined || bytes === null || Number.isNaN(bytes) || bytes <= 0) {
    return '0 B';
  }
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
  const i = Math.min(units.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
  const val = bytes / Math.pow(k, i);
  return `${val.toFixed(i === 0 ? 0 : decimals)} ${units[i]}`;
}

export function formatClock(mhz?: number | null): string {
  if (!mhz || mhz <= 0) return '—';
  if (mhz >= 1000) {
    return `${(mhz / 1000).toFixed(2)} GHz`;
  }
  return `${Math.round(mhz)} MHz`;
}

export function formatCacheSize(kb?: number | null): string {
  if (!kb || kb <= 0) return '—';
  if (kb >= 1024) {
    const mb = kb / 1024;
    return `${Number.isInteger(mb) ? mb : mb.toFixed(1)} MB`;
  }
  return `${kb} KB`;
}

export function formatUptime(seconds?: number | null): string {
  if (seconds === undefined || seconds === null || seconds < 0) return '0m';
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  if (hours > 0) return `${hours}h ${mins}m ${secs}s`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

export function formatNetRate(kbps?: number | null): string {
  if (kbps === undefined || kbps === null || kbps <= 0) return '0 KB/s';
  if (kbps >= 1024) return `${(kbps / 1024).toFixed(2)} MB/s`;
  return `${kbps.toFixed(1)} KB/s`;
}

export function maskSerialValue(serial?: string | null, reveal = false): string {
  if (!serial) return 'N/A';
  if (reveal || serial.length <= 4) return serial;
  return `${'•'.repeat(Math.min(8, serial.length - 4))}${serial.slice(-4)}`;
}

export function getLoadTone(pct?: number | null): {
  stroke: string;
  text: string;
  badge: string;
  tileBg: string;
  glow: string;
} {
  const val = pct ?? 0;
  if (val >= 85) {
    return {
      stroke: '#f43f5e',
      text: 'text-rose-400',
      badge: 'bg-rose-500/15 border-rose-500/35 text-rose-300',
      tileBg: 'bg-rose-500/20 border-rose-500/40 text-rose-200',
      glow: 'rgba(244, 63, 94, 0.35)',
    };
  }
  if (val >= 65) {
    return {
      stroke: '#f59e0b',
      text: 'text-amber-400',
      badge: 'bg-amber-500/15 border-amber-500/35 text-amber-300',
      tileBg: 'bg-amber-500/15 border-amber-500/35 text-amber-200',
      glow: 'rgba(245, 158, 11, 0.32)',
    };
  }
  if (val >= 35) {
    return {
      stroke: '#38bdf8',
      text: 'text-sky-400',
      badge: 'bg-sky-500/15 border-sky-400/35 text-sky-300',
      tileBg: 'bg-sky-500/15 border-sky-400/35 text-sky-200',
      glow: 'rgba(56, 189, 248, 0.3)',
    };
  }
  return {
    stroke: '#10b981',
    text: 'text-emerald-400',
    badge: 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300',
    tileBg: 'bg-emerald-500/12 border-emerald-500/30 text-emerald-200',
    glow: 'rgba(16, 185, 129, 0.28)',
  };
}
