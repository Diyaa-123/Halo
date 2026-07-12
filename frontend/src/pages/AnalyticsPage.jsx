import React, { useState } from 'react';
import './PageLayout.css';
import './AnalyticsPage.css';
import { useSensing } from '../hooks/SensingContext';

export default function AnalyticsPage() {
  const [filter, setFilter] = useState('24h');
  const sensing = useSensing();
  const live = sensing.isConnected;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;
  const breathing = sensing.breathingRate;
  const heartRate = sensing.heartRate;
  const occupancy = sensing.estimatedPersons ?? null;

  const filters = ['24h', '7d', '30d', '90d'];

  return (
    <div className="page-layout analytics-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>analytics</span>
          <div>
            <h1 className="page-layout__title">Analytics Overview</h1>
            <p className="page-layout__subtitle">Backend-driven summary with no synthetic clinical history</p>
          </div>
        </div>
        <div className="page-layout__filters">
          {filters.map((item) => (
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
            <span className="analytics-hero__eyebrow">Live Summary</span>
            <h2 className="analytics-hero__title">{live ? 'Signals are streaming from the backend' : 'No live backend feed detected'}</h2>
            <p className="analytics-hero__text">
              {live
                ? 'Analytics values are derived from current websocket metrics only. Historical charts remain disabled until a real data store is connected.'
                : 'Connect the websocket backend to populate analytics snapshots.'}
            </p>
          </div>

          <div className="analytics-hero__stats">
            {[
              { label: 'Confidence', value: confidence != null ? `${confidence}%` : '--' },
              { label: 'Breathing', value: breathing != null ? `${breathing.toFixed(1)} BPM` : '--' },
              { label: 'Heart rate', value: heartRate != null ? `${Math.round(heartRate)} BPM` : '--' },
              { label: 'Occupancy', value: occupancy != null ? `${occupancy}` : '--' },
            ].map((item) => (
              <div key={item.label} className="analytics-hero__stat">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="analytics-kpi-grid">
          {[
            { label: 'Feed Status', value: live ? 'Live' : 'Offline', unit: '', trend: live ? '+1' : '0', color: live ? '#4edea3' : '#EF4444' },
            { label: 'Confidence', value: confidence != null ? `${confidence}` : '--', unit: '%', trend: confidence != null ? 'live' : '0', color: '#adc6ff' },
            { label: 'Breathing', value: breathing != null ? breathing.toFixed(1) : '--', unit: 'BPM', trend: 'live', color: '#F59E0B' },
            { label: 'Occupancy', value: occupancy != null ? `${occupancy}` : '--', unit: 'people', trend: 'live', color: '#ffb786' },
          ].map((kpi) => (
            <div key={kpi.label} className="glass-card analytics-kpi" style={{ borderTop: `4px solid ${kpi.color}` }}>
              <div className="analytics-kpi__label">{kpi.label}</div>
              <div className="analytics-kpi__value-row">
                <span className="analytics-kpi__value" style={{ color: kpi.color }}>{kpi.value}</span>
                <span className="analytics-kpi__unit">{kpi.unit}</span>
              </div>
              <div className="analytics-kpi__trend">{kpi.trend}</div>
            </div>
          ))}
        </div>

        <div className="analytics-grid">
          <div className="glass-card analytics-chart">
            <div className="analytics-chart__header">
              <div className="analytics-chart__title-row">
                <span className="material-icons" style={{ color: '#4edea3', fontSize: 16 }}>monitor_heart</span>
                <span className="analytics-chart__title">Live Respiration</span>
              </div>
              <span className={`badge ${live ? 'badge-stable' : 'badge-warning'}`}>{live ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <div className="analytics-chart__value">
              <span style={{ color: '#4edea3' }}>{breathing != null ? breathing.toFixed(1) : '--'}</span>
              <small>BPM</small>
            </div>
            <p style={{ color: 'var(--outline)', fontSize: 12, lineHeight: 1.6 }}>
              Live-only metric. No synthetic sparkline is shown until recorded telemetry exists.
            </p>
          </div>

          <div className="glass-card analytics-chart">
            <div className="analytics-chart__header">
              <div className="analytics-chart__title-row">
                <span className="material-icons" style={{ color: '#adc6ff', fontSize: 16 }}>psychology</span>
                <span className="analytics-chart__title">Attribution Confidence</span>
              </div>
              <span className={`badge ${live ? 'badge-stable' : 'badge-warning'}`}>{confidence != null ? `${confidence}%` : '--'}</span>
            </div>
            <p style={{ color: 'var(--outline)', fontSize: 12, lineHeight: 1.6 }}>
              Confidence is computed from live occupancy and CSI-derived metrics only.
            </p>
          </div>
        </div>

        <div className="analytics-bottom-grid">
          <div className="glass-card analytics-heatmap">
            <div className="analytics-heatmap__header">
              <div>
                <h3 className="analytics-section-title">Occupancy Heatmap</h3>
                <p className="analytics-section-subtitle">Disabled until a real historical data store is connected</p>
              </div>
              <span className="badge badge-warning">{filter}</span>
            </div>
            <div style={{ minHeight: 160, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--outline)', fontSize: 12, textAlign: 'center', padding: 16 }}>
              Historical heatmap data is not synthesized. Connect a real backend history source to render this view.
            </div>
          </div>

          <div className="analytics-side">
            <div className="glass-card analytics-side__card">
              <h3 className="analytics-section-title">Clinical Highlights</h3>
              <div className="analytics-highlight-list">
                <div className="analytics-highlight">
                  <strong>Breathing</strong>
                  <p>{breathing != null ? `Live respiration is ${breathing.toFixed(1)} BPM.` : 'No respiration stream available.'}</p>
                </div>
                <div className="analytics-highlight">
                  <strong>Occupancy</strong>
                  <p>{occupancy != null ? `${occupancy} person(s) estimated from live feed.` : 'No occupancy estimate available.'}</p>
                </div>
                <div className="analytics-highlight">
                  <strong>Feed</strong>
                  <p>{live ? 'Websocket backend connected.' : 'Websocket backend offline.'}</p>
                </div>
              </div>
            </div>

            <div className="glass-card analytics-side__card">
              <h3 className="analytics-section-title">Snapshot Notes</h3>
              <div className="analytics-notes">
                {[
                  { key: 'Stream status', value: live ? 'Live' : 'Offline' },
                  { key: 'Filter', value: filter },
                  { key: 'Confidence', value: confidence != null ? `${confidence}%` : '--' },
                ].map((item) => (
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
