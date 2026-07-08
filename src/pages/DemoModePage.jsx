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
            <h1 className="page-layout__title">Demo Mode Disabled</h1>
            <p className="page-layout__subtitle">Live-only deployment mode keeps synthetic playback out of the dashboard</p>
          </div>
        </div>
        <span className="badge badge-stable">LIVE ONLY</span>
      </div>

      <div className="page-layout__content">
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, borderTop: '4px solid var(--primary)' }}>
          <h3 className="section-label">Simulation Controls Removed</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
            This page no longer injects pre-recorded CSI data or fake incidents into the pipeline. Use the live websocket feed or real backend data sources instead.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 16, flexWrap: 'wrap' }}>
            <button className="btn btn-primary" onClick={() => toast('Demo playback is disabled in live-only mode.', 'info')}>
              <span className="material-icons icon-sm">lock</span> Playback Disabled
            </button>
            <button className="btn btn-outline" onClick={() => toast('Connect the backend websocket to enable live monitoring.', 'info')}>
              <span className="material-icons icon-sm">wifi</span> Connect Feed
            </button>
          </div>
        </div>

        <div className="glass-card" style={{ padding: 24 }}>
          <h3 className="section-label">How to Test Safely</h3>
          <p style={{ fontSize: 13, color: 'var(--on-surface-variant)', lineHeight: 1.6 }}>
            If you need a non-production test path, use the backend&apos;s explicit `SS_ALLOW_SIMULATION=1` flag during local development. The dashboard itself will continue to show only live or unavailable states.
          </p>
        </div>
      </div>
    </div>
  );
}
