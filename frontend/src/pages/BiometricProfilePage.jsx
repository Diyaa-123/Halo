import React from 'react';
import './PageLayout.css';

/* ─── PDF-sourced constants ────────────────────────────────────────────────── */
// Avg breathing: 14.2 brpm  |  Attribution: 76% high-confidence, 24% ambiguous
// Sleep quality: Jul 12 82/100, Jul 13 80/100, Jul 14 52/100
// Fall events: 2 (Jul 14 14:32 @ 91%, 19:47 @ 87%)
// Drift: <3% — no recalibration needed

/* ─── Reusable bar histogram ───────────────────────────────────────────────── */
function BarHistogram({ bars, color, peakLabel, leftLabel, rightLabel, height = 120 }) {
  const max = Math.max(...bars);
  return (
    <div>
      <div style={{ height, display: 'flex', alignItems: 'flex-end', gap: 3, marginTop: 14 }}>
        {bars.map((val, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              background: color,
              opacity: val / max > 0.65 ? 1 : val / max > 0.35 ? 0.55 : 0.25,
              height: `${(val / max) * 100}%`,
              borderRadius: 3,
              transition: 'height 0.4s ease',
            }}
          />
        ))}
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, fontSize: 11, color: 'var(--outline)' }}>
        <span>{leftLabel}</span>
        <span style={{ color, fontWeight: 700 }}>{peakLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}

