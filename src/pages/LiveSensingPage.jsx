import React, { useState, useEffect, useRef } from 'react';
import './PageLayout.css';
import './LiveSensingPage.css';

/* ─────────────────────────────────────────
   Animated CSI Waveform (Canvas)
───────────────────────────────────────── */
function CSIWaveform({ mode, showRaw }) {
  const canvasRef = useRef(null);
  const animRef   = useRef(null);
  const offsetRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.height;
      canvas.width = W;

      ctx.clearRect(0, 0, W, H);

      // subtle grid
      ctx.strokeStyle = 'rgba(173,198,255,0.08)';
      ctx.lineWidth = 1;
      for (let i = 1; i < 4; i++) {
        ctx.beginPath();
        ctx.moveTo(0, (H / 4) * i);
        ctx.lineTo(W, (H / 4) * i);
        ctx.stroke();
      }
      for (let i = 1; i < 6; i++) {
        ctx.beginPath();
        ctx.moveTo((W / 6) * i, 0);
        ctx.lineTo((W / 6) * i, H);
        ctx.stroke();
      }

      offsetRef.current += 0.025;
      const off = offsetRef.current;

      if (showRaw) {
        // Noisy multi-component raw signal (amber)
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(245,158,11,0.75)';
        ctx.lineWidth = 1.2;
        for (let x = 0; x < W; x++) {
          const t = (x / W) * Math.PI * 10 + off;
          const breath  = Math.sin(t * 0.28) * 26;
          const noise   = (Math.random() - 0.5) * 18;
          const harmonic = Math.sin(t * 2.3) * 7 + Math.sin(t * 5.1) * 4;
          const y = H / 2 - breath - noise - harmonic;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();
      } else {
        // Filtered clean breathing wave — colour depends on mode
        const col = mode === 'night' ? '#4edea3' : '#adc6ff';
        const glow = mode === 'night' ? 'rgba(78,222,163,0.12)' : 'rgba(173,198,255,0.1)';

        // glow pass
        ctx.beginPath();
        ctx.strokeStyle = glow;
        ctx.lineWidth = 10;
        for (let x = 0; x < W; x++) {
          const t = (x / W) * Math.PI * 7 + off;
          const y = H / 2 - Math.sin(t * 0.32) * 32 - Math.sin(t * 0.64) * 6;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // crisp line
        ctx.beginPath();
        ctx.strokeStyle = col;
        ctx.lineWidth = 2;
        for (let x = 0; x < W; x++) {
          const t = (x / W) * Math.PI * 7 + off;
          const y = H / 2 - Math.sin(t * 0.32) * 32 - Math.sin(t * 0.64) * 6;
          x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
        }
        ctx.stroke();

        // moving cursor dot
        const curX = W - 2;
        const curT = (curX / W) * Math.PI * 7 + off;
        const curY = H / 2 - Math.sin(curT * 0.32) * 32 - Math.sin(curT * 0.64) * 6;
        ctx.beginPath();
        ctx.arc(curX, curY, 4, 0, Math.PI * 2);
        ctx.fillStyle = col;
        ctx.fill();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    draw();
    return () => cancelAnimationFrame(animRef.current);
  }, [mode, showRaw]);

  return (
    <canvas
      ref={canvasRef}
      height={120}
      className="csi-canvas"
    />
  );
}

/* ─────────────────────────────────────────
   Four-Pillar Confidence Meter
───────────────────────────────────────── */
function PillarMeter({ title, score, color, desc, delay }) {
  const [current, setCurrent] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => {
      let val = 0;
      const step = setInterval(() => {
        val = Math.min(val + 3, score);
        setCurrent(val);
        if (val >= score) clearInterval(step);
      }, 16);
    }, delay);
    return () => clearTimeout(timerRef.current);
  }, [score, delay]);

  return (
    <div className="pillar-meter">
      <div className="pillar-meter__header">
        <span className="pillar-meter__title">{title}</span>
        <span className="pillar-meter__score" style={{ color }}>{current}%</span>
      </div>
      <div className="pillar-meter__track">
        <div className="pillar-meter__fill" style={{ width: `${current}%`, background: color }} />
      </div>
      <div className="pillar-meter__desc">{desc}</div>
    </div>
  );
}

