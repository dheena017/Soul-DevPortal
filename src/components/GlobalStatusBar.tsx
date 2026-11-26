import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSharedTelemetry } from '../services/telemetryStore';
import { SystemLiveSnapshot } from '../types';
import { isEverydayRoute } from '../features/everyday/everydayTabsRegistry';
import { openChangelogPanel } from '../utils/openStandalonePanel';

export interface GlobalStatusBarProps {
  active: string;
  onNavigate: (viewId: string) => void;
  isBackendLive?: boolean;
  liveTelemetry?: SystemLiveSnapshot | null;
  canScrollTop: boolean;
  onScrollTop: () => void;
  projectsCount: number;
  onOpenShortcuts: () => void;
  onFocusSearch?: () => void;
}

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const APP_SESSION_START = Date.now();

function formatUptime(totalSec?: number): string {
  if (!totalSec || totalSec < 0) return '—';
  const days = Math.floor(totalSec / 86400);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

function formatSessionDuration(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const hrs = Math.floor(totalSec / 3600);
  const mins = Math.floor((totalSec % 3600) / 60);
  const secs = totalSec % 60;
  if (hrs > 0) return `${hrs}h ${mins}m`;
  if (mins > 0) return `${mins}m ${secs}s`;
  return `${secs}s`;
}

function formatRate(kbps?: number): string {
  if (kbps === undefined || kbps === null || Number.isNaN(kbps)) return '0 KB/s';
  if (kbps >= 1024) return `${(kbps / 1024).toFixed(1)} MB/s`;
  return `${Math.round(kbps)} KB/s`;
}

export const GlobalStatusBar: React.FC<GlobalStatusBarProps> = ({
  active,
  onNavigate,
  isBackendLive: propBackendLive,
  liveTelemetry: propLiveTelemetry,
  canScrollTop,
  onScrollTop,
  projectsCount,
  onOpenShortcuts,
  onFocusSearch,
}) => {
  const shared = useSharedTelemetry(propBackendLive === undefined);
  const isBackendLive = propBackendLive ?? shared.isBackendLive;
  const liveTelemetry = propLiveTelemetry !== undefined ? propLiveTelemetry : shared.liveTelemetry;
  const [now, setNow] = useState<Date>(() => new Date());
  const [isOnline, setIsOnline] = useState<boolean>(() =>
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );
  const [use24Hour, setUse24Hour] = useState<boolean>(() => {
    try {
      return localStorage.getItem('soul-clock-format') === '24h';
    } catch {
      return false;
    }
  });
  const [calendarOpen, setCalendarOpen] = useState<boolean>(false);
  const [viewMonthOffset, setViewMonthOffset] = useState<number>(0);
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const popoverRef = useRef<HTMLDivElement | null>(null);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const isDesktopRuntime = typeof window !== 'undefined' && Boolean(window.soulDesktop?.isDesktop);

  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  useEffect(() => {
    if (!calendarOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setCalendarOpen(false);
    };
    const onClickOutside = (e: MouseEvent) => {
      const target = e.target as Node | null;
      if (
        target &&
        popoverRef.current &&
        !popoverRef.current.contains(target) &&
        triggerRef.current &&
        !triggerRef.current.contains(target)
      ) {
        setCalendarOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    window.addEventListener('mousedown', onClickOutside);
    return () => {
      window.removeEventListener('keydown', onKey);
      window.removeEventListener('mousedown', onClickOutside);
    };
  }, [calendarOpen]);

  const toggle24Hour = () => {
    setUse24Hour((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('soul-clock-format', next ? '24h' : '12h');
      } catch {
        // ignore storage error
      }
      return next;
    });
  };

  const formattedTime = useMemo(
    () =>
      now.toLocaleTimeString('en-US', {
        hour12: !use24Hour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now, use24Hour]
  );

  const formattedUtcTime = useMemo(
    () =>
      now.toLocaleTimeString('en-US', {
        timeZone: 'UTC',
        hour12: !use24Hour,
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }),
    [now, use24Hour]
  );

  const shortDate = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
      }),
    [now]
  );

  const fullDate = useMemo(
    () =>
      now.toLocaleDateString(undefined, {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }),
    [now]
  );

  const timeZoneInfo = useMemo(() => {
    try {
      const resolved = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
      const offsetMin = -now.getTimezoneOffset();
      const sign = offsetMin >= 0 ? '+' : '-';
      const absMin = Math.abs(offsetMin);
      const hrs = String(Math.floor(absMin / 60)).padStart(2, '0');
      const mins = String(absMin % 60).padStart(2, '0');
      return { name: resolved, utcOffset: `UTC${sign}${hrs}:${mins}` };
    } catch {
      return { name: 'Local', utcOffset: 'UTC' };
    }
  }, [now.getTimezoneOffset()]);

  const calendarGrid = useMemo(() => {
    const base = new Date(now.getFullYear(), now.getMonth() + viewMonthOffset, 1);
    const year = base.getFullYear();
    const month = base.getMonth();
    const firstWeekday = base.getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const title = base.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
    const cells: Array<{ day: number | null; isToday: boolean }> = [];
    for (let i = 0; i < firstWeekday; i += 1) cells.push({ day: null, isToday: false });
    for (let d = 1; d <= daysInMonth; d += 1) {
      const isToday =
        year === now.getFullYear() && month === now.getMonth() && d === now.getDate();
      cells.push({ day: d, isToday });
    }
    return { title, cells };
  }, [now, viewMonthOffset]);

  const handleCopy = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedLabel(label);
      window.setTimeout(() => setCopiedLabel(null), 1600);
    } catch {
      // ignore clipboard errors
    }
  };

  const postureTone =
    liveTelemetry?.healthPosture?.severity === 'critical'
      ? 'text-rose-300 border-rose-500/35 bg-rose-500/12'
      : liveTelemetry?.healthPosture?.severity === 'warn'
      ? 'text-amber-300 border-amber-500/35 bg-amber-500/12'
      : 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';

  const netRx = liveTelemetry?.network?.rxKBps;
  const netTx = liveTelemetry?.network?.txKBps;
  const wifiSsid = liveTelemetry?.connectedWifi?.ssid;
  const battery = liveTelemetry?.battery;

  return (
    <>
      {/* Floating Clock, Calendar & Quick Utilities Popover (outside footer backdrop-filter containing block) */}
      {calendarOpen && (
        <div
          ref={popoverRef}
          role="dialog"
          aria-label="Date, Time and Quick Utilities"
          className="fixed bottom-11 right-3 sm:right-5 z-50 w-[300px] sm:w-[324px] max-w-[calc(100vw-1.5rem)] max-h-[calc(100dvh-4.5rem)] overflow-y-auto rounded-2xl bg-[#111218]/[0.98] border border-white/[0.14] shadow-[0_20px_60px_rgba(0,0,0,0.88)] portal-page-enter"
        >
          <div className="relative p-4 flex flex-col gap-3.5 text-xs portal-header-sheen">
          {/* Clock Hero */}
          <div className="flex items-start justify-between gap-2">
            <div className="flex flex-col min-w-0">
              <div className="text-2xl font-extrabold font-mono tracking-tight text-white tabular-nums">
                {formattedTime}
              </div>
              <div className="text-[11px] text-zinc-300 font-medium truncate">{fullDate}</div>
              <div className="text-[10px] font-mono text-zinc-500 truncate">
                {timeZoneInfo.name} · {timeZoneInfo.utcOffset} · UTC {formattedUtcTime}
              </div>
            </div>
            <button
              type="button"
              onClick={toggle24Hour}
              className="px-2 py-1 rounded-lg bg-[#191b24] border border-white/[0.12] hover:border-sky-400/40 text-[10px] font-mono font-bold text-sky-300 cursor-pointer shrink-0 transition-colors"
              title="Switch between 24-hour and 12-hour clock"
            >
              {use24Hour ? '24H' : '12H'}
            </button>
          </div>

          {/* Copy Timestamp Quick Row */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => handleCopy(`${fullDate} ${formattedTime}`, 'Copied Date & Time')}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] text-[11px] font-mono text-zinc-200 hover:text-white transition-colors cursor-pointer"
            >
              {copiedLabel === 'Copied Date & Time' ? '✓ Copied Local' : 'Copy Local Time'}
            </button>
            <button
              type="button"
              onClick={() => handleCopy(now.toISOString(), 'Copied ISO')}
              className="flex-1 py-1.5 px-2.5 rounded-lg bg-[#171922] border border-white/[0.08] hover:border-white/[0.2] text-[11px] font-mono text-zinc-200 hover:text-white transition-colors cursor-pointer"
            >
              {copiedLabel === 'Copied ISO' ? '✓ Copied ISO' : 'Copy ISO-8601'}
            </button>
          </div>

          {/* Interactive Monthly Calendar */}
          <div className="rounded-xl bg-[#0c0d12] border border-white/[0.08] p-2.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={() => setViewMonthOffset((m) => m - 1)}
                className="w-6 h-6 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Previous month"
              >
                ‹
              </button>
              <button
                type="button"
                onClick={() => setViewMonthOffset(0)}
                className="text-[11px] font-bold text-zinc-100 hover:text-sky-300 cursor-pointer"
                title="Jump back to current month"
              >
                {calendarGrid.title}
              </button>
              <button
                type="button"
                onClick={() => setViewMonthOffset((m) => m + 1)}
                className="w-6 h-6 rounded-md hover:bg-white/[0.08] text-zinc-400 hover:text-white flex items-center justify-center cursor-pointer"
                aria-label="Next month"
              >
                ›
              </button>
            </div>
            <div className="grid grid-cols-7 gap-0.5 text-center text-[10px] font-mono text-zinc-500">
              {WEEKDAYS.map((d) => (
                <div key={d} className="py-0.5 font-bold">
                  {d}
                </div>
              ))}
              {calendarGrid.cells.map((cell, idx) => (
                <div
                  key={idx}
                  className={`py-1 rounded-md tabular-nums ${
                    cell.day === null
                      ? ''
                      : cell.isToday
                      ? 'bg-sky-500/25 border border-sky-400/50 text-sky-200 font-extrabold'
                      : 'text-zinc-300'
                  }`}
                >
                  {cell.day ?? ''}
                </div>
              ))}
            </div>
          </div>

          {/* Useful Always-On Session & Quick Actions */}
          <div className="flex items-center justify-between text-[11px] font-mono text-zinc-400 pt-1 border-t border-white/[0.08]">
            <span>Session: {formatSessionDuration(now.getTime() - APP_SESSION_START)}</span>
            <div className="flex items-center gap-2">
              {onFocusSearch && (
                <button
                  type="button"
                  onClick={() => {
                    setCalendarOpen(false);
                    onFocusSearch();
                  }}
                  className="text-sky-300 hover:text-sky-200 cursor-pointer"
                >
                  Search
                </button>
              )}
              <button
                type="button"
                onClick={() => {
                  setCalendarOpen(false);
                  onNavigate('computer');
                }}
                className="text-emerald-300 hover:text-emerald-200 cursor-pointer"
              >
                System
              </button>
            </div>
          </div>
          </div>
        </div>
      )}

      <footer
        role="contentinfo"
        aria-label="Global workspace status, system vitals, date and time"
        className="relative z-30 shrink-0 w-full h-9 bg-[#0a0b0f]/[0.97] border-t border-white/[0.08] select-none"
      >
        <div className="w-full max-w-[1800px] mx-auto h-full px-3 sm:px-4 lg:px-5 flex items-center justify-between gap-2 text-[11px] font-mono">
        {/* Left: Always-on Connection, Desktop Mode, Health & Uptime */}
        <div className="flex items-center gap-2 min-w-0">
          <button
            type="button"
            onClick={onOpenShortcuts}
            className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.07] text-zinc-200 transition-colors cursor-pointer shrink-0"
            title="Soul DevPortal v0.0.1 · Click for Desktop App & Keyboard Shortcuts"
          >
            <span
              className={`w-1.5 h-1.5 rounded-full ${
                isBackendLive ? 'bg-emerald-400 status-pulse' : 'bg-amber-400 animate-pulse'
              }`}
            />
            <span className="font-semibold text-zinc-200">v0.0.1</span>
            <span className="hidden sm:inline text-zinc-400">
              {isDesktopRuntime ? '· Desktop' : '· Web'}
            </span>
          </button>

          {!isOnline && (
            <span className="px-2 py-0.5 rounded-md bg-rose-500/15 border border-rose-500/35 text-rose-300 font-semibold shrink-0">
              Offline
            </span>
          )}

          {liveTelemetry?.healthPosture && (
            <button
              type="button"
              onClick={() => onNavigate('computer')}
              className={`hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border transition-colors cursor-pointer truncate max-w-[180px] ${postureTone}`}
              title={`System Health: ${liveTelemetry.healthPosture.label} · Click to inspect Computer Monitor`}
            >
              <span className="truncate">{liveTelemetry.healthPosture.label}</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => openChangelogPanel()}
            className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-sky-300 hover:text-white hover:bg-white/[0.06] transition-colors cursor-pointer shrink-0"
            title="Open Workspace Changelog in New Tab / Desktop Panel"
          >
            <span>Changelog ↗</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('everyday')}
            className={`hidden sm:inline-flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors cursor-pointer shrink-0 ${
              isEverydayRoute(active)
                ? 'bg-emerald-500/15 text-emerald-300 font-semibold'
                : 'text-zinc-300 hover:text-white hover:bg-white/[0.06]'
            }`}
            title="Open Everyday Utilities — Tasks, Notes, Focus, Habits, Budget & Checklists (Ctrl+7)"
          >
            <span>Everyday Utilities</span>
          </button>

          <button
            type="button"
            onClick={() => onNavigate('projects')}
            className="hidden 2xl:inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.05] transition-colors cursor-pointer shrink-0"
            title="View Workspace Applications"
          >
            <span>Apps:</span>
            <strong className="text-zinc-200">{projectsCount}</strong>
          </button>
        </div>

        {/* Center: Live Host Uptime, Power/Battery & Network Telemetry */}
        <div className="hidden lg:flex items-center gap-3 text-zinc-400 min-w-0">
          {liveTelemetry && (
            <>
              <button
                type="button"
                onClick={() => onNavigate('computer')}
                className="inline-flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer tabular-nums"
                title="System Uptime since last reboot"
              >
                <span className="text-sky-400">⏱</span>
                <span>Up {formatUptime(liveTelemetry.uptimeSeconds)}</span>
              </button>

              {battery && (
                <button
                  type="button"
                  onClick={() => onNavigate('computer')}
                  className="inline-flex items-center gap-1 hover:text-zinc-200 transition-colors cursor-pointer tabular-nums"
                  title={`Power: ${battery.statusLabel}`}
                >
                  <span className={battery.powerPlugged ? 'text-emerald-400' : 'text-amber-300'}>
                    {battery.powerPlugged ? '⚡' : '🔋'}
                  </span>
                  <span>
                    {Math.round(battery.percent)}%{battery.powerPlugged ? ' AC' : ''}
                  </span>
                </button>
              )}

              <button
                type="button"
                onClick={() => onNavigate('computer')}
                className="inline-flex items-center gap-1.5 hover:text-zinc-200 transition-colors cursor-pointer tabular-nums"
                title={wifiSsid ? `Connected Wi-Fi: ${wifiSsid}` : 'Live Network Throughput'}
              >
                <span className="text-emerald-400">↓ {formatRate(netRx)}</span>
                <span className="text-sky-400">↑ {formatRate(netTx)}</span>
                {wifiSsid && (
                  <span className="hidden 2xl:inline text-zinc-500 truncate max-w-[120px]">
                    · {wifiSsid}
                  </span>
                )}
              </button>
            </>
          )}
        </div>

        {/* Right: Quick Scroll Top, Session Status & Interactive Date/Time Clock */}
        <div className="flex items-center gap-2 shrink-0">
          {canScrollTop && (
            <button
              type="button"
              onClick={onScrollTop}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-sky-200 hover:bg-sky-500/25 transition-colors cursor-pointer"
              title="Scroll back to top"
            >
              <span>↑ Top</span>
            </button>
          )}

          {liveTelemetry && (
            <button
              type="button"
              onClick={() => onNavigate('computer')}
              className="inline-flex md:hidden items-center gap-1.5 px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/[0.07] text-zinc-300 tabular-nums cursor-pointer"
            >
              <span>CPU {Math.round(liveTelemetry.cpu.totalPercent)}%</span>
              <span>·</span>
              <span>RAM {Math.round(liveTelemetry.memory.percent)}%</span>
            </button>
          )}

          <button
            ref={triggerRef}
            type="button"
            onClick={() => {
              setViewMonthOffset(0);
              setCalendarOpen((prev) => !prev);
            }}
            aria-expanded={calendarOpen}
            aria-label="Current date and time — click for calendar and timezone tools"
            title={`${fullDate} · ${timeZoneInfo.name} (${timeZoneInfo.utcOffset}) · Click for calendar & copy tools`}
            className={`inline-flex items-center gap-2 px-2.5 py-0.5 rounded-md border tabular-nums transition-all cursor-pointer ${
              calendarOpen
                ? 'bg-sky-500/20 border-sky-400/50 text-white'
                : 'bg-[#14161e] border-white/[0.1] hover:border-sky-400/40 text-zinc-100 hover:text-white'
            }`}
          >
            <span className="hidden sm:inline text-zinc-300 font-medium">{shortDate}</span>
            <span className="hidden sm:inline text-zinc-600">·</span>
            <strong className="font-bold tracking-tight text-sky-200">{formattedTime}</strong>
            <span className="hidden md:inline text-[10px] text-zinc-400">{timeZoneInfo.utcOffset}</span>
          </button>
        </div>
      </div>
    </footer>
    </>
  );
};

export default GlobalStatusBar;
