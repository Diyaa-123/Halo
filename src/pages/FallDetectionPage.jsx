import React, { useState } from 'react';
import './PageLayout.css';

const fallEvents = [
  { time: '14:41', location: 'Bathroom', riskScore: 92, confidence: '97%', responseTime: '2m 14s', status: 'resolved' },
  { time: '09:22', location: 'Corridor', riskScore: 78, confidence: '89%', responseTime: '3m 45s', status: 'resolved' },
];

const workflow = ['Fall Detected', 'Nurse Alert', 'Acknowledged', 'Response Logged', 'Case Closed'];

export default function FallDetectionPage() {
  const [activeEvent, setActiveEvent] = useState(0);
  const [timelinePos, setTimelinePos] = useState(75);
  const ev = fallEvents[activeEvent];

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#EF4444' }}>emergency</span>
          <div>
            <h1 className="page-layout__title">Fall Detection Module</h1>
            <p className="page-layout__subtitle">Event replay and incident analysis — Aarav Mehta</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {fallEvents.map((e, i) => (
            <button
              key={i}
              className={`page-layout__filter-btn ${activeEvent === i ? 'page-layout__filter-btn--active' : ''}`}
              onClick={() => setActiveEvent(i)}
            >
              {e.time} — {e.location}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
          {/* Left: Visual + Timeline */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* 3D Twin in fall posture - visual representation */}
            <div className="glass-card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              <div className="section-label">Digital Twin — Fall Posture Replay</div>
              <div style={{ position: 'relative', width: 200, height: 280 }}>
                <svg viewBox="0 0 140 280" width="200" height="280">
                  <defs>
                    <radialGradient id="fallGrad" cx="50%" cy="60%" r="60%">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.5"/>
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.1"/>
                    </radialGradient>
                  </defs>
                  {/* Fall shockwave */}
                  <ellipse cx="70" cy="240" rx="60" ry="12" fill="none" stroke="#EF4444" strokeWidth="2" opacity="0.3">
                    <animate attributeName="rx" from="40" to="70" dur="2s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.5" to="0" dur="2s" repeatCount="indefinite"/>
                  </ellipse>
                  {/* Body in fallen posture - rotated */}
                  <g transform="rotate(-80, 70, 160)">
                    <ellipse cx="70" cy="30" rx="20" ry="22" fill="url(#fallGrad)" stroke="#EF4444" strokeWidth="1.5"/>
                    <rect x="60" y="50" width="20" height="14" rx="4" fill="url(#fallGrad)" stroke="#EF4444" strokeWidth="1"/>
                    <path d="M35 64 Q30 76 30 110 L110 110 Q110 76 105 64 Z" fill="url(#fallGrad)" stroke="#EF4444" strokeWidth="1.5"/>
                    <path d="M35 68 Q20 86 18 120" stroke="#EF4444" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7"/>
                    <path d="M105 68 Q120 86 122 120" stroke="#EF4444" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7"/>
                    <path d="M35 110 Q30 125 32 135 L108 135 Q110 125 105 110 Z" fill="url(#fallGrad)" stroke="#EF4444" strokeWidth="1"/>
                    <path d="M52 135 Q48 165 46 195" stroke="#EF4444" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.7"/>
                    <path d="M88 135 Q92 165 94 195" stroke="#EF4444" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.7"/>
                  </g>
                  {/* Red outline */}
                  <rect x="5" y="5" width="130" height="270" rx="10" fill="none" stroke="#EF4444" strokeWidth="2" strokeDasharray="8 4" opacity="0.5">
                    <animate attributeName="opacity" from="0.5" to="0.1" dur="1.5s" repeatCount="indefinite" direction="alternate"/>
                  </rect>
                </svg>
              </div>
              {/* Timeline slider */}
              <div style={{ width: '100%', padding: '0 16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 10, color: 'var(--outline)' }}>Event Start</span>
                  <span style={{ fontSize: 10, color: 'var(--outline)' }}>Event End</span>
                </div>
                <input
                  type="range" min="0" max="100" value={timelinePos}
                  onChange={e => setTimelinePos(e.target.value)}
                  style={{ width: '100%', accentColor: '#EF4444' }}
                />
              </div>
            </div>

            {/* Workflow */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Response Workflow</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {workflow.map((step, i) => (
                  <React.Fragment key={step}>
                    <div style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px 4px',
                      background: i <= 3 ? 'rgba(78, 222, 163, 0.1)' : 'rgba(255,255,255,0.03)',
                      border: '1px solid',
                      borderColor: i <= 3 ? 'rgba(78, 222, 163, 0.3)' : 'var(--border-muted)',
                      borderRadius: 4,
                    }}>
                      <div style={{ fontSize: 16, marginBottom: 4 }}>
                        {i <= 3 ? <span className="material-icons" style={{ fontSize: 18, color: '#4edea3' }}>check_circle</span>
                          : <span className="material-icons" style={{ fontSize: 18, color: 'var(--outline)' }}>radio_button_unchecked</span>}
                      </div>
                      <div style={{ fontSize: 9, fontWeight: 700, color: i <= 3 ? '#4edea3' : 'var(--outline)', letterSpacing: '0.04em' }}>
                        {step}
                      </div>
                    </div>
                    {i < workflow.length - 1 && (
                      <div style={{ width: 12, height: 2, background: i < 3 ? '#4edea3' : 'var(--border-muted)', flexShrink: 0 }} />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          {/* Right: Incident Details */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="glass-card" style={{ padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 12 }}>Incident Details</div>
              {[
                { label: 'Incident Time', value: ev.time, icon: 'schedule', color: 'var(--on-surface)' },
                { label: 'Location', value: ev.location, icon: 'place', color: 'var(--primary)' },
                { label: 'Risk Score', value: ev.riskScore + '/100', icon: 'monitor_heart', color: '#EF4444' },
                { label: 'AI Confidence', value: ev.confidence, icon: 'psychology', color: '#4edea3' },
                { label: 'Response Time', value: ev.responseTime, icon: 'timer', color: '#F59E0B' },
                { label: 'Status', value: ev.status.toUpperCase(), icon: 'check_circle', color: '#4edea3' },
              ].map(item => (
                <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span className="material-icons" style={{ fontSize: 14, color: 'var(--outline)' }}>{item.icon}</span>
                    <span style={{ fontSize: 11, color: 'var(--outline)' }}>{item.label}</span>
                  </div>
                  <span style={{ fontSize: 13, fontWeight: 700, color: item.color }}>{item.value}</span>
                </div>
              ))}
            </div>

            <div className="glass-card" style={{ padding: 16 }}>
              <div className="section-label" style={{ marginBottom: 10 }}>AI Recommendation</div>
              <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <span className="material-icons" style={{ color: 'var(--primary)', fontSize: 20, flexShrink: 0 }}>psychology</span>
                <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                  Fall occurred in the bathroom at 14:41. High-risk time: within 1 hour of sleeping. Patient shows recurring bathroom-related incidents. Recommend installing grab bars and motion-activated lighting.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }}>
                  <span className="material-icons icon-sm">assignment</span>
                  Create Care Plan
                </button>
                <button className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                  <span className="material-icons icon-sm">share</span>
                  Share Report
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
