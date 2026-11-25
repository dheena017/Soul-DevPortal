import React, { useCallback, useEffect, useState } from 'react';
import TabLoadingState, { LoadingStepItem } from '../../components/TabLoadingState';
import { fetchSystemLive, fetchSystemOverview, refreshSystemSpecs } from '../../services/api';
import { SystemLiveSnapshot, SystemSpecs } from '../../types';
import { SystemSubTabId } from './systemConstants';
import SystemHeaderCard from './components/SystemHeaderCard';
import PerformanceOverviewTab from './components/PerformanceOverviewTab';
import HardwareSpecsTab from './components/HardwareSpecsTab';
import PeripheralsDisplaysTab from './components/PeripheralsDisplaysTab';
import StorageNetworkTab from './components/StorageNetworkTab';
import PowerHealthTab from './components/PowerHealthTab';
import StartupServicesTab from './components/StartupServicesTab';
import ProcessesTab from './components/ProcessesTab';
import EnvironmentTab from './components/EnvironmentTab';

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
  const [specs, setSpecs] = useState<SystemSpecs | null>(null);
  const [live, setLive] = useState<SystemLiveSnapshot | null>(null);
  const [activeTab, setActiveTab] = useState<SystemSubTabId>('performance');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isTabHidden, setIsTabHidden] = useState<boolean>(() =>
    typeof document !== 'undefined' ? document.hidden : false
  );
  const [pollIntervalMs, setPollIntervalMs] = useState<number>(2000);
  const [isRescanning, setIsRescanning] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const loadInitial = useCallback(async () => {
    setIsLoading(true);
    setErrorMsg(null);
    const data = await fetchSystemOverview();
    if (data && data.specs && data.live) {
      setSpecs(data.specs);
      setLive(data.live);
      setErrorMsg(null);
    } else {
      setErrorMsg('Unable to reach the FastAPI hardware telemetry service on :8008.');
    }
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

  useEffect(() => {
    if (isPaused || isTabHidden || !specs) return;

    let cancelled = false;
    const timer = window.setInterval(async () => {
      const nextLive = await fetchSystemLive();
      if (!cancelled && nextLive) {
        setLive(nextLive);
      }
    }, pollIntervalMs);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [isPaused, isTabHidden, pollIntervalMs, specs]);

  const handleRescan = async () => {
    setIsRescanning(true);
    const res = await refreshSystemSpecs();
    if (res?.success && res.specs) {
      setSpecs(res.specs);
    }
    const nextLive = await fetchSystemLive();
    if (nextLive) setLive(nextLive);
    setIsRescanning(false);
  };

  if (isLoading) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <TabLoadingState
          title="Scanning Host Hardware & Telemetry"
          subtitle="Computer Monitor • Live Hardware Engine"
          steps={HARDWARE_PROBE_STEPS}
        />
      </div>
    );
  }

  if (errorMsg || !specs || !live) {
    return (
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 fade-in-up">
        <div className="p-6 rounded-2xl system-card border-rose-500/35 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex flex-col gap-1">
            <h2 className="text-base font-bold text-white">Host System Telemetry Offline</h2>
            <p className="text-xs text-zinc-400">{errorMsg || 'Hardware snapshot unavailable.'}</p>
          </div>
          <button
            type="button"
            onClick={loadInitial}
            className="px-4 py-2 rounded-xl bg-white text-zinc-950 text-xs font-bold hover:bg-zinc-200 transition-colors cursor-pointer shrink-0"
          >
            Retry Hardware Probe
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col gap-5 fade-in-up">
      <SystemHeaderCard
        specs={specs}
        live={live}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        isPaused={isPaused}
        isTabHidden={isTabHidden}
        pollIntervalMs={pollIntervalMs}
        isRescanning={isRescanning}
        onTogglePause={() => setIsPaused((p) => !p)}
        onChangePollInterval={(ms) => setPollIntervalMs(ms)}
        onRescanHardware={handleRescan}
      />

      <div key={activeTab} className="tab-content-animate">
        {activeTab === 'performance' && (
          <PerformanceOverviewTab specs={specs} live={live} onSelectTab={setActiveTab} />
        )}
        {activeTab === 'hardware' && <HardwareSpecsTab specs={specs} live={live} onSelectTab={setActiveTab} />}
        {activeTab === 'peripherals' && <PeripheralsDisplaysTab specs={specs} />}
        {activeTab === 'storage-network' && <StorageNetworkTab specs={specs} live={live} />}
        {activeTab === 'power-health' && <PowerHealthTab specs={specs} live={live} />}
        {activeTab === 'startup-services' && <StartupServicesTab specs={specs} />}
        {activeTab === 'processes' && <ProcessesTab live={live} />}
        {activeTab === 'environment' && <EnvironmentTab specs={specs} />}
      </div>
    </div>
  );
}
