import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { SoulLogoIcon } from './SoulLogo';
import {
  DesktopInfoResponse,
  createDesktopShortcut,
  fetchDesktopInfo,
  launchDesktopApp,
} from '../services/api';

export interface ShortcutsModalProps {
  open: boolean;
  onClose: () => void;
  onNavigate: (viewId: string) => void;
  projectsCount: number;
  packagesCount: number;
  docsCount: number;
  canInstallPwa?: boolean;
  onInstallPwa?: () => Promise<void> | void;
  onToggleSidebar?: () => void;
  onFocusSearch?: () => void;
}

const APP_VERSION = '0.0.1';
const GITHUB_RELEASE_EXE_URL = 'https://github.com/dheena017/Soul-DevPortal/releases/tag/v0.0.1';

const VIEW_SHORTCUTS = [
  { keys: 'Ctrl + 1', label: 'Workspace Overview', route: 'overview' },
  { keys: 'Ctrl + 2', label: 'Projects & Apps', route: 'projects' },
  { keys: 'Ctrl + 3', label: 'Shared Packages', route: 'packages' },
  { keys: 'Ctrl + 4', label: 'Architecture & Docs', route: 'docs' },
  { keys: 'Ctrl + 5', label: 'Computer Monitor', route: 'computer' },
  { keys: 'Ctrl + 6', label: 'Developer Hub', route: 'portal' },
  { keys: 'Ctrl + 7', label: 'Everyday Utilities', route: 'everyday' },
  { keys: 'Ctrl + 8', label: 'Notes & Journal', route: 'everyday/notes' },
  { keys: 'Ctrl + 9', label: 'Focus & Breathing', route: 'everyday/focus' },
  { keys: 'Ctrl + 0', label: 'Developer Profile', route: 'profile' },
];

const HASH_SHORTCUTS = [
  { hash: '#changelog', label: 'Workspace Changelog', route: 'changelog' },
  { hash: '#code-updates', label: 'Codebase Updates by Date', route: 'code-updates' },
];

