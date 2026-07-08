import React from 'react';
import { useNavigate } from 'react-router-dom';
import './ProfileColumn.css';
import { useToast } from '../layout/ToastContext';
import { useSensing } from '../../hooks/SensingContext';

function DisplayValue({ value, fallback = '--' }) {
  return <span className="stat-val">{value ?? fallback}</span>;
}

export default function ProfileColumn({ isNightMode = true }) {
  const toast = useToast();
  const navigate = useNavigate();
  const sensing = useSensing();

  const live = sensing.isConnected;
  const breathing = sensing.breathingRate;
  const heartRate = sensing.heartRate;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;

  const statusBadge = live
    ? (sensing.presence
        ? (sensing.motionLevel === 'active' ? 'LIVE MOTION' : 'LIVE REST')
        : 'ROOM EMPTY')
    : 'BACKEND OFFLINE';

  const profileFields = [
    { label: 'Monitoring', value: live ? 'Active live feed' : 'No live feed' },
    { label: 'Source', value: sensing.source?.toUpperCase() || 'N/A' },
    { label: 'Confidence', value: confidence != null ? `${confidence}%` : '--' },
    { label: 'Occupants', value: sensing.estimatedPersons != null ? sensing.estimatedPersons : '--' },
  ];

  const summaryBlocks = [
    { label: 'Breathing', value: breathing != null ? `${breathing.toFixed(1)} brpm` : '--' },
    { label: 'Heart rate', value: heartRate != null ? `${Math.round(heartRate)} bpm` : '--' },
    { label: 'Motion', value: sensing.motionLevel || 'absent' },
    { label: 'RSSI', value: sensing.meanRssi != null ? `${Math.round(sensing.meanRssi)} dBm` : '--' },
  ];

  return (
    <>
      <div className="glass-card profile-card">
        <div className="profile-header">
          <div className="profile-plan">
            <span className="material-icons icon-sm" style={{ color: 'var(--primary)' }}>radar</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>Live Resident Context</span>
          </div>
          <h2 className="profile-name">Target attribution feed</h2>
          <p className="profile-blurb">
            This panel now reflects only backend-provided sensing signals. No simulated resident profile data is shown here.
          </p>
        </div>

        <div className="profile-info-block">
          <div className="profile-avatar" aria-hidden="true">
            <span className="profile-avatar__initials">LS</span>
          </div>
          <div className="profile-stats">
            <div className="stat-group">
              <span className="stat-label">Monitoring status</span>
              <span className="stat-val" style={{ color: 'var(--secondary)' }}>{live ? 'LIVE' : 'OFFLINE'}</span>
            </div>
            <div className="profile-meta-row">
              {profileFields.map((item) => (
                <div key={item.label} className="stat-group">
                  <span className="stat-label">{item.label}</span>
                  <DisplayValue value={item.value} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="profile-detail-grid">
          {summaryBlocks.map((item) => (
            <div key={item.label} className="profile-detail-item">
              <span className="stat-label">{item.label}</span>
              <span className="stat-val">{item.value}</span>
            </div>
          ))}
        </div>

        <div className="profile-note">
          <span className="material-icons icon-sm">lan</span>
          <span>
            {sensing.streamMessage || 'Live websocket feed drives all visible measurements.'}
          </span>
        </div>

        <div className="profile-clinical-grid">
          <div className="profile-clinical-item">
            <span className="stat-label">Attribution</span>
            <span className="stat-val">{statusBadge}</span>
          </div>
          <div className="profile-clinical-item">
            <span className="stat-label">Stream status</span>
            <span className="stat-val">{sensing.streamStatus || (live ? 'live' : 'offline')}</span>
          </div>
          <div className="profile-clinical-item">
            <span className="stat-label">Last update</span>
            <span className="stat-val">
              {sensing.lastUpdateAt ? new Date(sensing.lastUpdateAt * 1000).toLocaleTimeString() : '--'}
            </span>
          </div>
        </div>

        <div className="profile-actions">
          <button className="btn-icon" onClick={() => navigate('/settings')}>
            <span className="material-icons">settings</span>
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => navigate('/report')}>
            <span className="material-icons icon-sm">insights</span>
            View Live Report
          </button>
        </div>

        <div className="profile-footer">
          <div className="stat-group" style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="stat-label" style={{ marginBottom: 0 }}>Current Status</span>
            <span className={`badge ${statusBadge.includes('OFFLINE') ? 'badge-critical' : 'badge-stable'}`}>{statusBadge}</span>
          </div>
        </div>
      </div>

      <div className="glass-card hr-card" style={{ opacity: isNightMode ? 1 : 0.4, transition: 'opacity 0.3s' }}>
        {!isNightMode && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ background: 'var(--surface)', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', border: '1px solid var(--border-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
              Day mode - vitals use live feed only
            </span>
          </div>
        )}

        <div className="hr-header">
          <div className="hr-icon-wrapper" style={{ background: 'rgba(78, 222, 163, 0.15)', color: 'var(--secondary)' }}>
            <span className="material-icons icon-sm">air</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Live Breathing Rate</span>
        </div>

        <div className="hr-value">
          <span className="hr-num">{breathing != null ? breathing.toFixed(1) : '--'}</span>
          <span className="hr-unit">BPM</span>
          <span className={`badge ${live ? 'badge-stable' : 'badge-demo'}`} style={{ marginLeft: 'auto' }}>
            {live ? 'Live Feed' : 'No Feed'}
          </span>
        </div>

        <div className="hr-chart">
          <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
            <path
              d={live
                ? 'M 0 35 C 20 28, 35 15, 50 30 S 80 45, 100 30 S 130 15, 150 30 S 180 45, 200 30'
                : 'M 0 30 Q 25 30, 50 30 T 100 30 T 150 30 T 200 30'}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="3"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.8"
            />
            <path
              d={live
                ? 'M 0 35 C 20 28, 35 15, 50 30 S 80 45, 100 30 S 130 15, 150 30 S 180 45, 200 30'
                : 'M 0 30 Q 25 30, 50 30 T 100 30 T 150 30 T 200 30'}
              fill="none"
              stroke="var(--secondary)"
              strokeWidth="8"
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity="0.2"
            />
          </svg>
        </div>
      </div>
    </>
  );
}
