import React from 'react';
import './PageLayout.css';

export default function WeeklyReportPage() {
  return (
    <div className="page-layout">
      <div className="page-layout__header">
        <div className="page-layout__title-group">
          <span className="material-icons icon-lg" style={{ color: 'var(--primary)' }}>summarize</span>
          <div>
            <h1 className="page-layout__title">Weekly AI Summary</h1>
            <p className="page-layout__subtitle">LLM-generated clinical summaries for Dad (Arun) — Week of June 15</p>
          </div>
        </div>
        <button className="btn btn-primary">
          <span className="material-icons icon-sm">download</span> Download PDF
        </button>
      </div>

      <div className="page-layout__content">
        <div className="glass-card" style={{ padding: 24, marginBottom: 24, borderTop: '4px solid var(--primary)' }}>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
            <span className="material-icons" style={{ color: 'var(--primary)' }}>auto_awesome</span>
            <h3 className="section-label" style={{ marginBottom: 0 }}>Claude AI Analysis</h3>
          </div>
          <div style={{ fontSize: 14, color: 'var(--on-surface)', lineHeight: 1.6 }}>
            <p style={{ marginBottom: 12 }}>
              <strong>Overall Status:</strong> Arun's health metrics remained highly stable this week. The ambient sensing system maintained an 89% attribution confidence across all measured windows, ensuring high data reliability.
            </p>
            <p style={{ marginBottom: 12 }}>
              <strong>Sleep & Respiratory:</strong> Nightly breathing rates averaged 14 RPM with a 92% regularity score. No apneic events were detected. Sleep duration averaged 7.1 hours, slightly improved from last week's 6.8 hours.
            </p>
            <p>
              <strong>Mobility & Behavioral:</strong> Morning routines commenced consistently between 7:00 AM and 7:30 AM. Walking speed (0.85 m/s) remains steady, and fall risk score is low. A single false-positive fall alert was triggered in the bathroom on Wednesday but was resolved immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
