import React, { useState } from 'react';
import './PageLayout.css';
import './SettingsPage.css';

const PRIVACY_ITEMS = [
  { name: 'WiFi CSI raw signal',             stored: false, desc: 'Processed on-device in real-time and discarded. Never persisted to disk.' },
  { name: 'Breathing rate (derived metric)', stored: true,  desc: 'Anonymised value stored locally. Encrypted at rest, never leaves your network without consent.' },
  { name: 'Sleep quality scores',            stored: true,  desc: 'Trend metric retained for 8-week analysis window. No raw biometrics.' },
  { name: 'Zone activity logs (day mode)',   stored: true,  desc: 'Room-level occupancy only — not person-level during day mode.' },
  { name: 'Video or audio recording',        stored: false, desc: 'SilentSense does NOT use cameras or microphones. Ever.' },
  { name: 'Location data outside home',      stored: false, desc: 'Fully local system. No data leaves your home network without explicit export.' },
];

export default function SettingsPage() {
  const [nightModeAuto,       setNightModeAuto]       = useState(true);
  const [nightStart,          setNightStart]           = useState('22:00');
  const [nightEnd,            setNightEnd]             = useState('07:00');
  const [apneaThreshold,      setApneaThreshold]       = useState(10);
  const [inactivityThreshold, setInactivityThreshold] = useState(20);
  const [bedExitThreshold,    setBedExitThreshold]     = useState(10);
  const [saved,               setSaved]                = useState(false);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div className="page-layout">
      {/* Header */}
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>settings</span>
          <div>
            <h1 className="page-layout__title">Settings</h1>
            <p className="page-layout__subtitle">System configuration, contacts, thresholds & privacy</p>
          </div>
        </div>
        <button
          className={`btn ${saved ? 'btn-primary' : 'btn-primary'}`}
          onClick={handleSave}
          style={{ background: saved ? '#4edea3' : '', transition: 'background 0.3s' }}
        >
          <span className="material-icons icon-sm">{saved ? 'check' : 'save'}</span>
          {saved ? 'Saved!' : 'Save Changes'}
        </button>
      </div>

      <div className="page-layout__content settings-grid">

        {/* ── Resident Profile ── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="settings-card__head">
            <span className="material-icons" style={{ color: 'var(--primary)', fontSize: 18 }}>person</span>
            Resident Profile
          </div>

          <div className="settings-profile">
            <div className="settings-avatar">A</div>
            <div>
              <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--on-surface)' }}>Arun Mehta</div>
              <div style={{ fontSize: 12, color: 'var(--outline)' }}>Age 72 · Bedroom, Floor 1</div>
              <span className="badge badge-stable" style={{ marginTop: 6, display: 'inline-block' }}>CALIBRATED</span>
            </div>
          </div>

          {[
            { label: 'Enrolment Date',        value: 'June 9, 2025' },
            { label: 'Days Since Enrolment',  value: '14 days' },
            { label: 'Profile Confidence',    value: '94%', highlight: '#4edea3' },
            { label: 'Baseline Drift',        value: '<2%',  highlight: '#4edea3' },
            { label: 'Last Re-enrolment',     value: 'Never' },
          ].map(({ label, value, highlight }) => (
            <div key={label} className="settings-row">
              <span>{label}</span>
              <span className="settings-row__val" style={highlight ? { color: highlight } : {}}>{value}</span>
            </div>
          ))}

          <div style={{ marginTop: 16, display: 'flex', gap: 8 }}>
            <button className="btn btn-outline btn-sm">
              <span className="material-icons icon-sm">refresh</span> Trigger Re-enrolment
            </button>
            <button className="btn btn-ghost btn-sm">
              <span className="material-icons icon-sm">edit</span> Edit Profile
            </button>
          </div>
        </div>

        {/* ── Sensor Pair Status ── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="settings-card__head">
            <span className="material-icons" style={{ color: 'var(--primary)', fontSize: 18 }}>router</span>
            Sensor Pair Status
          </div>

          {[
            { id: 'S1', room: 'Bedroom',     status: 'online',  signal: 'Strong',   paired: true  },
            { id: 'S2', room: 'Living Room', status: 'online',  signal: 'Good',     paired: true  },
            { id: 'S3', room: 'Bathroom',    status: 'online',  signal: 'Moderate', paired: true  },
            { id: 'S4', room: 'Kitchen',     status: 'offline', signal: '—',        paired: false },
          ].map(sensor => (
            <div key={sensor.id} className="settings-row" style={{ alignItems: 'flex-start', gap: 10 }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                <span style={{
                  width: 8, height: 8, borderRadius: '50%', flexShrink: 0, marginTop: 4,
                  background: sensor.status === 'online' ? '#4edea3' : '#EF4444',
                  display: 'inline-block',
                }} />
                <div>
                  <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>
                    {sensor.id} — {sensor.room}
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--outline)' }}>Signal: {sensor.signal}</div>
                </div>
              </div>
              <span className={`badge ${sensor.status === 'online' ? 'badge-stable' : 'badge-critical'}`} style={{ fontSize: 9, marginLeft: 'auto' }}>
                {sensor.status.toUpperCase()}
              </span>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
            <span className="material-icons icon-sm">add</span> Pair New Sensor
          </button>
        </div>

        {/* ── SOS Contacts ── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="settings-card__head">
            <span className="material-icons" style={{ color: '#EF4444', fontSize: 18 }}>emergency</span>
            SOS Contacts
          </div>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 14 }}>
            These contacts receive push notifications and SMS when a safety event fires.
          </p>

          {[
            { name: 'Priya Mehta',  role: 'Family',    phone: '+91 98765 43210', notify: ['push', 'sms'] },
            { name: 'Dr. Sharma',   role: 'Caregiver', phone: '+91 87654 32109', notify: ['sms', 'call'] },
          ].map((c, i) => (
            <div key={i} className="contact-row">
              <div className="contact-row__info">
                <span className="contact-row__name">{c.name}</span>
                <span className="contact-row__meta">{c.role} · {c.phone}</span>
                <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                  {c.notify.map(n => (
                    <span key={n} style={{ fontSize: 9, fontWeight: 700, background: 'var(--primary-container)', color: 'var(--primary)', padding: '1px 6px', borderRadius: 999, textTransform: 'uppercase' }}>
                      {n}
                    </span>
                  ))}
                </div>
              </div>
              <button className="btn-icon"><span className="material-icons icon-sm">edit</span></button>
            </div>
          ))}

          <button className="btn btn-outline btn-sm" style={{ marginTop: 14 }}>
            <span className="material-icons icon-sm">add</span> Add Contact
          </button>
        </div>

        {/* ── Alert Thresholds ── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="settings-card__head">
            <span className="material-icons" style={{ color: '#F59E0B', fontSize: 18 }}>tune</span>
            Alert Thresholds
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Apnea */}
            <div className="threshold-block">
              <div className="threshold-block__header">
                <label className="threshold-block__label">Apnea alert — breathing gap</label>
                <span className="threshold-block__value" style={{ color: '#EF4444' }}>&gt;{apneaThreshold}s</span>
              </div>
              <input
                type="range" min="5" max="20" value={apneaThreshold}
                onChange={e => setApneaThreshold(+e.target.value)}
                className="slider" style={{ accentColor: '#EF4444' }}
              />
              <div style={{ fontSize: 10, color: 'var(--outline)' }}>Triggers when breathing stops for this duration (night mode)</div>
            </div>

            {/* Inactivity */}
            <div className="threshold-block">
              <div className="threshold-block__header">
                <label className="threshold-block__label">Prolonged inactivity alert</label>
                <span className="threshold-block__value" style={{ color: '#F59E0B' }}>&gt;{inactivityThreshold} min</span>
              </div>
              <input
                type="range" min="5" max="60" value={inactivityThreshold}
                onChange={e => setInactivityThreshold(+e.target.value)}
                className="slider" style={{ accentColor: '#F59E0B' }}
              />
              <div style={{ fontSize: 10, color: 'var(--outline)' }}>Triggers when no motion detected in resident zone</div>
            </div>

            {/* Bed exit */}
            <div className="threshold-block">
              <div className="threshold-block__header">
                <label className="threshold-block__label">Bed exit — not returned (night)</label>
                <span className="threshold-block__value" style={{ color: '#F59E0B' }}>&gt;{bedExitThreshold} min</span>
              </div>
              <input
                type="range" min="3" max="30" value={bedExitThreshold}
                onChange={e => setBedExitThreshold(+e.target.value)}
                className="slider" style={{ accentColor: '#F59E0B' }}
              />
              <div style={{ fontSize: 10, color: 'var(--outline)' }}>Triggers during night mode if resident leaves bed area</div>
            </div>

            {/* Fixed threshold info */}
            <div style={{ padding: '10px 14px', background: 'var(--surface-container-low)', borderRadius: 8, border: '1px solid var(--border-muted)' }}>
              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)', marginBottom: 4 }}>
                Breathing rate — low alert
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 11, color: 'var(--outline)' }}>Fixed threshold — cannot be adjusted</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: '#EF4444' }}>&lt;6 BPM</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Night Mode Schedule ── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="settings-card__head">
            <span className="material-icons" style={{ color: '#adc6ff', fontSize: 18 }}>nights_stay</span>
            Night Mode Schedule
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-muted)', marginBottom: 18 }}>
            <div>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--on-surface)' }}>Auto-schedule</div>
              <div style={{ fontSize: 11, color: 'var(--outline)' }}>System switches between Night and Day mode automatically</div>
            </div>
            <button className={`toggle ${nightModeAuto ? 'toggle--on' : ''}`} onClick={() => setNightModeAuto(v => !v)}>
              <span className="toggle__thumb" />
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, opacity: nightModeAuto ? 1 : 0.45, transition: 'opacity 0.2s' }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--outline)', display: 'block', marginBottom: 6 }}>Night Starts</label>
              <input
                type="time" value={nightStart}
                onChange={e => setNightStart(e.target.value)}
                disabled={!nightModeAuto}
                className="time-input"
              />
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: 'var(--outline)', display: 'block', marginBottom: 6 }}>Night Ends</label>
              <input
                type="time" value={nightEnd}
                onChange={e => setNightEnd(e.target.value)}
                disabled={!nightModeAuto}
                className="time-input"
              />
            </div>
          </div>

          {!nightModeAuto && (
            <div style={{ marginTop: 16, padding: '10px 14px', background: 'rgba(245,158,11,0.07)', border: '1px solid rgba(245,158,11,0.25)', borderRadius: 8, fontSize: 12, color: '#b45309' }}>
              <strong>Manual mode active.</strong> Toggle Night/Day mode directly from the Live Sensing page header.
            </div>
          )}
        </div>

        {/* ── Privacy & What's Recorded ── */}
        <div className="glass-card" style={{ padding: 24 }}>
          <div className="settings-card__head">
            <span className="material-icons" style={{ color: 'var(--secondary)', fontSize: 18 }}>privacy_tip</span>
            Privacy & Data Transparency
          </div>
          <p style={{ fontSize: 12, color: 'var(--on-surface-variant)', marginBottom: 14, lineHeight: 1.5 }}>
            A full record of what SilentSense senses, processes, and stores — and what it never touches.
          </p>

          {PRIVACY_ITEMS.map(item => (
            <div key={item.name} className="privacy-row">
              <div className="privacy-row__top">
                <span className="privacy-row__name">{item.name}</span>
                <span className={item.stored ? 'privacy-row__status--yes' : 'privacy-row__status--no'}>
                  {item.stored ? '✓ Stored' : '✗ Not stored'}
                </span>
              </div>
              <p className="privacy-row__desc">{item.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  );
}
