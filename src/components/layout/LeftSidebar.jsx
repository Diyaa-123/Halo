import React, { useState, useEffect } from 'react';
import PatientCard from '../patient/PatientCard';
import VitalCard from '../patient/VitalCard';
import { useSensing } from '../../hooks/SensingContext';
import './LeftSidebar.css';

export default function LeftSidebar({ patient, onVitalSelect, selectedOccupantIndex = 0 }) {
  const sensing = useSensing();
  const [selectedVital, setSelectedVital] = useState(null);

  // Initialize histories for sparklines
  const [histories, setHistories] = useState({
    hr: Array(10).fill(72),
    br: Array(10).fill(12),
    bp: Array(10).fill(120),
    hrv: Array(10).fill(50),
    meditation: Array(10).fill(80),
    apnea: Array(10).fill(0),
    stressLevel: Array(10).fill(20), // 0 to 100 mapping based on text
    occ: Array(10).fill(1),
  });

  const currentVitals = sensing.allVitals?.[selectedOccupantIndex] || {};

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
      
      const hr = currentVitals.heart_rate_bpm;
      const br = currentVitals.breathing_rate_bpm;
      const bp_sys = currentVitals.blood_pressure_sys;
      const hrv = currentVitals.hrv_sdnn;
      const meditation = currentVitals.meditation_score;
      const apnea = currentVitals.apnea_events;
      const stressStr = currentVitals.stress;
      let stressNum = 20;
      if (stressStr === 'Stressed') stressNum = 80;
      else if (stressStr === 'Tired') stressNum = 50;

      if (hr) next.hr = [...next.hr.slice(1), Math.round(hr)];
      if (br) next.br = [...next.br.slice(1), parseFloat(br.toFixed(1))];
      if (bp_sys) next.bp = [...next.bp.slice(1), bp_sys];
      if (hrv) next.hrv = [...next.hrv.slice(1), Math.round(hrv)];
      if (meditation) next.meditation = [...next.meditation.slice(1), Math.round(meditation)];
      if (apnea != null) next.apnea = [...next.apnea.slice(1), apnea];
      if (stressStr) next.stressLevel = [...next.stressLevel.slice(1), stressNum];

      const currentOcc = sensing.presence ? (sensing.motionLevel === 'active' ? 2 : 1) : 0;
      next.occ = [...next.occ.slice(1), currentOcc];

      return next;
    });
  }, [sensing.isConnected, currentVitals]);

  const handleVitalClick = (vital) => {
    setSelectedVital(vital.id === selectedVital ? null : vital.id);
    onVitalSelect?.(vital);
  };

  // Construct dynamic vitals list
  const vitals = [
    {
      id: 'hr',
      name: 'Heart Rate',
      value: sensing.isConnected ? (currentVitals.heart_rate_bpm ? Math.round(currentVitals.heart_rate_bpm).toString() : '--') : '72',
      unit: 'BPM',
      trend: sensing.isConnected ? '' : '+2',
      trendDir: 'stable',
      risk: sensing.isConnected && currentVitals.heart_rate_bpm ? (currentVitals.heart_rate_bpm > 95 || currentVitals.heart_rate_bpm < 50 ? 'moderate' : 'low') : 'low',
      color: '#4edea3',
      data: histories.hr,
    },
    {
      id: 'br',
      name: 'Breathing Rate',
      value: sensing.isConnected ? (currentVitals.breathing_rate_bpm ? currentVitals.breathing_rate_bpm.toFixed(1) : '--') : '12',
      unit: 'BRPM',
      trend: sensing.isConnected ? '' : '-1',
      trendDir: 'stable',
      risk: sensing.isConnected && currentVitals.breathing_rate_bpm ? (currentVitals.breathing_rate_bpm > 20 || currentVitals.breathing_rate_bpm < 10 ? 'moderate' : 'low') : 'moderate',
      color: '#F59E0B',
      data: histories.br,
    },
    {
      id: 'bp',
      name: 'Blood Pressure',
      value: sensing.isConnected ? (currentVitals.blood_pressure_sys ? `${currentVitals.blood_pressure_sys}/${currentVitals.blood_pressure_dia}` : '--') : '120/80',
      unit: 'mmHg',
      trend: '',
      trendDir: 'stable',
      risk: currentVitals.blood_pressure_sys > 130 ? 'moderate' : 'low',
      color: '#3B82F6',
      data: histories.bp,
    },
    {
      id: 'hrv',
      name: 'HRV (SDNN)',
      value: sensing.isConnected ? (currentVitals.hrv_sdnn ? currentVitals.hrv_sdnn.toFixed(1) : '--') : '50.0',
      unit: 'ms',
      trend: '',
      trendDir: 'stable',
      risk: 'low',
      color: '#A855F7',
      data: histories.hrv,
    },
    {
      id: 'meditation',
      name: 'Meditation Score',
      value: sensing.isConnected ? (currentVitals.meditation_score ? Math.round(currentVitals.meditation_score).toString() : '--') : '85',
      unit: '/100',
      trend: '',
      trendDir: 'stable',
      risk: 'low',
      color: '#4edea3',
      data: histories.meditation,
    },
    {
      id: 'apnea',
      name: 'Apnea Events',
      value: sensing.isConnected ? (currentVitals.apnea_events != null ? currentVitals.apnea_events.toString() : '--') : '0',
      unit: 'events',
      trend: '',
      trendDir: 'stable',
      risk: currentVitals.apnea_events > 0 ? 'moderate' : 'low',
      color: '#EF4444',
      data: histories.apnea,
    },
    {
      id: 'sleep',
      name: 'Sleep State',
      value: sensing.isConnected ? (currentVitals.sleep_state || 'Awake') : 'Awake',
      unit: '',
      trend: '',
      trendDir: 'stable',
      risk: 'low',
      color: '#adc6ff',
      data: histories.meditation, // proxy data
    },
    {
      id: 'stress',
      name: 'Stress Level',
      value: sensing.isConnected ? (currentVitals.stress || 'Relaxed') : 'Relaxed',
      unit: '',
      trend: '',
      trendDir: 'stable',
      risk: currentVitals.stress === 'Stressed' ? 'moderate' : 'low',
      color: '#ffb786',
      data: histories.stressLevel,
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

