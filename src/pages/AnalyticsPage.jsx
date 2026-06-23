import React, { useState } from 'react';
import './PageLayout.css';
import './AnalyticsPage.css';

function MiniSparkline({ data, color, w = 120, h = 40 }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const points = data.map((value, index) => {
    const x = (index / (data.length - 1)) * w;
    const y = h - ((value - min) / range) * (h - 6) - 3;
    return `${x},${y}`;
  });
  const area = `M${points[0]} L${points.join(' L')} L${w},${h} L0,${h} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h}>
      <defs>
        <linearGradient id={`g-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#g-${color.replace('#', '')})`} />
      <polyline points={points.join(' ')} fill="none" stroke={color} strokeWidth="2.25" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const analyticsData = {
  breathing: [14, 13, 12, 11, 12, 10, 9, 11, 12, 11, 10, 9, 8, 10, 12, 13, 11, 10, 9, 8, 9, 10, 11, 12],
  heart: [72, 74, 73, 71, 72, 75, 78, 76, 74, 73, 72, 71, 70, 72, 74, 73, 72, 71, 70, 72, 74, 75, 73, 72],
  sleep: [82, 80, 78, 75, 72, 70, 68, 72, 75, 78, 80, 82, 85, 83, 80, 78, 76, 74, 72, 70, 68, 70, 72, 75],
  agitation: [10, 12, 15, 18, 20, 22, 24, 25, 22, 20, 18, 20, 22, 25, 28, 30, 28, 25, 22, 20, 18, 16, 14, 12],
  mobility: [75, 74, 73, 72, 71, 70, 69, 68, 67, 65, 64, 65, 66, 67, 68, 67, 66, 65, 64, 63, 62, 63, 64, 65],
  nutrition: [80, 82, 83, 81, 80, 78, 76, 78, 80, 82, 83, 81, 80, 78, 76, 74, 72, 74, 76, 78, 80, 82, 84, 82],
};

const chartConfigs = [
  { key: 'breathing', label: 'Breathing Rate', unit: 'BPM', color: '#F59E0B', icon: 'air', status: 'warning' },
  { key: 'heart', label: 'Heart Rate', unit: 'BPM', color: '#4edea3', icon: 'favorite', status: 'stable' },
  { key: 'sleep', label: 'Sleep Quality', unit: '%', color: '#adc6ff', icon: 'bedtime', status: 'stable' },
  { key: 'agitation', label: 'Agitation Index', unit: '/100', color: '#EF4444', icon: 'psychology_alt', status: 'critical' },
  { key: 'mobility', label: 'Mobility Score', unit: '/100', color: '#ffb786', icon: 'directions_walk', status: 'warning' },
  { key: 'nutrition', label: 'Nutrition Adherence', unit: '%', color: '#4edea3', icon: 'restaurant', status: 'stable' },
];

const heatmapZones = ['Bedroom', 'Bathroom', 'Living', 'Kitchen', 'Corridor'];
const heatmapValues = Array.from({ length: 24 }, (_, hour) =>
  heatmapZones.map((_, zoneIndex) => {
    const rhythm = Math.sin((hour + zoneIndex * 3) / 3.2) * 0.32 + 0.5;
    return Math.max(0.08, Math.min(0.96, rhythm + zoneIndex * 0.05 - (zoneIndex === 1 && hour >= 1 && hour <= 4 ? 0.18 : 0)));
  })
);

export default function AnalyticsPage() {
  const [filter, setFilter] = useState('24h');
  const filters = ['24h', '7d', '30d', '90d'];

  return (
    <div className="page-layout analytics-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>analytics</span>
          <div>
            <h1 className="page-layout__title">Analytics Overview</h1>
            <p className="page-layout__subtitle">Hospital-grade intelligence dashboard for Mr. Raghav Iyer</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {filters.map(item => (
            <button
              key={item}
              className={`page-layout__filter-btn ${filter === item ? 'page-layout__filter-btn--active' : ''}`}
              onClick={() => setFilter(item)}
            >
              {item}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">
        <section className="analytics-hero glass-card">
          <div>
            <span className="analytics-hero__eyebrow">Unified Summary</span>
            <h2 className="analytics-hero__title">Cross-domain monitoring with stable clinical signals</h2>
            <p className="analytics-hero__text">
              Breathing, sleep, agitation, and mobility all remain within a watchful but stable range. The only notable pressure point is mobility score drift in the evening window.
            </p>
          </div>

          <div className="analytics-hero__stats">
            {[
              { label: 'Health score', value: '82/100' },
              { label: 'Alerts today', value: '5' },
              { label: 'Avg breathing', value: '10.8 BPM' },
              { label: 'Sleep efficiency', value: '74%' },
            ].map(item => (
              <div key={item.label} className="analytics-hero__stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="analytics-kpi-grid">
          {[
            { label: 'Health Score', value: '82', unit: '/100', trend: '-3', color: '#adc6ff' },
            { label: 'Alerts Today', value: '5', unit: 'events', trend: '+2', color: '#EF4444' },
            { label: 'Avg Breathing', value: '10.8', unit: 'BPM', trend: '-1.2', color: '#F59E0B' },
            { label: 'Sleep Efficiency', value: '74', unit: '%', trend: '-4', color: '#ffb786' },
          ].map(kpi => (
            <div key={kpi.label} className="glass-card analytics-kpi" style={{ borderTop: `4px solid ${kpi.color}` }}>
              <div className="analytics-kpi__label">{kpi.label}</div>
              <div className="analytics-kpi__value-row">
                <span className="analytics-kpi__value" style={{ color: kpi.color }}>{kpi.value}</span>
                <span className="analytics-kpi__unit">{kpi.unit}</span>
              </div>
              <div className={`analytics-kpi__trend ${kpi.trend.startsWith('+') ? 'analytics-kpi__trend--up' : 'analytics-kpi__trend--down'}`}>
                {kpi.trend.startsWith('+') ? '↑' : '↓'} {kpi.trend}
              </div>
            </div>
          ))}
        </div>

        <div className="analytics-grid">
          {chartConfigs.map(config => {
            const data = analyticsData[config.key];
            const current = data[data.length - 1];
            return (
              <div key={config.key} className="glass-card analytics-chart">
                <div className="analytics-chart__header">
                  <div className="analytics-chart__title-row">
                    <span className="material-icons" style={{ color: config.color, fontSize: 16 }}>{config.icon}</span>
                    <span className="analytics-chart__title">{config.label}</span>
                  </div>
                  <span className={`badge badge-${config.status}`}>{config.status.toUpperCase()}</span>
                </div>
                <div className="analytics-chart__value">
                  <span style={{ color: config.color }}>{current}</span>
                  <small>{config.unit}</small>
                </div>
                <MiniSparkline data={data} color={config.color} w={220} h={64} />
                <div className="analytics-chart__axis">
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

        <div className="analytics-bottom-grid">
          <div className="glass-card analytics-heatmap">
            <div className="analytics-heatmap__header">
              <div>
                <h3 className="analytics-section-title">Occupancy Heatmap</h3>
                <p className="analytics-section-subtitle">24-hour zone activity using deterministic hardcoded patterns</p>
              </div>
              <span className="badge badge-stable">24h</span>
            </div>

            <div className="analytics-heatmap__grid">
              {Array.from({ length: 24 }, (_, hour) => (
                <div key={hour} className="analytics-heatmap__col">
                  <div className="analytics-heatmap__hour">{hour.toString().padStart(2, '0')}</div>
                  {heatmapZones.map((zone, zoneIndex) => {
                    const intensity = heatmapValues[hour][zoneIndex];
                    return (
                      <div
                        key={zone}
                        className="analytics-heatmap__cell"
                        style={{ background: `rgba(77, 142, 255, ${intensity})` }}
                        title={`${zone} at ${hour}:00`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>

            <div className="analytics-heatmap__legend">
              <span>Low</span>
              <div className="analytics-heatmap__legend-bar" />
              <span>High activity</span>
            </div>
          </div>

          <div className="analytics-side">
            <div className="glass-card analytics-side__card">
              <h3 className="analytics-section-title">Clinical Highlights</h3>
              <div className="analytics-highlight-list">
                {[
                  { title: 'Breathing', body: 'Stable range most of the day, no prolonged apnea clusters.' },
                  { title: 'Mobility', body: 'Evening walk speed drift is the main area under watch.' },
                  { title: 'Sleep', body: 'Single Friday disruption, otherwise steady overnight recovery.' },
                ].map(item => (
                  <div key={item.title} className="analytics-highlight">
                    <strong>{item.title}</strong>
                    <p>{item.body}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card analytics-side__card">
              <h3 className="analytics-section-title">Snapshot Notes</h3>
              <div className="analytics-notes">
                {[
                  { key: 'Resident', value: 'Mr. Raghav Iyer' },
                  { key: 'Current watch', value: 'Mobility + sleep' },
                  { key: 'Observation', value: 'Stable, low agitation' },
                ].map(item => (
                  <div key={item.key} className="analytics-note-row">
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
