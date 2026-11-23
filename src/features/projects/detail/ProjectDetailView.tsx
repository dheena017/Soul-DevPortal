import React, { useState, useMemo } from 'react';
import { ProjectData } from '../../../types';
import { PROJECT_FEATURES_MAP } from '../projectsConstants';
import ProjectDetailHeader, { ProjectDetailTab } from './ProjectDetailHeader';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectFilesTab from './ProjectFilesTab';
import ProjectApiTab from './ProjectApiTab';
import ProjectDatabaseTab from './ProjectDatabaseTab';
import ProjectScriptsTab from './ProjectScriptsTab';
import ProjectEnvTab from './ProjectEnvTab';
import ProjectReadmeTab from './ProjectReadmeTab';

export interface ProjectDetailViewProps {
  project: ProjectData;
  onBack?: () => void;
}

export default function ProjectDetailView({ project, onBack }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('overview');
  const [portTesting, setPortTesting] = useState<boolean>(false);
  const [portStatus, setPortStatus] = useState<{ fe: string; be: string; latency: number } | null>(null);
  const [showSecretPlaceholders, setShowSecretPlaceholders] = useState<boolean>(false);

  const runnerCmd = `npx @workspace/runner project ${project.id}`;
  const feUrl = project.frontendPort ? `http://localhost:${project.frontendPort}` : null;
  const beUrl = project.backendPort ? `http://localhost:${project.backendPort}` : null;

  const scriptsEntries = useMemo(() => Object.entries(project.scripts || {}), [project.scripts]);
  const depsEntries = useMemo(() => Object.entries(project.dependencies || {}), [project.dependencies]);
  const devDepsEntries = useMemo(() => Object.entries(project.devDependencies || {}), [project.devDependencies]);
  const envKeys = useMemo(() => project.envKeys || project.configuration || [], [project.envKeys, project.configuration]);
  const fileTree = useMemo(() => project.fileTree || [], [project.fileTree]);
  const tables = useMemo(() => project.tables || [], [project.tables]);

  const featuresList = useMemo(() => {
    if (project.features && project.features.length > 0) {
      return project.features.map((f) => {
        if (typeof f === 'object' && f !== null) {
          return {
            title: (f as any).name || (f as any).title || 'Feature',
            desc: (f as any).description || '',
          };
        }
        return { title: String(f), desc: '' };
      });
    }
    const defaultFeatures = PROJECT_FEATURES_MAP[project.id] || [];
    return defaultFeatures.map((f) => ({ title: f, desc: '' }));
  }, [project.features, project.id]);

  const handleTestPorts = () => {
    setPortTesting(true);
    setTimeout(() => {
      setPortTesting(false);
      setPortStatus({
        fe: project.frontendPort ? 'STANDBY / READY' : 'UNASSIGNED',
        be: project.backendPort ? 'STANDBY / READY' : 'UNASSIGNED',
        latency: Math.floor(Math.random() * 8) + 2,
      });
    }, 700);
  };

  const sampleEnvFile = useMemo(() => {
    return envKeys.map((k) => {
      if (k.includes('SECRET') || k.includes('KEY')) return `${k}="sk_monorepo_sample_secret_key"`;
      if (k === 'PORT' || k === 'BACKEND_PORT') return `${k}="${project.backendPort || 8000}"`;
      if (k === 'FRONTEND_PORT') return `${k}="${project.frontendPort || 5173}"`;
      if (k === 'APP_URL') return `${k}="http://localhost:${project.frontendPort || 5173}"`;
      if (k === 'BACKEND_URL') return `${k}="http://localhost:${project.backendPort || 8000}"`;
      if (k === 'NODE_ENV') return `${k}="development"`;
      return `${k}="sample_${k.toLowerCase()}_val"`;
    }).join('\n');
  }, [envKeys, project.backendPort, project.frontendPort]);

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300">
      <ProjectDetailHeader
        project={project}
        activeTab={activeTab}
        onTabChange={setActiveTab}
        portTesting={portTesting}
        portStatus={portStatus}
        onTestPorts={handleTestPorts}
        fileTreeCount={fileTree.length}
        tablesCount={tables.length}
        scriptsCount={scriptsEntries.length}
        envCount={envKeys.length}
        feUrl={feUrl}
        beUrl={beUrl}
        onBack={onBack}
      />

      {activeTab === 'overview' && (
        <ProjectOverviewTab
          project={project}
          featuresList={featuresList}
          scriptsCount={scriptsEntries.length}
          totalDepsCount={depsEntries.length + devDepsEntries.length}
          envCount={envKeys.length}
          runnerCmd={runnerCmd}
          feUrl={feUrl}
          beUrl={beUrl}
          fileTree={fileTree}
          onNavigateToFiles={() => setActiveTab('files')}
        />
      )}

      {activeTab === 'files' && (
        <ProjectFilesTab project={project} fileTree={fileTree} />
      )}

      {activeTab === 'api' && (
        <ProjectApiTab project={project} beUrl={beUrl} />
      )}

      {activeTab === 'database' && (
        <ProjectDatabaseTab project={project} tables={tables} />
      )}

      {activeTab === 'scripts' && (
        <ProjectScriptsTab scriptsEntries={scriptsEntries} />
      )}

      {activeTab === 'env' && (
        <ProjectEnvTab
          project={project}
          envKeys={envKeys}
          sampleEnvFile={sampleEnvFile}
          showSecretPlaceholders={showSecretPlaceholders}
          onToggleSecretPlaceholders={() => setShowSecretPlaceholders(!showSecretPlaceholders)}
          depsEntries={depsEntries}
          devDepsEntries={devDepsEntries}
        />
      )}

      {activeTab === 'readme' && (
        <ProjectReadmeTab project={project} />
      )}
    </article>
  );
}
