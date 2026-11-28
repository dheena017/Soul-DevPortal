import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { SECURITY_QA_RESOURCES } from './portalHubConstants';

export default function PortalSecurityTestTab() {
  return (
    <PortalResourceSection
      eyebrow="PLAYWRIGHT · PYTEST · OWASP · AUDITS"
      title="Security, Testing & Performance QA"
      subtitle="Automated testing frameworks, security advisories, Core Web Vitals, and local workspace health checks."
      accent="amber"
      primaryUrl="https://playwright.dev/docs/intro"
      primaryLabel="Open Playwright"
      items={SECURITY_QA_RESOURCES}
    />
  );
}
