import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageLayout.css';
import './SleepAnalyticsPage.css';

const sleepData = [
  { day: 'Mon', duration: 7.2, quality: 85, interruptions: 1 },
  { day: 'Tue', duration: 6.8, quality: 78, interruptions: 3 },
  { day: 'Wed', duration: 8.1, quality: 92, interruptions: 0 },
  { day: 'Thu', duration: 7.5, quality: 88, interruptions: 1 },
  { day: 'Fri', duration: 5.4, quality: 62, interruptions: 4 },
  { day: 'Sat', duration: 7.8, quality: 90, interruptions: 0 },
  { day: 'Sun', duration: 7.0, quality: 82, interruptions: 1 },
];

const nightSamples = [
  { time: '10PM', breathing: 15.6, quality: 72, stage: 'Light' },
  { time: '11PM', breathing: 14.8, quality: 74, stage: 'Light' },
  { time: '12AM', breathing: 13.9, quality: 78, stage: 'Deep' },
  { time: '1AM', breathing: 13.4, quality: 82, stage: 'Deep' },
  { time: '2AM', breathing: 12.8, quality: 86, stage: 'Deep' },
  { time: '3AM', breathing: 7.2, quality: 58, stage: 'Apnea' },
  { time: '4AM', breathing: 13.1, quality: 81, stage: 'REM' },
  { time: '5AM', breathing: 12.6, quality: 84, stage: 'Deep' },
  { time: '6AM', breathing: 10.9, quality: 68, stage: 'Light' },
  { time: '7AM', breathing: 14.2, quality: 88, stage: 'Awake' },
];

function buildLinePath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildChartPoints(data, width, height, padding, min, max) {
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  return data.map((item, index) => {
    const x = padding + (plotWidth * index) / (data.length - 1);
    const ratio = (item.breathing - min) / (max - min);
    const y = padding + (1 - ratio) * plotHeight;
    return { ...item, x, y };
  });
}

function areaPath(points, height, padding) {
  if (!points.length) return '';
  const first = points[0];
  const last = points[points.length - 1];
  return `${buildLinePath(points)} L ${last.x} ${height - padding} L ${first.x} ${height - padding} Z`;
}

