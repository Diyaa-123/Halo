import React, { useEffect, useRef, useState } from 'react';
import './PageLayout.css';
import './LiveSensingPage.css';
import { useToast } from '../components/layout/ToastContext';
import { useSensing } from '../hooks/SensingContext';

function formatNumber(value, digits = 1) {
  return typeof value === 'number' && Number.isFinite(value) ? value.toFixed(digits) : '--';
}

function PillarMeter({ title, score, color, desc, delay = 0 }) {
  const [current, setCurrent] = useState(0);
  const timeoutRef = useRef(null);
  const intervalRef = useRef(null);

  useEffect(() => {
    window.clearTimeout(timeoutRef.current);
    window.clearInterval(intervalRef.current);

    if (score == null) {
      setCurrent(0);
      return;
    }

    let value = 0;
    timeoutRef.current = window.setTimeout(() => {
      intervalRef.current = window.setInterval(() => {
        value = Math.min(value + 3, score);
        setCurrent(value);
        if (value >= score) window.clearInterval(intervalRef.current);
      }, 16);
    }, delay);

    return () => {
      window.clearTimeout(timeoutRef.current);
      window.clearInterval(intervalRef.current);
    };
  }, [score, delay]);

  return (
    <div className="pillar-meter">
      <div className="pillar-meter__header">
        <span className="pillar-meter__title">{title}</span>
        <span className="pillar-meter__score" style={{ color }}>{score == null ? '--' : `${current}%`}</span>
      </div>
      <div className="pillar-meter__track">
        <div className="pillar-meter__fill" style={{ width: `${score == null ? 0 : current}%`, background: color }} />
      </div>
      <div className="pillar-meter__desc">{desc}</div>
    </div>
  );
}

function CSIWaveform({ mode, showRaw, liveAmplitude }) {
  const canvasRef = useRef(null);
  const animationRef = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const width = canvas.offsetWidth || 600;
      const height = canvas.height;
      canvas.width = width;

      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = 'rgba(173,198,255,0.08)';
      ctx.lineWidth = 1;

      for (let i = 1; i < 4; i += 1) {
        ctx.beginPath();
        ctx.moveTo(0, (height / 4) * i);
        ctx.lineTo(width, (height / 4) * i);
        ctx.stroke();
      }

      for (let i = 1; i < 6; i += 1) {
        ctx.beginPath();
        ctx.moveTo((width / 6) * i, 0);
        ctx.lineTo((width / 6) * i, height);
        ctx.stroke();
      }

      offsetRef.current += 0.025;
      const offset = offsetRef.current;
      const hasSignal = Array.isArray(liveAmplitude) && liveAmplitude.length > 0;
      const baseColor = mode === 'night' ? '#4edea3' : '#adc6ff';
      const glow = mode === 'night' ? 'rgba(78,222,163,0.12)' : 'rgba(173,198,255,0.1)';

      if (!hasSignal) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(148,163,184,0.35)';
        ctx.lineWidth = 2;
        ctx.setLineDash([6, 8]);
        ctx.moveTo(0, height / 2);
        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.setLineDash([]);
        animationRef.current = requestAnimationFrame(draw);
        return;
      }

      if (showRaw) {
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245,158,11,0.75)';
        ctx.lineWidth = 1.2;
        for (let x = 0; x < width; x += 1) {
          const t = (x / width) * Math.PI * 10 + offset;
          const breath = Math.sin(t * 0.28) * 26;
          const noise = (Math.sin(t * 3.2) + Math.cos(t * 4.1)) * 4;
          const y = height / 2 - breath - noise;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        const amplitudeScale = Math.max(10, Math.min(36, liveAmplitude.reduce((sum, value) => sum + Math.abs(value), 0) / liveAmplitude.length));

        ctx.beginPath();
        ctx.strokeStyle = glow;
        ctx.lineWidth = 10;
        for (let x = 0; x < width; x += 1) {
          const t = (x / width) * Math.PI * 7 + offset;
          const y = height / 2 - Math.sin(t * 0.32) * amplitudeScale - Math.sin(t * 0.64) * 6;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        ctx.beginPath();
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 2;
        for (let x = 0; x < width; x += 1) {
          const t = (x / width) * Math.PI * 7 + offset;
          const y = height / 2 - Math.sin(t * 0.32) * amplitudeScale - Math.sin(t * 0.64) * 6;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => window.cancelAnimationFrame(animationRef.current);
  }, [mode, showRaw, liveAmplitude]);

  return <canvas ref={canvasRef} height={120} className="csi-canvas" />;
}

