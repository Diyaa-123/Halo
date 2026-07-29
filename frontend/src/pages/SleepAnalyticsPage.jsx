import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageLayout.css';
import './SleepAnalyticsPage.css';
import { useSensing } from '../hooks/SensingContext';

/* ── Hardcoded 3-day sleep data ── */
const SLEEP_NIGHTS = [
  { day: 'Jul 12', duration: '7.4h', score: 82, color: '#4edea3', note: 'Steady, within baseline' },
  { day: 'Jul 13', duration: '7.2h', score: 80, color: '#4edea3', note: 'Steady, within baseline' },
  { day: 'Jul 14', duration: '5.6h', score: 52, color: '#ef4444', note: 'Disrupted — 2 fall events' },
];

/* ── Mini SVG sparkline ── */
function SleepSparkline({ data }) {
  const w = 500, h = 120, pad = 16;
  const min = Math.min(...data), max = Math.max(...data), range = max - min || 1;
  const pts = data.map((v, i) => ({
    x: pad + ((w - pad * 2) * i) / (data.length - 1),
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="sleepFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.28" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => {
        const y = pad + ((h - pad * 2) / 3) * i;
        return <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke="rgba(148,163,184,0.18)" strokeWidth="1" />;
      })}
      <path d={area} fill="url(#sleepFill)" />
      <path d={line} fill="none" stroke="#f59e0b" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 4px 10px rgba(245,158,11,0.22))' }} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 5 : 3.5}
          fill={i === pts.length - 1 ? '#ef4444' : '#f59e0b'}
          stroke="#fff" strokeWidth="2" />
      ))}
    </svg>
  );
}

