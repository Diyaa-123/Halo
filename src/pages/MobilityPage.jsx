import React from 'react';
import './PageLayout.css';

export default function MobilityPage() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>directions_walk</span>
          <div>
            <h1 className="page-layout__title">Mobility & Fall Risk</h1>
            <p className="page-layout__subtitle">Gait analysis and activity tracking via WiFi CSI — Dad (Arun)</p>
          </div>
        </div>
        <span className="badge badge-stable">LOW RISK</span>
      </div>

      <div className="page-layout__content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
          {[
            { label: 'Walking Speed', value: '0.85', unit: 'm/s', trend: '+0.02', status: 'stable', icon: 'speed' },
            { label: 'Daily Activity Time', value: '4.2', unit: 'hrs', trend: '-0.1', status: 'warning', icon: 'schedule' },
            { label: 'Fall Risk Score', value: '12', unit: '/100', trend: '-2', status: 'stable', icon: 'health_and_safety' },
          ].map(m => (
            <div key={m.label} className="glass-card" style={{ padding: '24px', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--primary-container)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons icon-lg">{m.icon}</span>
              </div>
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>{m.label}</div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: 'var(--on-surface)' }}>{m.value}</span>
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--outline)' }}>{m.unit}</span>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <h3 className="section-label" style={{ marginBottom: 0 }}>Gait Consistency (Last 30 Days)</h3>
            <button className="btn btn-outline btn-sm">Export Report</button>
          </div>
          
          <div style={{ height: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface-container-low)', borderRadius: 'var(--radius)', border: '1px dashed var(--border-muted)' }}>
            <p style={{ color: 'var(--outline)', fontSize: 13, fontWeight: 500 }}>Gait visualization chart renders here (WiFi tracking data)</p>
          </div>

          <div style={{ marginTop: 20, display: 'flex', gap: 12, padding: 16, background: '#f0fdf4', borderRadius: 'var(--radius)' }}>
            <span className="material-icons" style={{ color: '#166534' }}>check_circle</span>
            <p style={{ fontSize: 13, color: '#14532d', lineHeight: 1.6 }}>
              <strong>Stable Mobility Detected.</strong> Walking speed and stride consistency are well within the safe baseline established over the last 3 months. No significant deviations suggesting increased fall risk.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
