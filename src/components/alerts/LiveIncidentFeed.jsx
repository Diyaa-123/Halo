import React from 'react';
import './LiveIncidentFeed.css';

const incidents = [
  { time: '14:22', event: 'Apnea Episode', bed: 'BED 04', status: 'resolved', color: '#4edea3' },
  { time: '14:30', event: 'Bathroom Occupancy', bed: 'BED 12', status: 'normal', color: '#adc6ff' },
  { time: '14:41', event: 'Fall Detected', bed: 'BED 09', status: 'critical', color: '#EF4444' },
  { time: '14:55', event: 'Meal Skipped', bed: 'BED 07', status: 'warning', color: '#F59E0B' },
  { time: '15:02', event: 'Agitation Detected', bed: 'BED 07', status: 'warning', color: '#F59E0B' },
  { time: '15:14', event: 'Hydration Alert', bed: 'BED 09', status: 'warning', color: '#F59E0B' },
  { time: '15:20', event: 'Vitals Normalized', bed: 'BED 04', status: 'resolved', color: '#4edea3' },
  { time: '15:33', event: 'Respiratory Distress', bed: 'BED 04', status: 'critical', color: '#EF4444' },
  { time: '15:40', event: 'Sleep Interruption', bed: 'BED 02', status: 'warning', color: '#F59E0B' },
  { time: '15:47', event: 'Nurse Dispatched', bed: 'BED 04', status: 'normal', color: '#adc6ff' },
];

const statusIcons = {
  resolved: 'check_circle',
  normal: 'info',
  critical: 'error',
  warning: 'warning_amber',
};

export default function LiveIncidentFeed() {
  return (
    <div className="live-feed">
      <div className="live-feed__header">
        <span className="live-feed__dot" />
        <span className="live-feed__label">Live Incident Feed</span>
      </div>
      <div className="live-feed__list">
        {[...incidents].reverse().map((inc, i) => (
          <div key={i} className="live-feed__item" style={{ '--inc-color': inc.color }}>
            <div className="live-feed__timeline">
              <span className="live-feed__time">{inc.time}</span>
              <div className="live-feed__line" />
            </div>
            <div className="live-feed__content">
              <div className="live-feed__event-row">
                <span className="material-icons icon-sm" style={{ color: inc.color }}>
                  {statusIcons[inc.status]}
                </span>
                <span className="live-feed__event">{inc.event}</span>
              </div>
              <div className="live-feed__meta">
                <span className="live-feed__bed">{inc.bed}</span>
                <span className="live-feed__status" style={{ color: inc.color }}>{inc.status.toUpperCase()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