export default function SleepAnalyticsPage() {
  const navigate = useNavigate();
  const sensing = useSensing();
  const [activeFilter, setActiveFilter] = useState('This Week');

  /* Live values when available, sensible baseline when offline */
  const breathing = sensing.breathingRate ?? 14.2;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : 87;
  const occupancy = sensing.estimatedPersons ?? 1;

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep &amp; Vitals Analysis</h1>
            <p className="page-layout__subtitle">3-day report for Mrs. Lakshmi Rao · July 12–14</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {['This Week', 'Last Week'].map((label) => (
            <button
              key={label}
              className={`page-layout__filter-btn ${activeFilter === label ? 'page-layout__filter-btn--active' : ''}`}
              onClick={() => setActiveFilter(label)}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">
        <div className="sleep-page__top-row">
          {[
            { label: 'Sleep Apnea Dashboard', icon: 'bedtime', path: '/sleep-apnea', color: '#adc6ff', desc: 'Respiration & apnea monitoring' },
            { label: 'Eating Monitor', icon: 'restaurant', path: '/eating', color: '#4edea3', desc: 'Meal timing & behavior context' },
          ].map((m) => (
            <button
              key={m.path}
              onClick={() => navigate(m.path)}
              className="sleep-page__submodule"
              style={{ '--submodule-color': m.color }}
            >
              <span className="material-icons" style={{ color: m.color, fontSize: 20 }}>{m.icon}</span>
              <div className="sleep-page__submodule-copy">
                <div className="sleep-page__submodule-title">{m.label}</div>
                <div className="sleep-page__submodule-desc">{m.desc}</div>
              </div>
              <span className="material-icons sleep-page__submodule-arrow">chevron_right</span>
            </button>
          ))}
        </div>

        {/* KPI Row */}
        <div className="sleep-kpi-grid">
          {[
            { label: 'Breathing Rate', value: breathing.toFixed(1), unit: 'brpm', color: 'var(--primary)' },
            { label: 'Signal Confidence', value: `${confidence}`, unit: '%', color: 'var(--secondary)' },
            { label: 'Occupancy', value: `${occupancy}`, unit: 'person', color: 'var(--warning-amber)' },
            { label: 'Avg Sleep Quality', value: '71', unit: '/ 100', color: '#f59e0b' },
          ].map((m) => (
            <div key={m.label} className="glass-card sleep-kpi-card" style={{ borderTop: `4px solid ${m.color}` }}>
              <div className="sleep-kpi-card__label">{m.label}</div>
              <div className="sleep-kpi-card__value-row">
                <span className="sleep-kpi-card__value">{m.value}</span>
                <span className="sleep-kpi-card__unit">{m.unit}</span>
              </div>
            </div>
          ))}
        </div>

        <div className="sleep-page__layout">
          <div className="sleep-page__main">

            {/* Sleep Quality Sparkline */}
            <div className="sleep-chart glass-card">
              <div className="sleep-chart__header">
                <div>
                  <h3 className="sleep-chart__title">Sleep Quality Trend</h3>
                  <p className="sleep-chart__subtitle">July 12–14 · nightly quality scores (out of 100)</p>
                </div>
                <div className="sleep-chart__chips">
                  <span className="sleep-chip sleep-chip--stable">ACTIVE</span>
                  <span className="sleep-chip sleep-chip--warning">6.4h avg</span>
                  <span className="sleep-chip sleep-chip--muted">3-day window</span>
                </div>
              </div>
              <div style={{ padding: '8px 0 4px' }}>
                <SleepSparkline data={SLEEP_NIGHTS.map(n => n.score)} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-around', marginTop: 4 }}>
                {SLEEP_NIGHTS.map(n => (
                  <div key={n.day} style={{ textAlign: 'center', fontSize: 11 }}>
                    <div style={{ color: n.color, fontWeight: 800 }}>{n.score}/100</div>
                    <div style={{ color: 'var(--outline)', marginTop: 2 }}>{n.day}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Weekly Trend bar chart */}
            <div className="glass-card sleep-card">
              <div className="sleep-card__header">
                <div>
                  <h3 className="sleep-card__title">Weekly Trend</h3>
                  <p className="sleep-card__subtitle">July 12–14 · sleep quality per night</p>
                </div>
                <span className="badge badge-attention">ATTENTION</span>
              </div>
              <div style={{ display: 'flex', gap: 20, alignItems: 'flex-end', height: 140, padding: '0 8px', marginBottom: 10 }}>
                {SLEEP_NIGHTS.map(d => (
                  <div key={d.day} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, color: d.color }}>{d.score}/100</span>
                    <div style={{ width: '100%', background: d.color, opacity: 0.88, borderRadius: 8, height: `${d.score}%`, minHeight: 8, transition: 'height 0.5s ease' }} />
                    <span style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700 }}>{d.day}</span>
                    <span style={{ fontSize: 10, color: 'var(--on-surface-variant)', textAlign: 'center', lineHeight: 1.3 }}>{d.duration}</span>
                  </div>
                ))}
              </div>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                July 12–13 were steady, aligned with Mrs. Lakshmi Rao's 7.3-hour baseline.
                July 14 dropped sharply to 52/100 — correlated with 2 fall events (14:32 and 19:47).
              </p>
            </div>
          </div>

          <div className="sleep-page__side">
            <div className="glass-card sleep-card sleep-card--tight">
              <h3 className="sleep-card__title">AI Sleep Insights</h3>
              <div className="sleep-insight">
                <span className="material-icons" style={{ color: 'var(--primary)' }}>psychology</span>
                <div>
                  <p className="sleep-insight__title">July 14 — disrupted night</p>
                  <p className="sleep-insight__body">
                    Two fall events on July 14 preceded a 52/100 sleep quality score and a 5.6h duration (down from 7.3h baseline).
                    July 12 and 13 were fully stable.
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card sleep-card sleep-card--tight">
              <h3 className="sleep-card__title">Night Summary</h3>
              <div className="sleep-summary">
                {[
                  { key: 'Avg duration (3 days)', value: '6.4 h' },
                  { key: 'Avg quality (3 days)', value: '71 / 100' },
                  { key: 'Nights below baseline', value: '1 (Jul 14)' },
                  { key: 'Breathing rate', value: `${breathing.toFixed(1)} brpm` },
                  { key: 'Signal confidence', value: `${confidence}%` },
                  { key: 'Occupancy', value: `${occupancy} person` },
                ].map((item) => (
                  <div key={item.key} className="sleep-summary__row">
                    <span>{item.key}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
