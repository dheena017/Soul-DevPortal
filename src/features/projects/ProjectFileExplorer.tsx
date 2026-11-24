import React, { useState, useMemo } from 'react';
import CopyButton from '../../components/CopyButton';

export interface ProjectFileExplorerProps {
  fileTree: string[];
  projectId: string;
}

export interface TreeNode {
  id: string; // full relative path, e.g. "client/src/App.tsx"
  name: string; // display segment name, e.g. "App.tsx"
  path: string;
  isDir: boolean;
  extension?: string;
  depth: number;
  children: TreeNode[];
  itemCount: number;
}

// Helper to determine file icon and color category
function getFileMeta(fileName: string, isDir: boolean) {
  if (isDir) {
    return {
      type: 'dir',
      label: 'DIR',
      color: '#f59e0b',
      bgColor: 'rgba(245, 158, 11, 0.1)',
      borderColor: 'rgba(245, 158, 11, 0.25)',
    };
  }

  const lowerName = fileName.toLowerCase();
  if (lowerName === 'license') {
    return { type: 'md', label: 'LIC', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.3)' };
  }
  if (lowerName === 'dockerfile') {
    return { type: 'cfg', label: 'DOCK', color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' };
  }

  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';

  switch (ext) {
    case 'ts':
      return { type: 'ts', label: 'TS', color: '#60a5fa', bgColor: 'rgba(96, 165, 250, 0.12)', borderColor: 'rgba(96, 165, 250, 0.3)' };
    case 'tsx':
      return { type: 'tsx', label: 'TSX', color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' };
    case 'js':
    case 'mjs':
    case 'cjs':
      return { type: 'js', label: 'JS', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.3)' };
    case 'jsx':
      return { type: 'jsx', label: 'JSX', color: '#f59e0b', bgColor: 'rgba(245, 158, 11, 0.12)', borderColor: 'rgba(245, 158, 11, 0.3)' };
    case 'py':
      return { type: 'py', label: 'PY', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.3)' };
    case 'json':
      return { type: 'json', label: 'JSON', color: '#34d399', bgColor: 'rgba(52, 211, 153, 0.12)', borderColor: 'rgba(52, 211, 153, 0.3)' };
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return { type: 'css', label: 'CSS', color: '#c084fc', bgColor: 'rgba(192, 132, 252, 0.12)', borderColor: 'rgba(192, 132, 252, 0.3)' };
    case 'html':
    case 'htm':
      return { type: 'html', label: 'HTML', color: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.12)', borderColor: 'rgba(251, 146, 60, 0.3)' };
    case 'md':
    case 'mdx':
      return { type: 'md', label: 'MD', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.3)' };
    case 'db':
    case 'sqlite':
    case 'sqlite3':
    case 'sql':
      return { type: 'db', label: 'SQL', color: '#818cf8', bgColor: 'rgba(129, 140, 248, 0.12)', borderColor: 'rgba(129, 140, 248, 0.3)' };
    case 'yaml':
    case 'yml':
    case 'toml':
    case 'env':
    case 'lock':
      return { type: 'cfg', label: 'CFG', color: '#fb923c', bgColor: 'rgba(251, 146, 60, 0.12)', borderColor: 'rgba(251, 146, 60, 0.3)' };
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'svg':
    case 'ico':
    case 'webp':
      return { type: 'img', label: 'IMG', color: '#f472b6', bgColor: 'rgba(244, 114, 182, 0.12)', borderColor: 'rgba(244, 114, 182, 0.3)' };
    default:
      return { type: 'file', label: ext ? ext.toUpperCase().slice(0, 4) : 'FILE', color: '#94a3b8', bgColor: 'rgba(148, 163, 184, 0.12)', borderColor: 'rgba(148, 163, 184, 0.25)' };
  }
}

// SVG Icons for different file formats and directories
function FileOrFolderIcon({ isDir, isOpen, meta }: { isDir: boolean; isOpen?: boolean; meta: ReturnType<typeof getFileMeta> }) {
  if (isDir) {
    if (isOpen) {
      return (
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <polygon points="2 10 22 10 19 21 5 21 2 10" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      );
    }
    return (
      <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#f59e0b" fillOpacity="0.18" />
      </svg>
    );
  }

  switch (meta.type) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
    case 'py':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'json':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 6h16M4 12h16M4 18h8" />
        </svg>
      );
    case 'css':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l10 4.5-3 14-7 3.5-7-3.5-3-14z" fill={meta.color} fillOpacity="0.15" />
          <path d="M12 22V2" />
        </svg>
      );
    case 'md':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
        </svg>
      );
    case 'db':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <ellipse cx="12" cy="5" rx="9" ry="3" fill={meta.color} fillOpacity="0.2" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case 'img':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'cfg':
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return (
        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      );
  }
}

