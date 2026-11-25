import React, { useState, useMemo, useRef, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { ProjectData } from '../../types';
import ProjectHeader from './ProjectHeader';
import ProjectCard from './ProjectCard';

export interface ProjectsDashboardProps {
  projects?: ProjectData[];
  onBack?: () => void;
  onSelectProject?: (projectId: string) => void;
}

export default function ProjectsDashboard({
  projects = [],
  onBack,
  onSelectProject,
}: ProjectsDashboardProps) {
  const [query, setQuery] = useState<string>('');
  const [filterFramework, setFilterFramework] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const handleSelect = (projectId: string) => {
    const proj = projects.find((p) => p.id === projectId);
    consoleLogger.action('PROJECTS', `Selected project: ${proj ? proj.title : projectId}`, { projectId });
    onSelectProject?.(projectId);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        e.key === '/' &&
        document.activeElement !== searchInputRef.current &&
        !['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName || '')
      ) {
        e.preventDefault();
        searchInputRef.current?.focus();
      } else if (e.key === 'Escape' && document.activeElement === searchInputRef.current) {
        if (query) {
          setQuery('');
        } else {
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [query]);

  // Dynamic Metrics Calculation
  const totalCount = projects.length;
  const fullstackCount = useMemo(
    () => projects.filter((p) => Boolean(p.frontendPort && p.backendPort)).length,
    [projects]
  );
  const standaloneCount = useMemo(
    () => projects.filter((p) => Boolean(p.frontendPort && !p.backendPort)).length,
    [projects]
  );

  const collisionsCount = useMemo(() => {
    const portMap = new Map<number, string[]>();
    let conflicts = 0;
    projects.forEach((p) => {
      if (p.frontendPort) {
        const list = portMap.get(p.frontendPort) || [];
        if (list.length > 0) conflicts++;
        list.push(`${p.id}:fe`);
        portMap.set(p.frontendPort, list);
      }
      if (p.backendPort) {
        const list = portMap.get(p.backendPort) || [];
        if (list.length > 0) conflicts++;
        list.push(`${p.id}:be`);
        portMap.set(p.backendPort, list);
      }
    });
    return conflicts;
  }, [projects]);

  const sqliteIsolationPercent = '100%';

  const frameworksList = useMemo(() => {
    const set = new Set<string>();
    projects.forEach((p) => {
      if (p.framework?.includes('React 19')) set.add('React 19');
      else if (p.framework?.includes('React 18')) set.add('React 18');
      else if (p.framework?.includes('Next.js')) set.add('Next.js');
    });
    return ['all', ...Array.from(set)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      const desc = p.description || '';
      const tags = (p.tags || []).join(' ');
      const matchesQuery = !query.trim() || [
        p.title,
        p.id,
        desc,
        tags,
        p.framework,
        p.dbInfo,
        p.aiEngine,
        p.frontendPort?.toString(),
        p.backendPort?.toString(),
      ].join(' ').toLowerCase().includes(query.trim().toLowerCase());

      const matchesFramework = filterFramework === 'all' || p.framework?.includes(filterFramework);

      return matchesQuery && matchesFramework;
    });
  }, [projects, query, filterFramework]);

  return (
    <article className="w-full flex flex-col gap-6 max-w-7xl mx-auto pb-12 animate-in fade-in duration-300 portal-stagger">
      {/* 1. Projects Header Component */}
      <ProjectHeader
        totalCount={totalCount}
        fullstackCount={fullstackCount}
        standaloneCount={standaloneCount}
        collisionsCount={collisionsCount}
        sqliteIsolationPercent={sqliteIsolationPercent}
        query={query}
        onQueryChange={setQuery}
        filterFramework={filterFramework}
        onFilterFrameworkChange={setFilterFramework}
        frameworksList={frameworksList}
        projects={projects}
        onBack={onBack}
        searchInputRef={searchInputRef}
      />

      {/* 2. Projects Grid with ProjectCard Components */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 portal-grid-stagger" aria-label="Monorepo projects">
        {filteredProjects.map((project) => (
          <ProjectCard
            key={project.id}
            project={project}
            onSelectProject={handleSelect}
          />
        ))}
      </section>

      {/* 3. Empty State Fallback */}
      {filteredProjects.length === 0 && (
        <div className="flex flex-col items-center justify-center p-12 rounded-2xl bg-[#111115] border border-white/[0.08] text-center gap-4 shadow-2xl">
          <span className="text-4xl">🔍</span>
          <p className="text-sm text-zinc-300 font-medium">No projects match your filter criteria.</p>
          <button
            type="button"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-white text-zinc-950 hover:bg-zinc-200 transition-all shadow-md shadow-white/10 cursor-pointer"
            onClick={() => {
              setQuery('');
              setFilterFramework('all');
            }}
          >
            Reset Filters
          </button>
        </div>
      )}
    </article>
  );
}
