import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { CONTAINERS_RESOURCES } from './portalHubConstants';

export default function PortalContainersTab() {
  return (
    <PortalResourceSection
      eyebrow="DOCKER · KUBERNETES · GHCR · PAAS"
      title="Containers, Orchestration & PaaS"
      subtitle="Container registries, Docker Compose specs, Kubernetes orchestration, and cloud PaaS dashboards."
      accent="sky"
      primaryUrl="https://hub.docker.com/"
      primaryLabel="Open Docker Hub"
      items={CONTAINERS_RESOURCES}
    />
  );
}
