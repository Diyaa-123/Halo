import React, { useState, useEffect } from 'react';
import { ReactLenis, useLenis } from '@studio-freight/react-lenis';
import HeroSection from '../components/landing/HeroSection';
import ThreeScene from '../components/landing/ThreeScene';
import FooterSection from '../components/landing/FooterSection';
import LandingNav from '../components/landing/LandingNav';
import CustomCursor from '../components/landing/CustomCursor';
import LoadingScreen from '../components/landing/LoadingScreen';
import FeatureOverlay from '../components/landing/FeatureOverlay';
import { landingCards } from '../data/landingContent';
import '../styles/landing.css';

export default function LandingPage() {
  const [loaded, setLoaded] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const lenis = useLenis();

  // Prevent background scrolling and handle scroll-to-return when overlay is active
  useEffect(() => {
    if (selectedFeature) {
      if (lenis) lenis.stop();
      
      const handleScrollToClose = () => {
        setSelectedFeature(null);
      };
      
      const timer = setTimeout(() => {
        window.addEventListener('wheel', handleScrollToClose, { passive: true });
        window.addEventListener('touchmove', handleScrollToClose, { passive: true });
      }, 500);
      
      return () => {
        clearTimeout(timer);
        window.removeEventListener('wheel', handleScrollToClose);
        window.removeEventListener('touchmove', handleScrollToClose);
      };
    } else {
      if (lenis) lenis.start();
    }
  }, [selectedFeature, lenis]);

  // Clean up global overflow styles
  // Clean up global overflow styles to allow WINDOW scrolling for Lenis
  useEffect(() => {
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.height = 'auto';
    document.body.style.overflow = 'auto';
    document.body.style.height = 'auto';
    const root = document.getElementById('root');
    const appNode = document.querySelector('.app');
    
    if (root) {
      root.style.overflow = 'visible';
      root.style.height = 'auto';
    }
    if (appNode) {
      appNode.style.overflow = 'visible';
      appNode.style.height = 'auto';
    }
    
    return () => {
      document.documentElement.style.overflow = '';
      document.documentElement.style.height = '100%';
      document.body.style.overflow = 'hidden';
      document.body.style.height = '100%';
      if (root) {
        root.style.overflow = 'hidden';
        root.style.height = '100vh';
      }
      if (appNode) {
        appNode.style.overflow = 'hidden';
        appNode.style.height = '100vh';
      }
    };
  }, []);

  return (
    <>
      {!loaded && <LoadingScreen onLoaded={() => setLoaded(true)} />}
      
      <FeatureOverlay feature={selectedFeature} />
      
      <ReactLenis root options={{ lerp: 0.05, smoothWheel: true }}>
        <div className="landing-page">
          <CustomCursor />
          <LandingNav />

          <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100vh', zIndex: 0, pointerEvents: 'auto' }}>
            <ThreeScene cards={landingCards} onCardClick={setSelectedFeature} />
          </div>

          <div style={{ position: 'relative', zIndex: 10, pointerEvents: 'none' }}>
            <div style={{ height: '100vh', pointerEvents: 'auto' }}>
              <HeroSection />
            </div>

            <div style={{ height: `${landingCards.length * 100}vh`, pointerEvents: 'none' }} />
            
            <div style={{ pointerEvents: 'auto', position: 'relative', zIndex: 20 }}>
              <FooterSection />
            </div>
          </div>
        </div>
      </ReactLenis>
    </>
  );
}
