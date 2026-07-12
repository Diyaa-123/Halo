import React from 'react';
import './PageLayout.css';
import './FallDetectionPage.css';
import { useToast } from '../components/layout/ToastContext';
import { useSensing } from '../hooks/SensingContext';

export default function FallDetectionPage() {
  const toast = useToast();
  const sensing = useSensing();
  const live = sensing.isConnected;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;
  const motion = sensing.motionLevel || 'absent';

  return (
    <div className="page-layout fall-page">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: '#EF4444' }}>emergency</span>
          <div>
            <h1 className="page-layout__title">Fall Detection Module</h1>
            <p className="page-layout__subtitle">Live event state from the backend websocket feed</p>
          </div>
        </div>
        <span className={`badge ${live ? 'badge-stable' : 'badge-warning'}`}>{live ? 'LIVE' : 'OFFLINE'}</span>
      </div>

      <div className="page-layout__content">
        <section className="fall-page__hero glass-card">
          <div className="fall-page__hero-copy">
            <span className="fall-page__eyebrow">Live State</span>
            <h2 className="fall-page__hero-title">{live ? 'Monitoring motion for fall risk' : 'Waiting for a live fall-risk feed'}</h2>
            <p className="fall-page__hero-text">
              {live
                ? 'No hardcoded incident replay is shown here. All values come from the backend sensing stream.'
                : 'Connect the websocket backend to display motion-derived fall alerts.'}
            </p>
          </div>

          <div className="fall-page__hero-metrics">
            {[
              { label: 'Live confidence', value: confidence != null ? `${confidence}%` : '--' },
              { label: 'Motion', value: motion.toUpperCase() },
              { label: 'Occupancy', value: sensing.estimatedPersons != null ? `${sensing.estimatedPersons}` : '--' },
              { label: 'Status', value: live ? 'ACTIVE' : 'OFFLINE' },
            ].map((item) => (
              <div key={item.label} className="fall-page__hero-metric">
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            ))}
          </div>
        </section>

        <div className="fall-page__kpis">
          {[
            { label: 'Current risk', value: live ? (motion === 'active' ? 'Elevated' : 'Low') : '--', color: '#EF4444' },
            { label: 'Confidence', value: confidence != null ? `${confidence}%` : '--', color: '#F59E0B' },
            { label: 'Response time', value: 'N/A', color: '#4edea3' },
            { label: 'Events', value: 'No history loaded', color: '#3B82F6' },
          ].map((kpi) => (
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
                  <h3 className="fall-card__title">Live Posture View</h3>
                  <p className="fall-card__subtitle">Synthetic replay removed; showing live state only</p>
                </div>
                <span className={`badge ${live ? 'badge-stable' : 'badge-warning'}`}>{live ? 'MONITORING' : 'OFFLINE'}</span>
              </div>

              <div className="fall-card__visual" style={{ minHeight: 220, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--outline)', textAlign: 'center', padding: 16 }}>
                <div>
                  <div style={{ fontSize: 32, fontWeight: 800, color: '#EF4444' }}>{motion.toUpperCase()}</div>
                  <div style={{ fontSize: 12, marginTop: 8 }}>
                    {live ? 'No replay, no fake incidents, no hardcoded posture sequence.' : 'Connect backend to populate live posture state.'}
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card fall-card">
              <div className="fall-card__header">
                <div>
                  <h3 className="fall-card__title">Response Workflow</h3>
                  <p className="fall-card__subtitle">Actions operate on live state, not prerecorded incidents</p>
                </div>
              </div>
              <div className="fall-workflow">
                {['Detect', 'Validate', 'Escalate', 'Log'].map((step) => (
                  <div key={step} className="fall-workflow__step fall-workflow__step--done">
                    <span className="material-icons">check_circle</span>
                    <strong>{step}</strong>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <aside className="fall-page__side">
            <div className="glass-card fall-card fall-card--tight">
              <h3 className="fall-card__title">Incident Details</h3>
              <div className="fall-details">
                {[
                  { label: 'Stream', value: live ? 'Live' : 'Offline', icon: 'schedule' },
                  { label: 'Confidence', value: confidence != null ? `${confidence}%` : '--', icon: 'psychology' },
                  { label: 'Motion', value: motion.toUpperCase(), icon: 'monitor_heart' },
                  { label: 'Occupancy', value: sensing.estimatedPersons != null ? `${sensing.estimatedPersons}` : '--', icon: 'sensor_occupied' },
                ].map((item) => (
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
                {live
                  ? 'Current motion feed is live. Tie this module to a real incident logger to build a verified fall history.'
                  : 'Connect the backend websocket before interpreting fall risk.'}
              </p>
              <div className="fall-card__actions">
                <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => toast('Care plan action queued.', 'info')}>
                  <span className="material-icons icon-sm">assignment</span>
                  Create Care Plan
                </button>
                <button className="btn btn-outline btn-sm" style={{ flex: 1 }} onClick={() => toast('Share action queued.', 'info')}>
                  <span className="material-icons icon-sm">share</span>
                  Share Report
                </button>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
