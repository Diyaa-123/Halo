import React, { useEffect, useState } from 'react';
import './RoomSimPanel.css';

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

function BodyPin({ x, y, label, value, tone, pulse = false }) {
  return (
    <g transform={`translate(${x}, ${y})`} className="human-twin__pin-group" style={{ color: tone }}>
      {pulse && <circle r="16" className="human-twin__pin-pulse" stroke={tone} />}
      <circle r="7" className="human-twin__pin-core" fill={tone} />
      <text y="-12" textAnchor="middle" className="human-twin__pin-label" fill={tone}>
        {label}
      </text>
      <text y="22" textAnchor="middle" className="human-twin__pin-value">
        {value}
      </text>
    </g>
  );
}

export default function RoomSimPanel({ isNightMode = false }) {
  const [stateIdx, setStateIdx] = useState(isNightMode ? 2 : 0);
  const [respiration, setRespiration] = useState(14.2);

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

  const activity = STATES[stateIdx];
  const meta = STATE_META[activity];
  const isSleeping = activity === 'sleeping';
  const pulseTone = isSleeping ? '#4edea3' : activity === 'moving' ? '#F59E0B' : '#3B82F6';

  return (
    <div className="glass-card room-sim-card human-twin">
      <div className="room-sim-header">
        <div className="room-sim-title">
          <span className="material-icons" style={{ fontSize: 16, color: 'var(--primary)' }}>
            accessibility_new
          </span>
          <div>
            <h3>Human Body Twin</h3>
            <p>Front view - biometric posture and organ activity</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div
            className="room-sim-state-pill"
            style={{ background: meta.bg, border: `1px solid ${meta.border}`, color: meta.color }}
          >
            <span className="material-icons" style={{ fontSize: 12 }}>
              {meta.icon}
            </span>
            {meta.label}
          </div>
          <div style={{ fontSize: 9, color: 'var(--outline)' }}>auto-cycles 5s</div>
        </div>
      </div>

      <div className="room-sim-svg-wrap human-twin__stage">
        <svg viewBox="0 0 440 340" preserveAspectRatio="xMidYMid meet" className="human-twin__svg">
          <defs>
            <radialGradient id="humanGlow" cx="50%" cy="42%" r="58%">
              <stop offset="0%" stopColor={meta.color} stopOpacity="0.28" />
              <stop offset="55%" stopColor={meta.color} stopOpacity="0.12" />
              <stop offset="100%" stopColor={meta.color} stopOpacity="0" />
            </radialGradient>
            <linearGradient id="humanSkin" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f4d6c1" />
              <stop offset="42%" stopColor="#e9bea5" />
              <stop offset="100%" stopColor="#c78f75" />
            </linearGradient>
            <linearGradient id="humanShade" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="rgba(255,255,255,0.35)" />
              <stop offset="45%" stopColor="rgba(255,255,255,0.05)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.16)" />
            </linearGradient>
            <filter id="humanSoftGlow">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <rect x="0" y="0" width="440" height="340" rx="18" fill="rgba(11,14,20,0.02)" />
          <ellipse cx="220" cy="190" rx="130" ry="150" fill="url(#humanGlow)" opacity="0.9" />

          <g className={`human-twin__figure human-twin__figure--${activity}`}>
            <ellipse cx="220" cy="64" rx="29" ry="34" fill="url(#humanSkin)" stroke="rgba(124,92,70,0.35)" strokeWidth="1.5" />
            <ellipse cx="211" cy="58" rx="7" ry="10" fill="rgba(255,255,255,0.18)" />
            <path
              d="M208 86 C210 94 212 102 220 102 C228 102 230 94 232 86 L232 76 L208 76 Z"
              fill="url(#humanSkin)"
              stroke="rgba(124,92,70,0.26)"
              strokeWidth="1"
            />

            <path
              d="M186 96 C191 86 202 80 220 80 C238 80 249 86 254 96 C261 109 264 123 263 140
                 C261 161 257 175 255 189 C252 208 255 226 259 243 C263 260 263 279 256 297
                 C248 316 234 325 220 328 C206 325 192 316 184 297 C177 279 177 260 181 243
                 C185 226 188 208 185 189 C183 175 179 161 177 140 C176 123 179 109 186 96 Z"
              fill="url(#humanSkin)"
              stroke="rgba(124,92,70,0.34)"
              strokeWidth="1.8"
            />

            <path
              d="M186 101 C195 95 206 92 220 92 C234 92 245 95 254 101"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="8"
              strokeLinecap="round"
            />

            <path
              d="M186 110 C177 119 167 135 159 152 C151 169 145 185 140 200 C136 212 132 223 127 234"
              fill="none"
              stroke="url(#humanSkin)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#humanSoftGlow)"
            />
            <path
              d="M254 110 C263 119 273 135 281 152 C289 169 295 185 300 200 C304 212 308 223 313 234"
              fill="none"
              stroke="url(#humanSkin)"
              strokeWidth="15"
              strokeLinecap="round"
              strokeLinejoin="round"
              filter="url(#humanSoftGlow)"
            />

            <path
              d="M160 236 C149 255 140 275 136 294 C133 309 133 320 136 328"
              fill="none"
              stroke="url(#humanSkin)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M280 236 C291 255 300 275 304 294 C307 309 307 320 304 328"
              fill="none"
              stroke="url(#humanSkin)"
              strokeWidth="16"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M220 104 C201 104 188 108 180 119 C172 130 169 147 171 167 C173 184 175 199 172 216
                 C169 233 161 249 153 264 C147 274 142 286 139 297"
              fill="none"
              stroke="rgba(124,92,70,0.34)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M220 104 C239 104 252 108 260 119 C268 130 271 147 269 167 C267 184 265 199 268 216
                 C271 233 279 249 287 264 C293 274 298 286 301 297"
              fill="none"
              stroke="rgba(124,92,70,0.34)"
              strokeWidth="11"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            <path
              d="M154 122 C164 116 173 116 180 121"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="8"
              strokeLinecap="round"
            />
            <path
              d="M286 122 C276 116 267 116 260 121"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="8"
              strokeLinecap="round"
            />

            <ellipse cx="220" cy="124" rx="43" ry="52" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />
            <ellipse cx="220" cy="172" rx="44" ry="60" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <path
              d="M198 156 C205 148 212 144 220 144 C228 144 235 148 242 156"
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <path
              d="M188 190 C197 185 206 183 220 183 C234 183 243 185 252 190"
              fill="none"
              stroke="rgba(255,255,255,0.12)"
              strokeWidth="2"
              strokeLinecap="round"
            />

            {isSleeping && (
              <ellipse
                cx="220"
                cy="156"
                rx="42"
                ry="28"
                fill="rgba(78,222,163,0.16)"
                className="human-twin__organ-pulse"
              />
            )}
            {activity === 'moving' && (
              <ellipse
                cx="220"
                cy="156"
                rx="44"
                ry="30"
                fill="rgba(245,158,11,0.14)"
                className="human-twin__organ-pulse"
              />
            )}

            <ellipse cx="220" cy="160" rx="76" ry="118" fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
            <ellipse cx="220" cy="204" rx="62" ry="108" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
            <path
              d="M198 202 C205 195 212 191 220 191 C228 191 235 195 242 202"
              fill="none"
              stroke="rgba(255,255,255,0.14)"
              strokeWidth="2.4"
              strokeLinecap="round"
            />
          </g>

          <BodyPin x={220} y={70} label="BRAIN" value={isSleeping ? 'rest' : '88/100'} tone={meta.accent} pulse={isSleeping} />
          <BodyPin x={220} y={142} label="LUNGS" value={isSleeping ? `${respiration.toFixed(1)} brpm` : 'stable'} tone={meta.accent} pulse={isSleeping} />
          <BodyPin x={197} y={160} label="HEART" value={activity === 'moving' ? '96 bpm' : '72 bpm'} tone={meta.accent} pulse={activity === 'moving'} />
          <BodyPin x={220} y={214} label="CORE" value={activity === 'moving' ? 'active' : 'steady'} tone={meta.accent} pulse={activity === 'moving'} />
          <BodyPin x={153} y={170} label="ARM" value="118/76" tone={meta.accent} />
          <BodyPin x={287} y={170} label="ARM" value="120/78" tone={meta.accent} />
          <BodyPin x={182} y={282} label="LEG" value="gait 65" tone={meta.accent} />
          <BodyPin x={258} y={282} label="LEG" value="mobility 71" tone={meta.accent} />
        </svg>
      </div>

      <div className="human-twin__summary">
        <div className="human-twin__metric">
          <span className="human-twin__metric-label">Respiration</span>
          <span className="human-twin__metric-value">{isSleeping ? `${respiration.toFixed(1)} brpm` : '14.2 brpm'}</span>
        </div>
        <div className="human-twin__metric">
          <span className="human-twin__metric-label">Posture</span>
          <span className="human-twin__metric-value">{activity === 'moving' ? 'in motion' : 'stable'}</span>
        </div>
        <div className="human-twin__metric">
          <span className="human-twin__metric-label">Tissue sync</span>
          <span className="human-twin__metric-value">active</span>
        </div>
      </div>

      <div className="room-sim-disclaimer">
        Real-time body twin mockup. Visual position is illustrative, not sensor-derived.
      </div>
    </div>
  );
}
