import React, { useMemo, useState } from 'react';
import CopyButton from '../../../components/CopyButton';
import {
  ScheduledTaskSpec,
  StartupAppSpec,
  SystemDriverSpec,
  SystemServiceSpec,
  SystemSpecs,
} from '../../../types';
import { formatBytes } from '../systemConstants';
import { FilterPillBar, TableLoadAllFooter } from './SystemTablePrimitives';
import TelemetryTileGrid from './TelemetryTileGrid';

export interface StartupServicesTabProps {
  specs: SystemSpecs;
}

type SectionKey = 'startup' | 'services' | 'tasks' | 'drivers';
type StartupFilter = 'all' | 'enabled' | 'disabled' | 'folder' | 'hkcu' | 'hklm';
type ServiceFilter = 'running' | 'third_party' | 'automatic' | 'delayed' | 'auto_stopped' | 'all';
type TaskFilter = 'vendor' | 'logon_boot' | 'active' | 'disabled' | 'all';
type DriverFilter = 'running' | 'boot_system' | 'third_party' | 'filesystem' | 'all';

function SectionIcon({ kind, className }: { kind: SectionKey; className?: string }) {
  if (kind === 'startup') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
        <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
        <path d="M9 12H4s.55-3.03 2-4c1.62-1.08 5 0 5 0" />
        <path d="M12 15v5s3.03-.55 4-2c1.08-1.62 0-5 0-5" />
      </svg>
    );
  }
  if (kind === 'services') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="7" rx="2" />
        <rect x="2" y="14" width="20" height="7" rx="2" />
        <line x1="6" y1="6.5" x2="6.01" y2="6.5" />
        <line x1="6" y1="17.5" x2="6.01" y2="17.5" />
      </svg>
    );
  }
  if (kind === 'tasks') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <polyline points="12 6 12 12 16 14" />
      </svg>
    );
  }
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <rect x="9" y="9" width="6" height="6" />
      <path d="M9 2v2M15 2v2M9 20v2M15 20v2M2 9h2M2 15h2M20 9h2M20 15h2" />
    </svg>
  );
}

function driverStageDescription(mode: string): string {
  const m = mode.toLowerCase();
  if (m === 'boot') return 'Boot-Start: Loaded by Windows Boot Manager before OS kernel init';
  if (m === 'system') return 'System-Start: Loaded during core Windows kernel initialization';
  if (m === 'auto') return 'Auto-Start: Loaded automatically by Service Control Manager at boot';
  if (m === 'manual') return 'Manual / Demand-Start: Loaded dynamically by Plug-and-Play or subsystem';
  if (m === 'disabled') return 'Disabled: Driver will not load until re-enabled';
  return `${mode} driver stage`;
}

