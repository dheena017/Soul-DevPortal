import React, { useMemo, useRef, useState } from 'react';
import CopyButton from '../../../components/CopyButton';
import { SystemLiveSnapshot, SystemSpecs } from '../../../types';
import { formatBytes, formatCacheSize, formatClock, formatUptime, maskSerialValue, SystemSubTabId } from '../systemConstants';
import HardwareDetailsTable, { HardwareDetailTableRow } from './HardwareDetailsTable';
import TelemetryTileGrid from './TelemetryTileGrid';

export interface HardwareSpecsTabProps {
  specs: SystemSpecs;
  live: SystemLiveSnapshot;
  onSelectTab?: (tab: SystemSubTabId) => void;
}

export default function HardwareSpecsTab({ specs, live, onSelectTab }: HardwareSpecsTabProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [revealSerials, setRevealSerials] = useState(false);
  const [showHardwareCodes, setShowHardwareCodes] = useState(true);
  const tableAnchorRef = useRef<HTMLDivElement | null>(null);

  const {
    host,
    motherboard,
    cpu,
    memory,
    graphics,
    displays,
    physicalDisks,
    battery,
    peripherals,
    pcieDevices = [],
    expansionSlots = [],
    boardConnectors = [],
    diskPartitions = [],
    physicalNetworkHw = [],
    dnsServers = [],
    runtimes,
  } = specs;
  const emptySlots = Math.max(0, memory.totalSlots - memory.modules.length);
  const [showAllPcie, setShowAllPcie] = useState(false);

  // Plain-text diagnostic summary for clipboard export
  const textSummary = useMemo(() => {
    const primaryGpu = graphics.find((g) => g.role !== 'Virtual') || graphics[0];
    const primaryDisplay = displays[0];
    const primaryDisk = physicalDisks[0];
    return [
      `Computer: ${host.manufacturer} ${host.model} (${host.chassisType})`,
      `OS: ${host.osName} (Build ${host.osBuild}, ${host.architecture})`,
      `Motherboard / BIOS: ${motherboard.manufacturer} ${motherboard.product} · BIOS ${motherboard.biosVersion} (${motherboard.biosReleaseDate || 'UEFI'})`,
      `CPU: ${cpu.name} (${cpu.physicalCores}C/${cpu.logicalThreads}T · ${cpu.topologyMode})`,
      `Memory: ${formatBytes(memory.installedBytes, 1)} ${memory.ddrType} (${memory.channelMode})`,
      primaryGpu ? `GPU: ${primaryGpu.name} (Driver ${primaryGpu.driverVersion})` : '',
      primaryDisplay?.nativeWidth ? `Display: ${primaryDisplay.nativeWidth}x${primaryDisplay.nativeHeight} @ ${primaryDisplay.refreshRateHz || 60}Hz (${primaryDisplay.scalePercent || 100}% Scale)` : '',
      primaryDisk ? `Primary Drive: ${primaryDisk.model} (${primaryDisk.busType} ${primaryDisk.mediaType}, ${primaryDisk.healthStatus})` : '',
    ]
      .filter(Boolean)
      .join('\n');
  }, [host, motherboard, cpu, memory, graphics, displays, physicalDisks]);

  const handleExportJson = () => {
    const payload = JSON.stringify({ exportedAt: new Date().toISOString(), specs }, null, 2);
    const blob = new Blob([payload], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${host.hostname.toLowerCase()}-hardware-specs.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Master In-Place Expandable (+ / -) Table Rows covering ALL Computer Hardware Details
  const masterRows: HardwareDetailTableRow[] = useMemo(() => {
    const primaryGpu = graphics.find((g) => g.role !== 'Virtual') || graphics[0];
    const primaryDisplay = displays[0];
    const primaryDisk = physicalDisks[0];

    const rows: HardwareDetailTableRow[] = [
      {
        id: 'computer-motherboard',
        name: 'Computer Chassis, Motherboard & Firmware',
        summary: `${host.manufacturer} ${host.model} · Board ${motherboard.product}`,
        hardwareCode: showHardwareCodes ? `${host.chassisCode || 'PC'} · BIOS ${motherboard.biosVersion}` : null,
        statusLabel: host.secureBoot === 'Enabled' ? 'Secure Boot On' : 'UEFI Firmware',
        statusTone: host.secureBoot === 'Enabled' ? 'emerald' : 'sky',
        primaryMetric: motherboard.biosReleaseDate || motherboard.biosVersion,
        accent: 'sky',
        details: [
          { label: 'Computer Manufacturer & Model', value: `${host.manufacturer} ${host.model}` },
          { label: 'Chassis & System SKU', value: `${host.chassisType}${host.sku ? ` · SKU ${host.sku}` : ''}`, code: showHardwareCodes ? host.chassisCode : null },
          { label: 'Hardware Service Tag', value: maskSerialValue(host.serialNumber, revealSerials), copyValue: host.serialNumber || '' },
          { label: 'Motherboard Model', value: `${motherboard.manufacturer} ${motherboard.product} (Rev ${motherboard.version})` },
          { label: 'BIOS / UEFI Firmware', value: `${motherboard.biosVendor} ${motherboard.biosVersion}${motherboard.biosReleaseDate ? ` (${motherboard.biosReleaseDate})` : ''}${motherboard.ecVersion ? ` · EC ${motherboard.ecVersion}` : ''}` },
          {
            label: 'Security, Standby & Virtual Memory',
            value: `Secure Boot: ${host.secureBoot} · Plan: ${host.powerPlan}${host.sleepStates?.length ? ` · ${host.sleepStates.join(', ')}` : ''}`,
            code: host.pagefile ? `Pagefile ${host.pagefile.path} (${host.pagefile.allocatedMB} MB / Peak ${host.pagefile.peakMB} MB)` : undefined,
            tone: host.defenderRealTime ? 'emerald' : 'default',
          },
        ],
      },
      {
        id: 'os-toolchain',
        name: 'Operating System & Developer Toolchain',
        summary: `${host.osName} · ${runtimes.length} Runtimes Detected`,
        hardwareCode: showHardwareCodes ? `Build ${host.osBuild} · ${host.architecture}` : null,
        statusLabel: host.defenderRealTime ? 'Defender Active' : 'OS Ready',
        statusTone: host.defenderRealTime ? 'emerald' : 'sky',
        primaryMetric: host.osBuild,
        accent: 'emerald',
        details: [
          { label: 'OS Edition & Version', value: `${host.osName} (${host.osVersion})` },
          { label: 'Architecture & Build', value: `${host.architecture} · Build ${host.osBuild}` },
          { label: 'Install Date & Hostname', value: `${host.osInstallDate || 'Unknown'} · Host ${host.hostname}` },
          { label: 'Windows Defender Antivirus', value: host.defenderRealTime === true ? 'Real-Time Protection Active' : host.defenderRealTime === false ? 'Real-Time Off' : 'Not Reported', tone: host.defenderRealTime ? 'emerald' : 'amber' },
          ...runtimes.map((rt) => ({
            label: `${rt.name} Runtime`,
            value: `v${rt.version}`,
            code: rt.path,
            copyValue: `${rt.name} ${rt.version} (${rt.path})`,
            tone: 'sky' as const,
          })),
        ],
      },
      {
        id: 'cpu-silicon',
        name: 'Processor (CPU) & Silicon Cache',
        summary: `${cpu.name} · ${cpu.topologyMode}`,
        hardwareCode: showHardwareCodes ? `${cpu.socketPackage} · ${cpu.processorId || 'x86_64'}` : null,
        statusLabel: `${cpu.physicalCores}C / ${cpu.logicalThreads}T`,
        statusTone: 'sky',
        primaryMetric: `${live.cpu.totalPercent.toFixed(1)}% @ ${formatClock(live.cpu.currentClockMHz || cpu.maxClockMHz)}`,
        accent: 'sky',
        details: [
          { label: 'Processor Model', value: cpu.name, code: showHardwareCodes ? cpu.microarchitecture || null : null },
          { label: 'Silicon Stepping & ID', value: cpu.siliconStepping || cpu.caption, code: showHardwareCodes ? cpu.processorId : null },
          { label: 'Core & Thread Topology', value: `${cpu.physicalCores} Physical Cores / ${cpu.logicalThreads} Logical Threads · ${cpu.topologyMode}` },
          { label: 'Socket Package', value: cpu.socketPackage, code: showHardwareCodes ? `Socket:${cpu.socket}` : null },
          { label: 'Cache Pyramid', value: `L1 ${formatCacheSize(cpu.l1CacheKB)} · L2 ${formatCacheSize(cpu.l2CacheKB)} · L3 ${formatCacheSize(cpu.l3CacheKB)}` },
          {
            label: 'Bus Reference Clock & VCore',
            value: `${cpu.extClockMHz ? `${cpu.extClockMHz} MHz BCLK` : 'Standard BCLK'}${cpu.coreVoltageV ? ` · ${cpu.coreVoltageV.toFixed(2)} V VCore` : ''}`,
          },
          ...(cpu.instructionSets && cpu.instructionSets.length > 0
            ? [
                {
                  label: 'Instruction Extensions (SIMD)',
                  value: cpu.instructionSets.join(', '),
                  tone: 'sky' as const,
                },
              ]
            : []),
          {
            label: 'Hardware Virtualization',
            value: cpu.hypervisorPresent
              ? 'Active via Windows Hypervisor (VT-x / WSL2)'
              : cpu.virtualizationEnabled === true
                ? 'VT-x / AMD-V Enabled'
                : cpu.virtualizationEnabled === false
                  ? 'Disabled in BIOS/UEFI'
                  : 'Unknown',
            tone: cpu.virtualizationEnabled ? 'emerald' : 'amber',
          },
          {
            label: 'Live Clock & Scheduler Telemetry',
            value: `${formatClock(live.cpu.currentClockMHz || cpu.maxClockMHz)} Live (Load ${live.cpu.totalPercent.toFixed(1)}%) · ${live.cpu.contextSwitchesPerSec.toLocaleString()} Ctx/s`,
            code: `${live.cpu.interruptsPerSec.toLocaleString()} IRQ/s`,
            tone: 'sky',
          },
        ],
      },
      {
        id: 'memory-dimms',
        name: 'Physical Memory (RAM Modules)',
        summary: `${formatBytes(memory.installedBytes, 1)} ${memory.ddrType} ${memory.formFactor} · ${memory.channelMode}`,
        hardwareCode: showHardwareCodes ? `${memory.modules.map((m) => m.manufacturerCode).join(' + ')}` : null,
        statusLabel: `${memory.populatedSlots}/${memory.totalSlots} Slots`,
        statusTone: 'purple',
        primaryMetric: `${memory.configuredSpeedMTs ? `${memory.configuredSpeedMTs} MT/s` : formatBytes(memory.usableBytes)}`,
        accent: 'purple',
        details: [
          {
            label: 'Installed, Usable & Hardware Reserved',
            value: `${formatBytes(memory.installedBytes, 2)} Installed · ${formatBytes(memory.usableBytes, 2)} Usable (${formatBytes(memory.reservedBytes, 0)} Reserved)`,
          },
          { label: 'Channel & Slot Capacity', value: `${memory.channelMode}${memory.maxCapacityGB ? ` · Max Motherboard Support ${memory.maxCapacityGB} GB` : ''}` },
          {
            label: 'Live OS Memory Allocation',
            value: `${formatBytes(live.memory.usedBytes, 2)} In Use (${live.memory.percent}%) · ${formatBytes(live.memory.availableBytes, 2)} Available`,
            tone: 'purple',
          },
          {
            label: 'Virtual Swap & Pagefile',
            value: host.pagefile
              ? `${host.pagefile.path} · ${host.pagefile.currentMB} MB Used / ${host.pagefile.allocatedMB} MB Alloc`
              : `${formatBytes(live.swap.usedBytes)} / ${formatBytes(live.swap.totalBytes)} Swap (${live.swap.percent}%)`,
            code: host.pagefile ? `Peak ${host.pagefile.peakMB} MB` : undefined,
          },
          ...memory.modules.map((mod) => ({
            label: mod.slotName,
            value: `${mod.capacityGB} GB ${mod.ddrType} ${mod.formFactor}${mod.rank ? ` · ${mod.rank}` : ''} · ${mod.manufacturer} (${mod.partNumber})`,
            code: showHardwareCodes ? `${mod.configuredSpeedMTs}/${mod.ratedSpeedMTs} MT/s · ${mod.voltageV ? `${mod.voltageV}V` : ''} · ${mod.eccStatus} · S/N ${maskSerialValue(mod.serialNumber, revealSerials)}` : null,
            copyValue: `${mod.slotName}: ${mod.capacityGB} GB ${mod.manufacturer} ${mod.partNumber} @ ${mod.configuredSpeedMTs} MT/s`,
            tone: 'purple' as const,
          })),
        ],
      },
      {
        id: 'gpu-displays',
        name: 'Graphics Adapters & Connected Displays',
        summary: primaryGpu ? `${primaryGpu.name} (${primaryGpu.vendor})` : 'Graphics Adapter',
        hardwareCode: showHardwareCodes && primaryGpu?.vendorCode ? `${primaryGpu.vendorCode} ${primaryGpu.deviceCode || ''}` : null,
        statusLabel: primaryDisplay?.nativeWidth ? `${primaryDisplay.nativeWidth}×${primaryDisplay.nativeHeight}` : 'Display Active',
        statusTone: 'amber',
        primaryMetric: primaryDisplay?.refreshRateHz ? `${primaryDisplay.refreshRateHz} Hz` : primaryGpu?.driverVersion || '—',
        accent: 'amber',
        details: [
          ...graphics.map((gpu, i) => ({
            label: `GPU ${i + 1} (${gpu.role})`,
            value: `${gpu.name} · ${gpu.vramBytes > 0 && gpu.vramMode === 'Dedicated VRAM' ? formatBytes(gpu.vramBytes, 1) : gpu.vramMode} · Driver ${gpu.driverVersion}`,
            code: showHardwareCodes ? `${gpu.vendorCode || gpu.vendor}${gpu.deviceCode ? ` ${gpu.deviceCode}` : ''}${gpu.driverDate ? ` · ${gpu.driverDate}` : ''}${gpu.infFilename ? ` · ${gpu.infFilename}` : ''}` : null,
            tone: 'amber' as const,
          })),
          {
            label: 'Live GPU Engine & Video Memory',
            value: `Load ${live.gpu.utilizationPercent !== null && live.gpu.utilizationPercent !== undefined ? `${Math.round(live.gpu.utilizationPercent)}%` : 'Ready'} · Shared Mem ${formatBytes(live.gpu.sharedUsedBytes)}${live.gpu.engines?.['3D'] !== undefined ? ` · 3D ${live.gpu.engines['3D']}%` : ''}`,
            code: live.gpu.engines?.VideoDecode !== undefined ? `Decode ${live.gpu.engines.VideoDecode}%` : primaryGpu?.dacType,
          },
          ...displays.map((d) => ({
            label: d.name,
            value: `${d.nativeWidth}×${d.nativeHeight} Native (${d.logicalWidth}×${d.logicalHeight} Scaled) · ${d.refreshRateHz || 60} Hz`,
            code: `${d.panelModel ? `${d.panelManufacturer ? `${d.panelManufacturer} ` : ''}${d.panelModel}${d.manufactureYear ? ` (${d.manufactureYear})` : ''} · ` : ''}${d.diagonalInches ? `${d.diagonalInches}" · ${d.ppi} PPI · ` : ''}${d.scalePercent ? `${d.scalePercent}% DPI` : ''} ${d.aspectRatio || ''}`.trim(),
            tone: 'sky' as const,
          })),
        ],
      },
      {
        id: 'physical-storage',
        name: 'Physical Storage & Sector Architecture',
        summary: primaryDisk ? `${primaryDisk.model} (${primaryDisk.busType} ${primaryDisk.mediaType})` : `${live.disk.volumes.length} Volumes`,
        hardwareCode: showHardwareCodes && primaryDisk ? `${primaryDisk.partitionStyle} · ${primaryDisk.sectorAlignment}` : null,
        statusLabel: primaryDisk?.healthStatus || 'Healthy',
        statusTone: primaryDisk?.healthStatus === 'Healthy' ? 'emerald' : 'amber',
        primaryMetric: primaryDisk ? formatBytes(primaryDisk.sizeBytes, 1) : '—',
        accent: 'emerald',
        details: [
          ...physicalDisks.flatMap((disk, idx) => [
            { label: `Physical Drive ${idx} Model`, value: `${disk.model} (${disk.busType} · ${disk.mediaType})`, tone: 'emerald' as const },
            { label: `Drive ${idx} Health & Firmware`, value: `${disk.healthStatus} / ${disk.operationalStatus} · FW ${disk.firmwareVersion || 'N/A'}` },
            { label: `Drive ${idx} Partition & Sector Geometry`, value: `${disk.partitionStyle} · ${disk.sectorAlignment} (${disk.logicalSectorSize}B/${disk.physicalSectorSize}B) · S/N ${maskSerialValue(disk.serialNumber, revealSerials)}`, copyValue: disk.serialNumber || '' },
          ]),
          ...live.disk.volumes.map((vol) => ({
            label: `Mounted Volume ${vol.mountpoint} (${vol.fstype})`,
            value: `${formatBytes(vol.usedBytes, 1)} / ${formatBytes(vol.totalBytes, 1)} Used (${vol.usedPercent}%) · ${formatBytes(vol.freeBytes, 1)} Free`,
            code: `Live R ${live.disk.readMBps.toFixed(1)} · W ${live.disk.writeMBps.toFixed(1)} MB/s`,
            tone: 'sky' as const,
          })),
        ],
      },
      {
        id: 'peripherals-battery',
        name: 'Battery Health, Audio, USB & Connected Peripherals',
        summary: `${peripherals.audio.length} Audio · ${peripherals.usbDevices?.length || peripherals.usbControllers.length} USB · ${peripherals.cameras.length} Camera · ${peripherals.bluetooth.length} Bluetooth`,
        hardwareCode: showHardwareCodes && battery ? `${battery.cycleCount ?? 0} Cycles · ${battery.fullChargeCapacityWh ?? '—'}${battery.designCapacityWh ? `/${battery.designCapacityWh}` : ''} Wh` : null,
        statusLabel: live.battery ? `${Math.round(live.battery.percent)}% Power` : 'AC System',
        statusTone: 'emerald',
        primaryMetric: `${peripherals.audio.length + (peripherals.usbDevices?.length || 0) + peripherals.cameras.length + peripherals.bluetooth.length + peripherals.usbControllers.length} Devices`,
        accent: 'zinc',
        details: [
          ...(battery
            ? [
                {
                  label: `Battery (${battery.name})`,
                  value: `${battery.chemistry} · Full ${battery.fullChargeCapacityWh ?? '—'} Wh${battery.designCapacityWh ? ` / Design ${battery.designCapacityWh} Wh` : ''}${battery.healthPercent !== null && battery.healthPercent !== undefined ? ` (${battery.healthPercent}% Health)` : ''} · ${battery.cycleCount ?? '—'} Cycles · ${battery.designVoltageV ?? '—'} V`,
                  tone: 'emerald' as const,
                },
              ]
            : []),
          ...peripherals.audio.map((a, i) => ({ label: `Audio Chipset ${i + 1}`, value: `${a.name} (${a.manufacturer})`, code: a.status })),
          ...peripherals.cameras.map((c, i) => ({ label: `Camera ${i + 1}`, value: c.name, code: c.status })),
          ...peripherals.usbControllers.map((u, i) => ({ label: `USB Controller ${i + 1}`, value: u.name, code: u.vendor || u.manufacturer })),
          ...(peripherals.usbDevices || []).map((u, i) => ({
            label: `USB Device ${i + 1} (${u.class || 'USB'})`,
            value: `${u.name} (${u.vendor || u.manufacturer})`,
            code: u.code || u.status,
          })),
          {
            label: `Bluetooth Devices (${peripherals.bluetooth.length})`,
            value: peripherals.bluetooth.map((b) => b.name).join(', ') || 'None detected',
            tone: 'sky',
          },
        ],
      },
      {
        id: 'pcie-chipset',
        name: 'PCI-Express Bus, Neural Accelerator & Chipset Silicon',
        summary: `${pcieDevices.length} PCIe Devices · ${pcieDevices.filter((p) => p.name.toLowerCase().includes('gna') || p.pnpClass === 'SCSIAdapter' || p.pnpClass === 'Display').length} Accelerators / I/O Engines`,
        hardwareCode: showHardwareCodes ? 'PCI\\VEN_8086 / 10EC / 1344' : null,
        statusLabel: `${pcieDevices.length} Functions`,
        statusTone: 'sky',
        primaryMetric: 'PCIe Fabric',
        accent: 'sky',
        details: pcieDevices.map((dev, idx) => ({
          label: `${idx + 1}. ${dev.pnpClass} Controller`,
          value: dev.name,
          code: showHardwareCodes && dev.vendorCode ? `${dev.vendor} (${dev.vendorCode} ${dev.deviceCode || ''})` : dev.vendor,
          copyValue: `${dev.name} [${dev.pnpId}]`,
          tone: dev.name.toLowerCase().includes('gna') || dev.pnpClass === 'Display' ? ('purple' as const) : ('default' as const),
        })),
      },
      {
        id: 'slots-tpm-headers',
        name: 'TPM 2.0 Security Chip, Expansion Slots & Board Headers',
        summary: `${motherboard.tpm ? motherboard.tpm.name : 'Platform Security'} · ${expansionSlots.filter((s) => s.inUse).length}/${expansionSlots.length} PCIe Slots Occupied`,
        hardwareCode: showHardwareCodes && motherboard.ecVersion ? `EC FW ${motherboard.ecVersion} · ${boardConnectors.length} Connectors` : null,
        statusLabel: motherboard.tpm?.status || 'Verified',
        statusTone: motherboard.tpm ? 'emerald' : 'zinc',
        primaryMetric: `${expansionSlots.length} Slots`,
        accent: 'emerald',
        details: [
          ...(motherboard.tpm
            ? [
                {
                  label: 'Security Processor (TPM)',
                  value: `${motherboard.tpm.name} (${motherboard.tpm.status})`,
                  code: showHardwareCodes ? motherboard.tpm.pnpId || null : null,
                  tone: 'emerald' as const,
                },
              ]
            : []),
          ...(motherboard.ecVersion
            ? [{ label: 'Embedded Controller (EC) Firmware', value: `v${motherboard.ecVersion}` }]
            : []),
          ...expansionSlots.map((sl) => ({
            label: sl.name,
            value: `${sl.widthLabel} · ${sl.statusLabel}`,
            tone: sl.inUse ? ('emerald' as const) : ('default' as const),
          })),
          ...boardConnectors.map((cn, idx) => ({
            label: `${cn.kind} #${idx + 1}`,
            value: [cn.externalName, cn.internalName].filter(Boolean).join(' / ') || 'Header',
          })),
        ],
      },
      {
        id: 'partitions-radios',
        name: 'Low-Level GPT Partitions & Physical Network Hardware',
        summary: `${diskPartitions.length} Disk Partitions · ${physicalNetworkHw.length} Physical Network Controllers`,
        hardwareCode: showHardwareCodes ? `${diskPartitions.map((p) => p.type).join(' + ')}` : null,
        statusLabel: `${physicalNetworkHw.filter((n) => n.connected).length}/${physicalNetworkHw.length} Linked`,
        statusTone: 'amber',
        primaryMetric: `${diskPartitions.length} Partitions`,
        accent: 'amber',
        details: [
          ...diskPartitions.map((pt) => ({
            label: `Disk ${pt.diskNumber} · Partition ${pt.partitionNumber}`,
            value: `${pt.driveLetter ? `${pt.driveLetter} ` : ''}${pt.isSystem ? 'EFI System Partition' : pt.isBoot ? 'Windows OS (Boot)' : pt.type} · ${formatBytes(pt.sizeBytes, 1)}`,
            code: [pt.isSystem ? 'EFI System' : '', pt.isBoot ? 'Boot Volume' : ''].filter(Boolean).join(' · ') || undefined,
            tone: pt.isBoot || pt.isSystem ? ('emerald' as const) : ('default' as const),
          })),
          ...physicalNetworkHw.map((nic) => ({
            label: `Physical Adapter (${nic.connected ? 'Connected' : 'Standby'})`,
            value: `${nic.name} (${nic.manufacturer})`,
            code: `${nic.macAddress || 'No MAC'}${nic.speedMbps ? ` · ${nic.speedMbps} Mbps` : ''}`,
            copyValue: `${nic.name} MAC ${nic.macAddress || ''}`,
            tone: nic.connected ? ('emerald' as const) : ('default' as const),
          })),
          ...dnsServers.map((dns) => ({
            label: `Active DNS (${dns.interfaceAlias})`,
            value: dns.servers.join(', '),
            tone: 'sky' as const,
          })),
        ],
      },
    ];

    if (!searchQuery.trim()) return rows;
    const q = searchQuery.toLowerCase();
    return rows.filter(
      (r) =>
        r.name.toLowerCase().includes(q) ||
        r.summary.toLowerCase().includes(q) ||
        (r.hardwareCode || '').toLowerCase().includes(q) ||
        r.details.some((d) => d.label.toLowerCase().includes(q) || d.value.toLowerCase().includes(q) || (d.code || '').toLowerCase().includes(q))
    );
  }, [specs, live, searchQuery, revealSerials, showHardwareCodes]);

  const l1Max = Math.max(cpu.l1CacheKB, cpu.l2CacheKB, cpu.l3CacheKB, 1);
  const qNorm = searchQuery.trim().toLowerCase();
  const matchesCard = (...tokens: Array<string | number | boolean | null | undefined>): boolean => {
    if (!qNorm) return true;
    return tokens.some((t) => t !== null && t !== undefined && String(t).toLowerCase().includes(qNorm));
  };
  const cardRing = (matched: boolean) =>
    qNorm
      ? matched
        ? 'ring-1 ring-sky-400/50 border-sky-400/40'
        : 'opacity-45 hover:opacity-80'
      : '';

  const boostPct =
    cpu.maxClockMHz > 0 && live.cpu.currentClockMHz
      ? Math.round(((live.cpu.currentClockMHz - cpu.maxClockMHz) / cpu.maxClockMHz) * 100)
      : 0;

  return (
    <div className="flex flex-col gap-5 sys-stagger">
      {/* ── Hardware Specifications Toolbar ── */}
      <div className="p-3.5 rounded-2xl system-card flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative flex-1 min-w-0">
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
            placeholder="Filter hardware specs, vendor codes, DIMMs, GPU drivers, peripherals..."
            className="neu-inset w-full pl-9 pr-24 py-2 rounded-xl bg-[#16161c] border border-white/[0.08] text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-400/50"
          />
          {searchQuery && (
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => tableAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
                className="neu-btn px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300 hover:bg-sky-500/25 cursor-pointer"
                title="Scroll to matching specification rows below"
              >
                {masterRows.length} matched ↓
              </button>
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                aria-label="Clear filter"
                className="neu-btn w-5 h-5 rounded-md text-zinc-400 hover:text-white hover:bg-white/[0.08] text-xs font-bold cursor-pointer flex items-center justify-center"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowHardwareCodes((v) => !v)}
            className={`neu-btn px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              showHardwareCodes
                ? 'bg-sky-500/15 border-sky-400/35 text-sky-300'
                : 'bg-[#16161c] border-white/[0.08] text-zinc-400 hover:text-white'
            }`}
          >
            {showHardwareCodes ? 'Codes: Shown' : 'Codes: Hidden'}
          </button>

          <button
            type="button"
            onClick={() => setRevealSerials((v) => !v)}
            className={`neu-btn px-3 py-1.5 rounded-xl border text-[11px] font-mono font-bold transition-colors cursor-pointer ${
              revealSerials
                ? 'bg-amber-500/15 border-amber-400/35 text-amber-300'
                : 'bg-[#16161c] border-white/[0.08] text-zinc-300 hover:text-white'
            }`}
          >
            {revealSerials ? 'Hide Serials' : 'Show Serials'}
          </button>

          <CopyButton text={textSummary} label="Copy Summary" copiedLabel="Copied!" />

          <button
            type="button"
            onClick={handleExportJson}
            className="neu-btn inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16161c] border border-white/[0.1] text-xs font-semibold text-zinc-200 hover:text-white hover:border-white/[0.22] transition-colors cursor-pointer"
          >
            <span>Export JSON</span>
          </button>
        </div>
      </div>

      {/* ── 1 · Internal Hardware (Inside the Case) Matrix ── */}
      {(() => {
        const nvSensor = live.gpu.nvidiaSensors?.[0];
        const coolingVal = nvSensor?.temperatureC != null ? `${nvSensor.temperatureC}°C` : live.healthPosture.label;
        const coolingPct = nvSensor?.temperatureC != null ? Math.min(100, (nvSensor.temperatureC / 95) * 100) : 25;
        const activeNics = live.networkAdapters.filter((n) => n.isUp).length;
        return (
          <TelemetryTileGrid
            title={`1 · Internal Hardware (Inside the Case) — ${host.manufacturer} ${host.model}`}
            rightLabel={`${cpu.physicalCores}C/${cpu.logicalThreads}T · ${formatBytes(memory.installedBytes, 0)} · ${physicalDisks.length} Drive(s)`}
            rightToneClass="text-sky-300"
            columnsClass="grid-cols-2 sm:grid-cols-3 md:grid-cols-5"
            items={[
              {
                id: 'hw-mobo',
                label: 'Motherboard',
                badge: 'PCB',
                badgeTone: 'sky',
                tone: 'sky',
                valueText: motherboard.product.slice(0, 8),
                percent: 100,
                tooltip: `${motherboard.manufacturer} ${motherboard.product} · ${pcieDevices.length} PCIe Devices`,
              },
              {
                id: 'hw-cpu',
                label: 'CPU',
                badge: `${cpu.physicalCores}C/${cpu.logicalThreads}T`,
                badgeTone: 'sky',
                valueText: `${Math.round(live.cpu.totalPercent)}%`,
                percent: live.cpu.totalPercent,
                tooltip: `${cpu.name} (${cpu.topologyMode})`,
              },
              {
                id: 'hw-ram',
                label: 'RAM',
                badge: memory.ddrType,
                badgeTone: 'purple',
                valueText: `${Math.round(live.memory.percent)}%`,
                percent: live.memory.percent,
                tooltip: `${formatBytes(memory.installedBytes, 1)} ${memory.ddrType} (${memory.populatedSlots}/${memory.totalSlots} Slots)`,
              },
              {
                id: 'hw-disk',
                label: 'Storage',
                badge: physicalDisks[0]?.busType || 'SSD',
                badgeTone: 'emerald',
                valueText: formatBytes(physicalDisks[0]?.sizeBytes, 0),
                percent: live.disk.volumes[0]?.usedPercent ?? 0,
                tooltip: physicalDisks.map((d) => `${d.model} (${d.healthStatus})`).join(' · ') || 'Physical Storage',
              },
              {
                id: 'hw-gpu',
                label: 'GPU',
                badge: `${graphics.length}`,
                badgeTone: 'amber',
                valueText: `${Math.round(live.gpu.utilizationPercent ?? 0)}%`,
                percent: live.gpu.utilizationPercent ?? 0,
                tooltip: graphics.map((g) => g.name).join(' · ') || 'Graphics Adapter',
              },
              {
                id: 'hw-psu',
                label: live.battery ? 'Battery/PSU' : 'PSU',
                badge: live.battery?.powerPlugged ? 'AC' : 'DC',
                badgeTone: 'emerald',
                valueText: live.battery ? `${Math.round(live.battery.percent)}%` : 'AC',
                percent: live.battery?.percent ?? 100,
                tone: live.battery ? undefined : 'sky',
                tooltip: `Power Plan: ${host.powerPlan}`,
                onClick: () => onSelectTab?.('power-health'),
              },
              {
                id: 'hw-cool',
                label: 'Cooling',
                badge: nvSensor?.fanPercent != null ? `${nvSensor.fanPercent}%` : 'Therm',
                badgeTone: 'sky',
                tone: nvSensor?.temperatureC != null && nvSensor.temperatureC >= 80 ? 'amber' : 'sky',
                valueText: coolingVal,
                percent: coolingPct,
                tooltip: `Thermal / Cooling Posture: ${coolingVal}`,
                onClick: () => onSelectTab?.('power-health'),
              },
              {
                id: 'hw-nic',
                label: 'NIC / Wi-Fi',
                badge: live.connectedWifi ? 'RF' : 'LAN',
                badgeTone: 'sky',
                valueText: live.connectedWifi?.signalPercent != null ? `${live.connectedWifi.signalPercent}%` : `${activeNics} UP`,
                percent: live.connectedWifi?.signalPercent ?? (activeNics > 0 ? 100 : 0),
                tone: activeNics > 0 ? undefined : 'muted',
                tooltip: `Active Network Adapters: ${activeNics}`,
                onClick: () => onSelectTab?.('storage-network'),
              },
              {
                id: 'hw-cmos',
                label: 'CMOS/BIOS',
                badge: host.secureBoot === 'Enabled' ? 'SEC' : 'EFI',
                badgeTone: host.secureBoot === 'Enabled' ? 'emerald' : 'amber',
                tone: host.secureBoot === 'Enabled' ? 'sky' : 'amber',
                valueText: motherboard.biosVersion.slice(0, 7),
                percent: 100,
                tooltip: `BIOS ${motherboard.biosVersion} · Secure Boot: ${host.secureBoot} · CMOS RTC Active`,
              },
              {
                id: 'hw-case',
                label: 'Chassis',
                badge: 'Case',
                badgeTone: 'neutral',
                tone: 'sky',
                valueText: host.chassisType.split(' ')[0],
                percent: 100,
                tooltip: `${host.manufacturer} ${host.model} (${host.chassisType})`,
              },
            ]}
          />
        );
      })()}

      {/* ── Visual Bento Row 1: CPU Silicon Pyramid + Motherboard & Security ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
        {/* CPU Silicon & Cache Pyramid */}
        <section
          className={`lg:col-span-6 p-5 rounded-2xl system-card flex flex-col justify-between gap-4 transition-all ${cardRing(
            matchesCard(cpu.name, cpu.microarchitecture, cpu.socketPackage, cpu.topologyMode, cpu.processorId, 'vt-x', 'cache', 'l1', 'l2', 'l3')
          )}`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-sky-500/12 border border-sky-400/25 flex items-center justify-center text-sky-400 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="5" y="5" width="14" height="14" rx="2" />
                    <rect x="9" y="9" width="6" height="6" />
                    <path d="M9 1v4M15 1v4M9 19v4M15 19v4M1 9h4M1 15h4M19 9h4M19 15h4" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Processor Silicon &amp; Cache Pyramid</span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white truncate">{cpu.name}</h2>
                </div>
              </div>
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('performance')}
                  className="px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-sky-400/40 text-[10px] font-mono font-bold text-sky-300 hover:text-sky-200 transition-colors cursor-pointer shrink-0"
                >
                  Live Perf →
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5">
              {cpu.microarchitecture && (
                <span className="px-2 py-0.5 rounded-md bg-purple-500/15 border border-purple-500/30 text-[10px] font-mono font-bold text-purple-200">
                  {cpu.microarchitecture}
                </span>
              )}
              <span className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                {cpu.addressWidth}-bit
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 text-[10px] font-mono font-bold text-sky-300">
                {cpu.topologyMode}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-[10px] font-mono text-zinc-300">
                Socket {cpu.socketPackage}
              </span>
              <span
                className={`px-2 py-0.5 rounded-md border text-[10px] font-mono font-bold ${
                  cpu.virtualizationEnabled
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : 'bg-amber-500/15 border-amber-500/35 text-amber-300'
                }`}
              >
                {cpu.hypervisorPresent
                  ? 'VT-x: Active (Hyper-V)'
                  : cpu.virtualizationEnabled
                    ? 'VT-x: Enabled'
                    : cpu.virtualizationEnabled === false
                      ? 'VT-x: Disabled'
                      : 'VT-x: N/A'}
              </span>
            </div>
          </div>

          {/* Framed Visual Cache Pyramid Tiers */}
          <div className="neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col items-center gap-2">
            {[
              { label: 'L1 Instruction + Data Cache', hint: 'Fastest Private Core SRAM', kb: cpu.l1CacheKB, cls: 'from-sky-500/30 to-sky-400/20 border-sky-400/40 text-sky-200', minW: 54 },
              { label: 'L2 Core Cache', hint: 'Dedicated Per-Cluster Cache', kb: cpu.l2CacheKB, cls: 'from-indigo-500/30 to-blue-500/20 border-indigo-400/40 text-indigo-200', minW: 76 },
              { label: 'L3 Shared Smart Cache', hint: 'Unified Last-Level Ring Cache', kb: cpu.l3CacheKB, cls: 'from-purple-500/30 to-fuchsia-500/20 border-purple-400/40 text-purple-200', minW: 100 },
            ].map((tier) => {
              const widthPct = tier.kb > 0 ? Math.max(tier.minW, Math.round((Math.sqrt(tier.kb) / Math.sqrt(l1Max)) * 100)) : tier.minW;
              return (
                <div
                  key={tier.label}
                  title={`${tier.hint} · ${formatCacheSize(tier.kb)}`}
                  className={`h-8 rounded-xl bg-gradient-to-r ${tier.cls} border flex items-center justify-center px-3 text-[11px] font-mono tabular-nums font-bold hover:brightness-110 transition-all`}
                  style={{ width: `${Math.min(100, widthPct)}%` }}
                >
                  <span className="truncate">{tier.label}: {formatCacheSize(tier.kb)}</span>
                </div>
              );
            })}
          </div>

          <div className="grid grid-cols-3 gap-2 text-[11px] font-mono tabular-nums">
            <div className="neu-tile px-3 py-2 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] text-zinc-400">Live Clock</span>
                {boostPct !== 0 && (
                  <span className={`text-[9px] font-bold ${boostPct > 0 ? 'text-emerald-300' : 'text-zinc-400'}`}>
                    {boostPct > 0 ? `+${boostPct}%` : `${boostPct}%`}
                  </span>
                )}
              </div>
              <strong className="text-sky-300">{formatClock(live.cpu.currentClockMHz || cpu.maxClockMHz)}</strong>
            </div>
            <div className="neu-tile px-3 py-2 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col">
              <span className="text-[10px] text-zinc-400">Base / BCLK</span>
              <strong className="text-white">
                {formatClock(cpu.maxClockMHz)}
                {cpu.extClockMHz ? <span className="text-[10px] text-zinc-400 font-normal"> · {cpu.extClockMHz}MHz</span> : ''}
              </strong>
            </div>
            <div className="neu-tile px-3 py-2 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col">
              <span className="text-[10px] text-zinc-400">Cores / VCore</span>
              <strong className="text-zinc-200">
                {cpu.physicalCores}C/{cpu.logicalThreads}T
                {cpu.coreVoltageV ? <span className="text-[10px] text-amber-300 font-normal"> · {cpu.coreVoltageV.toFixed(1)}V</span> : ''}
              </strong>
            </div>
          </div>

          {cpu.instructionSets && cpu.instructionSets.length > 0 && (
            <div className="p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2 text-[10px] font-mono">
              <div className="flex flex-wrap items-center gap-1.5">
                <span className="text-zinc-400 mr-0.5 uppercase tracking-wider">ISA:</span>
                {cpu.instructionSets.map((isa) => (
                  <span
                    key={isa}
                    className="px-1.5 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08] text-zinc-200"
                  >
                    {isa}
                  </span>
                ))}
              </div>
              <span className="text-sky-300 font-bold tabular-nums">
                {live.cpu.totalPercent.toFixed(1)}% Load
              </span>
            </div>
          )}
        </section>

        {/* Motherboard, Firmware & Platform Security */}
        <section
          className={`lg:col-span-6 p-5 rounded-2xl system-card flex flex-col justify-between gap-4 transition-all ${cardRing(
            matchesCard(motherboard.manufacturer, motherboard.product, motherboard.biosVersion, host.model, host.osName, host.osBuild, host.powerPlan, 'bios', 'uefi', 'defender', 'secure boot')
          )}`}
        >
          <div className="flex flex-col gap-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Motherboard, Firmware &amp; Platform Security</span>
                  <h2 className="text-base sm:text-lg font-extrabold text-white truncate">
                    {motherboard.manufacturer} {motherboard.product}{' '}
                    <span className="text-xs font-mono font-semibold text-zinc-400">(Rev {motherboard.version})</span>
                  </h2>
                </div>
              </div>
              {onSelectTab && (
                <button
                  type="button"
                  onClick={() => onSelectTab('power-health')}
                  className="px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] hover:border-emerald-400/40 text-[10px] font-mono font-bold text-emerald-300 hover:text-emerald-200 transition-colors cursor-pointer shrink-0"
                >
                  Health →
                </button>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              <span className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-zinc-200">
                {host.manufacturer} {host.model}
              </span>
              <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/30 font-bold text-sky-300">
                {host.osName}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-xs">
            <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">BIOS / EC Firmware</span>
              <strong className="text-white font-mono">
                {motherboard.biosVersion || 'UEFI'}
                {motherboard.ecVersion && <span className="text-[10px] text-sky-300 font-normal ml-1.5">EC {motherboard.ecVersion}</span>}
              </strong>
              {motherboard.biosReleaseDate && (
                <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">{motherboard.biosReleaseDate}</span>
              )}
            </div>
            <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">Chassis &amp; SKU</span>
              <strong className="text-white truncate block">{host.chassisType}</strong>
              {host.sku && <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">SKU {host.sku}</span>}
            </div>
            <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex items-start justify-between gap-1.5">
              <div className="min-w-0">
                <span className="block text-[10px] font-mono text-zinc-400">Service Tag</span>
                <strong className="text-white font-mono truncate block">{maskSerialValue(host.serialNumber, revealSerials)}</strong>
                <button
                  type="button"
                  onClick={() => setRevealSerials((v) => !v)}
                  className="text-[10px] font-mono text-sky-300 hover:underline cursor-pointer mt-0.5"
                >
                  {revealSerials ? 'Mask' : 'Reveal'}
                </button>
              </div>
              {host.serialNumber && <CopyButton text={host.serialNumber} variant="icon-only" className="shrink-0" title="Copy Service Tag" />}
            </div>
            <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">Power Plan</span>
              <strong className="text-amber-300 truncate block">{host.powerPlan}</strong>
              <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">{live.battery ? (live.battery.powerPlugged ? 'AC Connected' : 'On Battery') : 'AC Mains'}</span>
            </div>
            <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">Session Uptime</span>
              <strong className="text-sky-300 font-mono tabular-nums">{formatUptime(live.uptimeSeconds)}</strong>
              <span className="block text-[10px] font-mono text-zinc-500 mt-0.5 truncate">{host.hostname}</span>
            </div>
            <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06]">
              <span className="block text-[10px] font-mono text-zinc-400">OS Build &amp; Install</span>
              <strong className="text-white font-mono">Build {host.osBuild}</strong>
              <span className="block text-[10px] font-mono text-zinc-500 mt-0.5">{host.osInstallDate || host.architecture}</span>
            </div>
          </div>

          <div className="neu-tile p-2.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2">
              {motherboard.tpm && (
                <span className="px-2.5 py-1 rounded-lg border border-emerald-500/35 bg-emerald-500/15 text-[11px] font-mono font-bold text-emerald-300">
                  TPM 2.0: {motherboard.tpm.status}
                </span>
              )}
              <span
                className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${
                  host.secureBoot === 'Enabled'
                    ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                    : 'bg-[#16161c] border-white/[0.1] text-zinc-300'
                }`}
              >
                Secure Boot: {host.secureBoot}
              </span>
              {host.defenderRealTime !== null && host.defenderRealTime !== undefined && (
                <span
                  className={`px-2.5 py-1 rounded-lg border text-[11px] font-mono font-bold ${
                    host.defenderRealTime
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-rose-500/15 border-rose-500/35 text-rose-300'
                  }`}
                >
                  Defender: {host.defenderRealTime ? 'Active' : 'Disabled'}
                </span>
              )}
            </div>
            <span className="text-[10px] font-mono text-zinc-400">{host.architecture}</span>
          </div>
        </section>
      </div>

      {/* ── Visual Row 2: Physical Memory (RAM) Motherboard DIMM Slot Visualizer ── */}
      <section
        className={`p-5 rounded-2xl system-card flex flex-col gap-4 transition-all ${cardRing(
          matchesCard(
            memory.ddrType,
            memory.channelMode,
            ...memory.modules.flatMap((m) => [m.manufacturer, m.partNumber, m.manufacturerCode, m.slotName]),
            'ram',
            'memory',
            'dimm'
          )
        )}`}
      >
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <span className="w-8 h-8 rounded-lg bg-purple-500/12 border border-purple-400/25 flex items-center justify-center text-purple-300 shrink-0">
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="6" width="20" height="12" rx="2" />
                <path d="M6 10v4M10 10v4M14 10v4M18 10v4" />
              </svg>
            </span>
            <div>
              <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Motherboard Memory Slots</span>
              <h2 className="text-sm sm:text-base font-bold text-white">Physical Memory (RAM) &amp; DIMM Architecture</h2>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-[10px] font-mono font-bold">
            <span className="px-2.5 py-1 rounded-md bg-sky-500/15 border border-sky-400/35 text-sky-300">
              {memory.channelMode}
            </span>
            <span className="px-2.5 py-1 rounded-md bg-purple-500/15 border border-purple-500/35 text-purple-300">
              {formatBytes(memory.installedBytes, 1)} {memory.ddrType} @ {memory.configuredSpeedMTs || '—'} MT/s
            </span>
            {memory.maxCapacityGB && (
              <span className="px-2.5 py-1 rounded-md bg-[#16161c] border border-white/[0.1] text-zinc-300">
                Max Supported {memory.maxCapacityGB} GB
              </span>
            )}
          </div>
        </div>

        {/* Live RAM Allocation Context Strip */}
        <div className="neu-tile px-3.5 py-2.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-[11px] font-mono tabular-nums">
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="text-zinc-400">Live OS Usage:</span>
            <strong className="text-purple-300">
              {formatBytes(live.memory.usedBytes, 1)} / {formatBytes(live.memory.totalBytes, 1)} ({live.memory.percent}%)
            </strong>
            <span className="text-zinc-500">·</span>
            <span className="text-emerald-300">{formatBytes(live.memory.availableBytes, 1)} Available</span>
            {memory.reservedBytes > 0 && (
              <>
                <span className="text-zinc-500">·</span>
                <span className="text-amber-300" title="Reserved by BIOS/UEFI, iGPU aperture & PCIe MMIO">
                  {formatBytes(memory.reservedBytes, 0)} HW Reserved
                </span>
              </>
            )}
          </div>
          <div className="w-full sm:w-52 h-2 rounded-full bg-[#0a0a0e] border border-white/[0.06] overflow-hidden shrink-0">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-sky-400 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, live.memory.percent)}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {memory.modules.map((mod) => (
            <div
              key={mod.slotIndex}
              className="neu-tile relative overflow-hidden p-4 rounded-xl bg-[#16161c] border border-purple-500/25 hover:border-purple-400/45 flex flex-col justify-between gap-3 transition-colors"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex flex-col gap-0.5 min-w-0">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-purple-300">{mod.slotName}</span>
                  <strong className="text-sm font-extrabold text-white truncate">
                    {mod.capacityGB} GB {mod.ddrType} {mod.formFactor}
                  </strong>
                  <div className="flex items-center gap-1.5 min-w-0">
                    <span className="text-xs text-zinc-300 truncate">
                      {mod.manufacturer} · <code className="font-mono text-zinc-400">{mod.partNumber}</code>
                    </span>
                    {mod.partNumber && mod.partNumber !== 'N/A' && (
                      <CopyButton text={mod.partNumber} variant="icon-only" className="shrink-0" title="Copy DIMM Part Number" />
                    )}
                  </div>
                </div>
                {showHardwareCodes && (
                  <code className="px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08] text-[10px] font-mono text-zinc-400 shrink-0">
                    {mod.manufacturerCode}
                  </code>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-mono tabular-nums text-zinc-400">
                <span>Active <strong className="text-white">{mod.configuredSpeedMTs} MT/s</strong> (Rated {mod.ratedSpeedMTs} MT/s)</span>
                {mod.voltageV && <span>{mod.voltageV.toFixed(2)} V</span>}
                {mod.rank && <span className="text-sky-300">{mod.rank}</span>}
                <span>{mod.eccStatus}</span>
                <span>S/N {maskSerialValue(mod.serialNumber, revealSerials)}</span>
              </div>

              {/* Stylized Gold Edge Connector Contacts + Realistic Center Key Notch */}
              <div className="flex items-center gap-1.5">
                <div className="dimm-gold-pins flex-[1.35]" />
                <span className="w-2 h-2 rounded-xs bg-[#09090d] border border-amber-500/35 shrink-0" title="DIMM Key Notch" />
                <div className="dimm-gold-pins flex-1" />
              </div>
            </div>
          ))}

          {Array.from({ length: emptySlots }).map((_, idx) => (
            <div
              key={`empty-${idx}`}
              className="neu-inset p-4 rounded-xl bg-[#0e0e12] border border-dashed border-white/[0.12] flex flex-col items-center justify-center text-center gap-1 min-h-[112px]"
            >
              <span className="text-xs font-mono font-bold text-zinc-500">Memory Slot {memory.modules.length + idx + 1}</span>
              <span className="text-[11px] text-zinc-500">Empty Expansion Slot</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Visual Row 3: Uniformly Aligned Graphics, Storage & Peripherals Bento Row ── */}
      {(() => {
        const primaryGpu = graphics.find((g) => g.role !== 'Virtual') || graphics[0];
        const primaryDisplay = displays[0];
        const primaryDisk = physicalDisks[0];
        const primaryVol = live.disk.volumes[0];

        return (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
            {/* Graphics & Physical Display Geometry */}
            <section
              className={`p-5 rounded-2xl system-card flex flex-col justify-between gap-3.5 transition-all ${cardRing(
                matchesCard(primaryGpu?.name, primaryGpu?.driverVersion, primaryGpu?.vendorCode, primaryDisplay?.name, 'gpu', 'display', 'graphics')
              )}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-amber-500/12 border border-amber-400/25 flex items-center justify-center text-amber-300 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="2" y="3" width="20" height="14" rx="2" />
                      <line x1="8" y1="21" x2="16" y2="21" />
                      <line x1="12" y1="17" x2="12" y2="21" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Graphics &amp; Display</span>
                    <h3 className="text-sm font-bold text-white truncate">
                      {primaryGpu?.name || 'Host Graphics'}
                    </h3>
                  </div>
                </div>
                {onSelectTab ? (
                  <button
                    type="button"
                    onClick={() => onSelectTab('peripherals')}
                    className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono font-bold text-amber-300 hover:bg-amber-500/25 transition-colors cursor-pointer shrink-0"
                  >
                    Displays →
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-amber-500/15 border border-amber-500/35 text-[10px] font-mono font-bold text-amber-300 shrink-0">
                    {primaryGpu?.role || 'Integrated'}
                  </span>
                )}
              </div>

              {primaryDisplay ? (
                <div className="neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col items-center justify-center gap-2 text-center flex-1">
                  <div className="flex flex-col items-center">
                    <div className="neu-inset w-32 aspect-video rounded-lg border-2 border-sky-400/55 bg-gradient-to-br from-sky-500/18 via-[#0b0b0f] to-purple-500/18 flex flex-col items-center justify-center gap-0.5 sys-screen-bezel">
                      <span className="text-[11px] font-mono font-extrabold text-sky-200">
                        {primaryDisplay.aspectRatio || 'Display'}
                      </span>
                      <span className="text-[9px] font-mono text-zinc-400">
                        {primaryDisplay.bitsPerPixel ?? 32}-bit Color
                      </span>
                    </div>
                    <div className="w-4 h-1.5 bg-zinc-700/70" />
                    <div className="w-12 h-1 rounded-full bg-zinc-700/80" />
                  </div>
                  <strong className="text-xs font-mono tabular-nums text-white mt-0.5">
                    {primaryDisplay.nativeWidth}×{primaryDisplay.nativeHeight} @ {primaryDisplay.refreshRateHz || 60}Hz
                  </strong>
                  <span className="text-[11px] font-mono tabular-nums text-zinc-400">
                    {primaryDisplay.diagonalInches ? `${primaryDisplay.diagonalInches}" Panel · ${primaryDisplay.ppi} PPI` : 'Active Display Output'}
                    {primaryDisplay.scalePercent ? ` · ${primaryDisplay.scalePercent}% DPI` : ''}
                  </span>
                  <div className="flex flex-wrap items-center justify-center gap-2 pt-0.5 text-[10px] font-mono">
                    {primaryDisplay.panelModel && (
                      <span className="px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08] text-sky-300">
                        {primaryDisplay.panelManufacturer ? `${primaryDisplay.panelManufacturer} ` : ''}
                        {primaryDisplay.panelModel}
                        {primaryDisplay.manufactureYear ? ` · ${primaryDisplay.manufactureYear}` : ''}
                      </span>
                    )}
                    <span className="px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08] text-amber-300">
                      GPU {live.gpu.utilizationPercent !== null && live.gpu.utilizationPercent !== undefined ? `${Math.round(live.gpu.utilizationPercent)}%` : 'Ready'}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] text-xs text-zinc-400 flex-1 flex items-center justify-center">
                  No attached monitor geometry reported
                </div>
              )}

              <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-zinc-200">
                <span className="px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">
                  Driver {primaryGpu?.driverVersion || 'Active'}
                </span>
                <span className="px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">
                  {primaryGpu && primaryGpu.vramBytes > 0 && primaryGpu.vramMode === 'Dedicated VRAM'
                    ? formatBytes(primaryGpu.vramBytes, 1)
                    : primaryGpu?.vramMode?.includes('Shared')
                      ? 'Shared System Memory'
                      : primaryGpu?.vramMode || 'Shared VRAM'}
                </span>
                {showHardwareCodes && primaryGpu?.vendorCode && (
                  <span className="px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08] text-zinc-400">
                    {primaryGpu.vendorCode}:{primaryGpu.deviceCode || ''}
                  </span>
                )}
              </div>
            </section>

            {/* Physical Storage Architecture */}
            <section
              className={`p-5 rounded-2xl system-card flex flex-col justify-between gap-3.5 transition-all ${cardRing(
                matchesCard(primaryDisk?.model, primaryDisk?.busType, primaryDisk?.mediaType, primaryDisk?.firmwareVersion, primaryDisk?.partitionStyle, 'nvme', 'ssd', 'storage', 'disk')
              )}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-emerald-500/12 border border-emerald-400/25 flex items-center justify-center text-emerald-400 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <ellipse cx="12" cy="5" rx="9" ry="3" />
                      <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
                      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Physical Storage</span>
                    <h3 className="text-sm font-bold text-white truncate">
                      {primaryDisk?.model || 'Host Storage Controller'}
                    </h3>
                  </div>
                </div>
                {onSelectTab ? (
                  <button
                    type="button"
                    onClick={() => onSelectTab('storage-network')}
                    className="neu-btn px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300 hover:bg-emerald-500/25 transition-colors cursor-pointer shrink-0"
                  >
                    Drives →
                  </button>
                ) : (
                  primaryDisk && (
                    <span className="neu-tile px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300 shrink-0">
                      {primaryDisk.healthStatus}
                    </span>
                  )
                )}
              </div>

              <div className="neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col justify-center gap-2.5 flex-1">
                {primaryVol ? (
                  <>
                    <div className="flex items-center justify-between gap-2 text-xs font-mono tabular-nums">
                      <span className="font-bold text-white">
                        {primaryVol.mountpoint}{' '}
                        <span className="text-[10px] font-normal text-zinc-400">({primaryVol.fstype})</span>
                      </span>
                      <span className="text-[11px] font-bold text-emerald-300">
                        {primaryDisk?.healthStatus || 'Healthy'} · {primaryVol.usedPercent}%
                      </span>
                    </div>
                    <div className="neu-inset w-full h-2 rounded-full bg-[#0a0a0e] border border-white/[0.06] overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          primaryVol.usedPercent >= 90 ? 'bg-rose-500' : primaryVol.usedPercent >= 75 ? 'bg-amber-400' : 'soul-gradient-bar'
                        }`}
                        style={{ width: `${Math.min(100, primaryVol.usedPercent)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10.5px] font-mono tabular-nums text-zinc-400">
                      <span>{formatBytes(primaryVol.usedBytes, 1)} / {formatBytes(primaryVol.totalBytes, 1)}</span>
                      <span className="text-zinc-300">{formatBytes(primaryVol.freeBytes, 1)} Free</span>
                    </div>
                  </>
                ) : (
                  <span className="text-xs text-zinc-400">No mounted OS partitions reported</span>
                )}

                {primaryDisk && (
                  <div className="pt-2 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10.5px] font-mono text-zinc-400">
                    <span>FW {primaryDisk.firmwareVersion || 'N/A'}</span>
                    <div className="flex items-center gap-1 min-w-0">
                      <span className="truncate">S/N {maskSerialValue(primaryDisk.serialNumber, revealSerials)}</span>
                      {primaryDisk.serialNumber && (
                        <CopyButton text={primaryDisk.serialNumber} variant="icon-only" className="shrink-0" title="Copy Drive Serial" />
                      )}
                    </div>
                  </div>
                )}
              </div>

              {primaryDisk && (
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-zinc-200">
                  <span className="neu-tile px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">{primaryDisk.busType}</span>
                  <span className="neu-tile px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">{primaryDisk.mediaType}</span>
                  <span className="neu-tile px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">{primaryDisk.partitionStyle}</span>
                  <span className="neu-tile px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">{primaryDisk.sectorAlignment}</span>
                  <span className="neu-tile px-2 py-1 rounded-lg bg-[#16161c] border border-white/[0.08]">{formatBytes(primaryDisk.sizeBytes, 1)}</span>
                </div>
              )}
            </section>

            {/* Peripherals, Battery Health & Dev Runtimes */}
            <section
              className={`p-5 rounded-2xl system-card flex flex-col justify-between gap-3.5 transition-all ${cardRing(
                matchesCard(
                  ...peripherals.audio.map((a) => a.name),
                  ...peripherals.bluetooth.map((b) => b.name),
                  ...runtimes.map((r) => `${r.name} ${r.version}`),
                  'battery',
                  'bluetooth',
                  'audio'
                )
              )}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <span className="w-8 h-8 rounded-lg bg-cyan-500/12 border border-cyan-400/25 flex items-center justify-center text-cyan-300 shrink-0">
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <rect x="3" y="7" width="16" height="10" rx="2" />
                      <line x1="22" y1="10" x2="22" y2="14" />
                      <line x1="7" y1="11" x2="7" y2="13" />
                      <line x1="11" y1="11" x2="11" y2="13" />
                    </svg>
                  </span>
                  <div className="min-w-0">
                    <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Peripherals &amp; Runtimes</span>
                    <h3 className="text-sm font-bold text-white truncate">
                      {peripherals.audio[0]?.name || 'Host Peripherals'}
                    </h3>
                  </div>
                </div>
                {onSelectTab ? (
                  <button
                    type="button"
                    onClick={() => onSelectTab('environment')}
                    className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300 hover:bg-sky-500/25 transition-colors cursor-pointer shrink-0"
                  >
                    Toolchain →
                  </button>
                ) : (
                  <span className="px-2 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300 shrink-0">
                    {peripherals.audio.length + peripherals.cameras.length + peripherals.bluetooth.length} Devices
                  </span>
                )}
              </div>

              <div className="neu-tile p-3.5 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col justify-center gap-2.5 flex-1">
                {battery ? (
                  <div className="flex flex-col gap-1.5 text-[11px] font-mono tabular-nums">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-zinc-400">
                        Battery ({battery.fullChargeCapacityWh ?? '—'}
                        {battery.designCapacityWh ? `/${battery.designCapacityWh}` : ''} Wh)
                      </span>
                      <strong className={live.battery && live.battery.percent <= 20 ? 'text-rose-300' : 'text-emerald-300'}>
                        {live.battery ? `${Math.round(live.battery.percent)}%` : 'Ready'}
                        {battery.healthPercent !== null && battery.healthPercent !== undefined ? ` · ${battery.healthPercent}% Hlt` : ''}
                      </strong>
                    </div>
                    {live.battery && (
                      <div className="neu-inset w-full h-1.5 rounded-full bg-[#0a0a0e] border border-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${
                            live.battery.percent <= 20 ? 'bg-rose-500' : 'bg-emerald-400'
                          }`}
                          style={{ width: `${Math.min(100, live.battery.percent)}%` }}
                        />
                      </div>
                    )}
                    <span className="text-zinc-300">
                      {battery.cycleCount !== null && battery.cycleCount !== undefined ? `${battery.cycleCount} Cycles` : 'Health OK'}
                      {battery.designVoltageV ? ` · ${battery.designVoltageV}V` : ''}
                      {live.battery ? ` · ${live.battery.powerPlugged ? 'AC Connected' : 'Discharging'}` : ''}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-mono text-zinc-400">AC Power Supply (No Battery)</span>
                )}

                <div className="pt-2 border-t border-white/[0.06] flex flex-wrap gap-1.5 text-[10px] font-mono text-zinc-300">
                  <span className="neu-inset px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08]">
                    {peripherals.audio.length} Audio
                  </span>
                  <span className="neu-inset px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08]">
                    {peripherals.usbDevices?.length || peripherals.usbControllers.length} USB
                  </span>
                  <span className="neu-inset px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08]">
                    {peripherals.cameras.length} Camera
                  </span>
                  <span className="neu-inset px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08]">
                    {peripherals.bluetooth.length} Bluetooth
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {runtimes.map((rt) => (
                  <span
                    key={rt.name}
                    className="neu-tile px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300"
                    title={rt.path}
                  >
                    {rt.name} {rt.version}
                  </span>
                ))}
              </div>
            </section>
          </div>
        );
      })()}

      {/* ── Visual Row 4: PCIe Silicon Fabric, Expansion Slots, Board Headers & GPT Partitions ── */}
      {(pcieDevices.length > 0 || expansionSlots.length > 0 || diskPartitions.length > 0) && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Left: PCIe Chipset Silicon & Accelerators */}
          <section
            className={`lg:col-span-7 p-5 rounded-2xl system-card flex flex-col gap-4 transition-all ${cardRing(
              matchesCard(...pcieDevices.flatMap((p) => [p.name, p.vendor, p.vendorCode, p.deviceCode]), 'pcie', 'chipset', 'gna')
            )}`}
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-sky-500/12 border border-sky-400/25 flex items-center justify-center text-sky-400 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 9h16M4 15h16M10 3v18M14 3v18" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">PCI-Express Silicon &amp; Bus Controllers</span>
                  <h2 className="text-sm sm:text-base font-bold text-white truncate">Chipset Engines, Neural &amp; Host Controllers</h2>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="neu-tile px-2.5 py-0.5 rounded-md bg-sky-500/15 border border-sky-400/35 text-[10px] font-mono font-bold text-sky-300">
                  {pcieDevices.length} PCIe Functions
                </span>
                {pcieDevices.length > 12 && (
                  <button
                    type="button"
                    onClick={() => setShowAllPcie((v) => !v)}
                    className="neu-btn px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.1] text-[10px] font-mono font-bold text-zinc-300 hover:text-white cursor-pointer"
                  >
                    {showAllPcie ? 'Show Compact' : `Show All (${pcieDevices.length})`}
                  </button>
                )}
              </div>
            </div>

            {/* Silicon Class Breakdown Summary Bar */}
            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-mono">
              {Object.entries(
                pcieDevices.reduce<Record<string, number>>((acc, dev) => {
                  const key = dev.pnpClass || 'System';
                  acc[key] = (acc[key] || 0) + 1;
                  return acc;
                }, {})
              ).map(([clsName, count]) => (
                <span
                  key={clsName}
                  className="px-2 py-0.5 rounded-md bg-[#16161c] border border-white/[0.08] text-zinc-300"
                >
                  {clsName}: <strong className="text-sky-300">{count}</strong>
                </span>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {(showAllPcie ? pcieDevices : pcieDevices.slice(0, 12)).map((dev, idx) => (
                <div
                  key={`${dev.pnpId}-${idx}`}
                  className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06] hover:border-white/[0.14] flex flex-col justify-between gap-2 transition-colors min-w-0"
                >
                  <span className="text-xs font-semibold text-white leading-snug line-clamp-2" title={dev.name}>
                    {dev.name}
                  </span>
                  <div className="flex items-center justify-between gap-2 text-[10px] font-mono">
                    <span className="text-zinc-400 truncate">
                      {dev.vendor} · {dev.pnpClass}
                    </span>
                    {showHardwareCodes && dev.vendorCode && (
                      <code className="px-1.5 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08] text-[9.5px] text-zinc-400 shrink-0">
                        {dev.vendorCode}:{dev.deviceCode || '—'}
                      </code>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Right: PCIe Slots, Physical Network Radios, GPT Partitions & Board Headers */}
          <section
            className={`lg:col-span-5 p-5 rounded-2xl system-card flex flex-col gap-3.5 transition-all ${cardRing(
              matchesCard(
                ...expansionSlots.map((s) => s.name),
                ...boardConnectors.flatMap((c) => [c.externalName, c.internalName, c.kind]),
                ...physicalNetworkHw.map((n) => n.name),
                'slot',
                'efi',
                'partition',
                'mac'
              )
            )}`}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="w-8 h-8 rounded-lg bg-purple-500/12 border border-purple-400/25 flex items-center justify-center text-purple-300 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="3" y="4" width="18" height="16" rx="2" />
                    <path d="M7 9h10M7 13h6" />
                  </svg>
                </span>
                <div className="min-w-0">
                  <span className="block text-[10px] font-mono uppercase tracking-wider text-zinc-400">Board Topology &amp; Partitions</span>
                  <h2 className="text-sm sm:text-base font-bold text-white truncate">PCIe Lanes, Radios &amp; GPT Layout</h2>
                </div>
              </div>
              <span className="px-2 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/35 text-[10px] font-mono font-bold text-emerald-300 shrink-0">
                {expansionSlots.filter((s) => s.inUse).length}/{expansionSlots.length} Lanes Active
              </span>
            </div>

            {/* Expansion Slots 2-Column Compact Grid */}
            {expansionSlots.length > 0 && (
              <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">PCIe Expansion &amp; M.2 Slots</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 text-[10px] font-mono">
                  {expansionSlots.map((sl, idx) => (
                    <span
                      key={`${sl.name}-${idx}`}
                      className={`px-2 py-1 rounded-lg border truncate ${
                        sl.inUse
                          ? 'sm:col-span-2 bg-emerald-500/15 border-emerald-500/35 text-emerald-300 font-bold'
                          : 'bg-[#0a0a0e] border-white/[0.08] text-zinc-400'
                      }`}
                    >
                      {sl.name} ({sl.widthLabel}) · {sl.statusLabel}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* GPT Disk Partitions */}
            {diskPartitions.length > 0 && (
              <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Low-Level GPT Partitions</span>
                <div className="flex flex-col gap-1.5 text-[11px] font-mono tabular-nums">
                  {diskPartitions.map((pt) => {
                    const roleLabel = pt.isSystem
                      ? 'EFI System Partition'
                      : pt.isBoot
                        ? 'Windows OS (Boot)'
                        : pt.type === 'Partition'
                          ? 'GPT Volume'
                          : pt.type;
                    return (
                      <div key={`${pt.diskNumber}-${pt.partitionNumber}`} className="flex items-center justify-between gap-2">
                        <span className="text-zinc-200 truncate">
                          P{pt.partitionNumber}:{' '}
                          <strong className="text-white">{pt.driveLetter ? `${pt.driveLetter} ` : ''}{roleLabel}</strong>
                        </span>
                        <span className="text-sky-300 font-bold shrink-0">{formatBytes(pt.sizeBytes, 1)}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Physical Network Silicon */}
            {physicalNetworkHw.length > 0 && (
              <div className="neu-tile p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Physical Network Silicon</span>
                <div className="flex flex-col gap-2">
                  {physicalNetworkHw.map((nic, idx) => (
                    <div key={`${nic.pnpId}-${idx}`} className="flex items-start justify-between gap-2 text-[11px]">
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 ${nic.connected ? 'bg-emerald-400' : 'bg-zinc-600'}`}
                          title={nic.connected ? 'Connected' : 'Standby'}
                        />
                        <span className="text-white font-medium leading-snug line-clamp-1" title={nic.name}>
                          {nic.name}
                        </span>
                      </div>
                      <code className="text-[10px] font-mono text-zinc-400 shrink-0">
                        {nic.macAddress || (nic.connected ? 'Linked' : 'Standby')}
                      </code>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Internal Headers & External Connectors inside Framed Card */}
            {boardConnectors.length > 0 && (
              <div className="p-3 rounded-xl bg-[#16161c] border border-white/[0.06] flex flex-col gap-2 mt-auto">
                <span className="text-[10px] font-mono uppercase tracking-wider text-zinc-400">Motherboard Ports &amp; Headers</span>
                <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-zinc-300">
                  {boardConnectors.map((cn, idx) => (
                    <span key={idx} className="px-2 py-0.5 rounded bg-[#0a0a0e] border border-white/[0.08]">
                      {[cn.externalName, cn.internalName].filter(Boolean).join(' / ') || cn.kind}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {/* ── Centerpiece: Master In-Place (+ / -) Expandable Hardware Specification Table ── */}
      <div ref={tableAnchorRef}>
        <HardwareDetailsTable
          title="Master Host Hardware & Telemetry Specifications"
          subtitle="Click + on any row (or Expand All) to inspect complete live specifications, hardware codes, peripherals, PCIe silicon, and runtimes in place."
          rows={masterRows}
          defaultExpandedIds={['cpu-silicon', 'memory-dimms']}
          onClearFilter={() => setSearchQuery('')}
        />
      </div>
    </div>
  );
}
