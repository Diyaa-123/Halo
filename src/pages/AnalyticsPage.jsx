import React, { useState } from 'react';
import './PageLayout.css';

function MiniSparkline({ data, color, w = 120, h = 40 }) {
  const min = Math.min(...data), max = Math.max(...data);
  const range = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * (h - 6) - 3}`);
  const area = `M${pts[0]} L${pts.join(' L')} L${w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <defs>
        <linearGradient id={`g${color}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3"/>
          <stop offset="100%" stopColor={color} stopOpacity="0"/>
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g${color})`}/>
      <polyline points={pts.join(' ')} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

const analyticsData = {
  breathing: [14,13,12,11,12,10,9,11,12,11,10,9,8,10,12,13,11,10,9,8,9,10,11,12],
  heart: [72,74,73,71,72,75,78,76,74,73,72,71,70,72,74,73,72,71,70,72,74,75,73,72],
  sleep: [82,80,78,75,72,70,68,72,75,78,80,82,85,83,80,78,76,74,72,70,68,70,72,75],
  agitation: [10,12,15,18,20,22,24,25,22,20,18,20,22,25,28,30,28,25,22,20,18,16,14,12],
  mobility: [75,74,73,72,71,70,69,68,67,65,64,65,66,67,68,67,66,65,64,63,62,63,64,65],
  nutrition: [80,82,83,81,80,78,76,78,80,82,83,81,80,78,76,74,72,74,76,78,80,82,84,82],
};

const chartConfigs = [
  { key: 'breathing', label: 'Breathing Rate', unit: 'BPM', color: '#F59E0B', icon: 'air', status: 'warning' },
  { key: 'heart', label: 'Heart Rate', unit: 'BPM', color: '#4edea3', icon: 'favorite', status: 'stable' },
  { key: 'sleep', label: 'Sleep Quality', unit: '%', color: '#adc6ff', icon: 'bedtime', status: 'stable' },
  { key: 'agitation', label: 'Agitation Index', unit: '/100', color: '#EF4444', icon: 'psychology_alt', status: 'critical' },
  { key: 'mobility', label: 'Mobility Score', unit: '/100', color: '#ffb786', icon: 'directions_walk', status: 'warning' },
  { key: 'nutrition', label: 'Nutrition Adherence', unit: '%', color: '#4edea3', icon: 'restaurant', status: 'stable' },
];

export default function AnalyticsPage() {
  const [filter, setFilter] = useState('24h');
  const filters = ['24h', '7d', '30d', '90d'];

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>analytics</span>
          <div>
            <h1 className="page-layout__title">Analytics</h1>
            <p className="page-layout__subtitle">Hospital-grade intelligence dashboard — Aarav Mehta</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {filters.map(f => (
            <button
              key={f}
              className={`page-layout__filter-btn ${filter === f ? 'page-layout__filter-btn--active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">
        {/* Summary KPIs */}
        <div className="analytics-kpis">
          {[
            { label: 'Health Score', value: '82', unit: '/100', trend: '-3', color: '#adc6ff' },
            { label: 'Alerts Today', value: '5', unit: 'events', trend: '+2', color: '#EF4444' },
            { label: 'Avg Breathing', value: '10.8', unit: 'BPM', trend: '-1.2', color: '#F59E0B' },
            { label: 'Sleep Efficiency', value: '74', unit: '%', trend: '-4', color: '#ffb786' },
          ].map(kpi => (
            <div key={kpi.label} className="analytics-kpi glass-card" style={{ '--kpi-color': kpi.color }}>
              <span className="analytics-kpi__label">{kpi.label}</span>
              <div className="analytics-kpi__value-row">
                <span className="analytics-kpi__value" style={{ color: kpi.color }}>{kpi.value}</span>
                <span className="analytics-kpi__unit">{kpi.unit}</span>
              </div>
              <span className="analytics-kpi__trend" style={{ color: kpi.trend.startsWith('+') ? '#EF4444' : '#4edea3' }}>
                {kpi.trend.startsWith('+') ? '↑' : '↓'} {kpi.trend}
              </span>
            </div>
          ))}
        </div>

        {/* Chart Grid */}
        <div className="analytics-charts">
          {chartConfigs.map(cfg => {
            const data = analyticsData[cfg.key];
            const current = data[data.length - 1];
            return (
              <div key={cfg.key} className="analytics-chart glass-card">
                <div className="analytics-chart__header">
                  <div className="analytics-chart__title-row">
                    <span className="material-icons" style={{ color: cfg.color, fontSize: 16 }}>{cfg.icon}</span>
                    <span className="analytics-chart__title">{cfg.label}</span>
                  </div>
                  <span className={`badge badge-${cfg.status}`}>{cfg.status.toUpperCase()}</span>
                </div>
                <div className="analytics-chart__value">
                  <span style={{ color: cfg.color, fontSize: 28, fontWeight: 800 }}>{current}</span>
                  <span style={{ color: 'var(--outline)', fontSize: 12, marginLeft: 4 }}>{cfg.unit}</span>
                </div>
                <MiniSparkline data={data} color={cfg.color} w={200} h={60} />
                <div className="analytics-chart__xaxis">
                  <span>00:00</span>
                  <span>06:00</span>
                  <span>12:00</span>
                  <span>18:00</span>
                  <span>Now</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Occupancy Heatmap */}
        <div className="analytics-heatmap glass-card">
          <div className="analytics-heatmap__title">
            <span className="material-icons" style={{ color: 'var(--primary)', fontSize: 16 }}>map</span>
            Occupancy Heatmap — 24h
          </div>
          <div className="analytics-heatmap__grid">
            {Array.from({ length: 24 }, (_, h) => (
              <div key={h} className="analytics-heatmap__col">
                <div className="analytics-heatmap__hour">{h.toString().padStart(2, '0')}</div>
                {['Bedroom', 'Bathroom', 'Living', 'Kitchen', 'Corridor'].map(zone => {
                  const activity = Math.random();
                  const color = activity > 0.7 ? 'rgba(77,142,255,0.7)'
                    : activity > 0.4 ? 'rgba(77,142,255,0.35)'
                    : activity > 0.1 ? 'rgba(77,142,255,0.12)'
                    : 'rgba(255,255,255,0.02)';
                  return (
                    <div key={zone} className="analytics-heatmap__cell" style={{ background: color }} title={`${zone}: ${h}:00`} />
                  );
                })}
              </div>
            ))}
          </div>
          <div className="analytics-heatmap__legend">
            <span>Low</span>
            <div className="analytics-heatmap__legend-bar" />
            <span>High Activity</span>
          </div>
        </div>
      </div>
    </div>
  );
}
