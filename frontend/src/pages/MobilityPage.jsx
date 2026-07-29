import React from 'react';
import { useNavigate } from 'react-router-dom';
import './PageLayout.css';
import './MobilityPage.css';

const weeklyMobility = [
  { day: 'Jul 12', speed: 0.82, score: 74, steps: 1180 },
  { day: 'Jul 13', speed: 0.80, score: 72, steps: 1140 },
  { day: 'Jul 14', speed: 0.61, score: 48, steps: 620 },
];

const gaitMetrics = [
  { label: 'Walking Speed', value: '0.74', unit: 'm/s', color: '#ffb786', note: 'reduced Jul 14' },
  { label: 'Stride Symmetry', value: '88', unit: '%', color: '#4edea3', note: 'slightly reduced' },
  { label: 'Balance Score', value: '61', unit: '/100', color: '#adc6ff', note: 'below baseline' },
  { label: 'Fall Risk Score', value: '47', unit: '/100', color: '#EF4444', note: '2 falls Jul 14' },
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
            <p className="page-layout__subtitle">Gait analysis and activity tracking for Mrs. Lakshmi Rao · July 12–14</p>
          </div>
        </div>
        <span className="badge badge-danger">ELEVATED RISK</span>
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
                <span className="badge badge-danger">FALL EVENTS</span>
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
                  { label: 'Morning walk (Jul 12–13)', value: '18 min', note: 'steady pace' },
                  { label: 'Activity Jul 14', value: 'Reduced', note: 'post-fall rest periods' },
                  { label: 'Fall events (Jul 14)', value: '2', note: '14:32 and 19:47' },
                  { label: 'Low-activity window', value: '~40 min', note: 'after 19:47 fall' },
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
                  { key: 'Fall events (Jul 14)', value: '2 confirmed' },
                  { key: 'Confidence (event 1)', value: '91%' },
                  { key: 'Confidence (event 2)', value: '87%' },
                  { key: 'Nurse note', value: 'Physician check-in advised' },
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
                  Two high-confidence fall events occurred on July 14 (14:32 at 91%, 19:47 at 87%). We recommend speaking with Mom directly and scheduling a physician check-in. If incidents recur, escalate to a physiotherapy assessment.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
