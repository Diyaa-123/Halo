import React from 'react';
import './PageLayout.css';
import './WeeklyReportPage.css';

const sleepScores = [81, 79, 74, 73, 80, 84, 82];
const sleepNights = [
  { day: 'Mon', duration: '7.2h', score: 81, note: 'steady' },
  { day: 'Tue', duration: '6.5h', score: 79, note: 'mild restlessness' },
  { day: 'Wed', duration: '6.4h', score: 74, note: 'visitor disturbance' },
  { day: 'Thu', duration: '7.0h', score: 73, note: 'light wake-ups' },
  { day: 'Fri', duration: '7.4h', score: 80, note: 'improved' },
  { day: 'Sat', duration: '7.8h', score: 84, note: 'best night' },
  { day: 'Sun', duration: '7.5h', score: 82, note: 'stable' },
];

const safetyEvents = [
  { time: 'Tue 09:14 PM', type: 'Apnea event', detail: 'Short breathing pause near sleep onset', alert: 'Sent', ack: 'Acknowledged' },
  { time: 'Wed 02:18 PM', type: 'Prolonged inactivity', detail: 'Lower movement detected during afternoon rest', alert: 'Sent', ack: 'Acknowledged' },
  { time: 'Fri 06:41 AM', type: 'No fall event', detail: 'No safety event recorded this week', alert: 'N/A', ack: 'N/A' },
];

const routineHeatmap = [
  [0.78, 0.72, 0.66, 0.58, 0.76, 0.82, 0.79],
  [0.64, 0.62, 0.5, 0.48, 0.63, 0.68, 0.65],
  [0.71, 0.69, 0.58, 0.54, 0.68, 0.74, 0.72],
  [0.88, 0.84, 0.7, 0.68, 0.85, 0.9, 0.87],
];

const rowLabels = ['Morning', 'Afternoon', 'Evening', 'Night'];
const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

