import React from 'react';
import './InsightsColumn.css';
import { useSensing } from '../../hooks/SensingContext';

const PILLARS = [
  { label: 'Spatial', color: '#4edea3' },
  { label: 'Temporal', color: '#adc6ff' },
  { label: 'Biometric', color: '#F59E0B' },
  { label: 'Behavioral', color: '#a78bfa' },
];

function SectionHeader({ icon, label, color = 'var(--primary)', right }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span className="material-icons" style={{ fontSize: 15, color }}>{icon}</span>
        <span className="section-label" style={{ margin: 0 }}>{label}</span>
      </div>
      {right}
    </div>
  );
}

export default function InsightsColumn({ isNightMode = false }) {
  const sensing = useSensing();

  const live = sensing.isConnected;
  const breathing = sensing.breathingRate;
  const heartRate = sensing.heartRate;
  const confidence = sensing.confidence != null ? Math.round(sensing.confidence * 100) : null;
  const occupancy = sensing.estimatedPersons ?? null;
  const motion = sensing.motionLevel || 'absent';
  const streamLabel = sensing.streamStatus || (live ? 'live' : 'offline');

  const livePillars = [
    { label: 'Spatial', score: live ? (sensing.presence ? 96 : 0) : null, color: '#4edea3' },
    { label: 'Temporal', score: live ? Math.min(100, (confidence ?? 0) + 6) : null, color: '#adc6ff' },
    { label: 'Biometric', score: live && breathing != null ? Math.min(100, Math.max(35, 40 + Math.round(breathing * 2))) : null, color: '#F59E0B' },
    { label: 'Behavioral', score: live ? (motion === 'active' ? 72 : 84) : null, color: '#a78bfa' },
  ];

  const liveSummary = live
    ? [
        { dot: '#4edea3', text: breathing != null ? `Breathing ${breathing.toFixed(1)} brpm from live CSI feed` : 'Breathing rate not yet available' },
        { dot: '#adc6ff', text: heartRate != null ? `Heart rate ${Math.round(heartRate)} bpm from backend feed` : 'Heart rate not yet available' },
        { dot: '#F59E0B', text: occupancy != null ? `${occupancy} occupant${occupancy === 1 ? '' : 's'} estimated in frame` : 'Occupancy count not yet available' },
      ]
    : [
        { dot: '#EF4444', text: 'Backend websocket disconnected' },
        { dot: '#94A3B8', text: 'No live metrics are being synthesized' },
      ];

  return (
    <>
      {isNightMode ? (
        <>
          <div className="glass-card" style={{ padding: 20 }}>
            <SectionHeader
              icon="air"
              label="Live Breathing Rate"
              color="#4edea3"
              right={<span className="badge badge-stable" style={{ fontSize: 9 }}>{live ? 'LIVE' : 'OFFLINE'}</span>}
            />
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', marginBottom: 10 }}>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                <span style={{ fontSize: 36, fontWeight: 800, color: '#4edea3', fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                  {breathing != null ? breathing.toFixed(1) : '--'}
                </span>
                <span style={{ fontSize: 12, color: 'var(--outline)', marginBottom: 2 }}>brpm</span>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: 10, color: 'var(--outline)' }}>confidence</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#4edea3' }}>{confidence != null ? `${confidence}%` : '--'}</div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, flexDirection: 'column' }}>
              {liveSummary.map((item) => (
                <div key={item.text} style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                  <span style={{ width: 7, height: 7, borderRadius: '50%', background: item.dot, display: 'inline-block', flexShrink: 0, marginTop: 4 }} />
                  <span style={{ fontSize: 12, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <SectionHeader
              icon="psychology"
              label="Live Attribution Confidence"
              color="#a78bfa"
              right={<span style={{ fontSize: 20, fontWeight: 800, color: '#4edea3' }}>{confidence != null ? `${confidence}%` : '--'}</span>}
            />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {livePillars.map((pillar) => (
                <div key={pillar.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--outline)', width: 60, flexShrink: 0 }}>{pillar.label}</span>
                  <div style={{ flex: 1, height: 5, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: `${pillar.score == null ? 0 : pillar.score}%`, height: '100%', background: pillar.color, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pillar.color, width: 28, textAlign: 'right', flexShrink: 0 }}>
                    {pillar.score == null ? '--' : `${pillar.score}%`}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <SectionHeader icon="monitor_heart" label="Live Vitals Snapshot" color="#EF4444" />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {[
                { label: 'Breathing', value: breathing != null ? `${breathing.toFixed(1)} brpm` : '--', sub: 'from backend feed', color: '#4edea3', icon: 'air' },
                { label: 'Heart Rate', value: heartRate != null ? `${Math.round(heartRate)} bpm` : '--', sub: 'from backend feed', color: '#adc6ff', icon: 'favorite' },
                { label: 'Occupancy', value: occupancy != null ? `${occupancy}` : '--', sub: live ? 'live count' : 'offline', color: '#F59E0B', icon: 'sensor_occupied' },
                { label: 'Stream', value: streamLabel.toUpperCase(), sub: 'backend status', color: live ? '#4edea3' : '#EF4444', icon: 'lan' },
              ].map((item) => (
                <div key={item.label} style={{ background: 'var(--surface-container-low)', borderRadius: 10, padding: '12px 12px 10px', border: '1px solid var(--border-muted)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6 }}>
                    <span className="material-icons" style={{ fontSize: 14, color: item.color }}>{item.icon}</span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{item.label}</span>
                  </div>
                  <div style={{ fontSize: 16, fontWeight: 800, color: item.color, marginBottom: 2 }}>{item.value}</div>
                  <div style={{ fontSize: 10, color: 'var(--outline)' }}>{item.sub}</div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <span className="material-icons icon-sm" style={{ color: 'var(--secondary)' }}>wifi</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>SilentSense Network</div>
              <div style={{ fontSize: 10, color: 'var(--outline)' }}>{live ? 'Live feed connected' : 'Backend offline'}</div>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="glass-card" style={{ padding: 20 }}>
            <SectionHeader
              icon="sensor_occupied"
              label="Zone & Activity"
              color="#adc6ff"
              right={<span className="badge" style={{ background: 'rgba(173,198,255,0.12)', color: '#adc6ff', border: '1px solid rgba(173,198,255,0.3)', fontSize: 9 }}>LIVE</span>}
            />
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
              {[
                { label: 'Zone', val: live ? (sensing.presence ? 'Bedroom' : 'Empty') : 'Offline' },
                { label: 'Activity', val: live ? motion : 'Offline' },
                { label: 'Occupancy', val: live ? (occupancy != null ? `${occupancy}` : '--') : '--' },
              ].map((m) => (
                <div key={m.label} style={{ background: 'var(--surface-container-low)', borderRadius: 8, padding: '10px 10px 8px' }}>
                  <div style={{ fontSize: 9, fontWeight: 700, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 4 }}>{m.label}</div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>{m.val}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <SectionHeader icon="air" label="Live Respiration" color="#4edea3" />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 8 }}>
              <span style={{ fontSize: 12, color: 'var(--on-surface-variant)' }}>Backend-derived respiration anchor</span>
              <span style={{ fontSize: 22, fontWeight: 800, color: '#4edea3', lineHeight: 1 }}>{breathing != null ? `${breathing.toFixed(1)} brpm` : '--'}</span>
            </div>
            <p style={{ fontSize: 11, color: 'var(--outline)', lineHeight: 1.5 }}>
              {live ? 'No simulated values are used here.' : 'Connect the websocket backend to populate live metrics.'}
            </p>
          </div>

          <div className="glass-card" style={{ padding: 20 }}>
            <SectionHeader icon="psychology" label="Attribution Confidence" color="#a78bfa" right={<span style={{ fontSize: 20, fontWeight: 800, color: '#4edea3' }}>{confidence != null ? `${confidence}%` : '--'}</span>} />
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {PILLARS.map((pillar) => (
                <div key={pillar.label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 11, color: 'var(--outline)', width: 60, flexShrink: 0 }}>{pillar.label}</span>
                  <div style={{ flex: 1, height: 5, background: 'var(--surface-container-high)', borderRadius: 999, overflow: 'hidden' }}>
                    <div style={{ width: live ? `${confidence ?? 0}%` : '0%', height: '100%', background: pillar.color, borderRadius: 999 }} />
                  </div>
                  <span style={{ fontSize: 11, fontWeight: 700, color: pillar.color, width: 28, textAlign: 'right', flexShrink: 0 }}>{live ? `${confidence ?? 0}%` : '--'}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 0' }}>
            <span className="material-icons icon-sm" style={{ color: 'var(--secondary)' }}>wifi</span>
            <div>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>SilentSense Network</div>
              <div style={{ fontSize: 10, color: 'var(--outline)' }}>{live ? 'Live feed connected' : 'Backend offline'}</div>
            </div>
          </div>
        </>
      )}
    </>
  );
}
