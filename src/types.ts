export interface MarkdownBlock {
  type: string;
  text?: string;
  language?: string;
  number?: number;
  headers?: string[];
  rows?: string[][];
  calloutType?: 'note' | 'tip' | 'important' | 'warning' | 'caution';
  items?: MarkdownBlock[];
  ordered?: boolean;
}

export interface AstSymbol {
  name: string;
  kind?: string;
  language?: string;
  signature?: string;
  docstring?: string;
}

export interface PackagePreviewFile {
  name: string;
  ext: string;
  sizeBytes: number;
  content: string;
}

export interface PackagePreviewManifest {
  title?: string;
  subtitle?: string;
  domain?: string;
  layer?: string;
  runtime?: string;
  localModels?: string[];
  cloudApis?: string[];
  usedIn?: string[];
  features?: string[];
  commands?: string[];
  script?: string;
  runCommand?: string;
  demoCommand?: string;
  jsonDemoCommand?: string;
  sampleInputs?: Record<string, unknown>;
}

export interface PackagePreviewData {
  hasPreview: boolean;
  folder: string;
  manifest?: PackagePreviewManifest | null;
  files: PackagePreviewFile[];
}

export interface PackageData {
  id: string;
  name: string;
  displayName?: string;
  description?: string;
  version?: string;
  license?: string;
  exports?: string[];
  pythonExports?: string[];
  typeScriptExports?: string[];
  readmeBlocks?: MarkdownBlock[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  peerDependencies?: Record<string, string>;
  hasNpmManifest?: boolean;
  hasPythonManifest?: boolean;
  pythonName?: string | null;
  pythonModule?: string | null;
  pythonDependencies?: string[];
  symbols?: AstSymbol[];
  preview?: PackagePreviewData;
  updatedAt?: string;
  relativeTime?: string;
  commitHash?: string;
}

export interface ProjectData {
  id: string;
  title: string;
  logo?: string;
  frontendPort?: number | null;
  backendPort?: number | null;
  frontendActive?: boolean;
  backendActive?: boolean;
  frontend?: { port?: number | null; isLive?: boolean };
  backend?: { port?: number | null; isLive?: boolean };
  frontendCmd?: string;
  backendCmd?: string | null;
  framework?: string;
  dbInfo?: string;
  aiEngine?: string;
  description?: string;
  version?: string;
  features?: string[];
  apiEndpoints?: string[];
  localServices?: Record<string, string>;
  configuration?: string[];
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  readmeBlocks?: MarkdownBlock[];
  fileTree?: string[];
  envKeys?: string[];
  tables?: string[];
  tags?: string[];
  updatedAt?: string;
  relativeTime?: string;
  commitHash?: string;
}

export interface StatsData {
  packagesCount?: number;
  projectsCount?: number;
  totalFiles?: number;
  totalLines?: number;
  totalSymbols?: number;
  totalBytes?: number;
}

export interface WorkspaceData {
  packages: PackageData[];
  projects?: ProjectData[];
  rootWorkspaces?: string[];
  rootScripts?: Record<string, string>;
  guideBlocks?: MarkdownBlock[];
  portGuideBlocks?: MarkdownBlock[];
  techStackBlocks?: MarkdownBlock[];
  projectRulesBlocks?: MarkdownBlock[];
  cheatsheetBlocks?: MarkdownBlock[];
  docsHierarchy?: any[];
  docsBlocksMap?: Record<string, MarkdownBlock[]>;
  stats?: StatsData;
}

// ---------------------------------------------------------------------------
// Computer & Performance Monitor Types (100% Live OS & Hardware Telemetry)
// ---------------------------------------------------------------------------

export interface SystemHostSpec {
  hostname: string;
  manufacturer: string;
  model: string;
  family?: string | null;
  sku?: string | null;
  chassisType: string;
  chassisCode?: string | null;
  serialNumber?: string | null;
  architecture: string;
  systemType: string;
  osName: string;
  osVersion: string;
  osBuild: string;
  osInstallDate?: string | null;
  bootTimeEpoch: number;
  bootTimeIso: string;
  timezone: string;
  powerPlan: string;
  secureBoot: string;
  defenderAntivirus?: boolean | null;
  defenderRealTime?: boolean | null;
  defenderSignatureVersion?: string | null;
  defenderSignatureAgeDays?: number | null;
  defenderQuickScanAgeDays?: number | null;
  sleepStates?: string[];
  pagefile?: {
    path: string;
    allocatedMB: number;
    currentMB: number;
    peakMB: number;
  } | null;
}

export interface TpmSpec {
  name: string;
  manufacturer?: string;
  status: string;
  pnpId?: string | null;
}

export interface MotherboardSpec {
  manufacturer: string;
  product: string;
  version: string;
  serialNumber?: string | null;
  biosVendor: string;
  biosVersion: string;
  biosReleaseDate?: string | null;
  ecVersion?: string | null;
  tpm?: TpmSpec | null;
}

export interface CpuSpec {
  name: string;
  vendor: string;
  caption: string;
  microarchitecture?: string | null;
  siliconStepping?: string | null;
  processorId?: string | null;
  socket: string;
  socketPackage: string;
  physicalCores: number;
  logicalThreads: number;
  topologyMode: string;
  performanceCores: number;
  efficientCores: number;
  maxClockMHz: number;
  extClockMHz?: number | null;
  coreVoltageV?: number | null;
  l1CacheKB: number;
  l2CacheKB: number;
  l3CacheKB: number;
  addressWidth: number;
  dataWidth: number;
  virtualizationEnabled?: boolean | null;
  hypervisorPresent?: boolean;
  instructionSets?: string[];
}

export interface MemoryModuleSpec {
  slotIndex: number;
  slotName: string;
  deviceLocator: string;
  manufacturer: string;
  manufacturerCode: string;
  partNumber: string;
  serialNumber?: string | null;
  capacityBytes: number;
  capacityGB: number;
  ddrType: string;
  smbiosCode?: string | null;
  formFactor: string;
  formFactorCode?: string | null;
  ratedSpeedMTs: number;
  configuredSpeedMTs: number;
  voltageV?: number | null;
  dataWidthBits: number;
  totalWidthBits: number;
  eccStatus: string;
  rank?: string | null;
}

export interface MemorySpec {
  installedBytes: number;
  usableBytes: number;
  reservedBytes: number;
  totalSlots: number;
  populatedSlots: number;
  maxCapacityGB?: number | null;
  channelMode: string;
  ddrType: string;
  formFactor: string;
  configuredSpeedMTs?: number | null;
  modules: MemoryModuleSpec[];
}

export interface GpuSpec {
  name: string;
  role: 'Integrated' | 'Discrete' | 'Virtual' | string;
  vendor: string;
  vendorCode?: string | null;
  deviceCode?: string | null;
  videoProcessor: string;
  dacType: string;
  vramBytes: number;
  vramMode: string;
  driverVersion: string;
  driverDate?: string | null;
  infFilename?: string | null;
  hasNvidiaSmi?: boolean;
}

export interface DisplaySpec {
  name: string;
  deviceName: string;
  primary: boolean;
  nativeWidth?: number | null;
  nativeHeight?: number | null;
  logicalWidth?: number | null;
  logicalHeight?: number | null;
  refreshRateHz?: number | null;
  bitsPerPixel?: number | null;
  aspectRatio?: string | null;
  scalePercent?: number | null;
  diagonalInches?: number | null;
  ppi?: number | null;
  panelManufacturer?: string | null;
  panelModel?: string | null;
  manufactureYear?: number | null;
}

export interface PhysicalDiskSpec {
  model: string;
  mediaType: string;
  busType: string;
  busCode?: string;
  healthStatus: string;
  operationalStatus: string;
  sizeBytes: number;
  firmwareVersion?: string | null;
  serialNumber?: string | null;
  partitionStyle: string;
  logicalSectorSize: number;
  physicalSectorSize: number;
  sectorAlignment: string;
}

export interface BatteryStaticSpec {
  name: string;
  status: string;
  chemistry: string;
  fullChargeCapacityMWh?: number | null;
  fullChargeCapacityWh?: number | null;
  designCapacityMWh?: number | null;
  designCapacityWh?: number | null;
  healthPercent?: number | null;
  wearPercent?: number | null;
  manufactureDate?: string | null;
  location?: string | null;
  cycleCount?: number | null;
  designVoltageV?: number | null;
}

export interface PeripheralDeviceSpec {
  name: string;
  manufacturer: string;
  status?: string;
  class?: string;
  vendor?: string | null;
  code?: string | null;
}

export interface NetworkProfileSpec {
  name: string;
  interfaceAlias: string;
  category: string;
  connectivity: string;
}

export interface RuntimeToolSpec {
  name: string;
  binary?: string;
  category?: string;
  version: string;
  path: string;
  sizeBytes?: number | null;
}

export interface StartupAppSpec {
  name: string;
  command: string;
  location: string;
  locationType: string;
  scopeCategory?: string;
  user?: string | null;
  enabled?: boolean;
  disabledAt?: string | null;
  executable?: string | null;
  arguments?: string | null;
  fileExists?: boolean;
  fileSizeBytes?: number | null;
  publisher?: string | null;
  description?: string | null;
  version?: string | null;
}

export interface SystemServiceSpec {
  name: string;
  displayName: string;
  description?: string | null;
  status: string;
  startType: string;
  startModeLabel?: string;
  delayedAutoStart?: boolean;
  pid?: number | null;
  sharedHostCount?: number;
  memoryBytes?: number | null;
  account?: string | null;
  binPath?: string | null;
  executable?: string | null;
  arguments?: string | null;
  publisher?: string | null;
  isMicrosoft?: boolean;
  dependencies?: string[];
  serviceGroup?: string | null;
}

export interface ScheduledTaskSpec {
  name: string;
  taskPath: string;
  state: string;
  enabled: boolean;
  author?: string | null;
  description?: string | null;
  triggers: string[];
  command?: string | null;
  category: string;
  isVendorTask: boolean;
}

export interface SystemDriverSpec {
  name: string;
  displayName: string;
  state: string;
  startMode: string;
  serviceType: string;
  pathName?: string | null;
  isThirdParty: boolean;
}

export interface PathEntrySpec {
  index: number;
  path: string;
  exists: boolean;
  scope: string;
  registrySource?: string;
  executableCount?: number;
  sampleExecutables?: string[];
}

export interface EnvVarSpec {
  key: string;
  value: string;
  isSensitive: boolean;
  source?: string;
  category?: string;
}

export interface ShellProfileSpec {
  comspec: string;
  pathext: string[];
  tempDir: string;
  userProfile: string;
  preferredEncoding: string;
  fsEncoding: string;
  virtualEnv?: string | null;
  machineRegistryCount: number;
  userRegistryCount: number;
}

export interface SystemEnvironmentSpec {
  pathEntries: PathEntrySpec[];
  envVars: EnvVarSpec[];
  totalEnvCount: number;
  missingPathCount: number;
  duplicatePathCount?: number;
  totalExecutablesInPath?: number;
  shellProfile?: ShellProfileSpec;
}

export interface PcieDeviceSpec {
  name: string;
  vendor: string;
  vendorCode?: string | null;
  deviceCode?: string | null;
  pnpClass: string;
  status: string;
  pnpId: string;
}

export interface ExpansionSlotSpec {
  name: string;
  inUse: boolean;
  statusLabel: string;
  widthLabel: string;
}

export interface BoardConnectorSpec {
  externalName: string;
  internalName: string;
  kind: string;
}

export interface DiskPartitionSpec {
  diskNumber: number;
  partitionNumber: number;
  driveLetter?: string | null;
  type: string;
  sizeBytes: number;
  isBoot: boolean;
  isSystem: boolean;
}

export interface PhysicalNetworkHwSpec {
  name: string;
  manufacturer: string;
  macAddress?: string | null;
  speedMbps?: number | null;
  connected: boolean;
  pnpId: string;
}

export type HistoryWindowSec = 60 | 300 | 900;

export interface SystemEventSpec {
  id: number;
  level: string;
  provider: string;
  timestamp: string;
  message: string;
}

export interface NetworkGatewaySpec {
  interfaceAlias: string;
  description: string;
  ipv4Gateway?: string | null;
  dnsServers: string[];
}

export interface SensorCapabilitiesSpec {
  thermalAvailable: boolean;
  nvmeSmartAvailable: boolean;
  batteryWearAvailable: boolean;
  elevationRequiredForSmartThermal: boolean;
}

export interface DnsServerEntry {
  interfaceAlias: string;
  servers: string[];
}

export interface SystemSpecs {
  scannedAtIso: string;
  host: SystemHostSpec;
  motherboard: MotherboardSpec;
  cpu: CpuSpec;
  memory: MemorySpec;
  graphics: GpuSpec[];
  displays: DisplaySpec[];
  physicalDisks: PhysicalDiskSpec[];
  battery?: BatteryStaticSpec | null;
  networkProfiles: NetworkProfileSpec[];
  peripherals: {
    audio: PeripheralDeviceSpec[];
    usbControllers: PeripheralDeviceSpec[];
    usbDevices?: PeripheralDeviceSpec[];
    cameras: PeripheralDeviceSpec[];
    bluetooth: PeripheralDeviceSpec[];
    biometrics: PeripheralDeviceSpec[];
    keyboards?: PeripheralDeviceSpec[];
    pointingDevices?: PeripheralDeviceSpec[];
  };
  pcieDevices?: PcieDeviceSpec[];
  expansionSlots?: ExpansionSlotSpec[];
  boardConnectors?: BoardConnectorSpec[];
  diskPartitions?: DiskPartitionSpec[];
  physicalNetworkHw?: PhysicalNetworkHwSpec[];
  dnsServers?: DnsServerEntry[];
  networkGateways?: NetworkGatewaySpec[];
  systemEvents?: SystemEventSpec[];
  sensorCapabilities?: SensorCapabilitiesSpec;
  startupApps?: StartupAppSpec[];
  services?: SystemServiceSpec[];
  scheduledTasks?: ScheduledTaskSpec[];
  systemDrivers?: SystemDriverSpec[];
  environment?: SystemEnvironmentSpec;
  runtimes: RuntimeToolSpec[];
}

export interface LogicalVolumeSpec {
  device: string;
  mountpoint: string;
  fstype: string;
  totalBytes: number;
  usedBytes: number;
  freeBytes: number;
  usedPercent: number;
}

export interface NetworkAdapterLive {
  name: string;
  isUp: boolean;
  speedMbps: number;
  mtu: number;
  ipv4?: string | null;
  ipv6?: string | null;
  mac?: string | null;
  bytesRecv: number;
  bytesSent: number;
  rxKBps?: number;
  txKBps?: number;
}

export interface WifiInterfaceLive {
  name: string;
  description?: string;
  state?: string;
  ssid?: string;
  bssid?: string;
  radioType?: string;
  standardLabel?: string;
  authentication?: string;
  channel?: number | null;
  band?: string;
  rxRateMbps?: number | null;
  txRateMbps?: number | null;
  signalPercent?: number | null;
}

export interface NvidiaGpuSensor {
  name: string;
  utilizationPercent?: number | null;
  vramUsedMB?: number | null;
  vramTotalMB?: number | null;
  temperatureC?: number | null;
  powerWatts?: number | null;
  clockMHz?: number | null;
  fanPercent?: number | null;
}

export interface GpuLiveTelemetry {
  utilizationPercent?: number | null;
  dedicatedUsedBytes?: number | null;
  sharedUsedBytes?: number | null;
  engines?: Record<string, number> | null;
  nvidiaSensors?: NvidiaGpuSensor[] | null;
}

export interface ProcessMetric {
  pid: number;
  ppid?: number | null;
  parentName?: string | null;
  name: string;
  cpuPercent: number;
  memoryBytes: number;
  memoryMB: number;
  ioReadBps?: number;
  ioWriteBps?: number;
  ioReadBytes?: number;
  ioWriteBytes?: number;
  threads: number;
  status: string;
  username?: string | null;
  exePath?: string | null;
  cmdline?: string | null;
  startedAt?: string | null;
  ports: number[];
}

export interface ActivePortMetric {
  port: number;
  protocol: string;
  address: string;
  family?: string;
  exposure?: string;
  pid?: number | null;
  processName?: string | null;
  exePath?: string | null;
  memoryMB?: number | null;
  serviceLabel: string;
  isDevPortal: boolean;
  isWorkspaceApp: boolean;
}

export interface ActiveConnectionMetric {
  protocol: string;
  localAddress: string;
  localPort: number;
  remoteAddress: string;
  remotePort: number;
  remoteScope: string;
  remoteService?: string | null;
  status: string;
  pid?: number | null;
  processName?: string | null;
  exePath?: string | null;
}

export interface TelemetryHistoryPoint {
  timestampIso: string;
  timeLabel: string;
  cpuPercent: number;
  ramPercent: number;
  gpuPercent?: number | null;
  diskReadMBps: number;
  diskWriteMBps: number;
  netRxKBps: number;
  netTxKBps: number;
}

export interface SystemLiveSnapshot {
  timestampIso: string;
  uptimeSeconds: number;
  cpu: {
    totalPercent: number;
    perCorePercent: number[];
    currentClockMHz: number;
    userPercent: number;
    systemPercent: number;
    idlePercent: number;
    contextSwitchesPerSec: number;
    interruptsPerSec: number;
  };
  memory: {
    totalBytes: number;
    usedBytes: number;
    availableBytes: number;
    freeBytes: number;
    percent: number;
  };
  swap: {
    totalBytes: number;
    usedBytes: number;
    freeBytes: number;
    percent: number;
  };
  disk: {
    readMBps: number;
    writeMBps: number;
    readIops: number;
    writeIops: number;
    totalReadBytes: number;
    totalWriteBytes: number;
    volumes: LogicalVolumeSpec[];
  };
  network: {
    rxKBps: number;
    txKBps: number;
    totalRecvBytes: number;
    totalSentBytes: number;
    dropsIn: number;
    dropsOut: number;
    errorsIn: number;
    errorsOut: number;
  };
  battery?: {
    percent: number;
    powerPlugged: boolean;
    secsLeft?: number | null;
    statusLabel: string;
  } | null;
  gpu: GpuLiveTelemetry;
  networkAdapters: NetworkAdapterLive[];
  wifiInterfaces: WifiInterfaceLive[];
  connectedWifi?: WifiInterfaceLive | null;
  socketCounts: {
    established: number;
    listening: number;
    timeWait: number;
    closeWait?: number;
    total: number;
  };
  activePorts: ActivePortMetric[];
  activeConnections?: ActiveConnectionMetric[];
  processes: ProcessMetric[];
  topCpu: ProcessMetric[];
  topMemory: ProcessMetric[];
  topDiskIo?: ProcessMetric[];
  totalProcessesCount: number;
  totalThreadsCount?: number;
  windowSec?: number;
  historyTotalSamples?: number;
  healthPosture: {
    label: string;
    severity: 'optimal' | 'warn' | 'critical';
    reasons: string[];
  };
  history: TelemetryHistoryPoint[];
  peaks: {
    cpuPeakPercent: number;
    cpuAvgPercent: number;
    ramPeakPercent: number;
    diskReadPeakMBps: number;
    diskWritePeakMBps: number;
    netRxPeakKBps: number;
    netTxPeakKBps: number;
  };
}

export interface SystemOverviewResponse {
  specs: SystemSpecs;
  live: SystemLiveSnapshot;
}
