import React from 'react';
import './PageLayout.css';

export default function BiometricProfilePage() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>monitor_heart</span>
          <div>
            <h1 className="page-layout__title">Biometric Profile</h1>
            <p className="page-layout__subtitle">Learned baseline distributions for Dad (Arun) — Enrolled 14 days ago</p>
          </div>
        </div>
        <span className="badge badge-stable">CALIBRATED</span>
      </div>

      <div className="page-layout__content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24, marginBottom: 24 }}>
          {/* Breathing Rate */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="section-label">Breathing Rate Distribution</h3>
            <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 16 }}>
              {/* Fake normal distribution curve using bars */}
              {[2, 5, 12, 30, 60, 85, 100, 80, 55, 25, 10, 4, 1].map((val, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--primary)', opacity: val > 60 ? 1 : 0.4, height: `${val}%`, borderRadius: 2 }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--outline)' }}>
              <span>10 RPM</span>
              <span style={{ color: 'var(--primary)', fontWeight: 600 }}>14 RPM Peak</span>
              <span>18 RPM</span>
            </div>
          </div>

          {/* Breathing Regularity */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="section-label">Signal Regularity Index</h3>
            <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 16 }}>
              {[1, 2, 4, 15, 40, 70, 95, 85, 45, 15, 5, 2, 1].map((val, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--secondary)', opacity: val > 60 ? 1 : 0.4, height: `${val}%`, borderRadius: 2 }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--outline)' }}>
              <span>Low</span>
              <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>High Regularity</span>
              <span>Perfect</span>
            </div>
          </div>

          {/* CSI Amplitude */}
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="section-label">CSI Amplitude Distribution</h3>
            <div style={{ height: 120, display: 'flex', alignItems: 'flex-end', gap: 4, marginTop: 16 }}>
              {[10, 20, 35, 50, 75, 90, 80, 60, 40, 25, 15, 8, 3].map((val, i) => (
                <div key={i} style={{ flex: 1, background: 'var(--warning-amber)', opacity: val > 60 ? 1 : 0.4, height: `${val}%`, borderRadius: 2 }} />
              ))}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--outline)' }}>
              <span>Weak</span>
              <span style={{ color: 'var(--warning-amber)', fontWeight: 600 }}>Normal Range</span>
              <span>Strong</span>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="section-label">Baseline Drift Monitoring</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
            The system continuously compares nightly live readings against this enrolled biometric signature. Current drift is &lt;2%, indicating excellent data quality and no need for recalibration.
          </p>
          <div style={{ width: '100%', height: 8, background: 'var(--surface-container-high)', borderRadius: 4, overflow: 'hidden' }}>
            <div style={{ width: '2%', height: '100%', background: 'var(--primary)' }} />
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--outline)' }}>
            <span>0% Drift</span>
            <span>Re-enrollment threshold (15%)</span>
          </div>
        </div>
      </div>
    </div>
  );
}
