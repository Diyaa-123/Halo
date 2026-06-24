import React, { useEffect, useState } from 'react';
import './EmergencyOverlay.css';
import { useToast } from '../layout/ToastContext';

export default function EmergencyOverlay({ onDismiss, event = 'Respiratory Distress', bed = 'BED 04' }) {
  const toast = useToast();
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (s) => `${String(Math.floor(s / 60)).padStart(2, '0')}m ${String(s % 60).padStart(2, '0')}s`;

  return (
    <div className="emergency-overlay">
      {/* Red ambient effect */}
      <div className="emergency-overlay__ambient" />

      <div className="emergency-overlay__content">
        {/* Flash Banner */}
        <div className="emergency-overlay__banner">
          <span className="material-icons" style={{ fontSize: 40, color: '#fff' }}>emergency</span>
          <div>
            <h1 className="emergency-overlay__title">CRITICAL EVENT DETECTED</h1>
            <p className="emergency-overlay__subtitle">{event}</p>
          </div>
        </div>

        {/* Details */}
        <div className="emergency-overlay__details">
          <div className="emergency-overlay__detail-item">
            <span className="emergency-overlay__detail-label">Location</span>
            <span className="emergency-overlay__detail-value">{bed}</span>
          </div>
          <div className="emergency-overlay__detail-item">
            <span className="emergency-overlay__detail-label">Unacknowledged</span>
            <span className="emergency-overlay__detail-value emergency-overlay__timer">
              {formatTime(elapsed)}
            </span>
          </div>
          <div className="emergency-overlay__detail-item">
            <span className="emergency-overlay__detail-label">Risk Level</span>
            <span className="emergency-overlay__detail-value" style={{ color: '#EF4444' }}>CRITICAL — 92/100</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="emergency-overlay__actions">
          <button className="emergency-overlay__action emergency-overlay__action--red" onClick={() => toast('Paging nursing staff to location...', 'success')}>
            <span className="material-icons">call</span>
            Call Nurse
          </button>
          <button className="emergency-overlay__action emergency-overlay__action--blue" onClick={() => toast('Initiating call to emergency contact...', 'info')}>
            <span className="material-icons">family_restroom</span>
            Call Family
          </button>
          <button className="emergency-overlay__action emergency-overlay__action--red" onClick={() => toast('Escalating to Emergency Medical Services...', 'error')}>
            <span className="material-icons">local_hospital</span>
            Escalate EMS
          </button>
          <button className="emergency-overlay__action emergency-overlay__action--outline" onClick={() => toast('Opening Incident Timeline...', 'info')}>
            <span className="material-icons">timeline</span>
            View Timeline
          </button>
        </div>

        {/* Dismiss */}
        <button className="emergency-overlay__dismiss" onClick={onDismiss}>
          <span className="material-icons icon-sm">close</span>
          Acknowledge &amp; Dismiss
        </button>
      </div>
    </div>
  );
}
