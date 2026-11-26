import React, { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { usePersistedTab } from '../../utils/usePersistedTab';
import TabLoadingState, { LoadingStepItem } from '../../components/TabLoadingState';
import { fetchSystemLive, fetchSystemOverview, refreshSystemSpecs, subscribeSystemStream } from '../../services/api';
import { HistoryWindowSec, SystemLiveSnapshot, SystemSpecs } from '../../types';
import { formatBytes, formatNetRate, formatUptime, SystemSubTabId } from './systemConstants';
import SystemHeaderCard from './components/SystemHeaderCard';
import PerformanceOverviewTab from './components/PerformanceOverviewTab';
import RadialGauge from './components/RadialGauge';

let sessionSpecsCache: SystemSpecs | null = null;
let sessionLiveCache: SystemLiveSnapshot | null = null;

const HardwareSpecsTab = lazy(() => import('./components/HardwareSpecsTab'));
const PeripheralsDisplaysTab = lazy(() => import('./components/PeripheralsDisplaysTab'));
const StorageNetworkTab = lazy(() => import('./components/StorageNetworkTab'));
const PowerHealthTab = lazy(() => import('./components/PowerHealthTab'));
const StartupServicesTab = lazy(() => import('./components/StartupServicesTab'));
const ProcessesTab = lazy(() => import('./components/ProcessesTab'));
const EnvironmentTab = lazy(() => import('./components/EnvironmentTab'));

export interface SystemViewProps {
  onNavigate?: (viewId: string) => void;
}

const HARDWARE_PROBE_STEPS: LoadingStepItem[] = [
  { id: 'cpu', icon: '⚡', label: 'Probing CPU Silicon & Cache Pyramid', threshold: 25 },
  { id: 'ram', icon: '📦', label: 'Mounting Physical Memory DIMM Slots', threshold: 50 },
  { id: 'gpu', icon: '🚀', label: 'Inspecting Displays, Storage & Wi-Fi', threshold: 75 },
  { id: 'env', icon: '📜', label: 'Hydrating Services, Startup & PATH', threshold: 95 },
];

export default function SystemView(_props: SystemViewProps) {
  const [specs, setSpecs] = useState<SystemSpecs | null>(() => sessionSpecsCache);
  const [live, setLive] = useState<SystemLiveSnapshot | null>(() => sessionLiveCache);
  const [previewLive, setPreviewLive] = useState<SystemLiveSnapshot | null>(() => sessionLiveCache);
  const [activeTab, setActiveTab] = usePersistedTab<SystemSubTabId>('soul-tab-system', 'performance');
  const [isLoading, setIsLoading] = useState<boolean>(() => !sessionSpecsCache || !sessionLiveCache);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(2000);
  const [historyWindowSec, setHistoryWindowSec] = useState<HistoryWindowSec>(60);
  const [streamMode, setStreamMode] = useState<'sse' | 'poll'>('sse');
  const [isRescanning, setIsRescanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInitial = useCallback(async (attempt = 0) => {
    if (attempt === 0 && (!sessionSpecsCache || !sessionLiveCache)) {
      setIsLoading(true);
      setErrorMsg(null);
      // Grab ultra-fast live telemetry (< 15ms) while full WMI hardware probe runs
      void fetchSystemLive(60).then((fastSnap) => {
        if (fastSnap) {
          sessionLiveCache = fastSnap;
          setPreviewLive(fastSnap);
        }
      });
    }
    const data = await fetchSystemOverview(60);
    if (data && data.specs && data.live) {
      sessionSpecsCache = data.specs;
      sessionLiveCache = data.live;
      setSpecs(data.specs);
      setLive(data.live);
      setPreviewLive(data.live);
      setErrorMsg(null);
      setIsLoading(false);
      return;
    }
    if (attempt < 4) {
      window.setTimeout(() => {
        void loadInitial(attempt + 1);
      }, 1500);
      return;
    }
    setErrorMsg('Unable to reach the FastAPI hardware telemetry service on :8008.');
    setIsLoading(false);
  }, []);

  useEffect(() => {
    loadInitial();
  }, [loadInitial]);

  useEffect(() => {
    const handleVisibility = () => setIsTabHidden(document.hidden);
    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  // Re-fetch immediately when window changes (even if paused)
  useEffect(() => {
    if (!specs) return;
    let cancelled = false;
    fetchSystemLive(historyWindowSec).then((nextLive) => {
      if (!cancelled && nextLive) setLive(nextLive);
    });
    return () => {
      cancelled = true;
    };
  }, [historyWindowSec, specs]);

  // Live SSE stream with automatic graceful HTTP polling fallback
  useEffect(() => {
    if (isPaused || isTabHidden || !specs) return;

    if (streamMode === 'sse') {
      return subscribeSystemStream(
        pollIntervalMs,
        historyWindowSec,
        (nextLive) => {
          sessionLiveCache = nextLive;
          setLive(nextLive);
        },
        () => {
          setStreamMode('poll');
        }
      );
    }

    let cancelled = false;
    const timer = window.setInterval(async () => {
      const nextLive = await fetchSystemLive(historyWindowSec);
      if (!cancelled && nextLive) {
        sessionLiveCache = nextLive;
        setLive(nextLive);
      }
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isPaused, isTabHidden, pollIntervalMs, historyWindowSec, streamMode, specs]);

  const handleRescan = async () => {
    setIsRescanning(true);
    const res = await refreshSystemSpecs();
    if (res?.success && res.specs) {
      sessionSpecsCache = res.specs;
      setSpecs(res.specs);
    }
    const nextLive = await fetchSystemLive(historyWindowSec);
    if (nextLive) {
      sessionLiveCache = nextLive;
      setLive(nextLive);
    }
    setIsRescanning(false);
  };

  if (isLoading) {
    const primaryVol = previewLive?.disk?.volumes?.[0];
    const previewHint = previewLive
      ? `Live Telemetry Connected · CPU ${Math.round(previewLive.cpu.totalPercent)}% · RAM ${Math.round(previewLive.memory.percent)}% · Uptime ${formatUptime(previewLive.uptimeSeconds)}`
      : null;

    return (
      <div className="w-full py-1 flex flex-col gap-5">
        <TabLoadingState
          title="Scanning Host Hardware & Telemetry"
          subtitle="Computer Monitor · Live Hardware Engine"
          steps={HARDWARE_PROBE_STEPS}
          backdropSrc="/visuals/pillar-computer-silicon.jpg"
          liveHint={previewHint}
          onRetry={() => void loadInitial(0)}
        />

        {/* Balanced Live Telemetry / Skeleton Preview below probe card */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {previewLive ? (
            <>
              <RadialGauge
                title="Processor (CPU)"
                value={previewLive.cpu.totalPercent}
                centerCaption="LIVE PREVIEW"
                subtitle="Streaming fast CPU usage..."
                detailLine={`Peak ${previewLive.peaks.cpuPeakPercent}% · Avg ${previewLive.peaks.cpuAvgPercent}%`}
                accent="sky"
              />
              <RadialGauge
                title="Memory (RAM)"
                value={previewLive.memory.percent}
                centerCaption="IN USE"
                subtitle={`${formatBytes(previewLive.memory.usedBytes)} / ${formatBytes(previewLive.memory.totalBytes)}`}
                detailLine="Waiting on DIMM hardware table..."
                accent="purple"
              />
              <RadialGauge
                title="Primary Volume"
                value={primaryVol ? primaryVol.usedPercent : null}
                centerCaption={primaryVol ? `DISK ${primaryVol.mountpoint.replace('\\', '')}` : 'STORAGE'}
                statusText="Online"
                subtitle={primaryVol ? `${formatBytes(primaryVol.freeBytes)} free` : 'Inspecting physical disks...'}
                detailLine={`Disk ↓ ${previewLive.disk.readMBps.toFixed(1)} MB/s · ↑ ${previewLive.disk.writeMBps.toFixed(1)} MB/s`}
                accent="emerald"
              />
              <RadialGauge
                title="Host Link & Health"
                value={previewLive.battery?.percent ?? Math.min(100, previewLive.socketCounts.established)}
                centerText={previewLive.battery ? `${Math.round(previewLive.battery.percent)}%` : previewLive.healthPosture.label}
                centerCaption={previewLive.battery ? 'BATTERY' : 'POSTURE'}
                statusText={previewLive.healthPosture.label}
                subtitle={`Net ↓ ${formatNetRate(previewLive.network.rxKBps)} · ↑ ${formatNetRate(previewLive.network.txKBps)}`}
                detailLine={`Up ${formatUptime(previewLive.uptimeSeconds)}`}
                accent="amber"
              />
            </>
          ) : (
            ['CPU Load', 'Memory Footprint', 'Storage Volumes', 'Network & Power'].map((label) => (
              <div
                key={label}
                className="p-5 rounded-2xl system-kpi-card flex flex-col justify-between gap-4 min-h-[190px]"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs font-bold text-zinc-400">{label}</span>
                  <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.08] text-[10px] font-mono text-zinc-500">
                    Probing
                  </span>
                </div>
                <div className="w-24 h-24 rounded-full border-4 border-white/[0.05] border-t-sky-400/35 mx-auto animate-pulse" />
                <div className="h-3 w-3/4 mx-auto rounded bg-white/[0.05] animate-pulse" />
              </div>
            ))
          )}
        </div>
      </div>
    );
  }

  if (errorMsg || !specs || !live) {
    return (
      <div className="w-full py-2 fade-in-up">
        <div className="p-6 rounded-2xl system-card border-rose-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-white">Host System Telemetry Offline</h2>
            <p className="text-xs text-zinc-400">{errorMsg || 'Hardware snapshot unavailable.'}</p>
          </div>
          <button
            type="button"
            onClick={() => void loadInitial(0)}
            className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            Retry Hardware Probe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full py-1 flex flex-col gap-5 fade-in-up">
      <SystemHeaderCard
        specs={specs}
        live={live}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isPaused={isPaused}
        isTabHidden={isTabHidden}
        pollIntervalMs={pollIntervalMs}
        historyWindowSec={historyWindowSec}
        streamMode={streamMode}
        isRescanning={isRescanning}
        onTogglePause={() => setIsPaused((p) => !p)}
        onChangePollInterval={(ms) => setPollIntervalMs(ms)}
        onChangeHistoryWindow={(sec) => setHistoryWindowSec(sec)}
        onRescanHardware={handleRescan}
      />

      <div key={activeTab} className="tab-content-animate">
        <Suspense
          fallback={
            <TabLoadingState
              title="Loading Telemetry Module"
              subtitle="Computer Monitor • Hydrating Hardware View"
              badgeText="LIVE SSE"
              backdropSrc="/visuals/pillar-computer-silicon.jpg"
            />
          }
        >
          {activeTab === 'performance' && (
            <PerformanceOverviewTab specs={specs} live={live} onSelectTab={setActiveTab} historyWindowSec={historyWindowSec} />
          )}
          {activeTab === 'hardware' && <HardwareSpecsTab specs={specs} live={live} onSelectTab={setActiveTab} />}
          {activeTab === 'peripherals' && <PeripheralsDisplaysTab specs={specs} />}
          {activeTab === 'storage-network' && <StorageNetworkTab specs={specs} live={live} historyWindowSec={historyWindowSec} />}
          {activeTab === 'power-health' && <PowerHealthTab specs={specs} live={live} historyWindowSec={historyWindowSec} />}
          {activeTab === 'startup-services' && <StartupServicesTab specs={specs} />}
          {activeTab === 'processes' && <ProcessesTab live={live} />}
          {activeTab === 'environment' && <EnvironmentTab specs={specs} />}
        </Suspense>
      </div>
    </div>
  );
}
