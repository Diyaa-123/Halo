import React, { useState } from 'react';
import './AlertCard.css';
import { useToast } from '../layout/ToastContext';

const priorityConfig = {
  1: { color: '#EF4444', label: 'P1', icon: 'emergency' },
  2: { color: '#F59E0B', label: 'P2', icon: 'warning_amber' },
  3: { color: '#adc6ff', label: 'P3', icon: 'info' },
};

const statusConfig = {
  critical: { color: '#EF4444' },
  warning: { color: '#F59E0B' },
  info: { color: '#adc6ff' },
};

export default function AlertCard({ alert, onAcknowledge }) {
  const toast = useToast();
  const [expanded, setExpanded] = useState(alert.priority === 1);
  const pc = priorityConfig[alert.priority] || priorityConfig[3];
  const sc = statusConfig[alert.status] || statusConfig.info;

  return (
    <div
      className={`alert-card alert-card--${alert.status}`}
      style={{ '--alert-color': sc.color }}
    >
      {/* Header */}
      <div className="alert-card__header" onClick={() => setExpanded(!expanded)}>
        <div className="alert-card__bed-info">
          <span className="alert-card__priority-badge" style={{ background: pc.color }}>
            {pc.label}
          </span>
          <span className="alert-card__bed">{alert.bed}</span>
          {alert.priority === 1 && <span className="alert-card__pulse-dot" />}
        </div>
        <div className="alert-card__time-info">
          <span className="alert-card__ago">{alert.ago}</span>
          <span className="material-icons icon-sm" style={{ color: 'var(--outline)' }}>
            {expanded ? 'expand_less' : 'expand_more'}
          </span>
        </div>
      </div>

      {/* Type */}
      <div className="alert-card__type" style={{ color: sc.color }}>
        <span className="material-icons icon-sm">{pc.icon}</span>
        {alert.type}
      </div>

      {/* Risk Score */}
      <div className="alert-card__risk-row">
        <div className="alert-card__risk-bar">
          <div
            className="alert-card__risk-fill"
            style={{ width: `${alert.risk}%`, background: sc.color }}
          />
        </div>
        <span className="alert-card__risk-val" style={{ color: sc.color }}>Risk: {alert.risk}</span>
      </div>

      {/* Expanded Details */}
      {expanded && (
        <div className="alert-card__details">
          <div className="alert-card__rec">
            <span className="material-icons icon-sm" style={{ color: 'var(--primary)' }}>psychology</span>
            <span>{alert.recommendation}</span>
          </div>
          <div className="alert-card__timer">
            <span className="material-icons icon-sm" style={{ color: 'var(--warning-amber)' }}>timer</span>
            Unacknowledged: <strong style={{ color: 'var(--warning-amber)' }}>{alert.unacknowledged}</strong>
          </div>
          <div className="alert-card__actions">
            <button className="btn btn-primary btn-sm" onClick={onAcknowledge}>
              <span className="material-icons icon-sm">check</span>
              Acknowledge
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => toast('Assigning alert to available staff...', 'info')}>
              <span className="material-icons icon-sm">person_add</span>
              Assign
            </button>
            <button className="btn btn-danger btn-sm" onClick={() => toast('Escalating alert priority...', 'error')}>
              <span className="material-icons icon-sm">priority_high</span>
              Escalate
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => toast('Opening Twin View for alert context...', 'info')}>
              <span className="material-icons icon-sm">view_in_ar</span>
              Twin
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
