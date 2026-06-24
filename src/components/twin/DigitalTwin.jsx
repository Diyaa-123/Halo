import React, { useEffect, useRef, useState } from 'react';
import HealthScoreWidget from './HealthScoreWidget';
import BodyRegionPin from './BodyRegionPin';
import { useToast } from '../layout/ToastContext';
import './DigitalTwin.css';

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
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoom, setZoom] = useState(1);
  const rafRef = useRef(null);
  const stateConf = stateConfigs[patientState] || stateConfigs.stable;

  // Idle slow rotation
  useEffect(() => {
    let angle = 0;
    const animate = () => {
      angle += 0.02; // ~3 deg/sec at 60fps
      setRotation(angle);
      rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

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

        {/* Sleek Minimalist Human Figure */}
        <div
          className={`digital-twin__figure ${stateConf.animClass}`}
          style={{
            transform: `scale(${zoom}) rotateY(${rotation}rad)`,
            '--body-color': stateConf.bodyColor,
            '--glow-color': stateConf.glowColor,
          }}
        >
          {/* Detailed Hologram Silhouette SVG */}
          <svg className="digital-twin__body-svg" viewBox="0 0 200 450" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <linearGradient id="holoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor={stateConf.bodyColor} stopOpacity="0.8" />
                <stop offset="50%" stopColor={stateConf.bodyColor} stopOpacity="0.3" />
                <stop offset="100%" stopColor={stateConf.bodyColor} stopOpacity="0.8" />
              </linearGradient>
              <filter id="holoGlow">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Minimalist Tech Outline */}
            <path 
              d="M100 20 C112 20 120 30 120 45 C120 60 110 70 100 70 C90 70 80 60 80 45 C80 30 88 20 100 20 Z
                 M100 75 C120 75 140 80 150 90 L165 180 L145 185 L135 120 L135 230 L115 420 L95 420 L95 240 L85 420 L65 420 L85 230 L85 120 L75 185 L55 180 L70 90 C80 80 100 75 100 75 Z"
              fill="none" 
              stroke="url(#holoGrad)" 
              strokeWidth="2.5" 
              filter="url(#holoGlow)"
              strokeLinejoin="round"
            />
            {/* Mesh Lines Overlay for 3D feel */}
            <path d="M85 120 Q100 135 135 120 M85 150 Q100 165 135 150 M85 180 Q100 195 135 180 M90 210 Q100 220 130 210" fill="none" stroke={stateConf.bodyColor} strokeOpacity="0.2" strokeWidth="1" />
            <path d="M110 75 L110 220 M90 75 L90 220" fill="none" stroke={stateConf.bodyColor} strokeOpacity="0.2" strokeWidth="1" />
            
            {/* Core Energy Line */}
            <line x1="100" y1="80" x2="100" y2="230" stroke={stateConf.bodyColor} strokeWidth="4" opacity="0.4" filter="url(#holoGlow)" />

            {/* Respiratory distress: red chest glow */}
            {patientState === 'respiratory_distress' && (
              <ellipse cx="100" cy="120" rx="35" ry="25" fill="rgba(239,68,68,0.3)" className="twin__chest-pulse" filter="url(#holoGlow)" />
            )}
          </svg>
        </div>

        {/* Body Region Pins */}
        {bodyRegions.map(region => (
          <BodyRegionPin
            key={region.id}
            region={region}
            isActive={activePin === region.id}
            onClick={() => handlePinClick(region.id)}
          />
        ))}
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
