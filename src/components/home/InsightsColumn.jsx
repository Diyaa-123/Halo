import React, { useEffect, useRef, useState } from 'react';
import './InsightsColumn.css';

/* ─────────────────────────────────────────
   Animated Breathing Sparkline
───────────────────────────────────────── */
function BreathSparkline() {
  const canvasRef = useRef(null);
  const aniRef    = useRef(null);
  const offRef    = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = canvas.offsetWidth || 180;
      const H = canvas.height;
      canvas.width = W;
      ctx.clearRect(0, 0, W, H);
      offRef.current += 0.022;
      const off = offRef.current;

      ctx.beginPath();
      ctx.strokeStyle = 'rgba(78,222,163,0.18)';
      ctx.lineWidth = 8;
      for (let x = 0; x < W; x++) {
        const t = (x / W) * Math.PI * 6 + off;
        const y = H / 2 - Math.sin(t * 0.35) * 10 - Math.sin(t * 0.7) * 2.5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.strokeStyle = '#4edea3';
      ctx.lineWidth = 1.8;
      for (let x = 0; x < W; x++) {
        const t = (x / W) * Math.PI * 6 + off;
        const y = H / 2 - Math.sin(t * 0.35) * 10 - Math.sin(t * 0.7) * 2.5;
        x === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
      }
      ctx.stroke();

      // cursor dot
      const cx = W - 2;
      const ct = (cx / W) * Math.PI * 6 + off;
      const cy = H / 2 - Math.sin(ct * 0.35) * 10 - Math.sin(ct * 0.7) * 2.5;
      ctx.beginPath();
      ctx.arc(cx, cy, 3.5, 0, Math.PI * 2);
      ctx.fillStyle = '#4edea3';
      ctx.fill();

      aniRef.current = requestAnimationFrame(draw);
    };
    draw();
    return () => cancelAnimationFrame(aniRef.current);
  }, []);

  return <canvas ref={canvasRef} height={32} style={{ width: '100%', display: 'block' }} />;
}

/* ─────────────────────────────────────────
   Four-Pillar mini bars
───────────────────────────────────────── */
const PILLARS = [
  { label: 'Spatial',    score: 98, color: '#4edea3' },
  { label: 'Temporal',   score: 95, color: '#adc6ff' },
  { label: 'Biometric',  score: 88, color: '#F59E0B' },
  { label: 'Behavioral', score: 90, color: '#a78bfa' },
];

