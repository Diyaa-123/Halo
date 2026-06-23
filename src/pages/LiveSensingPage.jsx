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
  const activeSensorColor = isNight ? '#4edea3' : '#adc6ff';
  const residentColor     = '#4edea3';

  return (
    <svg viewBox="0 0 300 220" className="floor-plan-svg">
      {/* Background */}
      <rect x="10" y="10" width="280" height="200" rx="6" fill="var(--surface-container-low)" stroke="var(--outline-variant)" strokeWidth="1.5" />

      {/* Room dividers */}
      <line x1="155" y1="10"  x2="155" y2="210" stroke="var(--outline-variant)" strokeWidth="1.2" strokeDasharray="5 3" />
      <line x1="10"  y1="110" x2="155" y2="110" stroke="var(--outline-variant)" strokeWidth="1.2" strokeDasharray="5 3" />
      <line x1="155" y1="115" x2="290" y2="115" stroke="var(--outline-variant)" strokeWidth="1.2" strokeDasharray="5 3" />

      {/* Room labels */}
      <text x="82"  y="34" textAnchor="middle" fontSize="9"  fill="var(--outline)" fontFamily="Inter" fontWeight="600">BEDROOM</text>
      <text x="222" y="34" textAnchor="middle" fontSize="9"  fill="var(--outline)" fontFamily="Inter" fontWeight="600">LIVING ROOM</text>
      <text x="55"  y="168" textAnchor="middle" fontSize="9" fill="var(--outline)" fontFamily="Inter" fontWeight="600">BATHROOM</text>
      <text x="222" y="168" textAnchor="middle" fontSize="9" fill="var(--outline)" fontFamily="Inter" fontWeight="600">KITCHEN</text>

      {/* Sensor coverage circles (faint) */}
      <circle cx="82"  cy="70"  r="38" fill="none" stroke={activeSensorColor} strokeWidth="0.8" strokeDasharray="3 4" opacity="0.4">
        {isNight && <animate attributeName="r" values="38;45;38" dur="3s" repeatCount="indefinite" />}
      </circle>

      {/* Sensor nodes */}
      {/* S1 — Bedroom — ACTIVE */}
      <circle cx="82" cy="70" r="9" fill={`${activeSensorColor}33`} stroke={activeSensorColor} strokeWidth="1.8">
        <animate attributeName="r" values="9;13;9" dur="2.5s" repeatCount="indefinite" />
        <animate attributeName="stroke-opacity" values="1;0.4;1" dur="2.5s" repeatCount="indefinite" />
      </circle>
      <text x="82" y="73" textAnchor="middle" fontSize="7" fill={activeSensorColor} fontWeight="800">S1</text>

      {/* S2 — Living Room — idle */}
      <circle cx="222" cy="70" r="7" fill="rgba(173,198,255,0.15)" stroke="#adc6ff" strokeWidth="1.5" />
      <text x="222" y="73" textAnchor="middle" fontSize="7" fill="#adc6ff" fontWeight="700">S2</text>

      {/* S3 — Bathroom — idle */}
      <circle cx="55" cy="160" r="7" fill="rgba(173,198,255,0.15)" stroke="#adc6ff" strokeWidth="1.5" />
      <text x="55" y="163" textAnchor="middle" fontSize="7" fill="#adc6ff" fontWeight="700">S3</text>

      {/* S4 — Kitchen — offline */}
      <circle cx="222" cy="160" r="7" fill="rgba(239,68,68,0.12)" stroke="#EF4444" strokeWidth="1.5" opacity="0.6" />
      <text x="222" y="163" textAnchor="middle" fontSize="7" fill="#EF4444" fontWeight="700">S4</text>

      {/* Resident marker */}
      <circle cx="82" cy="88" r="11" fill={`${residentColor}44`} stroke={residentColor} strokeWidth="2">
        <animate attributeName="opacity" values="1;0.5;1" dur="1.8s" repeatCount="indefinite" />
      </circle>
      <text x="82" y="92" textAnchor="middle" fontSize="9" fill={residentColor} fontWeight="800">A</text>

      {/* Wifi signal from S1 */}
      {[14, 22, 30].map((r, i) => (
        <circle key={i} cx="82" cy="70" r={r} fill="none"
          stroke={activeSensorColor} strokeWidth="0.7"
          opacity={isNight ? (0.4 - i * 0.1) : 0.15}
        />
      ))}
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

            {/* Four-Pillar Bayesian Confidence */}
            <div className="glass-card" style={{ padding: 20 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 18 }}>
                <span className="material-icons" style={{ fontSize: 16, color: '#a78bfa' }}>psychology</span>
                <span className="section-label" style={{ margin: 0 }}>Four-Pillar Bayesian Attribution Confidence</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {PILLARS.map(p => <PillarMeter key={p.title} {...p} />)}
              </div>
              <div className="confidence-footer">
                <span className="confidence-footer__label">Overall Attribution Confidence</span>
                <span className="confidence-footer__value">93%</span>
              </div>
            </div>
          </div>

          {/* ── RIGHT COLUMN ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

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

            {/* Floor Plan */}
            <div className="glass-card" style={{ padding: 18 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span className="section-label" style={{ margin: 0 }}>Room Occupancy Map</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: modeColor, background: `${modeColor}18`, padding: '2px 8px', borderRadius: 999 }}>
                  {modeLabel}
                </span>
              </div>
              <FloorPlan mode={mode} />
              <div style={{ display: 'flex', gap: 14, marginTop: 12, flexWrap: 'wrap' }}>
                {[
                  { color: modeColor,  label: 'Active Sensor' },
                  { color: '#adc6ff',  label: 'Idle Sensor'   },
                  { color: '#EF4444',  label: 'Offline'        },
                  { color: '#4edea3',  label: 'Resident (A)'  },
                ].map(({ color, label }) => (
                  <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <span style={{ width: 7, height: 7, borderRadius: '50%', background: color, display: 'inline-block', flexShrink: 0 }} />
                    <span style={{ fontSize: 10, color: 'var(--outline)' }}>{label}</span>
                  </div>
                ))}
              </div>
            </div>

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
