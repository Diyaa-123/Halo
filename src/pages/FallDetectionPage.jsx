import React, { useState } from 'react';
import './PageLayout.css';
import './FallDetectionPage.css';
import { useToast } from '../components/layout/ToastContext';

const fallEvents = [
  { time: '14:41', location: 'Bathroom', riskScore: 92, confidence: '97%', responseTime: '2m 14s', status: 'resolved', note: 'Slip-like motion on wet floor' },
  { time: '09:22', location: 'Corridor', riskScore: 78, confidence: '89%', responseTime: '3m 45s', status: 'resolved', note: 'Near-fall while turning at corner' },
  { time: '22:08', location: 'Bedroom', riskScore: 64, confidence: '84%', responseTime: '1m 39s', status: 'monitored', note: 'Bed exit with slow recovery' },
];

const workflow = ['Fall Detected', 'Nurse Alert', 'Acknowledged', 'Response Logged', 'Case Closed'];

export default function FallDetectionPage() {
  const toast = useToast();
  const [activeEvent, setActiveEvent] = useState(0);
  const [timelinePos, setTimelinePos] = useState(75);
  const ev = fallEvents[activeEvent];

  return (
    <div className="page-layout fall-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#EF4444' }}>emergency</span>
          <div>
            <h1 className="page-layout__title">Fall Detection Module</h1>
            <p className="page-layout__subtitle">Event replay and incident analysis for Mr. Raghav Iyer</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {fallEvents.map((event, index) => (
            <button
              key={event.time}
              className={`page-layout__filter-btn ${activeEvent === index ? 'page-layout__filter-btn--active' : ''}`}
              onClick={() => setActiveEvent(index)}
            >
              {event.time} · {event.location}
            </button>
          ))}
        </div>
      </div>

      <div className="page-layout__content">
        <section className="fall-page__hero glass-card">
          <div className="fall-page__hero-copy">
            <span className="fall-page__eyebrow">Incident Replay</span>
            <h2 className="fall-page__hero-title">Bathroom slip with fast recovery and no injury indicators</h2>
            <p className="fall-page__hero-text">
              The current event shows a brief destabilization in the bathroom, followed by a quick assisted recovery. Motion pattern suggests a slip rather than a full impact.
            </p>
          </div>

          <div className="fall-page__hero-metrics">
            {[
              { label: 'Current risk', value: `${ev.riskScore}/100` },
              { label: 'AI confidence', value: ev.confidence },
              { label: 'Response time', value: ev.responseTime },
              { label: 'Status', value: ev.status.toUpperCase() },
            ].map(item => (
              <div key={item.label} className="fall-page__hero-metric">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="fall-page__kpis">
          {[
            { label: 'Total incidents', value: '3', color: '#EF4444' },
            { label: 'Bathroom events', value: '1', color: '#F59E0B' },
            { label: 'Avg response', value: '2m 33s', color: '#4edea3' },
            { label: 'Safety score', value: '81/100', color: '#3B82F6' },
          ].map(kpi => (
            <div key={kpi.label} className="fall-page__kpi glass-card" style={{ borderTop: `4px solid ${kpi.color}` }}>
              <div className="fall-page__kpi-label">{kpi.label}</div>
              <div className="fall-page__kpi-value" style={{ color: kpi.color }}>{kpi.value}</div>
            </div>
          ))}
        </div>

        <div className="fall-page__layout">
          <div className="fall-page__main">
            <div className="glass-card fall-card">
              <div className="fall-card__header">
                <div>
                  <h3 className="fall-card__title">Digital Twin Fall Posture Replay</h3>
                  <p className="fall-card__subtitle">Simplified fall silhouette with event scrubber</p>
                </div>
                <span className="badge badge-warning">MONITORED</span>
              </div>

              <div className="fall-card__visual">
                <svg viewBox="0 0 160 260" className="fall-card__svg" aria-label="Fall posture replay">
                  <defs>
                    <radialGradient id="fallBodyGrad" cx="50%" cy="50%" r="60%">
                      <stop offset="0%" stopColor="#EF4444" stopOpacity="0.5" />
                      <stop offset="100%" stopColor="#EF4444" stopOpacity="0.08" />
                    </radialGradient>
                  </defs>
                  <ellipse cx="80" cy="228" rx="56" ry="12" fill="rgba(239,68,68,0.14)" />
                  <g transform="rotate(-82 80 140)">
                    <circle cx="80" cy="30" r="20" fill="url(#fallBodyGrad)" stroke="#EF4444" strokeWidth="1.5" />
                    <rect x="69" y="50" width="22" height="14" rx="4" fill="url(#fallBodyGrad)" stroke="#EF4444" strokeWidth="1" />
                    <path d="M48 64 Q42 86 44 110 L116 110 Q118 86 112 64 Z" fill="url(#fallBodyGrad)" stroke="#EF4444" strokeWidth="1.5" />
                    <path d="M48 70 Q32 90 28 120" stroke="#EF4444" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.72" />
                    <path d="M112 70 Q128 90 132 120" stroke="#EF4444" strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.72" />
                    <path d="M52 112 Q48 132 50 146 L110 146 Q112 132 108 112 Z" fill="url(#fallBodyGrad)" stroke="#EF4444" strokeWidth="1" />
                    <path d="M62 146 Q56 178 54 204" stroke="#EF4444" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.72" />
                    <path d="M98 146 Q104 178 106 204" stroke="#EF4444" strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.72" />
                  </g>
                  <rect x="8" y="8" width="144" height="244" rx="14" fill="none" stroke="#EF4444" strokeDasharray="8 5" opacity="0.45" />
                </svg>
              </div>

              <div className="fall-card__scrubber">
                <div className="fall-card__scrubber-labels">
                  <span>Event start</span>
                  <span>Event end</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={timelinePos}
                  onChange={e => setTimelinePos(e.target.value)}
                  className="fall-card__range"
                />
              </div>
            </div>

            <div className="glass-card fall-card">
              <div className="fall-card__header">
                <div>
                  <h3 className="fall-card__title">Response Workflow</h3>
                  <p className="fall-card__subtitle">Operational chain from trigger to closure</p>
                </div>
              </div>
              <div className="fall-workflow">
                {workflow.map((step, index) => (
                  <React.Fragment key={step}>
                    <div className={`fall-workflow__step ${index <= 3 ? 'fall-workflow__step--done' : ''}`}>
                      <span className="material-icons">{index <= 3 ? 'check_circle' : 'radio_button_unchecked'}</span>
                      <strong>{step}</strong>
                    </div>
                    {index < workflow.length - 1 && <div className={`fall-workflow__connector ${index < 3 ? 'fall-workflow__connector--done' : ''}`} />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          </div>

          <aside className="fall-page__side">
            <div className="glass-card fall-card fall-card--tight">
              <h3 className="fall-card__title">Incident Details</h3>
              <div className="fall-details">
                {[
                  { label: 'Incident time', value: ev.time, icon: 'schedule' },
                  { label: 'Location', value: ev.location, icon: 'place' },
                  { label: 'Risk score', value: `${ev.riskScore}/100`, icon: 'monitor_heart' },
                  { label: 'Confidence', value: ev.confidence, icon: 'psychology' },
                  { label: 'Response time', value: ev.responseTime, icon: 'timer' },
                  { label: 'Status', value: ev.status.toUpperCase(), icon: 'check_circle' },
                ].map(item => (
                  <div key={item.label} className="fall-details__row">
                    <div className="fall-details__key">
                      <span className="material-icons">{item.icon}</span>
                      <span>{item.label}</span>
                    </div>
                    <strong>{item.value}</strong>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card fall-card fall-card--tight">
              <h3 className="fall-card__title">AI Recommendation</h3>
              <p className="fall-card__text">
                Add bathroom grab bars, keep the floor dry, and expand night lighting coverage near the turning path. Continue observing bathroom entry within one hour of sleep onset.
              </p>
              <div className="fall-card__actions">
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => toast('Opening Care Plan Editor...', 'info')}>
                  <span className="material-icons icon-sm">assignment</span>
                  Create Care Plan
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => toast('Opening Sharing Options...', 'info')}>
                  <span className="material-icons icon-sm">share</span>
                  Share Report
                </button>
              </div>
            </div>

            <div className="glass-card fall-card fall-card--tight">
              <h3 className="fall-card__title">Selected Event Note</h3>
              <p className="fall-card__text">
                {ev.time} at {ev.location}: {ev.note}. Motion settled without further escalation and the nurse note marked the event as resolved.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