const KNOWN_EXTENSIONLESS_FILES = new Set(['license', 'licence', 'dockerfile', 'makefile', 'procfile', 'cname']);

function isPathDirectDirectory(name: string, rawPath: string): boolean {
  if (rawPath.endsWith('/')) return true;
  const lower = name.toLowerCase();
  if (KNOWN_EXTENSIONLESS_FILES.has(lower)) return false;
  // Dotfiles like .gitignore, .env, .npmrc
  if (name.startsWith('.') && !name.slice(1).includes('.')) return false;
  // Files with an extension (e.g. App.tsx, index.css, package.json)
  if (name.includes('.') && !name.startsWith('.')) return false;
  // Names without extension (e.g. components, pages, data, sections, logs, src) are directories
  return true;
}

export default function ProjectFileExplorer({ fileTree, projectId }: ProjectFileExplorerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterScope, setFilterScope] = useState<'all' | 'client' | 'server' | 'public' | 'root'>('all');
  const [viewMode, setViewMode] = useState<'tree' | 'flat'>('tree');
  const [expandedFolders, setExpandedFolders] = useState<Record<string, boolean>>({});
  const [copiedPath, setCopiedPath] = useState<string | null>(null);
  const [isFullHeight, setIsFullHeight] = useState(false);

  // Parse directories and paths into a clean set
  const { tree, flatList, totalDirs, totalFiles } = useMemo(() => {
    const dirSet = new Set<string>();

    fileTree.forEach((path) => {
      const clean = path.replace(/\/$/, '');
      const parts = clean.split('/');
      for (let i = 1; i < parts.length; i++) {
        dirSet.add(parts.slice(0, i).join('/'));
      }
      const lastPart = parts[parts.length - 1];
      if (path.endsWith('/') || isPathDirectDirectory(lastPart, path)) {
        dirSet.add(clean);
      }
    });

    const root: TreeNode = {
      id: '',
      name: '',
      path: '',
      isDir: true,
      depth: -1,
      children: [],
      itemCount: 0,
    };

    const flatItems: Array<{ path: string; name: string; isDir: boolean; meta: ReturnType<typeof getFileMeta>; group: string }> = [];

    for (const rawPath of fileTree) {
      const clean = rawPath.replace(/\/$/, '');
      const parts = clean.split('/');
      let current = root;
      let accumulated = '';

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        accumulated = accumulated ? `${accumulated}/${part}` : part;
        const isLast = i === parts.length - 1;
        const isDir = !isLast || dirSet.has(accumulated);

        let existing = current.children.find((c) => c.name === part);
        if (!existing) {
          existing = {
            id: accumulated,
            name: part,
            path: accumulated,
            isDir,
            depth: i,
            extension: isDir ? undefined : part.includes('.') ? part.split('.').pop()?.toLowerCase() : undefined,
            children: [],
            itemCount: 0,
          };
          current.children.push(existing);
        } else if (isDir && !existing.isDir) {
          existing.isDir = true;
        }

        current = existing;
      }

      // Add leaf files to flat items
      if (!dirSet.has(clean) && !rawPath.endsWith('/')) {
        const rootSegment = clean.split('/')[0];
        const group = rootSegment === 'client' ? 'client' : rootSegment === 'server' ? 'server' : rootSegment === 'public' ? 'public' : 'root';
        const meta = getFileMeta(parts[parts.length - 1], false);
        flatItems.push({
          path: clean,
          name: parts[parts.length - 1],
          isDir: false,
          meta,
          group,
        });
      }
    }

    // Sort children: directories first, then alphabetical
    const sortNodes = (node: TreeNode) => {
      node.children.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });
      node.children.forEach(sortNodes);
      node.itemCount = node.children.length;
    };

    sortNodes(root);

    return {
      tree: root.children,
      flatList: flatItems.sort((a, b) => a.path.localeCompare(b.path)),
      totalDirs: dirSet.size,
      totalFiles: flatItems.length,
    };
  }, [fileTree]);

  // Folder open/closed states
  const isExpanded = (id: string) => {
    if (expandedFolders[id] !== undefined) return expandedFolders[id];
    const depth = id.split('/').length;
    return depth <= 2; // Expand top 2 levels by default
  };

  const toggleFolder = (id: string) => {
    setExpandedFolders((prev) => ({
      ...prev,
      [id]: !isExpanded(id),
    }));
  };

  const expandAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.isDir) {
          all[n.id] = true;
          traverse(n.children);
        }
      });
    };
    traverse(tree);
    setExpandedFolders(all);
  };

  const collapseAll = () => {
    const all: Record<string, boolean> = {};
    const traverse = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        if (n.isDir) {
          all[n.id] = false;
          traverse(n.children);
        }
      });
    };
    traverse(tree);
    setExpandedFolders(all);
  };

  const handleCopyPath = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(path);
    setCopiedPath(path);
    setTimeout(() => {
      setCopiedPath((curr) => (curr === path ? null : curr));
    }, 1500);
  };

  // Filter tree recursively
  const filteredTree = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    function filterNode(node: TreeNode): TreeNode | null {
      // Check scope
      if (filterScope !== 'all') {
        const rootSegment = node.path.split('/')[0];
        if (filterScope === 'root' && (rootSegment === 'client' || rootSegment === 'server' || rootSegment === 'public')) {
          return null;
        }
        if (filterScope !== 'root' && rootSegment !== filterScope) {
          return null;
        }
      }

      if (!query) return node;

      const nameMatch = node.name.toLowerCase().includes(query) || node.path.toLowerCase().includes(query);

      if (node.isDir) {
        const filteredChildren = node.children
          .map(filterNode)
          .filter((c): c is TreeNode => c !== null);

        if (nameMatch || filteredChildren.length > 0) {
          return {
            ...node,
            children: filteredChildren,
          };
        }
        return null;
      }

      return nameMatch ? node : null;
    }

    return tree.map(filterNode).filter((n): n is TreeNode => n !== null);
  }, [tree, searchQuery, filterScope]);

  // Filter flat list
  const filteredFlatList = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return flatList.filter((item) => {
      if (filterScope !== 'all' && item.group !== filterScope) return false;
      if (!query) return true;
      return item.path.toLowerCase().includes(query) || item.name.toLowerCase().includes(query);
    });
  }, [flatList, searchQuery, filterScope]);

  // Count matches
  const matchCount = useMemo(() => {
    let count = 0;
    const countNodes = (nodes: TreeNode[]) => {
      nodes.forEach((n) => {
        count++;
        if (n.isDir) countNodes(n.children);
      });
    };
    countNodes(filteredTree);
    return count;
  }, [filteredTree]);

  // Recursive Tree Node Renderer
  const renderTreeNode = (node: TreeNode, depth: number) => {
    const open = isExpanded(node.id);
    const meta = getFileMeta(node.name, node.isDir);
    const hasChildren = node.children.length > 0;
    const isCopied = copiedPath === node.path;
    const query = searchQuery.trim().toLowerCase();

    // Highlight search match in name
    const highlightName = (name: string) => {
      if (!query) return name;
      const idx = name.toLowerCase().indexOf(query);
      if (idx === -1) return name;
      return (
        <>
          {name.slice(0, idx)}
          <mark className="bg-blue-500/30 text-white px-0.5 rounded">{name.slice(idx, idx + query.length)}</mark>
          {name.slice(idx + query.length)}
        </>
      );
    };

    return (
      <div className="w-full flex flex-col" key={node.id}>
        <div
          className={`group flex items-center justify-between py-1.5 px-2.5 rounded-lg border border-transparent hover:border-[#282838] hover:bg-[#111116] transition-all cursor-pointer select-none text-xs ${
            open ? 'bg-[#111116]/60' : ''
          }`}
          style={{ paddingLeft: `${Math.max(10, depth * 18 + 10)}px` }}
          onClick={() => (node.isDir ? toggleFolder(node.id) : null)}
          role={node.isDir ? 'button' : undefined}
          tabIndex={node.isDir ? 0 : undefined}
          onKeyDown={(e) => {
            if (node.isDir && (e.key === 'Enter' || e.key === ' ')) {
              e.preventDefault();
              toggleFolder(node.id);
            }
          }}
          title={node.path}
        >
          {/* Left Side: Chevron, Icon, Name */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {/* Chevron for directories */}
            <span className="w-4 h-4 flex items-center justify-center shrink-0">
              {node.isDir ? (
                <svg
                  className={`w-3.5 h-3.5 text-neutral-500 transition-transform duration-150 ${open ? 'rotate-90 text-blue-400' : ''}`}
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              ) : (
                <span className="w-3.5 h-3.5" />
              )}
            </span>

            {/* Icon */}
            <FileOrFolderIcon isDir={node.isDir} isOpen={open} meta={meta} />

            {/* Name */}
            <code className="text-xs font-mono text-neutral-300 group-hover:text-white truncate transition-colors">
              {highlightName(node.name)}
            </code>
          </div>

          {/* Right Side: Badges & Actions */}
          <div className="flex items-center gap-2 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            {node.isDir ? (
              <span className="px-2 py-0.5 rounded text-[10.5px] font-mono text-neutral-400 bg-[#111116] border border-[#282838]">
                {node.children.length} {node.children.length === 1 ? 'item' : 'items'}
              </span>
            ) : (
              <span
                className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border"
                style={{
                  color: meta.color,
                  backgroundColor: meta.bgColor,
                  borderColor: meta.borderColor,
                }}
              >
                {meta.label}
              </span>
            )}

            <button
              type="button"
              className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-[#111116] border border-[#282838] text-neutral-400 hover:text-white hover:border-blue-500/40 transition-all ${
                isCopied ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' : ''
              }`}
              onClick={(e) => handleCopyPath(node.path, e)}
              title={`Copy relative path: ${node.path}`}
              aria-label={`Copy path ${node.path}`}
            >
              {isCopied ? (
                <>
                  <svg className="w-2.5 h-2.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                  </svg>
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Children (if directory and expanded) */}
        {node.isDir && open && hasChildren && (
          <div className="flex flex-col relative before:absolute before:left-4 before:top-0 before:bottom-2 before:w-[1px] before:bg-[#282838]">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-full bg-[#111116] border border-[#282838] rounded-2xl shadow-2xl overflow-hidden flex flex-col transition-all duration-200">
      {/* Top Banner Toolbar */}
      <div className="p-4 md:px-5 md:py-3.5 border-b border-[#22222e] bg-[#111116] flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#0a0a0a] border border-[#282838] text-xs font-mono text-neutral-300">
            <svg className="w-3.5 h-3.5 text-blue-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="font-medium text-neutral-200">Soul-DevPortal-Projects/{projectId}</span>
            <CopyButton text={`Soul-DevPortal-Projects/${projectId}`} variant="compact" label="" copiedLabel="Copied!" />
          </div>

          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="px-2.5 py-1 rounded-md bg-[#111116] border border-[#282838] text-neutral-300">
              <strong className="text-white font-bold">{totalDirs}</strong> directories
            </span>
            <span className="px-2.5 py-1 rounded-md bg-[#111116] border border-[#282838] text-neutral-300">
              <strong className="text-white font-bold">{totalFiles}</strong> source files
            </span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/40 text-blue-400 font-semibold shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-400" aria-hidden="true" />
              <span><strong className="font-bold">{fileTree.length}</strong> items indexed</span>
            </span>
          </div>
        </div>

        {/* View Mode & Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="inline-flex p-1 bg-[#0a0a0a] border border-[#282838] rounded-lg gap-1">
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'tree' ? 'bg-[#111116] text-white shadow-sm border border-[#282838]' : 'text-neutral-400 hover:text-white hover:bg-[#111116]'
              }`}
              onClick={() => setViewMode('tree')}
              title="Tree Explorer View"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Tree View</span>
            </button>
            <button
              type="button"
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                viewMode === 'flat' ? 'bg-[#111116] text-white shadow-sm border border-[#282838]' : 'text-neutral-400 hover:text-white hover:bg-[#111116]'
              }`}
              onClick={() => setViewMode('flat')}
              title="Categorized List View"
            >
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6" />
                <line x1="8" y1="12" x2="21" y2="12" />
                <line x1="8" y1="18" x2="21" y2="18" />
                <line x1="3" y1="6" x2="3.01" y2="6" />
                <line x1="3" y1="12" x2="3.01" y2="12" />
                <line x1="3" y1="18" x2="3.01" y2="18" />
              </svg>
              <span>Categorized</span>
            </button>
          </div>

          {viewMode === 'tree' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#111116] border border-[#282838] text-neutral-400 hover:text-white hover:border-blue-500/40 transition-all"
                onClick={expandAll}
                title="Expand all folders"
              >
                <span>Expand All</span>
              </button>
              <button
                type="button"
                className="px-2.5 py-1 text-xs font-medium rounded-md bg-[#111116] border border-[#282838] text-neutral-400 hover:text-white hover:border-blue-500/40 transition-all"
                onClick={collapseAll}
                title="Collapse all folders"
              >
                <span>Collapse All</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-all ${
              isFullHeight
                ? 'bg-blue-500/15 border-blue-500/40 text-blue-400'
                : 'bg-[#111116] border-[#282838] text-neutral-400 hover:text-white hover:border-blue-500/40'
            }`}
            onClick={() => setIsFullHeight((prev) => !prev)}
            title={isFullHeight ? 'Limit explorer height' : 'Expand to full height'}
          >
            <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              {isFullHeight ? (
                <>
                  <polyline points="4 14 10 14 10 20" />
                  <polyline points="20 10 14 10 14 4" />
                </>
              ) : (
                <>
                  <polyline points="15 3 21 3 21 9" />
                  <polyline points="9 21 3 21 3 15" />
                  <line x1="21" y1="3" x2="14" y2="10" />
                  <line x1="3" y1="21" x2="10" y2="14" />
                </>
              )}
            </svg>
            <span>{isFullHeight ? 'Fit Screen' : 'Full Height'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Scope Bar */}
      <div className="p-3 md:px-5 md:py-3.5 bg-[#0a0a0a] border-b border-[#22222e] flex flex-wrap items-center justify-between gap-3">
        <div className="relative flex-1 min-w-[240px] flex items-center">
          <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#111116] border border-[#282838] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 transition-all font-mono"
            placeholder="Filter files by name or extension (e.g. .py, schema, App.tsx)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="absolute right-2.5 text-xs text-neutral-400 hover:text-white p-1"
              onClick={() => setSearchQuery('')}
              title="Clear search query"
            >
              ×
            </button>
          )}
          {searchQuery && (
            <span className="absolute right-8 text-[11px] font-mono text-neutral-400">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Quick Filter Scopes */}
        <div className="flex flex-wrap items-center gap-1.5" role="radiogroup" aria-label="Scope filter">
          {(['all', 'client', 'server', 'public', 'root'] as const).map((scope) => {
            const label = scope === 'all' ? 'All' : scope === 'client' ? 'Client / UI' : scope === 'server' ? 'Server / API' : scope === 'public' ? 'Assets' : 'Root Configs';
            const isActive = filterScope === scope;
            return (
              <button
                key={scope}
                type="button"
                className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm border border-blue-500'
                    : 'bg-[#111116] border border-[#282838] text-neutral-400 hover:text-white hover:bg-[#111116] hover:border-blue-500/40'
                }`}
                onClick={() => setFilterScope(scope)}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Explorer Content Body */}
      <div className={`overflow-y-auto p-2 md:p-3 transition-all duration-300 font-mono text-xs ${isFullHeight ? 'max-h-[800px]' : 'max-h-[460px]'}`}>
        {viewMode === 'tree' ? (
          <div className="flex flex-col gap-0.5">
            {filteredTree.length > 0 ? (
              filteredTree.map((node) => renderTreeNode(node, 0))
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-3xl">🔍</span>
                <h4 className="text-sm font-bold text-white">No matching files or directories</h4>
                <p className="text-xs text-neutral-400 max-w-sm">No results found for &ldquo;{searchQuery}&rdquo; in current scope.</p>
                <button
                  type="button"
                  className="px-3 py-1.5 rounded-lg bg-[#111116] border border-[#282838] text-xs font-medium text-neutral-200 hover:text-white hover:border-blue-500/40 transition-all"
                  onClick={() => {
                    setSearchQuery('');
                    setFilterScope('all');
                  }}
                >
                  Reset Filter &amp; Scope
                </button>
              </div>
            )}
          </div>
        ) : (
          /* Categorized Flat View */
          <div className="flex flex-col">
            {filteredFlatList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 p-1">
                {filteredFlatList.map((item) => {
                  const isCopied = copiedPath === item.path;
                  return (
                    <div
                      key={item.path}
                      className="group flex items-center justify-between p-2.5 rounded-lg bg-[#111116] border border-[#282838] hover:border-blue-500/40 hover:bg-[#111116] transition-all"
                    >
                      <div className="flex items-center gap-2.5 min-w-0 flex-1">
                        <FileOrFolderIcon isDir={item.isDir} isOpen={false} meta={item.meta} />
                        <div className="flex flex-col min-w-0">
                          <code className="text-xs text-neutral-200 group-hover:text-white font-mono truncate">{item.name}</code>
                          <span className="text-[10px] text-neutral-500 font-mono truncate" title={item.path}>
                            {item.path}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold tracking-wider uppercase border"
                          style={{
                            color: item.meta.color,
                            backgroundColor: item.meta.bgColor,
                            borderColor: item.meta.borderColor,
                          }}
                        >
                          {item.meta.label}
                        </span>
                        <button
                          type="button"
                          className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-sans font-medium bg-[#111116] border border-[#282838] text-neutral-400 hover:text-white hover:border-blue-500/40 transition-all ${
                            isCopied ? 'text-blue-400 border-blue-500/50 bg-blue-500/10' : ''
                          }`}
                          onClick={(e) => handleCopyPath(item.path, e)}
                          title={`Copy path: ${item.path}`}
                        >
                          {isCopied ? 'Copied!' : 'Copy'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="py-12 flex flex-col items-center justify-center text-center gap-3">
                <span className="text-3xl">🔍</span>
                <h4 className="text-sm font-bold text-white">No matching files or directories</h4>
                <p className="text-xs text-neutral-400">No results found for &ldquo;{searchQuery}&rdquo;.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explorer Footer Status Bar */}
      <div className="px-4 py-2.5 bg-[#0a0a0a] border-t border-[#22222e] flex flex-wrap items-center justify-between gap-2 text-[11px] text-neutral-500 font-mono">
        <div className="flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500" aria-hidden="true" />
          <span>
            Showing {viewMode === 'tree' ? matchCount : filteredFlatList.length} of {fileTree.length} items
          </span>
          {searchQuery && <span className="text-blue-400">Filter active: &ldquo;{searchQuery}&rdquo;</span>}
        </div>
        <div className="text-neutral-500">
          <span>Click directories to expand/collapse • Copy path on hover</span>
        </div>
      </div>
    </div>
  );
}
