import React, { useEffect, useMemo, useState } from 'react';
import './RoomSimPanel.css';
import { Canvas } from '@react-three/fiber';
import HumanTwinModel from '../twin/HumanTwinModel';
import { useSensing } from '../../hooks/SensingContext';

const STATE_META = {
  offline: {
    label: 'Offline',
    icon: 'cloud_off',
    color: '#9CA3AF',
    bg: 'rgba(156,163,175,0.1)',
    border: 'rgba(156,163,175,0.28)',
  },
  resting: {
    label: 'Resting',
    icon: 'self_improvement',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.28)',
  },
  moving: {
    label: 'Moving',
    icon: 'directions_walk',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.28)',
  },
  sleeping: {
    label: 'Sleeping',
    icon: 'bedtime',
    color: '#4edea3',
    bg: 'rgba(78,222,163,0.1)',
    border: 'rgba(78,222,163,0.28)',
  },
};

function clampZoom(value) {
  return Math.min(1.8, Math.max(0.82, Math.round(value * 100) / 100));
}

export default function RoomSimPanel({ isNightMode = false }) {
  const sensing = useSensing();
  const [zoom, setZoom] = useState(1.08);
  const [activePin, setActivePin] = useState(null);

  useEffect(() => {
    setZoom(isNightMode ? 1.08 : 1.12);
  }, [isNightMode]);

  const live = sensing.isConnected;
  const activity = useMemo(() => {
    if (!live) return 'offline';
    if (!sensing.presence) return 'resting';
    if (sensing.motionLevel === 'active') return 'moving';
    if (isNightMode) return 'sleeping';
    return 'resting';
  }, [isNightMode, live, sensing.presence, sensing.motionLevel]);

  const meta = STATE_META[activity] || STATE_META.offline;
  const breathing = sensing.breathingRate;
  const heartRate = sensing.heartRate;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;

  const bodyRegions = [
    {
      id: 'brain',
      label: 'Brain',
      status: live ? 'stable' : 'offline',
      details: {
        metric: 'Cognitive signal',
        value: live ? (confidence != null ? `${confidence}% confidence` : 'Live feed active') : 'Unavailable',
        risk: live ? 'Live' : 'Offline',
        recommendation: live ? 'Derived from current attribution confidence.' : 'Connect backend feed to populate metrics.',
      },
    },
    {
      id: 'lungs',
      label: 'Lungs',
      status: breathing != null ? (breathing > 20 ? 'critical' : isNightMode ? 'stable' : 'warning') : 'offline',
      details: {
        metric: 'Breathing rate',
        value: breathing != null ? `${breathing.toFixed(1)} brpm` : 'Unavailable',
        risk: breathing != null ? (breathing > 20 ? 'High' : 'Low') : 'Unknown',
        recommendation: breathing != null ? 'Live respiration anchor from CSI feed.' : 'No respiration data yet.',
      },
    },
    {
      id: 'heart',
      label: 'Heart',
      status: heartRate != null ? (heartRate > 95 ? 'warning' : 'stable') : 'offline',
      details: {
        metric: 'Heart rate',
        value: heartRate != null ? `${Math.round(heartRate)} BPM` : 'Unavailable',
        risk: heartRate != null ? (heartRate > 95 ? 'Elevated' : 'Low') : 'Unknown',
        recommendation: heartRate != null ? 'From live backend feed.' : 'Waiting for live data.',
      },
    },
    {
      id: 'abdomen',
      label: 'Core',
      status: sensing.motionLevel === 'active' ? 'warning' : 'stable',
      details: {
        metric: 'Motion context',
        value: sensing.motionLevel || 'absent',
        risk: sensing.motionLevel === 'active' ? 'Elevated' : 'Low',
        recommendation: sensing.motionLevel === 'active' ? 'Movement detected in live CSI.' : 'Motion is currently low.',
      },
    },
    {
      id: 'left-arm',
      label: 'Context',
      status: live ? 'stable' : 'offline',
      details: {
        metric: 'Occupancy',
        value: sensing.estimatedPersons != null ? `${sensing.estimatedPersons} detected` : 'Unavailable',
        risk: live ? 'Live' : 'Unknown',
        recommendation: 'Occupancy count comes from backend only.',
      },
    },
    {
      id: 'right-arm',
      label: 'Source',
      status: live ? 'stable' : 'offline',
      details: {
        metric: 'Stream source',
        value: sensing.source?.toUpperCase() || 'N/A',
        risk: live ? 'Live' : 'Unknown',
        recommendation: sensing.streamMessage || 'No extra notes.',
      },
    },
  ];

  const handleWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom((current) => clampZoom(current + (event.deltaY > 0 ? -0.08 : 0.08)));
  };

  const handlePinClick = (id) => setActivePin((prev) => (prev === id ? null : id));

  const isSearching = sensing.isConnected
    && !sensing.presence
    && sensing.confidence < 0.45
    && !sensing.heartRate
    && !sensing.breathingRate;

  return (
    <div className="glass-card room-sim-card human-twin">
      <div className="room-sim-header">
        <div className="room-sim-title">
          <span className="material-icons room-sim-title__icon">accessibility_new</span>
          <div>
            <h3>Human Body Twin</h3>
          </div>
        </div>

        <div className="room-sim-header__status">
          <div className="room-sim-state-pill" style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}>
            <span className="material-icons room-sim-state-pill__icon">{meta.icon}</span>
            {meta.label}
          </div>
        </div>
      </div>

      <div className="room-sim-body">
        <div className="room-sim-stage-viewport" onWheel={handleWheel}>
          {isSearching && (
            <div className="room-sim__searching-overlay">
              <div className="searching-overlay__spinner" />
              <div className="searching-overlay__text">Searching for Signal...</div>
              <div className="searching-overlay__subtext">Establishing physical body presence locks</div>
            </div>
          )}
          <div className="room-sim-float-controls">
            <button className="btn-icon room-sim-icon-btn" title="Zoom out" onClick={() => setZoom((z) => clampZoom(z - 0.12))}>
              <span className="material-icons icon-sm">zoom_out</span>
            </button>
            <button className="btn-icon room-sim-icon-btn" title="Reset zoom" onClick={() => setZoom(isNightMode ? 1.08 : 1.12)}>
              <span className="material-icons icon-sm">center_focus_strong</span>
            </button>
            <button className="btn-icon room-sim-icon-btn" title="Zoom in" onClick={() => setZoom((z) => clampZoom(z + 0.12))}>
              <span className="material-icons icon-sm">zoom_in</span>
            </button>
          </div>

          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
              <Canvas camera={{ position: [0, 0, 8], fov: 50 }} style={{ cursor: 'grab' }}>
                <ambientLight intensity={1.8} />
                <directionalLight position={[5, 10, 5]} intensity={1.2} />
                <directionalLight position={[-5, -5, 5]} intensity={0.4} />
                <HumanTwinModel
                  color={meta.color}
                  wireframe={false}
                  scaleFactor={0.75}
                  animate={false}
                  regions={bodyRegions}
                  activePin={activePin}
                  onPinClick={handlePinClick}
                  enableControls
                />
              </Canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
