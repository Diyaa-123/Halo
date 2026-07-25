import React, { useState, useEffect } from 'react';

export const BehavioralPriorWidget = ({ onPriorUpdate }) => {
  const [sharedSpaceMotion, setSharedSpaceMotion] = useState(false);
  const [targetRoomMotion, setTargetRoomMotion] = useState(true);
  const [bayesPriorScore, setBayesPriorScore] = useState(0.85);

  useEffect(() => {
    let priorScore = 0.50;

    if (!sharedSpaceMotion && targetRoomMotion) {
      priorScore = 0.92;
    } else if (sharedSpaceMotion && targetRoomMotion) {
      priorScore = 0.45;
    } else if (!targetRoomMotion) {
      priorScore = 0.10;
    }

    setBayesPriorScore(priorScore);
    if (onPriorUpdate) {
      onPriorUpdate(priorScore);
    }
  }, [sharedSpaceMotion, targetRoomMotion, onPriorUpdate]);

  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.6)',
      border: '1px solid rgba(255, 255, 255, 0.1)',
      borderRadius: '12px',
      padding: '16px',
      backdropFilter: 'blur(10px)',
      marginTop: '16px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h4 style={{ margin: 0, fontSize: '0.85rem', color: '#38bdf8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
          Pillar 4: Behavioral Context Prior
        </h4>
        <span style={{
          padding: '4px 10px',
          borderRadius: '20px',
          fontSize: '0.75rem',
          fontWeight: 600,
          background: bayesPriorScore > 0.7 ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
          color: bayesPriorScore > 0.7 ? '#34d399' : '#fbbf24',
          border: `1px solid ${bayesPriorScore > 0.7 ? 'rgba(16, 185, 129, 0.3)' : 'rgba(245, 158, 11, 0.3)'}`
        }}>
          Confidence: {(bayesPriorScore * 100).toFixed(0)}%
        </span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', margin: '16px 0' }}>
        {/* Shared Space Node */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Shared Space Node</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f8fafc' }}>
              {sharedSpaceMotion ? 'Motion Detected' : 'Quiet / Clear'}
            </span>
            <button
              onClick={() => setSharedSpaceMotion(!sharedSpaceMotion)}
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Toggle
            </button>
          </div>
        </div>

        {/* Target Room Node */}
        <div style={{ background: 'rgba(30, 41, 59, 0.5)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.05)' }}>
          <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>Target Room Node</div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '8px' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#f8fafc' }}>
              {targetRoomMotion ? 'Active Sensing' : 'No Motion'}
            </span>
            <button
              onClick={() => setTargetRoomMotion(!targetRoomMotion)}
              style={{
                background: '#334155',
                color: '#f8fafc',
                border: 'none',
                padding: '4px 10px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontSize: '0.75rem'
              }}
            >
              Toggle
            </button>
          </div>
        </div>
      </div>

      <p style={{ margin: 0, fontSize: '0.75rem', color: '#94a3b8', lineHeight: '1.4' }}>
        <strong style={{ color: '#cbd5e1' }}>Context Rule:</strong> If shared spaces show no motion while target room is active, attribution confidence increases without requiring direct biometric identity verification.
      </p>
    </div>
  );
};