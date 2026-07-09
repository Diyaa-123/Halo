import React, { useRef, useState } from 'react';
import HealthScoreWidget from './HealthScoreWidget';
import { useToast } from '../layout/ToastContext';
import { useSensing } from '../../hooks/SensingContext';
import './DigitalTwin.css';
import { Canvas } from '@react-three/fiber';
import HumanTwinModel from './HumanTwinModel';

const bodyRegions = [
  { id: 'brain', label: 'Brain', x: '50%', y: '5%', status: 'stable', alerts: 0, details: { metric: 'Cognitive Score', value: '88/100', risk: 'Low', recommendation: 'Continue routine monitoring.' } },
  { id: 'lungs', label: 'Lungs', x: '50%', y: '28%', status: 'critical', alerts: 2, details: { metric: 'Breathing Rate', value: '6 BPM', risk: 'High', recommendation: 'Respiratory Assessment Required.' } },
  { id: 'heart', label: 'Heart', x: '44%', y: '32%', status: 'stable', alerts: 0, details: { metric: 'Heart Rate', value: '72 BPM', risk: 'Low', recommendation: 'Normal sinus rhythm.' } },
  { id: 'abdomen', label: 'Abdomen', x: '50%', y: '48%', status: 'warning', alerts: 1, details: { metric: 'Hydration', value: '62%', risk: 'Moderate', recommendation: 'Increase fluid intake.' } },
  { id: 'left-arm', label: 'L.Arm', x: '30%', y: '38%', status: 'stable', alerts: 0, details: { metric: 'Blood Pressure', value: '118/76', risk: 'Low', recommendation: 'Normal.' } },
  { id: 'right-arm', label: 'R.Arm', x: '70%', y: '38%', status: 'stable', alerts: 0, details: { metric: 'Blood Pressure', value: '120/78', risk: 'Low', recommendation: 'Normal.' } },
  { id: 'left-leg', label: 'L.Leg', x: '42%', y: '72%', status: 'warning', alerts: 1, details: { metric: 'Gait Stability', value: '65/100', risk: 'Moderate', recommendation: 'Fall prevention protocol.' } },
  { id: 'right-leg', label: 'R.Leg', x: '58%', y: '72%', status: 'stable', alerts: 0, details: { metric: 'Mobility', value: '71/100', risk: 'Low', recommendation: 'Continue physiotherapy.' } },
];

const stateConfigs = {
  healthy: { bodyColor: '#4edea3', glowColor: '#4edea3', label: 'Healthy', animClass: 'twin--healthy' },
  respiratory_distress: { bodyColor: '#EF4444', glowColor: '#EF4444', label: 'Respiratory Distress', animClass: 'twin--critical' },
  warning: { bodyColor: '#F59E0B', glowColor: '#F59E0B', label: 'Warning', animClass: 'twin--warning' },
  stable: { bodyColor: '#adc6ff', glowColor: '#adc6ff', label: 'Stable', animClass: 'twin--stable' },
};

