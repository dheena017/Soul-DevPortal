import React, { useMemo, useState } from 'react';
import CopyButton from '../../../components/CopyButton';
import { HistoryWindowSec, SystemLiveSnapshot, SystemSpecs } from '../../../types';
import { formatBytes, formatUptime } from '../systemConstants';
import RadialGauge from './RadialGauge';
import TelemetrySparkline from './TelemetrySparkline';

export interface PowerHealthTabProps {
  specs: SystemSpecs;
  live: SystemLiveSnapshot;
  historyWindowSec?: HistoryWindowSec;
}

export default function PowerHealthTab({ specs, live, historyWindowSec = 60 }: PowerHealthTabProps) {
  const { host, motherboard, battery: batStatic } = specs;
  const batLive = live.battery;
  const posture = live.healthPosture;
  const systemEvents = specs.systemEvents || [];
  const caps = specs.sensorCapabilities;
  const [eventFilter, setEventFilter] = useState<'all' | 'error' | 'warning'>('all');
  const winLabel = historyWindowSec >= 900 ? '15-Minute' : historyWindowSec >= 300 ? '5-Minute' : '60-Second';

  const filteredEvents = useMemo(() => {
    return systemEvents.filter((ev) => {
      if (eventFilter === 'error') return /error|critical/i.test(ev.level);
      if (eventFilter === 'warning') return /warning/i.test(ev.level);
      return true;
    });
  }, [systemEvents, eventFilter]);

  const postureStyle =
    posture.severity === 'critical'
      ? 'border-rose-500/40 bg-rose-500/[0.06] text-rose-300'
      : posture.severity === 'warn'
        ? 'border-amber-500/40 bg-amber-500/[0.06] text-amber-300'
        : 'border-emerald-500/35 bg-emerald-500/[0.05] text-emerald-300';

  const remainingMin = batLive?.secsLeft ? Math.round(batLive.secsLeft / 60) : null;

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* Live Bottleneck & System Posture Diagnostics */}
      <section className={`p-5 rounded-2xl border flex flex-col gap-4 ${postureStyle}`}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-mono uppercase tracking-wider opacity-80">Live Diagnostic Posture</span>
            <h2 className="text-lg font-extrabold text-white">{posture.label}</h2>
          </div>
          <span className="px-3 py-1 rounded-lg bg-[#0d0d11] border border-white/[0.1] text-xs font-mono tabular-nums text-zinc-200">
            System Uptime: {formatUptime(live.uptimeSeconds)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          {posture.reasons.map((r, i) => (
            <span
              key={i}
              className="px-3 py-1.5 rounded-xl bg-[#0d0d11]/85 border border-white/[0.08] text-xs text-zinc-200"
            >
              {r}
            </span>
          ))}
        </div>
      </section>

      {/* 4-Card Power & Security Summary KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Battery Health</span>
          <strong className="text-xl font-extrabold font-mono tabular-nums text-emerald-300">
            {batStatic?.healthPercent !== null && batStatic?.healthPercent !== undefined
              ? `${batStatic.healthPercent}%`
              : batLive
                ? `${Math.round(batLive.percent)}%`
                : 'AC Mains'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {batStatic?.fullChargeCapacityWh
              ? `${batStatic.fullChargeCapacityWh} / ${batStatic.designCapacityWh ?? batStatic.fullChargeCapacityWh} Wh (${batStatic.wearPercent ?? 0}% Wear)`
              : host.powerPlan}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Live Charge &amp; Cycles</span>
          <strong className="text-xl font-extrabold font-mono tabular-nums text-sky-300">
            {batLive ? `${Math.round(batLive.percent)}%` : 'Plugged'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {batStatic?.cycleCount !== null && batStatic?.cycleCount !== undefined ? `${batStatic.cycleCount} Cycles` : 'Health Ready'}
            {batLive ? ` · ${batLive.powerPlugged ? 'AC Connected' : 'Discharging'}` : ''}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Platform Security</span>
          <strong className={`text-xl font-extrabold font-mono ${host.defenderRealTime ? 'text-emerald-300' : 'text-amber-300'}`}>
            {motherboard.tpm ? 'TPM 2.0 Ready' : host.defenderRealTime ? 'Defender On' : 'Check Posture'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            Secure Boot: {host.secureBoot} · Defender: {host.defenderRealTime ? 'Active' : 'Off'}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1">
          <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Power Profile &amp; Sleep</span>
          <strong className="text-xl font-extrabold font-mono text-amber-300 truncate">{host.powerPlan}</strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {host.sleepStates?.[0] || 'Standard Sleep'}
          </span>
        </div>
      </div>

      {/* Battery Health + Security & 60s Live Load Graph */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* Battery Health Card (tight vertical rhythm — no hollow voids) */}
        <section className="lg:col-span-5 p-5 rounded-2xl system-card flex flex-col gap-4">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <span className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="3" y="7" width="16" height="10" rx="2" />
                  <line x1="22" y1="10" x2="22" y2="14" />
                </svg>
              </span>
              <div className="min-w-0">
                <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Power Supply &amp; Battery Health</span>
                <h3 className="text-base font-bold text-white truncate">
                  {batStatic?.name || (batLive ? 'System Battery' : 'AC Desktop Power')}
                </h3>
              </div>
            </div>
            {batStatic?.location && (
              <span className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-zinc-300 shrink-0">
                {batStatic.location}
              </span>
            )}
          </div>

          {batLive ? (
            <>
              <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-center gap-4">
                <div className="shrink-0 w-full sm:w-52 lg:w-full xl:w-48">
                  <RadialGauge
                    title="Battery"
                    value={batLive.percent}
                    centerCaption="CHARGE"
                    statusText={batLive.powerPlugged ? 'AC Plugged' : 'Discharging'}
                    subtitle={batLive.powerPlugged ? 'AC Connected' : 'On Battery'}
                    detailLine={remainingMin ? `${remainingMin} min left` : batLive.statusLabel}
                    accent={batLive.percent <= 20 ? 'rose' : 'emerald'}
                  />
                </div>

                <div className="flex-1 w-full p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2.5 text-xs font-mono tabular-nums self-stretch justify-center">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[10px] text-zinc-400">Wear &amp; Capacity</span>
                    {batStatic?.healthPercent !== null && batStatic?.healthPercent !== undefined && (
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          batStatic.healthPercent >= 80
                            ? 'bg-emerald-500/15 text-emerald-300'
                            : batStatic.healthPercent >= 60
                              ? 'bg-amber-500/15 text-amber-300'
                              : 'bg-rose-500/15 text-rose-300'
                        }`}
                      >
                        {batStatic.healthPercent}% Health
                      </span>
                    )}
                  </div>
                  <div>
                    <strong className="text-sm text-emerald-300 block">
                      {batStatic?.fullChargeCapacityWh ? `${batStatic.fullChargeCapacityWh} Wh` : 'Ready'}
                      {batStatic?.designCapacityWh ? (
                        <span className="text-xs text-zinc-400 font-normal"> / {batStatic.designCapacityWh} Wh Design</span>
                      ) : null}
                    </strong>
                    {batStatic?.wearPercent !== null && batStatic?.wearPercent !== undefined && (
                      <span className="text-[10px] text-zinc-400">
                        Capacity Wear Lost: {batStatic.wearPercent}%
                      </span>
                    )}
                  </div>
                  {batStatic?.healthPercent !== null && batStatic?.healthPercent !== undefined && (
                    <div className="w-full h-2 rounded-full bg-[#0a0a0e] border border-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full sys-bar-shimmer transition-all duration-500 ${
                          batStatic.healthPercent >= 80 ? 'bg-emerald-400' : batStatic.healthPercent >= 60 ? 'bg-amber-400' : 'bg-rose-500'
                        }`}
                        style={{ width: `${Math.min(100, batStatic.healthPercent)}%` }}
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs font-mono tabular-nums mt-auto">
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Charge Cycles</span>
                  <strong className="text-white">
                    {batStatic?.cycleCount !== null && batStatic?.cycleCount !== undefined ? `${batStatic.cycleCount} Cycles` : 'N/A'}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Design Voltage</span>
                  <strong className="text-sky-300">{batStatic?.designVoltageV ? `${batStatic.designVoltageV} V` : 'Nominal'}</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Manufactured</span>
                  <strong className="text-white">{batStatic?.manufactureDate || 'OEM Sealed'}</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Battery Chemistry</span>
                  <strong className="text-zinc-200 truncate block">{batStatic?.chemistry || 'Li-Ion Pack'}</strong>
                </div>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">BIOS / EC Control</span>
                  <strong className="text-amber-300 truncate block">
                    {motherboard.biosVersion}{motherboard.ecVersion ? ` · EC ${motherboard.ecVersion}` : ''}
                  </strong>
                </div>
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Charging Mode</span>
                  <strong className="text-emerald-300 truncate block">{batLive.powerPlugged ? 'AC Connected' : 'Discharging'}</strong>
                </div>
              </div>
            </>
          ) : (
            <div className="p-4 rounded-xl bg-[#16161c] border border-white/[0.06] text-xs text-zinc-300">
              No internal battery detected. Running on continuous AC power under plan <strong className="text-amber-300">{host.powerPlan}</strong>.
            </div>
          )}
        </section>

        {/* Security & 60s Live Telemetry Trend */}
        <section className="lg:col-span-7 p-5 rounded-2xl system-card flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-lg bg-sky-500/12 border border-sky-400/25 flex items-center justify-center text-sky-400 shrink-0">
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                </svg>
              </span>
              <div>
                <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">
                  Platform Security &amp; {winLabel} Benchmarks
                </span>
                <h3 className="text-base font-bold text-white">Firmware Trust &amp; System Load Trend</h3>
              </div>
            </div>
            <span className="text-[11px] font-mono text-sky-300">CPU vs Memory Load</span>
          </div>

          <div className="p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06]">
            <TelemetrySparkline
              data={live.history}
              fixedMax={100}
              height={155}
              series={[
                { key: 'cpuPercent', label: 'CPU', color: '#38bdf8', unit: '%', decimals: 1 },
                { key: 'ramPercent', label: 'RAM', color: '#a855f7', unit: '%', decimals: 1 },
              ]}
            />
          </div>

          <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 text-xs">
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">UEFI Secure Boot</span>
              <strong className={host.secureBoot === 'Enabled' ? 'text-emerald-300' : 'text-zinc-200'}>
                {host.secureBoot}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">TPM 2.0 Silicon</span>
              <strong className={motherboard.tpm ? 'text-emerald-300' : 'text-zinc-400'}>
                {motherboard.tpm ? `Active (${motherboard.tpm.status})` : 'Not Reported'}
              </strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">Defender Engine</span>
              <strong className={host.defenderRealTime ? 'text-emerald-300' : 'text-amber-300'}>
                {host.defenderRealTime === true ? 'Active' : host.defenderRealTime === false ? 'Off' : 'Not Reported'}
              </strong>
              {host.defenderSignatureVersion && (
                <span className="block text-[10px] font-mono text-zinc-400 truncate mt-0.5">
                  v{host.defenderSignatureVersion} · {host.defenderSignatureAgeDays ?? 0}d
                </span>
              )}
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">HW Virtualization</span>
              <strong className={specs.cpu.virtualizationEnabled ? 'text-emerald-300' : 'text-amber-300'}>
                {specs.cpu.hypervisorPresent
                  ? 'VT-x / Hyper-V'
                  : specs.cpu.virtualizationEnabled
                    ? 'VT-x / AMD-V'
                    : 'Disabled'}
              </strong>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs font-mono tabular-nums">
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">CPU Peak / Avg</span>
              <strong className="text-sky-300">{live.peaks.cpuPeakPercent}% / {live.peaks.cpuAvgPercent}%</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">RAM 60s Peak</span>
              <strong className="text-purple-300">{live.peaks.ramPeakPercent}%</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Disk Peak R / W</span>
              <strong className="text-emerald-300">{live.peaks.diskReadPeakMBps} / {live.peaks.diskWritePeakMBps} MB/s</strong>
            </div>
            <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] text-zinc-400">Session Disk Read</span>
              <strong className="text-amber-300">{formatBytes(live.disk.totalReadBytes, 1)}</strong>
            </div>
          </div>

          {(host.sleepStates?.length || host.pagefile) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs font-mono mt-auto">
              {host.sleepStates && host.sleepStates.length > 0 && (
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Supported Sleep States</span>
                  <strong className="text-zinc-200 text-[11px]">{host.sleepStates.join(' · ')}</strong>
                </div>
              )}
              {host.pagefile && (
                <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
                  <span className="block text-[10px] text-zinc-400">Pagefile ({host.pagefile.path})</span>
                  <strong className="text-purple-300 text-[11px]">
                    {host.pagefile.currentMB} / {host.pagefile.allocatedMB} MB (Peak {host.pagefile.peakMB} MB)
                  </strong>
                </div>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Hardware Sensor Probe Capabilities + Windows System Event Log Feed */}
      <section className="p-5 rounded-2xl system-card flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex flex-col gap-0.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">
              Windows System Event Log (Last 7 Days · Errors &amp; Warnings)
            </span>
            <h3 className="text-sm font-bold text-white">Kernel, Hardware &amp; Driver Diagnostics Feed</h3>
          </div>

          <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
            {caps && (
              <>
                <span className={`px-2 py-0.5 rounded border ${caps.nvmeSmartAvailable ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-[#16161c] border-white/[0.08] text-zinc-400'}`}>
                  NVMe SMART: {caps.nvmeSmartAvailable ? 'Active' : 'Requires Admin'}
                </span>
                <span className={`px-2 py-0.5 rounded border ${caps.thermalAvailable ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300' : 'bg-[#16161c] border-white/[0.08] text-zinc-400'}`}>
                  ACPI Thermal: {caps.thermalAvailable ? 'Active' : 'Requires Admin'}
                </span>
              </>
            )}
            {(['all', 'error', 'warning'] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setEventFilter(f)}
                className={`px-2.5 py-1 rounded-lg border cursor-pointer capitalize ${
                  eventFilter === f
                    ? 'bg-sky-500/15 border-sky-500/40 text-sky-200 font-bold'
                    : 'bg-[#16161c] border-white/[0.06] text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {f} ({f === 'all' ? systemEvents.length : systemEvents.filter((e) => (f === 'error' ? /error|critical/i.test(e.level) : /warning/i.test(e.level))).length})
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-2 max-h-80 overflow-y-auto pr-1">
          {filteredEvents.slice(0, 15).map((ev, idx) => (
            <div
              key={`${ev.id}-${ev.timestamp}-${idx}`}
              className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col sm:flex-row sm:items-start justify-between gap-2 text-xs"
            >
              <div className="flex flex-col gap-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 font-mono text-[10px]">
                  <span
                    className={`px-1.5 py-0.5 rounded border font-bold ${
                      /critical|error/i.test(ev.level)
                        ? 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                        : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                    }`}
                  >
                    {ev.level}
                  </span>
                  <strong className="text-white text-xs">{ev.provider}</strong>
                  <span className="text-zinc-400">Event #{ev.id}</span>
                  <span className="text-zinc-500">{ev.timestamp}</span>
                </div>
                <p className="text-zinc-300 text-[11px] leading-relaxed break-words">{ev.message}</p>
              </div>
              <CopyButton text={`[${ev.level}] ${ev.provider} #${ev.id} (${ev.timestamp}): ${ev.message}`} variant="icon-only" className="shrink-0" />
            </div>
          ))}
          {filteredEvents.length === 0 && (
            <div className="p-6 text-center text-xs font-mono text-emerald-300 bg-[#16161c] rounded-xl border border-emerald-500/20">
              No matching Critical, Error, or Warning hardware/kernel events logged in the last 7 days.
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
