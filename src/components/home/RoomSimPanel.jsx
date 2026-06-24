import React, { useEffect, useState } from 'react';
import './RoomSimPanel.css';
import { Canvas } from '@react-three/fiber';
import HumanTwinModel from '../twin/HumanTwinModel';

const STATES = ['resting', 'moving', 'sleeping'];

const STATE_META = {
  resting: {
    label: 'Resting',
    icon: 'self_improvement',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.1)',
    border: 'rgba(59,130,246,0.28)',
    accent: '#93C5FD',
  },
  moving: {
    label: 'Moving',
    icon: 'directions_walk',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.1)',
    border: 'rgba(245,158,11,0.28)',
    accent: '#FBBF24',
  },
  sleeping: {
    label: 'Sleeping',
    icon: 'bedtime',
    color: '#4edea3',
    bg: 'rgba(78,222,163,0.1)',
    border: 'rgba(78,222,163,0.28)',
    accent: '#6EE7B7',
  },
};

export default function RoomSimPanel({ isNightMode = false }) {
  const [stateIdx, setStateIdx] = useState(isNightMode ? 2 : 0);
  const [respiration, setRespiration] = useState(14.2);
  const [zoom, setZoom] = useState(1.12);
  const [activePin, setActivePin] = useState(null);

  useEffect(() => {
    const id = setInterval(() => {
      setStateIdx((i) => (i + 1) % STATES.length);
    }, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setStateIdx(isNightMode ? 2 : 0);
  }, [isNightMode]);

  useEffect(() => {
    const id = setInterval(() => {
      setRespiration((prev) => {
        const next = prev + (Math.random() - 0.5) * 0.5;
        return Math.round(Math.min(18, Math.max(12, next)) * 10) / 10;
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    setZoom(isNightMode ? 1.08 : 1.12);
  }, [isNightMode]);

  const activity = STATES[stateIdx];
  const meta = STATE_META[activity];
  const isSleeping = activity === 'sleeping';

  const clampZoom = (nextZoom) => Math.min(1.8, Math.max(0.82, Math.round(nextZoom * 100) / 100));

  const handleWheel = (event) => {
    if (!event.ctrlKey && !event.metaKey) return;
    event.preventDefault();
    setZoom((current) => clampZoom(current + (event.deltaY > 0 ? -0.08 : 0.08)));
  };

  // Dynamic pin data based on current activity state
  const bodyRegions = [
    {
      id: 'brain',
      label: 'Brain',
      status: isSleeping ? 'stable' : 'stable',
      details: {
        metric: 'Cognitive Score',
        value: isSleeping ? 'Rest' : '88/100',
        risk: 'Low',
        recommendation: isSleeping ? 'Deep sleep detected.' : 'Continue routine monitoring.',
      },
    },
    {
      id: 'lungs',
      label: 'Lungs',
      status: isSleeping ? 'warning' : 'stable',
      details: {
        metric: 'Breathing Rate',
        value: isSleeping ? `${respiration.toFixed(1)} brpm` : 'Stable',
        risk: isSleeping ? 'Monitor' : 'Low',
        recommendation: isSleeping ? 'Monitoring for apnea events.' : 'Normal respiratory rate.',
      },
    },
    {
      id: 'heart',
      label: 'Heart',
      status: activity === 'moving' ? 'warning' : 'stable',
      details: {
        metric: 'Heart Rate',
        value: activity === 'moving' ? '96 BPM' : '72 BPM',
        risk: activity === 'moving' ? 'Elevated' : 'Low',
        recommendation: activity === 'moving' ? 'Elevated due to activity.' : 'Normal sinus rhythm.',
      },
    },
    {
      id: 'abdomen',
      label: 'Core',
      status: activity === 'moving' ? 'warning' : 'stable',
      details: {
        metric: 'Core Activity',
        value: activity === 'moving' ? 'Active' : 'Steady',
        risk: 'Low',
        recommendation: activity === 'moving' ? 'Movement detected.' : 'Stable core metrics.',
      },
    },
    {
      id: 'left-arm',
      label: 'L. Arm',
      status: 'stable',
      details: {
        metric: 'Blood Pressure',
        value: '118/76',
        risk: 'Low',
        recommendation: 'Normal.',
      },
    },
    {
      id: 'right-arm',
      label: 'R. Arm',
      status: 'stable',
      details: {
        metric: 'Blood Pressure',
        value: '120/78',
        risk: 'Low',
        recommendation: 'Normal.',
      },
    },
    {
      id: 'left-leg',
      label: 'L. Leg',
      status: 'warning',
      details: {
        metric: 'Gait Stability',
        value: 'Gait 65',
        risk: 'Moderate',
        recommendation: 'Fall prevention protocol.',
      },
    },
    {
      id: 'right-leg',
      label: 'R. Leg',
      status: 'stable',
      details: {
        metric: 'Mobility',
        value: 'Mobility 71',
        risk: 'Low',
        recommendation: 'Continue physiotherapy.',
      },
    },
  ];

  const handlePinClick = (id) => setActivePin(prev => prev === id ? null : id);

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
          <div
            className="room-sim-state-pill"
            style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
          >
            <span className="material-icons room-sim-state-pill__icon">{meta.icon}</span>
            {meta.label}
          </div>
        </div>
      </div>

      <div className="room-sim-body">
        <div className="room-sim-stage-viewport" onWheel={handleWheel}>
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

          {/* Full-size 3D canvas with embedded 3D pins */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <div style={{ width: '100%', height: '100%', transform: `scale(${zoom})` }}>
              <Canvas
                camera={{ position: [0, 0, 8], fov: 50 }}
                style={{ cursor: 'grab' }}
              >
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
                  enableControls={true}
                />
              </Canvas>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
