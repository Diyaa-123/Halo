import React from 'react';
import './VitalCard.css';

function Sparkline({ data, color }) {
  if (!data || data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const w = 80, h = 28;
  const pts = data.map((v, i) => {
    const x = (i / (data.length - 1)) * w;
    const y = h - ((v - min) / range) * (h - 4) - 2;
    return `${x},${y}`;
  });
  const area = `M${pts[0]} L${pts.join(' L')} L${(data.length - 1) / (data.length - 1) * w},${h} L0,${h} Z`;
  return (
    <svg viewBox={`0 0 ${w} ${h}`} width={w} height={h} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id={`grad-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#grad-${color.replace('#', '')})`} />
      <polyline
        points={pts.join(' ')}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Last point dot */}
      <circle
        cx={pts[pts.length - 1].split(',')[0]}
        cy={pts[pts.length - 1].split(',')[1]}
        r="2.5"
        fill={color}
      />
    </svg>
  );
}

const riskConfig = {
  low: { label: 'LOW', class: 'badge-stable' },
  moderate: { label: 'MOD', class: 'badge-warning' },
  high: { label: 'HIGH', class: 'badge-critical' },
};

const trendIcons = {
  up: { icon: 'trending_up', positive: true },
  down: { icon: 'trending_down', positive: false },
  stable: { icon: 'trending_flat', positive: null },
};

export default function VitalCard({ vital, isSelected, onClick }) {
  const risk = riskConfig[vital.risk] || riskConfig.low;
  const trend = trendIcons[vital.trendDir] || trendIcons.stable;
  const trendColor = trend.positive === true ? 'var(--secondary)'
    : trend.positive === false ? 'var(--emergency-red)'
    : 'var(--outline)';

  return (
    <div
      className={`vital-card ${isSelected ? 'vital-card--selected' : ''} ${vital.risk === 'high' ? 'vital-card--high-risk' : ''}`}
      onClick={onClick}
      style={{ '--vital-color': vital.color }}
    >
      <div className="vital-card__header">
        <span className="vital-card__name">{vital.name}</span>
        <span className={`badge ${risk.class} vital-card__risk`}>{risk.label}</span>
      </div>

      <div className="vital-card__body">
        <div className="vital-card__value-row">
          <span className="vital-card__value">{vital.value}</span>
          <span className="vital-card__unit">{vital.unit}</span>
        </div>
        <div className="vital-card__trend" style={{ color: trendColor }}>
          <span className="material-icons icon-sm">{trend.icon}</span>
          {vital.trend && <span>{vital.trend}</span>}
        </div>
      </div>

      <div className="vital-card__sparkline">
        <Sparkline data={vital.data} color={vital.color} />
      </div>
    </div>
  );
}
