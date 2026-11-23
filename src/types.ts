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
}

export interface ProjectData {
  id: string;
  title: string;
  logo?: string;
  frontendPort?: number | null;
  backendPort?: number | null;
  frontendActive?: boolean;
  backendActive?: boolean;
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
  stats?: StatsData;
}
