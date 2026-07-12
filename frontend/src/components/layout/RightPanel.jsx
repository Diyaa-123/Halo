import React, { useMemo, useState } from 'react';
import AlertCard from '../alerts/AlertCard';
import LiveIncidentFeed from '../alerts/LiveIncidentFeed';
import OccupancyZoneMap from '../alerts/OccupancyZoneMap';
import './RightPanel.css';
import { useSensing } from '../../hooks/SensingContext';

export default function RightPanel() {
  const sensing = useSensing();
  const [activeTab, setActiveTab] = useState('queue');
  const [acknowledged, setAcknowledged] = useState(new Set());

  const alerts = useMemo(() => {
    if (!sensing.isConnected) {
      return [{
        id: 1,
        bed: 'LIVE FEED',
        type: 'BACKEND OFFLINE',
        risk: 0,
        priority: 1,
        ago: 'Now',
        recommendation: 'Connect the websocket backend to populate live alerts.',
        unacknowledged: '--',
        status: 'critical',
      }];
    }

    const list = [];
    if (!sensing.presence) {
      list.push({
        id: 1,
        bed: 'LIVE ZONE',
        type: 'ROOM EMPTY',
        risk: 0,
        priority: 3,
        ago: 'Now',
        recommendation: 'No occupant currently detected by the occupancy gate.',
        unacknowledged: '0m',
        status: 'normal',
      });
    }

    if (sensing.presence && sensing.motionLevel === 'active') {
      list.push({
        id: 2,
        bed: 'LIVE ZONE',
        type: 'MOTION ACTIVE',
        risk: Math.round((sensing.confidence ?? 0) * 100),
        priority: 2,
        ago: 'Now',
        recommendation: 'Live motion detected in the monitored area.',
        unacknowledged: '0m',
        status: 'warning',
      });
    }

    if ((sensing.estimatedPersons ?? 0) > 1) {
      list.push({
        id: 3,
        bed: 'LIVE ZONE',
        type: 'MULTI-OCCUPANT',
        risk: Math.min(99, (sensing.estimatedPersons ?? 0) * 25),
        priority: 1,
        ago: 'Now',
        recommendation: 'Attribution requires multi-person disambiguation.',
        unacknowledged: '0m',
        status: 'critical',
      });
    }

    return list.length ? list : [{
      id: 4,
      bed: 'LIVE ZONE',
      type: 'STABLE FEED',
      risk: Math.round((sensing.confidence ?? 0) * 100),
      priority: 3,
      ago: 'Now',
      recommendation: 'Live feed is stable and no escalation is required.',
      unacknowledged: '0m',
      status: 'normal',
    }];
  }, [sensing]);

  const handleAck = (id) => setAcknowledged((prev) => new Set([...prev, id]));

  return (
    <aside className="right-panel">
      <div className="right-panel__header">
        <div className="right-panel__header-title">
          <span className="material-icons" style={{ color: 'var(--warning-amber)' }}>warning_amber</span>
          <span>Command Center</span>
        </div>
        <div className="right-panel__tabs">
          <button className={`right-panel__tab ${activeTab === 'queue' ? 'right-panel__tab--active' : ''}`} onClick={() => setActiveTab('queue')}>
            Alert Queue
            <span className="right-panel__tab-count">{alerts.length - acknowledged.size}</span>
          </button>
          <button className={`right-panel__tab ${activeTab === 'feed' ? 'right-panel__tab--active' : ''}`} onClick={() => setActiveTab('feed')}>
            Live Feed
          </button>
          <button className={`right-panel__tab ${activeTab === 'map' ? 'right-panel__tab--active' : ''}`} onClick={() => setActiveTab('map')}>
            Zone Map
          </button>
        </div>
      </div>

      {activeTab === 'queue' && (
        <div className="right-panel__content">
          {[1, 2, 3].map((p) => {
            const priorityAlerts = alerts.filter((a) => a.priority === p && !acknowledged.has(a.id));
            if (!priorityAlerts.length) return null;
            return (
              <div key={p} className="right-panel__priority-group">
                <div className={`right-panel__priority-label right-panel__priority-label--p${p}`}>
                  <span className={`priority-dot priority-dot--p${p}`} />
                  Priority {p}
                </div>
                {priorityAlerts.map((alert) => (
                  <AlertCard key={alert.id} alert={alert} onAcknowledge={() => handleAck(alert.id)} />
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

      <div className="right-panel__footer">
        <div className="right-panel__station">
          <span className="right-panel__station-dot" />
          <div>
            <div className="right-panel__station-name">Websocket Backend</div>
            <div className="right-panel__station-shift">{sensing.isConnected ? 'Live connection' : 'Offline'}</div>
          </div>
        </div>
        <div className="right-panel__sync">
          <span className="material-icons icon-sm" style={{ color: 'var(--secondary)' }}>wifi</span>
          <span>{sensing.isConnected ? 'live' : '--'}</span>
        </div>
      </div>
    </aside>
  );
}
