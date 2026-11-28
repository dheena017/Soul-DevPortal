import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { DOCS_REF_RESOURCES } from './portalHubConstants';

export default function PortalDocsRefTab() {
  return (
    <PortalResourceSection
      eyebrow="MDN · REACT 19 · TAILWIND 4 · FASTAPI · PYTHON"
      title="Documentation & Language References"
      subtitle="Official documentation for the core frontend, backend, and scripting stack used across Soul-DevPortal."
      accent="sky"
      primaryUrl="https://developer.mozilla.org/"
      primaryLabel="Open MDN"
      items={DOCS_REF_RESOURCES}
    />
  );
}
