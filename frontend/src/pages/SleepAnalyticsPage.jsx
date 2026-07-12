import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './PageLayout.css';
import './SleepAnalyticsPage.css';
import { useSensing } from '../hooks/SensingContext';

export default function SleepAnalyticsPage() {
  const navigate = useNavigate();
  const sensing = useSensing();
  const [activeFilter, setActiveFilter] = useState('This Week');
  const live = sensing.isConnected;
  const breathing = sensing.breathingRate;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep & Vitals Analysis</h1>
            <p className="page-layout__subtitle">Live-only sleep overview from the backend websocket feed</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {['This Week', 'Last Week'].map((label) => (
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
            { label: 'Sleep Apnea Dashboard', icon: 'bedtime', path: '/sleep-apnea', color: '#adc6ff', desc: 'Live respiration status only' },
            { label: 'Eating Monitor', icon: 'restaurant', path: '/eating', color: '#4edea3', desc: 'Live behavior context only' },
          ].map((m) => (
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
            { label: 'Live Breathing', value: breathing != null ? breathing.toFixed(1) : '--', unit: 'brpm', color: 'var(--primary)' },
            { label: 'Confidence', value: confidence != null ? `${confidence}` : '--', unit: '%', color: 'var(--secondary)' },
            { label: 'Occupancy', value: sensing.estimatedPersons != null ? `${sensing.estimatedPersons}` : '--', unit: 'people', color: 'var(--warning-amber)' },
            { label: 'Feed Status', value: live ? 'Connected' : 'Offline', unit: '', color: live ? 'var(--primary)' : '#EF4444' },
          ].map((m) => (
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
            <div className="sleep-chart glass-card">
              <div className="sleep-chart__header">
                <div>
                  <h3 className="sleep-chart__title">Live Respiration Snapshot</h3>
                  <p className="sleep-chart__subtitle">No synthetic weekly breathing curve is rendered here</p>
                </div>
                <div className="sleep-chart__chips">
                  <span className="sleep-chip sleep-chip--stable">{live ? 'LIVE' : 'OFFLINE'}</span>
                  <span className="sleep-chip sleep-chip--warning">{breathing != null ? `${breathing.toFixed(1)} brpm` : '--'}</span>
                  <span className="sleep-chip sleep-chip--muted">Historical store not connected</span>
                </div>
              </div>
              <div style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--outline)', fontSize: 12, textAlign: 'center', padding: 20 }}>
                {live
                  ? 'This page now shows only live respiration and backend-derived status. Connect a real historical database to render weekly charts.'
                  : 'Connect the websocket backend to view live sleep metrics.'}
              </div>
            </div>

            <div className="glass-card sleep-card">
              <div className="sleep-card__header">
                <div>
                  <h3 className="sleep-card__title">Weekly Trend</h3>
                  <p className="sleep-card__subtitle">Disabled until a real sleep history source is added</p>
                </div>
                <span className="badge badge-warning">{activeFilter}</span>
              </div>
              <div style={{ fontSize: 12, color: 'var(--outline)', lineHeight: 1.6 }}>
                Hardcoded sleep durations, apnea dips, and staged curves were removed to avoid showing false results. Attach a real telemetry store before re-enabling this view.
              </div>
            </div>
          </div>

          <div className="sleep-page__side">
            <div className="glass-card sleep-card sleep-card--tight">
              <h3 className="sleep-card__title">AI Sleep Insights</h3>
              <div className="sleep-insight">
                <span className="material-icons" style={{ color: 'var(--primary)' }}>psychology</span>
                <div>
                  <p className="sleep-insight__title">Live feed only</p>
                  <p className="sleep-insight__body">
                    {live
                      ? 'Respiration, confidence, and occupancy come directly from the backend websocket feed.'
                      : 'No live sleep data is available until the backend connects.'}
                  </p>
                </div>
              </div>
            </div>

            <div className="glass-card sleep-card sleep-card--tight">
              <h3 className="sleep-card__title">Night Summary</h3>
              <div className="sleep-summary">
                {[
                  { key: 'Stream', value: live ? 'Live' : 'Offline' },
                  { key: 'Breathing', value: breathing != null ? `${breathing.toFixed(1)} brpm` : '--' },
                  { key: 'Confidence', value: confidence != null ? `${confidence}%` : '--' },
                  { key: 'Occupancy', value: sensing.estimatedPersons != null ? `${sensing.estimatedPersons}` : '--' },
                ].map((item) => (
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
