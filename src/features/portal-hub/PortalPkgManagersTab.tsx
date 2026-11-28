import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { PKG_MANAGERS_RESOURCES } from './portalHubConstants';

export default function PortalPkgManagersTab() {
  return (
    <PortalResourceSection
      eyebrow="UV · RUFF · PNPM · VITE 8 · ELECTRON"
      title="Package Managers & Build Tooling"
      subtitle="Modern Python/JS package managers, linters, Vite 8 bundler docs, Electron desktop docs, and workspace installs."
      accent="sky"
      primaryUrl="https://docs.astral.sh/uv/"
      primaryLabel="Open uv Docs"
      items={PKG_MANAGERS_RESOURCES}
    />
  );
}
