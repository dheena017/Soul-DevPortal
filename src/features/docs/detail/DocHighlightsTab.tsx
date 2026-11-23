import React from 'react';
import { GuideMeta } from '../docsConstants';

export interface DocHighlightsTabProps {
  guideMeta: GuideMeta;
}

export default function DocHighlightsTab({ guideMeta }: DocHighlightsTabProps) {
  return (
    <section className="detail-section doc-highlights-section">
      <div className="section-heading">
        <div>
          <span className="section-kicker">KEY RULES &amp; HIGHLIGHTS</span>
          <h2>Mandatory Standards Checklist</h2>
        </div>
        <span className="group-badge">{guideMeta.keyHighlights.length} rules active</span>
      </div>

      {/* Top Audience & Compliance Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
          marginBottom: '20px',
        }}
      >
        <div className="reference-group" style={{ margin: 0 }}>
          <div className="reference-group-header">
            <div className="group-header-title">
              <span className="group-header-icon npm">🎯</span>
              <h3>Target Audience</h3>
            </div>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.6 }}>
            {guideMeta.targetAudience}
          </p>
        </div>

        <div className="reference-group" style={{ margin: 0 }}>
          <div className="reference-group-header">
            <div className="group-header-title">
              <span className="group-header-icon py">🛡️</span>
              <h3>Compliance Mandate</h3>
            </div>
            <span className="group-badge" style={{ color: '#4ade80', borderColor: 'rgba(74, 222, 128, 0.3)' }}>
              Enforced
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#4ade80', lineHeight: 1.6 }}>
            {guideMeta.complianceStatus}
          </p>
        </div>
      </div>

      {/* Key Highlights Checklist Card */}
      <div className="reference-group" style={{ margin: 0 }}>
        <div className="reference-group-header">
          <div className="group-header-title">
            <span className="group-header-icon scripts">✓</span>
            <h3>Authoritative Rules Checklist</h3>
          </div>
        </div>
        <div className="features-checklist" style={{ marginTop: '12px' }}>
          {guideMeta.keyHighlights.map((hl, idx) => (
            <div className="feature-check-item" key={idx}>
              <span className="check-bullet" style={{ color: '#38bdf8' }}>✓</span>
              <div>
                <strong style={{ fontSize: '13.5px', color: '#ffffff' }}>Rule #{idx + 1}</strong>
                <p className="feature-subdesc" style={{ marginTop: '4px', fontSize: '13px', color: '#cbd5e1' }}>
                  {hl}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
