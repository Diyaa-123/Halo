import React, { useState } from 'react';
import ProfileColumn from '../components/home/ProfileColumn';
import TwinColumn from '../components/home/TwinColumn';
import InsightsColumn from '../components/home/InsightsColumn';

export default function HomeDashboard() {
  const [isNightMode, setIsNightMode] = useState(true);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', width: '100%' }}>
      {/* Top Controls for Demo / Testing */}
      <div style={{ padding: '0 0 16px 0', display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <button 
          onClick={() => setIsNightMode(false)}
          className={`btn btn-sm ${!isNightMode ? 'btn-primary' : 'btn-outline'}`}
        >
          <span className="material-icons icon-sm">wb_sunny</span> Day Mode (Activity Only)
        </button>
        <button 
          onClick={() => setIsNightMode(true)}
          className={`btn btn-sm ${isNightMode ? 'btn-primary' : 'btn-outline'}`}
        >
          <span className="material-icons icon-sm">nights_stay</span> Night Mode (Vitals Tracking)
        </button>
      </div>

      <div className="home-dashboard" style={{ flex: 1 }}>
        <div className="home-col">
          <ProfileColumn isNightMode={isNightMode} />
        </div>
        
        <div className="home-col" style={{ paddingBottom: 0 }}>
          <TwinColumn isNightMode={isNightMode} />
        </div>
        
        <div className="home-col">
          <InsightsColumn isNightMode={isNightMode} />
        </div>
      </div>
    </div>
  );
}
