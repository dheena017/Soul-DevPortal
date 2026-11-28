import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { LEARNING_RESOURCES } from './portalHubConstants';

export default function PortalLearningTab() {
  return (
    <PortalResourceSection
      eyebrow="SYSTEM DESIGN · ROADMAPS · PATTERNS"
      title="Learning & System Design"
      subtitle="Developer skill roadmaps, distributed system design primers, GoF design patterns, and coding puzzles."
      accent="purple"
      primaryUrl="https://roadmap.sh/"
      primaryLabel="Open Roadmap.sh"
      items={LEARNING_RESOURCES}
    />
  );
}
