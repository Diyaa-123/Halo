import React, { useState } from 'react';
import './BodyRegionPin.css';

const statusColors = {
  stable: '#3B82F6',
  warning: '#F59E0B',
  critical: '#EF4444',
};

export default function BodyRegionPin({ region, isActive, onClick }) {
  const color = statusColors[region.status] || statusColors.stable;

  return (
    <div
      className={`body-pin ${isActive ? 'body-pin--active' : ''} body-pin--${region.status}`}
      style={{ left: region.x, top: region.y, '--pin-color': color }}
      onClick={(e) => { e.stopPropagation(); onClick(); }}
    >
      {/* Ping animation for critical/warning */}
      {(region.status === 'critical' || region.status === 'warning') && (
        <span className="body-pin__ping" />
      )}
      {/* Pin */}
      <div className="body-pin__dot">
        {region.alerts > 0 ? (
          <span className="body-pin__count">{region.alerts}</span>
        ) : (
          <span className="body-pin__stable-dot" />
        )}
      </div>

      {/* Label */}
      <span className="body-pin__label">{region.label}</span>

      {/* Tooltip */}
      {isActive && (
        <div className="body-pin__tooltip">
          <div className="body-pin__tooltip-header">
            <span className="material-icons icon-sm" style={{ color }}>
              {region.status === 'critical' ? 'error' : region.status === 'warning' ? 'warning_amber' : 'check_circle'}
            </span>
            <span className="body-pin__tooltip-title">{region.label.toUpperCase()}</span>
          </div>
          <div className="body-pin__tooltip-row">
            <span className="body-pin__tooltip-key">{region.details.metric}</span>
            <span className="body-pin__tooltip-val" style={{ color }}>{region.details.value}</span>
          </div>
          <div className="body-pin__tooltip-row">
            <span className="body-pin__tooltip-key">Risk Level</span>
            <span className="body-pin__tooltip-val" style={{ color }}>{region.details.risk}</span>
          </div>
          <div className="body-pin__tooltip-rec">
            <span className="material-icons icon-sm" style={{ color: 'var(--primary)' }}>psychology</span>
            <span>{region.details.recommendation}</span>
          </div>
        </div>
      )}
    </div>
  );
}
