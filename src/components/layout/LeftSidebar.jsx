import React, { useState, useEffect } from 'react';
import PatientCard from '../patient/PatientCard';
import VitalCard from '../patient/VitalCard';
import { useSensing } from '../../hooks/SensingContext';
import './LeftSidebar.css';

export default function LeftSidebar({ patient, onVitalSelect }) {
  const sensing = useSensing();
  const [selectedVital, setSelectedVital] = useState(null);

  // Initialize histories for sparklines
  const [histories, setHistories] = useState({
    hr: [68, 70, 71, 69, 72, 74, 72, 73, 71, 72],
    br: [14, 13, 13, 12, 11, 12, 13, 12, 11, 12],
    sleep: [70, 72, 74, 73, 75, 76, 78, 77, 79, 78],
    mob: [70, 68, 66, 67, 66, 65, 64, 65, 63, 65],
    agit: [10, 12, 15, 14, 16, 18, 20, 22, 23, 24],
    eat: [80, 82, 81, 83, 82, 82, 80, 82, 83, 82],
    gait: [76, 75, 74, 73, 74, 73, 72, 71, 72, 71],
    occ: [1, 1, 1, 1, 1, 1, 0, 1, 1, 1],
  });

  // Show searching overlay only when: connected but no vitals AND no presence signal
  // Acoustic evidence (via boosted confidence) lifts this gate automatically
  const isSearching = sensing.isConnected
    && !sensing.presence
    && sensing.confidence < 0.45
    && !sensing.heartRate
    && !sensing.breathingRate;

  useEffect(() => {
    if (!sensing.isConnected) return;

    setHistories((prev) => {
      const next = { ...prev };
      
      if (sensing.heartRate) {
        next.hr = [...next.hr.slice(1), Math.round(sensing.heartRate)];
      }
      if (sensing.breathingRate) {
        next.br = [...next.br.slice(1), parseFloat(sensing.breathingRate.toFixed(1))];
      }
      
      const currentAgit = Math.min(100, Math.round((sensing.motionPower ?? 0) * 80));
      next.agit = [...next.agit.slice(1), currentAgit];
      
      const currentMob = Math.max(20, Math.min(100, 75 - Math.round((sensing.variance ?? 0) * 10)));
      next.mob = [...next.mob.slice(1), currentMob];
      
      const currentSleep = Math.max(30, Math.min(100, 85 - (sensing.motionLevel === 'active' ? 40 : 0)));
      next.sleep = [...next.sleep.slice(1), currentSleep];

      const currentOcc = sensing.presence ? (sensing.motionLevel === 'active' ? 2 : 1) : 0;
      next.occ = [...next.occ.slice(1), currentOcc];

      return next;
    });
  }, [sensing.isConnected, sensing.heartRate, sensing.breathingRate, sensing.motionPower, sensing.variance, sensing.motionLevel, sensing.presence]);

  const handleVitalClick = (vital) => {
    setSelectedVital(vital.id === selectedVital ? null : vital.id);
    onVitalSelect?.(vital);
  };

  // Construct dynamic vitals list
  const vitals = [
    {
      id: 'hr',
      name: 'Heart Rate',
      value: sensing.isConnected ? (sensing.heartRate ? Math.round(sensing.heartRate).toString() : '--') : '72',
      unit: 'BPM',
      trend: sensing.isConnected ? '' : '+2',
      trendDir: 'stable',
      risk: sensing.isConnected && sensing.heartRate ? (sensing.heartRate > 95 || sensing.heartRate < 50 ? 'moderate' : 'low') : 'low',
      color: '#4edea3',
      data: histories.hr,
    },
    {
      id: 'br',
      name: 'Breathing Rate',
      value: sensing.isConnected ? (sensing.breathingRate ? sensing.breathingRate.toFixed(1) : '--') : '12',
      unit: 'BRPM',
      trend: sensing.isConnected ? '' : '-1',
      trendDir: 'stable',
      risk: sensing.isConnected && sensing.breathingRate ? (sensing.breathingRate > 20 || sensing.breathingRate < 10 ? 'moderate' : 'low') : 'moderate',
      color: '#F59E0B',
      data: histories.br,
    },
    {
      id: 'sleep',
      name: 'Sleep Quality',
      value: sensing.isConnected ? histories.sleep[histories.sleep.length - 1].toString() : '78',
      unit: '%',
      trend: '',
      trendDir: 'stable',
      risk: 'low',
      color: '#adc6ff',
      data: histories.sleep,
    },
    {
      id: 'mob',
      name: 'Mobility Score',
      value: sensing.isConnected ? histories.mob[histories.mob.length - 1].toString() : '65',
      unit: '/100',
      trend: '',
      trendDir: 'stable',
      risk: 'low',
      color: '#ffb786',
      data: histories.mob,
    },
    {
      id: 'agit',
      name: 'Agitation Index',
      value: sensing.isConnected ? histories.agit[histories.agit.length - 1].toString() : '24',
      unit: '/100',
      trend: '',
      trendDir: 'stable',
      risk: sensing.isConnected && histories.agit[histories.agit.length - 1] > 35 ? 'moderate' : 'low',
      color: '#EF4444',
      data: histories.agit,
    },
    {
      id: 'eat',
      name: 'Eating Pattern',
      value: '82',
      unit: '%',
      trend: '0',
      trendDir: 'stable',
      risk: 'low',
      color: '#4edea3',
      data: histories.eat,
    },
    {
      id: 'gait',
      name: 'Gait Stability',
      value: '71',
      unit: '/100',
      trend: '',
      trendDir: 'stable',
      risk: 'low',
      color: '#F59E0B',
      data: histories.gait,
    },
    {
      id: 'occ',
      name: 'Occupancy Status',
      value: sensing.isConnected ? (sensing.presence ? (sensing.motionLevel === 'active' ? 'ROOM' : 'BED') : 'AWAY') : 'BED',
      unit: 'ROOM',
      trend: '',
      trendDir: 'stable',
      risk: 'low',
      color: '#adc6ff',
      data: histories.occ,
    },
  ];

  return (
    <aside className="left-sidebar">
      <PatientCard patient={patient} />
      <div className="left-sidebar__vitals-header">
        <span className="section-label">Vital Monitoring</span>
        <span className="left-sidebar__vitals-live">
          <span className="left-sidebar__vitals-dot" style={{ background: sensing.isConnected ? 'var(--secondary)' : 'var(--outline)' }} />
          {sensing.isConnected ? 'LIVE' : 'DEMO'}
        </span>
      </div>
      
      <div className="left-sidebar__vitals-container">
        {isSearching && (
          <div className="searching-overlay">
            <div className="searching-overlay__spinner" />
            <div className="searching-overlay__text">Acquiring Sensor Signal</div>
            <div className="searching-overlay__subtext">Calibrating acoustic & WiFi beams...</div>
          </div>
        )}
        <div className="left-sidebar__vitals" style={{ filter: isSearching ? 'blur(4px)' : 'none', pointerEvents: isSearching ? 'none' : 'auto' }}>
          {vitals.map((v) => (
            <VitalCard
              key={v.id}
              vital={v}
              isSelected={selectedVital === v.id}
              onClick={() => handleVitalClick(v)}
            />
          ))}
        </div>
      </div>
    </aside>
  );
}

