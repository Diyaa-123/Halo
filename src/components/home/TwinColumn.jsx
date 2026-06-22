import React from 'react';
import './TwinColumn.css';
import DigitalTwin from '../twin/DigitalTwin';

export default function TwinColumn() {
  return (
    <div className="glass-card twin-card">
      {/* Top Controls */}
      <div className="twin-top-controls">
        <div className="twin-controls-group">
          <button className="btn-icon"><span className="material-icons icon-sm">search</span></button>
          <button className="btn-icon"><span className="material-icons icon-sm">view_in_ar</span></button>
          <button className="btn-icon"><span className="material-icons icon-sm">filter_alt</span></button>
        </div>
        <div className="twin-controls-group">
          <button className="btn-icon"><span className="material-icons icon-sm">print</span></button>
          <button className="btn-icon"><span className="material-icons icon-sm">download</span></button>
        </div>
      </div>

      {/* Main 3D Twin View */}
      <div className="twin-view-area">
        {/* We reuse the DigitalTwin component but adjust its CSS for light mode */}
        <DigitalTwin isLightMode={true} />
        
        {/* Floating Action Button (Right edge) */}
        <button className="twin-fab">
          <span className="material-icons">pan_tool</span>
        </button>
      </div>

      {/* Bottom Controls */}
      <div className="twin-bottom-controls">
        <div className="twin-zoom-controls">
          <button className="btn-icon"><span className="material-icons">add</span></button>
          <div className="twin-zoom-divider" />
          <button className="btn-icon"><span className="material-icons">remove</span></button>
        </div>
      </div>
    </div>
  );
}