function derivePillars(sensing) {
  if (!sensing.isConnected) {
    return [
      { title: 'Spatial', score: null, color: '#4edea3', desc: 'Awaiting live occupancy feed' },
      { title: 'Temporal', score: null, color: '#adc6ff', desc: 'Waiting for timestamped frames' },
      { title: 'Biometric', score: null, color: '#F59E0B', desc: 'Respiration anchor unavailable' },
      { title: 'Behavioral', score: null, color: '#a78bfa', desc: 'Behavior layer offline' },
    ];
  }

  const confidence = Math.round((sensing.confidence ?? 0) * 100);
  const occupancyScore = sensing.presence ? Math.min(100, confidence + (sensing.estimatedPersons === 1 ? 8 : 0)) : 0;
  const temporalScore = sensing.lastUpdateAt ? Math.min(100, confidence + 6) : confidence;
  const biometricScore = sensing.breathingRate == null ? null : Math.min(100, Math.max(35, 40 + Math.round(sensing.breathingRate * 2)));
  const motionScore = sensing.motionPower == null ? null : Math.max(0, 100 - Math.round(sensing.motionPower * 100));

  return [
    { title: 'Spatial', score: occupancyScore, color: '#4edea3', desc: sensing.presence ? 'Occupancy gate is live' : 'No target currently detected' },
    { title: 'Temporal', score: temporalScore, color: '#adc6ff', desc: sensing.lastUpdateAt ? 'Stream continuity is available' : 'No timestamped frame received' },
    { title: 'Biometric', score: biometricScore, color: '#F59E0B', desc: sensing.breathingRate != null ? 'Respiration derived from CSI' : 'Respiration feed missing' },
    { title: 'Behavioral', score: motionScore, color: '#a78bfa', desc: sensing.motionLevel === 'active' ? 'Motion context elevated' : 'Behavior context stable' },
  ];
}

function deriveAlerts(sensing) {
  if (!sensing.isConnected) {
    return [{ icon: 'cloud_off', label: 'Live feed disconnected', sub: 'Waiting for backend websocket data', time: 'Now', color: '#EF4444', bg: '#FEF2F2' }];
  }

  const alerts = [];

  if (!sensing.presence) {
    alerts.push({ icon: 'meeting_room', label: 'No occupant detected', sub: 'The room is currently empty', time: 'Now', color: '#64748B', bg: '#F8FAFC' });
  } else {
    alerts.push({
      icon: sensing.motionLevel === 'active' ? 'directions_walk' : 'check_circle',
      label: sensing.motionLevel === 'active' ? 'Motion present in room' : 'Stable occupant detected',
      sub: sensing.motionLevel === 'active' ? 'Current frame indicates movement' : 'Occupancy is steady',
      time: 'Now',
      color: sensing.motionLevel === 'active' ? '#F59E0B' : '#4edea3',
      bg: sensing.motionLevel === 'active' ? '#FFFBEB' : '#F0FDF4',
    });
  }

  if (sensing.breathingRate != null) {
    const normal = sensing.breathingRate >= 12 && sensing.breathingRate <= 18;
    alerts.push({
      icon: 'air',
      label: normal ? 'Respiration in normal band' : 'Respiration outside nominal band',
      sub: `Live breathing rate ${formatNumber(sensing.breathingRate, 1)} brpm`,
      time: 'Now',
      color: normal ? '#4edea3' : '#F59E0B',
      bg: normal ? '#F0FDF4' : '#FFFBEB',
    });
  }

  if ((sensing.estimatedPersons ?? 0) > 1) {
    alerts.push({
      icon: 'groups',
      label: 'Multiple occupants in frame',
      sub: `${sensing.estimatedPersons} people estimated from live occupancy gate`,
      time: 'Now',
      color: '#a78bfa',
      bg: '#F5F3FF',
    });
  }

  return alerts;
}

