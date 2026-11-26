import React, { useMemo, useState } from 'react';
import { SystemSpecs } from '../../../types';
import { formatBytes } from '../systemConstants';
import HardwareDetailsTable, { HardwareDetailTableRow } from './HardwareDetailsTable';
import TelemetryTileGrid from './TelemetryTileGrid';

export interface PeripheralsDisplaysTabProps {
  specs: SystemSpecs;
}

export default function PeripheralsDisplaysTab({ specs }: PeripheralsDisplaysTabProps) {
  const { displays, graphics, peripherals } = specs;
  const keyboards = peripherals.keyboards || [];
  const pointing = peripherals.pointingDevices || [];
  const usbDevices = peripherals.usbDevices || [];
  const [searchQuery, setSearchQuery] = useState('');

  const btHostAdapter = peripherals.bluetooth.find(
    (b) => b.name.toLowerCase().includes('adapter') || b.name.toLowerCase().includes('radio')
  );
  const btPaired = peripherals.bluetooth.filter((b) => b !== btHostAdapter);

  const rows: HardwareDetailTableRow[] = useMemo(() => {
    const allRows: HardwareDetailTableRow[] = [
      {
        id: 'audio-endpoints',
        name: 'Audio Controllers & Endpoints',
        summary: peripherals.audio.map((a) => a.name).join(' · ') || 'No audio devices reported',
        statusLabel: `${peripherals.audio.length} Ready`,
        statusTone: peripherals.audio.length > 0 ? 'emerald' : 'zinc',
        primaryMetric: `${peripherals.audio.length} Device(s)`,
        accent: 'sky',
        details:
          peripherals.audio.length > 0
            ? peripherals.audio.map((a, i) => ({
                label: `Audio Endpoint ${i + 1}`,
                value: `${a.name} (${a.manufacturer})`,
                code: a.status,
              }))
            : [{ label: 'Audio Status', value: 'No dedicated sound devices detected' }],
      },
      {
        id: 'bluetooth-paired',
        name: 'Bluetooth Adapter & Paired Devices',
        summary: peripherals.bluetooth.map((b) => b.name).join(', ') || 'No Bluetooth devices detected',
        hardwareCode: btHostAdapter ? btHostAdapter.name : null,
        statusLabel: `${btPaired.length} Paired`,
        statusTone: peripherals.bluetooth.length > 0 ? 'sky' : 'zinc',
        primaryMetric: `${peripherals.bluetooth.length} Total`,
        accent: 'purple',
        details:
          peripherals.bluetooth.length > 0
            ? peripherals.bluetooth.map((b, i) => ({
                label: b === btHostAdapter ? 'Host Bluetooth Radio' : `Paired Device ${i + 1}`,
                value: b.name,
                code: `${b.manufacturer} · ${b.status || 'OK'}`,
                tone: b === btHostAdapter ? ('emerald' as const) : ('default' as const),
              }))
            : [{ label: 'Bluetooth Status', value: 'No Bluetooth peripherals paired' }],
      },
      ...(usbDevices.length > 0
        ? [
            {
              id: 'usb-endpoints',
              name: 'Attached USB Hardware Endpoints',
              summary: `${usbDevices.length} Enumerated USB Peripherals & Composite Bridges`,
              hardwareCode: 'VID / PID Enumerated',
              statusLabel: 'Active Bus',
              statusTone: 'sky' as const,
              primaryMetric: `${usbDevices.length} Endpoints`,
              accent: 'purple' as const,
              details: usbDevices.map((u, i) => ({
                label: `USB ${u.class || 'Device'} #${i + 1}`,
                value: `${u.name} (${u.vendor || u.manufacturer})`,
                code: u.code || u.status,
                copyValue: `${u.name} (${u.code || u.manufacturer})`,
              })),
            },
          ]
        : []),
      {
        id: 'cameras-biometrics',
        name: 'Cameras & Biometric Sensors',
        summary: [...peripherals.cameras, ...peripherals.biometrics].map((c) => c.name).join(', ') || 'None detected',
        statusLabel: peripherals.cameras.length > 0 ? 'Active' : 'Optional',
        statusTone: peripherals.cameras.length > 0 ? 'emerald' : 'zinc',
        primaryMetric: `${peripherals.cameras.length + peripherals.biometrics.length} Sensor(s)`,
        accent: 'emerald',
        details:
          peripherals.cameras.length + peripherals.biometrics.length > 0
            ? [
                ...peripherals.cameras.map((c, i) => ({
                  label: `Camera ${i + 1}`,
                  value: c.name,
                  code: `${c.manufacturer} · ${c.status || 'OK'}`,
                })),
                ...peripherals.biometrics.map((b, i) => ({
                  label: `Biometric Sensor ${i + 1}`,
                  value: b.name,
                  code: `${b.manufacturer} · ${b.status || 'OK'}`,
                })),
              ]
            : [{ label: 'Sensor Status', value: 'No dedicated optical or biometric sensors reported' }],
      },
      {
        id: 'usb-controllers',
        name: 'USB Host Controllers (xHCI)',
        summary: peripherals.usbControllers.map((u) => u.name).join(' · ') || 'System USB Bus',
        statusLabel: 'Online',
        statusTone: 'emerald',
        primaryMetric: `${peripherals.usbControllers.length} Controller(s)`,
        accent: 'amber',
        details: peripherals.usbControllers.map((u, i) => ({
          label: `USB Controller ${i + 1}`,
          value: u.name,
          code: u.vendor || u.manufacturer,
        })),
      },
      {
        id: 'input-devices',
        name: 'Keyboards & Pointing Devices',
        summary: `${keyboards.length} Keyboard(s) · ${pointing.length} Pointing Device(s)`,
        statusLabel: 'HID Ready',
        statusTone: 'sky',
        primaryMetric: `${keyboards.length + pointing.length} Input(s)`,
        accent: 'zinc',
        details: [
          ...keyboards.map((k, i) => ({
            label: `Keyboard ${i + 1}`,
            value: k.name,
            code: k.status || 'OK',
          })),
          ...pointing.map((p, i) => ({
            label: `Pointing Device ${i + 1}`,
            value: `${p.name} (${p.manufacturer})`,
            code: p.status || 'OK',
          })),
        ],
      },
    ];

    const q = searchQuery.trim().toLowerCase();
    if (!q) return allRows;
    return allRows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        (r.hardwareCode || '').toLowerCase().includes(q) ||
        r.details.some((d) => d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q))
    );
  }, [peripherals, keyboards, pointing, usbDevices, btHostAdapter, btPaired.length, searchQuery]);

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* ── Quick Peripherals Summary KPI Bento Strip ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Audio Chipsets</span>
            <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300">
              {peripherals.audio.length} Ready
            </span>
          </div>
          <strong className="text-sm font-bold text-white truncate">
            {peripherals.audio[0]?.name || 'Host Audio'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {peripherals.audio.slice(1).map((a) => a.name).join(' · ') || 'Audio Subsystem Active'}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">USB Endpoints</span>
            <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
              {usbDevices.length || peripherals.usbControllers.length} Devices
            </span>
          </div>
          <strong className="text-sm font-bold text-white truncate">
            {peripherals.usbControllers[0]?.name || 'xHCI USB Controller'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {usbDevices.filter((u) => u.class !== 'USB').slice(0, 2).map((u) => u.name).join(' · ') || 'Enumerated USB Root'}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Bluetooth Wireless</span>
            <span className="px-2 py-0.5 rounded bg-purple-500/15 border border-purple-500/35 text-[10px] font-mono font-bold text-purple-300">
              {btPaired.length} Paired
            </span>
          </div>
          <strong className="text-sm font-bold text-white truncate">
            {btHostAdapter?.name || 'Bluetooth Radio'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {btPaired.map((b) => b.name).join(', ') || 'No paired accessories'}
          </span>
        </div>

        <div className="p-4 rounded-2xl system-kpi-card flex flex-col gap-1.5">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Cameras &amp; HID Inputs</span>
            <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono font-bold text-amber-300">
              {keyboards.length + pointing.length} Inputs
            </span>
          </div>
          <strong className="text-sm font-bold text-white truncate">
            {peripherals.cameras[0]?.name || 'HID Workstation Inputs'}
          </strong>
          <span className="text-[11px] font-mono text-zinc-400 truncate">
            {keyboards.length} Keyboards · {pointing.length} Pointing Devices
          </span>
        </div>
      </div>

      {/* ── Connected Devices & Display Matrix ── */}
      <TelemetryTileGrid
        title={`Displays & Peripherals Matrix (${displays.length} Display · ${graphics.length} GPU)`}
        rightLabel={displays[0]?.nativeWidth ? `${displays[0].nativeWidth}×${displays[0].nativeHeight}` : 'Active'}
        rightToneClass="text-sky-300"
        columnsClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-6"
        items={[
          {
            id: 'per-disp',
            label: 'Displays',
            badge: `${displays[0]?.refreshRateHz || 60}Hz`,
            badgeTone: 'sky',
            valueText: `${displays.length}`,
            percent: Math.min(100, ((displays[0]?.refreshRateHz || 60) / 144) * 100),
            tooltip: displays.map((d) => `${d.name}: ${d.nativeWidth}×${d.nativeHeight}`).join(' · '),
          },
          {
            id: 'per-audio',
            label: 'Audio',
            badge: 'IO',
            badgeTone: 'emerald',
            valueText: `${peripherals.audio.length}`,
            percent: Math.min(100, peripherals.audio.length * 20),
            tooltip: peripherals.audio.map((a) => a.name).join(' · ') || 'No audio devices',
          },
          {
            id: 'per-usb',
            label: 'USB',
            badge: 'xHCI',
            badgeTone: 'purple',
            valueText: `${usbDevices.length || peripherals.usbControllers.length}`,
            percent: Math.min(100, ((usbDevices.length || peripherals.usbControllers.length) / 20) * 100),
            tooltip: `${usbDevices.length} USB Devices · ${peripherals.usbControllers.length} Controllers`,
          },
          {
            id: 'per-bt',
            label: 'Bluetooth',
            badge: `${btPaired.length} Pair`,
            badgeTone: 'sky',
            valueText: `${peripherals.bluetooth.length}`,
            percent: Math.min(100, peripherals.bluetooth.length * 20),
            muted: peripherals.bluetooth.length === 0,
            tooltip: peripherals.bluetooth.map((b) => b.name).join(' · ') || 'No Bluetooth devices',
          },
          {
            id: 'per-kbd',
            label: 'Keyboards',
            badge: 'HID',
            badgeTone: 'amber',
            valueText: `${keyboards.length}`,
            percent: Math.min(100, keyboards.length * 25),
            tooltip: keyboards.map((k) => k.name).join(' · ') || 'HID Keyboard',
          },
          {
            id: 'per-ptr',
            label: 'Pointing',
            badge: 'HID',
            badgeTone: 'emerald',
            valueText: `${pointing.length}`,
            percent: Math.min(100, pointing.length * 25),
            tooltip: pointing.map((p) => p.name).join(' · ') || 'HID Pointing Device',
          },
        ]}
      />

      {/* ── Display Panels & Graphics Output Geometry (Full-Width when Single Display) ── */}
      <section className="p-5 rounded-2xl system-card flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-sky-500/12 border border-sky-400/25 flex items-center justify-center text-sky-400 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="20" height="14" rx="2" />
                <line x1="8" y1="21" x2="16" y2="21" />
                <line x1="12" y1="17" x2="12" y2="21" />
              </svg>
            </span>
            <div>
              <h2 className="text-sm font-bold text-white">Connected Display Panels &amp; Geometry</h2>
              <p className="text-[11px] text-zinc-400">
                EDID panel identification, physical dimensions, DPI scaling &amp; graphics output pipelines
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
            {displays.length} Display{displays.length === 1 ? '' : 's'} · {graphics.length} GPU Adapter{graphics.length === 1 ? '' : 's'}
          </span>
        </div>

        <div className={`grid gap-4 ${displays.length === 1 ? 'grid-cols-1' : 'grid-cols-1 md:grid-cols-2'}`}>
          {displays.map((disp) => (
            <div
              key={disp.deviceName}
              className="neu-tile p-4 rounded-xl bg-[#16161c] border border-white/[0.08] flex flex-col lg:flex-row items-center gap-5"
            >
              {/* Stylized Physical Screen & Stand Visual */}
              <div className="flex flex-col items-center shrink-0">
                <div className="neu-inset w-44 aspect-video rounded-xl border-2 border-sky-400/55 bg-gradient-to-br from-sky-500/18 via-[#09090d] to-purple-500/18 flex flex-col items-center justify-center p-2 text-center sys-screen-bezel">
                  <span className="text-sm font-mono font-extrabold text-white">
                    {disp.nativeWidth}×{disp.nativeHeight}
                  </span>
                  <span className="text-[10.5px] font-mono text-sky-300">
                    {disp.aspectRatio || 'Screen'} · {disp.refreshRateHz || 60} Hz
                  </span>
                </div>
                <div className="w-5 h-2 bg-zinc-700/70" />
                <div className="w-16 h-1 rounded-full bg-zinc-700/80" />
              </div>

              <div className="flex flex-col gap-3 min-w-0 w-full">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2 min-w-0">
                    <strong className="text-sm sm:text-base font-bold text-white truncate">{disp.name}</strong>
                    {disp.primary && (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300">
                        Primary Output
                      </span>
                    )}
                  </div>
                  <code className="text-[10px] font-mono text-zinc-400">{disp.deviceName}</code>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-[11px] font-mono tabular-nums">
                  <div className="neu-inset p-2.5 rounded-lg bg-[#0d0d12] border border-white/[0.06]">
                    <span className="block text-[9.5px] text-zinc-400">Native Matrix</span>
                    <strong className="text-white">{disp.nativeWidth}×{disp.nativeHeight}</strong>
                  </div>
                  <div className="neu-inset p-2.5 rounded-lg bg-[#0d0d12] border border-white/[0.06]">
                    <span className="block text-[9.5px] text-zinc-400">Scaled Desktop</span>
                    <strong className="text-zinc-200">{disp.logicalWidth}×{disp.logicalHeight}</strong>
                  </div>
                  <div className="neu-inset p-2.5 rounded-lg bg-[#0d0d12] border border-white/[0.06]">
                    <span className="block text-[9.5px] text-zinc-400">DPI Scale</span>
                    <strong className="text-sky-300">{disp.scalePercent ?? 100}%</strong>
                  </div>
                  <div className="neu-inset p-2.5 rounded-lg bg-[#0d0d12] border border-white/[0.06]">
                    <span className="block text-[9.5px] text-zinc-400">Panel Diagonal</span>
                    <strong className="text-white">{disp.diagonalInches ? `${disp.diagonalInches}" (~${disp.ppi} PPI)` : 'External'}</strong>
                  </div>
                  <div className="neu-inset p-2.5 rounded-lg bg-[#0d0d12] border border-white/[0.06]">
                    <span className="block text-[9.5px] text-zinc-400">EDID Panel ID</span>
                    <strong className="text-purple-300 truncate block">
                      {disp.panelModel ? `${disp.panelManufacturer || ''} ${disp.panelModel}`.trim() : 'Generic EDID'}
                    </strong>
                  </div>
                  <div className="neu-inset p-2.5 rounded-lg bg-[#0d0d12] border border-white/[0.06]">
                    <span className="block text-[9.5px] text-zinc-400">Color &amp; Year</span>
                    <strong className="text-emerald-300">
                      {disp.bitsPerPixel ?? 32}-bit{disp.manufactureYear ? ` · ${disp.manufactureYear}` : ''}
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Graphics Adapter Output Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
          {graphics.map((gpu, idx) => (
            <div
              key={idx}
              className="neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-xs"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/30 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                  {gpu.role}
                </span>
                <div className="min-w-0">
                  <strong className="text-white block truncate">{gpu.name}</strong>
                  <span className="text-[10.5px] font-mono text-zinc-400 block truncate">
                    Driver {gpu.driverVersion}
                    {gpu.driverDate ? ` (${gpu.driverDate})` : ''} · {gpu.dacType} DAC
                  </span>
                </div>
              </div>
              <div className="flex flex-col items-end font-mono text-[10.5px] shrink-0">
                <span className="text-sky-300 font-bold">
                  {gpu.vramBytes > 0 && gpu.vramMode === 'Dedicated VRAM' ? formatBytes(gpu.vramBytes, 1) : gpu.vramMode}
                </span>
                {gpu.vendorCode && (
                  <code className="text-[10px] text-zinc-500">
                    {gpu.vendorCode}:{gpu.deviceCode || ''}
                  </code>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Filter Input */}
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
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter audio endpoints, USB VID/PID IDs, Bluetooth accessories, cameras, or HID inputs..."
            className="w-full pl-9 pr-8 py-2 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400/50"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              aria-label="Clear filter"
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white text-xs font-bold cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
        <span className="text-[11px] font-mono text-zinc-400 shrink-0 hidden sm:inline">
          {rows.length} Categor{rows.length === 1 ? 'y' : 'ies'}
        </span>
      </div>

      {/* Expandable Hardware Peripherals Matrix */}
      <HardwareDetailsTable
        title="Connected Peripherals, Audio, USB & Bluetooth"
        subtitle="Click + on any device category to inspect individual endpoints, VID/PID codes, controllers, and hardware status."
        rows={rows}
        defaultExpandedIds={['audio-endpoints', 'usb-endpoints']}
        onClearFilter={() => setSearchQuery('')}
      />
    </div>
  );
}
