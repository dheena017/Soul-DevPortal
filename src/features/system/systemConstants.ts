export type SystemSubTabId =
  | 'performance'
  | 'hardware'
  | 'peripherals'
  | 'storage-network'
  | 'power-health'
  | 'startup-services'
  | 'processes'
  | 'environment';

export interface SystemSubTabConfig {
  id: SystemSubTabId;
  label: string;
  shortLabel: string;
}

export const SYSTEM_SUB_TABS: SystemSubTabConfig[] = [
  { id: 'performance', label: 'Live Performance', shortLabel: 'Performance' },
  { id: 'hardware', label: 'Hardware Specs', shortLabel: 'Hardware' },
  { id: 'peripherals', label: 'Displays & Devices', shortLabel: 'Devices' },
  { id: 'storage-network', label: 'Storage & Network', shortLabel: 'Storage & Net' },
  { id: 'power-health', label: 'Power & Health', shortLabel: 'Power' },
  { id: 'startup-services', label: 'Startup & Services', shortLabel: 'Startup' },
  { id: 'processes', label: 'Processes & Ports', shortLabel: 'Processes' },
  { id: 'environment', label: 'Environment & PATH', shortLabel: 'Env & PATH' },
];

export const POLL_INTERVAL_OPTIONS = [
  { label: '1s', ms: 1000 },
  { label: '2s', ms: 2000 },
  { label: '5s', ms: 5000 },
] as const;

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
