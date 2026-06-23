import React from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import SpineModel from './SpineModel';
import HelixCards from './HelixCards';
import ParticleField from './ParticleField';

function CameraRig() {
  const { camera } = useThree();

  useFrame(() => {
    const targetX = 0;
    
    const heroHeight = window.innerHeight;
    const heroProgress = Math.min(1, Math.max(0, window.scrollY / heroHeight));
    
    // When heroProgress is 0 (at top), targetY is 4.0 (camera is high, pushing spine off-screen bottom).
    // When heroProgress is 1 (past hero), targetY is 0 (camera is centered).
    const targetY = (1 - heroProgress) * 4.0;
    
    const maxCardsScroll = Math.max(1, document.body.scrollHeight - window.innerHeight - heroHeight);
    const activeCardsScroll = Math.max(0, window.scrollY - heroHeight);
    const scrollProgress = Math.min(1, activeCardsScroll / maxCardsScroll);
    
    const targetZ = 2.5 + Math.sin(scrollProgress * Math.PI) * 0.28;

    // Direct assignment to sync perfectly with Lenis smooth scrolling (prevents double-lerping lag)
    camera.position.x = targetX;
    camera.position.y = targetY;
    camera.position.z = targetZ;
    
    // Ensure the camera looks perfectly straight ahead relative to its height
    camera.lookAt(new THREE.Vector3(0, camera.position.y, -1.45));
  });

  return null;
}

function LightColumns() {
  return (
    <group>
      <mesh position={[-4.4, 0.3, -4.2]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[0.018, 9, 0.018]} />
        <meshBasicMaterial color="#39f5ff" transparent opacity={0.32} />
      </mesh>
      <mesh position={[4.1, -0.2, -4.8]} rotation={[0, -0.18, 0]}>
        <boxGeometry args={[0.018, 8, 0.018]} />
        <meshBasicMaterial color="#7c5cff" transparent opacity={0.26} />
      </mesh>
      <mesh position={[0, -4.6, -3.2]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.4, 4.9, 96]} />
        <meshBasicMaterial color="#0dd8ff" transparent opacity={0.08} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

export default function ThreeScene({ cards, onCardClick }) {
  if (!cards || cards.length === 0) {
    console.warn('ThreeScene: No cards provided');
    return null;
  }

  return (
    <div className="canvas-container">
      <Canvas 
        camera={{ position: [0, 0, 2.5], fov: 45, near: 0.1, far: 100 }}
        dpr={[1, 1.5]} // CRITICAL FIX: Clamps pixel ratio to prevent 4k rendering lag on Retina displays
        gl={{ antialias: false, alpha: true, powerPreference: "high-performance" }}
      >
        <scene background={null} />

        <ambientLight intensity={0.18} color="#9eefff" />
        <directionalLight position={[3.8, 5.5, 4.4]} intensity={2.4} color="#d9fbff" />
        <directionalLight position={[-4.8, 1.7, -2.8]} intensity={2.2} color="#755dff" />
        <pointLight position={[0.1, 0.2, 2.4]} intensity={2.7} color="#45f4ff" distance={7.5} />
        <pointLight position={[-2.8, -2.2, -1.2]} intensity={1.5} color="#a256ff" distance={8} />

        <CameraRig />
        <Environment preset="night" />
        <LightColumns />
        <ParticleField />
        <SpineModel />
        <HelixCards cards={cards} onCardClick={onCardClick} />
      </Canvas>
    </div>
  );
}
