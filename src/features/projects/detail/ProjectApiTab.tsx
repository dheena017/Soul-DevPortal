import React, { useState, useMemo } from 'react';
import CopyButton from '../../../components/CopyButton';
import { ProjectData } from '../../../types';

export interface ProjectApiTabProps {
  project: ProjectData;
  beUrl: string | null;
}

export default function ProjectApiTab({ project, beUrl }: ProjectApiTabProps) {
  const [filter, setFilter] = useState<string>('');
  const endpoints = project.apiEndpoints || [];

  const filteredEndpoints = useMemo(() => {
    const needle = filter.trim().toLowerCase();
    if (!needle) return endpoints;
    return endpoints.filter((ep) => ep.toLowerCase().includes(needle));
  }, [endpoints, filter]);

  return (
    <section className="w-full p-5 md:p-6 rounded-2xl bg-[#161b22] border border-[#30363d] shadow-2xl flex flex-col gap-5">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#21262d]">
        <div className="flex flex-col gap-0.5">
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-neutral-400">PROJECT API</span>
          <h2 className="text-lg font-bold text-white">Registered API Endpoints</h2>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex items-center min-w-[220px]">
            <svg className="absolute left-3 w-3.5 h-3.5 text-neutral-500 pointer-events-none" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="11" cy="11" r="8" />
              <line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Filter endpoint routes..."
              aria-label="Filter endpoint routes"
              className="w-full h-9 pl-9 pr-8 rounded-lg bg-[#0d1117] border border-[#30363d] text-xs text-neutral-200 placeholder-neutral-500 focus:outline-none focus:border-neutral-500 transition-all font-mono"
            />
            {filter && (
              <button
                type="button"
                className="absolute right-2.5 text-xs text-neutral-400 hover:text-neutral-200 p-1"
                onClick={() => setFilter('')}
                title="Clear filter"
              >
                ✕
              </button>
            )}
          </div>
          {beUrl && (
            <a
              href={`${beUrl}/api/docs`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-[#161b22] border border-[#30363d] text-neutral-300 hover:text-neutral-200 hover:border-neutral-500 transition-all"
            >
              <span>Swagger OpenAPI</span>
              <span>↗</span>
            </a>
          )}
        </div>
      </div>

      {filteredEndpoints.length > 0 ? (
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-bold text-neutral-300">HTTP REST Endpoints</span>
            <span className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-[#161b22] border border-[#30363d] text-neutral-300">
              {filteredEndpoints.length} routes
            </span>
          </div>

          <div className="flex flex-col gap-2">
            {filteredEndpoints.map((ep, idx) => {
              const [method, ...pathParts] = ep.split(' ');
              const pathStr = pathParts.join(' ');
              const isGet = method === 'GET';
              const isPost = method === 'POST';
              const isDelete = method === 'DELETE';
              const isPut = method === 'PUT';

              const methodStyle = isGet
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : isPost
                ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-400'
                : 'bg-[#161b22] border-[#30363d] text-neutral-300';

              const fullUrl = beUrl ? `${beUrl}${pathStr || method}` : pathStr || method;
              const curlCmd = `curl -X ${method} "${fullUrl}" -H "Content-Type: application/json"`;

              return (
                <div
                  key={idx}
                  className="flex items-center justify-between p-3 rounded-xl bg-[#161b22] border border-[#30363d] hover:border-neutral-500 hover:bg-[#161b22] transition-all gap-3"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-extrabold uppercase border ${methodStyle}`}>
                      {method}
                    </span>
                    <code className="text-xs font-mono text-neutral-200 truncate">{pathStr || method}</code>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <CopyButton text={fullUrl} variant="compact" label="URL" />
                    <CopyButton text={curlCmd} variant="compact" label="cURL" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-xl bg-[#161b22] border border-[#30363d] text-center flex flex-col items-center gap-3">
          <p className="text-xs text-neutral-400 max-w-md">
            {filter ? 'No endpoints match your search filter.' : 'No endpoints explicitly declared in metadata.json. Standard healthcheck route available below:'}
          </p>
          {project.backendPort && (
            <div className="flex items-center justify-between w-full max-w-md p-3 rounded-xl bg-[#161b22] border border-[#30363d]">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-[#161b22] border border-[#30363d] text-neutral-300">
                  GET
                </span>
                <code className="text-xs font-mono text-neutral-200">/api/health</code>
              </div>
              <CopyButton text={`http://localhost:${project.backendPort}/api/health`} variant="compact" />
            </div>
          )}
        </div>
      )}
    </section>
  );
}
