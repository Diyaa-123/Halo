import React from 'react';
import '../../styles/landing.css';

export default function FooterSection() {
  return (
    <footer className="footer-section">
      <div className="footer-content">
        <div className="footer-brand">
          <h2 className="footer-logo">SilentSense</h2>
          <p className="footer-tagline">Passive WiFi CSI Cognitive Health Monitoring</p>
        </div>
        
        <div className="footer-links-container">
          <div className="footer-column">
            <h4>Platform</h4>
            <ul>
              <li><a href="/login">Clinical Login</a></li>
              <li><a href="/mission">Our Mission</a></li>
              <li><a href="/technology">Technology</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Contact</h4>
            <ul>
              <li><a href="#">Support</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Partnerships</a></li>
            </ul>
          </div>
          <div className="footer-column">
            <h4>Legal</h4>
            <ul>
              <li><a href="#">Privacy Policy</a></li>
              <li><a href="#">Terms of Service</a></li>
              <li><a href="#">HIPAA Compliance</a></li>
            </ul>
          </div>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; {new Date().getFullYear()} Team Goal Diggers. All rights reserved.</p>
      </div>
    </footer>
  );
}
