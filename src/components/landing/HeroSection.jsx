import React from 'react';
import '../../styles/landing.css';

export default function HeroSection() {
  return (
    <section className="hero-section">
      <div className="hero-content-wrapper">
        <div className="hero-badge">Clinical Grade Monitoring</div>
        <h1 className="hero-headline">
          Ambient Health Intelligence.<br/>
          <span className="hero-highlight">Perfected.</span>
        </h1>
        
        <div className="hero-text-grid">
          <div className="hero-text-column">
            <h3 className="column-title">The Attribution Gap</h3>
            <p className="column-body">
              Passive sensors fail in multi-occupant environments, blending individual health trends into chaotic noise. Wearables are routinely discarded. Cameras violate personal privacy. The result is a broken cycle of unreliable data and compromised ambient care.
            </p>
          </div>
          <div className="hero-text-column">
            <h3 className="column-title">The SilentSense Engine</h3>
            <p className="column-body">
              We deploy a proprietary four-pillar attribution matrix—fusing spatial topography, temporal heuristics, biometric signatures, and contextual priors. This intelligent engine isolates target individuals with clinical precision, delivering zero-friction monitoring without cameras or wearables.
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