/* ─── Donut/arc component for attribution ──────────────────────────────────── */
function AttributionDonut({ pct }) {
  const r = 52, cx = 70, cy = 70;
  const circ = 2 * Math.PI * r;
  const filled = (pct / 100) * circ;
  return (
    <svg viewBox="0 0 140 140" style={{ width: 140, height: 140 }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(148,163,184,0.18)" strokeWidth="14" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#4edea3" strokeWidth="14"
        strokeDasharray={`${filled} ${circ - filled}`}
        strokeDashoffset={circ / 4}
        strokeLinecap="round"
        style={{ filter: 'drop-shadow(0 0 6px rgba(78,222,163,0.4))' }}
      />
      <text x={cx} y={cy - 6} textAnchor="middle" fontSize="22" fontWeight="900" fill="var(--on-surface)">{pct}%</text>
      <text x={cx} y={cy + 14} textAnchor="middle" fontSize="10" fill="var(--outline)">attributed</text>
    </svg>
  );
}

export default function BiometricProfilePage() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>monitor_heart</span>
          <div>
            <h1 className="page-layout__title">Biometric Profile</h1>
            <p className="page-layout__subtitle">Learned baseline distributions for Mrs. Lakshmi Rao — Monitoring started 4 days ago</p>
          </div>
        </div>
        <span className="badge badge-stable">CALIBRATED</span>
      </div>

      <div className="page-layout__content">

        {/* ── KPI row ──────────────────────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          {[
            { label: 'Avg Breathing Rate', value: '14.2', unit: 'brpm', color: 'var(--primary)' },
            { label: 'Attribution Quality', value: '76', unit: '%', color: '#4edea3' },
            { label: 'Avg Sleep Quality', value: '71', unit: '/ 100', color: '#f59e0b' },
            { label: 'Signal Confidence', value: '87', unit: '%', color: 'var(--secondary)' },
          ].map(k => (
            <div key={k.label} className="glass-card" style={{ padding: '18px 20px', borderTop: `4px solid ${k.color}` }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>{k.label}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 30, fontWeight: 900, color: k.color, lineHeight: 1 }}>{k.value}</span>
                <span style={{ fontSize: 13, color: 'var(--outline)' }}>{k.unit}</span>
              </div>
            </div>
          ))}
        </div>

        {/* ── Distribution charts row ───────────────────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20, marginBottom: 20 }}>

          {/* Breathing Rate — peak at 14.2 brpm, range 10–18, right-leaning normal dist */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 className="section-label">Breathing Rate Distribution</h3>
            <p style={{ fontSize: 11, color: 'var(--outline)', margin: '4px 0 0' }}>3-day baseline · 72 monitoring intervals</p>
            <BarHistogram
              bars={[1, 3, 8, 18, 42, 72, 95, 100, 88, 64, 38, 18, 7, 2]}
              color="var(--primary)"
              leftLabel="10 brpm"
              peakLabel="14.2 brpm peak"
              rightLabel="18 brpm"
            />
          </div>

          {/* Signal Regularity — 76% high conf, left-skewed (most sessions high) */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 className="section-label">Signal Regularity Index</h3>
            <p style={{ fontSize: 11, color: 'var(--outline)', margin: '4px 0 0' }}>76% high-confidence · 24% ambiguous excluded</p>
            <BarHistogram
              bars={[2, 3, 5, 8, 12, 22, 38, 60, 85, 100, 94, 72, 40]}
              color="#4edea3"
              leftLabel="Low"
              peakLabel="76% high-conf"
              rightLabel="Perfect"
            />
          </div>

          {/* CSI Amplitude — normal range with Jul 14 spike shown via right tail */}
          <div className="glass-card" style={{ padding: 22 }}>
            <h3 className="section-label">CSI Amplitude Distribution</h3>
            <p style={{ fontSize: 11, color: 'var(--outline)', margin: '4px 0 0' }}>Jul 14 spike visible — fall-event variance</p>
            <BarHistogram
              bars={[4, 10, 22, 42, 70, 95, 100, 88, 65, 44, 28, 38, 18]}
              color="var(--warning-amber)"
              leftLabel="Weak"
              peakLabel="Normal range"
              rightLabel="Strong"
            />
          </div>
        </div>

        {/* ── Attribution quality + sleep nights ───────────────────────────── */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 20 }}>

          <div className="glass-card" style={{ padding: 22, display: 'flex', gap: 24, alignItems: 'center' }}>
            <AttributionDonut pct={76} />
            <div style={{ flex: 1 }}>
              <h3 className="section-label" style={{ marginBottom: 12 }}>Attribution Quality</h3>
              {[
                { label: 'High-confidence intervals', value: '76%', color: '#4edea3' },
                { label: 'Ambiguous / shared activity', value: '24%', color: '#f59e0b' },
                { label: 'Excluded from profile', value: '24%', color: 'var(--outline)' },
                { label: 'Monitoring window', value: 'Jul 12–14 (3 days)', color: 'var(--on-surface-variant)' },
              ].map(row => (
                <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid rgba(148,163,184,0.10)', fontSize: 12 }}>
                  <span style={{ color: 'var(--on-surface-variant)' }}>{row.label}</span>
                  <strong style={{ color: row.color }}>{row.value}</strong>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 22 }}>
            <h3 className="section-label" style={{ marginBottom: 12 }}>Nightly Sleep Quality</h3>
            {[
              { night: 'July 12', quality: 82, duration: '7.4h', color: '#4edea3', note: 'Steady, baseline aligned' },
              { night: 'July 13', quality: 80, duration: '7.2h', color: '#4edea3', note: 'Steady, baseline aligned' },
              { night: 'July 14', quality: 52, duration: '5.6h', color: '#ef4444', note: 'Disrupted — 2 fall events' },
            ].map(n => (
              <div key={n.night} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 0', borderBottom: '1px solid rgba(148,163,184,0.10)' }}>
                <div style={{ minWidth: 60, fontSize: 11, color: 'var(--outline)', fontWeight: 700 }}>{n.night}</div>
                <div style={{ flex: 1, background: 'rgba(148,163,184,0.12)', borderRadius: 4, height: 8, overflow: 'hidden' }}>
                  <div style={{ width: `${n.quality}%`, height: '100%', background: n.color, borderRadius: 4, transition: 'width 0.5s ease' }} />
                </div>
                <div style={{ minWidth: 52, textAlign: 'right', fontSize: 12, fontWeight: 800, color: n.color }}>{n.quality}/100</div>
                <div style={{ minWidth: 38, textAlign: 'right', fontSize: 11, color: 'var(--outline)' }}>{n.duration}</div>
              </div>
            ))}
            <div style={{ marginTop: 12, padding: '10px 0', display: 'flex', justifyContent: 'space-between', fontSize: 12 }}>
              <span style={{ color: 'var(--outline)' }}>3-day average</span>
              <strong style={{ color: '#f59e0b' }}>71 / 100 · 6.4h</strong>
            </div>
          </div>
        </div>

        {/* ── Baseline Drift ────────────────────────────────────────────────── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
            <div>
              <h3 className="section-label">Baseline Drift Monitoring</h3>
              <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginTop: 4, lineHeight: 1.6 }}>
                The system compares nightly readings against Mrs. Lakshmi Rao's enrolled biometric signature.
                Current drift is <strong style={{ color: '#4edea3' }}>&lt;3%</strong>, within acceptable range for a 3-day window.
                The July 14 fall events caused a temporary CSI amplitude spike — this is expected and does not require recalibration.
              </p>
            </div>
            <span className="badge badge-stable" style={{ marginLeft: 16, flexShrink: 0 }}>NO ACTION NEEDED</span>
          </div>

          {/* Drift bar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
            <span style={{ fontSize: 11, color: 'var(--outline)', minWidth: 60 }}>0% drift</span>
            <div style={{ flex: 1, background: 'var(--surface-container-high)', borderRadius: 6, height: 10, overflow: 'hidden', position: 'relative' }}>
              <div style={{ position: 'absolute', left: 0, top: 0, height: '100%', width: '3%', background: 'var(--primary)', borderRadius: 6, transition: 'width 0.6s ease' }} />
              {/* Threshold marker at 15% */}
              <div style={{ position: 'absolute', left: '15%', top: 0, height: '100%', width: 2, background: '#ef4444', opacity: 0.5 }} />
            </div>
            <span style={{ fontSize: 11, color: '#ef4444', minWidth: 120, textAlign: 'right' }}>Re-enrollment at 15%</span>
          </div>

          {/* Per-metric drift table */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginTop: 20 }}>
            {[
              { metric: 'Breathing Rate', baseline: '14.2 brpm', current: '14.2 brpm', drift: '0.0%', ok: true },
              { metric: 'Heart Rate',     baseline: '68 bpm',    current: '69 bpm',    drift: '1.5%', ok: true },
              { metric: 'CSI Amplitude',  baseline: 'Normal',    current: '+spike Jul 14', drift: '2.8%', ok: true },
              { metric: 'Signal Regularity', baseline: '78%',   current: '76%',       drift: '2.6%', ok: true },
            ].map(row => (
              <div key={row.metric} style={{ background: 'rgba(148,163,184,0.07)', borderRadius: 8, padding: '12px 14px' }}>
                <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 6 }}>{row.metric}</div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 2 }}>Baseline: <strong style={{ color: 'var(--on-surface)' }}>{row.baseline}</strong></div>
                <div style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 6 }}>Current: <strong style={{ color: 'var(--on-surface)' }}>{row.current}</strong></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 900, color: row.ok ? '#4edea3' : '#ef4444' }}>{row.drift}</span>
                  <span className="badge badge-stable" style={{ fontSize: 9, padding: '2px 6px' }}>OK</span>
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
