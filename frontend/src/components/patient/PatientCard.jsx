import React from 'react';
import './PatientCard.css';
import { useToast } from '../layout/ToastContext';

export default function PatientCard({ patient }) {
  const toast = useToast();
  const p = patient || {
    name: 'Live Target',
    age: '--',
    gender: '--',
    room: 'Live Zone',
    healthScore: 0,
    status: 'warning',
    insuranceId: '--',
    diagnosis: 'Backend data required',
    admitDate: '--',
    physician: '--',
    ward: 'SilentSense',
    bloodType: '--',
  };

  const statusColor = {
    stable: '#4edea3',
    warning: '#F59E0B',
    critical: '#EF4444',
  }[p.status] || '#4edea3';

  const scoreColor = p.healthScore >= 80 ? '#4edea3' : p.healthScore >= 60 ? '#F59E0B' : '#EF4444';
  const scoreLabel = p.healthScore >= 95 ? 'Excellent' : p.healthScore >= 80 ? 'Stable' : p.healthScore >= 60 ? 'Attention' : 'Critical';
  const circumference = 2 * Math.PI * 28;
  const dash = circumference * (p.healthScore / 100);

  return (
    <div className="patient-card glass-card">
      {/* Header */}
      <div className="patient-card__header">
        <div className="patient-card__avatar">
          <span className="patient-card__avatar-initials">
            {p.name.split(' ').map(n => n[0]).join('')}
          </span>
          <span className="patient-card__status-dot" style={{ background: statusColor }} />
        </div>
        <div className="patient-card__identity">
          <h2 className="patient-card__name">{p.name}</h2>
          <div className="patient-card__meta">
            <span>{p.age}y</span>
            <span>·</span>
            <span>{p.gender}</span>
            <span>·</span>
            <span style={{ color: 'var(--primary)' }}>{p.bloodType}</span>
          </div>
          <div className="patient-card__room">
            <span className="material-icons icon-sm">bed</span>
            Room {p.room}
          </div>
        </div>
      </div>

      {/* Health Score Gauge */}
      <div className="patient-card__score-section">
        <div className="patient-card__gauge">
          <svg viewBox="0 0 70 70" width="70" height="70">
            <circle cx="35" cy="35" r="28" fill="none" stroke="var(--surface-container-high)" strokeWidth="5" />
            <circle
              cx="35" cy="35" r="28"
              fill="none"
              stroke={scoreColor}
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 35 35)"
              style={{ filter: `drop-shadow(0 0 6px ${scoreColor}80)` }}
            />
          </svg>
          <div className="patient-card__gauge-center">
            <span className="patient-card__gauge-value" style={{ color: scoreColor }}>{p.healthScore}</span>
          </div>
        </div>
        <div className="patient-card__score-info">
          <div className="patient-card__score-label">Health Score</div>
          <div className="patient-card__score-status" style={{ color: scoreColor }}>
            {scoreLabel}
          </div>
          <div className={`badge badge-${p.status === 'stable' ? 'stable' : p.status === 'warning' ? 'warning' : 'critical'}`}>
            {p.status.toUpperCase()}
          </div>
        </div>
      </div>

      {/* Info Grid */}
      <div className="patient-card__info-grid">
        <div className="patient-card__info-item">
          <span className="patient-card__info-label">Insurance</span>
          <span className="patient-card__info-value">{p.insuranceId}</span>
        </div>
        <div className="patient-card__info-item">
          <span className="patient-card__info-label">Physician</span>
          <span className="patient-card__info-value">{p.physician}</span>
        </div>
        <div className="patient-card__info-item">
          <span className="patient-card__info-label">Admitted</span>
          <span className="patient-card__info-value">{p.admitDate}</span>
        </div>
        <div className="patient-card__info-item">
          <span className="patient-card__info-label">Diagnosis</span>
          <span className="patient-card__info-value">{p.diagnosis}</span>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="patient-card__actions">
        {[
          { icon: 'videocam', label: 'Video Call' },
          { icon: 'history', label: 'History' },
          { icon: 'medication', label: 'Meds' },
          { icon: 'emergency', label: 'Emergency' },
        ].map(a => (
          <button key={a.label} className="patient-card__action-btn" title={a.label} onClick={() => toast(`Opening ${a.label} for ${p.name}...`, 'info')}>
            <span className="material-icons icon-sm">{a.icon}</span>
            <span>{a.label}</span>
          </button>
        ))}
      </div>

      {/* QR / Policy */}
      <div className="patient-card__qr-row">
        <div className="patient-card__qr">
          <svg viewBox="0 0 40 40" width="40" height="40" fill="none">
            {/* Simplified QR pattern */}
            <rect x="2" y="2" width="16" height="16" rx="2" stroke="var(--primary)" strokeWidth="1.5" fill="none"/>
            <rect x="6" y="6" width="8" height="8" rx="1" fill="var(--primary)" opacity="0.7"/>
            <rect x="22" y="2" width="16" height="16" rx="2" stroke="var(--primary)" strokeWidth="1.5" fill="none"/>
            <rect x="26" y="6" width="8" height="8" rx="1" fill="var(--primary)" opacity="0.7"/>
            <rect x="2" y="22" width="16" height="16" rx="2" stroke="var(--primary)" strokeWidth="1.5" fill="none"/>
            <rect x="6" y="26" width="8" height="8" rx="1" fill="var(--primary)" opacity="0.7"/>
            {[22,26,30,34].map((x, i) => [22,26,30,34].map((y, j) => (i + j) % 2 === 0 && (
              <rect key={`${i}${j}`} x={x} y={y} width="3" height="3" fill="var(--primary)" opacity="0.6" />
            )))}
          </svg>
        </div>
        <div className="patient-card__policy">
          <span className="patient-card__policy-label">Patient ID</span>
          <span className="patient-card__policy-value">PT-2025-7834</span>
          <span className="patient-card__ward">{p.ward}</span>
        </div>
      </div>
    </div>
  );
}