export default function DigitalTwin({ patientState = 'stable', setPatientState, healthScore = 82, selectedOccupantIndex = 0 }) {
  const toast = useToast();
  const sensing = useSensing();
  const [activePin, setActivePin] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);

  const currentVitals = sensing.allVitals?.[selectedOccupantIndex] || {};

  // Derive patient state from live data when backend is connected
  const effectiveState = sensing.isConnected
    ? (currentVitals.stress === 'Stressed' || currentVitals.apnea_events > 0 || currentVitals.breathing_rate_bpm > 20 || (currentVitals.heart_rate_bpm && currentVitals.heart_rate_bpm > 95) ? 'respiratory_distress'
      : currentVitals.breathing_rate_bpm > 0 && currentVitals.breathing_rate_bpm < 10 ? 'warning'
      : 'stable')
    : patientState;

  const stateConf = stateConfigs[effectiveState] || stateConfigs.stable;

  // Build live body regions from sensing data
  const liveHr = currentVitals.heart_rate_bpm ? `${Math.round(currentVitals.heart_rate_bpm)} BPM` : '-- BPM';
  const liveBr = currentVitals.breathing_rate_bpm ? `${currentVitals.breathing_rate_bpm.toFixed(1)} BPM` : '-- BPM';
  const liveBp = currentVitals.blood_pressure_sys ? `${currentVitals.blood_pressure_sys}/${currentVitals.blood_pressure_dia}` : '--';
  const liveSleep = currentVitals.sleep_state || 'Awake';
  const liveMeditation = currentVitals.meditation_score ? `${Math.round(currentVitals.meditation_score)}/100` : '--';
  const liveHrv = currentVitals.hrv_sdnn ? `${currentVitals.hrv_sdnn.toFixed(1)} ms` : '--';
  const liveApnea = currentVitals.apnea_events != null ? `${currentVitals.apnea_events}` : '0';

  const hrStatus = (currentVitals.heart_rate_bpm > 95 || currentVitals.hrv_sdnn < 30) ? 'warning' : 'stable';
  const brStatus = (currentVitals.breathing_rate_bpm > 20 || currentVitals.apnea_events > 0) ? 'critical' : (currentVitals.breathing_rate_bpm > 0 && currentVitals.breathing_rate_bpm < 10 ? 'warning' : 'stable');
  const bpStatus = currentVitals.blood_pressure_sys > 130 ? 'warning' : 'stable';

  const liveBodyRegions = bodyRegions.map(r => {
    if (r.id === 'heart') return { ...r, status: hrStatus, details: { metric: 'HR / HRV', value: `${liveHr} / ${liveHrv}`, risk: hrStatus === 'warning' ? 'Moderate' : 'Low', recommendation: 'Live cardiac telemetry.' } };
    if (r.id === 'lungs') return { ...r, status: brStatus, details: { metric: 'Breathing / Apnea', value: `${liveBr} (${liveApnea} events)`, risk: brStatus === 'critical' ? 'High' : 'Low', recommendation: 'Live respiratory telemetry.' } };
    if (r.id === 'brain') return { ...r, status: 'stable', details: { metric: 'Sleep State', value: liveSleep, risk: 'Low', recommendation: `Meditation Score: ${liveMeditation}` } };
    if (r.id === 'left-arm' || r.id === 'right-arm') return { ...r, status: bpStatus, details: { metric: 'Blood Pressure', value: liveBp, risk: bpStatus === 'warning' ? 'Moderate' : 'Low', recommendation: 'Derived from pulse transit.' } };
    return r;
  });

  const isSearching = sensing.isConnected
    && !sensing.presence
    && sensing.confidence < 0.45
    && !sensing.heartRate
    && !sensing.breathingRate;

  const handlePinClick = (regionId) => {
    setActivePin(activePin === regionId ? null : regionId);
  };

  return (
    <div className={`digital-twin ${stateConf.animClass} ${isFullscreen ? 'digital-twin--fullscreen' : ''}`}>
      {/* Top Overlay Container */}
      <div className="digital-twin__top-overlay">
        {/* Top Left: Health Score Widget */}
        <HealthScoreWidget score={healthScore} status={effectiveState} />

        {/* Top Right: Simulate State Controls */}
        {setPatientState && (
          <div className="digital-twin__state-controls-wrapper">
            {sensing.isConnected && (
              <div className="digital-twin__live-override-overlay">
                <span className="material-icons" style={{ fontSize: '13px', marginRight: '4px' }}>sensors</span>
                LIVE WAVE FEED
              </div>
            )}
            <div
              className="digital-twin__state-controls glass-card"
              style={{
                opacity: sensing.isConnected ? 0.35 : 1,
                pointerEvents: sensing.isConnected ? 'none' : 'auto',
              }}
            >
              <span className="digital-twin__controls-label">Simulate:</span>
              {[
                { key: 'healthy', label: 'Healthy', color: '#22C55E' },
                { key: 'stable', label: 'Stable', color: '#3B82F6' },
                { key: 'warning', label: 'Warning', color: '#F59E0B' },
                { key: 'respiratory_distress', label: 'Distress', color: '#EF4444' },
              ].map(s => (
                <button
                  key={s.key}
                  className={`digital-twin__state-btn ${effectiveState === s.key ? 'active' : ''}`}
                  style={{ '--btn-color': s.color }}
                  onClick={() => setPatientState(s.key)}
                >
                  <span className="digital-twin__state-btn-dot" style={{ background: s.color }} />
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* State Status Banner */}
      <div className={`digital-twin__state-banner ${effectiveState === 'respiratory_distress' ? 'digital-twin__state-banner--critical' : ''}`}>
        <span className="digital-twin__state-dot" style={{ background: stateConf.bodyColor }} />
        <span style={{ color: stateConf.bodyColor }}>{stateConf.label}</span>
        {effectiveState === 'respiratory_distress' && (
          <span className="digital-twin__alert-text">ALERT: RESPIRATORY DISTRESS</span>
        )}
      </div>

      {/* Twin Stage */}
      <div className="digital-twin__stage">
        {/* Holographic Platform */}
        <div className="digital-twin__platform" />

        {isSearching && sensing.isConnected && (
          <div className="digital-twin__searching-overlay">
            <div className="searching-overlay__spinner" />
            <div className="searching-overlay__text">Searching for Signal...</div>
            <div className="searching-overlay__subtext">Targeting biological resonance peak</div>
          </div>
        )}

        {/* 3D Human Twin Canvas with embedded anatomical pins */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            '--body-color': stateConf.bodyColor,
            '--glow-color': stateConf.glowColor,
          }}
        >
          <div style={{ width: '340px', height: '600px', transform: `scale(${zoom})` }}>
            <Canvas camera={{ position: [0, 0, 8], fov: 50 }} style={{ cursor: 'grab' }}>
              <ambientLight intensity={1.8} />
              <directionalLight position={[5, 10, 5]} intensity={1.2} />
              <directionalLight position={[-5, -5, 5]} intensity={0.4} />
              <HumanTwinModel
                color={stateConf.bodyColor}
                wireframe={true}
                scaleFactor={0.75}
                animate={false}
                regions={liveBodyRegions}
                activePin={activePin}
                onPinClick={handlePinClick}
                enableControls={true}
              />
            </Canvas>
          </div>
        </div>

      </div>

      {/* Controls */}
      <div className="digital-twin__controls">
        <button className="btn-icon twin-ctrl glass-card" title="Zoom In" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
          <span className="material-icons icon-sm">zoom_in</span>
        </button>
        <button className="btn-icon twin-ctrl glass-card" title="Zoom Out" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
          <span className="material-icons icon-sm">zoom_out</span>
        </button>
        <button className="btn-icon twin-ctrl glass-card" title="Reset" onClick={() => { setZoom(1); setActivePin(null); }}>
          <span className="material-icons icon-sm">refresh</span>
        </button>
        <button className="btn-icon twin-ctrl glass-card" title="Fullscreen" onClick={() => setIsFullscreen(!isFullscreen)}>
          <span className="material-icons icon-sm">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </button>
        <button className="btn-icon twin-ctrl glass-card" title="Layer Toggle" onClick={() => toast('Toggling skeleton and nervous system layers...', 'info')}>
          <span className="material-icons icon-sm">layers</span>
        </button>
      </div>

      {/* Telemetry footer */}
      <div className="digital-twin__telemetry glass-card">
        <div className="telemetry-item">
          <span className="telemetry-label">SYNC</span>
          <span className="telemetry-value telemetry-value--green">ACTIVE</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-label">LATENCY</span>
          <span className="telemetry-value">0.2ms</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-label">SENSOR LOAD</span>
          <span className="telemetry-value">42%</span>
        </div>
        <div className="telemetry-divider" />
        <div className="telemetry-item">
          <span className="telemetry-label">TELEMETRY</span>
          <span className="telemetry-value telemetry-value--blue">ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
