import React, { useState } from 'react';
import PatientCard from '../patient/PatientCard';
import VitalCard from '../patient/VitalCard';
import './LeftSidebar.css';

const vitals = [
  { id: 'hr', name: 'Heart Rate', value: '72', unit: 'BPM', trend: '+2', trendDir: 'up', risk: 'low', color: '#4edea3', data: [68,70,71,69,72,74,72,73,71,72] },
  { id: 'br', name: 'Breathing Rate', value: '12', unit: 'BRPM', trend: '-1', trendDir: 'down', risk: 'moderate', color: '#F59E0B', data: [14,13,13,12,11,12,13,12,11,12] },
  { id: 'sleep', name: 'Sleep Quality', value: '78', unit: '%', trend: '+5', trendDir: 'up', risk: 'low', color: '#adc6ff', data: [70,72,74,73,75,76,78,77,79,78] },
  { id: 'mob', name: 'Mobility Score', value: '65', unit: '/100', trend: '-3', trendDir: 'down', risk: 'moderate', color: '#ffb786', data: [70,68,66,67,66,65,64,65,63,65] },
  { id: 'agit', name: 'Agitation Index', value: '24', unit: '/100', trend: '+8', trendDir: 'up', risk: 'high', color: '#EF4444', data: [10,12,15,14,16,18,20,22,23,24] },
  { id: 'eat', name: 'Eating Pattern', value: '82', unit: '%', trend: '0', trendDir: 'stable', risk: 'low', color: '#4edea3', data: [80,82,81,83,82,82,80,82,83,82] },
  { id: 'gait', name: 'Gait Stability', value: '71', unit: '/100', trend: '-2', trendDir: 'down', risk: 'moderate', color: '#F59E0B', data: [76,75,74,73,74,73,72,71,72,71] },
  { id: 'occ', name: 'Occupancy Status', value: 'BED', unit: 'ROOM', trend: '', trendDir: 'stable', risk: 'low', color: '#adc6ff', data: [1,1,1,1,1,1,0,1,1,1] },
];

export default function LeftSidebar({ patient, onVitalSelect }) {
  const [selectedVital, setSelectedVital] = useState(null);

  const handleVitalClick = (vital) => {
    setSelectedVital(vital.id === selectedVital ? null : vital.id);
    onVitalSelect?.(vital);
  };

  return (
    <aside className="left-sidebar">
      <PatientCard patient={patient} />
      <div className="left-sidebar__vitals-header">
        <span className="section-label">Vital Monitoring</span>
        <span className="left-sidebar__vitals-live">
          <span className="left-sidebar__vitals-dot" />
          LIVE
        </span>
      </div>
      <div className="left-sidebar__vitals">
        {vitals.map((v) => (
          <VitalCard
            key={v.id}
            vital={v}
            isSelected={selectedVital === v.id}
            onClick={() => handleVitalClick(v)}
          />
        ))}
      </div>
    </aside>
  );
}
