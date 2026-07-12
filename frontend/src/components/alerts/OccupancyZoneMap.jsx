import React from 'react';
import { useSensing } from '../../hooks/SensingContext';
import './OccupancyZoneMap.css';

export default function OccupancyZoneMap() {
  const sensing = useSensing();
  const isLive = sensing?.isConnected;
  const presence = isLive ? sensing.presence : null;
  const occupantsCount = isLive ? sensing.estimatedPersons : null;

  // Derive current zone
  const currentZone = !isLive ? 'offline' : presence ? 'bedroom' : (occupantsCount > 0 ? 'living' : 'away');

  const zones = [
    { id: 'bedroom', label: 'Bedroom', x: 10, y: 10, w: 44, h: 36, current: currentZone === 'bedroom', time: presence ? '2h 14m' : '0m' },
    { id: 'bathroom', label: 'Bathroom', x: 58, y: 10, w: 32, h: 20, current: currentZone === 'bathroom', time: '12m' },
    { id: 'living', label: 'Living Room', x: 10, y: 50, w: 44, h: 30, current: currentZone === 'living', time: !presence && occupantsCount > 0 ? '5m' : '45m' },
    { id: 'kitchen', label: 'Kitchen', x: 58, y: 34, w: 32, h: 24, current: currentZone === 'kitchen', time: '18m' },
    { id: 'corridor', label: 'Corridor', x: 56, y: 8, w: 4, h: 52, current: currentZone === 'corridor', time: '5m' },
    { id: 'dining', label: 'Dining', x: 58, y: 62, w: 32, h: 18, current: currentZone === 'dining', restricted: true, time: '0m' },
  ];

  const currentX = currentZone === 'bedroom' ? 32 : (currentZone === 'living' ? 32 : null);
  const currentY = currentZone === 'bedroom' ? 28 : (currentZone === 'living' ? 65 : null);
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
          {[
            { x: 32, y: 28, r: 18, opacity: presence ? 0.6 : 0.1 },
            { x: 32, y: 65, r: 10, opacity: occupantsCount > 0 ? 0.4 : 0.1 },
            { x: 74, y: 20, r: 8, opacity: 0.1 },
          ].map((h, i) => (
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
          {currentX !== null && currentY !== null && (
            <g>
              <circle cx={currentX} cy={currentY} r="2.5" fill="#adc6ff" opacity="0.9">
                <animate attributeName="r" from="2" to="4" dur="1.5s" repeatCount="indefinite" />
                <animate attributeName="opacity" from="0.9" to="0.2" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <circle cx={currentX} cy={currentY} r="1.5" fill="#4d8eff" />
            </g>
          )}

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
          <span className="zone-map__stat-value" style={{ color: 'var(--primary)' }}>
            {currentZone === 'bedroom' ? 'Bedroom' : (currentZone === 'living' ? 'Living Room' : currentZone === 'offline' ? 'Offline' : 'Away')}
          </span>
        </div>
        <div className="zone-map__stat">
          <span className="zone-map__stat-label">Time In Zone</span>
          <span className="zone-map__stat-value">{presence ? 'Live' : isLive ? '0m' : '--'}</span>
        </div>
        <div className="zone-map__stat">
          <span className="zone-map__stat-label">Wandering</span>
          <span className="zone-map__stat-value" style={{ color: 'var(--secondary)' }}>
            {!isLive ? '--' : !presence && occupantsCount > 1 ? 'High Activity' : 'None'}
          </span>
        </div>
      </div>
    </div>
  );
}