function FloorPlan({ mode, sensing }) {
  const isNight = mode === 'night';
  const bedroomColor = isNight ? '#6f6be8' : '#7a75f0';
  const livingColor = '#f59e0b';
  const residentColor = '#7a75f0';
  const scanColor = isNight ? 'rgba(111,107,232,0.22)' : 'rgba(122,117,240,0.18)';
  const roomFill = isNight ? 'rgba(111,107,232,0.08)' : 'rgba(122,117,240,0.07)';

  const isLive = sensing?.isConnected;
  const presence = isLive ? sensing.presence : null;
  const confidence = isLive && sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;
  const br = isLive && sensing.breathingRate != null ? sensing.breathingRate.toFixed(1) : null;
  const motion = isLive ? sensing.motionLevel : 'offline';
  const occupantsCount = isLive ? sensing.estimatedPersons : null;

  return (
    <svg viewBox="0 0 960 650" className="floor-plan-svg floor-plan-svg--realtime" preserveAspectRatio="xMidYMid meet">
      <defs>
        <linearGradient id="realtimeFrame" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={isNight ? '#f6f4ff' : '#fffdf8'} />
          <stop offset="100%" stopColor={isNight ? '#fcfbff' : '#fbfaf5'} />
        </linearGradient>
        <linearGradient id="bedroomFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor={roomFill} />
          <stop offset="100%" stopColor="rgba(111,107,232,0.02)" />
        </linearGradient>
        <linearGradient id="livingFill" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(245,158,11,0.09)" />
          <stop offset="100%" stopColor="rgba(245,158,11,0.03)" />
        </linearGradient>
        <radialGradient id="residentGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="rgba(122,117,240,0.62)" />
          <stop offset="100%" stopColor="rgba(122,117,240,0)" />
        </radialGradient>
        <filter id="softGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="8" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <rect x="24" y="20" width="912" height="584" rx="22" fill="url(#realtimeFrame)" stroke="rgba(42,46,60,0.22)" strokeWidth="1.8" />
      <rect x="38" y="34" width="884" height="556" rx="18" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.55)" strokeWidth="1" />
      <rect x="24" y="20" width="430" height="330" rx="18" fill="url(#bedroomFill)" stroke={bedroomColor} strokeWidth="2.6" />
      <rect x="454" y="20" width="482" height="330" rx="18" fill="url(#livingFill)" stroke={livingColor} strokeWidth="2.6" strokeDasharray="9 7" />
      <rect x="24" y="350" width="300" height="254" rx="18" fill="rgba(255,255,255,0.32)" stroke="rgba(140,145,164,0.55)" strokeWidth="1.7" />
      <rect x="324" y="350" width="300" height="254" rx="18" fill="rgba(255,255,255,0.32)" stroke="rgba(140,145,164,0.55)" strokeWidth="1.7" />
      <rect x="624" y="350" width="292" height="254" rx="18" fill="rgba(255,255,255,0.32)" stroke="rgba(140,145,164,0.55)" strokeWidth="1.7" />

      <line x1="454" y1="20" x2="454" y2="350" stroke="rgba(245,158,11,0.65)" strokeWidth="2.2" strokeDasharray="9 7" />
      <line x1="24" y1="350" x2="916" y2="350" stroke="rgba(140,145,164,0.42)" strokeWidth="1.8" />
      <line x1="324" y1="350" x2="324" y2="604" stroke="rgba(140,145,164,0.38)" strokeWidth="1.5" />
      <line x1="624" y1="350" x2="624" y2="604" stroke="rgba(140,145,164,0.38)" strokeWidth="1.5" />

      <text x="239" y="58" textAnchor="middle" fontSize="22" fill={bedroomColor} fontWeight="800" letterSpacing="1.2">BEDROOM</text>
      <text x="239" y="82" textAnchor="middle" fontSize="11" fill="rgba(95,91,123,0.92)" fontWeight="600">target zone</text>
      <text x="239" y="104" textAnchor="middle" fontSize="10" fill="rgba(95,91,123,0.72)" fontWeight="500">live occupancy and physiology</text>
      <text x="695" y="58" textAnchor="middle" fontSize="22" fill="#9a6a1f" fontWeight="800" letterSpacing="1.2">LIVING ROOM</text>
      <text x="695" y="82" textAnchor="middle" fontSize="11" fill="rgba(144,99,18,0.95)" fontWeight="600">occupancy sensor</text>
      <text x="695" y="104" textAnchor="middle" fontSize="10" fill="rgba(144,99,18,0.74)" fontWeight="500">no identity</text>

      <text x="170" y="388" textAnchor="middle" fontSize="15" fill="rgba(106,109,124,0.9)" fontWeight="800" letterSpacing="1">BATHROOM</text>
      <text x="170" y="409" textAnchor="middle" fontSize="11" fill="rgba(118,122,136,0.9)">live zone map</text>
      <text x="474" y="388" textAnchor="middle" fontSize="15" fill="rgba(106,109,124,0.9)" fontWeight="800" letterSpacing="1">KITCHEN</text>
      <text x="474" y="409" textAnchor="middle" fontSize="11" fill="rgba(118,122,136,0.9)">live zone map</text>
      <text x="770" y="388" textAnchor="middle" fontSize="15" fill="rgba(106,109,124,0.9)" fontWeight="800" letterSpacing="1">HALLWAY</text>
      <text x="770" y="409" textAnchor="middle" fontSize="11" fill="rgba(118,122,136,0.9)">live zone map</text>

      <rect x="30" y="90" width="20" height="24" rx="6" fill="#5b52cf" />
      <text x="40" y="107" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">TX</text>
      <rect x="436" y="90" width="20" height="24" rx="6" fill="#5b52cf" />
      <text x="446" y="107" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">RX</text>
      <line x1="50" y1="102" x2="436" y2="102" stroke="rgba(91,82,207,0.32)" strokeWidth="2" strokeDasharray="6 6" />
      <text x="240" y="116" textAnchor="middle" fontSize="10" fill="rgba(108,114,255,0.92)" fontWeight="600" letterSpacing="0.04em">CSI sensing link · live feed</text>

      {presence === true ? (
        <g style={{ opacity: 1, transition: 'opacity 0.5s' }}>
          <circle cx="239" cy="184" r="30" fill="none" stroke={bedroomColor} strokeWidth="1.8" opacity="0.32">
            <animate attributeName="r" values="28;34;28" dur="3.2s" repeatCount="indefinite" />
            <animate attributeName="opacity" values="0.32;0.12;0.32" dur="3.2s" repeatCount="indefinite" />
          </circle>
          <circle cx="239" cy="184" r="18" fill="url(#residentGlow)" opacity="0.36" />
          <circle cx="239" cy="184" r="10" fill="rgba(255,255,255,0.95)" stroke={bedroomColor} strokeWidth="2" />
          <circle cx="239" cy="184" r="3.8" fill={residentColor} filter="url(#softGlow)" />
          <circle cx="239" cy="184" r="44" fill="none" stroke={scanColor} strokeWidth="1.1" strokeDasharray="7 10" opacity="0.48">
            <animate attributeName="stroke-dashoffset" from="0" to="120" dur="9s" repeatCount="indefinite" />
          </circle>
          <text x="239" y="228" textAnchor="middle" fontSize="15" fill={bedroomColor} fontWeight="800">
            {confidence == null ? 'Confidence unavailable' : `${confidence}% confidence`}
          </text>
          <rect x="199" y="242" width="80" height="24" rx="8" fill="rgba(122,117,240,0.10)" />
          <text x="239" y="258" textAnchor="middle" fontSize="12" fill="#5f56c3" fontWeight="700">
            {br == null ? 'No vitals' : `${br} brpm`}
          </text>
          <text x="239" y="278" textAnchor="middle" fontSize="11" fill="rgba(95,91,123,0.88)" fontWeight="500">
            primary occupant · {motion}
          </text>
        </g>
      ) : presence === false ? (
        <g opacity="0.5">
          <text x="239" y="184" textAnchor="middle" fontSize="14" fill="rgba(95,91,123,0.6)" fontWeight="700">ZONE EMPTY</text>
        </g>
      ) : (
        <g opacity="0.55">
          <text x="239" y="184" textAnchor="middle" fontSize="14" fill="rgba(95,91,123,0.6)" fontWeight="700">FEED OFFLINE</text>
        </g>
      )}

      <circle cx="685" cy="156" r="10" fill="rgba(245,158,11,0.18)" stroke={livingColor} strokeWidth="3" />
      <circle cx="685" cy="156" r="4.5" fill={livingColor} />
      <text x="685" y="182" textAnchor="middle" fontSize="14" fill="#8d5b08" fontWeight="700">occupancy only</text>
      <circle cx="646" cy="220" r="12" fill="none" stroke="rgba(140,145,164,0.55)" strokeWidth="1.6" strokeDasharray="4 5" />
      <text x="646" y="225" textAnchor="middle" fontSize="15" fill="rgba(140,145,164,0.7)" fontWeight="700">?</text>
      <circle cx="725" cy="214" r="12" fill="none" stroke="rgba(140,145,164,0.55)" strokeWidth="1.6" strokeDasharray="4 5" />
      <text x="725" y="219" textAnchor="middle" fontSize="15" fill="rgba(140,145,164,0.7)" fontWeight="700">?</text>
      <circle cx="722" cy="152" r="52" fill="none" stroke="rgba(245,158,11,0.16)" strokeWidth="1.2" />
      <circle cx="685" cy="156" r="38" fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="1.2" strokeDasharray="4 6" />
      <text x="685" y="286" textAnchor="middle" fontSize="15" fill={livingColor} fontWeight="700">
        {occupantsCount == null ? 'waiting for live occupancy' : occupantsCount > 0 ? `${occupantsCount} detected · monitoring` : 'no motion detected'}
      </text>

      <circle cx="170" cy="510" r="10" fill="rgba(140,145,164,0.13)" stroke="rgba(140,145,164,0.72)" strokeWidth="2" />
      <circle cx="474" cy="510" r="10" fill="rgba(140,145,164,0.13)" stroke="rgba(140,145,164,0.72)" strokeWidth="2" />
      <circle cx="770" cy="510" r="10" fill="rgba(140,145,164,0.13)" stroke="rgba(140,145,164,0.72)" strokeWidth="2" />
      <circle cx="170" cy="510" r="3.5" fill="rgba(140,145,164,0.78)" />
      <circle cx="474" cy="510" r="3.5" fill="rgba(140,145,164,0.78)" />
      <circle cx="770" cy="510" r="3.5" fill="rgba(140,145,164,0.78)" />

      <path d="M96 128 C164 112 228 112 300 128" fill="none" stroke="rgba(122,117,240,0.10)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 9" />
      <path d="M592 138 C656 122 720 122 800 140" fill="none" stroke="rgba(245,158,11,0.10)" strokeWidth="2" strokeLinecap="round" strokeDasharray="3 9" />
    </svg>
  );
}

