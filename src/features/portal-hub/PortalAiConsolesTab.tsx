import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { AI_CONSOLE_RESOURCES } from './portalHubConstants';

export default function PortalAiConsolesTab() {
  return (
    <PortalResourceSection
      eyebrow="GEMINI · OPENAI · ANTHROPIC · LOCAL WEIGHTS"
      title="AI & Model Provider Consoles"
      subtitle="API key management, prompt workbenches, and model catalogs powering @workspace/ai-agents, @workspace/ai-router, and @workspace/ai-local."
      accent="emerald"
      primaryUrl="https://aistudio.google.com/"
      primaryLabel="Open AI Studio"
      items={AI_CONSOLE_RESOURCES}
    />
  );
}
