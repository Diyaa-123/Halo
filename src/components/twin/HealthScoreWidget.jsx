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
  const circumference = 2 * Math.PI * 28; // Smaller radius
  const dash = circumference * (score / 100);

  return (
    <div className="health-score-widget glass-card">
      <div className="health-score-widget__header">
        <span className="material-icons icon-sm" style={{ color: config.color }}>monitor_heart</span>
        <span className="health-score-widget__label">HEALTH SCORE</span>
      </div>
      
      <div className="health-score-widget__gauge-row">
        <div className="health-score-widget__gauge">
          <svg viewBox="0 0 64 64" width="64" height="64">
            {/* Background track */}
            <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.15)" strokeWidth="4" />
            {/* Colored progress */}
            <circle
              cx="32" cy="32" r="28"
              fill="none"
              stroke={config.ring}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${dash} ${circumference}`}
              transform="rotate(-90 32 32)"
              style={{ filter: `drop-shadow(0 0 6px ${config.ring}80)`, transition: 'stroke-dasharray 1s ease' }}
            />
          </svg>
          <div className="health-score-widget__center">
            <span className="health-score-widget__value" style={{ color: config.color }}>{score}</span>
          </div>
        </div>
        
        <div className="health-score-widget__meta">
          <span className="health-score-widget__status" style={{ color: config.color }}>
            {config.label}
          </span>
          <span className="health-score-widget__trend">Stable Trend</span>
        </div>
      </div>
    </div>
  );
}
