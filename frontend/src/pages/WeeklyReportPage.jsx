import React, { useRef, useState } from 'react';
import './PageLayout.css';
import './WeeklyReportPage.css';
import { useToast } from '../components/layout/ToastContext';

// 3-day window: July 12, 13, 14
const sleepScores = [82, 80, 52];
const sleepNights = [
  { day: 'Jul 12', duration: '7.4h', score: 82, note: 'steady, consistent with baseline' },
  { day: 'Jul 13', duration: '7.2h', score: 80, note: 'steady, consistent with baseline' },
  { day: 'Jul 14', duration: '5.6h', score: 52, note: 'disrupted — 2 fall events' },
];

const fallEvents = [
  {
    time: 'Jul 14 · 14:32',
    confidence: '91%',
    detail: 'Brief event — normal movement resumed within 3 minutes.',
    followup: 'Telegram notification sent to family.',
    tag: 'HIGH CONFIDENCE',
  },
  {
    time: 'Jul 14 · 19:47',
    confidence: '87%',
    detail: 'Extended low-activity period (~40 min) followed event.',
    followup: 'Telegram notification sent to family.',
    tag: 'HIGH CONFIDENCE',
  },
];

const dayBreakdown = [
  { date: 'July 12', sleepQ: '82/100', fallEvts: 0, notes: 'Normal day, consistent with baseline' },
  { date: 'July 13', sleepQ: '80/100', fallEvts: 0, notes: 'Normal day, consistent with baseline' },
  { date: 'July 14', sleepQ: '52/100', fallEvts: 2, notes: 'Elevated attention — see fall events above' },
];

const safetyEvents = [
  { time: 'Jul 14 · 14:32', type: 'Possible fall', detail: 'Brief event — normal movement resumed within 3 minutes. Confidence 91%.', alert: 'Sent', ack: 'Acknowledged' },
  { time: 'Jul 14 · 19:47', type: 'Possible fall', detail: 'Extended low-activity period (~40 min) followed event. Confidence 87%.', alert: 'Sent', ack: 'Acknowledged' },
  { time: 'Jul 12–13', type: 'No events', detail: 'No safety events on either of the first two days.', alert: 'N/A', ack: 'N/A' },
];

const routineHeatmap = [
  [0.82, 0.80, 0.63, null, null, null, null],
  [0.68, 0.65, 0.41, null, null, null, null],
  [0.74, 0.71, 0.38, null, null, null, null],
  [0.86, 0.84, 0.62, null, null, null, null],
];

const rowLabels = ['Morning', 'Afternoon', 'Evening', 'Night'];
const dayLabels = ['Jun 12', 'Jun 13', 'Jun 14', '—', '—', '—', '—'];

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
    <svg viewBox={`0 0 ${w} ${h}`} className="weekly-report__spark" role="img" aria-label="3-day sleep scores sparkline">
      <defs>
        <linearGradient id="weeklySleepFill" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.30" />
          <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.04" />
        </linearGradient>
      </defs>
      {[0, 1, 2, 3].map(i => {
        const y = padding + ((h - padding * 2) / 3) * i;
        return <line key={i} x1={padding} x2={w - padding} y1={y} y2={y} className="weekly-report__spark-grid" />;
      })}
      <path d={area} fill="url(#weeklySleepFill)" />
      <path d={line} className="weekly-report__spark-line weekly-report__spark-line--amber" />
      {points.map((point, index) => (
        <circle key={index} cx={point.x} cy={point.y} r={index === points.length - 1 ? 5 : 3.5}
          className={`weekly-report__spark-point ${index === points.length - 1 ? 'weekly-report__spark-point--alert' : ''}`} />
      ))}
    </svg>
  );
}

