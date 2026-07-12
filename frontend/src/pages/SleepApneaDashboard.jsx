import React from 'react';
import './PageLayout.css';
import './SleepApneaDashboard.css';
import { useSensing } from '../hooks/SensingContext';

export default function SleepApneaDashboard() {
  const sensing = useSensing();
  const live = sensing.isConnected;
  const breathing = sensing.breathingRate;
  const heartRate = sensing.heartRate;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;
  const normalBreathing = breathing != null && breathing >= 12 && breathing <= 18;

  return (
    <div className="page-layout sleep-apnea-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#adc6ff' }}>bedtime</span>
          <div>
            <h1 className="page-layout__title">Sleep Apnea Dashboard</h1>
            <p className="page-layout__subtitle">Live respiration view from the backend websocket feed</p>
          </div>
        </div>
        <span className={`badge ${live ? 'badge-stable' : 'badge-warning'}`}>{live ? 'LIVE' : 'OFFLINE'}</span>
      </div>

      <div className="page-layout__content">
        <section className="sleep-apnea__hero glass-card">
          <div className="sleep-apnea__hero-copy">
            <span className="sleep-apnea__eyebrow">Live Summary</span>
            <h2 className="sleep-apnea__hero-title">{live ? 'Respiration stream connected' : 'Waiting for a live respiration stream'}</h2>
            <p className="sleep-apnea__hero-text">
              {live
                ? 'This page now reflects backend-provided respiration metrics only. No hardcoded event history is displayed.'
                : 'Connect the websocket backend to populate live respiration metrics.'}
            </p>
          </div>

          <div className="sleep-apnea__hero-metrics">
            {[
              { label: 'Breathing rate', value: breathing != null ? `${breathing.toFixed(1)} brpm` : '--' },
              { label: 'Heart rate', value: heartRate != null ? `${Math.round(heartRate)} bpm` : '--' },
              { label: 'Confidence', value: confidence != null ? `${confidence}%` : '--' },
              { label: 'Status', value: live ? (normalBreathing ? 'NORMAL' : 'LIVE') : 'OFFLINE' },
            ].map((item) => (
              <div key={item.label} className="sleep-apnea__hero-metric">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="sleep-apnea__kpis">
          {[
            { label: 'Signal quality', value: confidence != null ? `${confidence}/100` : '--', color: '#4edea3', status: live ? 'stable' : 'warning' },
            { label: 'Respiration band', value: normalBreathing ? 'Normal' : live ? 'Review' : '--', color: '#F59E0B', status: live ? 'warning' : 'warning' },
            { label: 'Occupancy', value: sensing.estimatedPersons != null ? `${sensing.estimatedPersons}` : '--', color: '#3B82F6', status: 'stable' },
            { label: 'Feed', value: live ? 'Connected' : 'Offline', color: live ? '#4edea3' : '#EF4444', status: live ? 'stable' : 'critical' },
          ].map((kpi) => (
            <div key={kpi.label} className="sleep-apnea__kpi glass-card" style={{ borderTop: `4px solid ${kpi.color}` }}>
              <span className="sleep-apnea__kpi-label">{kpi.label}</span>
              <span className="sleep-apnea__kpi-value" style={{ color: kpi.color }}>{kpi.value}</span>
              <span className={`badge badge-${kpi.status}`}>{kpi.status.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div className="sleep-apnea__grid">
          <div className="sleep-apnea__main">
            <div className="sleep-apnea__panel sleep-apnea__panel--chart glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">Respiration Snapshot</h3>
                  <p className="sleep-apnea__section-subtitle">Live backend-only metric, no synthetic curve</p>
                </div>
              </div>
              <div style={{ padding: '24px 0', textAlign: 'center', color: 'var(--on-surface-variant)' }}>
                <div style={{ fontSize: 44, fontWeight: 800, color: '#4edea3' }}>{breathing != null ? breathing.toFixed(1) : '--'}</div>
                <div style={{ fontSize: 12, marginTop: 8 }}>{breathing != null ? 'brpm' : 'No respiration stream yet'}</div>
              </div>
            </div>

            <div className="sleep-apnea__panel glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">What Changed</h3>
                  <p className="sleep-apnea__section-subtitle">Only live feed-backed notes are shown here</p>
                </div>
              </div>
              <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
                {live
                  ? 'Current respiration, confidence, and occupancy values are sourced from the websocket backend. Historical apnea events are intentionally omitted until a real recording store is connected.'
                  : 'No live apnea records are available because the backend is offline.'}
              </div>
            </div>
          </div>

          <aside className="sleep-apnea__side">
            <div className="sleep-apnea__panel glass-card">
              <div className="sleep-apnea__panel-head">
                <div>
                  <h3 className="sleep-apnea__section-title">Care Notes</h3>
                  <p className="sleep-apnea__section-subtitle">Generated from live stream state</p>
                </div>
              </div>
              <div className="sleep-apnea__notes">
                {[
                  { key: 'Stream status', value: live ? 'Live' : 'Offline' },
                  { key: 'Breathing', value: breathing != null ? `${breathing.toFixed(1)} brpm` : '--' },
                  { key: 'Confidence', value: confidence != null ? `${confidence}%` : '--' },
                  { key: 'Heart rate', value: heartRate != null ? `${Math.round(heartRate)} bpm` : '--' },
                ].map((item) => (
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
