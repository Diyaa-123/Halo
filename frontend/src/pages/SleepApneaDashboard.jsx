import React from 'react';
import './PageLayout.css';
import './SleepApneaDashboard.css';
import { useSensing } from '../hooks/SensingContext';

/* ── Hardcoded 3-night respiration data ── */
const RESP_NIGHTS = [14.8, 14.2, 13.9, 14.5, 13.8, 14.1, 15.0, 14.3, 13.6, 14.7, 14.9, 14.4];

function RespChart({ data }) {
  const w = 480, h = 110, pad = 14;
  const min = Math.min(...data) - 1, max = Math.max(...data) + 1, range = max - min;
  const pts = data.map((v, i) => ({
    x: pad + ((w - pad * 2) * i) / (data.length - 1),
    y: pad + (1 - (v - min) / range) * (h - pad * 2),
  }));
  const line = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const area = `${line} L ${pts[pts.length - 1].x} ${h - pad} L ${pts[0].x} ${h - pad} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
      <defs>
        <linearGradient id="respFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#4edea3" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#4edea3" stopOpacity="0.03" />
        </linearGradient>
      </defs>
      {[0, 1, 2].map(i => {
        const y = pad + ((h - pad * 2) / 2) * i;
        return <line key={i} x1={pad} x2={w - pad} y1={y} y2={y} stroke="rgba(148,163,184,0.15)" strokeWidth="1" />;
      })}
      <path d={area} fill="url(#respFill)" />
      <path d={line} fill="none" stroke="#4edea3" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        style={{ filter: 'drop-shadow(0 3px 8px rgba(78,222,163,0.22))' }} />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r={i === pts.length - 1 ? 4 : 2.5}
          fill="#4edea3" stroke="#fff" strokeWidth="1.5" />
      ))}
    </svg>
  );
}

export default function SleepApneaDashboard() {
  const sensing = useSensing();

  /* Live when available, sensible baseline otherwise */
  const breathing   = sensing.breathingRate   ?? 14.2;
  const heartRate   = sensing.heartRate       ?? 68;
  const confidence  = sensing.confidence != null ? Math.round(sensing.confidence * 100) : 87;
  const occupancy   = sensing.estimatedPersons ?? 1;

  return (
    <div className="page-layout sleep-apnea-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#adc6ff' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep Apnea Dashboard</h1>
            <p className="page-layout__subtitle">July 12–14 · Mrs. Lakshmi Rao · respiration monitoring</p>
          </div>
        </div>
        <span className="badge badge-stable">NORMAL</span>
      </div>

      <div className="page-layout__content">
        <section className="sleep-apnea__hero glass-card">
          <div className="sleep-apnea__hero-copy">
            <span className="sleep-apnea__eyebrow">Respiration Summary</span>
            <h2 className="sleep-apnea__hero-title">No apnea events detected across the 3-day window</h2>
            <p className="sleep-apnea__hero-text">
              Breathing patterns on July 12 and 13 were fully within the normal range (12–18 brpm).
              On July 14, respiration remained stable despite the two fall events — the ~40-minute
              low-activity period following the second fall is distinct from an apnea episode.
            </p>
          </div>

          <div className="sleep-apnea__hero-metrics">
            {[
              { label: 'Breathing rate',  value: `${breathing.toFixed(1)} brpm` },
              { label: 'Heart rate',      value: `${Math.round(heartRate)} bpm` },
              { label: 'Confidence',      value: `${confidence}%` },
              { label: 'Status',          value: 'NORMAL' },
            ].map((item) => (
              <div key={item.label} className="sleep-apnea__hero-metric">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="sleep-apnea__kpis">
          {[
            { label: 'Signal quality',    value: `${confidence}/100`, color: '#4edea3', status: 'stable' },
            { label: 'Respiration band',  value: 'Normal',            color: '#F59E0B', status: 'stable' },
            { label: 'Occupancy',         value: `${occupancy}`,      color: '#3B82F6', status: 'stable' },
            { label: 'Apnea events',      value: '0',                 color: '#4edea3', status: 'stable' },
          ].map((kpi) => (
            <div key={kpi.label} className="sleep-apnea__kpi glass-card" style={{ borderTop: `4px solid ${kpi.color}` }}>
              <span className="sleep-apnea__kpi-label">{kpi.label}</span>
              <span className="sleep-apnea__kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
              <span className={`badge badge-${kpi.status}`}>{kpi.status.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div className="sleep-apnea__grid">
          <div className="sleep-apnea__main">
            <div className="sleep-apnea__panel sleep-apnea__panel--chart glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">Respiration Trend</h3>
                  <p className="sleep-apnea__section-subtitle">July 12–14 · breathing rate across monitored intervals</p>
                </div>
              </div>
              <div style={{ padding: '12px 0 4px' }}>
                <RespChart data={RESP_NIGHTS} />
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, color: 'var(--outline)', marginTop: 4, padding: '0 2px' }}>
                <span>Jul 12</span><span>Jul 13</span><span>Jul 14</span>
              </div>
              <div style={{ marginTop: 12, textAlign: 'center' }}>
                <span style={{ fontSize: 42, fontWeight: 900, color: '#4edea3', lineHeight: 1 }}>
                  {breathing.toFixed(1)}
                </span>
                <span style={{ fontSize: 14, color: 'var(--outline)', marginLeft: 6 }}>brpm</span>
              </div>
            </div>

            <div className="sleep-apnea__panel glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">What Changed</h3>
                  <p className="sleep-apnea__section-subtitle">July 12–14 window summary</p>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.8 }}>
                <p style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--on-surface)' }}>July 12 &amp; 13:</strong> Breathing stable at 13.9–15.0 brpm across all monitored intervals.
                  Heart rate consistent at 66–70 bpm. No disruptions.
                </p>
                <p style={{ marginBottom: 8 }}>
                  <strong style={{ color: 'var(--on-surface)' }}>July 14:</strong> Respiration remained within normal range despite 2 fall events.
                  The ~40-minute low-activity window following the 19:47 fall is not classified as an apnea episode.
                </p>
                <p>
                  <strong style={{ color: '#4edea3' }}>Conclusion:</strong> Zero apnea events across all 3 nights.
                  No clinical intervention required for respiration at this time.
                </p>
              </div>
            </div>
          </div>

          <aside className="sleep-apnea__side">
            <div className="sleep-apnea__panel glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">Care Notes</h3>
                  <p className="sleep-apnea__section-subtitle">July 12–14 report</p>
                </div>
              </div>
              <div className="sleep-apnea__notes">
                {[
                  { key: 'Report window',   value: 'Jul 12–14' },
                  { key: 'Apnea events',    value: '0 (none detected)' },
                  { key: 'Avg breathing',   value: `${breathing.toFixed(1)} brpm` },
                  { key: 'Avg heart rate',  value: `${Math.round(heartRate)} bpm` },
                  { key: 'Confidence',      value: `${confidence}%` },
                  { key: 'Respiration band', value: 'Normal (12–18 brpm)' },
                ].map((item) => (
                  <div key={item.key} className="sleep-apnea__note-row">
                    <span>{item.key}</span>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
