import React, { useState } from 'react';
import './PageLayout.css';
import './GaitAnalysisPage.css';

const gaitDataWeek = [78, 76, 74, 73, 72, 71, 70];
const gaitDataMonth = [82, 80, 79, 78, 77, 76, 75, 74, 74, 73, 72, 71, 70, 69, 68, 67, 65, 64, 63, 62, 61, 60, 61, 62, 63, 64, 65, 66, 67, 68];

const gaitStats = [
  { label: 'Walking Speed', value: '0.72', unit: 'm/s', color: '#ffb786', note: 'slow but steady' },
  { label: 'Cadence', value: '88', unit: 'spm', color: '#F59E0B', note: 'below target' },
  { label: 'Symmetry', value: '96', unit: '%', color: '#4edea3', note: 'good alignment' },
  { label: 'Double Support', value: '32', unit: '%', color: '#EF4444', note: 'elevated' },
  { label: 'Mobility Score', value: '65', unit: '/100', color: '#adc6ff', note: 'watch trend' },
];

function GaitSparkline({ data, color }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 420;
  const h = 110;
  const padding = 16;
  const points = data.map((value, index) => {
    const x = padding + ((w - padding * 2) * index) / (data.length - 1);
    const y = padding + (1 - (value - min) / range) * (h - padding * 2);
    return { x, y, value };
  });
  const path = points.map((p, index) => `${index === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="gait-chart__svg" role="img" aria-label="Gait score trend">
      <defs>
        <linearGradient id="gaitFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0.04" />
        </linearGradient>
      </defs>
      <path d={`${path} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`} fill="url(#gaitFill)" />
      <path d={path} className="gait-chart__line" style={{ stroke: color }} />
      {points.map((point, index) => (
        <circle
          key={index}
          cx={point.x}
          cy={point.y}
          r={index === points.length - 1 ? 5 : 3.5}
          className={`gait-chart__point ${index === 4 ? 'gait-chart__point--dip' : ''}`}
          style={{ fill: index === 4 ? '#EF4444' : color }}
        />
      ))}
    </svg>
  );
}

export default function GaitAnalysisPage() {
  const [range, setRange] = useState('week');
  const chartData = range === 'week' ? gaitDataWeek : gaitDataMonth;

  return (
    <div className="page-layout gait-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#ffb786' }}>directions_walk</span>
          <div>
            <h1 className="page-layout__title">Gait Analysis Dashboard</h1>
            <p className="page-layout__subtitle">Mobility metrics and fall risk prediction for Mr. Raghav Iyer</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {['week', 'month', 'quarter'].map(item => (
            <button
              key={item}
              className={`page-layout__filter-btn ${range === item ? 'page-layout__filter-btn--active' : ''}`}
              onClick={() => setRange(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">
        <div className="gait-page__kpis">
          {gaitStats.map(metric => (
            <div key={metric.label} className="glass-card gait-kpi" style={{ borderTop: `4px solid ${metric.color}` }}>
              <div className="gait-kpi__label">{metric.label}</div>
              <div className="gait-kpi__value-row">
                <span className="gait-kpi__value" style={{ color: metric.color }}>{metric.value}</span>
                <span className="gait-kpi__unit">{metric.unit}</span>
              </div>
              <div className="gait-kpi__note">{metric.note}</div>
            </div>
          ))}
        </div>

        <div className="gait-page__layout">
          <div className="gait-page__main">
            <div className="glass-card gait-card">
              <div className="gait-card__header">
                <div>
                  <h3 className="gait-card__title">Mobility Score Trend</h3>
                  <p className="gait-card__subtitle">Rolling trend with mild downward pressure in the weekly window</p>
                </div>
                <span className="badge badge-warning">DECLINING</span>
              </div>

              <GaitSparkline data={chartData} color="#ffb786" />

              <div className="gait-axis">
                {range === 'week'
                  ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <span key={day}>{day}</span>
                    ))
                  : Array.from({ length: 30 }, (_, index) => (
                      <span key={index}>{(index + 1) % 5 === 0 ? `Day ${index + 1}` : ''}</span>
                    ))}
              </div>
            </div>

            <div className="gait-grid">
              <div className="glass-card gait-card">
                <div className="gait-card__header">
                  <div>
                    <h3 className="gait-card__title">3D Skeletal Gait Overlay</h3>
                    <p className="gait-card__subtitle">Simplified posture render with instability focus points</p>
                  </div>
                </div>
                <div className="gait-figure">
                  <svg viewBox="0 0 220 300" className="gait-figure__svg" aria-label="Skeleton gait overlay">
                    <circle cx="110" cy="30" r="18" fill="none" stroke="#ffb786" strokeWidth="2" />
                    <line x1="110" y1="48" x2="110" y2="108" stroke="#ffb786" strokeWidth="2" />
                    <line x1="110" y1="68" x2="72" y2="98" stroke="#ffb786" strokeWidth="2" />
                    <line x1="110" y1="68" x2="148" y2="98" stroke="#ffb786" strokeWidth="2" />
                    <line x1="72" y1="98" x2="64" y2="140" stroke="#ffb786" strokeWidth="2" />
                    <line x1="148" y1="98" x2="156" y2="140" stroke="#ffb786" strokeWidth="2" />
                    <line x1="110" y1="108" x2="94" y2="160" stroke="#F59E0B" strokeWidth="2.5" />
                    <line x1="110" y1="108" x2="126" y2="160" stroke="#F59E0B" strokeWidth="2.5" />
                    <line x1="94" y1="160" x2="90" y2="224" stroke="#EF4444" strokeWidth="3" />
                    <line x1="126" y1="160" x2="130" y2="224" stroke="#EF4444" strokeWidth="3" />
                    <g>
                      <circle cx="90" cy="224" r="8" fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.7" />
                      <circle cx="130" cy="224" r="8" fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.7" />
                    </g>
                    <text x="110" y="264" textAnchor="middle" fontSize="10" fill="#F59E0B" fontWeight="700">Mild instability at turn</text>
                  </svg>
                </div>
              </div>

              <div className="glass-card gait-card">
                <div className="gait-card__header">
                  <div>
                    <h3 className="gait-card__title">Stride Analysis</h3>
                    <p className="gait-card__subtitle">Measured values compared against the resident baseline</p>
                  </div>
                </div>
                <div className="gait-stride-list">
                  {[
                    { label: 'Left stride length', value: '0.54m', ref: '0.65m', ok: false },
                    { label: 'Right stride length', value: '0.55m', ref: '0.65m', ok: false },
                    { label: 'Stride symmetry', value: '96%', ref: '100%', ok: true },
                    { label: 'Cadence', value: '88 spm', ref: '100 spm', ok: false },
                    { label: 'Double support', value: '32%', ref: '20%', ok: false },
                  ].map(item => (
                    <div key={item.label} className="gait-stride-row">
                      <span className="gait-stride-row__label">{item.label}</span>
                      <div className="gait-stride-row__values">
                        <strong className={item.ok ? 'gait-stride-row__value--good' : 'gait-stride-row__value--warn'}>{item.value}</strong>
                        <span>ref {item.ref}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <aside className="gait-page__side">
            <div className="glass-card gait-card gait-card--tight">
              <h3 className="gait-card__title">Daily Mobility Snapshot</h3>
              <div className="gait-snapshot">
                {[
                  { key: 'Morning walk', value: '21 min' },
                  { key: 'Assisted transfers', value: '6' },
                  { key: 'Night bathroom trips', value: '2' },
                  { key: 'Near-fall moments', value: '1' },
                ].map(item => (
                  <div key={item.key} className="gait-snapshot__row">
                    <span>{item.key}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card gait-card gait-card--tight">
              <h3 className="gait-card__title">Safety Guidance</h3>
              <p className="gait-card__text">
                Keep supervised evening walks in place, reduce corridor clutter, and prioritize slow sit-to-stand transitions after prolonged rest.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
