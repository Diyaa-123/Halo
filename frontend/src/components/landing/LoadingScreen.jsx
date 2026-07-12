import React, { useEffect, useState } from 'react';
import { useProgress } from '@react-three/drei';
import '../../styles/landing.css';

export default function LoadingScreen({ onLoaded }) {
  const { progress, active, item } = useProgress();
  const [faded, setFaded] = useState(false);

  useEffect(() => {
    if (progress === 100 && !active) {
      const timer1 = setTimeout(() => setFaded(true), 500); // Fade out after 500ms
      const timer2 = setTimeout(() => onLoaded(), 1500); // Unmount after fade completes
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    }
  }, [progress, active, onLoaded]);

  return (
    <div className={`loading-screen ${faded ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <div className="loading-logo-wrapper">
          <img 
            src="/assets/Logo/SilentSense Logo.jpeg" 
            alt="SilentSense" 
            className="loading-logo-image" 
          />
        </div>
        <div className="loading-bar-container">
          <div className="loading-bar" style={{ width: `${progress}%` }} />
        </div>
        <div className="loading-text">
          {Math.round(progress)}%
        </div>
      </div>
    </div>
  );
}
