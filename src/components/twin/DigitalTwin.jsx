import React, { useRef, useState } from 'react';
import HealthScoreWidget from './HealthScoreWidget';
import { useToast } from '../layout/ToastContext';
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

export default function DigitalTwin({ patientState = 'stable', setPatientState, healthScore = 82 }) {
  const toast = useToast();
  const [activePin, setActivePin] = useState(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const stateConf = stateConfigs[patientState] || stateConfigs.stable;


  const handlePinClick = (regionId) => {
    setActivePin(activePin === regionId ? null : regionId);
  };


  return (
    <div className={`digital-twin ${stateConf.animClass} ${isFullscreen ? 'digital-twin--fullscreen' : ''}`}>
      {/* Top Overlay Container */}
      <div className="digital-twin__top-overlay">
        {/* Top Left: Health Score Widget */}
        <HealthScoreWidget score={healthScore} status={patientState} />

        {/* Top Right: Simulate State Controls */}
        {setPatientState && (
          <div className="digital-twin__state-controls glass-card">
            <span className="digital-twin__controls-label">Simulate:</span>
            {[
              { key: 'healthy', label: 'Healthy', color: '#22C55E' },
              { key: 'stable', label: 'Stable', color: '#3B82F6' },
              { key: 'warning', label: 'Warning', color: '#F59E0B' },
              { key: 'respiratory_distress', label: 'Distress', color: '#EF4444' },
            ].map(s => (
              <button
                key={s.key}
                className={`digital-twin__state-btn ${patientState === s.key ? 'active' : ''}`}
                style={{ '--btn-color': s.color }}
                onClick={() => setPatientState(s.key)}
              >
                <span className="digital-twin__state-btn-dot" style={{ background: s.color }} />
                {s.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* State Status Banner - Positioned below the twin controls or absolutely */}
      <div className={`digital-twin__state-banner ${patientState === 'respiratory_distress' ? 'digital-twin__state-banner--critical' : ''}`}>
        <span className="digital-twin__state-dot" style={{ background: stateConf.bodyColor }} />
        <span style={{ color: stateConf.bodyColor }}>{stateConf.label}</span>
        {patientState === 'respiratory_distress' && (
          <span className="digital-twin__alert-text">ALERT: RESPIRATORY DISTRESS</span>
        )}
      </div>

      {/* Twin Stage */}
      <div className="digital-twin__stage">
        {/* Holographic Platform */}
        <div className="digital-twin__platform" />

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
                regions={bodyRegions}
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
