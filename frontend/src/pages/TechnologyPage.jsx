import React from 'react';
import { Link } from 'react-router-dom';
import LandingNav from '../components/landing/LandingNav';
import CustomCursor from '../components/landing/CustomCursor';
import '../styles/landing.css';

export default function TechnologyPage() {
  return (
    <div className="landing-page" style={{ overflowY: 'auto', height: '100vh', scrollBehavior: 'smooth' }}>
      <CustomCursor />
      <LandingNav />
      
      <main style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '900px', margin: '0 auto', paddingInline: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--on-surface)', marginBottom: '24px' }}>
            The Clinical Intelligence Stack
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#475569', lineHeight: '1.6', maxWidth: '700px', margin: '0 auto' }}>
            Silent Sense transforms standard Wi-Fi and RF signals into a high-fidelity clinical monitoring matrix. Here is how our architecture works.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '32px' }}>
          
          <div className="helix-card" style={{ width: '100%', minHeight: 'auto' }}>
            <div style={{ color: '#0ea5e9', fontSize: '2rem', marginBottom: '16px', fontWeight: 'bold' }}>01</div>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '16px' }}>Wi-Fi Sensing Matrix</h2>
            <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.05rem' }}>
              By analyzing the perturbations in ambient Wi-Fi signals caused by human bodies, our Edge modules detect micro-movements including chest displacement (respiration) and cardiac mechanical cycles (heart rate) with clinical accuracy.
            </p>
          </div>

          <div className="helix-card" style={{ width: '100%', minHeight: 'auto' }}>
            <div style={{ color: '#0ea5e9', fontSize: '2rem', marginBottom: '16px', fontWeight: 'bold' }}>02</div>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '16px' }}>4-Pillar Engine</h2>
            <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Multi-person environments are solved through our attribution engine, correlating:
              <ul style={{ paddingLeft: '20px', marginTop: '12px' }}>
                <li>Identity (Gait Signatures)</li>
                <li>Location (Spatial Mapping)</li>
                <li>Behavior (Activity Classification)</li>
                <li>Time (Temporal Sequencing)</li>
              </ul>
            </p>
          </div>

          <div className="helix-card" style={{ width: '100%', minHeight: 'auto' }}>
            <div style={{ color: '#0ea5e9', fontSize: '2rem', marginBottom: '16px', fontWeight: 'bold' }}>03</div>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '16px' }}>Gait & Mobility Mapping</h2>
            <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Continuous tracking of walking speed, stride length asymmetry, and hesitation signatures allows the system to calculate the Timed Up and Go (TUG) equivalent passively, predicting fall risk weeks before an incident occurs.
            </p>
          </div>

          <div className="helix-card" style={{ width: '100%', minHeight: 'auto' }}>
            <div style={{ color: '#0ea5e9', fontSize: '2rem', marginBottom: '16px', fontWeight: 'bold' }}>04</div>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '16px' }}>Sleep Architecture</h2>
            <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.05rem' }}>
              Without any chest straps or mattresses sensors, Silent Sense extracts Sleep Regularity Index (SRI), apnea risk profiles, and nocturnal restlessness using non-line-of-sight RF wave reflection.
            </p>
          </div>

        </div>

        <div style={{ marginTop: '80px', textAlign: 'center' }}>
          <Link to="/login" style={{ 
            display: 'inline-block', 
            padding: '16px 32px', 
            backgroundColor: '#0ea5e9', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}>
            Enter Dashboard
          </Link>
        </div>
      </main>
    </div>
  );
}
