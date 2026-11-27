import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { WebLinksAddon } from '@xterm/addon-web-links';
import { SearchAddon } from '@xterm/addon-search';
import { WebglAddon } from '@xterm/addon-webgl';
import '@xterm/xterm/css/xterm.css';
import { buildTerminalWsUrl, TerminalShellProfile } from '../../services/api';
import { copyTextSafe } from '../../utils/clipboard';

export interface TerminalPaneHandle {
  sendCommand: (command: string) => void;
  focus: () => void;
  interrupt: () => void;
  restart: () => void;
}

export type PaneConnectionStatus = 'connecting' | 'live' | 'exited' | 'error';

export interface TerminalPaneProps {
  paneId: string;
  title: string;
  profile: string;
  cwd: string;
  profiles: TerminalShellProfile[];
  isFocused: boolean;
  canClosePane?: boolean;
  fontSize?: number;
  themeId?: string;
  heightClass?: string;
  onFocus: () => void;
  onChangeProfile: (profileId: string) => void;
  onClosePane?: () => void;
  onSplitPane?: () => void;
}

export const TERMINAL_THEMES: Record<string, { label: string; theme: Record<string, string> }> = {
  'soul-dark': {
    label: 'Soul Dark',
    theme: {
      background: '#09090c',
      foreground: '#e4e4e7',
      cursor: '#38bdf8',
      cursorAccent: '#09090c',
      selectionBackground: 'rgba(56, 189, 248, 0.28)',
      black: '#18181b',
      red: '#f87171',
      green: '#34d399',
      yellow: '#fbbf24',
      blue: '#60a5fa',
      magenta: '#c084fc',
      cyan: '#22d3ee',
      white: '#e4e4e7',
      brightBlack: '#71717a',
      brightRed: '#fca5a5',
      brightGreen: '#6ee7b7',
      brightYellow: '#fde68a',
      brightBlue: '#93c5fd',
      brightMagenta: '#d8b4fe',
      brightCyan: '#67e8f9',
      brightWhite: '#ffffff',
    },
  },
  'vscode-dark': {
    label: 'VS Code Dark+',
    theme: {
      background: '#1e1e1e',
      foreground: '#cccccc',
      cursor: '#aeafad',
      cursorAccent: '#1e1e1e',
      selectionBackground: 'rgba(38, 79, 120, 0.6)',
      black: '#000000',
      red: '#cd3131',
      green: '#0dbc79',
      yellow: '#e5e510',
      blue: '#2472c8',
      magenta: '#bc3fbc',
      cyan: '#11a8cd',
      white: '#e5e5e5',
      brightBlack: '#666666',
      brightRed: '#f14c4c',
      brightGreen: '#23d18b',
      brightYellow: '#f5f543',
      brightBlue: '#3b8eea',
      brightMagenta: '#d670d6',
      brightCyan: '#29b8db',
      brightWhite: '#ffffff',
    },
  },
  dracula: {
    label: 'Dracula',
    theme: {
      background: '#191a21',
      foreground: '#f8f8f2',
      cursor: '#ff79c6',
      cursorAccent: '#191a21',
      selectionBackground: 'rgba(68, 71, 90, 0.7)',
      black: '#21222c',
      red: '#ff5555',
      green: '#50fa7b',
      yellow: '#f1fa8c',
      blue: '#bd93f9',
      magenta: '#ff79c6',
      cyan: '#8be9fd',
      white: '#f8f8f2',
      brightBlack: '#6272a4',
      brightRed: '#ff6e6e',
      brightGreen: '#69ff94',
      brightYellow: '#ffffa5',
      brightBlue: '#d6acff',
      brightMagenta: '#ff92df',
      brightCyan: '#a4ffff',
      brightWhite: '#ffffff',
    },
  },
  nord: {
    label: 'Nord',
    theme: {
      background: '#242933',
      foreground: '#d8dee9',
      cursor: '#88c0d0',
      cursorAccent: '#242933',
      selectionBackground: 'rgba(136, 192, 208, 0.25)',
      black: '#3b4252',
      red: '#bf616a',
      green: '#a3be8c',
      yellow: '#ebcb8b',
      blue: '#81a1c1',
      magenta: '#b48ead',
      cyan: '#88c0d0',
      white: '#e5e9f0',
      brightBlack: '#4c566a',
      brightRed: '#bf616a',
      brightGreen: '#a3be8c',
      brightYellow: '#ebcb8b',
      brightBlue: '#81a1c1',
      brightMagenta: '#b48ead',
      brightCyan: '#8fbcbb',
      brightWhite: '#eceff4',
    },
  },
};