/* ─────────────────────────────────────────
   SVG Room Floor Plan
───────────────────────────────────────── */
function FloorPlan({ mode }) {
  const isNight = mode === 'night';
  const bedroomColor = isNight ? '#6f6be8' : '#7a75f0';
  const livingColor = '#f59e0b';
  const residentColor = '#7a75f0';
  const scanColor = isNight ? 'rgba(111,107,232,0.22)' : 'rgba(122,117,240,0.18)';
  const roomFill = isNight ? 'rgba(111,107,232,0.08)' : 'rgba(122,117,240,0.07)';

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
      <text x="239" y="104" textAnchor="middle" fontSize="10" fill="rgba(95,91,123,0.72)" fontWeight="500">high confidence</text>
      <text x="695" y="58" textAnchor="middle" fontSize="22" fill="#9a6a1f" fontWeight="800" letterSpacing="1.2">LIVING ROOM</text>
      <text x="695" y="82" textAnchor="middle" fontSize="11" fill="rgba(144,99,18,0.95)" fontWeight="600">occupancy sensor</text>
      <text x="695" y="104" textAnchor="middle" fontSize="10" fill="rgba(144,99,18,0.74)" fontWeight="500">no identity</text>

      <text x="170" y="388" textAnchor="middle" fontSize="15" fill="rgba(106,109,124,0.9)" fontWeight="800" letterSpacing="1">BATHROOM</text>
      <text x="170" y="409" textAnchor="middle" fontSize="11" fill="rgba(118,122,136,0.9)">empty</text>
      <text x="474" y="388" textAnchor="middle" fontSize="15" fill="rgba(106,109,124,0.9)" fontWeight="800" letterSpacing="1">KITCHEN</text>
      <text x="474" y="409" textAnchor="middle" fontSize="11" fill="rgba(118,122,136,0.9)">empty</text>
      <text x="770" y="388" textAnchor="middle" fontSize="15" fill="rgba(106,109,124,0.9)" fontWeight="800" letterSpacing="1">HALLWAY</text>
      <text x="770" y="409" textAnchor="middle" fontSize="11" fill="rgba(118,122,136,0.9)">no sensor</text>

      <rect x="30" y="90" width="20" height="24" rx="6" fill="#5b52cf" />
      <text x="40" y="107" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">TX</text>
      <rect x="436" y="90" width="20" height="24" rx="6" fill="#5b52cf" />
      <text x="446" y="107" textAnchor="middle" fontSize="11" fill="#fff" fontWeight="800">RX</text>
      <line x1="50" y1="102" x2="436" y2="102" stroke="rgba(91,82,207,0.32)" strokeWidth="2" strokeDasharray="6 6" />
      <text x="240" y="116" textAnchor="middle" fontSize="10" fill="rgba(108,114,255,0.92)" fontWeight="600" letterSpacing="0.04em">CSI sensing link · 100 Hz</text>

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

      <text x="239" y="228" textAnchor="middle" fontSize="15" fill={bedroomColor} fontWeight="800">87% confidence</text>
      <rect x="199" y="242" width="80" height="24" rx="8" fill="rgba(122,117,240,0.10)" />
      <text x="239" y="258" textAnchor="middle" fontSize="12" fill="#5f56c3" fontWeight="700">14.2 brpm</text>
      <text x="239" y="278" textAnchor="middle" fontSize="11" fill="rgba(95,91,123,0.88)" fontWeight="500">resident A · sedentary</text>

      <circle cx="685" cy="156" r="10" fill="rgba(245,158,11,0.18)" stroke={livingColor} strokeWidth="3" />
      <circle cx="685" cy="156" r="4.5" fill={livingColor} />
      <text x="685" y="182" textAnchor="middle" fontSize="14" fill="#8d5b08" fontWeight="700">occupancy only</text>
      <circle cx="646" cy="220" r="12" fill="none" stroke="rgba(140,145,164,0.55)" strokeWidth="1.6" strokeDasharray="4 5" />
      <text x="646" y="225" textAnchor="middle" fontSize="15" fill="rgba(140,145,164,0.7)" fontWeight="700">?</text>
      <circle cx="725" cy="214" r="12" fill="none" stroke="rgba(140,145,164,0.55)" strokeWidth="1.6" strokeDasharray="4 5" />
      <text x="725" y="219" textAnchor="middle" fontSize="15" fill="rgba(140,145,164,0.7)" fontWeight="700">?</text>
      <circle cx="722" cy="152" r="52" fill="none" stroke="rgba(245,158,11,0.16)" strokeWidth="1.2" />
      <circle cx="685" cy="156" r="38" fill="none" stroke="rgba(245,158,11,0.12)" strokeWidth="1.2" strokeDasharray="4 6" />
      <text x="685" y="286" textAnchor="middle" fontSize="15" fill={livingColor} fontWeight="700">2 detected · monitoring paused</text>

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

/* ─────────────────────────────────────────
   Main Page
───────────────────────────────────────── */
const PILLARS = [
  { title: 'Spatial',    score: 98, color: '#4edea3', desc: 'Bedroom sensor zone — isolated presence', delay: 0   },
  { title: 'Temporal',   score: 95, color: '#adc6ff', desc: 'Matches historical presence probability at this hour', delay: 150 },
  { title: 'Biometric',  score: 88, color: '#F59E0B', desc: 'Breathing signature matches enrolled profile', delay: 300 },
  { title: 'Behavioral', score: 90, color: '#a78bfa', desc: 'No competing activity in adjacent shared spaces', delay: 450 },
];

const RECENT_ALERTS = [
  { icon: 'warning', label: 'Fall detected — bedroom',   sub: 'SOS sent to family + nurse', time: '03:38', color: '#EF4444', bg: '#FEF2F2' },
  { icon: 'bedtime', label: 'Restlessness spike',         sub: 'Above baseline for 12 min',  time: '02:14', color: '#F59E0B', bg: '#FFFBEB' },
  { icon: 'check',   label: 'Night mode activated',       sub: 'Training window started',     time: '23:00', color: '#4edea3', bg: '#F0FDF4' },
];

const VITALS = [
  { label: 'Breathing rate', value: 15.4, unit: 'brpm',    pct: 72, color: '#4edea3' },
  { label: 'Sleep quality',  value: 78,   unit: '%',        pct: 78, color: '#4edea3' },
  { label: 'Restlessness',   value: 'low', unit: '',        pct: 20, color: '#F59E0B', text: true },
  { label: 'Apnea events',   value: 0,    unit: 'tonight',  pct: 0,  color: '#4edea3', dot: true },
];

export default function LiveSensingPage() {
  const [mode,       setMode]      = useState('night');
  const [showRaw,    setShowRaw]   = useState(false);
  const [breathRate, setBreathRate] = useState(14.0);
  const [hasAlert,   setHasAlert]  = useState(true);

  // Simulate gentle live breathing rate jitter
  useEffect(() => {
    const id = setInterval(() => {
      setBreathRate(prev => {
        const delta = (Math.random() - 0.5) * 0.5;
        return Math.round((Math.min(18, Math.max(10, prev + delta))) * 10) / 10;
      });
    }, 2200);
    return () => clearInterval(id);
  }, []);

  const isNight   = mode === 'night';
  const modeColor = isNight ? '#4edea3' : '#adc6ff';
  const modeLabel = isNight ? 'NIGHT TRAINING' : 'DAY DETECTION';

  return (
    <div className="page-layout">
      {/* Header */}
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: modeColor }}>sensors</span>
          <div>
            <h1 className="page-layout__title">Live Sensing View</h1>
            <p className="page-layout__subtitle">Real-time WiFi-CSI monitoring — Arun Mehta</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div className="live-badge">
            <span className="live-badge__dot" />
            LIVE
          </div>
          <button
            className={`btn btn-sm ${isNight ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('night')}
          >
            <span className="material-icons icon-sm">nights_stay</span> Night
          </button>
          <button
            className={`btn btn-sm ${!isNight ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setMode('day')}
          >
            <span className="material-icons icon-sm">wb_sunny</span> Day
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="page-layout__content">
        <div className="live-grid">

          {/* ── LEFT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Live Room Occupancy */}
            <div className="glass-card live-floor-card" style={{ padding: 18 }}>
              <div className="live-floor-card__header">
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <span className="section-label" style={{ margin: 0 }}>Live Room Occupancy</span>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Realtime CSI zone tracking with resident attribution and shared-space occupancy</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: modeColor, background: `${modeColor}18`, padding: '4px 10px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  {modeLabel} • live
                </span>
              </div>

              <div className="live-floor-card__stage">
                <FloorPlan mode={mode} />
              </div>

              <div className="live-floor-card__legend">
                {[
                  { color: '#5b52cf', label: 'TX / RX node pair' },
                  { color: '#6e6af1', label: 'CSI sensing link' },
                  { color: '#7a75f0', label: 'Target resident' },
                  { color: '#8d8a84', label: 'Unidentified occupant' },
                  { color: '#f59e0b', label: 'Monitoring paused' },
                ].map(({ color, label }) => (
                  <div key={label} className="live-floor-card__legend-item">
                    <span style={{ width: 11, height: 11, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span>{label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* CSI Waveform */}
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
                <button
                  className={`btn btn-sm ${showRaw ? 'btn-primary' : 'btn-outline'}`}
                  onClick={() => setShowRaw(v => !v)}
                >
                  {showRaw ? 'Show Filtered ↩' : 'Show Raw Signal'}
                </button>
              </div>

              <CSIWaveform mode={mode} showRaw={showRaw} />

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 10, fontSize: 10, color: 'var(--outline)' }}>
                <span>T−60s</span><span>T−45s</span><span>T−30s</span><span>T−15s</span><span style={{ color: modeColor, fontWeight: 700 }}>Now</span>
              </div>

              {showRaw && (
                <div style={{ marginTop: 10, padding: '8px 12px', background: 'rgba(245,158,11,0.07)', borderRadius: 6, border: '1px solid rgba(245,158,11,0.25)', fontSize: 11, color: 'var(--on-surface-variant)' }}>
                  <strong style={{ color: '#F59E0B' }}>Raw signal</strong> — contains noise, harmonics & multipath interference. Applied Butterworth bandpass (0.1–0.5 Hz) to extract breathing component.
                </div>
              )}
            </div>

            {/* Breathing Rate — night only */}
            <div className="glass-card" style={{ padding: 20, position: 'relative', overflow: 'hidden' }}>
              {!isNight && (
                <div className="day-mode-overlay">
                  <span className="material-icons" style={{ fontSize: 24 }}>bedtime_off</span>
                  <span>Day mode — vitals training paused</span>
                  <span style={{ fontSize: 10, opacity: 0.7 }}>Breathing data is not attributed during shared-space hours</span>
                </div>
              )}
              <div style={{
                display: 'flex', alignItems: 'center', gap: 20,
                filter: isNight ? 'none' : 'blur(3px)',
                pointerEvents: isNight ? 'auto' : 'none',
              }}>
                <div className={`breath-ring ${isNight ? 'breath-ring--night' : 'breath-ring--day'}`}>
                  <span className="breath-ring__value" style={{ color: isNight ? '#4edea3' : 'var(--outline)' }}>
                    {breathRate.toFixed(1)}
                  </span>
                  <span className="breath-ring__unit">BPM</span>
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--on-surface)', marginBottom: 4 }}>Breathing Rate — Live</div>
                  <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 10 }}>Normal overnight range: 12–18 BPM</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <span className="badge badge-stable">NORMAL</span>
                    <span style={{ fontSize: 11, color: 'var(--outline)', display: 'flex', alignItems: 'center', gap: 4 }}>
                      <span className="material-icons" style={{ fontSize: 12 }}>check_circle</span>
                      No apnea detected
                    </span>
                  </div>
                </div>
                <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
                  <div style={{ fontSize: 10, color: 'var(--outline)', marginBottom: 4 }}>vs. baseline</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4edea3' }}>+0.2 BPM</div>
                  <div style={{ fontSize: 10, color: 'var(--outline)' }}>Within normal drift</div>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Four-Pillar Bayesian Attribution Confidence */}
            <div className="glass-card live-pillar-card">
              <div className="live-pillar-card__header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                    <span className="material-icons" style={{ fontSize: 16, color: '#a78bfa' }}>psychology</span>
                    <span className="section-label" style={{ margin: 0 }}>Four-Pillar Bayesian Attribution Confidence</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--on-surface-variant)' }}>Compressed attribution view for right-rail monitoring</span>
                </div>
                <span style={{ fontSize: 10, fontWeight: 800, color: '#a78bfa', background: 'rgba(167,139,250,0.12)', padding: '4px 10px', borderRadius: 999, letterSpacing: '0.08em', textTransform: 'uppercase', flexShrink: 0 }}>
                  93% overall
                </span>
              </div>
              <div className="live-pillar-card__grid">
                {PILLARS.map(p => <PillarMeter key={p.title} {...p} />)}
              </div>
              <div className="confidence-footer confidence-footer--compact">
                <span className="confidence-footer__label">Overall Attribution Confidence</span>
                <span className="confidence-footer__value">93%</span>
              </div>
            </div>

            {/* SOS Alert Card */}
            {hasAlert && (
              <div style={{
                padding: '14px 16px',
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderLeft: '4px solid #EF4444',
                borderRadius: 'var(--radius)',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#EF4444', display: 'inline-block', animation: 'livePulse 1s infinite' }} />
                    <span style={{ fontSize: 12, fontWeight: 800, color: '#EF4444', letterSpacing: '0.04em' }}>SOS — FALL DETECTED</span>
                  </div>
                  <button onClick={() => setHasAlert(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#EF4444', fontSize: 16, lineHeight: 1, opacity: 0.6 }}>×</button>
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#DC2626', marginBottom: 4 }}>Bedroom · 03:38:47</div>
                <div style={{ fontSize: 12, color: '#7F1D1D', marginBottom: 12, lineHeight: 1.5 }}>
                  Phase-acceleration threshold exceeded. Resident A. No motion for 40s post-event.
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button style={{
                    flex: 1, padding: '8px 12px', background: 'white', border: '1px solid #FECACA',
                    borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, fontSize: 12, fontWeight: 600, color: '#DC2626',
                  }}>
                    <span className="material-icons" style={{ fontSize: 14 }}>group</span>
                    Alert family ↗
                  </button>
                  <button style={{
                    flex: 1, padding: '8px 12px', background: 'white', border: '1px solid #FECACA',
                    borderRadius: 8, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, fontSize: 12, fontWeight: 600, color: '#DC2626',
                  }}>
                    <span className="material-icons" style={{ fontSize: 14 }}>call</span>
                    Alert nurse ↗
                  </button>
                </div>
              </div>
            )}

            {/* Live Vitals — Resident A */}
            <div className="glass-card" style={{ padding: 18, position: 'relative', overflow: 'hidden' }}>
              {!isNight && (
                <div className="day-mode-overlay">
                  <span className="material-icons" style={{ fontSize: 20 }}>bedtime_off</span>
                  <span>Day mode — vitals training paused</span>
                </div>
              )}
              <div style={{ filter: isNight ? 'none' : 'blur(3px)', pointerEvents: isNight ? 'auto' : 'none' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 14 }}>
                  <span className="material-icons" style={{ fontSize: 14, color: '#4edea3' }}>monitor_heart</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                    Live Vitals — Resident A
                  </span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {VITALS.map(v => (
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
                  Vitals shown only when attribution confidence ≥ 70% · bedroom solo window
                </div>
              </div>
            </div>

            {/* Recent Alerts */}
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <span className="material-icons" style={{ fontSize: 14, color: 'var(--outline)' }}>notifications</span>
                <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--on-surface)', letterSpacing: '0.05em', textTransform: 'uppercase' }}>Recent Alerts</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {RECENT_ALERTS.map((a, i) => (
                  <div key={i} style={{
                    padding: '10px 12px',
                    background: a.bg,
                    borderRadius: 8,
                    borderLeft: `3px solid ${a.color}`,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: 10,
                  }}>
                    <span className="material-icons" style={{ fontSize: 16, color: a.color, flexShrink: 0, marginTop: 1 }}>{a.icon}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#1E293B', marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{a.label}</div>
                      <div style={{ fontSize: 10, color: '#64748B' }}>{a.sub}</div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: '#94A3B8', flexShrink: 0 }}>{a.time}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* System Telemetry */}
            <div className="glass-card" style={{ padding: 16 }}>
              <span className="section-label" style={{ display: 'block', marginBottom: 10 }}>System Telemetry</span>
              {[
                { label: 'SYNC STATUS',   value: 'ACTIVE',      color: '#4edea3'           },
                { label: 'LATENCY',       value: '0.2 ms',      color: 'var(--on-surface)' },
                { label: 'SENSOR LOAD',   value: '42%',         color: 'var(--on-surface)' },
                { label: 'PACKET LOSS',   value: '0.01%',       color: '#4edea3'           },
                { label: 'TELEMETRY',     value: 'ENCRYPTED',   color: '#adc6ff'           },
                { label: 'MODE',          value: modeLabel,     color: modeColor            },
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
