import React from 'react';
import './HealthScoreWidget.css';

const getScoreConfig = (score) => {
  if (score >= 95) return { label: 'Excellent', color: '#4edea3', ring: '#22C55E' };
  if (score >= 80) return { label: 'Stable', color: '#adc6ff', ring: '#3B82F6' };
  if (score >= 60) return { label: 'Attention', color: '#F59E0B', ring: '#F59E0B' };
  return { label: 'Critical', color: '#EF4444', ring: '#EF4444' };
};

export default function HealthScoreWidget({ score = 87, status = 'stable' }) {
  const config = getScoreConfig(score);
  const circumference = 2 * Math.PI * 36;
  const dash = circumference * (score / 100);

  return (
    <div className="health-score-widget">
      <div className="health-score-widget__label">PATIENT HEALTH SCORE</div>
      <div className="health-score-widget__gauge-row">
        <div className="health-score-widget__gauge">
          <svg viewBox="0 0 80 80" width="80" height="80">
            {/* Background track */}
            <circle cx="40" cy="40" r="36" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="6" />
            {/* Colored progress */}
            <circle
              cx="40" cy="40" r="36"
              fill="none"
              stroke={config.ring}
              strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 40 40)"
              style={{ filter: `drop-shadow(0 0 8px ${config.ring}80)`, transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="health-score-widget__center">
            <span className="health-score-widget__value" style={{ color: config.color }}>{score}</span>
            <span className="health-score-widget__total">/100</span>
          </div>
        </div>
        <div className="health-score-widget__meta">
          <span className="health-score-widget__status" style={{ color: config.color }}>
            {config.label}
          </span>
          <div className="health-score-widget__categories">
            {[
              { range: '95–100', label: 'Excellent', color: '#22C55E' },
              { range: '80–94', label: 'Stable', color: '#3B82F6' },
              { range: '60–79', label: 'Attention', color: '#F59E0B' },
              { range: '<60', label: 'Critical', color: '#EF4444' },
            ].map(cat => (
              <div key={cat.range} className="health-score-widget__category">
                <span className="health-score-widget__cat-dot" style={{ background: cat.color }} />
                <span className="health-score-widget__cat-range">{cat.range}</span>
                <span className="health-score-widget__cat-label" style={{ color: cat.color }}>{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
