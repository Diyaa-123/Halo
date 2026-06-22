import React, { useState } from 'react';
import './PageLayout.css';

function GaitChart({ data, color }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const w = 400, h = 80;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 10) - 5}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width: '100%', height: 80 }}>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
      {data.map((v, i) => {
        const x = (i / (data.length - 1)) * w;
        const y = h - ((v - min) / range) * (h - 10) - 5;
        return <circle key={i} cx={x} cy={y} r={i === data.length - 1 ? 4 : 2} fill={color} opacity={i === data.length - 1 ? 1 : 0.5} />;
      })}
    </svg>
  );
}

const weekData = [78, 76, 74, 73, 72, 71, 70];
const monthData = [82, 80, 79, 78, 77, 76, 75, 74, 74, 73, 72, 71, 70, 69, 68, 67, 65, 64, 63, 62, 61, 60, 61, 62, 63, 64, 65, 66, 67, 68];

export default function GaitAnalysisPage() {
  const [range, setRange] = useState('week');
  const chartData = range === 'week' ? weekData : monthData;

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#ffb786' }}>directions_walk</span>
          <div>
            <h1 className="page-layout__title">Gait Analysis Dashboard</h1>
            <p className="page-layout__subtitle">Mobility metrics and fall risk prediction — Aarav Mehta</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {['week', 'month', 'quarter'].map(r => (
            <button key={r} className={`page-layout__filter-btn ${range === r ? 'page-layout__filter-btn--active' : ''}`} onClick={() => setRange(r)}>
              {r.charAt(0).toUpperCase() + r.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">
        {/* KPIs */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
          {[
            { label: 'Walking Speed', value: '0.7', unit: 'm/s', color: '#ffb786', change: '-0.1', status: 'warning' },
            { label: 'Stride Consistency', value: '68', unit: '%', color: '#F59E0B', change: '-4', status: 'warning' },
            { label: 'Mobility Score', value: '65', unit: '/100', color: '#ffb786', change: '-5', status: 'moderate' },
            { label: 'Fall Risk', value: 'HIGH', unit: '', color: '#EF4444', change: '↑', status: 'critical' },
            { label: 'Steps Today', value: '1,240', unit: 'steps', color: '#adc6ff', change: '-180', status: 'warning' },
          ].map(m => (
            <div key={m.label} className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${m.color}` }}>
              <div style={{ fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--outline)', fontWeight: 700, marginBottom: 6 }}>{m.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: m.color }}>{m.value}</span>
                <span style={{ fontSize: 11, color: 'var(--outline)' }}>{m.unit}</span>
              </div>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444' }}>{m.change}</span>
            </div>
          ))}
        </div>

        {/* Trend Chart */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <span className="material-icons" style={{ fontSize: 16, color: '#ffb786' }}>trending_down</span>
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>Mobility Score Trend</span>
            </div>
            <span className="badge badge-warning">DECLINING</span>
          </div>
          <GaitChart data={chartData} color="#ffb786" />
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, color: 'var(--outline)', marginTop: 6 }}>
            {range === 'week'
              ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <span key={d}>{d}</span>)
              : Array.from({ length: 30 }, (_, i) => i % 5 === 0 ? <span key={i}>Day {i + 1}</span> : <span key={i} />)
            }
          </div>
        </div>

        {/* Skeletal overlay visual + stride data */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="glass-card" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>3D Skeletal Gait Overlay</div>
            <div style={{ display: 'flex', justifyContent: 'center', padding: '20px 0' }}>
              <svg viewBox="0 0 200 300" width="160" height="240">
                {/* Skeleton visualization */}
                <circle cx="100" cy="30" r="18" fill="none" stroke="#ffb786" strokeWidth="2"/>
                <line x1="100" y1="48" x2="100" y2="110" stroke="#ffb786" strokeWidth="2"/>
                <line x1="100" y1="70" x2="60" y2="100" stroke="#ffb786" strokeWidth="2"/>
                <line x1="100" y1="70" x2="140" y2="100" stroke="#ffb786" strokeWidth="2"/>
                <line x1="60" y1="100" x2="50" y2="140" stroke="#ffb786" strokeWidth="2"/>
                <line x1="140" y1="100" x2="150" y2="140" stroke="#ffb786" strokeWidth="2"/>
                <line x1="100" y1="110" x2="85" y2="160" stroke="#F59E0B" strokeWidth="2.5"/>
                <line x1="100" y1="110" x2="115" y2="160" stroke="#F59E0B" strokeWidth="2.5"/>
                <line x1="85" y1="160" x2="80" y2="220" stroke="#EF4444" strokeWidth="3"/>
                <line x1="115" y1="160" x2="120" y2="220" stroke="#EF4444" strokeWidth="3"/>
                {/* Gait instability markers */}
                {[80, 120].map((x, i) => (
                  <circle key={i} cx={x} cy={220} r="8" fill="none" stroke="#EF4444" strokeWidth="1.5" opacity="0.7">
                    <animate attributeName="r" from="8" to="16" dur="1.5s" repeatCount="indefinite"/>
                    <animate attributeName="opacity" from="0.7" to="0" dur="1.5s" repeatCount="indefinite"/>
                  </circle>
                ))}
                <text x="100" y="260" textAnchor="middle" fontSize="10" fill="#F59E0B" fontWeight="600">Unstable Gait</text>
              </svg>
            </div>
          </div>

          <div className="glass-card" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Stride Analysis</div>
            {[
              { label: 'Left Stride Length', value: '0.52m', ref: '0.65m', ok: false },
              { label: 'Right Stride Length', value: '0.54m', ref: '0.65m', ok: false },
              { label: 'Stride Symmetry', value: '96%', ref: '100%', ok: true },
              { label: 'Cadence', value: '88 spm', ref: '100 spm', ok: false },
              { label: 'Double Support', value: '32%', ref: '20%', ok: false },
            ].map(s => (
              <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border-muted)' }}>
                <span style={{ fontSize: 11, color: 'var(--outline)' }}>{s.label}</span>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: s.ok ? '#4edea3' : '#F59E0B' }}>{s.value}</span>
                  <span style={{ fontSize: 9, color: 'var(--outline)' }}>ref: {s.ref}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
