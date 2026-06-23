import React from 'react';
import './ProfileColumn.css';

export default function ProfileColumn({ isNightMode = true }) {
  const resident = {
    name: 'Mr. Raghav Iyer',
    title: 'Resident Profile',
    age: 79,
    gender: 'Male',
    location: 'Bedroom 2',
    ward: 'Assisted Living - West Wing',
    monitoring: 'Active',
    healthStatus: 'Stable',
    avatarInitials: 'RI',
    condition: 'Hypertension, mild arthritis, and sleep apnea watch',
    allergies: 'Penicillin, peanuts',
    mobilityStatus: 'Walks with cane; supervised at night',
    lastCheckIn: 'Today, 08:40 AM',
    physician: 'Dr. Meera Rao',
    emergencyContact: 'Anita Iyer, Daughter',
    medication: 'Amlodipine, evening oxygen support',
    residentId: 'RS-2048-19',
  };

  return (
    <>
      <div className="glass-card profile-card">
        {/* Header */}
        <div className="profile-header">
          <div className="profile-plan">
            <span className="material-icons icon-sm" style={{ color: 'var(--primary)' }}>house</span>
            <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--primary)' }}>{resident.title}</span>
          </div>
          <h2 className="profile-name">{resident.name}</h2>
          <p className="profile-blurb">{resident.condition}</p>
        </div>

        {/* Basic Info */}
        <div className="profile-info-block">
          <div className="profile-avatar" aria-hidden="true">
            <span className="profile-avatar__initials">{resident.avatarInitials}</span>
          </div>
          <div className="profile-stats">
            <div className="stat-group">
              <span className="stat-label">Monitoring Active</span>
              <span className="stat-val" style={{ color: 'var(--secondary)' }}>{resident.monitoring}</span>
            </div>
            <div className="profile-meta-row">
              <div className="stat-group">
                <span className="stat-label">Age</span>
                <span className="stat-val">{resident.age}</span>
              </div>
              <div className="stat-group">
                <span className="stat-label">Gender</span>
                <span className="stat-val">{resident.gender}</span>
              </div>
              <div className="stat-group">
                <span className="stat-label">Location</span>
                <span className="stat-val">{resident.location}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="profile-detail-grid">
          <div className="profile-detail-item">
            <span className="stat-label">Ward</span>
            <span className="stat-val">{resident.ward}</span>
          </div>
          <div className="profile-detail-item">
            <span className="stat-label">Resident ID</span>
            <span className="stat-val">{resident.residentId}</span>
          </div>
          <div className="profile-detail-item">
            <span className="stat-label">Physician</span>
            <span className="stat-val">{resident.physician}</span>
          </div>
          <div className="profile-detail-item">
            <span className="stat-label">Emergency Contact</span>
            <span className="stat-val">{resident.emergencyContact}</span>
          </div>
        </div>

        <div className="profile-note">
          <span className="material-icons icon-sm">pill</span>
          <span>{resident.medication}</span>
        </div>

        <div className="profile-clinical-grid">
          <div className="profile-clinical-item">
            <span className="stat-label">Allergies</span>
            <span className="stat-val">{resident.allergies}</span>
          </div>
          <div className="profile-clinical-item">
            <span className="stat-label">Mobility Status</span>
            <span className="stat-val">{resident.mobilityStatus}</span>
          </div>
          <div className="profile-clinical-item">
            <span className="stat-label">Last Check-In</span>
            <span className="stat-val">{resident.lastCheckIn}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="profile-actions">
          <button className="btn-icon">
            <span className="material-icons">settings</span>
          </button>
          <button className="btn btn-primary" style={{ flex: 1 }}>
            <span className="material-icons icon-sm">insights</span>
            View Daily Summary
          </button>
        </div>

        {/* Status */}
        <div className="profile-footer">
          <div className="stat-group" style={{ flexDirection: 'row', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <span className="stat-label" style={{ marginBottom: 0 }}>Current Status</span>
            <span className="badge badge-stable">{isNightMode ? 'RESTING NORMAL' : 'DAYTIME ACTIVE'}</span>
          </div>
        </div>
      </div>

      {/* HR / Breathing Card with Graceful Degradation */}
      <div className="glass-card hr-card" style={{ opacity: isNightMode ? 1 : 0.4, transition: 'opacity 0.3s' }}>
        {!isNightMode && (
          <div style={{ position: 'absolute', inset: 0, zIndex: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.7)', borderRadius: 'var(--radius-lg)' }}>
            <span style={{ background: 'var(--surface)', padding: '6px 12px', borderRadius: 20, fontSize: 11, fontWeight: 700, color: 'var(--on-surface-variant)', border: '1px solid var(--border-muted)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Day Mode — Training Paused</span>
          </div>
        )}
        
        <div className="hr-header">
          <div className="hr-icon-wrapper" style={{ background: 'rgba(78, 222, 163, 0.15)', color: 'var(--secondary)' }}>
            <span className="material-icons icon-sm">air</span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface-variant)' }}>Live Breathing Rate</span>
        </div>
        
        <div className="hr-value">
          <span className="hr-num">14</span>
          <span className="hr-unit">RPM</span>
          <span className="badge badge-stable" style={{ marginLeft: 'auto' }}>WiFi Detected</span>
        </div>

        <div className="hr-chart">
          {/* Breathing Sine Wave SVG */}
          <svg viewBox="0 0 200 60" width="100%" height="100%" preserveAspectRatio="none">
            <path 
              d="M 0 30 Q 25 10, 50 30 T 100 30 T 150 30 T 200 30" 
              fill="none" 
              stroke="var(--secondary)" 
              strokeWidth="3" 
              strokeLinejoin="round" 
              strokeLinecap="round" 
              opacity="0.8"
            />
            <path 
              d="M 0 30 Q 25 10, 50 30 T 100 30 T 150 30 T 200 30" 
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