function NightBreathingChart() {
  const width = 860;
  const height = 320;
  const padding = 30;
  const points = buildChartPoints(nightSamples, width, height, padding, 6, 16);

  return (
    <div className="sleep-chart glass-card">
      <div className="sleep-chart__header">
        <div>
          <h3 className="sleep-chart__title">Overnight Breathing Trace</h3>
          <p className="sleep-chart__subtitle">Sampled every hour from 10 PM to 7 AM</p>
        </div>
        <div className="sleep-chart__chips">
          <span className="sleep-chip sleep-chip--stable">Avg 14 RPM</span>
          <span className="sleep-chip sleep-chip--warning">1 apnea dip</span>
          <span className="sleep-chip sleep-chip--muted">SpO2 nadir 91%</span>
        </div>
      </div>

      <div className="sleep-chart__svg-wrap">
        <svg viewBox={`0 0 ${width} ${height}`} className="sleep-chart__svg" role="img" aria-label="Overnight breathing rate chart">
          <defs>
            <linearGradient id="breathingFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.02" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3, 4].map(i => {
            const y = padding + ((height - padding * 2) / 4) * i;
            return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} className="sleep-chart__grid-line" />;
          })}

          {[0, 1, 2, 3, 4].map(i => {
            const x = padding + ((width - padding * 2) / 4) * i;
            return <line key={`v-${i}`} y1={padding} y2={height - padding} x1={x} x2={x} className="sleep-chart__grid-line sleep-chart__grid-line--vertical" />;
          })}

          {points.map(point => (
            point.stage === 'Apnea' ? (
              <rect
                key={`apnea-${point.time}`}
                x={point.x - 20}
                y={padding}
                width={40}
                height={height - padding * 2}
                rx="18"
                className="sleep-chart__dip"
              />
            ) : null
          ))}

          <path d={areaPath(points, height, padding)} fill="url(#breathingFill)" />
          <path d={buildLinePath(points)} className="sleep-chart__line sleep-chart__line--breathing" />

          <path
            d={buildLinePath(points.map(point => ({
              x: point.x,
              y: height - padding - (point.quality / 100) * (height - padding * 2) * 0.45,
            })))}
            className="sleep-chart__line sleep-chart__line--quality"
          />

          {points.map(point => (
            <g key={point.time}>
              <circle cx={point.x} cy={point.y} r="4.5" className={`sleep-chart__point ${point.stage === 'Apnea' ? 'sleep-chart__point--critical' : ''}`} />
              {point.stage === 'Apnea' && (
                <text x={point.x} y={point.y - 14} textAnchor="middle" className="sleep-chart__annotation">apnea</text>
              )}
            </g>
          ))}

          {points.map(point => (
            <text key={`${point.time}-label`} x={point.x} y={height - 8} textAnchor="middle" className="sleep-chart__axis-label">
              {point.time}
            </text>
          ))}

          <text x={padding} y={18} className="sleep-chart__axis-title">Breathing rate (RPM)</text>
          <text x={width - padding} y={18} textAnchor="end" className="sleep-chart__axis-title sleep-chart__axis-title--muted">Sleep quality overlay</text>
        </svg>
      </div>

      <div className="sleep-chart__footer">
        {nightSamples.map(sample => (
          <div key={sample.time} className="sleep-chart__stat">
            <span className="sleep-chart__stat-time">{sample.time}</span>
            <span className="sleep-chart__stat-value">{sample.breathing.toFixed(1)} RPM</span>
            <span className="sleep-chart__stat-stage">{sample.stage}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function SleepAnalyticsPage() {
  const navigate = useNavigate();
  const [activeFilter, setActiveFilter] = useState('This Week');

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep & Vitals Analysis</h1>
            <p className="page-layout__subtitle">Overnight ambient sensing and breathing metrics for Mr. Raghav Iyer</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {['This Week', 'Last Week'].map(label => (
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
            { label: 'Sleep Apnea Dashboard', icon: 'bedtime', path: '/sleep-apnea', color: '#adc6ff', desc: 'Nightly apnea events and breathing timeline' },
            { label: 'Eating Monitor', icon: 'restaurant', path: '/eating', color: '#4edea3', desc: 'Meal frequency and nutritional patterns' },
          ].map(m => (
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

        <div className="sleep-kpi-grid">
          {[
            { label: 'Avg Sleep Duration', value: '7.1', unit: 'hrs', color: 'var(--primary)' },
            { label: 'Sleep Quality Score', value: '82', unit: '/100', color: 'var(--secondary)' },
            { label: 'Bed Exits (Avg)', value: '1.4', unit: '/night', color: 'var(--warning-amber)' },
            { label: 'Avg Breathing Rate', value: '14', unit: 'RPM', color: 'var(--primary)' },
          ].map(m => (
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
            <NightBreathingChart />

            <div className="glass-card sleep-card">
              <div className="sleep-card__header">
                <div>
                  <h3 className="sleep-card__title">Weekly Sleep Duration and Quality</h3>
                  <p className="sleep-card__subtitle">Seven-night trend with interruptions and recovery nights</p>
                </div>
                <span className="badge badge-stable">Stable pattern</span>
              </div>

              <div className="sleep-week-chart">
                {sleepData.map(d => {
                  const barHeight = Math.max(42, (d.duration / 9) * 180);
                  return (
                    <div key={d.day} className="sleep-week-chart__col">
                      <div className="sleep-week-chart__track">
                        <div
                          className="sleep-week-chart__fill"
                          style={{
                            height: `${barHeight}px`,
                            background: d.quality > 85 ? 'linear-gradient(180deg, #22C55E 0%, #1a56db 100%)' : d.quality > 75 ? 'linear-gradient(180deg, #3B82F6 0%, #1a56db 100%)' : 'linear-gradient(180deg, #F59E0B 0%, #EF4444 100%)',
                          }}
                        />
                        <div className="sleep-week-chart__quality" style={{ bottom: `${Math.min(180, barHeight + 10)}px` }}>
                          {d.quality}
                        </div>
                      </div>
                      <span className="sleep-week-chart__day">{d.day}</span>
                      <span className="sleep-week-chart__meta">{d.duration} hrs</span>
                      <span className="sleep-week-chart__meta sleep-week-chart__meta--muted">{d.interruptions} exits</span>
                    </div>
                  );
                })}
              </div>

              <div className="sleep-stage-strip">
                {[
                  { label: 'Awake', width: 8, color: '#EF4444' },
                  { label: 'Light', width: 24, color: '#adc6ff' },
                  { label: 'Deep', width: 38, color: '#3B82F6' },
                  { label: 'REM', width: 18, color: '#4edea3' },
                  { label: 'Deep', width: 12, color: '#3B82F6' },
                ].map(stage => (
                  <div key={`${stage.label}-${stage.width}`} className="sleep-stage-strip__item" style={{ width: `${stage.width}%`, background: stage.color }}>
                    <span>{stage.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="sleep-page__side">
            <div className="glass-card sleep-card sleep-card--tight">
              <h3 className="sleep-card__title">AI Sleep Insights</h3>
              <div className="sleep-insight">
                <span className="material-icons" style={{ color: 'var(--primary)' }}>psychology</span>
                <div>
                  <p className="sleep-insight__title">Consistent breathing baseline</p>
                  <p className="sleep-insight__body">Breathing stays in the 13-15 RPM range for most of the night, with one short apnea dip around 3 AM.</p>
                </div>
              </div>

              <div className="sleep-insight sleep-insight--warning">
                <span className="material-icons">warning_amber</span>
                <div>
                  <p className="sleep-insight__title">Single interruption cluster</p>
                  <p className="sleep-insight__body">Interrupted sleep on Friday aligns with elevated bed exits and a lower quality score.</p>
                </div>
              </div>
            </div>

            <div className="glass-card sleep-card sleep-card--tight">
              <h3 className="sleep-card__title">Night Summary</h3>
              <div className="sleep-summary">
                {[
                  { key: 'Resident', value: 'Mr. Raghav Iyer' },
                  { key: 'Sleep window', value: '10:12 PM - 6:58 AM' },
                  { key: 'Lowest BPM', value: '7.2 at 3:00 AM' },
                  { key: 'Wakeups', value: '2 brief awakenings' },
                  { key: 'Nurse note', value: 'Rested, no agitation observed' },
                ].map(item => (
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
