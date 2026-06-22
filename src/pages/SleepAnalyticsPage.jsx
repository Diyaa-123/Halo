import React, { useState } from 'react';
import './PageLayout.css';

const sleepData = [
  { day: 'Mon', duration: 7.2, quality: 85, interruptions: 1 },
  { day: 'Tue', duration: 6.8, quality: 78, interruptions: 3 },
  { day: 'Wed', duration: 8.1, quality: 92, interruptions: 0 },
  { day: 'Thu', duration: 7.5, quality: 88, interruptions: 1 },
  { day: 'Fri', duration: 5.4, quality: 62, interruptions: 4 },
  { day: 'Sat', duration: 7.8, quality: 90, interruptions: 0 },
  { day: 'Sun', duration: 7.0, quality: 82, interruptions: 1 },
];

export default function SleepAnalyticsPage() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep & Vitals Analysis</h1>
            <p className="page-layout__subtitle">Overnight ambient sensing and breathing metrics — Dad (Arun)</p>
          </div>
        </div>
        <div className="page-layout__filters">
          <button className="page-layout__filter-btn page-layout__filter-btn--active">This Week</button>
          <button className="page-layout__filter-btn">Last Week</button>
        </div>
      </div>

      <div className="page-layout__content">
        {/* KPI Row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 24, marginBottom: 24 }}>
          {[
            { label: 'Avg Sleep Duration', value: '7.1', unit: 'hrs', color: 'var(--primary)', status: 'stable' },
            { label: 'Sleep Quality Score', value: '82', unit: '/100', color: 'var(--secondary)', status: 'stable' },
            { label: 'Bed Exits (Avg)', value: '1.4', unit: '/night', color: 'var(--warning-amber)', status: 'warning' },
            { label: 'Avg Breathing Rate', value: '14', unit: 'RPM', color: 'var(--primary)', status: 'stable' },
          ].map(m => (
            <div key={m.label} className="glass-card" style={{ padding: '20px', borderTop: `4px solid ${m.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                <span style={{ fontSize: 32, fontWeight: 700, color: 'var(--on-surface)' }}>{m.value}</span>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--outline)' }}>{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Charts & Insights */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          
          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="section-label" style={{ marginBottom: 20 }}>Weekly Sleep Duration & Quality</h3>
            <div style={{ display: 'flex', alignItems: 'flex-end', gap: 16, height: 200, paddingBottom: 24, borderBottom: '1px solid var(--border-muted)' }}>
              {sleepData.map(d => (
                <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                  <div style={{ 
                    width: '100%', 
                    height: `${(d.duration / 10) * 100}%`, 
                    background: d.quality > 80 ? 'var(--primary)' : d.quality > 70 ? 'var(--secondary)' : 'var(--warning-amber)',
                    borderRadius: '4px 4px 0 0',
                    opacity: 0.8
                  }} />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--on-surface-variant)' }}>{d.day}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 24 }}>
            <h3 className="section-label" style={{ marginBottom: 16 }}>AI Sleep Insights</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', gap: 12, padding: 16, background: 'var(--surface-container-low)', borderRadius: 'var(--radius)' }}>
                <span className="material-icons" style={{ color: 'var(--primary)' }}>psychology</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>Consistent Baseline</p>
                  <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>
                    Breathing rate during deep sleep has remained remarkably stable at 13-14 RPM over the last 14 days. No apnea events detected.
                  </p>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 12, padding: 16, background: '#fef3c7', borderRadius: 'var(--radius)' }}>
                <span className="material-icons" style={{ color: '#b45309' }}>warning_amber</span>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 600, color: '#92400e', marginBottom: 4 }}>Friday Interruption</p>
                  <p style={{ fontSize: 12, color: '#b45309', lineHeight: 1.5 }}>
                    4 bed-exits detected on Friday night resulting in poor sleep quality (62/100). Pattern did not repeat over the weekend.
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
