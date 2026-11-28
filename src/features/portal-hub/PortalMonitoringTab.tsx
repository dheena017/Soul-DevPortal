import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { MONITORING_RESOURCES } from './portalHubConstants';

export default function PortalMonitoringTab() {
  return (
    <PortalResourceSection
      eyebrow="OPENTELEMETRY · GRAFANA · PROMETHEUS · SENTRY"
      title="Monitoring, Telemetry & Logs"
      subtitle="Observability platforms, error tracking, live Portal SSE telemetry, and @workspace/logger runners."
      accent="rose"
      primaryUrl="http://127.0.0.1:8008/api/system/overview?window_sec=300"
      primaryLabel="Open Local Telemetry"
      items={MONITORING_RESOURCES}
    />
  );
}
