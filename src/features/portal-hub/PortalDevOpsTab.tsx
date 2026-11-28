import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { DEVOPS_RESOURCES } from './portalHubConstants';

export default function PortalDevOpsTab() {
  return (
    <PortalResourceSection
      eyebrow="HOSTING · REGISTRIES · LOCAL API"
      title="DevOps, Hosting & Package Registries"
      subtitle="Deployment dashboards (Vercel, Netlify, Cloudflare), npm/PyPI registries, and local Portal Swagger docs (:8008)."
      accent="rose"
      primaryUrl="http://127.0.0.1:8008/docs"
      primaryLabel="Open Local Swagger"
      items={DEVOPS_RESOURCES}
    />
  );
}
