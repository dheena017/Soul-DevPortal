/**
 * Opens a workspace view in a separate desktop panel window (when running inside
 * the Electron desktop app) or in a new browser tab (when running on the web).
 */
export function openStandalonePanel(
  routeHash: string,
  panelKey: string,
  panelTitle: string
): void {
  const cleanHash = routeHash.replace(/^#/, '') || 'changelog';

  if (typeof window === 'undefined') return;

  if (window.soulDesktop?.isDesktop && typeof window.soulDesktop.openPanel === 'function') {
    void window.soulDesktop.openPanel(cleanHash, panelTitle, panelKey);
    return;
  }

  const targetUrl = `${window.location.origin}${window.location.pathname}?panel=${encodeURIComponent(
    panelKey
  )}#${cleanHash}`;
  window.open(targetUrl, '_blank', 'noopener,noreferrer');
}

export function openChangelogPanel(): void {
  openStandalonePanel('changelog', 'changelog', 'Workspace Changelog · Soul DevPortal');
}
