import React from 'react';
import { usePersistedTab } from '../../utils/usePersistedTab';
import { PackageData, ProjectData } from '../../types';
import { PortalHubTab } from './portalHubConstants';
import PortalHubHeader from './PortalHubHeader';
import PortalGitHubTab from './PortalGitHubTab';
import PortalLeetCodeTab from './PortalLeetCodeTab';
import PortalGoogleCloudTab from './PortalGoogleCloudTab';
import PortalAiConsolesTab from './PortalAiConsolesTab';
import PortalDevOpsTab from './PortalDevOpsTab';
import PortalDocsRefTab from './PortalDocsRefTab';
import PortalDesignUiTab from './PortalDesignUiTab';
import PortalApiDbTab from './PortalApiDbTab';
import PortalSecurityTestTab from './PortalSecurityTestTab';
import PortalContainersTab from './PortalContainersTab';
import PortalLearningTab from './PortalLearningTab';
import PortalMedia3dTab from './PortalMedia3dTab';
import PortalCliToolsTab from './PortalCliToolsTab';
import PortalMonitoringTab from './PortalMonitoringTab';
import PortalPkgManagersTab from './PortalPkgManagersTab';

export interface PortalHubViewProps {
  projects?: ProjectData[];
  packages?: PackageData[];
  onNavigate: (viewId: string) => void;
  onBack?: () => void;
  onOpenShortcuts?: () => void;
}

export default function PortalHubView({
  packages = [],
  onNavigate,
  onBack,
  onOpenShortcuts,
}: PortalHubViewProps) {
  const [activeTab, setActiveTab] = usePersistedTab<PortalHubTab>(
    'soul-tab-hub',
    'github',
    [
      'github',
      'leetcode',
      'gcloud',
      'ai',
      'devops',
      'docsref',
      'design',
      'apidb',
      'security',
      'containers',
      'learning',
      'media3d',
      'cli',
      'monitoring',
      'pkgmgrs',
    ]
  );

  return (
    <article className="w-full flex flex-col gap-6 pb-12 animate-in fade-in duration-300 portal-stagger">
      <PortalHubHeader
        packageCount={packages.length}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onNavigate={onNavigate}
        onBack={onBack}
        onOpenShortcuts={onOpenShortcuts}
      />

      <div key={activeTab} className="w-full tab-content-animate">
        {activeTab === 'github' && <PortalGitHubTab />}
        {activeTab === 'leetcode' && <PortalLeetCodeTab />}
        {activeTab === 'gcloud' && <PortalGoogleCloudTab />}
        {activeTab === 'ai' && <PortalAiConsolesTab />}
        {activeTab === 'devops' && <PortalDevOpsTab />}
        {activeTab === 'docsref' && <PortalDocsRefTab />}
        {activeTab === 'design' && <PortalDesignUiTab />}
        {activeTab === 'apidb' && <PortalApiDbTab />}
        {activeTab === 'security' && <PortalSecurityTestTab />}
        {activeTab === 'containers' && <PortalContainersTab />}
        {activeTab === 'learning' && <PortalLearningTab />}
        {activeTab === 'media3d' && <PortalMedia3dTab />}
        {activeTab === 'cli' && <PortalCliToolsTab />}
        {activeTab === 'monitoring' && <PortalMonitoringTab />}
        {activeTab === 'pkgmgrs' && <PortalPkgManagersTab />}
      </div>
    </article>
  );
}
