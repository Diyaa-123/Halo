import React, { useState } from 'react';
import './PageLayout.css';
import { useToast } from '../components/layout/ToastContext';

export default function ClinicalReportPage() {
  const toast = useToast();
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(true);

  const handleGenerate = () => {
    setGenerating(true);
    setGenerated(false);
    setTimeout(() => { setGenerating(false); setGenerated(true); }, 2000);
  };

  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>description</span>
          <div>
            <h1 className="page-layout__title">AI Clinical Reports</h1>
            <p className="page-layout__subtitle">Auto-generated clinical intelligence — BED 04 / Aarav Mehta</p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-ghost" onClick={handleGenerate} disabled={generating}>
            <span className="material-icons icon-sm">{generating ? 'hourglass_empty' : 'refresh'}</span>
            {generating ? 'Generating...' : 'Regenerate'}
          </button>
          <button className="btn btn-primary" onClick={() => toast('Exporting Report as PDF...', 'success')}>
            <span className="material-icons icon-sm">picture_as_pdf</span>
            Export PDF
          </button>
        </div>
      </div>

      {generating && (
        <div style={{ padding: '40px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
          <div style={{ width: 48, height: 48, border: '4px solid var(--border-muted)', borderTopColor: 'var(--primary)', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />
          <p style={{ color: 'var(--on-surface-variant)', fontSize: 14 }}>AI is analyzing patient data and generating clinical report...</p>
        </div>
      )}

      {generated && !generating && (
        <div className="page-layout__content">
          {/* Report Header */}
          <div className="glass-card" style={{ padding: 20 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 16, paddingBottom: 16, borderBottom: '1px solid var(--border-muted)' }}>
              {[
                { label: 'PATIENT', value: 'BED 04 / Aarav Mehta' },
                { label: 'PERIOD', value: 'Last 24 Hours' },
                { label: 'ALERTS', value: '3 Respiratory Events' },
                { label: 'GENERATED', value: new Date().toLocaleString() },
              ].map(item => (
                <div key={item.label}>
                  <div style={{ fontSize: 9, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'var(--outline)', fontWeight: 700, marginBottom: 4 }}>{item.label}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--on-surface)' }}>{item.value}</div>
                </div>
              ))}
            </div>

            {/* Confidence + Risk */}
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: 8 }}>
                <span className="material-icons" style={{ color: '#EF4444', fontSize: 20 }}>warning</span>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Assessment</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#EF4444' }}>Risk Elevated</div>
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'rgba(78, 222, 163, 0.08)', border: '1px solid rgba(78, 222, 163, 0.2)', borderRadius: 8 }}>
                <span className="material-icons" style={{ color: '#4edea3', fontSize: 20 }}>psychology</span>
                <div>
                  <div style={{ fontSize: 10, color: 'var(--outline)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>AI Confidence</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#4edea3' }}>84%</div>
                </div>
              </div>
            </div>
          </div>

          {/* Report Sections */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {/* Observations */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-muted)' }}>
                <span className="material-icons" style={{ color: 'var(--primary)', fontSize: 18 }}>search</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>Observations</span>
              </div>
              {[
                { obs: 'Breathing declined from 13 → 8 BPM over 6 hours', severity: 'critical', icon: 'air' },
                { obs: '2 Apnea Episodes detected (14:22, 03:15)', severity: 'warning', icon: 'bedtime' },
                { obs: 'Restlessness above baseline — agitation index 24/100', severity: 'warning', icon: 'psychology_alt' },
                { obs: 'Mobility score declined 3 points (65 → 62)', severity: 'warning', icon: 'directions_walk' },
                { obs: 'Heart rate remained stable (72 BPM avg)', severity: 'stable', icon: 'favorite' },
                { obs: 'Nutrition adherence at 76% — 1 meal skipped', severity: 'warning', icon: 'restaurant' },
              ].map((item, i) => (
                <div key={i} style={{ display: 'flex', gap: 8, padding: '8px 0', borderBottom: '1px solid rgba(48, 54, 61, 0.5)' }}>
                  <span className="material-icons" style={{
                    fontSize: 14,
                    color: item.severity === 'critical' ? '#EF4444' : item.severity === 'warning' ? '#F59E0B' : '#4edea3',
                    flexShrink: 0,
                    marginTop: 1,
                  }}>{item.icon}</span>
                  <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{item.obs}</p>
                </div>
              ))}
            </div>

            {/* Recommendations */}
            <div className="glass-card" style={{ padding: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12, paddingBottom: 10, borderBottom: '1px solid var(--border-muted)' }}>
                <span className="material-icons" style={{ color: '#4edea3', fontSize: 18 }}>recommend</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--on-surface)' }}>AI Recommendation</span>
              </div>
              <div style={{ padding: 12, background: 'rgba(77, 142, 255, 0.06)', borderRadius: 8, border: '1px solid rgba(77, 142, 255, 0.15)', marginBottom: 12 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--primary)', marginBottom: 6 }}>Clinical Review Required</p>
                <p style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.7 }}>
                  Patient presents elevated respiratory risk with declining breathing rate trend. Immediate physician review recommended. Consider adjusting CPAP settings and initiating oxygen supplementation protocol.
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  'Schedule respiratory assessment within 2 hours',
                  'Monitor breathing rate every 15 minutes',
                  'Increase caregiver check-in frequency to 30-min intervals',
                  'Review current medication interactions with pulmonologist',
                  'Enable enhanced fall detection monitoring overnight',
                ].map((rec, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                    <span style={{ width: 20, height: 20, borderRadius: '50%', background: 'rgba(77, 142, 255, 0.15)', border: '1px solid rgba(77, 142, 255, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 9, fontWeight: 700, color: 'var(--primary)', flexShrink: 0 }}>{i + 1}</span>
                    <span style={{ fontSize: 11, color: 'var(--on-surface-variant)', lineHeight: 1.5 }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="glass-card" style={{ padding: 14 }}>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
              {[
                { icon: 'picture_as_pdf', label: 'Export PDF', cls: 'btn-primary' },
                { icon: 'print', label: 'Print', cls: 'btn-ghost' },
                { icon: 'share', label: 'Share', cls: 'btn-ghost' },
                { icon: 'send', label: 'Send to EMR', cls: 'btn-secondary' },
              ].map(a => (
                <button key={a.label} className={`btn ${a.cls}`} onClick={() => toast(`${a.label} action triggered...`, 'info')}>
                  <span className="material-icons icon-sm">{a.icon}</span>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
