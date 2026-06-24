import React, { useEffect, useState } from 'react';
import { useToast } from '../layout/ToastContext';

export default function FeatureOverlay({ feature }) {
  const toast = useToast();
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(null);

  useEffect(() => {
    if (feature) {
      setActiveFeature(feature);
      // Double rAF guarantees the DOM is painted with inactive state before applying 'active' class
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setMounted(true);
        });
      });
    } else {
      setMounted(false);
      const timer = setTimeout(() => {
        setActiveFeature(null);
      }, 3500); // Increased to 3.5s to fully accommodate the cinematic exit
      return () => clearTimeout(timer);
    }
  }, [feature]);

  if (!activeFeature) return null;

  return (
    <div className={`feature-overlay ${mounted ? 'active' : ''}`}>
      {/* Cinematic Backgrounds */}
      <div className="fo-bg"></div>
      
      {/* Fake Broken Card Halves */}
      <div className="fo-card-half left"></div>
      <div className="fo-card-half right"></div>
      
      <div className="fo-noise"></div>
      
      {/* Smoke Tunnel Effect */}
      <div className="fo-smoke-ring ring-1"></div>
      <div className="fo-smoke-ring ring-2"></div>
      <div className="fo-smoke-ring ring-3"></div>
      <div className="fo-tunnel"></div>

      <div className="fo-layout">
        
        {/* Left Side: Terminal / Clinical Typography */}
        <div className="fo-text-col">
          <div className="fo-title-block">
            <h2 className="fo-title">{activeFeature.title}</h2>
            <div className="fo-subtitle">
              <span>2026</span> / <span>{activeFeature.eyebrow}</span> / <span>SYSTEM</span>
            </div>
          </div>

          <div className="fo-body-block">
            <p className="fo-desc">{activeFeature.body}</p>
            <p className="fo-desc">{activeFeature.role}</p>
            <p className="fo-desc">{activeFeature.importance}</p>
          </div>

          <div className="fo-links">
            <a href="#" className="fo-link" onClick={(e) => { e.preventDefault(); toast('Opening Clinical Case Study PDF...', 'info'); }}>CLINICAL_CASE_STUDY</a>
            <a href="#" className="fo-link" onClick={(e) => { e.preventDefault(); toast('Loading Protocol Guidelines...', 'info'); }}>PROTOCOL_LINK</a>
            <div className="fo-close-hint">&lt;- SCROLL TO CLOSE</div>
          </div>
          
          <button className="fo-ask-btn" onClick={() => toast('Initializing system query interface...', 'info')}>ASK SYSTEM ABOUT THIS...</button>
        </div>

        {/* Right Side: Chamfered Video Portal */}
        <div className="fo-video-col">
          <div className="fo-video-wrapper">
            <video 
              src={activeFeature.videoSrc} 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="fo-video" 
            />
            {/* Subtle glassmorphism overlay on video to give it that "inside the card" feel */}
            <div className="fo-video-glass"></div>
          </div>
        </div>

      </div>
    </div>
  );
}
