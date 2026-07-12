import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { RoundedBox } from '@react-three/drei';
import * as THREE from 'three';

function CardGroup({ card, index, maxIndex, totalCards, onCardClick }) {
  const groupRef = useRef();
  const materialRef = useRef();
  const videoMaterialRef = useRef();

  const [videoTexture, setVideoTexture] = useState(null);
  const [videoEl, setVideoEl] = useState(null);

  useEffect(() => {
    if (card.videoSrc) {
      const video = document.createElement('video');
      video.src = card.videoSrc;
      video.crossOrigin = 'Anonymous';
      video.loop = true;
      video.muted = true;
      video.playsInline = true;
      // Preload all videos so they are instantly ready when scrolled into view
      video.preload = 'auto';
      // Only autoplay the first one to guarantee initial display
      if (index === 0) {
        video.autoplay = true;
      }
      video.load(); 
      
      const texture = new THREE.VideoTexture(video);
      texture.minFilter = THREE.LinearFilter;
      texture.magFilter = THREE.LinearFilter;
      texture.generateMipmaps = false;
      texture.colorSpace = THREE.SRGBColorSpace;

      setVideoTexture(texture);
      setVideoEl(video);

      return () => {
        video.pause();
        video.removeAttribute('src');
        video.load();
        texture.dispose();
      };
    }
  }, [card.videoSrc]);

  useFrame((state) => {
    if (!groupRef.current) return;
    
    // STRICTLY native window scroll-driven rotation
    const scrollY = window.scrollY;
    const vh = window.innerHeight;
    
    // Hero section is exactly 100vh.
    const startScroll = vh;
    const cardScroll = Math.max(0, scrollY - startScroll);
    
    // Each card takes exactly 100vh to fully rotate through, syncing perfectly with the 100vh spacer divs
    const scrollProgress = cardScroll / vh;
    
    const delta = index - scrollProgress;
    
    // Orbit center is aligned with the spine (z = -0.72)
    const angleStep = Math.PI / 4.5; // ~40 degrees separation
    const angle = delta * angleStep;
    const radius = 1.5; // Slightly wider radius for larger cards
    
    const x = Math.sin(angle) * radius;
    const z = Math.cos(angle) * radius;
    // Tighter vertical stacking so the second card starts at the middle of its precursor
    const y = -delta * 0.25; 
    
    groupRef.current.position.set(x, y, z);
    // Face outward from the cylinder center perfectly
    groupRef.current.rotation.y = angle;
    // Slight tilt for dynamism
    groupRef.current.rotation.z = delta * -0.04;
    
    const distance = Math.min(Math.abs(delta), maxIndex);
    
    // Adjusted scale to prevent the cards from becoming overwhelmingly large
    const baseScale = 0.60; 
    
    // Smooth scaling so side cards recede slightly but remain visible
    const scale = baseScale * Math.max(0.7, 1 - distance * 0.1);
    groupRef.current.scale.set(scale, scale, scale);

    if (materialRef.current) {
      // Fade out cards that are far away
      const opacity = Math.max(0.1, 1 - distance * 0.25);
      materialRef.current.opacity = opacity;
      materialRef.current.transparent = true;
    }

    // Video Playback & Fading Logic
    if (videoEl && videoMaterialRef.current) {
      // Play and fade in earlier so cards never look empty when rotating in
      if (distance < 0.75) {
        if (videoEl.paused && !videoEl.playAttempted) {
          videoEl.playAttempted = true;
          const playPromise = videoEl.play();
          if (playPromise !== undefined) {
            playPromise.then(() => {
              videoEl.playAttempted = false;
            }).catch(() => {
              videoEl.playAttempted = false;
            });
          }
        }
        // Fade in 5x faster (0.25) so it's instantly visible
        videoMaterialRef.current.opacity = THREE.MathUtils.lerp(videoMaterialRef.current.opacity, 0.85, 0.25);
      } else {
        // Pause and fade out if the card scrolls away
        if (!videoEl.paused) videoEl.pause();
        // Slowed down fade-out (changed from 0.1 to 0.02)
        videoMaterialRef.current.opacity = THREE.MathUtils.lerp(videoMaterialRef.current.opacity, 0.0, 0.02);
      }
    }
  });

  const handlePointerOver = () => {
    document.body.style.cursor = 'pointer';
  };

  const handlePointerOut = () => {
    document.body.style.cursor = 'none';
  };

  const handleClick = (e) => {
    e.stopPropagation();
    if (onCardClick) onCardClick(card);
  };

  return (
    // Align the entire carousel center exactly with the Spine's position (z = -0.72)
    <group 
      ref={groupRef} 
      position={[0, 0.05, -0.72]}
      onClick={handleClick}
      onPointerOver={handlePointerOver}
      onPointerOut={handlePointerOut}
    >
      {/* 3D Glass Card Base (Optimized for performance) */}
      <RoundedBox args={[1.35, 0.9, 0.02]} radius={0.04} smoothness={2}>
        <meshPhysicalMaterial
          ref={materialRef}
          color="#ffffff"
          metalness={0.1}
          roughness={0.12}
          transparent={true} // Replaced heavy transmission with lightweight transparency
          opacity={0.4}
          envMapIntensity={1.0}
        />
      </RoundedBox>

      {/* Video Projection Layer - Expanded to leave razor-thin glass edges */}
      {videoTexture && (
        <mesh position={[0, 0, 0.011]}>
          <planeGeometry args={[1.33, 0.88]} />
          <meshBasicMaterial 
            ref={videoMaterialRef} 
            map={videoTexture} 
            transparent 
            opacity={0} 
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      )}
    </group>
  );
}

export default function HelixCards({ cards, onCardClick }) {
  if (!cards || cards.length === 0) return null;
  const maxIndex = Math.max(cards.length - 1, 1);
  return (
    <group position={[0, 0.05, -0.45]}>
      {cards.map((card, index) => (
        <CardGroup 
          key={card.title} 
          card={card} 
          index={index} 
          maxIndex={maxIndex} 
          totalCards={cards.length} 
          onCardClick={onCardClick}
        />
      ))}
    </group>
  );
}
