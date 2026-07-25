import React, { useState } from 'react';
import ProfileColumn from '../components/home/ProfileColumn';
import TwinColumn from '../components/home/TwinColumn';
import InsightsColumn from '../components/home/InsightsColumn';
import PillarAttributionPanel from '../components/dashboard/PillarAttributionPanel';

export default function HomeDashboard() {
  const [isNightMode, setIsNightMode] = useState(true);

  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      width: '100%', 
      height: '100vh', 
      maxHeight: '100vh',
      overflowY: 'auto', 
      paddingBottom: '40px' 
    }}>
      {/* Top Controls for Demo / Testing */}
      <div style={{ padding: '0 0 8px 0', display: 'flex', justifyContent: 'flex-end', gap: 12, flexShrink: 0 }}>
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

      {/* Multi-Evidence Attribution Framework (Pillar 4) */}
      <div style={{ flexShrink: 0 }}>
        <PillarAttributionPanel />
      </div>

      <div className="home-dashboard" style={{ flexShrink: 0 }}>
        <div className="home-col animate-slide-up" style={{ animationDelay: '0s' }}>
          <ProfileColumn isNightMode={isNightMode} />
        </div>
        
        <div className="home-col animate-slide-up" style={{ paddingBottom: 0, animationDelay: '0.1s' }}>
          <TwinColumn isNightMode={isNightMode} />
        </div>
        
        <div className="home-col animate-slide-up" style={{ animationDelay: '0.2s' }}>
          <InsightsColumn isNightMode={isNightMode} />
        </div>
      </div>
    </div>
  );
}