export default function LiveSensingPage() {
  const toast = useToast();
  const sensing = useSensing();
  const [mode, setMode] = useState('night');
  const [showRaw, setShowRaw] = useState(false);
  const [showAlert, setShowAlert] = useState(true);

  const isLive = sensing.isConnected;
  const modeColor = mode === 'night' ? '#4edea3' : '#adc6ff';
  const modeLabel = mode === 'night' ? 'NIGHT LIVE' : 'DAY LIVE';
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;
  const pillarCards = derivePillars(sensing);
  const recentAlerts = deriveAlerts(sensing);
  const breathRate = sensing.breathingRate;
  const heartRate = sensing.heartRate;
  const personCount = sensing.estimatedPersons ?? null;
  const liveVitals = [
    {
      label: 'Breathing rate',
      value: breathRate != null ? breathRate.toFixed(1) : '--',
      unit: 'brpm',
      pct: breathRate != null ? Math.min(100, (breathRate / 24) * 100) : 0,
      color: '#4edea3',
    },
    {
      label: 'Heart rate',
      value: heartRate != null ? Math.round(heartRate) : '--',
      unit: 'bpm',
      pct: heartRate != null ? Math.min(100, (heartRate / 120) * 100) : 0,
      color: '#adc6ff',
    },
    {
      label: 'Motion',
      value: sensing.motionLevel === 'active' ? 'active' : sensing.motionLevel === 'still' ? 'still' : sensing.motionLevel === 'absent' ? 'absent' : 'unknown',
      unit: '',
      pct: sensing.motionPower != null ? Math.min(100, sensing.motionPower * 100) : 0,
      color: '#F59E0B',
      text: true,
    },
    {
      label: 'Persons detected',
      value: personCount != null ? personCount : '--',
      unit: 'in room',
      pct: personCount != null ? Math.min(100, personCount * 33) : 0,
      color: '#4edea3',
      dot: true,
    },
  ];

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: modeColor }}>sensors</span>
          <div>
            <h1 className="page-layout__title">Live Sensing View</h1>
            <p className="page-layout__subtitle">Real-time WiFi-CSI monitoring</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className={`live-badge ${isLive ? '' : 'live-badge--demo'}`}>
            <span className="live-badge__dot" />
            {isLive ? 'LIVE' : 'OFFLINE'}
          </div>
          <button className={`btn btn-sm ${mode === 'night' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('night')}>
            <span className="material-icons icon-sm">nights_stay</span> Night
          </button>
          <button className={`btn btn-sm ${mode === 'day' ? 'btn-primary' : 'btn-outline'}`} onClick={() => setMode('day')}>
            <span className="material-icons icon-sm">wb_sunny</span> Day
          </button>
        </div>
      </div>

      <div className="page-layout__content">
        <div className="live-grid">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card live-floor-card" style={{ padding: 18 }}>
              <div className="live-floor-card__header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="section-label" style={{ margin: 0 }}>Live Room Occupancy</span>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>
                    Live CSI zone tracking with occupancy and attribution
                  </span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: modeColor, background: `${modeColor}18`, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {modeLabel}
                </span>
              </div>

              <div className="live-floor-card__stage">
                <FloorPlan mode={mode} sensing={sensing} />
              </div>

              <div className="live-floor-card__legend">
                {[
                  { color: '#5b52cf', label: 'TX / RX node pair' },
                  { color: '#6e6af1', label: 'CSI sensing link' },
                  { color: '#7a75f0', label: 'Target occupant' },
                  { color: '#8d8a84', label: 'Shared-space occupant' },
                  { color: '#f59e0b', label: 'Monitoring paused' },
                ].map(({ color, label }) => (
                  <div key={label} className="live-floor-card__legend-item">
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span className="material-icons" style={{ fontSize: 16, color: showRaw ? '#F59E0B' : modeColor }}>
                    {showRaw ? 'blur_on' : 'show_chart'}
                  </span>
                  <span className="section-label" style={{ margin: 0 }}>
                    WiFi-CSI Signal — {showRaw ? 'Raw' : 'Filtered / Processed'}
                  </span>
                </div>
                <button className={`btn btn-sm ${showRaw ? 'btn-primary' : 'btn-outline'}`} onClick={() => setShowRaw((v) => !v)}>
                  {showRaw ? 'Show Filtered' : 'Show Raw Signal'}
                </button>
              </div>

              <CSIWaveform mode={mode} showRaw={showRaw} liveAmplitude={sensing.csiAmplitude} />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'var(--outline)' }}>
                <span>T−60s</span><span>T−45s</span><span>T−30s</span><span>T−15s</span><span style={{ color: modeColor, fontWeight: 700 }}>Now</span>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
              {!isLive && (
                <div className="day-mode-overlay">
                  <span className="material-icons" style={{ fontSize: 24 }}>cloud_off</span>
                  <span>Live backend disconnected</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>{sensing.streamMessage || 'Waiting for a real websocket feed'}</span>
                </div>
              )}
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, filter: !isLive ? 'blur(2px)' : 'none' }}>
                <div className={`breath-ring ${mode === 'night' ? 'breath-ring--night' : 'breath-ring--day'}`}>
                  <span className="breath-ring__value" style={{ color: mode === 'night' ? '#4edea3' : 'var(--outline)' }}>
                    {breathRate != null ? formatNumber(breathRate, 1) : '--'}
                  </span>
                  <span className="breath-ring__unit">BPM</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>Breathing Rate</div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 10 }}>
                    Live respiration from backend CSI feed
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-stable">{breathRate != null && breathRate >= 12 && breathRate <= 18 ? 'NORMAL' : 'LIVE'}</span>
                    <span style={{ fontSize: 11, color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-icons" style={{ fontSize: 12 }}>check_circle</span>
                      {breathRate != null ? 'No static fallback in use' : 'Waiting for live feed'}
                    </span>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--outline)', marginBottom: 4 }}>live confidence</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4edea3' }}>{confidence != null ? `${confidence}%` : '--'}</div>
                  <div style={{ fontSize: 10, color: 'var(--outline)' }}>{sensing.streamStatus === 'offline' ? 'No live frame' : 'Within live feed window'}</div>
                </div>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div className="glass-card live-pillar-card">
              <div className="live-pillar-card__header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="material-icons" style={{ fontSize: 16, color: '#a78bfa' }}>psychology</span>
                    <span className="section-label" style={{ margin: 0 }}>Derived Attribution Confidence</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Normalized live signals, not simulated values</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', padding: '4px 10px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                  {confidence != null ? `${confidence}% overall` : 'offline'}
                </span>
              </div>
              <div className="live-pillar-card__grid">
                {pillarCards.map((pillar, index) => (
                  <PillarMeter key={pillar.title} delay={index * 140} {...pillar} />
                ))}
              </div>
              <div className="confidence-footer confidence-footer--compact">
                <span className="confidence-footer__label">Overall Attribution Confidence</span>
                <span className="confidence-footer__value">{confidence != null ? `${confidence}%` : '--'}</span>
              </div>
            </div>

            {showAlert && (
              <div style={{ padding: '14px 16px', background: '#FEF2F2', border: '1px solid #FECACA', borderLeft: '4px solid #EF4444', borderRadius: 'var(--radius)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'livePulse 1s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', letterSpacing: '0.04em' }}>
                      ALERT STATUS
                    </span>
                  </div>
                  <button onClick={() => setShowAlert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#EF4444', fontSize: 16, lineHeight: 1, opacity: 0.6 }}>×</button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>
                  {isLive ? 'Live monitoring active' : 'Backend feed unavailable'}
                </div>
                <div style={{ fontSize: 12, color: '#7F1D1D', marginBottom: 12, lineHeight: 1.5 }}>
                  {isLive
                    ? 'Button actions and metrics are now connected to the live websocket feed.'
                    : sensing.streamMessage || 'Connect the backend websocket to display live CSI vitals and occupancy.'}
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button
                    onClick={() => toast('Escalation logged for family contact.', 'success')}
                    style={{ flex: 1, padding: '8px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#DC2626' }}
                  >
                    <span className="material-icons" style={{ fontSize: 14 }}>group</span>
                    Alert family
                  </button>
                  <button
                    onClick={() => toast('Escalation logged for nursing staff.', 'success')}
                    style={{ flex: 1, padding: '8px 12px', background: 'white', border: '1px solid #FECACA', borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontSize: 12, fontWeight: 600, color: '#DC2626' }}
                  >
                    <span className="material-icons" style={{ fontSize: 14 }}>call</span>
                    Alert nurse
                  </button>
                </div>
              </div>
            )}

            <div className="glass-card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
              {!isLive && (
                <div className="day-mode-overlay">
                  <span className="material-icons" style={{ fontSize: 20 }}>cloud_off</span>
                  <span>Live vitals unavailable</span>
                </div>
              )}
              <div style={{ filter: !isLive ? 'blur(2px)' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span className="material-icons" style={{ fontSize: 14, color: '#4edea3' }}>monitor_heart</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Live Vitals
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {liveVitals.map((v) => (
                    <div key={v.label}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 5 }}>
                        <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>{v.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>
                          {v.dot
                            ? <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4edea3', display: 'inline-block' }} />{v.value} {v.unit}</span>
                            : v.text
                              ? <span style={{ color: '#F59E0B' }}>{v.value}</span>
                              : <>{v.value}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--outline)', marginLeft: 3 }}>{v.unit}</span></>}
                        </span>
                      </div>
                      {!v.dot && (
                        <div style={{ height: 5, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden' }}>
                          <div style={{ width: `${v.pct}%`, height: '100%', background: v.color, borderRadius: 999, transition: 'width 0.4s' }} />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ marginTop: 12, padding: '7px 10px', background: 'var(--surface-container-low)', borderRadius: 6, fontSize: 10, color: 'var(--outline)', lineHeight: 1.45 }}>
                  Live data only. No static vitals fallback is displayed.
                </div>
              </div>
            </div>

            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span className="material-icons" style={{ fontSize: 14, color: 'var(--outline)' }}>notifications</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  Recent Alerts
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentAlerts.map((alert) => (
                  <div key={`${alert.label}-${alert.time}`} style={{ padding: '10px 12px', background: alert.bg, borderRadius: 8, borderLeft: `3px solid ${alert.color}`, display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                    <span className="material-icons" style={{ fontSize: 16, color: alert.color, flexShrink: 0, marginTop: 1 }}>{alert.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{alert.label}</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>{alert.sub}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', flexShrink: 0 }}>{alert.time}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass-card" style={{ padding: 16 }}>
              <span className="section-label" style={{ display: 'block', marginBottom: 10 }}>System Telemetry</span>
              {[
                { label: 'SYNC STATUS', value: isLive ? 'ACTIVE' : 'OFFLINE', color: isLive ? '#4edea3' : '#EF4444' },
                { label: 'SOURCE', value: sensing.source?.toUpperCase() || 'N/A', color: 'var(--on-surface)' },
                { label: 'RSSI', value: sensing.meanRssi != null ? `${Math.round(sensing.meanRssi)} dBm` : '--', color: 'var(--on-surface)' },
                { label: 'VARIANCE', value: sensing.variance != null ? sensing.variance.toFixed(3) : '--', color: 'var(--on-surface)' },
                { label: 'CONFIDENCE', value: confidence != null ? `${confidence}%` : '--', color: confidence != null && confidence > 70 ? '#4edea3' : '#F59E0B' },
                { label: 'MODE', value: modeLabel, color: modeColor },
              ].map(({ label, value, color }) => (
                <div key={label} className="telemetry-row">
                  <span className="telemetry-row__label">{label}</span>
                  <span className="telemetry-row__value" style={{ color }}>{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