export default function StartupServicesTab({ specs }: StartupServicesTabProps) {
  const startupApps: StartupAppSpec[] = specs.startupApps || [];
  const services: SystemServiceSpec[] = specs.services || [];
  const scheduledTasks: ScheduledTaskSpec[] = specs.scheduledTasks || [];
  const systemDrivers: SystemDriverSpec[] = specs.systemDrivers || [];

  const [section, setSection] = useState<SectionKey>('startup');
  const [search, setSearch] = useState('');
  const [startupFilter, setStartupFilter] = useState<StartupFilter>('all');
  const [svcFilter, setSvcFilter] = useState<ServiceFilter>('running');
  const [taskFilter, setTaskFilter] = useState<TaskFilter>('vendor');
  const [driverFilter, setDriverFilter] = useState<DriverFilter>('running');
  const [expandedKeys, setExpandedKeys] = useState<Record<string, boolean>>({});
  const [showAllRows, setShowAllRows] = useState(false);

  // Aggregate summary metrics across all 4 subsystems
  const startupStats = useMemo(() => {
    const enabled = startupApps.filter((a) => a.enabled !== false).length;
    const disabled = startupApps.length - enabled;
    const missing = startupApps.filter((a) => a.fileExists === false).length;
    const folder = startupApps.filter((a) => a.scopeCategory === 'Startup Folder').length;
    const hkcu = startupApps.filter((a) => a.scopeCategory === 'User Registry').length;
    const hklm = startupApps.filter((a) => a.scopeCategory === 'Machine Registry').length;
    return { enabled, disabled, missing, folder, hkcu, hklm };
  }, [startupApps]);

  const serviceStats = useMemo(() => {
    const running = services.filter((s) => s.status.toLowerCase() === 'running').length;
    const automatic = services.filter((s) => s.startType.toLowerCase().includes('auto')).length;
    const delayed = services.filter((s) => Boolean(s.delayedAutoStart)).length;
    const thirdParty = services.filter((s) => s.isMicrosoft === false).length;
    const thirdPartyRunning = services.filter((s) => s.isMicrosoft === false && s.status.toLowerCase() === 'running').length;
    const autoStopped = services.filter(
      (s) => s.startType.toLowerCase() === 'automatic' && !s.delayedAutoStart && s.status.toLowerCase() !== 'running'
    ).length;
    return { running, automatic, delayed, thirdParty, thirdPartyRunning, autoStopped };
  }, [services]);

  const taskStats = useMemo(() => {
    const vendor = scheduledTasks.filter((t) => t.isVendorTask).length;
    const logonBoot = scheduledTasks.filter((t) => t.triggers.some((tr) => tr === 'Logon' || tr === 'Boot')).length;
    const active = scheduledTasks.filter((t) => t.enabled).length;
    const disabled = scheduledTasks.length - active;
    return { vendor, logonBoot, active, disabled };
  }, [scheduledTasks]);

  const driverStats = useMemo(() => {
    const running = systemDrivers.filter((d) => d.state.toLowerCase() === 'running').length;
    const bootSystem = systemDrivers.filter((d) => d.startMode === 'Boot' || d.startMode === 'System').length;
    const thirdParty = systemDrivers.filter((d) => d.isThirdParty).length;
    const filesystem = systemDrivers.filter((d) => d.serviceType.toLowerCase().includes('file system')).length;
    return { running, bootSystem, thirdParty, filesystem };
  }, [systemDrivers]);

  const filteredStartup = useMemo(() => {
    const q = search.trim().toLowerCase();
    return startupApps.filter((s) => {
      const isEnabled = s.enabled !== false;
      if (startupFilter === 'enabled' && !isEnabled) return false;
      if (startupFilter === 'disabled' && isEnabled) return false;
      if (startupFilter === 'folder' && s.scopeCategory !== 'Startup Folder') return false;
      if (startupFilter === 'hkcu' && s.scopeCategory !== 'User Registry') return false;
      if (startupFilter === 'hklm' && s.scopeCategory !== 'Machine Registry') return false;
      if (!q) return true;
      return (
        s.name.toLowerCase().includes(q) ||
        s.command.toLowerCase().includes(q) ||
        s.locationType.toLowerCase().includes(q) ||
        (s.publisher || '').toLowerCase().includes(q) ||
        (s.executable || '').toLowerCase().includes(q)
      );
    });
  }, [startupApps, startupFilter, search]);

  const filteredServices = useMemo(() => {
    const q = search.trim().toLowerCase();
    return services.filter((svc) => {
      if (svcFilter === 'running' && svc.status.toLowerCase() !== 'running') return false;
      if (svcFilter === 'third_party' && svc.isMicrosoft !== false) return false;
      if (svcFilter === 'automatic' && !svc.startType.toLowerCase().includes('auto')) return false;
      if (svcFilter === 'delayed' && !svc.delayedAutoStart) return false;
      if (
        svcFilter === 'auto_stopped' &&
        !(svc.startType.toLowerCase() === 'automatic' && !svc.delayedAutoStart && svc.status.toLowerCase() !== 'running')
      ) {
        return false;
      }
      if (!q) return true;
      return (
        svc.name.toLowerCase().includes(q) ||
        svc.displayName.toLowerCase().includes(q) ||
        (svc.binPath || '').toLowerCase().includes(q) ||
        (svc.publisher || '').toLowerCase().includes(q) ||
        (svc.account || '').toLowerCase().includes(q) ||
        (svc.description || '').toLowerCase().includes(q) ||
        (svc.pid ? String(svc.pid).includes(q) : false)
      );
    });
  }, [services, svcFilter, search]);

  const filteredTasks = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scheduledTasks.filter((t) => {
      if (taskFilter === 'vendor' && !t.isVendorTask) return false;
      if (taskFilter === 'logon_boot' && !t.triggers.some((tr) => tr === 'Logon' || tr === 'Boot')) return false;
      if (taskFilter === 'active' && !t.enabled) return false;
      if (taskFilter === 'disabled' && t.enabled) return false;
      if (!q) return true;
      return (
        t.name.toLowerCase().includes(q) ||
        t.taskPath.toLowerCase().includes(q) ||
        (t.author || '').toLowerCase().includes(q) ||
        (t.command || '').toLowerCase().includes(q) ||
        t.triggers.some((tr) => tr.toLowerCase().includes(q))
      );
    });
  }, [scheduledTasks, taskFilter, search]);

  const filteredDrivers = useMemo(() => {
    const q = search.trim().toLowerCase();
    return systemDrivers.filter((d) => {
      if (driverFilter === 'running' && d.state.toLowerCase() !== 'running') return false;
      if (driverFilter === 'boot_system' && d.startMode !== 'Boot' && d.startMode !== 'System') return false;
      if (driverFilter === 'third_party' && !d.isThirdParty) return false;
      if (driverFilter === 'filesystem' && !d.serviceType.toLowerCase().includes('file system')) return false;
      if (!q) return true;
      return (
        d.name.toLowerCase().includes(q) ||
        d.displayName.toLowerCase().includes(q) ||
        (d.pathName || '').toLowerCase().includes(q) ||
        d.startMode.toLowerCase().includes(q)
      );
    });
  }, [systemDrivers, driverFilter, search]);

  const rowLimit = showAllRows || search.trim().length > 0 ? 1000 : 120;
  const visibleServices = useMemo(() => filteredServices.slice(0, rowLimit), [filteredServices, rowLimit]);
  const visibleTasks = useMemo(() => filteredTasks.slice(0, rowLimit), [filteredTasks, rowLimit]);
  const visibleDrivers = useMemo(() => filteredDrivers.slice(0, rowLimit), [filteredDrivers, rowLimit]);

  const activeTotalCount =
    section === 'startup'
      ? filteredStartup.length
      : section === 'services'
        ? filteredServices.length
        : section === 'tasks'
          ? filteredTasks.length
          : filteredDrivers.length;

  const visibleRowKeys = useMemo(() => {
    if (section === 'startup') return filteredStartup.map((app, i) => `st-${i}-${app.name}`);
    if (section === 'services') return visibleServices.map((svc) => `svc-${svc.name}`);
    if (section === 'tasks') return visibleTasks.map((t, i) => `tsk-${i}-${t.taskPath}-${t.name}`);
    return visibleDrivers.map((d) => `drv-${d.name}`);
  }, [section, filteredStartup, visibleServices, visibleTasks, visibleDrivers]);

  const allVisibleExpanded = visibleRowKeys.length > 0 && visibleRowKeys.every((k) => expandedKeys[k]);

  const toggleExpand = (k: string) => {
    setExpandedKeys((prev) => ({ ...prev, [k]: !prev[k] }));
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
    setSection(next);
    setShowAllRows(false);
  };

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* 4-Card Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <button
          type="button"
          onClick={() => {
            switchSection('startup');
            setStartupFilter('all');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            section === 'startup' ? 'ring-1 ring-cyan-400/50 border-cyan-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Boot Startup Apps</span>
            <span className="w-6 h-6 rounded-lg bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center text-cyan-300">
              <SectionIcon kind="startup" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-cyan-300">{startupStats.enabled}</strong>
            <span className="text-[11px] font-mono text-zinc-400">Enabled / {startupApps.length} Total</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            {startupStats.disabled > 0 && (
              <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
                {startupStats.disabled} Disabled
              </span>
            )}
            <span className="text-zinc-400">
              {startupStats.folder} Folder · {startupStats.hkcu + startupStats.hklm} Registry
            </span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            switchSection('services');
            setSvcFilter('running');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            section === 'services' ? 'ring-1 ring-emerald-400/50 border-emerald-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">System Services</span>
            <span className="w-6 h-6 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-300">
              <SectionIcon kind="services" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-emerald-300">{serviceStats.running}</strong>
            <span className="text-[11px] font-mono text-zinc-400">Active / {services.length} OS Total</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30">
              {serviceStats.thirdPartyRunning} 3rd-Party Live
            </span>
            <span className="text-zinc-400">{serviceStats.delayed} Delayed</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            switchSection('tasks');
            setTaskFilter('vendor');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            section === 'tasks' ? 'ring-1 ring-violet-400/50 border-violet-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Scheduled Tasks</span>
            <span className="w-6 h-6 rounded-lg bg-violet-500/15 border border-violet-500/30 flex items-center justify-center text-violet-300">
              <SectionIcon kind="tasks" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-violet-300">{scheduledTasks.length}</strong>
            <span className="text-[11px] font-mono text-zinc-400">{taskStats.vendor} Vendor / User</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-violet-500/15 text-violet-300 border border-violet-500/30">
              {taskStats.logonBoot} Logon / Boot
            </span>
            <span className="text-zinc-400">{taskStats.active} Ready</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            switchSection('drivers');
            setDriverFilter('running');
          }}
          className={`p-4 rounded-2xl system-kpi-card text-left flex flex-col gap-1.5 cursor-pointer transition-all ${
            section === 'drivers' ? 'ring-1 ring-amber-400/50 border-amber-500/40' : ''
          }`}
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Kernel &amp; SYS Drivers</span>
            <span className="w-6 h-6 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-300">
              <SectionIcon kind="drivers" className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="flex items-baseline gap-2 flex-wrap">
            <strong className="text-xl font-extrabold font-mono tabular-nums text-amber-300">{driverStats.running}</strong>
            <span className="text-[11px] font-mono text-zinc-400">Loaded / {systemDrivers.length} SYS</span>
          </div>
          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            <span className="px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30">
              {driverStats.bootSystem} Boot / System
            </span>
            <span className="text-zinc-400">{driverStats.thirdParty} 3rd-Party</span>
          </div>
        </button>
      </div>

      {/* ── Boot, Services & Driver Structure Matrix ── */}
      <TelemetryTileGrid
        title="Startup, Services & Kernel Structure Matrix"
        rightLabel={`${serviceStats.running} Active Services · ${driverStats.running} Drivers`}
        rightToneClass="text-emerald-300"
        columnsClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
        items={[
          {
            id: 'ss-startup',
            label: 'Startup',
            badge: 'On',
            badgeTone: 'sky',
            valueText: `${startupStats.enabled}/${startupApps.length}`,
            percent: startupApps.length ? (startupStats.enabled / startupApps.length) * 100 : 0,
            onClick: () => switchSection('startup'),
            tooltip: `${startupStats.enabled} Enabled Startup Apps`,
          },
          {
            id: 'ss-svc',
            label: 'Services',
            badge: 'Run',
            badgeTone: 'emerald',
            valueText: `${serviceStats.running}`,
            percent: services.length ? (serviceStats.running / services.length) * 100 : 0,
            onClick: () => switchSection('services'),
            tooltip: `${serviceStats.running} Running of ${services.length} OS Services`,
          },
          {
            id: 'ss-3p',
            label: '3rd Party',
            badge: 'Svc',
            badgeTone: 'purple',
            valueText: `${serviceStats.thirdPartyRunning}`,
            percent: serviceStats.thirdParty ? (serviceStats.thirdPartyRunning / serviceStats.thirdParty) * 100 : 0,
            onClick: () => {
              switchSection('services');
              setSvcFilter('third_party');
            },
            tooltip: `${serviceStats.thirdPartyRunning} Running 3rd-Party Services`,
          },
          {
            id: 'ss-tasks',
            label: 'Tasks',
            badge: 'On',
            badgeTone: 'sky',
            valueText: `${taskStats.active}`,
            percent: scheduledTasks.length ? (taskStats.active / scheduledTasks.length) * 100 : 0,
            onClick: () => switchSection('tasks'),
            tooltip: `${taskStats.active} Active Scheduled Tasks`,
          },
          {
            id: 'ss-drv',
            label: 'Drivers',
            badge: 'Run',
            badgeTone: 'amber',
            valueText: `${driverStats.running}`,
            percent: systemDrivers.length ? (driverStats.running / systemDrivers.length) * 100 : 0,
            onClick: () => switchSection('drivers'),
            tooltip: `${driverStats.running} Running Kernel Drivers`,
          },
          {
            id: 'ss-boot',
            label: 'Boot/Sys',
            badge: 'Drv',
            badgeTone: 'amber',
            valueText: `${driverStats.bootSystem}`,
            percent: systemDrivers.length ? (driverStats.bootSystem / systemDrivers.length) * 100 : 0,
            onClick: () => {
              switchSection('drivers');
              setDriverFilter('boot_system');
            },
            tooltip: `${driverStats.bootSystem} Boot & System-Start Drivers`,
          },
        ]}
      />

      {/* Alert Strip when Automatic Services are Stopped or Startup Binaries are Missing */}
      {(serviceStats.autoStopped > 0 || startupStats.missing > 0) && (
        <div className="p-3.5 rounded-2xl bg-amber-500/[0.06] border border-amber-500/30 flex flex-wrap items-center justify-between gap-2 text-xs">
          <div className="flex flex-wrap items-center gap-2 font-mono text-amber-200">
            <span className="px-2 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[10px] font-bold uppercase">
              Boot Audit Alerts
            </span>
            {serviceStats.autoStopped > 0 && (
              <span>{serviceStats.autoStopped} Automatic (non-delayed) services currently stopped</span>
            )}
            {startupStats.missing > 0 && (
              <span>· {startupStats.missing} Startup command target(s) missing on disk</span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[11px] font-mono">
            {serviceStats.autoStopped > 0 && (
              <button
                type="button"
                onClick={() => {
                  switchSection('services');
                  setSvcFilter('auto_stopped');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#16161c] hover:bg-white/[0.08] border border-amber-500/35 text-amber-300 cursor-pointer"
              >
                Inspect Auto-Stopped
              </button>
            )}
            {startupStats.missing > 0 && (
              <button
                type="button"
                onClick={() => {
                  switchSection('startup');
                  setStartupFilter('all');
                }}
                className="px-2.5 py-1 rounded-lg bg-[#16161c] hover:bg-white/[0.08] border border-rose-500/35 text-rose-300 cursor-pointer"
              >
                Review Startup Entries
              </button>
            )}
          </div>
        </div>
      )}

      {/* Unified 4-Section Switcher, Filter & Search Bar */}
      <div className="p-4 rounded-2xl system-card flex flex-col gap-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3">
          <div className="inline-flex flex-wrap items-center gap-1 rounded-xl neu-tray bg-[#16161c] border border-white/[0.06] p-1" role="tablist" aria-label="Startup and services sections">
            {(
              [
                { id: 'startup', label: 'Boot Startup Apps', count: startupApps.length, badge: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/40' },
                { id: 'services', label: 'System Services', count: services.length, badge: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/40' },
                { id: 'tasks', label: 'Scheduled Tasks', count: scheduledTasks.length, badge: 'bg-violet-500/20 text-violet-200 border-violet-500/40' },
                { id: 'drivers', label: 'Kernel Drivers', count: systemDrivers.length, badge: 'bg-amber-500/20 text-amber-200 border-amber-500/40' },
              ] as const
            ).map((tab) => {
              const active = section === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => switchSection(tab.id)}
                  className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all cursor-pointer ${
                    active
                      ? 'text-white font-bold border border-white/20'
                      : 'text-zinc-300 hover:text-white hover:bg-white/[0.06] border border-transparent font-medium'
                  }`}
                >
                  <SectionIcon kind={tab.id} className="w-3.5 h-3.5 opacity-80" />
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
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  section === 'startup'
                    ? 'Filter app, publisher, command, or path...'
                    : section === 'services'
                      ? 'Filter service, publisher, PID, account, or path...'
                      : section === 'tasks'
                        ? 'Filter scheduled task, trigger, author, or command...'
                        : 'Filter kernel driver, .sys module, or stage...'
                }
                className="w-full pl-3 pr-8 py-2 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400/50"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch('')}
                  aria-label="Clear filter"
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
                >
                  ×
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={toggleAllVisible}
              className="neu-btn px-3 py-2 rounded-xl bg-[#16161c] hover:bg-white/[0.06] border border-white/[0.08] text-xs font-mono font-bold text-zinc-200 cursor-pointer shrink-0 transition-colors"
            >
              {allVisibleExpanded ? '− Collapse All' : '+ Expand Visible'}
            </button>
          </div>
        </div>

        {/* Sub-Filter Pill Strip */}
        {section === 'startup' && (
          <FilterPillBar
            tone="cyan"
            activeId={startupFilter}
            onSelect={(id) => setStartupFilter(id as StartupFilter)}
            shownCount={visibleRowKeys.length}
            totalCount={activeTotalCount}
            items={[
              { id: 'all', label: `All (${startupApps.length})` },
              { id: 'enabled', label: `Enabled (${startupStats.enabled})` },
              { id: 'disabled', label: `Disabled (${startupStats.disabled})` },
              { id: 'folder', label: `Startup Folder (${startupStats.folder})` },
              { id: 'hkcu', label: `User Registry (${startupStats.hkcu})` },
              { id: 'hklm', label: `Machine Registry (${startupStats.hklm})` },
            ]}
          />
        )}
        {section === 'services' && (
          <FilterPillBar
            tone="emerald"
            activeId={svcFilter}
            onSelect={(id) => setSvcFilter(id as ServiceFilter)}
            shownCount={visibleRowKeys.length}
            totalCount={activeTotalCount}
            items={[
              { id: 'running', label: `Running (${serviceStats.running})` },
              { id: 'third_party', label: `Third-Party (${serviceStats.thirdParty})` },
              { id: 'automatic', label: `Auto-Start (${serviceStats.automatic})` },
              { id: 'delayed', label: `Delayed Auto (${serviceStats.delayed})` },
              { id: 'auto_stopped', label: `Auto Stopped (${serviceStats.autoStopped})`, danger: serviceStats.autoStopped > 0 },
              { id: 'all', label: `All Services (${services.length})` },
            ]}
          />
        )}
        {section === 'tasks' && (
          <FilterPillBar
            tone="violet"
            activeId={taskFilter}
            onSelect={(id) => setTaskFilter(id as TaskFilter)}
            shownCount={visibleRowKeys.length}
            totalCount={activeTotalCount}
            items={[
              { id: 'vendor', label: `Vendor & User (${taskStats.vendor})` },
              { id: 'logon_boot', label: `Logon / Boot Triggers (${taskStats.logonBoot})` },
              { id: 'active', label: `Ready / Running (${taskStats.active})` },
              { id: 'disabled', label: `Disabled (${taskStats.disabled})` },
              { id: 'all', label: `All Tasks (${scheduledTasks.length})` },
            ]}
          />
        )}
        {section === 'drivers' && (
          <FilterPillBar
            tone="amber"
            activeId={driverFilter}
            onSelect={(id) => setDriverFilter(id as DriverFilter)}
            shownCount={visibleRowKeys.length}
            totalCount={activeTotalCount}
            items={[
              { id: 'running', label: `Running (${driverStats.running})` },
              { id: 'boot_system', label: `Boot / System Core (${driverStats.bootSystem})` },
              { id: 'third_party', label: `Third-Party / Store (${driverStats.thirdParty})` },
              { id: 'filesystem', label: `File System (${driverStats.filesystem})` },
              { id: 'all', label: `All Drivers (${systemDrivers.length})` },
            ]}
          />
        )}
      </div>

      {/* SECTION 1: Boot Startup Apps */}
      {section === 'startup' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
                  <th className="py-2.5 px-3">Application &amp; Publisher</th>
                  <th className="py-2.5 px-3">Boot Gate</th>
                  <th className="py-2.5 px-3">Startup Scope</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">Account</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {filteredStartup.map((app, i) => {
                  const key = `st-${i}-${app.name}`;
                  const isOpen = Boolean(expandedKeys[key]);
                  const isEnabled = app.enabled !== false;
                  const shortUser = (app.user || 'Public').split('\\').pop() || app.user || 'Public';
                  return (
                    <React.Fragment key={key}>
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        onClick={() => toggleExpand(key)}
                        onKeyDown={(e) => handleRowKeyDown(e, key)}
                        className={`cursor-pointer transition-colors focus:outline-none focus:bg-cyan-500/[0.08] ${
                          isOpen ? 'bg-cyan-500/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-2 text-center">
                          <span
                            className={`w-6 h-6 inline-flex items-center justify-center rounded-md border text-xs font-mono font-bold ${
                              isOpen ? 'bg-cyan-500/20 border-cyan-400/50 text-cyan-300' : 'bg-[#181820] border-white/[0.1] text-zinc-300'
                            }`}
                          >
                            {isOpen ? '−' : '+'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className={`${isEnabled ? 'text-white' : 'text-zinc-400 line-through decoration-zinc-500'}`}>
                                {app.name}
                              </strong>
                              {app.version && (
                                <span className="px-1.5 py-0.5 rounded bg-white/[0.05] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                                  v{app.version}
                                </span>
                              )}
                              {app.fileExists === false && (
                                <span className="px-1.5 py-0.5 rounded bg-rose-500/15 border border-rose-500/35 text-[10px] font-mono text-rose-300">
                                  Binary Missing
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400">
                              {app.publisher || app.description || (app.executable ? app.executable.split('\\').pop() : 'Boot Launcher')}
                              {app.fileSizeBytes ? ` · ${formatBytes(app.fileSizeBytes)}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              isEnabled
                                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                                : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                            }`}
                          >
                            {isEnabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              app.scopeCategory === 'Startup Folder'
                                ? 'bg-violet-500/15 border-violet-500/35 text-violet-300'
                                : app.scopeCategory === 'Machine Registry'
                                  ? 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                                  : 'bg-cyan-500/15 border-cyan-500/30 text-cyan-300'
                            }`}
                          >
                            {app.locationType}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right font-mono text-zinc-300">{shortUser}</td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0b0b0f]">
                          <td colSpan={5} className="p-4 border-t border-cyan-400/15">
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Publisher &amp; File Signature
                                  </span>
                                  <strong className="text-xs text-white">
                                    {app.publisher || 'Unverified / Script Launcher'}
                                  </strong>
                                  <span className="text-[11px] text-zinc-400">
                                    {app.description || 'User/Vendor Startup Entry'}
                                    {app.version ? ` · Version ${app.version}` : ''}
                                  </span>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Task Manager StartupApproved
                                  </span>
                                  <strong className={`text-xs ${isEnabled ? 'text-emerald-300' : 'text-amber-300'}`}>
                                    {isEnabled ? 'Enabled for Logon Execution' : 'Disabled in Task Manager'}
                                  </strong>
                                  <span className="text-[11px] font-mono text-zinc-400">
                                    {app.disabledAt
                                      ? `Disabled: ${app.disabledAt}`
                                      : app.fileExists
                                        ? `Binary Verified (${app.fileSizeBytes ? formatBytes(app.fileSizeBytes) : 'OK'})`
                                        : 'Target path not found on disk'}
                                  </span>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Registry Key &amp; CLI Flags
                                  </span>
                                  <code className="text-[11px] font-mono text-sky-300 break-all">
                                    {app.arguments || 'No extra CLI arguments'}
                                  </code>
                                  <span className="text-[10px] font-mono text-zinc-400 break-all">{app.location}</span>
                                </div>
                              </div>

                              <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Full Launch Command &amp; Resolved Target
                                  </span>
                                  <code className="text-xs font-mono text-zinc-100 break-all">{app.command}</code>
                                  {app.executable && app.executable !== app.command && (
                                    <span className="text-[11px] font-mono text-cyan-300/90 break-all">
                                      Target Binary: {app.executable}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 shrink-0">
                                  {app.executable && <CopyButton text={app.executable} label="Copy Path" copiedLabel="Copied" />}
                                  <CopyButton text={app.command} label="Copy Command" copiedLabel="Copied" />
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {filteredStartup.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      No startup entries matched your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* SECTION 2: System Services */}
      {section === 'services' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
                  <th className="py-2.5 px-3">Service &amp; Origin</th>
                  <th className="py-2.5 px-3">Start Mode</th>
                  <th className="py-2.5 px-3">Logon Account</th>
                  <th className="py-2.5 px-3">State</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">PID / RAM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {visibleServices.map((svc) => {
                  const key = `svc-${svc.name}`;
                  const isOpen = Boolean(expandedKeys[key]);
                  const isRunning = svc.status.toLowerCase() === 'running';
                  const shortAcct = (svc.account || 'LocalSystem').replace('NT AUTHORITY\\', '');
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
                          <span
                            className={`w-6 h-6 inline-flex items-center justify-center rounded-md border text-xs font-mono font-bold ${
                              isOpen ? 'bg-emerald-500/20 border-emerald-400/50 text-emerald-300' : 'bg-[#181820] border-white/[0.1] text-zinc-300'
                            }`}
                          >
                            {isOpen ? '−' : '+'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-white">{svc.displayName}</strong>
                              {svc.isMicrosoft === false && (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/35 text-[10px] font-mono font-bold text-cyan-300">
                                  3rd-Party
                                </span>
                              )}
                            </div>
                            <span className="text-[11px] font-mono text-zinc-400">
                              <code>{svc.name}</code>
                              {svc.publisher ? ` · ${svc.publisher}` : ''}
                            </span>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              svc.delayedAutoStart
                                ? 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                                : svc.startType === 'Automatic'
                                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-200'
                                  : 'bg-[#181820] border-white/[0.08] text-zinc-300'
                            }`}
                          >
                            {svc.startModeLabel || svc.startType}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-[11px] text-zinc-300">{shortAcct}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold capitalize ${
                              isRunning ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-[#16161c] border-white/[0.1] text-zinc-400'
                            }`}
                          >
                            {svc.status}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right font-mono tabular-nums text-zinc-300">
                          {svc.pid ? (
                            <div className="flex flex-col items-end">
                              <span>{svc.pid}</span>
                              {svc.memoryBytes ? (
                                <span className="text-[10px] text-zinc-400">
                                  {formatBytes(svc.memoryBytes)}
                                  {svc.sharedHostCount && svc.sharedHostCount > 1 ? ` (×${svc.sharedHostCount})` : ''}
                                </span>
                              ) : null}
                            </div>
                          ) : (
                            '—'
                          )}
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0b0b0f]">
                          <td colSpan={6} className="p-4 border-t border-emerald-400/15">
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Description &amp; Publisher
                                  </span>
                                  <strong className="text-xs text-white">{svc.publisher || 'Windows System Service'}</strong>
                                  <p className="text-[11px] text-zinc-400 leading-relaxed">
                                    {svc.description || 'No extended service description registered in SCM.'}
                                  </p>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Security Context &amp; Process
                                  </span>
                                  <strong className="text-xs font-mono text-emerald-300">{svc.account || 'LocalSystem'}</strong>
                                  <span className="text-[11px] font-mono text-zinc-400">
                                    {svc.pid
                                      ? `PID ${svc.pid}${svc.memoryBytes ? ` · Host RSS ${formatBytes(svc.memoryBytes)}` : ''}${
                                          svc.sharedHostCount && svc.sharedHostCount > 1 ? ` (shared across ${svc.sharedHostCount} svchost services)` : ''
                                        }`
                                      : 'Service not currently allocated a host process'}
                                  </span>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1.5">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Dependencies &amp; Load Group
                                  </span>
                                  <div className="flex flex-wrap gap-1">
                                    {(svc.dependencies || []).length > 0 ? (
                                      (svc.dependencies || []).map((dep) => (
                                        <span key={dep} className="px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/[0.1] text-[10px] font-mono text-sky-300">
                                          {dep}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-[11px] font-mono text-zinc-400">No upstream service dependencies</span>
                                    )}
                                  </div>
                                  {svc.serviceGroup && (
                                    <span className="text-[10px] font-mono text-zinc-400">Load Group: {svc.serviceGroup}</span>
                                  )}
                                </div>
                              </div>

                              <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Service Binary Command &amp; Host Arguments
                                  </span>
                                  <code className="text-xs font-mono text-zinc-100 break-all">
                                    {svc.binPath || 'Kernel / Protected System Host'}
                                  </code>
                                </div>
                                {svc.binPath && <CopyButton text={svc.binPath} label="Copy Path" copiedLabel="Copied" className="shrink-0" />}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {visibleServices.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-zinc-400">
                      No system services matched your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!search.trim() && (
            <TableLoadAllFooter
              visibleCount={visibleServices.length}
              totalCount={filteredServices.length}
              noun="services"
              showAll={showAllRows}
              onToggle={() => setShowAllRows((v) => !v)}
              tone="emerald"
            />
          )}
        </section>
      )}

      {/* SECTION 3: Scheduled Tasks */}
      {section === 'tasks' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
                  <th className="py-2.5 px-3">Task Name &amp; Folder</th>
                  <th className="py-2.5 px-3">Triggers</th>
                  <th className="py-2.5 px-3">Origin / Author</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {visibleTasks.map((task, i) => {
                  const key = `tsk-${i}-${task.taskPath}-${task.name}`;
                  const isOpen = Boolean(expandedKeys[key]);
                  return (
                    <React.Fragment key={key}>
                      <tr
                        role="button"
                        tabIndex={0}
                        aria-expanded={isOpen}
                        onClick={() => toggleExpand(key)}
                        onKeyDown={(e) => handleRowKeyDown(e, key)}
                        className={`cursor-pointer transition-colors focus:outline-none focus:bg-violet-500/[0.08] ${
                          isOpen ? 'bg-violet-500/[0.06]' : 'hover:bg-white/[0.03]'
                        }`}
                      >
                        <td className="py-2.5 pl-4 pr-2 text-center">
                          <span
                            className={`w-6 h-6 inline-flex items-center justify-center rounded-md border text-xs font-mono font-bold ${
                              isOpen ? 'bg-violet-500/20 border-violet-400/50 text-violet-300' : 'bg-[#181820] border-white/[0.1] text-zinc-300'
                            }`}
                          >
                            {isOpen ? '−' : '+'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <strong className="text-white">{task.name}</strong>
                            <code className="text-[10px] font-mono text-zinc-400">{task.taskPath}</code>
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-wrap gap-1">
                            {task.triggers.slice(0, 3).map((tr) => (
                              <span
                                key={tr}
                                className={`px-1.5 py-0.5 rounded border text-[10px] font-mono ${
                                  tr === 'Logon' || tr === 'Boot'
                                    ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300 font-bold'
                                    : 'bg-white/[0.05] border-white/[0.08] text-zinc-300'
                                }`}
                              >
                                {tr}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              task.isVendorTask
                                ? 'bg-violet-500/15 border-violet-500/35 text-violet-300'
                                : 'bg-[#181820] border-white/[0.08] text-zinc-300'
                            }`}
                          >
                            {task.author || task.category}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              task.state === 'Running'
                                ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                                : task.enabled
                                  ? 'bg-sky-500/15 border-sky-500/35 text-sky-300'
                                  : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                            }`}
                          >
                            {task.state}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0b0b0f]">
                          <td colSpan={5} className="p-4 border-t border-violet-400/15">
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Task Author &amp; Origin
                                  </span>
                                  <strong className="text-xs text-white">{task.author || task.category}</strong>
                                  <span className="text-[11px] font-mono text-zinc-400">Folder: {task.taskPath}</span>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Configured Triggers
                                  </span>
                                  <strong className="text-xs text-violet-300">{task.triggers.join(' · ')}</strong>
                                  <span className="text-[11px] font-mono text-zinc-400">State: {task.state}</span>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Task Description
                                  </span>
                                  <p className="text-[11px] text-zinc-300 leading-relaxed">
                                    {task.description || 'No description metadata recorded in Windows Task Scheduler.'}
                                  </p>
                                </div>
                              </div>

                              <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Scheduled Action / Handler
                                  </span>
                                  <code className="text-xs font-mono text-zinc-100 break-all">
                                    {task.command || 'COM / Custom Windows Runtime Handler'}
                                  </code>
                                </div>
                                {task.command && <CopyButton text={task.command} label="Copy Action" copiedLabel="Copied" className="shrink-0" />}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {visibleTasks.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      No scheduled tasks matched your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!search.trim() && (
            <TableLoadAllFooter
              visibleCount={visibleTasks.length}
              totalCount={filteredTasks.length}
              noun="scheduled tasks"
              showAll={showAllRows}
              onToggle={() => setShowAllRows((v) => !v)}
              tone="violet"
            />
          )}
        </section>
      )}

      {/* SECTION 4: Kernel & Boot Drivers */}
      {section === 'drivers' && (
        <section className="rounded-2xl system-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/[0.06] bg-[#0e0e12] text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  <th className="py-2.5 pl-4 pr-2 w-10 text-center">+</th>
                  <th className="py-2.5 px-3">Driver &amp; Module</th>
                  <th className="py-2.5 px-3">Driver Type</th>
                  <th className="py-2.5 px-3">Boot Load Stage</th>
                  <th className="py-2.5 pl-3 pr-5 text-right">State</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.05] text-xs">
                {visibleDrivers.map((drv) => {
                  const key = `drv-${drv.name}`;
                  const isOpen = Boolean(expandedKeys[key]);
                  const isRunning = drv.state.toLowerCase() === 'running';
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
                          <span
                            className={`w-6 h-6 inline-flex items-center justify-center rounded-md border text-xs font-mono font-bold ${
                              isOpen ? 'bg-amber-500/20 border-amber-400/50 text-amber-300' : 'bg-[#181820] border-white/[0.1] text-zinc-300'
                            }`}
                          >
                            {isOpen ? '−' : '+'}
                          </span>
                        </td>
                        <td className="py-2.5 px-3">
                          <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2 flex-wrap">
                              <strong className="text-white">{drv.displayName}</strong>
                              {drv.isThirdParty && (
                                <span className="px-1.5 py-0.5 rounded bg-cyan-500/15 border border-cyan-500/35 text-[10px] font-mono font-bold text-cyan-300">
                                  3rd-Party / Store
                                </span>
                              )}
                            </div>
                            <code className="text-[10px] font-mono text-zinc-400">{drv.name}.sys</code>
                          </div>
                        </td>
                        <td className="py-2.5 px-3 font-mono text-zinc-300">{drv.serviceType}</td>
                        <td className="py-2.5 px-3">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              drv.startMode === 'Boot'
                                ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                                : drv.startMode === 'System'
                                  ? 'bg-violet-500/15 border-violet-500/35 text-violet-300'
                                  : drv.startMode === 'Auto'
                                    ? 'bg-cyan-500/15 border-cyan-500/35 text-cyan-300'
                                    : 'bg-[#181820] border-white/[0.08] text-zinc-300'
                            }`}
                          >
                            {drv.startMode}
                          </span>
                        </td>
                        <td className="py-2.5 pl-3 pr-5 text-right">
                          <span
                            className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                              isRunning ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-[#16161c] border-white/[0.1] text-zinc-400'
                            }`}
                          >
                            {drv.state}
                          </span>
                        </td>
                      </tr>
                      {isOpen && (
                        <tr className="bg-[#0b0b0f]">
                          <td colSpan={5} className="p-4 border-t border-amber-400/15">
                            <div className="flex flex-col gap-3">
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Load Stage Semantics
                                  </span>
                                  <strong className="text-xs text-amber-300">{drv.startMode} Start Stage</strong>
                                  <span className="text-[11px] text-zinc-400">{driverStageDescription(drv.startMode)}</span>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Driver Architecture
                                  </span>
                                  <strong className="text-xs text-white">{drv.serviceType}</strong>
                                  <span className="text-[11px] font-mono text-zinc-400">
                                    {drv.isThirdParty ? 'DriverStore / Vendor Hardware Driver' : 'Microsoft Windows Core Kernel Driver'}
                                  </span>
                                </div>

                                <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col gap-1">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Runtime Status
                                  </span>
                                  <strong className={`text-xs ${isRunning ? 'text-emerald-300' : 'text-zinc-300'}`}>
                                    {drv.state}
                                  </strong>
                                  <span className="text-[11px] font-mono text-zinc-400">Module ID: {drv.name}</span>
                                </div>
                              </div>

                              <div className="neu-tile p-3 rounded-xl bg-[#14141a] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                <div className="flex flex-col gap-0.5 min-w-0">
                                  <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                                    Kernel Driver SYS Path
                                  </span>
                                  <code className="text-xs font-mono text-zinc-100 break-all">
                                    {drv.pathName || 'Core Memory / Firmware Mapped'}
                                  </code>
                                </div>
                                {drv.pathName && <CopyButton text={drv.pathName} label="Copy Path" copiedLabel="Copied" className="shrink-0" />}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
                {visibleDrivers.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-xs text-zinc-400">
                      No kernel drivers matched your current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!search.trim() && (
            <TableLoadAllFooter
              visibleCount={visibleDrivers.length}
              totalCount={filteredDrivers.length}
              noun="kernel drivers"
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
