import React from 'react';
import './OccupancyZoneMap.css';

const zones = [
  { id: 'bedroom', label: 'Bedroom', x: 10, y: 10, w: 44, h: 36, current: true, time: '2h 14m' },
  { id: 'bathroom', label: 'Bathroom', x: 58, y: 10, w: 32, h: 20, current: false, time: '12m' },
  { id: 'living', label: 'Living Room', x: 10, y: 50, w: 44, h: 30, current: false, time: '45m' },
  { id: 'kitchen', label: 'Kitchen', x: 58, y: 34, w: 32, h: 24, current: false, time: '18m' },
  { id: 'corridor', label: 'Corridor', x: 56, y: 8, w: 4, h: 52, current: false, time: '5m' },
  { id: 'dining', label: 'Dining', x: 58, y: 62, w: 32, h: 18, current: false, restricted: true, time: '0m' },
];

const heatPositions = [
  { x: 32, y: 28, r: 18, opacity: 0.6 },
  { x: 32, y: 65, r: 10, opacity: 0.3 },
  { x: 74, y: 20, r: 8, opacity: 0.2 },
];

export default function OccupancyZoneMap() {
  return (
    <div className="zone-map">
      <div className="zone-map__header">
        <span className="zone-map__title">
          <span className="material-icons icon-sm">map</span>
          Occupancy Zone Map
        </span>
        <div className="zone-map__legend">
          <span className="zone-map__legend-item">
            <span style={{ background: 'var(--primary)', borderRadius: '50%', width: 7, height: 7, display: 'inline-block' }} />
            Current
          </span>
          <span className="zone-map__legend-item">
            <span style={{ background: 'var(--emergency-red)', borderRadius: '50%', width: 7, height: 7, display: 'inline-block' }} />
            Restricted
          </span>
        </div>
      </div>

      <div className="zone-map__canvas">
        <svg viewBox="0 0 100 90" className="zone-map__svg">
          {/* Heatmap blobs */}
          {heatPositions.map((h, i) => (
            <circle key={i} cx={h.x} cy={h.y} r={h.r}
              fill="rgba(245, 158, 11, 0.15)"
              style={{ filter: 'blur(4px)', opacity: h.opacity }}
            />
          ))}

          {/* Zones */}
          {zones.map(zone => (
            <g key={zone.id}>
              <rect
                x={zone.x} y={zone.y} width={zone.w} height={zone.h}
                rx="2"
                fill={zone.restricted ? 'rgba(239,68,68,0.08)' : zone.current ? 'rgba(77,142,255,0.1)' : 'rgba(255,255,255,0.03)'}
                stroke={zone.restricted ? '#EF4444' : zone.current ? '#4d8eff' : 'rgba(48,54,61,0.8)'}
                strokeWidth="0.5"
                strokeDasharray={zone.restricted ? '2 1' : 'none'}
              />
              <text
                x={zone.x + zone.w / 2} y={zone.y + 5}
                textAnchor="middle"
                fontSize="3.5"
                fill={zone.current ? '#adc6ff' : zone.restricted ? '#EF4444' : 'rgba(194,198,214,0.6)'}
                fontWeight="600"
              >
                {zone.label}
              </text>
              <text
                x={zone.x + zone.w / 2} y={zone.y + zone.h - 3}
                textAnchor="middle"
                fontSize="2.8"
                fill="rgba(140,144,159,0.8)"
              >
                {zone.time}
              </text>
            </g>
          ))}

          {/* Current Position indicator */}
          <circle cx="32" cy="28" r="2.5" fill="#adc6ff" opacity="0.9">
            <animate attributeName="r" from="2" to="4" dur="1.5s" repeatCount="indefinite" />
            <animate attributeName="opacity" from="0.9" to="0.2" dur="1.5s" repeatCount="indefinite" />
          </circle>
          <circle cx="32" cy="28" r="1.5" fill="#4d8eff" />

          {/* Path history dotted */}
          <polyline
            points="74,20 60,20 56,35 32,65 32,28"
            fill="none"
            stroke="rgba(173,198,255,0.3)"
            strokeWidth="0.5"
            strokeDasharray="1 1"
          />
        </svg>
      </div>

      {/* Zone Stats */}
      <div className="zone-map__stats">
        <div className="zone-map__stat">
          <span className="zone-map__stat-label">Current Zone</span>
          <span className="zone-map__stat-value" style={{ color: 'var(--primary)' }}>Bedroom</span>
        </div>
        <div className="zone-map__stat">
          <span className="zone-map__stat-label">Time In Zone</span>
          <span className="zone-map__stat-value">2h 14m</span>
        </div>
        <div className="zone-map__stat">
          <span className="zone-map__stat-label">Wandering</span>
          <span className="zone-map__stat-value" style={{ color: 'var(--secondary)' }}>None</span>
        </div>
      </div>
    </div>
  );
}
