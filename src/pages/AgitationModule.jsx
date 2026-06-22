import React, { useState } from 'react';
import './PageLayout.css';

const agitationLevels = [
  { level: 1, label: 'Restlessness', color: '#adc6ff', icon: 'swap_vert', description: 'Minor movement variations. Patient adjusting position frequently.' },
  { level: 2, label: 'Repetitive Movement', color: '#F59E0B', icon: 'loop', description: 'Patient pacing detected for 12+ minutes. Circular movement pattern.' },
  { level: 3, label: 'Escalation', color: '#EF4444', icon: 'trending_up', description: 'Increased vocalisation. Risk of self-injury. Caregiver interaction needed.' },
  { level: 4, label: 'Critical', color: '#FF003C', icon: 'emergency', description: 'Severe agitation. Immediate intervention required.' },
];

const timelinePoints = [
  { time: '14:00', level: 1 },
  { time: '14:15', level: 1 },
  { time: '14:22', level: 2 },
  { time: '14:35', level: 2 },
  { time: '14:41', level: 3 },
  { time: '14:55', level: 2 },
  { time: '15:05', level: 1 },
  { time: '15:20', level: 1 },
];

export default function AgitationModule() {
  const [currentLevel, setCurrentLevel] = useState(2);

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#F59E0B' }}>psychology_alt</span>
          <div>
            <h1 className="page-layout__title">Dementia Agitation Module</h1>
            <p className="page-layout__subtitle">Real-time behavioral escalation tracking — Aarav Mehta</p>
          </div>
        </div>
        <span className="badge badge-warning">LEVEL 2 — REPETITIVE MOVEMENT</span>
      </div>

      <div className="page-layout__content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16 }}>
          {/* Left */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Level Indicators */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Agitation Levels</div>
              <div style={{ display: 'flex', gap: 10 }}>
                {agitationLevels.map(l => (
                  <div
                    key={l.level}
                    onClick={() => setCurrentLevel(l.level)}
                    style={{
                      flex: 1, padding: 12, borderRadius: 8, cursor: 'pointer',
                      background: currentLevel === l.level ? `${l.color}20` : 'rgba(255,255,255,0.02)',
                      border: `2px solid ${currentLevel === l.level ? l.color : 'var(--border-muted)'}`,
                      transition: 'all 0.15s ease',
                      textAlign: 'center',
                    }}
                  >
                    <span className="material-icons" style={{ color: l.color, fontSize: 24, display: 'block', marginBottom: 6 }}>{l.icon}</span>
                    <div style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.06em', textTransform: 'uppercase', color: l.color }}>Level {l.level}</div>
                    <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface)', marginTop: 2 }}>{l.label}</div>
                  </div>
                ))}
              </div>
              {/* Current level description */}
              <div style={{ marginTop: 12, padding: 10, background: 'rgba(255,255,255,0.03)', borderRadius: 6, border: '1px solid var(--border-muted)' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <span className="material-icons" style={{ color: agitationLevels[currentLevel - 1].color, fontSize: 16, flexShrink: 0 }}>info</span>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                    {agitationLevels[currentLevel - 1].description}
                  </p>
                </div>
              </div>
            </div>

            {/* Horizontal Timeline */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Agitation Timeline</div>
              <div style={{ position: 'relative', padding: '20px 0 30px' }}>
                {/* Axis line */}
                <div style={{ position: 'absolute', left: 0, right: 0, top: 'calc(50% - 1px)', height: 2, background: 'var(--border-muted)' }} />
                {/* Data points */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative' }}>
                  {timelinePoints.map((pt, i) => {
                    const cfg = agitationLevels[pt.level - 1];
                    const size = 8 + pt.level * 4;
                    return (
                      <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                        <span style={{ fontSize: 9, color: 'var(--outline)', marginBottom: 4 }}>{pt.time}</span>
                        <div style={{
                          width: size, height: size,
                          borderRadius: '50%',
                          background: cfg.color,
                          boxShadow: `0 0 ${size}px ${cfg.color}80`,
                          transition: 'all 0.3s',
                          animation: pt.level >= 3 ? 'blink 0.8s infinite' : 'none',
                        }} />
                        <span style={{ fontSize: 8, color: cfg.color, fontWeight: 700 }}>L{pt.level}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right: AI Rec */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="glass-card" style={{ padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>AI Recommendation Card</div>
              <div style={{ display: 'flex', gap: 8, padding: 12, background: 'rgba(245, 158, 11, 0.08)', borderRadius: 8, border: '1px solid rgba(245, 158, 11, 0.2)', marginBottom: 12 }}>
                <span className="material-icons" style={{ color: '#F59E0B', fontSize: 20, flexShrink: 0 }}>psychology</span>
                <div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: '#F59E0B', marginBottom: 4 }}>Patient pacing for 12 minutes.</p>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>Risk increasing. Recommend caregiver interaction. Consider sensory stimulation therapy.</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Duration', value: '12 min', color: '#F59E0B' },
                  { label: 'Pattern', value: 'Circular', color: 'var(--on-surface)' },
                  { label: 'Risk Trend', value: '↑ Increasing', color: '#EF4444' },
                  { label: 'AI Confidence', value: '88%', color: '#4edea3' },
                ].map(s => (
                  <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid var(--border-muted)' }}>
                    <span style={{ fontSize: 11, color: 'var(--outline)' }}>{s.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 700, color: s.color }}>{s.value}</span>
                  </div>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                <span className="material-icons icon-sm">person</span>
                Dispatch Caregiver
              </button>
              <button className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                <span className="material-icons icon-sm">priority_high</span>
                Escalate
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
