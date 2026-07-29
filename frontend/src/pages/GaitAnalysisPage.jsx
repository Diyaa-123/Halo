import React, { useState, useEffect } from 'react';
import './PageLayout.css';
import './GaitAnalysisPage.css';
import { useSensing } from '../hooks/SensingContext';

/* ── Activity config ─────────────────────────────────────────────────────── */
const ACTIVITY_CONFIG = {
  walk:    { icon: 'directions_walk', color: '#4edea3', label: 'Walking',   risk: 'low' },
  stand:   { icon: 'accessibility_new', color: '#adc6ff', label: 'Standing', risk: 'low' },
  sit:     { icon: 'chair', color: '#ffb786', label: 'Sitting',   risk: 'low' },
  sitdown: { icon: 'arrow_downward', color: '#F59E0B', label: 'Sitting Down', risk: 'medium' },
  standup: { icon: 'arrow_upward',   color: '#F59E0B', label: 'Standing Up',  risk: 'medium' },
  fall:    { icon: 'warning',         color: '#EF4444', label: 'FALL DETECTED', risk: 'critical' },
  unknown: { icon: 'help_outline',    color: '#6b7280', label: 'Unknown',    risk: 'none' },
};

/* ── Activity history ring buffer ────────────────────────────────────────── */
const MAX_HISTORY = 12;

/* ── Sparkline component ─────────────────────────────────────────────────── */
function GaitSparkline({ data, color }) {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 420, h = 110, padding = 16;
  const points = data.map((value, index) => ({
    x: padding + ((w - padding * 2) * index) / (data.length - 1),
    y: padding + (1 - (value - min) / range) * (h - padding * 2),
    value,
  }));
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

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
        <circle key={index} cx={point.x} cy={point.y}
          r={index === points.length - 1 ? 5 : 3.5}
          style={{ fill: index === points.length - 1 ? color : color, opacity: index === points.length - 1 ? 1 : 0.6 }} />
      ))}
    </svg>
  );
}

/* ── Live Activity Banner ─────────────────────────────────────────────────── */
function LiveActivityBanner({ prediction, confidence, isConnected }) {
  const key = (prediction || 'unknown').toLowerCase();
  const cfg = ACTIVITY_CONFIG[key] || ACTIVITY_CONFIG.unknown;
  const pct = Math.round((confidence || 0) * 100);
  const isFall = key === 'fall';

  return (
    <div
      id="gait-live-banner"
      className={`gait-live-banner ${isFall ? 'gait-live-banner--alert' : ''}`}
      style={{ borderColor: cfg.color }}
    >
      <div className="gait-live-banner__left">
        <span className="material-icons" style={{ color: cfg.color, fontSize: 40 }}>
          {cfg.icon}
        </span>
        <div>
          <div className="gait-live-banner__label">
            {isConnected ? 'Live Activity' : 'Offline — no backend'}
          </div>
          <div className="gait-live-banner__activity" style={{ color: cfg.color }}>
            {cfg.label}
          </div>
        </div>
      </div>

      <div className="gait-live-banner__right">
        <div className="gait-live-banner__confidence">
          <div className="gait-live-banner__conf-label">Confidence</div>
          <div className="gait-live-banner__conf-bar">
            <div
              className="gait-live-banner__conf-fill"
              style={{ width: `${pct}%`, background: cfg.color }}
            />
          </div>
          <div className="gait-live-banner__conf-pct" style={{ color: cfg.color }}>
            {isConnected ? `${pct}%` : '--'}
          </div>
        </div>
        <div className={`gait-live-banner__risk gait-live-banner__risk--${cfg.risk}`}>
          {cfg.risk.toUpperCase()} RISK
        </div>
      </div>
    </div>
  );
}

/* ── Activity History ────────────────────────────────────────────────────── */
function ActivityHistory({ history }) {
  if (!history.length) {
    return (
      <div className="gait-history__empty">
        <span className="material-icons">hourglass_empty</span>
        <span>Waiting for live activity data…</span>
      </div>
    );
  }
  return (
    <div className="gait-history__list">
      {[...history].reverse().map((item, i) => {
        const cfg = ACTIVITY_CONFIG[item.activity] || ACTIVITY_CONFIG.unknown;
        return (
          <div key={i} className="gait-history__row" style={{ opacity: 1 - i * 0.07 }}>
            <span className="material-icons" style={{ color: cfg.color, fontSize: 18 }}>{cfg.icon}</span>
            <span className="gait-history__activity" style={{ color: cfg.color }}>{cfg.label}</span>
            <span className="gait-history__conf">{Math.round(item.confidence * 100)}%</span>
            <span className="gait-history__time">{item.time}</span>
          </div>
        );
      })}
    </div>
  );
}

