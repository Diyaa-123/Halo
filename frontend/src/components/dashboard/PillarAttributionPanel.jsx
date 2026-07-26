import React, { useState, useEffect } from 'react';
import { BehavioralPriorWidget } from './BehavioralPriorWidget';
import { useSensing } from '../../hooks/SensingContext';

export const PillarAttributionPanel = () => {
  const { 
    presenceGate, 
    actualOccupancyCount, 
    heartRate, 
    breathingRate, 
    primaryWieat 
  } = useSensing();

  const [pillar1Spatial, setPillar1Spatial] = useState(0.0);
  const [pillar2Temporal, setPillar2Temporal] = useState(0.80); // Default prior
  const [pillar3Biometric, setPillar3Biometric] = useState(0.0);
  const [pillar4Behavioral, setPillar4Behavioral] = useState(0.0);

  // Dynamic Bayesian Updates from Live Telemetry
  useEffect(() => {
    // Pillar 1: Spatial Containment
    // High if gate is inside, scaled by occupancy count confidence
    let p1 = 0.0;
    if (presenceGate?.status === 'inside') {
      p1 = 0.85 + Math.min(0.15, (actualOccupancyCount || 1) * 0.05);
    } else if (presenceGate?.anomaly_score > 0) {
      p1 = Math.min(0.5, presenceGate.anomaly_score);
    }
    setPillar1Spatial(p1);

    // Pillar 3: Biometric Signature
    // High if both HR and BR are actively tracked
    let p3 = 0.0;
    if (heartRate && breathingRate) p3 = 0.95;
    else if (heartRate || breathingRate) p3 = 0.60;
    setPillar3Biometric(p3);

    // Pillar 4: Behavioral Context (WiEat)
    // High if actively eating, otherwise falls back to the widget prior
    let p4 = pillar2Temporal; // Base prior assumption for shared space
    if (primaryWieat?.is_eating) {
      p4 = 0.98; // High confidence behavioral lock
    } else if (primaryWieat?.chew_count > 0 || primaryWieat?.swallow_count > 0) {
      p4 = 0.85; // Recent eating history
    }
    setPillar4Behavioral(p4);

  }, [presenceGate, actualOccupancyCount, heartRate, breathingRate, primaryWieat, pillar2Temporal]);

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
            Bayesian confidence scoring across 4 independent evidence pillars (Live Data)
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
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            {presenceGate?.status === 'inside' ? `Bounded (${actualOccupancyCount} occ)` : 'Outside / Unbounded'}
          </div>
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
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            {heartRate ? `HR: ${heartRate.toFixed(0)} | BR: ${breathingRate?.toFixed(1) || '--'}` : 'No vital peaks detected'}
          </div>
        </div>

        <div style={{ background: 'rgba(14, 116, 144, 0.15)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(6, 182, 212, 0.4)' }}>
          <div style={{ fontSize: '0.75rem', color: '#38bdf8', fontWeight: 600 }}>Pillar 4 (WiEat)</div>
          <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#e2e8f0' }}>Behavioral Context Priors</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 700, color: '#38bdf8', marginTop: '6px' }}>{(pillar4Behavioral * 100).toFixed(0)}%</div>
          <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '4px' }}>
            {primaryWieat?.is_eating ? `Eating (Chews: ${primaryWieat.chew_count})` : 'Idle / Ambient behavior'}
          </div>
        </div>
      </div>

      <BehavioralPriorWidget onPriorUpdate={(score) => setPillar2Temporal(score)} />
    </div>
  );
};

export default PillarAttributionPanel;