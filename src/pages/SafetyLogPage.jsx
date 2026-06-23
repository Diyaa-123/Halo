import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageLayout.css';

export default function SafetyLogPage() {
  const events = [
    { time: '10:45 AM', type: 'Fall Detected', loc: 'Bathroom', status: 'Resolved (False Alarm)' },
    { time: '03:20 AM', type: 'Prolonged Bed Exit', loc: 'Bedroom', status: 'Acknowledged' },
    { time: 'Yesterday', type: 'Wandering', loc: 'Hallway', status: 'Auto-Resolved' },
  ];

  const navigate = useNavigate();

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--emergency-red)' }}>warning</span>
          <div>
            <h1 className="page-layout__title">SOS & Safety Events Log</h1>
            <p className="page-layout__subtitle">Identity-independent alerts for the entire household</p>
          </div>
        </div>
        <button className="btn btn-outline">Export Log</button>
      </div>

      <div className="page-layout__content">
        {/* Sub-Module Links */}
        <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
          {[
            { label: 'Fall Detection Module', icon: 'emergency', path: '/fall', color: '#EF4444', desc: 'Event replay & incident analysis' },
            { label: 'Agitation Tracker', icon: 'psychology_alt', path: '/agitation', color: '#F59E0B', desc: 'Behavioral escalation monitoring' },
          ].map(m => (
            <button
              key={m.path}
              onClick={() => navigate(m.path)}
              style={{
                flex: 1, padding: '12px 16px', background: 'var(--surface-container-low)',
                border: `1px solid ${m.color}40`, borderRadius: 'var(--radius)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10,
                transition: 'all 0.15s', textAlign: 'left',
              }}
              onMouseEnter={e => e.currentTarget.style.background = `${m.color}0d`}
              onMouseLeave={e => e.currentTarget.style.background = 'var(--surface-container-low)'}
            >
              <span className="material-icons" style={{ color: m.color, fontSize: 20 }}>{m.icon}</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--on-surface)' }}>{m.label}</div>
                <div style={{ fontSize: 10, color: 'var(--outline)' }}>{m.desc}</div>
              </div>
              <span className="material-icons" style={{ fontSize: 14, color: 'var(--outline)', marginLeft: 'auto' }}>chevron_right</span>
            </button>
          ))}
        </div>
        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="section-label" style={{ marginBottom: 16 }}>Recent Alerts</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {events.map((ev, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', padding: 16, background: 'var(--surface-container-low)', borderRadius: 'var(--radius)', borderLeft: `4px solid ${ev.type.includes('Fall') ? 'var(--emergency-red)' : 'var(--warning-amber)'}` }}>
                <div style={{ width: 100, fontSize: 12, color: 'var(--on-surface-variant)' }}>{ev.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--on-surface)' }}>{ev.type}</div>
                  <div style={{ fontSize: 12, color: 'var(--outline)' }}>Location: {ev.loc}</div>
                </div>
                <div className="badge" style={{ background: 'var(--surface)', border: '1px solid var(--border-muted)' }}>
                  {ev.status}
                </div>
                <button className="btn-icon" style={{ marginLeft: 16 }}><span className="material-icons icon-sm">more_vert</span></button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
