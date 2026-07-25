import React, { useState } from 'react';
import { BehavioralPriorWidget } from './BehavioralPriorWidget';

export const PillarAttributionPanel = () => {
  const [pillar1Spatial] = useState(0.90);
  const [pillar2Temporal] = useState(0.80);
  const [pillar3Biometric] = useState(0.70);
  const [pillar4Behavioral, setPillar4Behavioral] = useState(0.85);

  const calculateFusedConfidence = () => {
    const weights = { p1: 0.35, p2: 0.20, p3: 0.25, p4: 0.20 };
    return (
      (pillar1Spatial * weights.p1) +
      (pillar2Temporal * weights.p2) +
      (pillar3Biometric * weights.p3) +
      (pillar4Behavioral * weights.p4)
    );
  };

  const fusedScore = calculateFusedConfidence();
  const isHighConfidence = fusedScore >= 0.75;

  return (
    <div style={{
      width: '100%',
      maxWidth: '1000px',
      margin: '0 auto 24px auto',
      padding: '24px',
      background: 'rgba(10, 15, 29, 0.85)',
      borderRadius: '16px',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.5)',
      color: '#f8fafc',
      fontFamily: 'sans-serif'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(255, 255, 255, 0.1)' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8' }}>
            Multi-Evidence Attribution Engine
          </h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '0.8rem', color: '#94a3b8' }}>
            Bayesian confidence scoring across 4 independent evidence pillars
          </p>
        </div>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#94a3b8', letterSpacing: '0.05em' }}>
            Fused Attribution Score
          </span>
          <div style={{ fontSize: '1.75rem', fontWeight: 900, color: isHighConfidence ? '#34d399' : '#fbbf24' }}>
            {(fusedScore * 100).toFixed(1)}%
          </div>
          <span style={{ fontSize: '0.7rem', color: '#64748b' }}>
            {isHighConfidence ? 'Window Included in Baseline' : 'Window Excluded (Household Activity)'}
          </span>
        </div>
      </div>

      {/* 4 Pillars Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '20px' }}>
        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Pillar 1</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>Spatial Containment</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>{(pillar1Spatial * 100).toFixed(0)}%</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>10–15dB wall attenuation room scoping</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Pillar 2</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>Temporal Scheduling</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>{(pillar2Temporal * 100).toFixed(0)}%</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Overnight & routine single-occupant prior</div>
        </div>

        <div style={{ background: 'rgba(15, 23, 42, 0.6)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Pillar 3</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>Biometric Signature</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>{(pillar3Biometric * 100).toFixed(0)}%</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Respiratory rate, amplitude & regularity</div>
        </div>

        <div style={{ background: 'rgba(14, 116, 144, 0.15)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>Pillar 4 (Newly Added)</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>Behavioral Context Priors</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>{(pillar4Behavioral * 100).toFixed(0)}%</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>Shared-space activity prior logic</div>
        </div>
      </div>

      <BehavioralPriorWidget onPriorUpdate={(score) => setPillar4Behavioral(score)} />
    </div>
  );
};

export default PillarAttributionPanel;