function Sparkline({ data }) {
  const w = 520;
  const h = 130;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const padding = 16;
  const points = data.map((value, index) => {
    const x = padding + ((w - padding * 2) * index) / (data.length - 1);
    const y = padding + (1 - (value - min) / range) * (h - padding * 2);
    return { x, y };
  });
  const line = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ');
  const area = `${line} L ${points[points.length - 1].x} ${h - padding} L ${points[0].x} ${h - padding} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="weekly-report__spark" role="img" aria-label="Weekly sleep scores sparkline">
      <defs>
        <linearGradient id="weeklySleepFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#1a56db" stopOpacity="0.26" />
          <stop offset="100%" stopColor="#1a56db" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => {
        const y = padding + ((h - padding * 2) / 3) * i;
        return <line key={i} x1={padding} x2={w - padding} y1={y} y2={y} className="weekly-report__spark-grid" />;
      })}
      <path d={area} fill="url(#weeklySleepFill)" />
      <path d={line} className="weekly-report__spark-line" />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={index === points.length - 1 ? 5 : 3.5} className="weekly-report__spark-point" />
      ))}
    </svg>
  );
}

export default function WeeklyReportPage() {
  const avgSleep = (sleepScores.reduce((sum, value) => sum + value, 0) / sleepScores.length).toFixed(0);
  const belowBaseline = sleepScores.filter(score => score < 78).length;
  const attributionHighConfidence = 73;
  const attributionPaused = 27;
  const comparedToLastWeek = [
    { label: 'Sleep quality', value: '↑ 4%', tone: 'good' },
    { label: 'Routine regularity', value: '↓ 8%', tone: 'slight' },
    { label: 'Safety events', value: '0', tone: 'good' },
  ];

  return (
    <div className="page-layout weekly-report">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>summarize</span>
          <div>
            <h1 className="page-layout__title">Weekly AI Summary</h1>
            <p className="page-layout__subtitle">Family-friendly overview for Mr. Raghav Iyer · Week of June 15</p>
          </div>
        </div>
        <button className="btn btn-primary">
          <span className="material-icons icon-sm">download</span>
          Download PDF
        </button>
      </div>

      <div className="page-layout__content weekly-report__content">
        <section className="weekly-report__hero glass-card">
          <span className="weekly-report__eyebrow">This week at a glance</span>
          <h2 className="weekly-report__headline">Dad had a stable week - sleep was consistent and there were no safety events.</h2>
          <p className="weekly-report__lede">
            Open this report if you want a fast answer: the week looks steady overall, with a small midweek sleep dip that recovered by the weekend.
          </p>
        </section>

        <div className="weekly-report__grid">
          <div className="weekly-report__main">
            <div className="glass-card weekly-report__card">
              <div className="weekly-report__card-head">
                <div>
                  <h3 className="weekly-report__section-title">Sleep this week</h3>
                  <p className="weekly-report__section-subtitle">Average sleep duration, average quality score, and nights below baseline</p>
                </div>
                <span className="badge badge-stable">STABLE</span>
              </div>

              <div className="weekly-report__sleep-metrics">
                <div className="weekly-report__sleep-metric">
                  <span>Average duration</span>
                  <strong>7.1 hours</strong>
                </div>
                <div className="weekly-report__sleep-metric">
                  <span>Average quality</span>
                  <strong>{avgSleep}/100</strong>
                </div>
                <div className="weekly-report__sleep-metric">
                  <span>Nights below baseline</span>
                  <strong>{belowBaseline}</strong>
                </div>
              </div>

              <div className="weekly-report__spark-shell">
                <Sparkline data={sleepScores} />
              </div>

              <div className="weekly-report__sleep-days">
                {sleepNights.map(night => (
                  <div key={night.day} className="weekly-report__sleep-day">
                    <span className="weekly-report__sleep-day-label">{night.day}</span>
                    <strong>{night.duration}</strong>
                    <span>{night.score}/100</span>
                    <em>{night.note}</em>
                  </div>
                ))}
              </div>

              <p className="weekly-report__interpretation">
                Slept well on 5 of 7 nights. Tuesday and Wednesday showed mild restlessness, possibly related to the visitor detected that afternoon.
              </p>
            </div>

            <div className="glass-card weekly-report__card">
              <div className="weekly-report__card-head">
                <div>
                  <h3 className="weekly-report__section-title">Safety events</h3>
                  <p className="weekly-report__section-subtitle">Falls, prolonged inactivity, and apnea events</p>
                </div>
                <span className="badge badge-stable">NO FALLS</span>
              </div>

              <div className="weekly-report__safety-summary">
                <strong>There were no falls this week.</strong>
                <p>One short apnea event and one prolonged inactivity alert were logged, both acknowledged quickly by care staff.</p>
              </div>

              <div className="weekly-report__event-list">
                {safetyEvents.map(event => (
                  <article key={event.time} className="weekly-report__event">
                    <div className="weekly-report__event-top">
                      <strong>{event.time}</strong>
                      <span className="badge badge-warning">{event.type}</span>
                    </div>
                    <div className="weekly-report__event-detail">{event.detail}</div>
                    <div className="weekly-report__event-meta">
                      <span>Alert sent</span>
                      <strong>{event.alert}</strong>
                    </div>
                    <div className="weekly-report__event-meta">
                      <span>Acknowledged</span>
                      <strong>{event.ack}</strong>
                    </div>
                  </article>
                ))}
              </div>
            </div>

            <div className="glass-card weekly-report__card">
              <div className="weekly-report__card-head">
                <div>
                  <h3 className="weekly-report__section-title">Routine regularity</h3>
                  <p className="weekly-report__section-subtitle">Morning, afternoon, evening, and night pattern consistency</p>
                </div>
              </div>

              <div className="weekly-report__routine-grid">
                <div className="weekly-report__routine-corner" />
                {dayLabels.map(day => (
                  <div key={day} className="weekly-report__routine-day">{day}</div>
                ))}
                {rowLabels.map((row, rowIndex) => (
                  <React.Fragment key={row}>
                    <div className="weekly-report__routine-row-label">{row}</div>
                    {routineHeatmap[rowIndex].map((value, colIndex) => {
                      const isGood = value >= 0.75;
                      const isMixed = value >= 0.6 && value < 0.75;
                      return (
                        <div
                          key={`${row}-${colIndex}`}
                          className="weekly-report__routine-cell"
                          style={{
                            background: isGood
                              ? 'rgba(34, 197, 94, 0.72)'
                              : isMixed
                                ? 'rgba(245, 158, 11, 0.62)'
                                : 'rgba(239, 68, 68, 0.56)',
                          }}
                          title={`${row} ${dayLabels[colIndex]}: ${Math.round(value * 100)}%`}
                        />
                      );
                    })}
                  </React.Fragment>
                ))}
              </div>

              <div className="weekly-report__routine-legend">
                <span><i className="weekly-report__legend-dot weekly-report__legend-dot--green" />Regular</span>
                <span><i className="weekly-report__legend-dot weekly-report__legend-dot--amber" />Mixed</span>
                <span><i className="weekly-report__legend-dot weekly-report__legend-dot--red" />Irregular</span>
              </div>

              <p className="weekly-report__interpretation">
                Morning activity was the most consistent, afternoons were slightly lighter midweek, and evenings stayed calm overall.
              </p>
            </div>
          </div>

          <aside className="weekly-report__side">
            <div className="glass-card weekly-report__card weekly-report__card--compact">
              <h3 className="weekly-report__section-title">Attribution quality</h3>
              <p className="weekly-report__section-subtitle">How much of the data was confidently tied to Dad specifically</p>

              <div className="weekly-report__attribution-meter">
                <div className="weekly-report__attribution-meter-fill" style={{ width: `${attributionHighConfidence}%` }} />
              </div>
              <div className="weekly-report__attribution-values">
                <strong>{attributionHighConfidence}%</strong>
                <span>high-confidence attribution</span>
              </div>
              <div className="weekly-report__attribution-muted">
                {attributionPaused}% of the week was household activity time where monitoring was paused.
              </div>
            </div>

            <div className="glass-card weekly-report__card weekly-report__card--compact">
              <h3 className="weekly-report__section-title">Compared to last week</h3>
              <div className="weekly-report__delta-list">
                {comparedToLastWeek.map(item => (
                  <div key={item.label} className="weekly-report__delta-row">
                    <span>{item.label}</span>
                    <strong className={`weekly-report__delta-value weekly-report__delta-value--${item.tone}`}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card weekly-report__action-card">
              <span className="weekly-report__action-eyebrow">One recommended action</span>
              <p>
                Sleep quality has declined slightly over 3 weeks, so consider mentioning this at Dad&apos;s next check-up.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