/* ─────────────────────────────────────────
   Main Component
───────────────────────────────────────── */
export default function InsightsColumn({ isNightMode = false }) {
  // Jitter breathing rate (night)
  const [breathRate, setBreathRate] = useState(14.2);
  useEffect(() => {
    if (!isNightMode) return;
    const id = setInterval(() => {
      setBreathRate(p => Math.round(Math.min(18, Math.max(10, p + (Math.random() - 0.5) * 0.4)) * 10) / 10);
    }, 2000);
    return () => clearInterval(id);
  }, [isNightMode]);

  // Sleep quality build
  const [sleepQ, setSleepQ] = useState(71);
  useEffect(() => {
    if (!isNightMode) return;
    const id = setInterval(() => setSleepQ(p => Math.min(100, p + (Math.random() > 0.7 ? 1 : 0))), 5000);
    return () => clearInterval(id);
  }, [isNightMode]);

  // ── Shared card header ──
  const SectionHeader = ({ icon, label, color = 'var(--primary)', right }) => (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className="material-icons" style={{ fontSize: 15, color }}>{icon}</span>
        <span className="section-label" style={{ margin: 0 }}>{label}</span>
      </div>
      {right}
    </div>
  );

  /* ══════════════════════════
     DAY MODE
  ══════════════════════════ */
  if (!isNightMode) return (
    <>
      {/* Card 1 — Zone + Activity */}
      <div className="glass-card" style={{ padding: 20 }}>
        <SectionHeader icon="sensor_occupied" label="Zone &amp; Activity" color="#adc6ff"
          right={<span className="badge" style={{ background: 'rgba(173,198,255,0.12)', color: '#adc6ff', border: '1px solid rgba(173,198,255,0.3)', fontSize: 9 }}>DAY MODE</span>}
        />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
          {[
            { label: 'Zone',     val: 'Living Room' },
            { label: 'Activity', val: 'Sedentary'   },
            { label: 'Occupancy',val: 'Single'       },
          ].map(m => (
            <div key={m.label} style={{ background: 'var(--surface-container-low)', borderRadius: 8, padding: '10px 10px 8px' }}>
              <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{m.label}</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{m.val}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 2 — Attribution confidence */}
      <div className="glass-card" style={{ padding: 20 }}>
        <SectionHeader icon="person_search" label="Attribution Confidence" color="var(--primary)" />
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
          <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>How sure we are this is Arun</span>
          <span style={{ fontSize: 22, fontWeight: 800, color: '#adc6ff', lineHeight: 1 }}>84%</span>
        </div>
        <div style={{ height: 6, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden', marginBottom: 8 }}>
          <div style={{ width: '84%', height: '100%', background: '#adc6ff', borderRadius: 999 }} />
        </div>
        <p style={{ fontSize: 11, color: 'var(--outline)', lineHeight: 1.5 }}>
          Day mode — spatial signal only · biometric training paused until night
        </p>
      </div>

      {/* Card 3 — Last night sleep summary */}
      <div className="glass-card" style={{ padding: 20 }}>
        <SectionHeader icon="bedtime" label="Last Night's Sleep" color="#4edea3" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            { dot: '#4edea3', text: 'Slept 7.5 h  ·  Lights out 22:18, woke 05:48' },
            { dot: '#4edea3', text: 'Breathing normal  ·  Avg 14.2 brpm' },
            { dot: '#4edea3', text: '0 apnea events detected' },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.dot, display: 'inline-block', flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4 — Daily routine + inactivity */}
      <div className="glass-card" style={{ padding: 20 }}>
        <SectionHeader icon="timeline" label="Daily Routine Status" color="var(--warning-amber)" />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {[
            { dot: '#4edea3', text: 'Morning routine completed on time'       },
            { dot: '#F59E0B', text: 'No movement detected  14:00 – 14:45'    },
            { dot: '#F59E0B', text: 'Less walking than usual today'           },
          ].map((r, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: r.dot, display: 'inline-block', flexShrink: 0, marginTop: 4 }} />
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
        <span className="material-icons icon-sm" style={{ color: 'var(--secondary)' }}>wifi</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>SilentSense Network</div>
          <div style={{ fontSize: 10, color: 'var(--outline)' }}>3 ESP32 Nodes Active · High Signal</div>
        </div>
      </div>
    </>
  );

  /* ══════════════════════════
     NIGHT MODE
  ══════════════════════════ */
  return (
    <>
      {/* Card 1 — Live Breathing Rate */}
      <div className="glass-card" style={{ padding: 20, border: '1px solid rgba(78,222,163,0.2)' }}>
        <SectionHeader icon="air" label="Live Breathing Rate" color="#4edea3"
          right={<span className="badge badge-stable" style={{ fontSize: 9 }}>NORMAL</span>}
        />
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
            <span style={{ fontSize: 36, fontWeight: 800, color: '#4edea3', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
              {breathRate.toFixed(1)}
            </span>
            <span style={{ fontSize: 12, color: 'var(--outline)', marginBottom: 2 }}>brpm</span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 10, color: 'var(--outline)' }}>vs. baseline</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#4edea3' }}>+0.2</div>
          </div>
        </div>
        <BreathSparkline />
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 9, color: 'var(--outline)' }}>
          <span>T−60s</span><span>T−30s</span><span style={{ color: '#4edea3', fontWeight: 700 }}>Now</span>
        </div>
      </div>

      {/* Card 2 — Sleep Quality */}
      <div className="glass-card" style={{ padding: 20 }}>
        <SectionHeader icon="bedtime" label="Sleep Quality Score" color="#adc6ff"
          right={<span style={{ fontSize: 20, fontWeight: 800, color: '#4edea3' }}>{sleepQ}<span style={{ fontSize: 11, fontWeight: 500, color: 'var(--outline)' }}>/100</span></span>}
        />
        <div style={{ height: 6, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden', marginBottom: 6 }}>
          <div style={{ width: `${sleepQ}%`, height: '100%', background: 'linear-gradient(90deg,#4edea3,#adc6ff)', borderRadius: 999, transition: 'width 1s ease' }} />
        </div>
        <p style={{ fontSize: 10, color: 'var(--outline)' }}>Building in real-time · updates every sleep cycle</p>
      </div>

      {/* Card 3 — Vitals snapshot grid */}
      <div className="glass-card" style={{ padding: 20 }}>
        <SectionHeader icon="monitor_heart" label="Vitals Snapshot" color="#EF4444" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {[
            { label: 'Apnea Events',  value: '0',      sub: 'tonight',   color: '#4edea3', icon: 'check_circle'  },
            { label: 'Restlessness',  value: 'Low',    sub: 'baseline',  color: '#4edea3', icon: 'self_improvement' },
            { label: 'Bed Status',    value: 'In Bed', sub: 'since 22:18', color: '#4edea3', icon: 'king_bed'   },
            { label: 'Apnea Rate',    value: '0 /h',   sub: 'normal',    color: '#4edea3', icon: 'air'           },
          ].map(s => (
            <div key={s.label} style={{
              background: 'var(--surface-container-low)', borderRadius: 10,
              padding: '12px 12px 10px', border: '1px solid var(--border-muted)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                <span className="material-icons" style={{ fontSize: 14, color: s.color }}>{s.icon}</span>
                <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{s.label}</span>
              </div>
              <div style={{ fontSize: 16, fontWeight: 800, color: s.color, marginBottom: 2 }}>{s.value}</div>
              <div style={{ fontSize: 10, color: 'var(--outline)' }}>{s.sub}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Card 4 — Attribution confidence (four pillars) */}
      <div className="glass-card" style={{ padding: 20 }}>
        <SectionHeader icon="psychology" label="Attribution Confidence" color="#a78bfa"
          right={<span style={{ fontSize: 20, fontWeight: 800, color: '#4edea3' }}>93%</span>}
        />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
          {PILLARS.map(p => (
            <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 11, color: 'var(--outline)', width: 60, flexShrink: 0 }}>{p.label}</span>
              <div style={{ flex: 1, height: 5, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden' }}>
                <div style={{ width: `${p.score}%`, height: '100%', background: p.color, borderRadius: 999 }} />
              </div>
              <span style={{ fontSize: 11, fontWeight: 700, color: p.color, width: 28, textAlign: 'right', flexShrink: 0 }}>{p.score}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
        <span className="material-icons icon-sm" style={{ color: 'var(--secondary)' }}>wifi</span>
        <div>
          <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>SilentSense Network</div>
          <div style={{ fontSize: 10, color: 'var(--outline)' }}>3 ESP32 Nodes Active · High Signal</div>
        </div>
      </div>
    </>
  );
}