const TerminalPane = forwardRef<TerminalPaneHandle, TerminalPaneProps>(function TerminalPane(
  {
    paneId,
    title,
    profile,
    cwd,
    profiles,
    isFocused,
    canClosePane = false,
    fontSize = 13,
    themeId = 'soul-dark',
    heightClass = 'h-[460px]',
    onFocus,
    onChangeProfile,
    onClosePane,
    onSplitPane,
  },
  ref
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<Terminal | null>(null);
  const fitAddonRef = useRef<FitAddon | null>(null);
  const searchAddonRef = useRef<SearchAddon | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const pendingCommandsRef = useRef<string[]>([]);

  const [status, setStatus] = useState<PaneConnectionStatus>('connecting');
  const [pid, setPid] = useState<number | null>(null);
  const [exitCode, setExitCode] = useState<number | null>(null);
  const [dimensions, setDimensions] = useState<{ cols: number; rows: number }>({ cols: 100, rows: 30 });
  const [sessionNonce, setSessionNonce] = useState<number>(0);

  const [showSearch, setShowSearch] = useState<boolean>(false);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [searchCaseSensitive, setSearchCaseSensitive] = useState<boolean>(false);
  const [copiedNotice, setCopiedNotice] = useState<boolean>(false);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [isScrolledUp, setIsScrolledUp] = useState<boolean>(false);

  const sendWsJson = useCallback((payload: Record<string, unknown>) => {
    const ws = wsRef.current;
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(payload));
    }
  }, []);

  const restartShell = useCallback(() => {
    setExitCode(null);
    setPid(null);
    setStatus('connecting');
    termRef.current?.writeln('\r\n\x1b[36m[Soul PTY] Restarting shell session...\x1b[0m');
    setSessionNonce((n) => n + 1);
  }, []);

  useImperativeHandle(
    ref,
    () => ({
      sendCommand: (command: string) => {
        const trimmed = command.trim();
        if (!trimmed) return;
        const ws = wsRef.current;
        if (ws && ws.readyState === WebSocket.OPEN) {
          ws.send(JSON.stringify({ type: 'input', data: `${trimmed}\r` }));
        } else {
          pendingCommandsRef.current.push(trimmed);
          if (status === 'exited' || status === 'error') {
            restartShell();
          }
        }
        termRef.current?.focus();
      },
      focus: () => {
        termRef.current?.focus();
      },
      interrupt: () => {
        sendWsJson({ type: 'signal', signal: 'SIGINT' });
        termRef.current?.focus();
      },
      restart: restartShell,
    }),
    [restartShell, sendWsJson, status]
  );

  // Initialize xterm.js instance once per pane mount
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const activeTheme = (TERMINAL_THEMES[themeId] || TERMINAL_THEMES['soul-dark']).theme;

    const term = new Terminal({
      cursorBlink: true,
      fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', Consolas, monospace",
      fontSize,
      lineHeight: 1.35,
      scrollback: 5000,
      convertEol: false,
      allowProposedApi: true,
      theme: activeTheme,
    });

    const fitAddon = new FitAddon();
    const webLinksAddon = new WebLinksAddon((_event, uri) => {
      window.open(uri, '_blank', 'noopener,noreferrer');
    });
    const searchAddon = new SearchAddon();

    term.loadAddon(fitAddon);
    term.loadAddon(webLinksAddon);
    term.loadAddon(searchAddon);
    term.open(container);

    // GPU-accelerated WebGL renderer with graceful fallback to default canvas/DOM
    let webglAddon: WebglAddon | null = null;
    try {
      webglAddon = new WebglAddon();
      webglAddon.onContextLoss(() => {
        try {
          webglAddon?.dispose();
        } catch {
          // Ignore
        }
        webglAddon = null;
      });
      term.loadAddon(webglAddon);
    } catch {
      webglAddon = null;
    }

    // Custom keybindings: Ctrl+F opens in-terminal search; Ctrl+C copies if selection exists
    term.attachCustomKeyEventHandler((evt) => {
      if ((evt.ctrlKey || evt.metaKey) && evt.type === 'keydown') {
        const key = evt.key.toLowerCase();
        if (key === 'f') {
          evt.preventDefault();
          setShowSearch(true);
          window.setTimeout(() => searchInputRef.current?.focus(), 20);
          return false;
        }
        if (key === 'c' && term.hasSelection()) {
          const sel = term.getSelection();
          if (sel) {
            void copyTextSafe(sel);
            term.clearSelection();
          }
          return false;
        }
        if (key === 'v') {
          evt.preventDefault();
          void navigator.clipboard?.readText?.().then((text) => {
            if (text) sendWsJson({ type: 'input', data: text });
          });
          return false;
        }
        if (key === 'l') {
          evt.preventDefault();
          term.clear();
          return false;
        }
      }
      return true;
    });

    termRef.current = term;
    fitAddonRef.current = fitAddon;
    searchAddonRef.current = searchAddon;

    const fitAndSync = () => {
      try {
        fitAddon.fit();
        setDimensions({ cols: term.cols, rows: term.rows });
        sendWsJson({ type: 'resize', cols: term.cols, rows: term.rows });
      } catch {
        // Ignore fit before container has dimensions
      }
    };

    const rafId = window.requestAnimationFrame(fitAndSync);

    const resizeObserver = new ResizeObserver(() => {
      fitAndSync();
    });
    resizeObserver.observe(container);

    const intersectionObserver = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        window.requestAnimationFrame(fitAndSync);
      }
    });
    intersectionObserver.observe(container);

    const onScrollDisposable = term.onScroll(() => {
      const buf = term.buffer.active;
      setIsScrolledUp(buf.viewportY < buf.baseY);
    });

    const onDataDisposable = term.onData((data) => {
      sendWsJson({ type: 'input', data });
    });

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver.disconnect();
      intersectionObserver.disconnect();
      onScrollDisposable.dispose();
      onDataDisposable.dispose();
      try {
        webglAddon?.dispose();
      } catch {
        // Ignore
      }
      term.dispose();
      termRef.current = null;
      fitAddonRef.current = null;
      searchAddonRef.current = null;
    };
  }, [paneId, sendWsJson]);

  // Live-update fontSize and theme without restarting PTY
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;
    term.options.fontSize = fontSize;
    term.options.theme = (TERMINAL_THEMES[themeId] || TERMINAL_THEMES['soul-dark']).theme;
    try {
      fitAddonRef.current?.fit();
      setDimensions({ cols: term.cols, rows: term.rows });
      sendWsJson({ type: 'resize', cols: term.cols, rows: term.rows });
    } catch {
      // Ignore
    }
  }, [fontSize, themeId, sendWsJson]);

  // Focus xterm when pane becomes focused
  useEffect(() => {
    if (isFocused) {
      termRef.current?.focus();
    }
  }, [isFocused]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const close = () => setContextMenu(null);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setContextMenu(null);
    };
    window.addEventListener('click', close);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('click', close);
      window.removeEventListener('keydown', onKey);
    };
  }, [contextMenu]);

  // Connect WebSocket PTY when profile, cwd, or sessionNonce changes
  useEffect(() => {
    const term = termRef.current;
    if (!term) return;

    term.reset();
    setIsScrolledUp(false);
    setStatus('connecting');
    setPid(null);
    setExitCode(null);

    try {
      fitAddonRef.current?.fit();
    } catch {
      // Ignore
    }

    const cols = term.cols || 100;
    const rows = term.rows || 30;
    const wsUrl = buildTerminalWsUrl({ profile, cwd, cols, rows });
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setStatus('live');
      if (isFocused) {
        term.focus();
      }
    };

    ws.onmessage = (evt) => {
      try {
        const msg = JSON.parse(evt.data);
        if (msg.type === 'output' && typeof msg.data === 'string') {
          term.write(msg.data);
        } else if (msg.type === 'ready') {
          setStatus('live');
          if (typeof msg.pid === 'number') setPid(msg.pid);
          sendWsJson({ type: 'resize', cols: term.cols, rows: term.rows });
          if (pendingCommandsRef.current.length > 0) {
            const queued = [...pendingCommandsRef.current];
            pendingCommandsRef.current = [];
            window.setTimeout(() => {
              for (const cmd of queued) {
                sendWsJson({ type: 'input', data: `${cmd}\r` });
              }
            }, 120);
          }
        } else if (msg.type === 'exit') {
          const code = typeof msg.code === 'number' ? msg.code : 0;
          setExitCode(code);
          setStatus('exited');
          term.writeln(`\r\n\x1b[33m[Process exited with code ${code}]\x1b[0m`);
        } else if (msg.type === 'error') {
          setStatus('error');
          term.writeln(`\r\n\x1b[31m[PTY Error] ${msg.message || 'Unknown error'}\x1b[0m`);
        }
      } catch {
        if (typeof evt.data === 'string') {
          term.write(evt.data);
        }
      }
    };

    ws.onerror = () => {
      setStatus((prev) => (prev === 'exited' ? prev : 'error'));
    };

    ws.onclose = () => {
      setStatus((prev) => (prev === 'live' || prev === 'connecting' ? 'exited' : prev));
    };

    return () => {
      if (wsRef.current === ws) {
        wsRef.current = null;
      }
      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        ws.close();
      }
    };
  }, [profile, cwd, sessionNonce, sendWsJson]);

  const handleCopySelection = async () => {
    const term = termRef.current;
    if (!term) return;
    const selected = term.getSelection();
    let textToCopy = selected;
    if (!textToCopy) {
      const buffer = term.buffer.active;
      const lines: string[] = [];
      for (let i = 0; i < buffer.length; i += 1) {
        const line = buffer.getLine(i);
        if (line) lines.push(line.translateToString(true));
      }
      textToCopy = lines.join('\n').trimEnd();
    }
    if (!textToCopy) return;
    await copyTextSafe(textToCopy);
    setCopiedNotice(true);
    window.setTimeout(() => setCopiedNotice(false), 1500);
  };

  const handleExportLog = () => {
    const term = termRef.current;
    if (!term) return;
    const buffer = term.buffer.active;
    const lines: string[] = [];
    for (let i = 0; i < buffer.length; i += 1) {
      const line = buffer.getLine(i);
      if (line) lines.push(line.translateToString(true));
    }
    const content = lines.join('\n').trimEnd() + '\n';
    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    anchor.href = url;
    anchor.download = `soul-terminal-${profile}-${stamp}.log`;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const runSearch = (direction: 'next' | 'prev') => {
    const addon = searchAddonRef.current;
    if (!addon || !searchTerm) return;
    const opts = { caseSensitive: searchCaseSensitive, incremental: false };
    if (direction === 'next') {
      addon.findNext(searchTerm, opts);
    } else {
      addon.findPrevious(searchTerm, opts);
    }
  };

  const statusBadge = {
    connecting: {
      dot: 'bg-amber-400 animate-pulse',
      text: 'Connecting',
      cls: 'text-amber-300 border-amber-500/30 bg-amber-500/10',
    },
    live: {
      dot: 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.75)]',
      text: pid ? `Live · PID ${pid}` : 'Live PTY',
      cls: 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10',
    },
    exited: {
      dot: 'bg-zinc-500',
      text: exitCode !== null ? `Exited (${exitCode})` : 'Exited',
      cls: 'text-zinc-400 border-zinc-600/40 bg-zinc-800/40',
    },
    error: {
      dot: 'bg-rose-400',
      text: 'Disconnected',
      cls: 'text-rose-300 border-rose-500/30 bg-rose-500/10',
    },
  }[status];

  return (
    <div
      onMouseDown={onFocus}
      className={`relative flex flex-col rounded-lg bg-[#09090c] border transition-colors overflow-hidden flex-1 min-h-0 ${
        isFocused ? 'border-sky-400/45' : 'border-white/[0.08]'
      }`}
    >
      {/* Pane Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-2.5 py-1 bg-[#111115] border-b border-white/[0.08] shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-mono font-bold text-zinc-200 truncate">{title}</span>
          <span
            className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono border ${statusBadge.cls}`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${statusBadge.dot}`} />
            {statusBadge.text}
          </span>
          <span className="hidden sm:inline px-1.5 py-0.5 rounded bg-[#09090c] border border-white/[0.08] text-[10px] font-mono text-zinc-400 tabular-nums">
            {dimensions.cols}×{dimensions.rows}
          </span>
          <select
            value={profile}
            onChange={(e) => onChangeProfile(e.target.value)}
            aria-label="Shell profile"
            className="h-6 px-2 rounded-lg bg-[#09090c] border border-white/[0.1] text-[11px] font-mono text-zinc-200 focus:outline-none focus:border-sky-400/50"
          >
            {profiles.map((p) => (
              <option key={p.id} value={p.id} disabled={!p.available}>
                {p.label}
                {!p.available ? ' (unavailable)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => {
              setShowSearch((prev) => !prev);
              window.setTimeout(() => searchInputRef.current?.focus(), 20);
            }}
            title="Search scrollback (Ctrl+F)"
            className={`h-6 px-2 rounded-md border text-[11px] font-mono cursor-pointer transition-colors ${
              showSearch
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                : 'bg-[#16161c] border-white/[0.08] text-zinc-300 hover:text-white'
            }`}
          >
            Find
          </button>
          <button
            type="button"
            onClick={() => void handleCopySelection()}
            title="Copy selected text (or full scrollback if none selected)"
            className="h-6 px-2 rounded-md bg-[#16161c] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            {copiedNotice ? 'Copied!' : 'Copy'}
          </button>
          <button
            type="button"
            onClick={handleExportLog}
            title="Export terminal session log"
            className="h-6 px-2 rounded-md bg-[#16161c] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            Export
          </button>
          <button
            type="button"
            disabled={status !== 'live'}
            onClick={() => sendWsJson({ type: 'signal', signal: 'SIGINT' })}
            title="Send Ctrl+C interrupt (SIGINT)"
            className="h-6 px-2 rounded-md bg-amber-500/15 border border-amber-500/30 text-[11px] font-mono text-amber-200 hover:bg-amber-500/25 cursor-pointer disabled:opacity-40"
          >
            Ctrl+C
          </button>
          <button
            type="button"
            disabled={status !== 'live'}
            onClick={() => sendWsJson({ type: 'kill' })}
            title="Kill shell process"
            className="h-6 px-2 rounded-md bg-rose-500/15 border border-rose-500/30 text-[11px] font-mono text-rose-200 hover:bg-rose-500/25 cursor-pointer disabled:opacity-40"
          >
            Kill
          </button>
          <button
            type="button"
            onClick={restartShell}
            title="Restart shell session"
            className="h-6 px-2 rounded-md bg-[#16161c] border border-white/[0.08] text-[11px] font-mono text-zinc-200 hover:text-white hover:border-sky-400/40 cursor-pointer"
          >
            Restart
          </button>
          <button
            type="button"
            onClick={() => termRef.current?.clear()}
            title="Clear terminal viewport"
            className="h-6 px-2 rounded-md bg-[#16161c] border border-white/[0.08] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            Clear
          </button>
          {canClosePane && onClosePane && (
            <button
              type="button"
              onClick={onClosePane}
              title="Close split pane"
              className="h-6 px-2 rounded-md bg-[#16161c] border border-white/[0.08] text-[11px] font-mono text-zinc-400 hover:text-rose-300 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>
      </div>

      {/* In-Terminal Search Bar (Ctrl+F) */}
      {showSearch && (
        <div className="flex items-center gap-2 px-3 py-1.5 bg-[#15151b] border-b border-white/[0.08]">
          <input
            ref={searchInputRef}
            type="text"
            value={searchTerm}
            onChange={(e) => {
              const val = e.target.value;
              setSearchTerm(val);
              if (val) {
                searchAddonRef.current?.findNext(val, {
                  caseSensitive: searchCaseSensitive,
                  incremental: true,
                });
              } else {
                searchAddonRef.current?.clearDecorations();
              }
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                runSearch(e.shiftKey ? 'prev' : 'next');
              } else if (e.key === 'Escape') {
                setShowSearch(false);
                searchAddonRef.current?.clearDecorations();
                termRef.current?.focus();
              }
            }}
            placeholder="Search terminal scrollback..."
            className="flex-1 h-6 px-2 rounded bg-[#09090c] border border-white/[0.1] text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-sky-400/50"
          />
          <button
            type="button"
            onClick={() => setSearchCaseSensitive((c) => !c)}
            title="Match Case"
            className={`h-6 px-2 rounded border text-[11px] font-mono cursor-pointer ${
              searchCaseSensitive
                ? 'bg-sky-500/20 border-sky-400/40 text-sky-200'
                : 'bg-[#09090c] border-white/[0.1] text-zinc-400'
            }`}
          >
            Aa
          </button>
          <button
            type="button"
            onClick={() => runSearch('prev')}
            className="h-6 px-2 rounded bg-[#09090c] border border-white/[0.1] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            ↑
          </button>
          <button
            type="button"
            onClick={() => runSearch('next')}
            className="h-6 px-2 rounded bg-[#09090c] border border-white/[0.1] text-[11px] font-mono text-zinc-300 hover:text-white cursor-pointer"
          >
            ↓
          </button>
          <button
            type="button"
            onClick={() => {
              setShowSearch(false);
              searchAddonRef.current?.clearDecorations();
              termRef.current?.focus();
            }}
            className="h-6 px-2 rounded bg-[#09090c] border border-white/[0.1] text-[11px] font-mono text-zinc-400 hover:text-white cursor-pointer"
          >
            Esc
          </button>
        </div>
      )}

      {/* xterm.js Canvas */}
      <div className="relative w-full flex-1 min-h-0">
        <div
          ref={containerRef}
          onContextMenu={(e) => {
            e.preventDefault();
            onFocus();
            setContextMenu({ x: e.clientX, y: e.clientY });
          }}
          className={`w-full ${heightClass} p-1.5 bg-[#09090c] overflow-hidden`}
        />
        {isScrolledUp && (
          <button
            type="button"
            onClick={() => {
              termRef.current?.scrollToBottom();
              setIsScrolledUp(false);
              termRef.current?.focus();
            }}
            className="absolute bottom-3 right-4 z-20 px-2.5 py-1 rounded-lg bg-[#16161c]/95 border border-sky-400/40 text-[11px] font-mono text-sky-200 hover:text-white shadow-lg cursor-pointer"
            title="Jump to bottom"
          >
            ↓ Bottom
          </button>
        )}
      </div>

      {/* Right-Click Context Menu */}
      {contextMenu && (
        <div
          style={{
            position: 'fixed',
            left: Math.min(contextMenu.x, window.innerWidth - 190),
            top: Math.min(contextMenu.y, window.innerHeight - 250),
          }}
          onClick={(e) => e.stopPropagation()}
          className="z-[90] w-44 py-1 rounded-xl bg-[#16161c] border border-white/[0.14] shadow-2xl text-xs font-mono text-zinc-200 flex flex-col"
          role="menu"
        >
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              void handleCopySelection();
            }}
            className="px-3 py-1.5 text-left hover:bg-white/[0.08] hover:text-white flex justify-between cursor-pointer"
          >
            <span>Copy</span>
            <span className="text-zinc-500">Ctrl+C</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              void navigator.clipboard?.readText?.().then((text) => {
                if (text) sendWsJson({ type: 'input', data: text });
                termRef.current?.focus();
              });
            }}
            className="px-3 py-1.5 text-left hover:bg-white/[0.08] hover:text-white flex justify-between cursor-pointer"
          >
            <span>Paste</span>
            <span className="text-zinc-500">Ctrl+V</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              termRef.current?.selectAll();
              termRef.current?.focus();
            }}
            className="px-3 py-1.5 text-left hover:bg-white/[0.08] hover:text-white cursor-pointer"
          >
            Select All
          </button>
          <div className="my-1 border-t border-white/[0.08]" />
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              setShowSearch(true);
              window.setTimeout(() => searchInputRef.current?.focus(), 20);
            }}
            className="px-3 py-1.5 text-left hover:bg-white/[0.08] hover:text-white flex justify-between cursor-pointer"
          >
            <span>Find</span>
            <span className="text-zinc-500">Ctrl+F</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              termRef.current?.clear();
              termRef.current?.focus();
            }}
            className="px-3 py-1.5 text-left hover:bg-white/[0.08] hover:text-white flex justify-between cursor-pointer"
          >
            <span>Clear</span>
            <span className="text-zinc-500">Ctrl+L</span>
          </button>
          {onSplitPane && (
            <button
              type="button"
              onClick={() => {
                setContextMenu(null);
                onSplitPane();
              }}
              className="px-3 py-1.5 text-left hover:bg-white/[0.08] hover:text-white cursor-pointer"
            >
              Split Pane
            </button>
          )}
          <div className="my-1 border-t border-white/[0.08]" />
          <button
            type="button"
            onClick={() => {
              setContextMenu(null);
              restartShell();
            }}
            className="px-3 py-1.5 text-left hover:bg-white/[0.08] text-amber-300 hover:text-amber-200 cursor-pointer"
          >
            Restart Shell
          </button>
        </div>
      )}
    </div>
  );
});

export default TerminalPane;
