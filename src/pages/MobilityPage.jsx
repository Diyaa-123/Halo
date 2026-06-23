import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageLayout.css';
import './MobilityPage.css';

const weeklyMobility = [
  { day: 'Mon', speed: 0.84, score: 71, steps: 1240 },
  { day: 'Tue', speed: 0.82, score: 69, steps: 1180 },
  { day: 'Wed', speed: 0.86, score: 73, steps: 1315 },
  { day: 'Thu', speed: 0.83, score: 70, steps: 1262 },
  { day: 'Fri', speed: 0.77, score: 63, steps: 980 },
  { day: 'Sat', speed: 0.85, score: 72, steps: 1388 },
  { day: 'Sun', speed: 0.87, score: 74, steps: 1440 },
];

const gaitMetrics = [
  { label: 'Walking Speed', value: '0.84', unit: 'm/s', color: '#ffb786', note: 'steady' },
  { label: 'Stride Symmetry', value: '94', unit: '%', color: '#4edea3', note: 'within target' },
  { label: 'Balance Score', value: '76', unit: '/100', color: '#adc6ff', note: 'mild sway' },
  { label: 'Fall Risk Score', value: '18', unit: '/100', color: '#F59E0B', note: 'low-moderate' },
];

function MiniLineChart({ data, color }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 520;
  const h = 180;
  const padding = 18;
  const points = data.map((point, index) => {
    const x = padding + ((w - padding * 2) * index) / (data.length - 1);
    const y = padding + (1 - (point - min) / range) * (h - padding * 2);
    return { x, y, point };
  });
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${path} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="mobility-chart__svg" role="img" aria-label="Weekly mobility trend chart">
      <defs>
        <linearGradient id="mobilityFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => {
        const y = padding + ((h - padding * 2) / 3) * i;
        return <line key={i} x1={padding} x2={w - padding} y1={y} y2={y} className="mobility-chart__grid" />;
      })}
      <path d={area} fill="url(#mobilityFill)" />
      <path d={path} className="mobility-chart__line" style={{ stroke: color }} />
      {points.map((p, index) => (
        <circle
          key={index}
          cx={p.x}
          cy={p.y}
          r={index === points.length - 1 ? 5 : 3.5}
          className={`mobility-chart__point ${index === 4 ? 'mobility-chart__point--dip' : ''}`}
          style={{ fill: index === 4 ? '#EF4444' : color }}
        />
      ))}
    </svg>
  );
}

export default function MobilityPage() {
  const navigate = useNavigate();

  return (
    <div className="page-layout mobility-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>directions_walk</span>
          <div>
            <h1 className="page-layout__title">Mobility & Fall Risk</h1>
            <p className="page-layout__subtitle">Gait analysis and activity tracking for Mr. Raghav Iyer</p>
          </div>
        </div>
        <span className="badge badge-stable">LOW RISK</span>
      </div>

      <div className="page-layout__content">
        <div className="mobility-page__subnav">
          {[
            { label: 'Gait Analysis Dashboard', icon: 'directions_walk', path: '/gait', color: '#ffb786', desc: 'Stride, cadence and fall risk prediction' },
            { label: 'Analytics Overview', icon: 'analytics', path: '/analytics', color: '#adc6ff', desc: 'Multi-metric hospital-grade intelligence' },
            { label: 'Clinical Dashboard', icon: 'local_hospital', path: '/clinical', color: '#4edea3', desc: 'Full clinical view with digital twin' },
          ].map(item => (
            <button
              key={item.path}
              className="mobility-page__subnav-card"
              style={{ '--accent': item.color }}
              onClick={() => navigate(item.path)}
            >
              <span className="material-icons mobility-page__subnav-icon" style={{ color: item.color }}>{item.icon}</span>
              <div className="mobility-page__subnav-copy">
                <div className="mobility-page__subnav-title">{item.label}</div>
                <div className="mobility-page__subnav-desc">{item.desc}</div>
              </div>
              <span className="material-icons mobility-page__subnav-arrow">chevron_right</span>
            </button>
          ))}
        </div>

        <div className="mobility-page__kpis">
          {gaitMetrics.map(metric => (
            <div key={metric.label} className="glass-card mobility-kpi" style={{ borderTop: `4px solid ${metric.color}` }}>
              <div className="mobility-kpi__label">{metric.label}</div>
              <div className="mobility-kpi__value-row">
                <span className="mobility-kpi__value" style={{ color: metric.color }}>{metric.value}</span>
                <span className="mobility-kpi__unit">{metric.unit}</span>
              </div>
              <div className="mobility-kpi__note">{metric.note}</div>
            </div>
          ))}
        </div>

        <div className="mobility-page__layout">
          <div className="mobility-page__main">
            <div className="glass-card mobility-card">
              <div className="mobility-card__header">
                <div>
                  <h3 className="mobility-card__title">Mobility Trend</h3>
                  <p className="mobility-card__subtitle">Weekly gait consistency and walk speed with a Friday dip</p>
                </div>
                <span className="badge badge-warning">MONITORING</span>
              </div>
              <MiniLineChart data={weeklyMobility.map(item => item.speed)} color="#ffb786" />
              <div className="mobility-week-axis">
                {weeklyMobility.map(item => (
                  <div key={item.day} className="mobility-week-axis__item">
                    <span>{item.day}</span>
                    <strong>{item.speed.toFixed(2)} m/s</strong>
                    <em>{item.steps.toLocaleString()} steps</em>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card mobility-card">
              <div className="mobility-card__header">
                <div>
                  <h3 className="mobility-card__title">Daily Activity Snapshot</h3>
                  <p className="mobility-card__subtitle">Hardcoded profile for the current monitoring window</p>
                </div>
              </div>

              <div className="mobility-activity-grid">
                {[
                  { label: 'Morning walk', value: '22 min', note: 'steady pace' },
                  { label: 'Afternoon transfers', value: '6', note: 'all assisted' },
                  { label: 'Night bathroom trips', value: '2', note: 'slow but stable' },
                  { label: 'Unsteady moments', value: '1', note: 'near chair turn' },
                ].map(item => (
                  <div key={item.label} className="mobility-activity-item">
                    <span className="mobility-activity-item__label">{item.label}</span>
                    <strong className="mobility-activity-item__value">{item.value}</strong>
                    <span className="mobility-activity-item__note">{item.note}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="mobility-page__side">
            <div className="glass-card mobility-card mobility-card--tight">
              <h3 className="mobility-card__title">Mobility Notes</h3>
              <div className="mobility-notes">
                {[
                  { key: 'Assistive device', value: 'Single-point cane' },
                  { key: 'Turning stability', value: 'Mild trunk sway' },
                  { key: 'Stair tolerance', value: 'Needs rail support' },
                  { key: 'Nurse note', value: 'No observed near-falls today' },
                ].map(item => (
                  <div key={item.key} className="mobility-note-row">
                    <span>{item.key}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card mobility-card mobility-card--tight">
              <h3 className="mobility-card__title">Care Guidance</h3>
              <div className="mobility-guidance">
                <div className="mobility-guidance__icon">
                  <span className="material-icons">tips_and_updates</span>
                </div>
                <p>
                  Continue supervised evening walks, keep hallway lighting warm and even, and reassess chair-to-stand confidence if the speed drops below 0.75 m/s.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
