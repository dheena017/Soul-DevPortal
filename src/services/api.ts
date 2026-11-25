/**
 * Soul DevPortal - FastAPI Backend API Client Service
 * Connects frontend to http://localhost:8008 (via /api reverse proxy or direct endpoint)
 */

import { PackageData, ProjectData, StatsData, MarkdownBlock } from '../types';

const API_BASE = '/api';

export interface WorkspaceApiResponse {
  meta: {
    generator: string;
    version: string;
    scannedAt: string;
  };
  packages: PackageData[];
  projects: ProjectData[];
  rootWorkspaces: string[];
  rootScripts: Record<string, string>;
  guideBlocks: MarkdownBlock[];
  portGuideBlocks: MarkdownBlock[];
  techStackBlocks: MarkdownBlock[];
  projectRulesBlocks: MarkdownBlock[];
  cheatsheetBlocks: MarkdownBlock[];
  docsHierarchy?: any[];
  docsBlocksMap?: Record<string, MarkdownBlock[]>;
  stats: StatsData;
}

export interface ApiGuideMeta {
  id: string;
  title: string;
  filename: string;
  description: string;
  badge?: string;
  category?: string;
  icon?: string;
  blocks?: MarkdownBlock[];
}

export interface ApiHealthResponse {
  status: string;
  timestamp: string;
  version: string;
  services: {
    astEngine: string;
    socketProber: string;
  };
}

/**
 * Checks if the FastAPI backend server is alive and reachable.
 */
export async function fetchBackendHealthStatus(): Promise<{ live: boolean; port?: number; version?: string }> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) return { live: false };
    const data = await res.json();
    return {
      live: data.status === 'healthy',
      port: typeof data.port === 'number' ? data.port : undefined,
      version: typeof data.version === 'string' ? data.version : undefined,
    };
  } catch {
    return { live: false };
  }
}

export async function checkBackendHealth(): Promise<boolean> {
  const status = await fetchBackendHealthStatus();
  return status.live;
}

/**
 * Fetches the complete workspace AST & metadata bundle from FastAPI.
 */
export async function fetchWorkspaceData(): Promise<WorkspaceApiResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/workspace`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    return await res.json();
  } catch (err) {
    console.warn('[DevPortal API] Could not connect to FastAPI backend:', err);
    return null;
  }
}

/**
 * Fetches live projects and real-time socket health from FastAPI.
 */
export async function fetchProjectsLive(): Promise<ProjectData[]> {
  try {
    const res = await fetch(`${API_BASE}/projects`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Fetches package list and AST symbols from FastAPI.
 */
export async function fetchPackages(): Promise<PackageData[]> {
  try {
    const res = await fetch(`${API_BASE}/packages`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Fetches package detail by ID.
 */
export async function fetchPackageDetail(id: string): Promise<PackageData | null> {
  try {
    const res = await fetch(`${API_BASE}/packages/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches documentation guides catalog from FastAPI.
 */
