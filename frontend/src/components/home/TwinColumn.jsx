import React from 'react';
import RoomSimPanel from './RoomSimPanel';

export default function TwinColumn({ isNightMode = false }) {
  return (
    <div style={{ width: '100%', height: '100%' }}>
      <RoomSimPanel isNightMode={isNightMode} />
    </div>
  );
}
