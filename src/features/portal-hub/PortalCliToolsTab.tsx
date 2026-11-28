import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { CLI_TOOLS_RESOURCES } from './portalHubConstants';

export default function PortalCliToolsTab() {
  return (
    <PortalResourceSection
      eyebrow="GIT · POWERSHELL 7 · RIPGREP · JQ · WORKSPACE"
      title="CLI & Terminal Productivity Tools"
      subtitle="Essential command-line manuals, Windows Terminal & PowerShell 7 docs, and workspace port/CLI utilities."
      accent="amber"
      primaryUrl="https://git-scm.com/docs"
      primaryLabel="Open Git Docs"
      items={CLI_TOOLS_RESOURCES}
    />
  );
}