export const ShortcutsModal: React.FC<ShortcutsModalProps> = ({
  open,
  onClose,
  onNavigate,
  projectsCount,
  packagesCount,
  docsCount,
  canInstallPwa = false,
  onInstallPwa,
  onToggleSidebar,
  onFocusSearch,
}) => {
  const [desktopInfo, setDesktopInfo] = useState<DesktopInfoResponse | null>(null);
  const [loadingDesktop, setLoadingDesktop] = useState<boolean>(false);
  const [pwaInstalling, setPwaInstalling] = useState<boolean>(false);
  const [shortcutBusy, setShortcutBusy] = useState<boolean>(false);
  const [launchingApp, setLaunchingApp] = useState<boolean>(false);
  const [shortcutDone, setShortcutDone] = useState<boolean>(false);
  const [desktopNotice, setDesktopNotice] = useState<{ tone: 'success' | 'info' | 'error'; text: string } | null>(null);

  const isDesktopRuntime = typeof window !== 'undefined' && Boolean(window.soulDesktop?.isDesktop);
  const desktopVersions = typeof window !== 'undefined' ? window.soulDesktop?.versions : undefined;

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoadingDesktop(true);
    setDesktopNotice(null);
    fetchDesktopInfo()
      .then((info) => {
        if (active) {
          setDesktopInfo(info);
          setShortcutDone(Boolean(info?.shortcutInstalled));
        }
      })
      .finally(() => {
        if (active) setLoadingDesktop(false);
      });
    return () => {
      active = false;
    };
  }, [open]);

  if (!open) return null;

  const setupArtifact = desktopInfo?.artifacts.find((a) => a.variant === 'setup');
  const portableArtifact = desktopInfo?.artifacts.find((a) => a.variant === 'portable');
  const primaryInstaller = setupArtifact || portableArtifact;
  const isShortcutReady = shortcutDone || Boolean(desktopInfo?.shortcutInstalled);
  const releasesUrl = desktopInfo?.githubReleasesUrl || GITHUB_RELEASE_EXE_URL;

  const handleInstallShortcut = async () => {
    setShortcutBusy(true);
    setDesktopNotice(null);
    try {
      const res = await createDesktopShortcut();
      if (res?.success) {
        setShortcutDone(true);
        setDesktopNotice({
          tone: 'success',
          text: 'Created Soul DevPortal shortcut on Desktop & Start Menu.',
        });
      } else {
        setDesktopNotice({
          tone: 'error',
          text: res?.error || 'Could not create shortcut automatically.',
        });
      }
    } finally {
      setShortcutBusy(false);
    }
  };

  const handleLaunchDesktop = async () => {
    setLaunchingApp(true);
    setDesktopNotice(null);
    try {
      const res = await launchDesktopApp();
      if (res?.launched) {
        setDesktopNotice({
          tone: 'success',
          text: 'Desktop App opened on dedicated local ports.',
        });
      } else {
        setDesktopNotice({
          tone: 'error',
          text: res?.error || 'Unable to start Desktop App window.',
        });
      }
    } finally {
      setLaunchingApp(false);
    }
  };

  const handleJump = (route: string) => {
    onNavigate(route);
    onClose();
  };

  const noticeClasses =
    desktopNotice?.tone === 'error'
      ? 'bg-rose-500/12 border-rose-400/30 text-rose-200'
      : 'bg-emerald-500/12 border-emerald-400/30 text-emerald-200';

  const modalMarkup = (
    <div
      className="fixed inset-0 z-[90] flex items-center justify-center p-2.5 sm:p-5 bg-black/75 portal-backdrop-enter"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="soul-shortcuts-modal-title"
    >
      <div
        className="relative w-full max-w-4xl max-h-[calc(100dvh-1.25rem)] sm:max-h-[min(90dvh,740px)] rounded-2xl neu-modal bg-[#0e1017] border border-white/[0.12] flex flex-col overflow-hidden portal-header-sheen"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Pinned Modal Header ── */}
        <div className="shrink-0 bg-[#12141c] border-b border-white/[0.08] px-4 py-3.5 sm:px-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl neu-tile bg-[#181b25] border border-white/[0.12] flex items-center justify-center shrink-0">
              <SoulLogoIcon size={22} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2
                  id="soul-shortcuts-modal-title"
                  className="text-sm sm:text-base font-extrabold tracking-tight text-white truncate"
                >
                  Soul DevPortal v{APP_VERSION} · Desktop &amp; Shortcuts
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border shrink-0 ${
                    isDesktopRuntime
                      ? 'bg-emerald-500/15 border-emerald-500/35 text-emerald-300'
                      : 'bg-sky-500/15 border-sky-400/35 text-sky-300'
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isDesktopRuntime ? 'bg-emerald-400 status-pulse' : 'bg-sky-400'
                    }`}
                  />
                  {isDesktopRuntime ? 'Desktop App' : 'Web App'}
                </span>
              </div>
              <p className="text-[11px] sm:text-xs text-zinc-400 truncate">
                {projectsCount} Apps · {packagesCount} Packages · {docsCount} Guides
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close desktop app and shortcuts dialog"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#181b25] border border-white/[0.12] text-xs font-mono text-zinc-300 hover:text-white hover:border-white/[0.28] hover:bg-white/[0.08] transition-all cursor-pointer shrink-0"
          >
            <span>Esc</span>
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* ── Scrollable Body Pane ── */}
        <div
          id="soul-shortcuts-scroll"
          tabIndex={0}
          className="flex-1 min-h-0 overflow-y-auto sidebar-scroll overscroll-contain p-4 sm:p-5 flex flex-col gap-4 focus:outline-none"
        >
          {/* ── Standalone Desktop App Card ── */}
          <section className="relative rounded-2xl neu-card bg-gradient-to-br from-[#161924] via-[#12141d] to-[#0f1016] border border-sky-400/25 p-4 sm:p-5 flex flex-col gap-3.5 overflow-hidden shrink-0">
            <div
              className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(56,189,248,0.10),transparent_58%)]"
              aria-hidden="true"
            />

            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="min-w-0 flex-1 flex flex-col gap-1.5">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-300">
                    DESKTOP APPLICATION · STANDALONE
                  </span>
                  <span className="px-2 py-0.5 rounded bg-sky-500/15 border border-sky-400/30 text-[10px] font-mono font-bold text-sky-200">
                    v{APP_VERSION}
                  </span>
                  {primaryInstaller && (
                    <span className="px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/30 text-[10px] font-mono font-bold text-emerald-300">
                      Ready · {primaryInstaller.sizeLabel}
                    </span>
                  )}
                </div>

                <h3 className="text-sm sm:text-base font-bold text-white leading-snug">
                  Soul DevPortal Standalone Windows App
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed max-w-2xl">
                  Opens in a dedicated desktop window with its own private UI and backend service ports — ready to use without opening a terminal or browser.
                </p>
              </div>

              <div className="shrink-0 flex flex-wrap items-center gap-2 lg:justify-end min-h-[38px]">
                {loadingDesktop ? (
                  <span className="inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-mono text-zinc-300">
                    <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
                    Checking release...
                  </span>
                ) : (
                  <>
                    {primaryInstaller ? (
                      <a
                        href={primaryInstaller.downloadUrl}
                        download={primaryInstaller.name}
                        className="neu-btn inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold transition-all whitespace-nowrap"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Download App (.exe)</span>
                        <span className="text-[10px] font-mono text-zinc-600">{primaryInstaller.sizeLabel}</span>
                      </a>
                    ) : (
                      <a
                        href={releasesUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="neu-btn inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold transition-all whitespace-nowrap"
                      >
                        <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                          <polyline points="7 10 12 15 17 10" />
                          <line x1="12" y1="15" x2="12" y2="3" />
                        </svg>
                        <span>Download v{APP_VERSION} (.exe)</span>
                      </a>
                    )}

                    {desktopInfo?.shortcutSupported ? (
                      !isShortcutReady ? (
                        <button
                          type="button"
                          disabled={shortcutBusy}
                          onClick={handleInstallShortcut}
                          className="neu-btn inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-[#1a1d28] border border-white/[0.14] hover:border-sky-400/45 text-white text-xs font-extrabold transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                        >
                          <span>{shortcutBusy ? 'Creating Shortcut...' : 'Desktop Shortcut'}</span>
                        </button>
                      ) : !isDesktopRuntime && desktopInfo?.canLaunchDesktop ? (
                        <button
                          type="button"
                          disabled={launchingApp}
                          onClick={handleLaunchDesktop}
                          className="neu-btn inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-emerald-400 text-zinc-950 hover:bg-emerald-300 text-xs font-extrabold transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                        >
                          <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>{launchingApp ? 'Opening App...' : 'Open Desktop App'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 h-9 px-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-bold text-emerald-300 whitespace-nowrap">
                          <span>Shortcut Ready ✓</span>
                        </span>
                      )
                    ) : (
                      canInstallPwa &&
                      onInstallPwa &&
                      !isDesktopRuntime && (
                        <button
                          type="button"
                          disabled={pwaInstalling}
                          onClick={async () => {
                            setPwaInstalling(true);
                            try {
                              await onInstallPwa();
                            } finally {
                              setPwaInstalling(false);
                            }
                          }}
                          className="neu-btn inline-flex items-center gap-2 h-9 px-3.5 rounded-xl bg-[#1a1d28] border border-white/[0.14] hover:border-sky-400/45 text-white text-xs font-extrabold transition-all cursor-pointer disabled:opacity-60 whitespace-nowrap"
                        >
                          <span>{pwaInstalling ? 'Installing...' : 'Install Desktop App'}</span>
                        </button>
                      )
                    )}
                  </>
                )}
              </div>
            </div>

            {desktopNotice && (
              <div
                role="status"
                className={`relative z-10 flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${noticeClasses}`}
              >
                <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span>{desktopNotice.text}</span>
              </div>
            )}

            <div className="relative z-10 flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-white/[0.08] text-[11px] font-mono text-zinc-300">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b0d12] border border-white/[0.08]">
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400/80" aria-hidden="true" />
                  Isolated Local Server &amp; UI
                </span>
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#0b0d12] border border-white/[0.08]">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400/80" aria-hidden="true" />
                  System Tray Support
                </span>
                {desktopVersions?.electron && (
                  <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                    Electron v{desktopVersions.electron}
                  </span>
                )}
              </div>
              {isShortcutReady && (
                <span className="text-[10.5px] font-mono text-emerald-300/90">
                  Desktop &amp; Start Menu shortcut installed ✓
                </span>
              )}
            </div>
          </section>

          {/* ── Balanced Keyboard Shortcuts & Quick Navigation Matrix ── */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-stretch shrink-0">
            {/* Left Column: Global Controls + Hash Links */}
            <section className="lg:col-span-5 rounded-2xl neu-card bg-[#13151d] border border-white/[0.08] p-4 flex flex-col justify-between gap-3 text-xs">
              <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Global Controls
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">Anywhere</span>
                </div>

                <div className="flex flex-col divide-y divide-white/[0.06]">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onToggleSidebar?.();
                    }}
                    className="flex items-center justify-between py-2 text-zinc-200 hover:text-sky-300 transition-colors text-left cursor-pointer"
                  >
                    <span>Toggle Sidebar</span>
                    <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0b0c11] border border-white/[0.14] text-zinc-200">
                      Ctrl + B
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onFocusSearch?.();
                    }}
                    className="flex items-center justify-between py-2 text-zinc-200 hover:text-sky-300 transition-colors text-left cursor-pointer"
                  >
                    <span>Quick Search</span>
                    <span className="flex items-center gap-1.5">
                      <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0b0c11] border border-white/[0.14] text-zinc-200">
                        /
                      </kbd>
                      <span className="text-zinc-500 text-[10px]">or</span>
                      <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0b0c11] border border-white/[0.14] text-zinc-200">
                        Ctrl + K
                      </kbd>
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center justify-between py-2 text-zinc-200 hover:text-sky-300 transition-colors text-left cursor-pointer"
                  >
                    <span>Close Modals / Search</span>
                    <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0b0c11] border border-white/[0.14] text-zinc-200">
                      Esc
                    </kbd>
                  </button>

                  <button
                    type="button"
                    onClick={onClose}
                    className="flex items-center justify-between py-2 text-zinc-200 hover:text-sky-300 transition-colors text-left cursor-pointer"
                  >
                    <span>Desktop App &amp; Help</span>
                    <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0b0c11] border border-white/[0.14] text-zinc-200">
                      ?
                    </kbd>
                  </button>
                </div>
              </div>

              <div className="pt-2.5 border-t border-white/[0.08] flex flex-col gap-1.5">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                    Release &amp; Code Logs
                  </span>
                  <span className="text-[10px] font-mono text-zinc-500">URL Hash</span>
                </div>
                <div className="flex flex-col gap-1.5">
                  {HASH_SHORTCUTS.map((item) => (
                    <button
                      key={item.route}
                      type="button"
                      onClick={() => handleJump(item.route)}
                      className="flex items-center justify-between gap-2 px-2.5 py-2 rounded-lg bg-[#0b0d12] border border-white/[0.07] hover:border-sky-400/35 hover:bg-sky-500/[0.06] text-zinc-200 hover:text-sky-200 transition-all text-left cursor-pointer"
                    >
                      <span className="truncate">{item.label}</span>
                      <kbd className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#151822] border border-white/[0.12] text-sky-300 shrink-0">
                        {item.hash}
                      </kbd>
                    </button>
                  ))}
                </div>
              </div>
            </section>

            {/* Right Column: Quick View Shortcuts (Ctrl + 1..9 in balanced 2-col subgrid) */}
            <section className="lg:col-span-7 rounded-2xl neu-card bg-[#13151d] border border-white/[0.08] p-4 flex flex-col gap-3 text-xs">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                  Quick View Shortcuts (Ctrl + 1–9)
                </span>
                <span className="text-[10px] font-mono text-zinc-500">Click any view to open</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 flex-1 content-start">
                {VIEW_SHORTCUTS.map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => handleJump(item.route)}
                    className="flex items-center justify-between gap-2 px-3 py-2.5 rounded-lg bg-[#0b0d12] border border-white/[0.07] hover:border-sky-400/40 hover:bg-sky-500/[0.07] text-zinc-200 hover:text-white transition-all text-left cursor-pointer group"
                  >
                    <span className="truncate font-medium group-hover:text-sky-200 transition-colors">
                      {item.label}
                    </span>
                    <kbd className="px-2 py-0.5 rounded text-[10.5px] font-mono bg-[#151822] border border-white/[0.12] text-zinc-200 group-hover:border-sky-400/35 group-hover:text-sky-200 shrink-0 transition-colors">
                      {item.keys}
                    </kbd>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </div>

        {/* ── Pinned Modal Footer ── */}
        <div className="shrink-0 px-4 sm:px-6 py-2.5 bg-[#0b0c11] border-t border-white/[0.07] flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-zinc-500">
          <span>Press ? to toggle · Ctrl + 1–9 to jump · Esc to close</span>
          <span className="text-zinc-400">Soul DevPortal v{APP_VERSION}</span>
        </div>
      </div>
    </div>
  );

  if (typeof document !== 'undefined' && document.body) {
    return createPortal(modalMarkup, document.body);
  }
  return modalMarkup;
};
export default ShortcutsModal;
