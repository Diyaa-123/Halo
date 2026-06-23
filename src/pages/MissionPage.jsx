import React from 'react';
import { Link } from 'react-router-dom';
import LandingNav from '../components/landing/LandingNav';
import CustomCursor from '../components/landing/CustomCursor';
import '../styles/landing.css'; // Reuse landing theme

export default function MissionPage() {
  return (
    <div className="landing-page" style={{ overflowY: 'auto', height: '100vh', scrollBehavior: 'smooth' }}>
      <CustomCursor />
      <LandingNav />
      
      <main style={{ paddingTop: '120px', paddingBottom: '80px', maxWidth: '800px', margin: '0 auto', paddingInline: '24px' }}>
        <div style={{ textAlign: 'center', marginBottom: '64px' }}>
          <h1 style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--on-surface)', marginBottom: '24px' }}>
            Protecting independence without sacrificing dignity.
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#475569', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto' }}>
            The current standard of elder care relies heavily on wearables, cameras, and manual check-ins. We believe there is a better way to ensure safety.
          </p>
        </div>

        <section style={{ display: 'flex', flexDirection: 'column', gap: '48px' }}>
          <div className="helix-card" style={{ width: '100%', minHeight: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '16px' }}>The Wearable Problem</h2>
            <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.1rem' }}>
              Wearable devices require active compliance. They need to be charged, put on, and worn consistently. For individuals with dementia or cognitive decline, this compliance is fundamentally unreliable, leading to gaps in safety monitoring exactly when it is needed most.
            </p>
          </div>

          <div className="helix-card" style={{ width: '100%', minHeight: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '16px' }}>The Privacy Imperative</h2>
            <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.1rem' }}>
              Cameras in bedrooms and bathrooms are profound violations of privacy. Silent Sense replaces optical surveillance with ambient intelligence—using Wi-Fi and RF signals to map behavior and biometrics without ever capturing an image.
            </p>
          </div>

          <div className="helix-card" style={{ width: '100%', minHeight: 'auto' }}>
            <h2 style={{ fontSize: '1.5rem', color: '#0f172a', marginBottom: '16px' }}>Our Commitment</h2>
            <p style={{ color: '#334155', lineHeight: '1.6', fontSize: '1.1rem' }}>
              We build technology that lives in the walls, not on the wrist. By shifting the burden of sensing from the human to the environment, we empower families and clinicians to see risk before it becomes a crisis, while honoring the dignity of the patient.
            </p>
          </div>
        </section>

        <div style={{ marginTop: '80px', textAlign: 'center' }}>
          <Link to="/technology" style={{ 
            display: 'inline-block', 
            padding: '16px 32px', 
            backgroundColor: '#0ea5e9', 
            color: 'white', 
            textDecoration: 'none', 
            borderRadius: '8px', 
            fontWeight: 'bold',
            transition: 'background-color 0.2s'
          }}>
            Explore The Technology
          </Link>
        </div>
      </main>
    </div>
  );
}
