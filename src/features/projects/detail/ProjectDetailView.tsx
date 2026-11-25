import React, { useState, useMemo, useEffect } from 'react';
import { ProjectData } from '../../../types';
import { PROJECT_FEATURES_MAP, PROJECT_LOGOS } from '../projectsConstants';
import { fetchProjectHealth, fetchProjectTab } from '../../../services/api';
import ProjectDetailHeader, { ProjectDetailTab } from './ProjectDetailHeader';
import ProjectOverviewTab from './ProjectOverviewTab';
import ProjectFilesTab from './ProjectFilesTab';
import ProjectApiTab from './ProjectApiTab';
import ProjectDatabaseTab from './ProjectDatabaseTab';
import ProjectScriptsTab from './ProjectScriptsTab';
import ProjectEnvTab from './ProjectEnvTab';
import ProjectReadmeTab from './ProjectReadmeTab';

export interface ProjectDetailViewProps {
  key?: React.Key;
  project: ProjectData;
  onBack?: () => void;
}

export default function ProjectDetailView({ project, onBack }: ProjectDetailViewProps) {
  const [activeTab, setActiveTab] = useState<ProjectDetailTab>('overview');
  const [portTesting, setPortTesting] = useState<boolean>(false);
  const [portStatus, setPortStatus] = useState<{ fe: string; be: string; latency: number } | null>(null);
  const [showSecretPlaceholders, setShowSecretPlaceholders] = useState<boolean>(false);
  const [tabData, setTabData] = useState<Record<string, any>>({});
  const [loadingTabs, setLoadingTabs] = useState<Record<ProjectDetailTab, boolean>>({
    overview: true,
    files: true,
    api: true,
    database: true,
    scripts: true,
    env: true,
    readme: true,
  });

  useEffect(() => {
    let isMounted = true;
    const tabNames: ProjectDetailTab[] = ['overview', 'files', 'api', 'database', 'scripts', 'env', 'readme'];

    setTabData({});
    setLoadingTabs({
      overview: true,
      files: true,
      api: true,
      database: true,
      scripts: true,
      env: true,
      readme: true,
    });

    // Preload all tabs concurrently so badges and tab explorer immediately have live data
    tabNames.forEach(async (tab) => {
      try {
        const data = await fetchProjectTab(project.id, tab);
        if (data && isMounted) {
          setTabData((prev) => ({ ...prev, [tab]: data }));
        }
      } catch {
        // Fallback to static props
      } finally {
        if (isMounted) {
          setLoadingTabs((prev) => ({ ...prev, [tab]: false }));
        }
      }
    });

    return () => {
      isMounted = false;
    };
  }, [project.id]);

  const enhancedProject = useMemo(() => {
    return {
      ...project,
      title: project.title ? project.title.toUpperCase() : project.id.toUpperCase(),
      version: project.version || '0.0.0',
      logo: project.logo || PROJECT_LOGOS[project.id],
      framework: project.framework || 'React 19 + Vite 8 + Tailwind CSS v4',
      dbInfo: project.dbInfo || `SQLite (server/data/${project.id.replace(/-ai$/, '')}.db)`,
      aiEngine: project.aiEngine && project.aiEngine !== 'N/A' ? project.aiEngine : 'Google Gemini 2.5 Flash',
    };
  }, [project]);

  const runnerCmd = `npx @workspace/runner project ${project.id}`;
  const feUrl = project.frontendPort ? `http://localhost:${project.frontendPort}` : null;
  const beUrl = project.backendPort ? `http://localhost:${project.backendPort}` : null;

  const scriptsEntries = useMemo(() => {
    if (tabData.scripts?.scripts && Object.keys(tabData.scripts.scripts).length > 0) {
      return Object.entries(tabData.scripts.scripts);
    }
    return Object.entries(project.scripts || {});
  }, [tabData.scripts, project.scripts]);

  const depsEntries = useMemo(() => Object.entries(project.dependencies || {}), [project.dependencies]);
  const devDepsEntries = useMemo(() => Object.entries(project.devDependencies || {}), [project.devDependencies]);

  const envKeys = useMemo(() => {
    if (tabData.env?.templateKeys && tabData.env.templateKeys.length > 0) {
      return tabData.env.templateKeys;
    }
    if (tabData.env?.envKeys && tabData.env.envKeys.length > 0) {
      return tabData.env.envKeys;
    }
    return project.envKeys || project.configuration || [];
  }, [tabData.env, project.envKeys, project.configuration]);

  const fileTree = useMemo(() => {
    const list = tabData.files?.fileTree || tabData.files?.tree;
    if (list && list.length > 0) {
      return list;
    }
    return project.fileTree || (project as any).tree || [];
  }, [tabData.files, project.fileTree, (project as any).tree]);

  const tables = useMemo(() => {
    const rawTables = tabData.database?.tables || tabData.database?.tableSchemas || project.tables || [];
    if (rawTables && rawTables.length > 0) {
      return rawTables.map((t: any) => (typeof t === 'string' ? t : t.name || t.tableName || ''));
    }
    return [];
  }, [tabData.database, project.tables]);

  const apiProject = useMemo(() => {
    const endpoints = tabData.api?.endpoints || tabData.api?.apiEndpoints;
    if (endpoints && endpoints.length > 0) {
      return {
        ...project,
        apiEndpoints: endpoints.map((ep: any) =>
          typeof ep === 'string' ? ep : `${ep.method} ${ep.path}`
        ),
      };
    }
    return project;
  }, [tabData.api, project]);

  const readmeProject = useMemo(() => {
    if (tabData.readme?.blocks && tabData.readme.blocks.length > 0) {
      return {
        ...project,
        readmeBlocks: tabData.readme.blocks,
      };
    }
    return project;
  }, [tabData.readme, project]);

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

  const handleTestPorts = async () => {
    setPortTesting(true);
    const start = performance.now();
    try {
      const health = await fetchProjectHealth(project.id);
      const latency = Math.max(1, Math.round(performance.now() - start));
      if (health && (health.frontend || health.backend)) {
        setPortStatus({
          fe: health.frontend?.isLive ? 'ONLINE / LISTENING' : (project.frontendPort ? 'STANDBY / OFFLINE' : 'UNASSIGNED'),
          be: health.backend?.isLive ? 'ONLINE / LISTENING' : (project.backendPort ? 'STANDBY / OFFLINE' : 'UNASSIGNED'),
          latency,
        });
      } else {
        setPortStatus({
          fe: project.frontendPort ? 'STANDBY' : 'UNASSIGNED',
          be: project.backendPort ? 'STANDBY' : 'UNASSIGNED',
          latency,
        });
      }
    } catch {
      setPortStatus({
        fe: project.frontendPort ? 'STANDBY' : 'UNASSIGNED',
        be: project.backendPort ? 'STANDBY' : 'UNASSIGNED',
        latency: Math.max(1, Math.round(performance.now() - start)),
      });
    } finally {
      setPortTesting(false);
    }
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
        project={enhancedProject}
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

      {/* ── Separate Tab Panels with Smooth Motion ── */}
      <div key={activeTab} className="w-full tab-content-animate">
        {activeTab === 'overview' && (
          <ProjectOverviewTab
            project={enhancedProject}
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
          <ProjectFilesTab
            project={project}
            fileTree={fileTree}
            isLoading={loadingTabs.files && fileTree.length === 0}
          />
        )}

        {activeTab === 'api' && (
          <ProjectApiTab
            project={apiProject}
            beUrl={beUrl}
            rawEndpoints={tabData.api?.endpoints || (project as any).rawEndpoints}
            isLoading={loadingTabs.api && (apiProject.apiEndpoints?.length || 0) === 0 && !(tabData.api?.endpoints?.length || (project as any).rawEndpoints?.length)}
          />
        )}

        {activeTab === 'database' && (
          <ProjectDatabaseTab
            project={project}
            tables={tables}
            isLoading={loadingTabs.database && tables.length === 0}
          />
        )}

        {activeTab === 'scripts' && (
          <ProjectScriptsTab
            scriptsEntries={scriptsEntries}
            isLoading={loadingTabs.scripts && scriptsEntries.length === 0}
          />
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
            isLoading={loadingTabs.env && envKeys.length === 0 && depsEntries.length === 0 && devDepsEntries.length === 0}
          />
        )}

        {activeTab === 'readme' && (
          <ProjectReadmeTab
            project={readmeProject}
            isLoading={loadingTabs.readme && !(readmeProject.readmeBlocks && readmeProject.readmeBlocks.length > 0)}
          />
        )}
      </div>
    </article>
  );
}
