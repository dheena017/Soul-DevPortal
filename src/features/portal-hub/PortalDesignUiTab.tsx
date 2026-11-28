import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { DESIGN_UI_RESOURCES } from './portalHubConstants';

export default function PortalDesignUiTab() {
  return (
    <PortalResourceSection
      eyebrow="FIGMA · ICONS · DIAGRAMS · ACCESSIBILITY"
      title="Design, UI & Accessibility Tools"
      subtitle="UI design, SVG optimization, color palettes, diagramming, and WCAG contrast verification tools."
      accent="purple"
      primaryUrl="https://www.figma.com/"
      primaryLabel="Open Figma"
      items={DESIGN_UI_RESOURCES}
    />
  );
}
