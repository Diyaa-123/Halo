import React from 'react';
import './LiveIncidentFeed.css';
import { useSensing } from '../../hooks/SensingContext';

function buildIncidents(sensing) {
  if (!sensing.isConnected) {
    return [
      { time: 'Now', event: 'Backend offline', bed: 'LIVE FEED', status: 'critical', color: '#EF4444' },
    ];
  }

  const items = [];
  items.push({
    time: 'Now',
    event: sensing.presence ? 'Occupant detected' : 'Room empty',
    bed: 'LIVE ZONE',
    status: sensing.presence ? 'resolved' : 'normal',
    color: sensing.presence ? '#4edea3' : '#adc6ff',
  });

  if (sensing.breathingRate != null) {
    items.push({
      time: 'Now',
      event: `Breathing ${sensing.breathingRate.toFixed(1)} brpm`,
      bed: 'CSI STREAM',
      status: sensing.breathingRate >= 12 && sensing.breathingRate <= 18 ? 'resolved' : 'warning',
      color: sensing.breathingRate >= 12 && sensing.breathingRate <= 18 ? '#4edea3' : '#F59E0B',
    });
  }

  if (sensing.motionLevel === 'active') {
    items.push({
      time: 'Now',
      event: 'Motion active',
      bed: 'CSI STREAM',
      status: 'warning',
      color: '#F59E0B',
    });
  }

  if ((sensing.estimatedPersons ?? 0) > 1) {
    items.push({
      time: 'Now',
      event: 'Multiple occupants',
      bed: 'LIVE ZONE',
      status: 'critical',
      color: '#EF4444',
    });
  }

  return items;
}

const statusIcons = {
  resolved: 'check_circle',
  normal: 'info',
  critical: 'error',
  warning: 'warning_amber',
};

export default function LiveIncidentFeed() {
  const sensing = useSensing();
  const incidents = buildIncidents(sensing);

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
