import React, { useState } from 'react';
import './PageLayout.css';
import './SleepApneaDashboard.css';

function NightTimeline({ events }) {
  return (
    <div className="sleep-timeline">
      <div className="sleep-timeline__header">
        <span className="section-label">Night Timeline (10 PM — 7 AM)</span>
      </div>
      <div className="sleep-timeline__track">
        {/* Sleep stages */}
        {[
          { x: 0, w: 15, stage: 'Awake', color: '#EF4444', opacity: 0.7 },
          { x: 15, w: 20, stage: 'Light', color: '#adc6ff', opacity: 0.5 },
          { x: 35, w: 25, stage: 'Deep', color: '#3B82F6', opacity: 0.8 },
          { x: 60, w: 15, stage: 'REM', color: '#4edea3', opacity: 0.6 },
          { x: 75, w: 10, stage: 'Apnea', color: '#F59E0B', opacity: 1 },
          { x: 85, w: 15, stage: 'Deep', color: '#3B82F6', opacity: 0.7 },
        ].map((seg, i) => (
          <div key={i} className="sleep-timeline__segment"
            style={{ left: `${seg.x}%`, width: `${seg.w}%`, background: seg.color, opacity: seg.opacity }}
            title={seg.stage}
          />
        ))}
        {/* Apnea markers */}
        {[45, 68, 78].map((pos, i) => (
          <div key={i} className="sleep-timeline__marker" style={{ left: `${pos}%` }}>
            <span className="sleep-timeline__marker-dot" />
            <span className="sleep-timeline__marker-label">Apnea {i + 1}</span>
          </div>
        ))}
      </div>
      <div className="sleep-timeline__labels">
        {['10PM', '11PM', '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM'].map(t => (
          <span key={t}>{t}</span>
        ))}
      </div>
    </div>
  );
}

export default function SleepApneaDashboard() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#adc6ff' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep Apnea Dashboard</h1>
            <p className="page-layout__subtitle">Aarav Mehta — Last Night Analysis</p>
          </div>
        </div>
        <span className="badge badge-warning">2 APNEA EVENTS</span>
      </div>

      <div className="page-layout__content">
        {/* KPIs */}
        <div className="sleep-kpis">
          {[
            { label: 'Sleep Duration', value: '5h 42m', icon: 'schedule', color: '#adc6ff', status: 'warning' },
            { label: 'Apnea Events', value: '2', icon: 'warning_amber', color: '#F59E0B', status: 'warning' },
            { label: 'Breathing Interruptions', value: '14', icon: 'air', color: '#EF4444', status: 'critical' },
            { label: 'Sleep Efficiency', value: '74%', icon: 'trending_up', color: '#4edea3', status: 'stable' },
            { label: 'Sleep Risk Score', value: '62/100', icon: 'monitor_heart', color: '#F59E0B', status: 'warning' },
          ].map(kpi => (
            <div key={kpi.label} className="sleep-kpi glass-card">
              <span className="material-icons" style={{ color: kpi.color, fontSize: 20 }}>{kpi.icon}</span>
              <span className="sleep-kpi__value" style={{ color: kpi.color }}>{kpi.value}</span>
              <span className="sleep-kpi__label">{kpi.label}</span>
              <span className={`badge badge-${kpi.status}`} style={{ fontSize: 9 }}>{kpi.status.toUpperCase()}</span>
            </div>
          ))}
        </div>

        {/* Night Timeline */}
        <NightTimeline />

        {/* Breathing chart during sleep */}
        <div className="sleep-breathing glass-card">
          <div className="sleep-breathing__title">
            <span className="material-icons" style={{ color: '#F59E0B', fontSize: 16 }}>air</span>
            Breathing Rate — Night Profile
          </div>
          <div className="sleep-breathing__chart">
            {Array.from({ length: 60 }, (_, i) => {
              const val = 12 + Math.sin(i * 0.3) * 4 + (i > 25 && i < 30 ? -8 : 0) + (i > 45 && i < 50 ? -7 : 0);
              const isApnea = val < 5;
              return (
                <div
                  key={i}
                  className="sleep-breathing__bar"
                  style={{
                    height: `${Math.max(2, (val / 18) * 100)}%`,
                    background: isApnea ? '#EF4444' : '#F59E0B',
                    opacity: isApnea ? 1 : 0.7,
                  }}
                />
              );
            })}
          </div>
          <div className="sleep-breathing__alert">
            <span className="material-icons" style={{ color: '#EF4444', fontSize: 14 }}>error</span>
            Alert Rule: Breathing stops &gt;10s · Breathing &lt;6 BPM
          </div>
        </div>

        {/* Legend */}
        <div className="sleep-legend glass-card">
          <span className="section-label" style={{ marginBottom: 8, display: 'block' }}>Sleep Stage Legend</span>
          <div className="sleep-legend__items">
            {[
              { color: '#EF4444', label: 'Awake' },
              { color: '#adc6ff', label: 'Light Sleep' },
              { color: '#3B82F6', label: 'Deep Sleep' },
              { color: '#4edea3', label: 'REM Sleep' },
              { color: '#F59E0B', label: 'Apnea Event' },
            ].map(l => (
              <div key={l.label} className="sleep-legend__item">
                <span style={{ width: 12, height: 12, borderRadius: 2, background: l.color, display: 'inline-block', flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>{l.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
