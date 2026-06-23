import React from 'react';
import './PageLayout.css';
import './SleepApneaDashboard.css';

const timelineSegments = [
  { x: 0, w: 14, stage: 'Awake', color: '#EF4444', opacity: 0.72 },
  { x: 14, w: 19, stage: 'Light Sleep', color: '#adc6ff', opacity: 0.56 },
  { x: 33, w: 25, stage: 'Deep Sleep', color: '#3B82F6', opacity: 0.82 },
  { x: 58, w: 14, stage: 'REM', color: '#4edea3', opacity: 0.68 },
  { x: 72, w: 10, stage: 'Apnea Window', color: '#F59E0B', opacity: 0.96 },
  { x: 82, w: 18, stage: 'Deep Sleep', color: '#1a56db', opacity: 0.76 },
];

const apneaEvents = [
  { time: '2:14 AM', type: 'Obstructive apnea', duration: '18s', spo2: '91%', severity: 'Medium' },
  { time: '3:02 AM', type: 'Shallow breathing', duration: '24s', spo2: '92%', severity: 'Mild' },
  { time: '3:47 AM', type: 'Apnea recovery', duration: '11s', spo2: '93%', severity: 'Medium' },
];

const breathingSeries = [
  15.1, 14.8, 14.2, 13.8, 13.1, 12.9, 13.0, 12.5, 12.1, 11.6,
  10.8, 8.4, 7.1, 9.6, 12.8, 13.4, 13.7, 13.1, 12.7, 12.4,
];

function buildLinePath(points) {
  return points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
}

function buildChartPoints(data, width, height, padding, min, max) {
  const plotWidth = width - padding * 2;
  const plotHeight = height - padding * 2;

  return data.map((value, index) => {
    const x = padding + (plotWidth * index) / (data.length - 1);
    const ratio = (value - min) / (max - min);
    const y = padding + (1 - ratio) * plotHeight;
    return { x, y, value };
  });
}

