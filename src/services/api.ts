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
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/health`, { method: 'GET', headers: { Accept: 'application/json' } });
    if (!res.ok) return false;
    const data = await res.json();
    return data.status === 'healthy';
  } catch {
    return false;
  }
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
