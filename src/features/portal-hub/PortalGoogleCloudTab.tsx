import React from 'react';
import PortalResourceSection from './PortalResourceSection';
import { GCLOUD_RESOURCES } from './portalHubConstants';

export default function PortalGoogleCloudTab() {
  return (
    <PortalResourceSection
      eyebrow="GCP CONSOLE · CLOUD RUN · BIGQUERY · STORAGE"
      title="Google Cloud Console & CLI"
      subtitle="Direct links and gcloud/bq commands for Cloud Run services, BigQuery datasets, Cloud Storage buckets, Vertex AI, and IAM credentials."
      accent="sky"
      primaryUrl="https://console.cloud.google.com/"
      primaryLabel="Open Google Cloud"
      items={GCLOUD_RESOURCES}
    />
  );
}
