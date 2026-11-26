import React, { useEffect, useState } from 'react';
import { HeroArtworkBackdrop } from './PortalVisuals';
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
}

const APP_VERSION = '0.0.1';
const GITHUB_RELEASE_EXE_URL = 'https://github.com/dheena017/Soul-DevPortal/releases/tag/v0.0.1';

const ROUTE_SHORTCUTS = [
  { keys: 'Ctrl + 1', label: 'Workspace Overview', route: 'overview' },
  { keys: '#changelog', label: 'Workspace Changelog', route: 'changelog' },
  { keys: '#code-updates', label: 'Codebase Updates by Date', route: 'code-updates' },
  { keys: 'Ctrl + 2', label: 'Projects & Apps', route: 'projects' },
  { keys: 'Ctrl + 3', label: 'Shared Packages', route: 'packages' },
  { keys: 'Ctrl + 4', label: 'Architecture & Docs', route: 'docs' },
  { keys: 'Ctrl + 5', label: 'Computer & Performance', route: 'computer' },
  { keys: 'Ctrl + 6', label: 'Developer Hub', route: 'portal' },
  { keys: 'Ctrl + 7', label: 'Everyday Utilities', route: 'everyday' },
  { keys: 'Ctrl + 8', label: 'Everyday Utilities: Notes & Journal', route: 'everyday/notes' },
  { keys: 'Ctrl + 9', label: 'Everyday Utilities: Focus Timer & Breathing', route: 'everyday/focus' },
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
}) => {
  const [desktopInfo, setDesktopInfo] = useState<DesktopInfoResponse | null>(null);
  const [loadingDesktop, setLoadingDesktop] = useState<boolean>(false);
  const [pwaInstalling, setPwaInstalling] = useState<boolean>(false);
  const [shortcutBusy, setShortcutBusy] = useState<boolean>(false);
  const [launchingApp, setLaunchingApp] = useState<boolean>(false);
  const [shortcutDone, setShortcutDone] = useState<boolean>(false);
  const [desktopNotice, setDesktopNotice] = useState<string | null>(null);

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
        setDesktopNotice('Created Soul DevPortal shortcut on Desktop & Start Menu.');
      } else {
        setDesktopNotice(res?.error || 'Could not create shortcut automatically.');
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
        setDesktopNotice('Desktop App opened on dedicated local ports.');
      } else {
        setDesktopNotice(res?.error || 'Unable to start Desktop App window.');
      }
    } finally {
      setLaunchingApp(false);
    }
  };

  const handleJump = (route: string) => {
    onNavigate(route);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in duration-200"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="soul-shortcuts-modal-title"
    >
      <div
        className="relative w-full max-w-2xl max-h-[88vh] rounded-2xl bg-[#111116] border border-white/[0.12] shadow-[0_24px_80px_rgba(0,0,0,0.85)] flex flex-col portal-header-sheen portal-page-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <HeroArtworkBackdrop src="/visuals/hero-overview-mesh.jpg" alt="" opacityClass="opacity-25 sm:opacity-35" />

        {/* ── Pinned Modal Header ── */}
        <div className="relative z-10 shrink-0 px-5 py-4 sm:px-6 border-b border-white/[0.08] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#181820] border border-white/[0.12] flex items-center justify-center shrink-0 shadow-inner">
              <SoulLogoIcon size={24} />
            </div>
            <div className="flex flex-col min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 id="soul-shortcuts-modal-title" className="text-base sm:text-lg font-extrabold tracking-tight text-white">
                  Soul DevPortal v{APP_VERSION} · Desktop &amp; Shortcuts
                </h2>
                <span
                  className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-mono font-bold uppercase tracking-wider border ${
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
              <p className="text-xs text-zinc-400 truncate">
                {projectsCount} Apps · {packagesCount} Packages · {docsCount} Guides
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close desktop app and shortcuts dialog"
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#181820] border border-white/[0.1] text-xs font-mono text-zinc-300 hover:text-white hover:border-white/[0.25] hover:bg-white/[0.08] transition-all cursor-pointer"
          >
            <span>Esc</span>
            <span aria-hidden="true">✕</span>
          </button>
        </div>

        {/* ── Scrollable Body Pane ── */}
        <div
          id="soul-shortcuts-scroll"
          tabIndex={0}
          className="relative z-10 flex-1 min-h-0 max-h-[calc(88vh-5.5rem)] overflow-y-auto overscroll-contain p-5 sm:p-6 flex flex-col gap-5 focus:outline-none"
        >
          {/* ── Standalone Desktop App Download Card ── */}
          <section className="relative z-10 rounded-2xl bg-gradient-to-br from-[#171923] via-[#13141c] to-[#111116] border border-sky-400/25 p-4 sm:p-5 flex flex-col gap-4 shadow-lg">
            <div className="flex flex-col gap-3">
              <div className="flex flex-col gap-1.5">
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
                <h3 className="text-sm sm:text-base font-bold text-white">
                  Soul DevPortal Standalone Windows App
                </h3>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Opens in a dedicated desktop window with its own private UI and backend service ports — ready to use without opening a terminal or browser.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2.5 pt-1">
                {loadingDesktop ? (
                  <span className="px-4 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.1] text-xs font-mono text-zinc-300">
                    Checking release...
                  </span>
                ) : (
                  <>
                    {primaryInstaller ? (
                      <a
                        href={primaryInstaller.downloadUrl}
                        download={primaryInstaller.name}
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold shadow-lg shadow-sky-500/15 transition-all"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                        className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-zinc-950 hover:bg-sky-100 text-xs font-extrabold shadow-lg shadow-sky-500/15 transition-all"
                      >
                        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
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
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1c26] border border-white/[0.14] hover:border-sky-400/45 text-white text-xs font-extrabold transition-all cursor-pointer disabled:opacity-60"
                        >
                          <span>{shortcutBusy ? 'Creating Shortcut...' : 'Desktop Shortcut'}</span>
                        </button>
                      ) : !isDesktopRuntime && desktopInfo?.canLaunchDesktop ? (
                        <button
                          type="button"
                          disabled={launchingApp}
                          onClick={handleLaunchDesktop}
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-400 text-zinc-950 hover:bg-emerald-300 text-xs font-extrabold shadow-lg shadow-emerald-500/20 transition-all cursor-pointer disabled:opacity-60"
                        >
                          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                            <polygon points="5 3 19 12 5 21 5 3" />
                          </svg>
                          <span>{launchingApp ? 'Opening App...' : 'Open Desktop App'}</span>
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-500/15 border border-emerald-500/35 text-xs font-bold text-emerald-300">
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
                          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#1a1c26] border border-white/[0.14] hover:border-sky-400/45 text-white text-xs font-extrabold transition-all cursor-pointer disabled:opacity-60"
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
              <div className="rounded-xl bg-emerald-500/10 border border-emerald-400/25 px-3 py-2 text-xs text-emerald-200">
                {desktopNotice}
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[0.08] text-[11px] font-mono text-zinc-300">
              <span className="px-2.5 py-1 rounded-lg bg-[#0c0d12] border border-white/[0.08]">
                Isolated Local Server &amp; UI
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-[#0c0d12] border border-white/[0.08]">
                System Tray Support
              </span>
              {desktopVersions?.electron && (
                <span className="px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/25 text-emerald-300">
                  Electron v{desktopVersions.electron}
                </span>
              )}
            </div>
          </section>

          {/* ── User Keyboard Shortcuts ── */}
          <div className="relative z-10 rounded-xl bg-[#15151b] border border-white/[0.08] p-4 flex flex-col gap-3 text-xs">
            <div className="flex items-center justify-between gap-2">
              <div className="text-[10px] font-mono font-bold uppercase tracking-wider text-zinc-400">
                Keyboard Shortcuts
              </div>
              <span className="text-[10px] font-mono text-zinc-500">Click any view to open</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-white/[0.06]">
              <div className="flex flex-col divide-y divide-white/[0.06]">
                <div className="flex items-center justify-between py-2 text-zinc-200">
                  <span>Toggle Sidebar</span>
                  <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c0d12] border border-white/[0.14] text-zinc-200">
                    Ctrl + B
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-2 text-zinc-200">
                  <span>Quick Search</span>
                  <div className="flex items-center gap-1.5">
                    <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c0d12] border border-white/[0.14] text-zinc-200">
                      /
                    </kbd>
                    <span className="text-zinc-500 text-[10px]">or</span>
                    <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c0d12] border border-white/[0.14] text-zinc-200">
                      Ctrl + K
                    </kbd>
                  </div>
                </div>
                <div className="flex items-center justify-between py-2 text-zinc-200">
                  <span>Close Modals / Search</span>
                  <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c0d12] border border-white/[0.14] text-zinc-200">
                    Esc
                  </kbd>
                </div>
                <div className="flex items-center justify-between py-2 text-zinc-200">
                  <span>Desktop App &amp; Help</span>
                  <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c0d12] border border-white/[0.14] text-zinc-200">
                    ?
                  </kbd>
                </div>
              </div>

              <div className="flex flex-col divide-y divide-white/[0.06]">
                {ROUTE_SHORTCUTS.map((item) => (
                  <button
                    key={item.route}
                    type="button"
                    onClick={() => handleJump(item.route)}
                    className="flex items-center justify-between py-2 text-zinc-200 hover:text-sky-300 transition-colors text-left cursor-pointer"
                  >
                    <span>{item.label}</span>
                    <kbd className="px-2 py-0.5 rounded text-[11px] font-mono bg-[#0c0d12] border border-white/[0.14] text-zinc-200">
                      {item.keys}
                    </kbd>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
export default ShortcutsModal;