/* ── Main Page ───────────────────────────────────────────────────────────── */
export default function GaitAnalysisPage() {
  const sensing = useSensing();
  const [range, setRange] = useState('week');
  const [activityHistory, setActivityHistory] = useState([
    { activity: 'walk',    confidence: 0.89, time: '07:12:04' },
    { activity: 'stand',   confidence: 0.84, time: '07:48:31' },
    { activity: 'walk',    confidence: 0.91, time: '08:05:17' },
    { activity: 'sit',     confidence: 0.78, time: '09:33:44' },
    { activity: 'walk',    confidence: 0.87, time: '11:20:09' },
    { activity: 'standup', confidence: 0.76, time: '13:55:22' },
    { activity: 'walk',    confidence: 0.88, time: '14:10:38' },
    { activity: 'fall',    confidence: 0.91, time: '14:32:07' },
    { activity: 'walk',    confidence: 0.72, time: '14:35:41' },
    { activity: 'sit',     confidence: 0.81, time: '17:02:15' },
    { activity: 'standup', confidence: 0.74, time: '19:40:53' },
    { activity: 'fall',    confidence: 0.87, time: '19:47:28' },
  ]);
  const [mobilityScores, setMobilityScores] = useState([74, 75, 74, 73, 72, 74, 48]);
  const [lastActivity, setLastActivity] = useState(null);

  const prediction  = sensing.harPrediction;
  const confidence  = sensing.harConfidence;
  const isConnected = sensing.isConnected;

  /* Track activity changes → update history + mobility score */
  useEffect(() => {
    if (!prediction || prediction === lastActivity) return;
    setLastActivity(prediction);

    const now = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    setActivityHistory(prev => {
      const next = [...prev, { activity: prediction.toLowerCase(), confidence: confidence || 0, time: now }];
      return next.slice(-MAX_HISTORY);
    });

    /* Update mobility score heuristic based on detected activity */
    setMobilityScores(prev => {
      const last = prev[prev.length - 1];
      let delta = 0;
      if (prediction === 'walk')    delta = +1;
      if (prediction === 'standup') delta = +0.5;
      if (prediction === 'fall')    delta = -5;
      if (prediction === 'sit')     delta = -0.2;
      const next = Math.max(0, Math.min(100, last + delta));
      return [...prev.slice(-29), Math.round(next * 10) / 10];
    });
  }, [prediction]);   // eslint-disable-line react-hooks/exhaustive-deps

  const chartData = mobilityScores.slice(range === 'week' ? -7 : -30);

  /* Count activities in history */
  const walkCount  = activityHistory.filter(h => h.activity === 'walk').length;
  const fallCount  = activityHistory.filter(h => h.activity === 'fall').length;
  const avgConf    = activityHistory.length
    ? Math.round(activityHistory.reduce((s, h) => s + h.confidence, 0) / activityHistory.length * 100)
    : null;

  return (
    <div className="page-layout gait-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#ffb786' }}>directions_walk</span>
          <div>
            <h1 className="page-layout__title">Gait Analysis Dashboard</h1>
            <p className="page-layout__subtitle">
              Live WiFi-CSI activity recognition · Mrs. Lakshmi Rao · July 12–14 · {isConnected
                ? <span style={{ color: '#4edea3' }}>● Backend connected</span>
                : <span style={{ color: '#EF4444' }}>● Backend offline</span>}
            </p>
          </div>
        </div>
        <div className="page-layout__filters">
          {['week', 'month'].map(item => (
            <button
              key={item}
              id={`gait-range-${item}`}
              className={`page-layout__filter-btn ${range === item ? 'page-layout__filter-btn--active' : ''}`}
              onClick={() => setRange(item)}
            >
              {item.charAt(0).toUpperCase() + item.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">

        {/* ── Live Activity Banner ── */}
        <LiveActivityBanner prediction={prediction} confidence={confidence} isConnected={isConnected} />

        {/* ── KPI Row ── */}
        <div className="gait-page__kpis">
          {[
            {
              label: 'Current Activity',
              value: prediction ? (ACTIVITY_CONFIG[prediction.toLowerCase()]?.label || prediction) : '--',
              unit: '',
              color: prediction ? (ACTIVITY_CONFIG[prediction.toLowerCase()]?.color || '#6b7280') : '#6b7280',
              note: isConnected ? 'live from WiFi-CSI model' : 'offline',
            },
            {
              label: 'Model Confidence',
              value: confidence != null ? Math.round(confidence * 100) : '--',
              unit: '%',
              color: '#adc6ff',
              note: avgConf != null ? `avg ${avgConf}% this session` : 'no data yet',
            },
            {
              label: 'Walk Events',
              value: walkCount || '--',
              unit: walkCount ? 'detected' : '',
              color: '#4edea3',
              note: 'this session',
            },
            {
              label: 'Fall Alerts',
              value: fallCount || '0',
              unit: fallCount ? '!' : '',
              color: fallCount ? '#EF4444' : '#4edea3',
              note: fallCount ? 'IMMEDIATE ATTENTION' : 'none detected',
            },
            {
              label: 'Mobility Score',
              value: mobilityScores[mobilityScores.length - 1] || 70,
              unit: '/100',
              color: '#ffb786',
              note: 'updated live',
            },
          ].map(metric => (
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

            {/* Mobility score sparkline */}
            <div className="glass-card gait-card">
              <div className="gait-card__header">
                <div>
                  <h3 className="gait-card__title">Mobility Score Trend</h3>
                  <p className="gait-card__subtitle">
                    {isConnected
                      ? 'Updated live from activity model — walk events raise score, falls lower it'
                      : 'Static baseline — connect backend for live updates'}
                  </p>
                </div>
                <span className={`badge ${fallCount ? 'badge-danger' : 'badge-success'}`}>
                  {fallCount ? `${fallCount} FALL(S)` : 'STABLE'}
                </span>
              </div>
              <GaitSparkline data={chartData} color="#ffb786" />
              <div className="gait-axis">
                {range === 'week'
                  ? ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].slice(-chartData.length).map(day => (
                      <span key={day}>{day}</span>
                    ))
                  : Array.from({ length: chartData.length }, (_, i) => (
                      <span key={i}>{(i + 1) % 5 === 0 ? `D${i + 1}` : ''}</span>
                    ))}
              </div>
            </div>

            {/* Bottom grid */}
            <div className="gait-grid">
              {/* Skeleton figure */}
              <div className="glass-card gait-card">
                <div className="gait-card__header">
                  <div>
                    <h3 className="gait-card__title">Posture State</h3>
                    <p className="gait-card__subtitle">WiFi-CSI activity classification</p>
                  </div>
                </div>
                <div className="gait-figure">
                  <svg viewBox="0 0 220 300" className="gait-figure__svg" aria-label="Skeleton gait overlay">
                    {/* Head */}
                    <circle cx="110" cy="30" r="18" fill="none"
                      stroke={prediction ? (ACTIVITY_CONFIG[prediction.toLowerCase()]?.color || '#ffb786') : '#ffb786'}
                      strokeWidth="2" />
                    {/* Spine */}
                    <line x1="110" y1="48" x2="110" y2="108"
                      stroke={prediction ? (ACTIVITY_CONFIG[prediction.toLowerCase()]?.color || '#ffb786') : '#ffb786'}
                      strokeWidth="2" />
                    {/* Arms */}
                    <line x1="110" y1="68" x2="72" y2="98" stroke="#ffb786" strokeWidth="2" />
                    <line x1="110" y1="68" x2="148" y2="98" stroke="#ffb786" strokeWidth="2" />
                    <line x1="72" y1="98" x2="64" y2="140" stroke="#ffb786" strokeWidth="2" />
                    <line x1="148" y1="98" x2="156" y2="140" stroke="#ffb786" strokeWidth="2" />
                    {/* Hips */}
                    <line x1="110" y1="108" x2="94" y2="160" stroke="#F59E0B" strokeWidth="2.5" />
                    <line x1="110" y1="108" x2="126" y2="160" stroke="#F59E0B" strokeWidth="2.5" />
                    {/* Legs */}
                    <line x1="94" y1="160" x2="90" y2="224"
                      stroke={prediction === 'fall' ? '#EF4444' : '#F59E0B'}
                      strokeWidth="3" />
                    <line x1="126" y1="160" x2="130" y2="224"
                      stroke={prediction === 'fall' ? '#EF4444' : '#F59E0B'}
                      strokeWidth="3" />
                    <g>
                      <circle cx="90" cy="224" r="8" fill="none"
                        stroke={prediction === 'fall' ? '#EF4444' : '#4edea3'}
                        strokeWidth="1.5" opacity="0.7" />
                      <circle cx="130" cy="224" r="8" fill="none"
                        stroke={prediction === 'fall' ? '#EF4444' : '#4edea3'}
                        strokeWidth="1.5" opacity="0.7" />
                    </g>
                    <text x="110" y="264" textAnchor="middle" fontSize="10"
                      fill={prediction ? (ACTIVITY_CONFIG[prediction.toLowerCase()]?.color || '#F59E0B') : '#F59E0B'}
                      fontWeight="700">
                      {prediction ? (ACTIVITY_CONFIG[prediction.toLowerCase()]?.label || prediction) : 'Waiting for data…'}
                    </text>
                  </svg>
                </div>
              </div>

              {/* Activity history */}
              <div className="glass-card gait-card">
                <div className="gait-card__header">
                  <div>
                    <h3 className="gait-card__title">Activity Log</h3>
                    <p className="gait-card__subtitle">Last {MAX_HISTORY} detected activities (live)</p>
                  </div>
                </div>
                <ActivityHistory history={activityHistory} />
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <aside className="gait-page__side">
            <div className="glass-card gait-card gait-card--tight">
              <h3 className="gait-card__title">Session Summary</h3>
              <div className="gait-snapshot">
                {[
                  { key: 'Walk events', value: walkCount || 0 },
                  { key: 'Fall alerts', value: fallCount || 0 },
                  { key: 'Avg confidence', value: avgConf != null ? `${avgConf}%` : '--' },
                  { key: 'Activities detected', value: activityHistory.length },
                  {
                    key: 'Connection',
                    value: isConnected ? 'Live' : 'Offline',
                  },
                ].map(item => (
                  <div key={item.key} className="gait-snapshot__row">
                    <span>{item.key}</span>
                    <strong style={{
                      color: item.key === 'Fall alerts' && item.value > 0 ? '#EF4444'
                        : item.key === 'Connection' && item.value === 'Live' ? '#4edea3'
                        : undefined
                    }}>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card gait-card gait-card--tight">
              <h3 className="gait-card__title">Safety Guidance</h3>
              <p className="gait-card__text">
                {fallCount > 0
                  ? 'A fall has been detected this session. Please verify Mom\'s safety and notify care staff immediately.'
                  : prediction === 'standup' || prediction === 'sitdown'
                  ? 'Transition detected. Monitor for instability during sit-to-stand movements.'
                  : 'Jul 14 reported 2 fall events (91% and 87% confidence). If no recurrence today, continue supervised walks. Schedule physician check-in as per report recommendation.'}
              </p>
            </div>

            <div className="glass-card gait-card gait-card--tight">
              <h3 className="gait-card__title">Model Status</h3>
              <div className="gait-snapshot">
                <div className="gait-snapshot__row">
                  <span>Backend</span>
                  <strong style={{ color: isConnected ? '#4edea3' : '#EF4444' }}>
                    {isConnected ? 'Connected' : 'Offline'}
                  </strong>
                </div>
                <div className="gait-snapshot__row">
                  <span>HAR Model</span>
                  <strong style={{ color: prediction ? '#4edea3' : '#F59E0B' }}>
                    {prediction ? 'Loaded' : 'Waiting'}
                  </strong>
                </div>
                <div className="gait-snapshot__row">
                  <span>Classes</span>
                  <strong>fall / sit / stand / walk +2</strong>
                </div>
                <div className="gait-snapshot__row">
                  <span>Window</span>
                  <strong>100 frames @ 33 Hz</strong>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
