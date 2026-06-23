import React from 'react';
import { Link } from 'react-router-dom';

export default function LandingNav() {
  return (
    <nav className="landing-nav" aria-label="Landing navigation">
      <Link to="/" className="landing-wordmark" data-cursor="expand">
        <span className="landing-wordmark__mark" />
        <span>Silent Sense</span>
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
