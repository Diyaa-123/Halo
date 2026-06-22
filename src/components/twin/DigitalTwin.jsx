import React, { useEffect, useRef, useState } from 'react';
import HealthScoreWidget from './HealthScoreWidget';
import BodyRegionPin from './BodyRegionPin';
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

export default function DigitalTwin({ patientState = 'stable', healthScore = 82 }) {
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
      {/* Health Score Widget */}
      <div className="digital-twin__score">
        <HealthScoreWidget score={healthScore} status={patientState} />
      </div>

      {/* State Status Banner */}
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

        {/* Human Figure — CSS Art Representation */}
        <div
          className={`digital-twin__figure ${stateConf.animClass}`}
          style={{
            transform: `scale(${zoom}) rotateY(${rotation}rad)`,
            '--body-color': stateConf.bodyColor,
            '--glow-color': stateConf.glowColor,
          }}
        >
          {/* Body SVG */}
          <svg className="digital-twin__body-svg" viewBox="0 0 140 360" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <radialGradient id="bodyGrad" cx="50%" cy="40%" r="60%">
                <stop offset="0%" stopColor={stateConf.bodyColor} stopOpacity="0.6" />
                <stop offset="100%" stopColor={stateConf.bodyColor} stopOpacity="0.15" />
              </radialGradient>
              <filter id="bodyGlow">
                <feGaussianBlur stdDeviation="4" result="blur" />
                <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
              </filter>
            </defs>
            {/* Head */}
            <ellipse cx="70" cy="30" rx="22" ry="26" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1.5" filter="url(#bodyGlow)" />
            {/* Neck */}
            <rect x="62" y="54" width="16" height="14" rx="4" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1" />
            {/* Torso */}
            <path d="M35 68 Q30 80 30 120 Q30 140 35 145 L105 145 Q110 140 110 120 Q110 80 105 68 Z" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1.5" />
            {/* Left Arm */}
            <path d="M35 72 Q20 90 18 130 Q17 145 22 155" stroke={stateConf.bodyColor} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Right Arm */}
            <path d="M105 72 Q120 90 122 130 Q123 145 118 155" stroke={stateConf.bodyColor} strokeWidth="10" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Left Hand */}
            <ellipse cx="21" cy="160" rx="8" ry="10" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1" />
            {/* Right Hand */}
            <ellipse cx="119" cy="160" rx="8" ry="10" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1" />
            {/* Pelvis */}
            <path d="M35 145 Q30 160 32 170 L108 170 Q110 160 105 145 Z" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1" />
            {/* Left Leg */}
            <path d="M52 170 Q48 210 46 260 Q45 290 48 310" stroke={stateConf.bodyColor} strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Right Leg */}
            <path d="M88 170 Q92 210 94 260 Q95 290 92 310" stroke={stateConf.bodyColor} strokeWidth="14" fill="none" strokeLinecap="round" opacity="0.7" />
            {/* Left Foot */}
            <ellipse cx="48" cy="318" rx="10" ry="14" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1" />
            {/* Right Foot */}
            <ellipse cx="92" cy="318" rx="10" ry="14" fill="url(#bodyGrad)" stroke={stateConf.bodyColor} strokeWidth="1" />

            {/* Heartbeat line on chest */}
            {patientState !== 'respiratory_distress' && (
              <polyline
                points="40,108 50,108 55,95 60,120 65,102 70,108 90,108 95,100 100,115"
                fill="none"
                stroke={stateConf.bodyColor}
                strokeWidth="1.5"
                opacity="0.6"
                strokeLinecap="round"
              />
            )}
            {/* Respiratory distress: red chest glow */}
            {patientState === 'respiratory_distress' && (
              <ellipse cx="70" cy="108" rx="28" ry="20" fill="rgba(239,68,68,0.2)" className="twin__chest-pulse" />
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
        <button className="btn-icon twin-ctrl" title="Zoom In" onClick={() => setZoom(z => Math.min(z + 0.2, 2))}>
          <span className="material-icons icon-sm">zoom_in</span>
        </button>
        <button className="btn-icon twin-ctrl" title="Zoom Out" onClick={() => setZoom(z => Math.max(z - 0.2, 0.5))}>
          <span className="material-icons icon-sm">zoom_out</span>
        </button>
        <button className="btn-icon twin-ctrl" title="Reset" onClick={() => { setZoom(1); setActivePin(null); }}>
          <span className="material-icons icon-sm">refresh</span>
        </button>
        <button className="btn-icon twin-ctrl" title="Fullscreen" onClick={() => setIsFullscreen(!isFullscreen)}>
          <span className="material-icons icon-sm">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
        </button>
        <button className="btn-icon twin-ctrl" title="Layer Toggle">
          <span className="material-icons icon-sm">layers</span>
        </button>
      </div>

      {/* Telemetry footer */}
      <div className="digital-twin__telemetry">
        <div className="telemetry-item">
          <span className="telemetry-label">SYNC</span>
          <span className="telemetry-value telemetry-value--green">ACTIVE</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">LATENCY</span>
          <span className="telemetry-value">0.2ms</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">SENSOR LOAD</span>
          <span className="telemetry-value">42%</span>
        </div>
        <div className="telemetry-item">
          <span className="telemetry-label">TELEMETRY</span>
          <span className="telemetry-value telemetry-value--blue">ENCRYPTED</span>
        </div>
      </div>
    </div>
  );
}
