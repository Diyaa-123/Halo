import React, { useState } from 'react';
import AlertCard from '../alerts/AlertCard';
import LiveIncidentFeed from '../alerts/LiveIncidentFeed';
import OccupancyZoneMap from '../alerts/OccupancyZoneMap';
import './RightPanel.css';

const alerts = [
  {
    id: 1, bed: 'BED 04', type: 'RESPIRATORY DISTRESS', risk: 92, priority: 1,
    ago: '8 mins', recommendation: 'Immediate bedside assessment required. Check airway patency.',
    unacknowledged: '4m 22s', status: 'critical',
  },
  {
    id: 2, bed: 'BED 12', type: 'FALL RISK', risk: 78, priority: 2,
    ago: '14 mins', recommendation: 'Unexpected movement detected in zone: Bathroom.',
    unacknowledged: '14m 05s', status: 'warning',
  },
  {
    id: 3, bed: 'BED 09', type: 'HYDRATION ALERT', risk: 55, priority: 3,
    ago: '22 mins', recommendation: 'Intake levels below protocol for 4 hours.',
    unacknowledged: '22m 11s', status: 'warning',
  },
  {
    id: 4, bed: 'BED 07', type: 'AGITATION DETECTED', risk: 68, priority: 2,
    ago: '31 mins', recommendation: 'Patient pacing for 12 minutes. Recommend caregiver interaction.',
    unacknowledged: '31m 00s', status: 'warning',
  },
  {
    id: 5, bed: 'BED 01', type: 'MEAL SKIPPED', risk: 30, priority: 3,
    ago: '45 mins', recommendation: 'Patient did not consume breakfast. Check nutrition log.',
    unacknowledged: '45m 20s', status: 'info',
  },
];

export default function RightPanel() {
  const [activeTab, setActiveTab] = useState('queue');
  const [acknowledged, setAcknowledged] = useState(new Set());

  const handleAck = (id) => setAcknowledged(prev => new Set([...prev, id]));

  return (
    <aside className="right-panel">
      {/* Panel Header */}
      <div className="right-panel__header">
        <div className="right-panel__header-title">
          <span className="material-icons" style={{ color: 'var(--warning-amber)' }}>warning_amber</span>
          <span>Command Center</span>
        </div>
        <div className="right-panel__tabs">
          <button
            className={`right-panel__tab ${activeTab === 'queue' ? 'right-panel__tab--active' : ''}`}
            onClick={() => setActiveTab('queue')}
          >
            Alert Queue
            <span className="right-panel__tab-count">{alerts.length - acknowledged.size}</span>
          </button>
          <button
            className={`right-panel__tab ${activeTab === 'feed' ? 'right-panel__tab--active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            Live Feed
          </button>
          <button
            className={`right-panel__tab ${activeTab === 'map' ? 'right-panel__tab--active' : ''}`}
            onClick={() => setActiveTab('map')}
          >
            Zone Map
          </button>
        </div>
      </div>

      {/* Active Alerts Queue */}
      {activeTab === 'queue' && (
        <div className="right-panel__content">
          {/* Priority sections */}
          {[1, 2, 3].map(p => {
            const priorityAlerts = alerts.filter(a => a.priority === p && !acknowledged.has(a.id));
            if (!priorityAlerts.length) return null;
            return (
              <div key={p} className="right-panel__priority-group">
                <div className={`right-panel__priority-label right-panel__priority-label--p${p}`}>
                  <span className={`priority-dot priority-dot--p${p}`} />
                  Priority {p}
                </div>
                {priorityAlerts.map(alert => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onAcknowledge={() => handleAck(alert.id)}
                  />
                ))}
              </div>
            );
          })}
          {acknowledged.size === alerts.length && (
            <div className="right-panel__all-clear">
              <span className="material-icons icon-xl" style={{ color: 'var(--secondary)' }}>check_circle</span>
              <p>All alerts acknowledged</p>
              <span className="right-panel__all-clear-sub">Queue is clear</span>
            </div>
          )}
        </div>
      )}

      {activeTab === 'feed' && <LiveIncidentFeed />}
      {activeTab === 'map' && <OccupancyZoneMap />}

      {/* Nurse Station Footer */}
      <div className="right-panel__footer">
        <div className="right-panel__station">
          <span className="right-panel__station-dot" />
          <div>
            <div className="right-panel__station-name">Nurse Station Alpha</div>
            <div className="right-panel__station-shift">On Duty: 12h Shift</div>
          </div>
        </div>
        <div className="right-panel__sync">
          <span className="material-icons icon-sm" style={{ color: 'var(--secondary)' }}>wifi</span>
          <span>0.2ms</span>
        </div>
      </div>
    </aside>
  );
}
