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

  const ext = fileName.includes('.') ? fileName.split('.').pop()?.toLowerCase() || '' : '';

  switch (ext) {
    case 'ts':
      return { type: 'ts', label: 'TS', color: '#38bdf8', bgColor: 'rgba(56, 189, 248, 0.12)', borderColor: 'rgba(56, 189, 248, 0.3)' };
    case 'tsx':
      return { type: 'tsx', label: 'TSX', color: '#06b6d4', bgColor: 'rgba(6, 182, 212, 0.12)', borderColor: 'rgba(6, 182, 212, 0.3)' };
    case 'js':
    case 'mjs':
    case 'cjs':
      return { type: 'js', label: 'JS', color: '#facc15', bgColor: 'rgba(250, 204, 21, 0.12)', borderColor: 'rgba(250, 204, 21, 0.3)' };
    case 'jsx':
      return { type: 'jsx', label: 'JSX', color: '#fbbf24', bgColor: 'rgba(251, 191, 36, 0.12)', borderColor: 'rgba(251, 191, 36, 0.3)' };
    case 'py':
      return { type: 'py', label: 'PY', color: '#3b82f6', bgColor: 'rgba(59, 130, 246, 0.12)', borderColor: 'rgba(59, 130, 246, 0.3)' };
    case 'json':
      return { type: 'json', label: 'JSON', color: '#10b981', bgColor: 'rgba(16, 185, 129, 0.12)', borderColor: 'rgba(16, 185, 129, 0.3)' };
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return { type: 'css', label: 'CSS', color: '#ec4899', bgColor: 'rgba(236, 72, 153, 0.12)', borderColor: 'rgba(236, 72, 153, 0.3)' };
    case 'html':
    case 'htm':
      return { type: 'html', label: 'HTML', color: '#f97316', bgColor: 'rgba(249, 115, 22, 0.12)', borderColor: 'rgba(249, 115, 22, 0.3)' };
    case 'md':
    case 'mdx':
      return { type: 'md', label: 'MD', color: '#a855f7', bgColor: 'rgba(168, 85, 247, 0.12)', borderColor: 'rgba(168, 85, 247, 0.3)' };
    case 'db':
    case 'sqlite':
    case 'sqlite3':
    case 'sql':
      return { type: 'db', label: 'SQL', color: '#8b5cf6', bgColor: 'rgba(139, 92, 246, 0.12)', borderColor: 'rgba(139, 92, 246, 0.3)' };
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
      return { type: 'img', label: 'IMG', color: '#e879f9', bgColor: 'rgba(232, 121, 249, 0.12)', borderColor: 'rgba(232, 121, 249, 0.3)' };
    default:
      return { type: 'file', label: ext ? ext.toUpperCase().slice(0, 4) : 'FILE', color: '#9ca3af', bgColor: 'rgba(156, 163, 175, 0.12)', borderColor: 'rgba(156, 163, 175, 0.25)' };
  }
}

