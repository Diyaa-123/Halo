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
  const [selectedOccupantIndex, setSelectedOccupantIndex] = useState(0);

  const patientData = useMemo(() => ({
    name: sensing.isConnected ? 'Live Target' : 'No Live Target',
    age: '--',
    gender: '--',
    room: sensing.isConnected ? (sensing.allVitals.length > 0 ? `Tracked Occupants: ${sensing.allVitals.length}` : 'Live Zone') : 'Offline',
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
      <LeftSidebar patient={patientData} selectedOccupantIndex={selectedOccupantIndex} />

      {/* Center Hero — Digital Twin — 48% */}
      <main className="clinical-dashboard__center">
        {sensing.allVitals?.length > 1 && (
          <div className="occupant-selector glass-card" style={{ position: 'absolute', top: '110px', left: '50%', transform: 'translateX(-50%)', zIndex: 10, display: 'flex', gap: '8px', padding: '8px 16px', borderRadius: '24px', alignItems: 'center' }}>
            <span style={{ color: 'var(--text-dim)', alignSelf: 'center', fontSize: '12px' }}>Tracked Occupants:</span>
            {sensing.allVitals.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedOccupantIndex(idx)}
                style={{
                  background: selectedOccupantIndex === idx ? 'var(--primary)' : 'transparent',
                  border: `1px solid ${selectedOccupantIndex === idx ? 'var(--primary)' : 'var(--outline)'}`,
                  color: selectedOccupantIndex === idx ? '#fff' : 'var(--text)',
                  padding: '4px 12px',
                  borderRadius: '16px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  transition: 'all 0.2s ease'
                }}
              >
                Person {idx + 1}
              </button>
            ))}
          </div>
        )}
        <DigitalTwin 
          patientState={liveState}
          setPatientState={setPatientState}
          healthScore={patientData.healthScore}
          selectedOccupantIndex={selectedOccupantIndex}
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
