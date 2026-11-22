import React, { useState, useEffect } from 'react';
import { consoleLogger } from '@workspace/logger';
import { MONOREPO_PROJECT_PORTS, MonorepoPortEntry } from './exploreConstants';

export interface PortProberProps {
  onRefresh?: () => void;
}

interface SocketStatus {
  [port: number]: boolean;
}

export default function PortProber({ onRefresh }: PortProberProps) {
  const [proberState, setProberState] = useState<SocketStatus>({});
  const [loading, setLoading] = useState(false);
  const [lastChecked, setLastChecked] = useState<string>('');

  const checkLivePorts = async () => {
    setLoading(true);
    consoleLogger.info('PROBER', 'Probing active project ports (:5173-:5181, :8000-:8008)...');
    const startTime = performance.now();
    try {
      consoleLogger.apiSent('GET', '/api/projects');
      const res = await fetch('/api/projects');
      const duration = performance.now() - startTime;
      consoleLogger.apiComing('GET', '/api/projects', res.status, duration);

      if (res.ok) {
        const projects = await res.json();
        const statusMap: SocketStatus = {};
        let liveCount = 0;
        projects.forEach((proj: any) => {
          if (proj.frontend?.port) {
            const isLive = Boolean(proj.frontend.isLive);
            statusMap[proj.frontend.port] = isLive;
            if (isLive) liveCount++;
          }
          if (proj.backend?.port) {
            const isLive = Boolean(proj.backend.isLive);
            statusMap[proj.backend.port] = isLive;
            if (isLive) liveCount++;
          }
        });
        setProberState(statusMap);
        setLastChecked(new Date().toLocaleTimeString());
        consoleLogger.success('PROBER', `Socket probe complete: ${liveCount} active port(s) detected`);
      }
    } catch (err) {
      // Offline fallback: simulate default probe
      setLastChecked(new Date().toLocaleTimeString() + ' (Offline fallback)');
      consoleLogger.warn('PROBER', 'Socket probe offline fallback: DevPortal backend not reachable', err);
    } finally {
      setLoading(false);
      if (onRefresh) onRefresh();
    }
  };

  useEffect(() => {
    checkLivePorts();
  }, []);

  return (
    <div className="port-prober-container">
      <div className="prober-header-row">
        <div>
          <h3>Monorepo Port Allocation &amp; Collision Matrix</h3>
          <p className="prober-sub">
            Assigned dedicated frontend (5173-5181) and backend (8000-8008) ports with zero collision guarantee.
          </p>
        </div>
        <div className="prober-actions">
          {lastChecked && <span className="last-checked">Checked: {lastChecked}</span>}
          <button
            type="button"
            className="prober-refresh-btn"
            onClick={checkLivePorts}
            disabled={loading}
          >
            {loading ? 'Probing Sockets...' : '⚡ Probe Sockets'}
          </button>
        </div>
      </div>

      <div className="port-matrix-table-wrap">
        <table className="port-matrix-table">
          <thead>
            <tr>
              <th>Project</th>
              <th>Frontend Port</th>
              <th>Status</th>
              <th>Backend Port</th>
              <th>Status</th>
              <th>Database</th>
              <th>Framework Stack</th>
            </tr>
          </thead>
          <tbody>
            {MONOREPO_PROJECT_PORTS.map((proj) => {
              const feActive = proberState[proj.frontendPort];
              const beActive = proberState[proj.backendPort];

              return (
                <tr key={proj.slug}>
                  <td className="proj-cell">
                    <strong>{proj.name}</strong>
                    <span className="slug-hint">Soul-DevPortal-Projects/{proj.slug}</span>
                  </td>
                  <td className="port-cell">
                    <code>:{proj.frontendPort}</code>
                  </td>
                  <td>
                    <span className={`status-pill ${feActive ? 'online' : 'idle'}`}>
                      <span className="dot" />
                      {feActive ? 'LIVE' : 'IDLE'}
                    </span>
                  </td>
                  <td className="port-cell">
                    <code>:{proj.backendPort}</code>
                  </td>
                  <td>
                    <span className={`status-pill ${beActive ? 'online' : 'idle'}`}>
                      <span className="dot" />
                      {beActive ? 'LIVE' : 'IDLE'}
                    </span>
                  </td>
                  <td>
                    <span className="db-badge">{proj.database}</span>
                  </td>
                  <td>
                    <span className="framework-text">{proj.framework}</span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
