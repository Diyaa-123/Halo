import React, { useEffect, useMemo, useState } from 'react';
import LeftSidebar from '../components/layout/LeftSidebar';
import RightPanel from '../components/layout/RightPanel';
import DigitalTwin from '../components/twin/DigitalTwin';
import EmergencyOverlay from '../components/alerts/EmergencyOverlay';
import { useSensing } from '../hooks/SensingContext';
import './ClinicalDashboard.css';

export default function ClinicalDashboard({ showEmergency, onEmergencyDismiss }) {
  const sensing = useSensing();
  const [patientState, setPatientState] = useState('offline');

  const patientData = useMemo(() => ({
    name: sensing.isConnected ? 'Live Target' : 'No Live Target',
    age: '--',
    gender: '--',
    room: sensing.isConnected ? 'Live Zone' : 'Offline',
    healthScore: sensing.confidence != null ? Math.round(sensing.confidence * 100) : 0,
    status: sensing.isConnected ? (sensing.presence ? 'present' : 'away') : 'offline',
    insuranceId: '--',
    diagnosis: sensing.streamMessage || 'Backend-provided live sensing only',
    admitDate: '--',
    physician: '--',
    ward: 'SilentSense',
    bloodType: '--',
  }), [sensing]);

  const liveState = sensing.isConnected
    ? (sensing.motionLevel === 'active' ? 'active' : sensing.presence ? 'stable' : 'away')
    : 'offline';

  useEffect(() => {
    setPatientState(liveState);
  }, [liveState]);

  return (
    <div className="clinical-dashboard">
      {/* Left Sidebar — 22% */}
      <LeftSidebar patient={patientData} />

      {/* Center Hero — Digital Twin — 48% */}
      <main className="clinical-dashboard__center">
        <DigitalTwin 
          patientState={liveState}
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
