import React, { useState } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightPanel from '../components/layout/RightPanel';
import DigitalTwin from '../components/twin/DigitalTwin';
import EmergencyOverlay from '../components/alerts/EmergencyOverlay';
import './ClinicalDashboard.css';

const patientData = {
  name: 'Aarav Mehta',
  age: 78,
  gender: 'Male',
  room: 'B-204',
  healthScore: 82,
  status: 'stable',
  insuranceId: 'XY-2025-3487',
  diagnosis: 'COPD, Hypertension',
  admitDate: 'Oct 14, 2025',
  physician: 'Dr. Priya Sharma',
  ward: 'Geriatric Care',
  bloodType: 'B+',
};

export default function ClinicalDashboard({ showEmergency, onEmergencyDismiss }) {
  const [patientState, setPatientState] = useState('stable');

  return (
    <div className="clinical-dashboard">
      {/* Left Sidebar — 22% */}
      <LeftSidebar patient={patientData} />

      {/* Center Hero — Digital Twin — 48% */}
      <main className="clinical-dashboard__center">
        <div className="clinical-dashboard__twin-controls">
          <div className="clinical-dashboard__state-switcher">
            <span className="section-label" style={{ paddingRight: 8 }}>Simulate State:</span>
            {[
              { key: 'healthy', label: 'Healthy', color: '#22C55E' },
              { key: 'stable', label: 'Stable', color: '#3B82F6' },
              { key: 'warning', label: 'Warning', color: '#F59E0B' },
              { key: 'respiratory_distress', label: 'Distress', color: '#EF4444' },
            ].map(s => (
              <button
                key={s.key}
                className={`clinical-dashboard__state-btn ${patientState === s.key ? 'clinical-dashboard__state-btn--active' : ''}`}
                style={{ '--state-color': s.color }}
                onClick={() => setPatientState(s.key)}
              >
                <span className="clinical-dashboard__state-dot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <DigitalTwin patientState={patientState} healthScore={patientData.healthScore} />
      </main>

      {/* Right Panel — 30% */}
      <RightPanel />

      {/* Emergency Overlay */}
      {showEmergency && (
        <EmergencyOverlay onDismiss={onEmergencyDismiss} />
      )}
    </div>
  );
}