export default function WeeklyReportPage() {
  const toast = useToast();
  const avgSleep = (sleepScores.reduce((sum, value) => sum + value, 0) / sleepScores.length).toFixed(0);
  const belowBaseline = sleepScores.filter(score => score < 78).length;
  const attributionHighConfidence = 76;
  const attributionPaused = 24;
  const comparedToLastWeek = [
    { label: 'Sleep quality', value: '↓ 13%', tone: 'alert' },
    { label: 'Routine regularity', value: '↓ 11%', tone: 'slight' },
    { label: 'Safety events', value: '2 falls', tone: 'alert' },
  ];

  const reportRef = useRef(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleDownloadPDF = async () => {
    if (!reportRef.current || pdfLoading) return;
    setPdfLoading(true);
    toast('Generating PDF… please wait a moment.', 'success');
    try {
      const { default: html2canvas } = await import('html2canvas');
      const { default: jsPDF } = await import('jspdf');

      const element = reportRef.current;
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#f1f5f9',
        logging: false,
        scrollY: -window.scrollY,
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const imgWidth = pageWidth;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let position = 0;
      let remainingHeight = imgHeight;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      remainingHeight -= pageHeight;

      while (remainingHeight > 0) {
        position -= pageHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        remainingHeight -= pageHeight;
      }

      pdf.save('SightSense_Weekly_Report_July12-14.pdf');
      toast('PDF downloaded successfully!', 'success');
    } catch (err) {
      console.error('PDF generation failed:', err);
      toast('Failed to generate PDF. Please try again.', 'error');
    } finally {
      setPdfLoading(false);
    }
  };

  return (
    <div className="page-layout weekly-report">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>summarize</span>
          <div>
            <h1 className="page-layout__title">Weekly AI Summary</h1>
            <p className="page-layout__subtitle">Family-friendly overview for Mrs. Lakshmi Rao</p>
          </div>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleDownloadPDF}
          disabled={pdfLoading}
          style={{ minWidth: 148, opacity: pdfLoading ? 0.75 : 1 }}
        >
          {pdfLoading
            ? <><span className="material-icons icon-sm" style={{ animation: 'spin 1s linear infinite' }}>autorenew</span> Generating…</>
            : <><span className="material-icons icon-sm">download</span> Download PDF</>}
        </button>
      </div>

      <div className="page-layout__content weekly-report__content" ref={reportRef}>
        {/* Day indicator banner */}
        <div className="weekly-report__day-banner">
          <span className="material-icons" style={{ fontSize: 18, color: '#1a56db' }}>event_note</span>
          <div>
            <span className="weekly-report__day-banner-label">Day 4 of Monitoring</span>
          </div>
        </div>

        {/* Hero / At a Glance */}
        <section className="weekly-report__hero glass-card weekly-report__hero--alert">
          <span className="weekly-report__eyebrow weekly-report__eyebrow--alert">This week at a glance</span>
          <h2 className="weekly-report__headline">Two possible falls were detected on July 14 — please check in with Mom.</h2>
          <p className="weekly-report__lede">
            Open this report if you want a fast answer: the first two days were steady with normal sleep and no safety events.
            On July 14, the system flagged <strong>two possible fall events</strong> and a night of disrupted sleep.
            Confidence on both fall events is high; we recommend confirming with Mom directly.
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
                <span className="badge badge-attention">ATTENTION</span>
              </div>

              <div className="weekly-report__sleep-metrics">
                <div className="weekly-report__sleep-metric">
                  <span>Average duration</span>
                  <strong>6.4 hours</strong>
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

              <div className="weekly-report__spark-shell weekly-report__spark-shell--amber">
                <Sparkline data={sleepScores} />
              </div>

              <div className="weekly-report__sleep-days">
                {sleepNights.map(night => (
                  <div key={night.day} className={`weekly-report__sleep-day ${night.score < 60 ? 'weekly-report__sleep-day--alert' : ''}`}>
                    <span className="weekly-report__sleep-day-label">{night.day}</span>
                    <strong>{night.duration}</strong>
                    <span>{night.score}/100</span>
                    <em>{night.note}</em>
                  </div>
                ))}
              </div>

              <p className="weekly-report__interpretation">
                July 12–13 were steady, aligned with Mom's 7.3-hour baseline. On July 14, average duration dropped to 5.6h and quality fell to 52/100 — correlated with the two fall events that day. Average over the 3-day window is 6.4 hours (down from a 7.3-hour baseline over the first two days).
              </p>
            </div>

            {/* Fall Events callout card */}
            <div className="glass-card weekly-report__card">
              <div className="weekly-report__card-head">
                <div>
                  <h3 className="weekly-report__section-title">Fall Events — July 14</h3>
                  <p className="weekly-report__section-subtitle">Possible fall detections flagged by the system on July 14</p>
                </div>
                <span className="badge badge-danger">2 FALLS</span>
              </div>

              <div className="weekly-report__safety-summary weekly-report__safety-summary--alert">
                <strong>Two possible fall events were detected on July 14.</strong>
                <p>
                  Two events on the same day may indicate reduced stability rather than two unrelated incidents —
                  worth discussing with Mom or her physician.
                </p>
              </div>

              <div className="weekly-report__event-list">
                {fallEvents.map((event, i) => (
                  <article key={i} className="weekly-report__event weekly-report__event--fall">
                    <div className="weekly-report__event-top">
                      <strong>{event.time}</strong>
                      <span className="badge badge-danger">{event.tag} · {event.confidence}</span>
                    </div>
                    <div className="weekly-report__event-detail">{event.detail}</div>
                    <div className="weekly-report__event-meta">
                      <span>Confidence</span>
                      <strong>{event.confidence}</strong>
                    </div>
                    <div className="weekly-report__event-meta">
                      <span>Family notified</span>
                      <strong>Telegram · Immediate</strong>
                    </div>
                    <div className="weekly-report__event-followup">{event.followup}</div>
                  </article>
                ))}
              </div>
            </div>

            <div className="glass-card weekly-report__card">
              <div className="weekly-report__card-head">
                <div>
                  <h3 className="weekly-report__section-title">Safety events</h3>
                  <p className="weekly-report__section-subtitle">Falls, prolonged inactivity, and apnea events</p>
                </div>
                <span className="badge badge-danger">ELEVATED</span>
              </div>

              <div className="weekly-report__safety-summary weekly-report__safety-summary--alert">
                <strong>2 possible fall events detected on July 14.</strong>
                <p>Both events triggered immediate Telegram notifications. No apnea events were logged during this 3-day window. An extended low-activity period (~40 min) was observed after the second fall on July 14 at 19:47.</p>
              </div>

              <div className="weekly-report__event-list">
                {safetyEvents.map(event => (
                  <article key={event.time} className="weekly-report__event">
                    <div className="weekly-report__event-top">
                      <strong>{event.time}</strong>
                      <span className={`badge ${event.type === 'No events' ? 'badge-stable' : 'badge-danger'}`}>{event.type}</span>
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
                {dayLabels.map((day, i) => (
                  <div key={`${day}-${i}`} className={`weekly-report__routine-day ${day === '—' ? 'weekly-report__routine-day--inactive' : ''}`}>{day}</div>
                ))}
                {rowLabels.map((row, rowIndex) => (
                  <React.Fragment key={row}>
                    <div className="weekly-report__routine-row-label">{row}</div>
                    {routineHeatmap[rowIndex].map((value, colIndex) => {
                      if (value === null) {
                        return (
                          <div
                            key={`${row}-${colIndex}`}
                            className="weekly-report__routine-cell"
                            style={{ background: 'rgba(148,163,184,0.10)', border: '1px dashed rgba(148,163,184,0.2)' }}
                            title="Not monitored"
                          />
                        );
                      }
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
                July 12 and 13 showed consistent routine regularity across all time-of-day windows. July 14 shows a significant disruption across all periods, correlated with the two fall events that day. Columns marked — were not monitored in this 3-day report window.
              </p>
            </div>

            {/* Day-by-day breakdown table */}
            <div className="glass-card weekly-report__card">
              <div className="weekly-report__card-head">
                <div>
                  <h3 className="weekly-report__section-title">Day-by-day breakdown</h3>
                  <p className="weekly-report__section-subtitle">Sleep quality, fall events, and key notes per day</p>
                </div>
              </div>
              <div className="weekly-report__day-table-wrap">
                <table className="weekly-report__day-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Sleep Quality</th>
                      <th>Fall Events</th>
                      <th>Notes</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dayBreakdown.map((row) => (
                      <tr key={row.date} className={row.fallEvts > 0 ? 'weekly-report__day-table-row--alert' : ''}>
                        <td><strong>{row.date}</strong></td>
                        <td>{row.sleepQ}</td>
                        <td>
                          {row.fallEvts > 0
                            ? <span className="weekly-report__day-fall-badge">{row.fallEvts}</span>
                            : <span className="weekly-report__day-none">0</span>}
                        </td>
                        <td>{row.notes}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          <aside className="weekly-report__side">
            <div className="glass-card weekly-report__card weekly-report__card--compact">
              <h3 className="weekly-report__section-title">Attribution quality</h3>
              <p className="weekly-report__section-subtitle">How much of the data was confidently tied to Mom specifically</p>

              <div className="weekly-report__attribution-meter">
                <div className="weekly-report__attribution-meter-fill" style={{ width: `${attributionHighConfidence}%` }} />
              </div>
              <div className="weekly-report__attribution-values">
                <strong>{attributionHighConfidence}%</strong>
                <span>high-confidence attribution</span>
              </div>
              <div className="weekly-report__attribution-muted">
                {attributionPaused}% of the monitoring window had ambiguous or shared household activity — data from those periods was excluded from Mom's profile.
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

            <div className="glass-card weekly-report__action-card weekly-report__action-card--urgent">
              <span className="weekly-report__action-eyebrow">Recommended action</span>
              <p>
                Two high-confidence fall events on the same day may signal reduced stability. We recommend speaking with Mom directly and considering a physician check-in. If incidents recur, escalating to a physiotherapy assessment is advisable.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
