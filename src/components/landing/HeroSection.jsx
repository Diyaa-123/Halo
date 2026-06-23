import React from 'react';
import '../../styles/landing.css';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content-wrapper">
        <div className="hero-badge">Clinical Grade Monitoring</div>
        <h1 className="hero-headline">
          Ambient Health Monitoring.<br/>
          <span className="hero-highlight">Attributed.</span>
        </h1>
        
        <div className="hero-text-grid">
          <div className="hero-text-column">
            <h3 className="column-title">The Problem</h3>
            <p className="column-body">
              Existing passive WiFi products operate at the household level. They detect that something changed in the home, but cannot attribute that change to a specific person. In any home with more than one occupant, this makes individual health-trend tracking unreliable. Wearables are forgotten. Cameras are rejected.
            </p>
          </div>
          <div className="hero-text-column">
            <h3 className="column-title">Our Framework</h3>
            <p className="column-body">
              SilentSense solves the multi-person attribution gap by combining four independent evidence sources: spatial containment, temporal scheduling, biometric signature matching, and behavioural context priors. This allows us to selectively monitor a target individual without requiring signal separation or invasive hardware.
            </p>
          </div>
        </div>
      </div>
      
      <div className="scroll-indicator">
        <div className="mouse">
          <div className="wheel"></div>
        </div>
        <span className="scroll-text">Scroll to explore the platform</span>
      </div>
    </section>
  );
}