function AreaWave() {
  const width = 760;
  const height = 260;
  const padding = 24;
  const points = buildChartPoints(breathingSeries, width, height, padding, 6, 16);
  const area = `${buildLinePath(points)} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="sleep-apnea__panel sleep-apnea__panel--chart glass-card">
      <div className="sleep-apnea__panel-head">
        <div>
          <h3 className="sleep-apnea__section-title">Breathing Rate and Recovery</h3>
          <p className="sleep-apnea__section-subtitle">Minute-by-minute overnight trend with event markers</p>
        </div>
        <span className="badge badge-warning">2 spikes detected</span>
      </div>

      <div className="sleep-apnea__chart-shell">
        <svg viewBox={`0 0 ${width} ${height}`} className="sleep-apnea__svg" role="img" aria-label="Breathing rate overnight chart">
          <defs>
            <linearGradient id="apneaFill" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#F59E0B" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.03" />
            </linearGradient>
          </defs>

          {[0, 1, 2, 3].map(i => {
            const y = padding + ((height - padding * 2) / 3) * i;
            return <line key={i} x1={padding} x2={width - padding} y1={y} y2={y} className="sleep-apnea__grid-line" />;
          })}

          <path d={`${buildLinePath(points)} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`} fill="url(#apneaFill)" />
          <path d={buildLinePath(points)} className="sleep-apnea__line sleep-apnea__line--breathing" />

          {points.map((point, index) => (
            <circle
              key={index}
              cx={point.x}
              cy={point.y}
              r={index === 11 || index === 12 ? 5.5 : 3.6}
              className={index === 11 || index === 12 ? 'sleep-apnea__point sleep-apnea__point--critical' : 'sleep-apnea__point'}
            />
          ))}

          <text x={padding} y={18} className="sleep-apnea__axis-title">Breathing rate (RPM)</text>
          <text x={width - padding} y={18} textAnchor="end" className="sleep-apnea__axis-title sleep-apnea__axis-title--muted">Apnea dip around 3 AM</text>
        </svg>
      </div>

      <div className="sleep-apnea__chart-foot">
        {[
          { label: 'Average', value: '13.8 RPM' },
          { label: 'Lowest', value: '7.1 RPM' },
          { label: 'Recovery', value: '13 seconds' },
        ].map(item => (
          <div key={item.label} className="sleep-apnea__stat-pill">
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>
    </div>
  );
}

function NightTimeline() {
  return (
    <div className="sleep-apnea__panel glass-card">
      <div className="sleep-apnea__panel-head">
        <div>
          <h3 className="sleep-apnea__section-title">Night Timeline</h3>
          <p className="sleep-apnea__section-subtitle">10 PM to 7 AM sleep staging and apnea windows</p>
        </div>
        <div className="sleep-apnea__timeline-key">
          <span><i className="sleep-apnea__key-dot sleep-apnea__key-dot--red" /> Awake</span>
          <span><i className="sleep-apnea__key-dot sleep-apnea__key-dot--blue" /> Sleep stages</span>
          <span><i className="sleep-apnea__key-dot sleep-apnea__key-dot--amber" /> Apnea</span>
        </div>
      </div>

      <div className="sleep-apnea__timeline">
        <div className="sleep-apnea__timeline-track">
          {timelineSegments.map((seg, i) => (
            <div
              key={i}
              className="sleep-apnea__timeline-segment"
              style={{ left: `${seg.x}%`, width: `${seg.w}%`, background: seg.color, opacity: seg.opacity }}
              title={seg.stage}
            />
          ))}

          {[33, 62, 75].map((pos, i) => (
            <div key={i} className="sleep-apnea__timeline-marker" style={{ left: `${pos}%` }}>
              <span className="sleep-apnea__timeline-marker-dot" />
              <span className="sleep-apnea__timeline-marker-label">Event {i + 1}</span>
            </div>
          ))}
        </div>

        <div className="sleep-apnea__timeline-labels">
          {['10PM', '11PM', '12AM', '1AM', '2AM', '3AM', '4AM', '5AM', '6AM', '7AM'].map(time => (
            <span key={time}>{time}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SleepApneaDashboard() {
  return (
    <div className="page-layout sleep-apnea-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#adc6ff' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep Apnea Dashboard</h1>
            <p className="page-layout__subtitle">Overnight event review for Mr. Raghav Iyer</p>
          </div>
        </div>
        <span className="badge badge-warning">2 apnea events</span>
      </div>

      <div className="page-layout__content sleep-apnea__content">
        <section className="sleep-apnea__hero glass-card">
          <div className="sleep-apnea__hero-copy">
            <span className="sleep-apnea__eyebrow">Last Night Summary</span>
            <h2 className="sleep-apnea__hero-title">Mild interruption pattern with stable recovery</h2>
            <p className="sleep-apnea__hero-text">
              Sleep remained mostly stable until a short apnea cluster around 3 AM. SpO2 recovered quickly and the resident returned to deep sleep without agitation.
            </p>
          </div>

          <div className="sleep-apnea__hero-metrics">
            {[
              { label: 'Sleep duration', value: '5h 42m' },
              { label: 'Apnea events', value: '2' },
              { label: 'Lowest SpO2', value: '91%' },
              { label: 'Sleep risk', value: '62/100' },
            ].map(item => (
              <div key={item.label} className="sleep-apnea__hero-metric">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="sleep-apnea__kpis">
          {[
            { label: 'Sleep Efficiency', value: '74%', color: '#4edea3', status: 'stable' },
            { label: 'Breathing Interruptions', value: '14', color: '#EF4444', status: 'critical' },
            { label: 'Recovery Time', value: '13s', color: '#F59E0B', status: 'warning' },
            { label: 'Restlessness', value: 'Low', color: '#3B82F6', status: 'stable' },
          ].map(kpi => (
            <div key={kpi.label} className="sleep-apnea__kpi glass-card" style={{ borderTop: `4px solid ${kpi.color}` }}>
              <span className="sleep-apnea__kpi-label">{kpi.label}</span>
              <span className="sleep-apnea__kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
              <span className={`badge badge-${kpi.status}`}>{kpi.status.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div className="sleep-apnea__grid">
          <div className="sleep-apnea__main">
            <NightTimeline />
            <AreaWave />

            <div className="sleep-apnea__panel glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">Sleep Stage Legend</h3>
                  <p className="sleep-apnea__section-subtitle">Hardcoded clinical palette for the current night</p>
                </div>
              </div>
              <div className="sleep-apnea__legend">
                {[
                  { color: '#EF4444', label: 'Awake' },
                  { color: '#adc6ff', label: 'Light Sleep' },
                  { color: '#3B82F6', label: 'Deep Sleep' },
                  { color: '#4edea3', label: 'REM Sleep' },
                  { color: '#F59E0B', label: 'Apnea Window' },
                ].map(item => (
                  <div key={item.label} className="sleep-apnea__legend-item">
                    <span style={{ background: item.color }} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="sleep-apnea__side">
            <div className="sleep-apnea__panel glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">Apnea Events</h3>
                  <p className="sleep-apnea__section-subtitle">Three hardcoded clinical markers from the night</p>
                </div>
              </div>

              <div className="sleep-apnea__event-list">
                {apneaEvents.map(event => (
                  <article key={event.time} className="sleep-apnea__event-card">
                    <div className="sleep-apnea__event-top">
                      <strong>{event.time}</strong>
                      <span className={`badge ${event.severity === 'Mild' ? 'badge-stable' : 'badge-warning'}`}>{event.severity}</span>
                    </div>
                    <div className="sleep-apnea__event-type">{event.type}</div>
                    <div className="sleep-apnea__event-meta">
                      <span>Duration</span>
                      <strong>{event.duration}</strong>
                    </div>
                    <div className="sleep-apnea__event-meta">
                      <span>SpO2</span>
                      <strong>{event.spo2}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="sleep-apnea__panel glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">Care Notes</h3>
                  <p className="sleep-apnea__section-subtitle">Hardcoded summary for the morning handoff</p>
                </div>
              </div>

              <div className="sleep-apnea__notes">
                {[
                  { key: 'Resident', value: 'Mr. Raghav Iyer' },
                  { key: 'Night position', value: 'Mostly supine' },
                  { key: 'Room condition', value: 'Quiet and calm' },
                  { key: 'Action', value: 'Continue overnight oxygen watch' },
                ].map(item => (
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