export async function fetchDocsCatalog(): Promise<ApiGuideMeta[]> {
  try {
    const res = await fetch(`${API_BASE}/docs`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Fetches content for a specific guide by ID.
 */
export async function fetchGuideContent(id: string): Promise<ApiGuideMeta | null> {
  try {
    const res = await fetch(`${API_BASE}/docs/${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches the 4-category hierarchical docs navigation tree with topics and tabs.
 */
export async function fetchDocsNavigation(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/docs/navigation`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Fetches structured markdown blocks for a subfolder topic tab (e.g. project-api/main).
 */
export async function fetchDocTabContent(category: string, topic: string, tab: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/docs/details/${encodeURIComponent(category)}/${encodeURIComponent(topic)}/${encodeURIComponent(tab)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches structured markdown blocks for a category root file (e.g. golden-rules).
 */
export async function fetchDocFileContent(category: string, docName: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/docs/details/${encodeURIComponent(category)}/${encodeURIComponent(docName)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Triggers an on-demand AST re-scan on the FastAPI backend.
 */
export async function triggerWorkspaceRefresh(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/workspace/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    return res.ok;
  } catch {
    return false;
  }
}

/**
 * Fetches the master dashboard overview contract (Projects, Packages, Docs, Commands, Telemetry).
 */
export async function fetchDashboardOverview(): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/dashboard/overview`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches all lifecycle runner commands from root package.json.
 */
export async function fetchPortalCommands(): Promise<{ commands: any[]; rawScripts: Record<string, string> } | null> {
  try {
    const res = await fetch(`${API_BASE}/soul-dev-portal/commands`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches dynamic navigation tree for projects and their available tabs.
 */
export async function fetchProjectsNavigation(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/projects/navigation`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Probes real-time socket reachability for a specific project.
 */
export async function fetchProjectHealth(projectName: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/projects/${encodeURIComponent(projectName)}/health`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches granular tab content for a project (overview, api, database, env, scripts, files, readme).
 */
export async function fetchProjectTab(projectName: string, tab: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/projects/details/${encodeURIComponent(projectName)}/${encodeURIComponent(tab)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches dynamic navigation tree for packages.
 */
export async function fetchPackagesNavigation(): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}/packages/navigation`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return [];
    return await res.json();
  } catch {
    return [];
  }
}

/**
 * Fetches granular tab content for a package (docs, api, manifest, playground).
 */
export async function fetchPackageTab(packageName: string, tab: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/packages/details/${encodeURIComponent(packageName)}/${encodeURIComponent(tab)}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Fetches structured GFM AST blocks for a doc tab under a subfolder topic.
 */
export async function fetchDocTab(category: string, topic: string, tab: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${API_BASE}/docs/details/${encodeURIComponent(category)}/${encodeURIComponent(topic)}/${encodeURIComponent(tab)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}


export async function fetchSystemOverview(windowSec = 60): Promise<import('../types').SystemOverviewResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/system/overview?window_sec=${windowSec}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as import('../types').SystemOverviewResponse;
  } catch {
    return null;
  }
}

export async function fetchSystemSpecs(): Promise<import('../types').SystemSpecs | null> {
  try {
    const res = await fetch(`${API_BASE}/system/specs`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as import('../types').SystemSpecs;
  } catch {
    return null;
  }
}

export async function fetchSystemLive(windowSec = 60): Promise<import('../types').SystemLiveSnapshot | null> {
  try {
    const res = await fetch(`${API_BASE}/system/live?window_sec=${windowSec}`, {
      method: 'GET',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as import('../types').SystemLiveSnapshot;
  } catch {
    return null;
  }
}

export function subscribeSystemStream(
  intervalMs: number,
  windowSec: number,
  onData: (snapshot: import('../types').SystemLiveSnapshot) => void,
  onError: () => void
): () => void {
  if (typeof EventSource === 'undefined') {
    onError();
    return () => {};
  }
  const url = `${API_BASE}/system/stream?interval_ms=${Math.max(1000, intervalMs)}&window_sec=${windowSec}`;
  const source = new EventSource(url);
  source.onmessage = (evt) => {
    try {
      const parsed = JSON.parse(evt.data) as import('../types').SystemLiveSnapshot;
      onData(parsed);
    } catch {
      // Ignore malformed chunk
    }
  };
  source.onerror = () => {
    source.close();
    onError();
  };
  return () => {
    source.close();
  };
}

export async function refreshSystemSpecs(): Promise<{ success: boolean; specs?: import('../types').SystemSpecs } | null> {
  try {
    const res = await fetch(`${API_BASE}/system/refresh`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as { success: boolean; specs?: import('../types').SystemSpecs };
  } catch {
    return null;
  }
}

export interface DesktopArtifact {
  name: string;
  variant: 'setup' | 'portable';
  sizeBytes: number;
  sizeLabel: string;
  downloadUrl: string;
  modifiedAt: string;
}

export interface DesktopInfoResponse {
  available: boolean;
  recommendedVariant: 'setup' | 'portable' | null;
  primaryDownloadUrl: string | null;
  artifacts: DesktopArtifact[];
  githubReleasesUrl: string;
  buildCommand: string;
  launchCommand: string;
  shortcutSupported?: boolean;
  shortcutInstalled?: boolean;
  desktopShortcutPath?: string | null;
  canLaunchDesktop?: boolean;
}

export async function fetchDesktopInfo(): Promise<DesktopInfoResponse | null> {
  try {
    const res = await fetch(`${API_BASE}/soul-dev-portal/desktop-info`, {
      headers: { Accept: 'application/json' },
    });
    if (!res.ok) return null;
    return (await res.json()) as DesktopInfoResponse;
  } catch {
    return null;
  }
}

export async function createDesktopShortcut(): Promise<{
  success: boolean;
  desktopShortcut?: string;
  startMenuShortcut?: string | null;
  error?: string;
} | null> {
  try {
    const res = await fetch(`${API_BASE}/soul-dev-portal/desktop-shortcut`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    return await res.json();
  } catch {
    return null;
  }
}

export async function launchDesktopApp(): Promise<{ launched: boolean; error?: string } | null> {
  try {
    const res = await fetch(`${API_BASE}/soul-dev-portal/desktop-launch`, {
      method: 'POST',
      headers: { Accept: 'application/json' },
    });
    return await res.json();
  } catch {
    return null;
  }
}
