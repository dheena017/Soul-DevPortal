import React from 'react';
import { GuideMeta } from '../docsConstants';

export interface DocHighlightsTabProps {
  guideMeta: GuideMeta;
}

export default function DocHighlightsTab({ guideMeta }: DocHighlightsTabProps) {
  return (
    <div className="doc-highlights-tab" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Audience & Compliance Card */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '16px',
        }}
      >
        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            background: '#131313',
            border: '1px solid #242424',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🎯</span>
            <strong style={{ fontSize: '14px', color: '#ffffff' }}>Target Audience</strong>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8', lineHeight: 1.5 }}>
            {guideMeta.targetAudience}
          </p>
        </div>

        <div
          style={{
            padding: '20px',
            borderRadius: '10px',
            background: '#131313',
            border: '1px solid #242424',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <span style={{ fontSize: '16px' }}>🛡️</span>
            <strong style={{ fontSize: '14px', color: '#ffffff' }}>Compliance Mandate</strong>
          </div>
          <p style={{ margin: 0, fontSize: '13px', color: '#4ade80', lineHeight: 1.5 }}>
            {guideMeta.complianceStatus}
          </p>
        </div>
      </div>

      {/* Key Highlights Checklist */}
      <div
        style={{
          padding: '22px',
          borderRadius: '10px',
          background: '#131313',
          border: '1px solid #242424',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
          <span style={{ fontSize: '18px' }}>✨</span>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
            Core Standard Requirements &amp; Highlights
          </h3>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {guideMeta.keyHighlights.map((hl, index) => (
            <div
              key={index}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '12px',
                padding: '12px 14px',
                borderRadius: '8px',
                background: '#181818',
                border: '1px solid #262626',
              }}
            >
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'rgba(34, 197, 94, 0.15)',
                  border: '1px solid rgba(34, 197, 94, 0.35)',
                  color: '#4ade80',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: '11px',
                  fontWeight: 700,
                  flexShrink: 0,
                  marginTop: '1px',
                }}
              >
                ✓
              </span>
              <div style={{ fontSize: '13px', color: '#e2e8f0', lineHeight: 1.5 }}>
                {hl}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Topics Covered Tag Cloud */}
      <div
        style={{
          padding: '22px',
          borderRadius: '10px',
          background: '#131313',
          border: '1px solid #242424',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '14px' }}>
          <span style={{ fontSize: '18px' }}>🏷️</span>
          <h3 style={{ margin: 0, fontSize: '16px', color: '#ffffff', fontWeight: 700 }}>
            Covered Architecture Topics ({guideMeta.topics.length})
          </h3>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
          {guideMeta.topics.map((topic, i) => (
            <span
              key={i}
              style={{
                padding: '6px 12px',
                borderRadius: '6px',
                background: '#191919',
                border: '1px solid #2c2c2c',
                color: '#38bdf8',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              {topic}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
