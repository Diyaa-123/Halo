import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingNav() {
  const handleLogoClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <nav className="landing-nav" aria-label="Landing navigation">
      <Link to="/" className="landing-wordmark" data-cursor="expand" onClick={handleLogoClick}>
        <img src="/assets/Logo/SilentSense Logo.jpeg" alt="SilentSense" className="nav-logo-image" />
      </Link>

      <div className="landing-nav-links">
        <Link to="/technology" className="landing-nav-link" data-cursor="expand">
          Technology
        </Link>
        <Link to="/mission" className="landing-nav-link" data-cursor="expand">
          Mission
        </Link>
        <Link to="/demo" className="landing-nav-link" data-cursor="expand">
          Demo
        </Link>
        <Link to="/login" className="landing-nav-link landing-nav-link--primary" data-cursor="expand">
          Login
        </Link>
      </div>
    </nav>
  );
}
