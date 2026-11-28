import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { GITHUB_REPO_URL, GITHUB_RESOURCES } from './portalHubConstants';

export default function PortalGitHubTab() {
  return (
    <PortalResourceSection
      eyebrow="SOURCE CONTROL · PACKAGES · CI/CD"
      title="GitHub Workspace & Package Registry"
      subtitle="Used for hosting Soul-DevPortal and Soul-DevPortal-Packages, publishing 78 private @dheena017/* npm packages, and running GitHub Actions CI workflows."
      accent="purple"
      primaryUrl={GITHUB_REPO_URL}
      primaryLabel="Open GitHub"
      items={GITHUB_RESOURCES}
    />
  );
}
