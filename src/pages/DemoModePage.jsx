import React from 'react';
import './PageLayout.css';
import { useToast } from '../components/layout/ToastContext';

export default function DemoModePage() {
  const toast = useToast();
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>campaign</span>
          <div>
            <h1 className="page-layout__title">Judge Demo Mode</h1>
            <p className="page-layout__subtitle">Isolated environment to trigger events and playback datasets</p>
          </div>
        </div>
        <span className="badge badge-critical">INTERNAL DEMO</span>
      </div>

      <div className="page-layout__content">
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, borderTop: '4px solid var(--emergency-red)' }}>
          <h3 className="section-label">Simulate Events (Real-time override)</h3>
          <div style={{ display: 'flex', gap: 16, marginTop: 16 }}>
            <button className="btn btn-primary" style={{ background: 'var(--emergency-red)', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }} onClick={() => toast('Simulating Phase-acceleration Fall Event...', 'error')}>
              <span className="material-icons icon-sm">warning</span> Trigger Fall
            </button>
            <button className="btn btn-primary" style={{ background: 'var(--warning-amber)', boxShadow: '0 4px 12px rgba(245, 158, 11, 0.3)' }} onClick={() => toast('Simulating Breathing Cessation (Apnea)...', 'warning')}>
              <span className="material-icons icon-sm">air</span> Trigger Apnea
            </button>
            <button className="btn btn-outline" onClick={() => toast('Simulating Restlessness/Wandering sequence...', 'info')}>
              <span className="material-icons icon-sm">directions_run</span> Trigger Wandering
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="section-label">Dataset Playback</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', marginBottom: 16 }}>
            Inject pre-recorded CSI data directly into the inference pipeline for demonstration.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--surface-container-low)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Edinburgh Dataset - Normal Sleep (14 RPM)</span>
              <button className="btn btn-outline btn-sm" onClick={() => toast('Injecting Edinburgh Normal Sleep dataset into pipeline...', 'info')}><span className="material-icons icon-sm">play_arrow</span> Play</button>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, background: 'var(--surface-container-low)', borderRadius: 'var(--radius)' }}>
              <span style={{ fontSize: 13, fontWeight: 600 }}>Edinburgh Dataset - Restlessness</span>
              <button className="btn btn-outline btn-sm" onClick={() => toast('Injecting Edinburgh Restlessness dataset into pipeline...', 'info')}><span className="material-icons icon-sm">play_arrow</span> Play</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
