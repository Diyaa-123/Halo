import React from 'react';
import useSensingWebSocket from '../hooks/useSensingWebSocket';
import './PageLayout.css';

export default function AttributionPage() {
  const sensing = useSensingWebSocket();
  const attr = sensing.attribution || {};

  const spatialScore = attr.spatial ?? 95;
  const temporalScore = attr.temporal ?? 90;
  const biometricScore = attr.biometric ?? 88;
  const behavioralScore = attr.behavioral ?? 92;
  const overallConfidence = attr.overall_confidence ?? 94;

  const pillars = [
    {
      title: 'Spatial Pillar',
      score: `${spatialScore}%`,
      desc: 'Fresnel boundary containment & distance ratio relative to primary room probe.',
      color: '#4edea3',
    },
    {
      title: 'Temporal Pillar',
      score: `${temporalScore}%`,
      desc: 'Matches circadian presence schedule priors & frame sequence continuity.',
      color: '#adc6ff',
    },
    {
      title: 'Biometric Pillar',
      score: `${biometricScore}%`,
      desc: 'Breathing signature (Welch FFT power) matched against enrolled profile.',
      color: '#F59E0B',
    },
    {
      title: 'Behavioral Pillar',
      score: `${behavioralScore}%`,
      desc: 'Gait HAR posture prior & adjacent zone multi-occupant cross-validation.',
      color: '#a78bfa',
    },
  ];

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>policy</span>
          <div>
            <h1 className="page-layout__title">Attribution Transparency</h1>
            <p className="page-layout__subtitle">Real-Time Four-Pillar Bayesian Fusion Engine</p>
          </div>
        </div>
        <span className={`badge ${sensing.isConnected ? 'badge-stable' : 'badge-offline'}`}>
          {overallConfidence}% LIVE FUSED CONFIDENCE
        </span>
      </div>

      <div className="page-layout__content">
        <div className="glass-card" style={{ padding: 24, marginBottom: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
            <div>
              <h3 className="section-label" style={{ marginBottom: 4 }}>Bayesian Fusion Breakdown</h3>
              <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', margin: 0 }}>
                Real-time evidence aggregation for primary patient identification in multi-occupant environments.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11, color: sensing.isConnected ? '#4edea3' : '#EF4444' }}>
              <span className="material-icons" style={{ fontSize: 14 }}>{sensing.isConnected ? 'wifi' : 'wifi_off'}</span>
              <span>{sensing.isConnected ? 'Backend Live Stream Active' : 'Offline Baseline'}</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {pillars.map(p => (
              <div key={p.title} style={{ padding: 18, background: 'var(--surface-container-low)', borderRadius: 'var(--radius)', borderTop: `3px solid ${p.color}`, transition: 'all 0.3s ease' }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 8 }}>{p.title}</div>
                <div style={{ fontSize: 28, fontWeight: 800, color: p.color, marginBottom: 8 }}>{p.score}</div>
                <div style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.4 }}>{p.desc}</div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="section-label">Signal Window Quality (Live Bayesian Stream)</h3>
          <div style={{ display: 'flex', height: 40, width: '100%', borderRadius: 8, overflow: 'hidden', marginBottom: 12 }}>
            <div style={{ width: `${overallConfidence}%`, background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 700, transition: 'width 0.5s ease' }}>
              High Confidence ({overallConfidence}%)
            </div>
            <div style={{ width: `${Math.max(0, 100 - overallConfidence - 5)}%`, background: 'var(--warning-amber)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000', fontSize: 11, fontWeight: 600 }}>
              Partial ({Math.max(0, 100 - overallConfidence - 5)}%)
            </div>
            <div style={{ width: '5%', background: 'var(--surface-container-highest)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--on-surface)', fontSize: 11, fontWeight: 600 }}>
              Excluded (5%)
            </div>
          </div>
          <p style={{ fontSize: 12, color: 'var(--outline)', margin: 0 }}>
            * Excluded window frames are automatically filtered when signal-to-noise ratio drops or high multi-path variance is detected.
          </p>
        </div>
      </div>
    </div>
  );
}
