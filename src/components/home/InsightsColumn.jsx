import React from 'react';
import './InsightsColumn.css';

export default function InsightsColumn({ isNightMode = true }) {
  return (
    <div className="glass-card insights-card">
      <div className="insights-header">
        <div>
          <h2 className="insights-title">Ambient Intelligence</h2>
          <p className="insights-subtitle">Live Status & WiFi Analytics</p>
        </div>
        <button className="btn-icon">
          <span className="material-icons icon-sm">more_vert</span>
        </button>
      </div>

      <div className="insights-attribution">
        <div className="attribution-icon-bar" style={{ background: isNightMode ? 'var(--primary)' : 'var(--outline)' }} />
        <div className="attribution-content">
          <div className="attribution-icon-wrapper" style={{ color: isNightMode ? 'var(--primary)' : 'var(--on-surface-variant)', background: isNightMode ? 'var(--primary-container)' : 'var(--surface-container)' }}>
            <span className="material-icons icon-sm">{isNightMode ? 'person_search' : 'sensor_occupied'}</span>
          </div>
          <div className="attribution-text">
            <span className="attribution-label">{isNightMode ? 'ATTRIBUTION ENGINE' : 'DAYTIME SENSING'}</span>
            <span className="attribution-value">{isNightMode ? '92% Confidence' : 'Identity Paused'}</span>
          </div>
        </div>
      </div>

      <p className="insights-desc">
        {isNightMode 
          ? "AI confirms single occupant in the bedroom. Spatial and biometric signatures match Dad's profile. No other individuals detected in the sensor range."
          : "System is in Day Mode. Occupancy and motion are tracked at the zone level. Identity attribution and biometric training are paused until nighttime."
        }
      </p>

      <div className="insights-metrics">
        <div className="insights-metric">
          <span className="metric-label">Occupancy:</span>
          <span className="metric-val" style={{ color: 'var(--primary)' }}>Single</span>
        </div>
        <div className="insights-metric">
          <span className="metric-label">Location:</span>
          <span className="metric-val">Living Room</span>
        </div>
        <div className="insights-metric">
          <span className="metric-label">Activity:</span>
          <span className="metric-val">Sedentary</span>
        </div>
      </div>

      <div className="insights-behavior">
        <div className="behavior-title">
          <span className="material-icons icon-sm" style={{ color: 'var(--warning-amber)' }}>timeline</span>
          <span>Daily Routine Status</span>
        </div>
        <div className="behavior-item">
          <span className="behavior-dot safe"></span>
          <span>Slept 7.5 hours (Normal)</span>
        </div>
        <div className="behavior-item">
          <span className="behavior-dot safe"></span>
          <span>Morning routine completed</span>
        </div>
        <div className="behavior-item">
          <span className="behavior-dot warning"></span>
          <span>Less walking than usual today</span>
        </div>
      </div>

      <div className="insights-footer">
        <div className="network-status">
          <span className="material-icons icon-sm" style={{ color: 'var(--secondary)' }}>wifi</span>
          <div className="network-info">
            <span className="network-name">SilentSense Network</span>
            <span className="network-detail">3 ESP32 Nodes Active • High Signal</span>
          </div>
        </div>
      </div>
    </div>
  );
}
