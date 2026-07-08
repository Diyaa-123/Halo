import React from 'react';
import './PageLayout.css';
import { useToast } from '../components/layout/ToastContext';
import { useSensing } from '../hooks/SensingContext';

export default function EatingMonitorPage() {
  const toast = useToast();
  const sensing = useSensing();
  const live = sensing.isConnected;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;
  const occupancy = sensing.estimatedPersons ?? null;

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#4edea3' }}>restaurant</span>
          <div>
            <h1 className="page-layout__title">Eating Habit Monitoring</h1>
            <p className="page-layout__subtitle">Live behavior context view from the websocket backend</p>
          </div>
        </div>
        <span className={`badge ${live ? 'badge-stable' : 'badge-warning'}`}>{live ? 'LIVE' : 'OFFLINE'}</span>
      </div>

      <div className="page-layout__content">
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          {[
            { label: 'Feed Status', value: live ? 'Live' : 'Offline', color: live ? '#4edea3' : '#EF4444', status: live ? 'stable' : 'critical' },
            { label: 'Confidence', value: confidence != null ? `${confidence}%` : '--', color: '#adc6ff', status: 'stable' },
            { label: 'Occupancy', value: occupancy != null ? `${occupancy}` : '--', color: '#F59E0B', status: 'warning' },
            { label: 'Eating stream', value: 'Unavailable', color: '#94A3B8', status: 'warning' },
          ].map((item) => (
            <div key={item.label} className="glass-card" style={{ padding: 14, borderLeft: `3px solid ${item.color}` }}>
              <div style={{ fontSize: 9, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--outline)', fontWeight: 700, marginBottom: 6 }}>{item.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4, marginBottom: 4 }}>
                <span style={{ fontSize: 24, fontWeight: 800, color: item.color }}>{item.value}</span>
              </div>
              <span className={`badge badge-${item.status}`} style={{ fontSize: 9 }}>{item.status.toUpperCase()}</span>
            </div>
          ))}
        </div>

        <div className="glass-card" style={{ padding: 16 }}>
          <div className="section-label" style={{ marginBottom: 12 }}>Live Eating Context</div>
          <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
            {live
              ? 'This page intentionally does not fabricate utensil, chew, or swallow counts. Connect a real eating-monitor backend or historical dataset to populate those metrics.'
              : 'Backend websocket is offline, so no eating context can be inferred.'}
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="glass-card" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Meal Context</div>
            <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
              Meal segmentation, utensil classification, chew count, and swallow count are disabled until the backend streams a dedicated eating signal.
            </div>
          </div>

          <div className="glass-card" style={{ padding: 16 }}>
            <div className="section-label" style={{ marginBottom: 12 }}>Actions</div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => toast('Meal reminder scheduled placeholder.', 'info')}>
                Set Meal Reminder
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1 }} onClick={() => toast('History view requires a real eating dataset.', 'info')}>
                View History
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
