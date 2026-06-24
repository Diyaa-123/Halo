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
        <DigitalTwin 
          patientState={patientState} 
          setPatientState={setPatientState}
          healthScore={patientData.healthScore} 
        />
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