// SVG Icons for different file formats and directories
function FileOrFolderIcon({ isDir, isOpen, meta }: { isDir: boolean; isOpen?: boolean; meta: ReturnType<typeof getFileMeta> }) {
  if (isDir) {
    if (isOpen) {
      return (
        <svg className="tree-svg-icon folder-open" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
          <polygon points="2 10 22 10 19 21 5 21 2 10" fill="#f59e0b" fillOpacity="0.25" stroke="#f59e0b" strokeWidth="1.5" />
        </svg>
      );
    }
    return (
      <svg className="tree-svg-icon folder-closed" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" fill="#f59e0b" fillOpacity="0.18" />
      </svg>
    );
  }

  // File icons by type
  switch (meta.type) {
    case 'ts':
    case 'tsx':
    case 'js':
    case 'jsx':
      return (
        <svg className="tree-svg-icon file-code" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
        </svg>
      );
    case 'py':
      return (
        <svg className="tree-svg-icon file-python" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2a5 5 0 0 0-5 5v2h5v1H5a5 5 0 0 0-5 5 5 5 0 0 0 5 5h2v-2a3 3 0 0 1 3-3h4a2 2 0 0 0 2-2V7a5 5 0 0 0-5-5z" fill={meta.color} fillOpacity="0.2" />
          <path d="M12 22a5 5 0 0 0 5-5v-2h-5v-1h7a5 5 0 0 0 5-5 5 5 0 0 0-5-5h-2v2a3 3 0 0 1-3 3h-4a2 2 0 0 0-2 2v3a5 5 0 0 0 5 5z" fill="#facc15" fillOpacity="0.25" />
        </svg>
      );
    case 'json':
      return (
        <svg className="tree-svg-icon file-json" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M8 3H5a2 2 0 0 0-2 2v3m0 8v3a2 2 0 0 0 2 2h3m8-18h3a2 2 0 0 1 2 2v3m0 8v3a2 2 0 0 1-2 2h-3" />
        </svg>
      );
    case 'css':
      return (
        <svg className="tree-svg-icon file-style" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" fill={meta.color} fillOpacity="0.15" />
        </svg>
      );
    case 'html':
      return (
        <svg className="tree-svg-icon file-html" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="4 7 4 4 20 4 20 7" />
          <line x1="9" y1="20" x2="15" y2="20" />
          <line x1="12" y1="4" x2="12" y2="20" />
        </svg>
      );
    case 'md':
      return (
        <svg className="tree-svg-icon file-markdown" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
          <polyline points="14 2 14 8 20 8" />
          <line x1="16" y1="13" x2="8" y2="13" />
          <line x1="16" y1="17" x2="8" y2="17" />
          <polyline points="10 9 9 9 8 9" />
        </svg>
      );
    case 'db':
      return (
        <svg className="tree-svg-icon file-db" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <ellipse cx="12" cy="5" rx="9" ry="3" fill={meta.color} fillOpacity="0.2" />
          <path d="M21 12c0 1.66-4 3-9 3s-9-1.34-9-3" />
          <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
        </svg>
      );
    case 'img':
      return (
        <svg className="tree-svg-icon file-img" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <polyline points="21 15 16 10 5 21" />
        </svg>
      );
    case 'cfg':
      return (
        <svg className="tree-svg-icon file-cfg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      );
    default:
      return (
        <svg className="tree-svg-icon file-generic" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={meta.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z" />
          <polyline points="13 2 13 9 20 9" />
        </svg>
      );
  }
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
    });

    fileTree.forEach((path) => {
      const clean = path.replace(/\/$/, '');
      const lastPart = clean.split('/').pop() || '';
      if (path.endsWith('/') || !lastPart.includes('.') || dirSet.has(clean)) {
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

      // Add to flat items if not already added
      const meta = getFileMeta(clean, dirSet.has(clean));
      let group = 'root';
      if (clean.startsWith('client/')) group = 'client';
      else if (clean.startsWith('server/')) group = 'server';
      else if (clean.startsWith('public/')) group = 'public';

      if (!flatItems.some((item) => item.path === clean)) {
        flatItems.push({
          path: clean,
          name: clean.split('/').pop() || clean,
          isDir: dirSet.has(clean),
          meta,
          group,
        });
      }
    }

    function sortAndCount(node: TreeNode): number {
      node.children.sort((a, b) => {
        if (a.isDir && !b.isDir) return -1;
        if (!a.isDir && b.isDir) return 1;
        return a.name.localeCompare(b.name);
      });

      let count = node.children.length;
      for (const child of node.children) {
        if (child.isDir) {
          count += sortAndCount(child);
        }
      }
      node.itemCount = count;
      return count;
    }

    sortAndCount(root);

    let dCount = 0;
    let fCount = 0;
    flatItems.forEach((it) => {
      if (it.isDir) dCount++;
      else fCount++;
    });

    return {
      tree: root.children,
      flatList: flatItems.sort((a, b) => a.path.localeCompare(b.path)),
      totalDirs: dCount,
      totalFiles: fCount,
    };
  }, [fileTree]);

  // Initial expansion state: top-level directories expanded by default
  const defaultExpanded = useMemo(() => {
    const init: Record<string, boolean> = {};
    tree.forEach((node) => {
      if (node.isDir) {
        init[node.id] = true;
        // Also expand immediate high-interest subdirs
        node.children.forEach((child) => {
          if (child.isDir && (child.name === 'src' || child.name === 'app' || child.name === 'features')) {
            init[child.id] = true;
          }
        });
      }
    });
    return init;
  }, [tree]);

  // Merge default with user toggle state
  const isExpanded = (id: string) => {
    if (searchQuery.trim().length > 0) {
      // Auto-expand all when searching
      return true;
    }
    return expandedFolders[id] !== undefined ? expandedFolders[id] : !!defaultExpanded[id];
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
          <mark className="tree-search-highlight">{name.slice(idx, idx + query.length)}</mark>
          {name.slice(idx + query.length)}
        </>
      );
    };

    return (
      <div className="tree-node-wrapper" key={node.id}>
        <div
          className={`tree-row ${node.isDir ? 'is-directory' : 'is-file'} ${open ? 'folder-is-open' : ''}`}
          style={{ paddingLeft: `${Math.max(8, depth * 18 + 10)}px` }}
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
          {/* Indent Guide Visual */}
          {depth > 0 && (
            <div
              className="tree-indent-lines"
              style={{
                left: `${depth * 18 - 8}px`,
              }}
              aria-hidden="true"
            />
          )}

          {/* Chevron for directories */}
          <span className="tree-chevron-slot">
            {node.isDir ? (
              <svg
                className={`tree-chevron ${open ? 'expanded' : ''}`}
                width="12"
                height="12"
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
              <span className="tree-chevron-placeholder" />
            )}
          </span>

          {/* Icon */}
          <span className="tree-icon-wrap">
            <FileOrFolderIcon isDir={node.isDir} isOpen={open} meta={meta} />
          </span>

          {/* Name */}
          <span className="tree-label">
            <code className="tree-name-code">{highlightName(node.name)}</code>
          </span>

          {/* Badges & Actions */}
          <div className="tree-row-actions">
            {node.isDir ? (
              <span className="tree-item-count-badge">
                {node.children.length} {node.children.length === 1 ? 'item' : 'items'}
              </span>
            ) : (
              <span
                className="tree-ext-badge"
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
              className={`tree-copy-btn ${isCopied ? 'copied' : ''}`}
              onClick={(e) => handleCopyPath(node.path, e)}
              title={`Copy relative path: ${node.path}`}
              aria-label={`Copy path ${node.path}`}
            >
              {isCopied ? (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                  <span>Copied!</span>
                </>
              ) : (
                <>
                  <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
          <div className="tree-children-container">
            {node.children.map((child) => renderTreeNode(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="project-file-explorer-card">
      {/* Top Banner Toolbar */}
      <div className="pfe-header">
        <div className="pfe-header-meta">
          <div className="pfe-path-pill">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#60a5fa" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
            </svg>
            <span className="pfe-path-text">Soul-DevPortal-Projects/{projectId}</span>
            <CopyButton text={`Soul-DevPortal-Projects/${projectId}`} variant="compact" label="" copiedLabel="Copied!" />
          </div>

          <div className="pfe-stats-badges">
            <span className="pfe-stat-badge">
              <strong>{totalDirs}</strong> directories
            </span>
            <span className="pfe-stat-badge">
              <strong>{totalFiles}</strong> source files
            </span>
            <span className="pfe-stat-badge highlight">
              <strong>{fileTree.length}</strong> indexed items
            </span>
          </div>
        </div>

        {/* View Mode & Controls */}
        <div className="pfe-header-controls">
          <div className="pfe-view-toggle">
            <button
              type="button"
              className={`pfe-view-btn ${viewMode === 'tree' ? 'active' : ''}`}
              onClick={() => setViewMode('tree')}
              title="Tree Explorer View"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="7" />
                <rect x="14" y="3" width="7" height="7" />
                <rect x="14" y="14" width="7" height="7" />
                <rect x="3" y="14" width="7" height="7" />
              </svg>
              <span>Tree View</span>
            </button>
            <button
              type="button"
              className={`pfe-view-btn ${viewMode === 'flat' ? 'active' : ''}`}
              onClick={() => setViewMode('flat')}
              title="Categorized List View"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
            <div className="pfe-tree-actions">
              <button type="button" className="pfe-mini-action-btn" onClick={expandAll} title="Expand all folders">
                <span>Expand All</span>
              </button>
              <button type="button" className="pfe-mini-action-btn" onClick={collapseAll} title="Collapse all folders">
                <span>Collapse All</span>
              </button>
            </div>
          )}

          <button
            type="button"
            className={`pfe-mini-action-btn height-toggle ${isFullHeight ? 'active' : ''}`}
            onClick={() => setIsFullHeight((prev) => !prev)}
            title={isFullHeight ? 'Limit explorer height' : 'Expand to full height'}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
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
      <div className="pfe-filter-bar">
        <div className="pfe-search-input-wrap">
          <svg className="pfe-search-icon" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            className="pfe-search-input"
            placeholder="Filter files by name or extension (e.g. .py, schema, App.tsx)..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              type="button"
              className="pfe-search-clear-btn"
              onClick={() => setSearchQuery('')}
              title="Clear search query"
            >
              ×
            </button>
          )}
          {searchQuery && (
            <span className="pfe-search-count">
              {matchCount} {matchCount === 1 ? 'match' : 'matches'}
            </span>
          )}
        </div>

        {/* Quick Filter Scopes */}
        <div className="pfe-scope-pills" role="radiogroup" aria-label="Scope filter">
          <button
            type="button"
            className={`pfe-scope-pill ${filterScope === 'all' ? 'active' : ''}`}
            onClick={() => setFilterScope('all')}
          >
            All
          </button>
          <button
            type="button"
            className={`pfe-scope-pill ${filterScope === 'client' ? 'active' : ''}`}
            onClick={() => setFilterScope('client')}
          >
            Client / UI
          </button>
          <button
            type="button"
            className={`pfe-scope-pill ${filterScope === 'server' ? 'active' : ''}`}
            onClick={() => setFilterScope('server')}
          >
            Server / API
          </button>
          <button
            type="button"
            className={`pfe-scope-pill ${filterScope === 'public' ? 'active' : ''}`}
            onClick={() => setFilterScope('public')}
          >
            Assets
          </button>
          <button
            type="button"
            className={`pfe-scope-pill ${filterScope === 'root' ? 'active' : ''}`}
            onClick={() => setFilterScope('root')}
          >
            Root Configs
          </button>
        </div>
      </div>

      {/* Explorer Content Body */}
      <div className={`pfe-body-scroll ${isFullHeight ? 'full-height' : ''}`}>
        {viewMode === 'tree' ? (
          <div className="pfe-tree-canvas">
            {filteredTree.length > 0 ? (
              filteredTree.map((node) => renderTreeNode(node, 0))
            ) : (
              <div className="pfe-empty-state">
                <span className="pfe-empty-icon">🔍</span>
                <h4>No matching files or directories</h4>
                <p>No results found for &ldquo;{searchQuery}&rdquo; in current scope.</p>
                <button
                  type="button"
                  className="pfe-empty-reset-btn"
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
          <div className="pfe-categorized-canvas">
            {filteredFlatList.length > 0 ? (
              <div className="pfe-flat-list-grid">
                {filteredFlatList.map((item) => {
                  const isCopied = copiedPath === item.path;
                  return (
                    <div className={`pfe-flat-item ${item.isDir ? 'is-dir' : 'is-file'}`} key={item.path}>
                      <div className="pfe-flat-left">
                        <FileOrFolderIcon isDir={item.isDir} isOpen={false} meta={item.meta} />
                        <div className="pfe-flat-names">
                          <code className="pfe-flat-filename">{item.name}</code>
                          <span className="pfe-flat-relpath" title={item.path}>
                            {item.path}
                          </span>
                        </div>
                      </div>
                      <div className="pfe-flat-right">
                        <span
                          className="tree-ext-badge"
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
                          className={`tree-copy-btn ${isCopied ? 'copied' : ''}`}
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
              <div className="pfe-empty-state">
                <span className="pfe-empty-icon">🔍</span>
                <h4>No matching files or directories</h4>
                <p>No results found for &ldquo;{searchQuery}&rdquo;.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explorer Footer Status Bar */}
      <div className="pfe-footer-status">
        <div className="pfe-footer-left">
          <span className="pfe-footer-indicator" aria-hidden="true" />
          <span>
            Showing {viewMode === 'tree' ? matchCount : filteredFlatList.length} of {fileTree.length} items
          </span>
          {searchQuery && <span className="pfe-footer-filter-tag">Filter active: &ldquo;{searchQuery}&rdquo;</span>}
        </div>
        <div className="pfe-footer-right">
          <span className="pfe-shortcut-hint">Click directories to expand/collapse • Copy path on hover</span>
        </div>
      </div>
    </div>
  );
}
