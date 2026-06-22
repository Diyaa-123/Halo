import React from 'react';
import './PageLayout.css';

export default function AttributionPage() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>policy</span>
          <div>
            <h1 className="page-layout__title">Attribution Transparency</h1>
            <p className="page-layout__subtitle">Four-pillar Bayesian fusion analysis for multi-occupant sensing</p>
          </div>
        </div>
        <span className="badge badge-stable">92% CONFIDENCE TODAY</span>
      </div>

      <div className="page-layout__content">
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <h3 className="section-label">Bayesian Fusion Breakdown</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 20 }}>
            How SilentSense identifies that the detected vital signs belong to Dad (Arun), rejecting interference from other household members.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[
              { title: 'Spatial Pillar', score: '98%', desc: 'Activity is isolated to the primary bedroom sensor zone.', color: 'var(--primary)' },
              { title: 'Temporal Pillar', score: '95%', desc: 'Matches historical probability of presence at 3:00 AM.', color: 'var(--secondary)' },
              { title: 'Biometric Pillar', score: '88%', desc: 'Breathing signature (rate/amplitude) matches enrolled profile.', color: 'var(--warning-amber)' },
              { title: 'Behavioral Pillar', score: '90%', desc: 'No competing activity detected in adjacent shared spaces.', color: 'var(--primary)' }
            ].map(p => (
              <div key={p.title} style={{ padding: 16, background: 'var(--surface-container-low)', borderRadius: 'var(--radius)', borderTop: `3px solid ${p.color}` }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 24, fontWeight: 700, color: p.color, marginBottom: 8 }}>{p.score}</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="section-label">Signal Window Quality (Last 7 Days)</h3>
          <div style={{ display: 'flex', height: 40, width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: '75%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 600 }}>High Confidence (75%)</div>
            <div style={{ width: '15%', background: 'var(--warning-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 12, fontWeight: 600 }}>Partial</div>
            <div style={{ width: '10%', background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface)', fontSize: 12, fontWeight: 600 }}>Excluded</div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--outline)' }}>
            * Excluded windows (10%) are automatically discarded to prevent false metrics when multiple people are in the same room.
          </p>
        </div>
      </div>
    </div>
  );
}
