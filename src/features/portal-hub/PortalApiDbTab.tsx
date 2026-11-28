import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { API_DB_RESOURCES } from './portalHubConstants';

export default function PortalApiDbTab() {
  return (
    <PortalResourceSection
      eyebrow="REST · SSE · REGEX · JWT · SQLITE WAL"
      title="API Testing & Database Utilities"
      subtitle="API clients, JWT/Regex debuggers, JSON visualizers, and SQLite WAL diagnostics."
      accent="emerald"
      primaryUrl="https://hoppscotch.io/"
      primaryLabel="Open Hoppscotch"
      items={API_DB_RESOURCES}
    />
  );
}
